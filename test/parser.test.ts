import { ContractDefinition } from 'solc-typed-ast';
import { parseNodeNatspec } from '../src/utils';
import { getFileCompiledSource, findNode } from './utils/helpers';
import { mockNatspec } from './utils/mocks';

describe('Parser', () => {
  let contract: ContractDefinition;

  describe('Contract', () => {
    beforeAll(async () => {
      const compileResult = await getFileCompiledSource('test/contracts/ParserTest.sol');
      contract = compileResult.vContracts.find(({ name }) => name === 'ParserTest')!;
    });

    it('should parse the inheritdoc tag', async () => {
      const node = findNode(contract.vFunctions, 'viewFunctionNoParams');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          inheritdoc: { content: 'IParserTest' },
          tags: [
            {
              name: 'dev',
              content: 'Dev comment for the function',
            },
          ],
        })
      );
    });

    it('should parse constant', async () => {
      const node = findNode(contract.vStateVariables, 'SOME_CONSTANT');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          inheritdoc: {
            content: 'IParserTest',
          },
        })
      );
    });

    it('should parse variable', async () => {
      const node = findNode(contract.vStateVariables, 'someVariable');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          inheritdoc: {
            content: 'IParserTest',
          },
        })
      );
    });

    it('should parse modifier', async () => {
      const node = findNode(contract.vModifiers, 'someModifier');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [
            {
              name: 'notice',
              content: 'The description of the modifier',
            },
          ],
          params: [
            {
              name: '_param1',
              content: 'The only parameter',
            },
          ],
        })
      );
    });

    it('should parse external function', async () => {
      const node = findNode(contract.vFunctions, 'viewFunctionNoParams');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          inheritdoc: {
            content: 'IParserTest',
          },
          tags: [
            {
              name: 'dev',
              content: 'Dev comment for the function',
            },
          ],
        })
      );
    });

    it('should parse private function', async () => {
      const node = findNode(contract.vFunctions, '_viewPrivate');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [
            {
              name: 'notice',
              content: 'Some private stuff',
            },
            {
              name: 'dev',
              content: 'Dev comment for the private function',
            },
          ],
          params: [
            {
              name: '_paramName',
              content: 'The parameter name',
            },
          ],
          returns: [
            {
              name: '_returned',
              content: 'The returned value',
            },
          ],
        })
      );
    });

    it('should parse multiline descriptions', async () => {
      const node = findNode(contract.vFunctions, '_viewMultiline');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [
            {
              name: 'notice',
              content: 'Some internal stuff\n         Separate line\n         Third one',
            },
          ],
        })
      );
    });

    it('should parse multiple of the same tag', async () => {
      const node = findNode(contract.vFunctions, '_viewDuplicateTag');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [
            {
              name: 'notice',
              content: 'Some internal stuff',
            },
            {
              name: 'notice',
              content: 'Separate line',
            },
          ],
        })
      );
    });
  });

  describe('Interface', () => {
    beforeAll(async () => {
      const compileResult = await getFileCompiledSource('test/contracts/ParserTest.sol');
      contract = compileResult.vContracts.find(({ name }) => name === 'IParserTest')!;
    });

    it('should parse error', async () => {
      const node = findNode(contract.vErrors, 'SimpleError');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [
            {
              name: 'notice',
              content: 'Thrown whenever something goes wrong',
            },
          ],
        })
      );
    });

    it('should parse event', async () => {
      const node = findNode(contract.vEvents, 'SimpleEvent');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [
            {
              name: 'notice',
              content: 'Emitted whenever something happens',
            },
          ],
        })
      );
    });

    it('should parse struct', async () => {
      const node = findNode(contract.vStructs, 'SimplestStruct');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [
            {
              name: 'notice',
              content: 'A struct holding 2 variables of type uint256',
            },
            {
              content: 'a  The first variable',
              name: 'member',
            },
            {
              content: 'b  The second variable',
              name: 'member',
            },
            {
              content: 'This is definitely a struct',
              name: 'dev',
            },
          ],
        })
      );
    });

    it('should parse external function without parameters', async () => {
      const node = findNode(contract.vFunctions, 'viewFunctionNoParams');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [
            {
              name: 'notice',
              content: 'View function with no parameters',
            },
            {
              name: 'dev',
              content: 'Natspec for the return value is missing',
            },
          ],
          returns: [
            {
              name: 'The',
              content: 'returned value',
            },
          ],
        })
      );
    });

    it('should parse external function with parameters', async () => {
      const node = findNode(contract.vFunctions, 'viewFunctionWithParams');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [
            {
              name: 'notice',
              content: 'A function with different style of natspec',
            },
          ],
          params: [
            {
              name: '_param1',
              content: 'The first parameter',
            },
            {
              name: '_param2',
              content: 'The second parameter',
            },
          ],
          returns: [
            {
              name: 'The',
              content: 'returned value',
            },
          ],
        })
      );
    });
  });

  describe('Contract with invalid natspec', () => {
    beforeAll(async () => {
      const compileResult = await getFileCompiledSource('test/contracts/ParserTest.sol');
      contract = compileResult.vContracts.find(({ name }) => name === 'ParserTestFunny')!;
    });

    it('should parse struct', async () => {
      const node = findNode(contract.vStructs, 'SimpleStruct');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [],
        })
      );
    });

    it('should parse inheritdoc + natspec', async () => {
      const node = findNode(contract.vStateVariables, 'someVariable');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          inheritdoc: {
            content: 'IParserTest',
          },
          tags: [
            {
              name: 'dev',
              content: 'Providing context',
            },
          ],
        })
      );
    });

    it('should not parse the inheritdoc tag with just 2 slashes', async () => {
      const node = findNode(contract.vStateVariables, 'SOME_CONSTANT');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(mockNatspec({}));
    });

    it('should not parse regular comments as natspec', async () => {
      const node = findNode(contract.vFunctions, 'viewFunctionWithParams');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(mockNatspec({}));
    });

    it('should parse natspec with multiple spaces', async () => {
      const node = findNode(contract.vFunctions, '_viewPrivate');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [
            {
              name: 'notice',
              content: 'Some private stuff',
            },
          ],
          params: [
            {
              name: '_paramName',
              content: 'The parameter name',
            },
          ],
          returns: [
            {
              name: '_returned',
              content: 'The returned value',
            },
          ],
        })
      );
    });

    it('should not parse natspec with invalid number of slashes', async () => {
      const node = findNode(contract.vFunctions, '_viewInternal');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(mockNatspec({}));
    });

    it('should parse block natspec with invalid formatting', async () => {
      const node = findNode(contract.vFunctions, '_viewBlockLinterFail');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(mockNatspec({}));
    });

    it('should parse natspec with invalid formatting', async () => {
      const node = findNode(contract.vFunctions, '_viewLinterFail');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [
            {
              name: 'notice',
              content: 'Linter fail',
            },
            {
              name: 'dev',
              content: 'What have I done',
            },
          ],
        })
      );
    });

    it('should correctly parse empty return tag', async () => {
      const node = findNode(contract.vFunctions, 'functionUnnamedEmptyReturn');
      const result = parseNodeNatspec(node);

      expect(result).toEqual(
        mockNatspec({
          tags: [],
          params: [],
          returns: [
            {
              name: '',
              content: '',
            },
            {
              name: '',
              content: '',
            },
          ],
        })
      );
    });
  });

  describe('Contract with latest Solidity version', () => {
    beforeAll(async () => {
      const compileResult = await getFileCompiledSource('test/contracts/LatestVersion.sol');
      contract = compileResult.vContracts.find(({ name }) => name === 'LatestVersion')!;
    });

    it('should compile contract with latest Solidity version', async () => {
      expect(contract).toBeDefined();
      expect(contract.name).toBe('LatestVersion');
    });
  });
});
