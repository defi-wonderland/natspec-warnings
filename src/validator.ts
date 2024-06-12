import {
  Config,
  FunctionConfig,
  Functions,
  HasVParameters,
  Natspec,
  NatspecDefinition,
  NodeToProcess,
  KeysForSupportedTags,
  Tags,
} from './types';
import { matchesFunctionKind, getElementFrequency, isKeyForSupportedTags } from './utils';
import {
  EnumDefinition,
  ErrorDefinition,
  EventDefinition,
  FunctionDefinition,
  ModifierDefinition,
  StructDefinition,
  VariableDeclaration,
  ContractDefinition,
} from 'solc-typed-ast';

/**
 * Validator class that validates the natspec of the nodes
 */
export class Validator {
  config: Config;

  /**
   * @param {Config} config - The configuration object
   */
  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Validates the natspec of the node
   * @param {NodeToProcess} node - The node to validate (Enum, Function etc.)
   * @param {Natspec} natspec - Parsed natspec of the node
   * @returns {string[]} - The list of alerts
   */
  validate(node: NodeToProcess, natspec: Natspec): string[] {
    // Ignore fallback and receive
    if (matchesFunctionKind(node, 'receive') || matchesFunctionKind(node, 'fallback')) {
      return [];
    }

    // There is inheritdoc, no other validation is needed
    if (natspec.inheritdoc) return [];

    // Inheritdoc is enforced but not present, returning an error
    if (this.config.inheritdoc && this.requiresInheritdoc(node)) return [`@inheritdoc is missing`];

    const natspecParams = natspec.params.map((p) => p.name);

    // Validate natspec for the constructor only if configured
    if (matchesFunctionKind(node, 'constructor')) {
      return this.config.functions?.constructor ? this.validateParameters(node as FunctionDefinition, natspecParams) : [];
    }

    // Inheritdoc is not enforced nor present, and there is no other documentation, returning error
    if (!natspec.tags.length) {
      let needsWarning = false;
      // If node is a function, check the user defined config
      if (node instanceof FunctionDefinition) {
        Object.keys(this.config.functions).forEach((key) => {
          Object.keys(this.config.functions[key as keyof Functions].tags).forEach((tag) => {
            if (this.config.functions[key as keyof Functions][tag as keyof FunctionConfig]) {
              needsWarning = true;
            }
          });
        });
      } else {
        // The other config rules use the same datatype so we can check them here
        Object.keys(this.config).forEach((key) => {
          if (isKeyForSupportedTags(key)) {
            const tagsConfig = this.config[key]?.tags;
            if (tagsConfig) {
              Object.values(tagsConfig).forEach((value) => {
                if (value) {
                  needsWarning = true;
                }
              });
            }
          }
        });
      }

      if (needsWarning) return [`Natspec is missing`];
    }

    // Validate the completeness of the documentation
    let alerts: string[] = [];
    let isDevTagForced: boolean;
    let isNoticeTagForced: boolean;

    if (node instanceof EnumDefinition) {
      // TODO: Process enums
    } else if (node instanceof ErrorDefinition) {
      isDevTagForced = this.config.errors.tags.dev;
      isNoticeTagForced = this.config.errors.tags.notice;

      alerts = [
        ...alerts,
        ...this.validateParameters(node, natspecParams, 'errors'),
        ...this.validateTags(isDevTagForced, isNoticeTagForced, natspec.tags),
      ];
    } else if (node instanceof EventDefinition) {
      isDevTagForced = this.config.events.tags.dev;
      isNoticeTagForced = this.config.events.tags.notice;

      alerts = [
        ...alerts,
        ...this.validateParameters(node, natspecParams, 'events'),
        ...this.validateTags(isDevTagForced, isNoticeTagForced, natspec.tags),
      ];
    } else if (node instanceof FunctionDefinition) {
      const natspecReturns = natspec.returns.map((p) => p.name);
      isDevTagForced = this.config.functions[node.visibility as keyof Functions]?.tags.dev;
      isNoticeTagForced = this.config.functions[node.visibility as keyof Functions]?.tags.notice;

      alerts = [
        ...alerts,
        ...this.validateParameters(node, natspecParams),
        ...this.validateReturnParameters(node, natspecReturns),
        ...this.validateTags(isDevTagForced, isNoticeTagForced, natspec.tags),
      ];
    } else if (node instanceof ModifierDefinition) {
      isDevTagForced = this.config.modifiers.tags.dev;
      isNoticeTagForced = this.config.modifiers.tags.notice;

      alerts = [
        ...alerts,
        ...this.validateParameters(node, natspecParams, 'modifiers'),
        ...this.validateTags(isDevTagForced, isNoticeTagForced, natspec.tags),
      ];
    } else if (node instanceof StructDefinition) {
      isDevTagForced = this.config.structs.tags.dev;
      isNoticeTagForced = this.config.structs.tags.notice;

      alerts = [...alerts, ...this.validateMembers(node, natspecParams), ...this.validateTags(isDevTagForced, isNoticeTagForced, natspec.tags)];
    } else if (node instanceof VariableDeclaration) {
      // Only the presence of a notice is validated
    }

    return alerts;
  }

  /**
   * Validates the natspec for parameters.
   * All defined parameters should have natspec.
   * @param {ErrorDefinition | FunctionDefinition | ModifierDefinition} node - The node to validate
   * @param {string[]} natspecParams - The list of parameters from the natspec
   * @returns {string[]} - The list of alerts
   */
  private validateParameters<T extends HasVParameters>(
    node: T,
    natspecParams: (string | undefined)[],
    key: KeysForSupportedTags | undefined = undefined
  ): string[] {
    let definedParameters = node.vParameters.vParameters.map((p) => p.name);
    let alerts: string[] = [];
    const counter = getElementFrequency(natspecParams);

    if (node instanceof FunctionDefinition) {
      if (!this.config.functions[node.visibility as keyof Functions]?.tags.param) {
        return [];
      }
    } else if (key !== undefined) {
      if (!this.config[key]?.tags.param) {
        return [];
      }
    }

    for (let paramName of definedParameters) {
      if (!natspecParams.includes(paramName)) {
        alerts.push(`@param ${paramName} is missing`);
      } else if (counter[paramName] > 1) {
        alerts.push(`@param ${paramName} is duplicated`);
      }
    }
    return alerts;
  }

  /**
   * Validates the natspec for members of a struct.
   * All members of a struct should have natspec.
   * @param {StructDefinition} node - The struct node
   * @param {string[]} natspecParams - The list of parameters from the natspec
   * @returns {string[]} - The list of alerts
   */
  private validateMembers(node: StructDefinition, natspecParams: (string | undefined)[]): string[] {
    if (!this.config.structs.tags.param) {
      return [];
    }

    let members = node.vMembers.map((p) => p.name);
    let alerts: string[] = [];
    const counter = getElementFrequency(natspecParams);

    for (let memberName of members) {
      if (!natspecParams.includes(memberName)) {
        alerts.push(`@param ${memberName} is missing`);
      } else if (counter[memberName] > 1) {
        alerts.push(`@param ${memberName} is duplicated`);
      }
    }

    return alerts;
  }

  /**
   * Validates the natspec for return parameters.
   * All returned parameters should have natspec
   * @param {FunctionDefinition} node - The function node
   * @param {(string | undefined)[]} natspecReturns - The list of `return` tags from the natspec
   * @returns {string[]} - The list of alerts
   */
  private validateReturnParameters(node: FunctionDefinition, natspecReturns: (string | undefined)[]): string[] {
    // If return tags are not enforced, return no warnings
    if (!this.config.functions[node.visibility as keyof Functions]?.tags.return) {
      return [];
    }

    let alerts: string[] = [];
    let functionReturns = node.vReturnParameters.vParameters.map((p) => p.name);

    // Make sure all defined returns have natspec
    for (let [paramIndex, paramName] of functionReturns.entries()) {
      if (paramIndex > natspecReturns.length - 1) {
        let message = paramName === '' ? `@return missing for unnamed return №${paramIndex + 1}` : `@return ${paramName} is missing`;
        alerts.push(message);
      } else if (natspecReturns[paramIndex] !== paramName && paramName !== '') {
        let message = `@return ${paramName} is missing`;
        alerts.push(message);
      }
    }

    return alerts;
  }

  private validateTags(isDevTagForced: boolean, isNoticeTagForced: boolean, natspecTags: NatspecDefinition[]): string[] {
    // If both are disabled no warnings should emit so we dont need to check anything
    if (!isDevTagForced && !isNoticeTagForced) {
      return [];
    }

    let alerts: string[] = [];

    let devCounter = 0;
    let noticeCounter = 0;

    for (const tag of natspecTags) {
      if (tag.name === 'dev') {
        devCounter++;
      } else if (tag.name === 'notice') {
        noticeCounter++;
      }
    }

    // Needs a dev tag
    // More then one dev tag is ok
    if (isDevTagForced && devCounter === 0) {
      alerts.push(`@dev is missing`);
    }

    if (isNoticeTagForced) {
      // Needs one notice tag
      if (noticeCounter === 0) {
        alerts.push(`@notice is missing`);
      }

      // Cant have more then one notice tag
      if (noticeCounter > 1) {
        alerts.push(`@notice is duplicated`);
      }
    }

    return alerts;
  }

  /**
   * Checks if the node requires inheritdoc
   * @param {NodeToProcess} node - The node to process
   * @returns {boolean} - True if the node requires inheritdoc
   */
  private requiresInheritdoc(node: NodeToProcess): boolean {
    let _requiresInheritdoc: boolean = false;

    // External or public function
    _requiresInheritdoc ||=
      node instanceof FunctionDefinition && (node.visibility === 'external' || node.visibility === 'public') && !node.isConstructor;

    // Overridden internal functions
    _requiresInheritdoc ||= node instanceof FunctionDefinition && node.visibility === 'internal' && !!node.vOverrideSpecifier;

    // Public variable
    _requiresInheritdoc ||= node instanceof VariableDeclaration && node.visibility === 'public';

    // The node is in a contract
    _requiresInheritdoc &&= node.parent instanceof ContractDefinition && node.parent.kind === 'contract';

    return _requiresInheritdoc;
  }
}
