import fs from 'fs/promises';
import { Validator } from './validator';
import { NodeToProcess } from './types';
import { getLineNumberFromSrc, parseNodeNatspec } from './utils';
import { SourceUnit, FunctionDefinition, ContractDefinition } from 'solc-typed-ast';

export interface IWarning {
  location: string;
  messages: string[];
}

export class Processor {
  constructor(private validator: Validator) {}

  /**
   * Goes through all functions, modifiers, state variables, structs, enums, errors and events
   * of the source files and validates their natspec
   * @param {SourceUnit[]} sourceUnits - The list of source files
   * @returns {Promise<IWarning[]>} - The list of resulting warnings
   */
  async processSources(sourceUnits: SourceUnit[]): Promise<IWarning[]> {
    const warnings: IWarning[] = [];

    // Iterate over each source file
    for (const sourceUnit of sourceUnits) {
      // Read the file content
      const fileContent = await fs.readFile(sourceUnit.absolutePath, 'utf8');

      // Iterate over each contract in the source file
      for (const contract of sourceUnit.vContracts) {
        // Iterate over each node of the contract
        const nodes = this.selectEligibleNodes(contract);
        for (const node of nodes) {
          // Find warning messages of the natspec of the node
          const messages = this.validateNatspec(node);
          if (messages.length) {
            // Add the warning messages to the list together with the natspec location
            warnings.push({
              location: this.formatLocation(sourceUnit.absolutePath, fileContent, contract.name, node),
              messages,
            });
          }
        }
      }
    }

    return warnings;
  }

  /**
   * Selects the nodes that are eligible for natspec validation:
   * Enums, Errors, Events, Functions, Modifiers, State Variables, Structs
   * @param {ContractDefinition} contract - The contract source
   * @returns {NodeToProcess[]} - The list of nodes to process
   */
  selectEligibleNodes(contract: ContractDefinition): NodeToProcess[] {
    return [
      ...contract.vEnums,
      ...contract.vErrors,
      ...contract.vEvents,
      ...contract.vFunctions,
      ...contract.vModifiers,
      ...contract.vStateVariables,
      ...contract.vStructs,
    ];
  }

  /**
   * Validates the natspec of the node
   * @param {NodeToProcess} node - The node to process
   * @returns {string[]} - The list of warning messages
   */
  validateNatspec(node: NodeToProcess): string[] {
    const nodeNatspec = parseNodeNatspec(node);
    return this.validator.validate(node, nodeNatspec);
  }

  /**
   * Generates a warning location string
   * @param {string} filePath - Path of the file with the warning
   * @param {string} fileContent - The content of the file
   * @param {string} contractName - The name of the contract
   * @param {NodeToProcess} node - The node with the warning
   * @returns {string} - The formatted location
   */
  formatLocation(filePath: string, fileContent: string, contractName: string, node: NodeToProcess): string {
    // the constructor function definition does not have a name, but it has kind: 'constructor'
    const nodeName = node instanceof FunctionDefinition ? node.name || node.kind : node.name;
    const line: number = getLineNumberFromSrc(fileContent, node.src);
    return `${filePath}:${line}\n${contractName}:${nodeName}`;
  }
}
