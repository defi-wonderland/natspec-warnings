import { ASTKind, ASTReader, SourceUnit, compileSol } from 'solc-typed-ast';

export async function getFileCompiledSource(filePath: string): Promise<SourceUnit> {
  const compiledFile = await compileSol(filePath, 'auto');
  return new ASTReader().read(compiledFile.data, ASTKind.Any, compiledFile.files)[0];
}

export function expectWarning(warnArray: string[], expectedWarn: string, numberOfWarnings: number) {
  expect(warnArray).toContain(expectedWarn);
  expect(warnArray.filter((x) => x == expectedWarn).length).toBe(numberOfWarnings);
}