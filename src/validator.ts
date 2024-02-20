import { Config, Natspec, NodeToProcess } from './types';
import { matchesFunctionKind, getElementFrequency } from './utils';
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

export class Validator {
  config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  validate(node: NodeToProcess, natspec: Natspec): string[] {
    // Process contract-level natspec
    if (node instanceof ContractDefinition) {
      return this.config.contractNatspec ? this.validateContractNatspec(natspec) : [];
    }

    // Ignore fallback and receive
    if (matchesFunctionKind(node, 'receive') || matchesFunctionKind(node, 'fallback')) {
      return [];
    }

    // There is inheritdoc, no other validation is needed
    if (natspec.inheritdoc) return [];

    // Inheritdoc is enforced but not present, returning an error
    if (this.config.enforceInheritdoc && this.requiresInheritdoc(node)) return [`@inheritdoc is missing`];

    const natspecParams = natspec.params.map((p) => p.name);

    // Validate natspec for the constructor only if configured
    if (matchesFunctionKind(node, 'constructor')) {
      return this.config.constructorNatspec ? this.validateParameters(node as FunctionDefinition, natspecParams) : [];
    }

    // Inheritdoc is not enforced nor present, and there is no other documentation, returning error
    if (!natspec.tags.length) return [`Natspec is missing`];

    // Validate the completeness of the documentation
    let alerts: string[] = [];

    if (node instanceof EnumDefinition) {
      // TODO: Process enums
    } else if (node instanceof ErrorDefinition) {
      alerts = [...alerts, ...this.validateParameters(node, natspecParams)];
    } else if (node instanceof EventDefinition) {
      alerts = [...alerts, ...this.validateParameters(node, natspecParams)];
    } else if (node instanceof FunctionDefinition) {
      const natspecReturns = natspec.returns.map((p) => p.name);
      alerts = [...alerts, ...this.validateParameters(node, natspecParams), ...this.validateReturnParameters(node, natspecReturns)];
    } else if (node instanceof ModifierDefinition) {
      alerts = [...alerts, ...this.validateParameters(node, natspecParams)];
    } else if (node instanceof StructDefinition) {
      alerts = [...alerts, ...this.validateMembers(node, natspecParams)];
    } else if (node instanceof VariableDeclaration) {
      // Only the presence of a notice is validated
    }

    return alerts;
  }

  // All defined parameters should have natspec
  private validateParameters(node: ErrorDefinition | FunctionDefinition | ModifierDefinition, natspecParams: (string | undefined)[]): string[] {
    let definedParameters = node.vParameters.vParameters.map((p) => p.name);
    let alerts: string[] = [];
    const counter = getElementFrequency(natspecParams);

    for (let paramName of definedParameters) {
      if (!natspecParams.includes(paramName)) {
        alerts.push(`@param ${paramName} is missing`);
      } else if (counter[paramName] > 1) {
        alerts.push(`@param ${paramName} is duplicated`);
      }
    }
    return alerts;
  }

  // All members of a struct should have natspec
  private validateMembers(node: StructDefinition, natspecParams: (string | undefined)[]): string[] {
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

  // All returned parameters should have natspec
  private validateReturnParameters(node: FunctionDefinition, natspecReturns: (string | undefined)[]): string[] {
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

  /**
   * Validate the natspec of a contract
   * @param {Natspec} natspec - The natspec of the contract
   * @returns {string[]} - The list of alerts
   */
  private validateContractNatspec(natspec: Natspec): string[] {
    return natspec.tags.some((t) => t.name === 'notice') ? [] : [`@notice is missing`];
  }
}
