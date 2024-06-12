import { ASTKind, ASTReader, SourceUnit, compileSol } from 'solc-typed-ast';
import { Functions, NodeToProcess } from '../../src/types';

export async function getFileCompiledSource(filePath: string): Promise<SourceUnit> {
  const compiledFile = await compileSol(filePath, 'auto');
  return new ASTReader().read(compiledFile.data, ASTKind.Any, compiledFile.files)[0];
}

export function expectWarning(warnArray: string[], expectedWarn: string, numberOfWarnings: number) {
  expect(warnArray).toContain(expectedWarn);
  expect(warnArray.filter((x) => x == expectedWarn).length).toBe(numberOfWarnings);
}

export function findNode(nodes: readonly NodeToProcess[], name: string): any {
  return nodes.find((x) => x.name === name);
}

export const defaultFunctions: Functions = {
  internal: { tags: { dev: false, notice: true, return: true, param: true } },
  external: { tags: { dev: false, notice: true, return: true, param: true } },
  public: { tags: { dev: false, notice: true, return: true, param: true } },
  private: { tags: { dev: false, notice: true, return: true, param: true } },
};

export const defaultTags = { tags: { dev: false, notice: true, param: true } };

export const defaultConfig = {
  include: '',
  exclude: '',
  root: './',
  functions: defaultFunctions,
  events: defaultTags,
  errors: defaultTags,
  modifiers: defaultTags,
  structs: defaultTags,
  inheritdoc: false,
  constructorNatspec: false,
};
