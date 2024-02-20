import {
  ContractDefinition,
  EnumDefinition,
  ErrorDefinition,
  EventDefinition,
  FunctionDefinition,
  ModifierDefinition,
  StructDefinition,
  VariableDeclaration,
} from 'solc-typed-ast';

export interface Config {
  include: string; // Required: Glob pattern of files to process.
  exclude: string; // Optional: Glob pattern of files to exclude.
  root: string; // Optional: Project root directory.
  enforceInheritdoc: boolean; // Optional: True if all external and public functions should have @inheritdoc.
  constructorNatspec: boolean; // Optional: True if the constructor should have natspec.
  contractNatspec: boolean; // Optional: True if the contract should have natspec.
}

export interface NatspecDefinition {
  name?: string;
  content: string;
}

export interface Natspec {
  inheritdoc?: NatspecDefinition;
  tags: NatspecDefinition[];
  params: NatspecDefinition[];
  returns: NatspecDefinition[];
}

export interface ASTNodeRawDocumentation {
  id: number;
  nodeType: string;
  src: string;
  text: string;
}

export interface ASTNodeRaw {
  name: string;
  kind: string;
  documentation?: ASTNodeRawDocumentation;
}

export type NodeToProcess =
  | ContractDefinition
  | FunctionDefinition
  | EnumDefinition
  | ErrorDefinition
  | EventDefinition
  | ModifierDefinition
  | VariableDeclaration
  | StructDefinition;
