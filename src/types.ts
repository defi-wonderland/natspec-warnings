import {
  EnumDefinition,
  ErrorDefinition,
  EventDefinition,
  FunctionDefinition,
  ModifierDefinition,
  StructDefinition,
  VariableDeclaration,
} from 'solc-typed-ast';
import { Static, Type } from '@sinclair/typebox';

// NOTE: For params like `return` if its set to true we will only force it if the function does return something

export const tagSchema = Type.Object({
  tags: Type.Object({
    dev: Type.Boolean({ default: false }),
    notice: Type.Boolean({ default: true }),
    param: Type.Boolean({ default: true }),
  }),
});

export const functionSchema = Type.Object({
  tags: Type.Object({
    dev: Type.Boolean({ default: false }),
    notice: Type.Boolean({ default: true }),
    param: Type.Boolean({ default: true }),
    return: Type.Boolean({ default: true }),
  }),
});

export const functionConfigSchema = Type.Object({
  internal: functionSchema,

  external: functionSchema,

  public: functionSchema,

  private: functionSchema,
});

export const configSchema = Type.Object({
  include: Type.String(),
  exclude: Type.String({ default: '' }),
  root: Type.String({ default: './' }),
  functions: functionConfigSchema,
  events: tagSchema,
  errors: tagSchema,
  modifiers: tagSchema,
  structs: tagSchema,
  inheritdoc: Type.Boolean({ default: true }),
  constructorNatspec: Type.Boolean({ default: false }),
});

export type KeysForSupportedTags = 'events' | 'errors' | 'modifiers' | 'structs';
export type FunctionConfig = Static<typeof functionSchema>;
export type Config = Static<typeof configSchema>;
export type Functions = Static<typeof functionConfigSchema>;
export type Tags = Static<typeof tagSchema>;

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
  | FunctionDefinition
  | EnumDefinition
  | ErrorDefinition
  | EventDefinition
  | ModifierDefinition
  | VariableDeclaration
  | StructDefinition;

export interface IWarning {
  location: string;
  messages: string[];
}

export type HasVParameters = {
  vParameters: {
    vParameters: Array<{ name: string }>;
  };
};
