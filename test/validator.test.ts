import { Validator } from '../src/validator';
import { getFileCompiledSource, expectWarning, findNode } from './utils/helpers';
import { mockConfig, mockNatspec } from './utils/mocks';
import { ContractDefinition } from 'solc-typed-ast';

describe('Validator', () => {
  let contract: ContractDefinition;
  let validator: Validator = new Validator(mockConfig({}));

  beforeAll(async () => {
    const compileResult = await getFileCompiledSource('test/contracts/BasicSample.sol');
    contract = compileResult.vContracts.find(({ name }) => name === 'BasicSample')!;
  });

  it('should validate proper natspec', () => {
    const node = findNode(contract.vFunctions, 'externalSimple');
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'External function that returns a bool',
        },
        {
          name: 'dev',
          content: 'A dev comment',
        },
      ],
      params: [
        {
          name: '_magicNumber',
          content: 'A parameter description',
        },
        {
          name: '_name',
          content: 'Another parameter description',
        },
      ],
      returns: [
        {
          name: '_isMagic',
          content: 'Some return data',
        },
        {
          name: undefined,
          content: 'Test test',
        },
      ],
    });
    const result = validator.validate(node, natspec);
    expect(result).toEqual([]);
  });

  it('should reveal missing natspec for parameters', () => {
    const node = findNode(contract.vFunctions, 'externalSimple');
    const paramName = '_magicNumber';
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'External function that returns a bool',
        },
      ],
      params: [
        {
          name: '_name',
          content: 'Another parameter description',
        },
      ],
    });
    const result = validator.validate(node, natspec);
    expectWarning(result, `@param ${paramName} is missing`, 1);
  });

  it('should reveal duplicated natspec for parameters', () => {
    const node = findNode(contract.vFunctions, 'externalSimple');
    const missingParamName = '_magicNumber';
    const duplicatedParamName = '_name';
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'External function that returns a bool',
        },
      ],
      params: [
        {
          name: duplicatedParamName,
          content: 'Another parameter description',
        },
        {
          name: duplicatedParamName,
          content: 'Another parameter description',
        },
      ],
    });
    const result = validator.validate(node, natspec);
    expectWarning(result, `@param ${missingParamName} is missing`, 1);
    expectWarning(result, `@param ${duplicatedParamName} is duplicated`, 1);
  });

  it('should reveal duplicated natspec for struct members', () => {
    const node = findNode(contract.vStructs, 'TestStruct');
    const missingParamName = 'someAddress';
    const duplicatedParamName = 'someNumber';
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'Some notice of the struct',
        },
      ],
      params: [
        {
          name: duplicatedParamName,
          content: 'Another parameter description',
        },
        {
          name: duplicatedParamName,
          content: 'Another parameter description',
        },
      ],
    });
    const result = validator.validate(node, natspec);
    expectWarning(result, `@param ${missingParamName} is missing`, 1);
    expectWarning(result, `@param ${duplicatedParamName} is duplicated`, 1);
  });

  it('should reveal missing natspec for returned values', () => {
    const node = findNode(contract.vFunctions, 'externalSimple');
    const paramName = '_isMagic';
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'External function that returns a bool',
        },
      ],
      params: [
        {
          name: '_magicNumber',
          content: 'A parameter description',
        },
        {
          name: '_name',
          content: 'Another parameter description',
        },
      ],
    });
    const result = validator.validate(node, natspec);
    expectWarning(result, `@return ${paramName} is missing`, 1);
  });

  it('should reveal missing natspec for unnamed returned values', () => {
    const node = findNode(contract.vFunctions, 'externalSimpleMultipleReturn');
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'External function that returns a bool',
        },
      ],
      returns: [
        {
          name: '_isMagic',
          content: 'Some return data',
        },
      ],
    });

    const result = validator.validate(node, natspec);
    expectWarning(result, `@return missing for unnamed return №2`, 1);
  });

  it('should warn of a missing unnamed return', () => {
    const node = findNode(contract.vFunctions, 'externalSimpleMultipleUnnamedReturn');
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'External function that returns a bool',
        },
      ],
      returns: [
        {
          name: 'Some',
          content: 'return data',
        },
      ],
    });

    const result = validator.validate(node, natspec);
    expectWarning(result, `@return missing for unnamed return №2`, 1);
  });

  it('should warn all returns if the first natspec tag is missing', () => {
    const node = findNode(contract.vFunctions, 'externalSimpleMultipleReturn');
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'External function that returns a bool',
        },
      ],
      returns: [
        {
          name: 'Some',
          content: 'return data',
        },
      ],
    });

    const result = validator.validate(node, natspec);
    expectWarning(result, `@return _isMagic is missing`, 1);
    expectWarning(result, `@return missing for unnamed return №2`, 1);
  });

  it('should warn if the last natspec tag is missing', () => {
    const node = findNode(contract.vFunctions, 'externalSimpleMultipleReturn');
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'External function that returns a bool',
        },
      ],
      returns: [
        {
          name: '_isMagic',
          content: 'Some return data',
        },
      ],
    });

    const result = validator.validate(node, natspec);
    expectWarning(result, `@return missing for unnamed return №2`, 1);
  });

  it('should reveal missing natspec for a private function', () => {
    const node = findNode(contract.vFunctions, 'privateSimple');
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'External function that returns a bool',
        },
      ],
      params: [],
    });

    const result = validator.validate(node, natspec);
    expectWarning(result, `@param _magicNumber is missing`, 1);
  });

  it('should reveal missing natspec for an internal function', () => {
    const node = findNode(contract.vFunctions, 'overriddenFunction');
    const result = validator.validate(
      node,
      mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'External function that returns a bool',
          },
        ],
        returns: [],
      })
    );
    expectWarning(result, `@return _returned is missing`, 1);
  });

  it('should reveal missing natspec for a constant', () => {
    const node = findNode(contract.vStateVariables, '_EMPTY_STRING');
    const result = validator.validate(node, mockNatspec({}));
    expect(result).toContainEqual(`Natspec is missing`);
  });

  it('should validate @notice for a public variable', () => {
    const node = findNode(contract.vStateVariables, 'somePublicNumber');
    const result = validator.validate(
      node,
      mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'Some public number',
          },
        ],
      })
    );
    expect(result).toEqual([]);
  });

  it('should reveal missing natspec for an error', () => {
    const node = findNode(contract.vErrors, 'BasicSample_SomeError');
    const paramName = '_param1';
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'Some error missing parameter natspec',
        },
      ],
    });
    const result = validator.validate(node, natspec);
    expectWarning(result, `@param ${paramName} is missing`, 1);
  });

  it('should reveal missing natspec for an event', () => {
    const node = findNode(contract.vEvents, 'BasicSample_BasicEvent');
    const paramName = '_param1';
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'An event missing parameter natspec',
        },
      ],
    });
    const result = validator.validate(node, natspec);
    expectWarning(result, `@param ${paramName} is missing`, 1);
  });

  it('should reveal missing natspec for an modifier', () => {
    const node = findNode(contract.vModifiers, 'transferFee');
    const paramName = '_receiver';
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'Modifier notice',
        },
      ],
    });
    const result = validator.validate(node, natspec);
    expect(result).toContainEqual(`@param ${paramName} is missing`);
  });

  it('should reveal missing natspec for a struct', () => {
    const node = findNode(contract.vStructs, 'TestStruct');
    const paramName1 = 'someAddress';
    const natspec = mockNatspec({
      tags: [
        {
          name: 'notice',
          content: 'Modifier notice',
        },
      ],
    });
    const result = validator.validate(node, natspec);
    expectWarning(result, `@param ${paramName1} is missing`, 1);
  });

  it('should ignore the receive function', () => {
    const node = contract.vFunctions.find(({ kind }) => kind === 'receive')!;
    const result = validator.validate(node, mockNatspec({}));
    expect(result).toEqual([]);
  });

  it('should ignore the callback function', () => {
    const node = contract.vFunctions.find(({ kind }) => kind === 'fallback')!;
    const result = validator.validate(node, mockNatspec({}));
    expect(result).toEqual([]);
  });

  describe('with enforced constructor natspec', () => {
    beforeAll(async () => {
      validator = new Validator(mockConfig({ constructorNatspec: true }));
    });

    it('should reveal missing constructor natspec', () => {
      const node = contract.vFunctions.find(({ kind }) => kind === 'constructor')!;
      const result = validator.validate(node, mockNatspec({}));
      expectWarning(result, `@param _randomFlag is missing`, 1);
    });
  });

  describe('with disabled constructor natspec', () => {
    beforeAll(async () => {
      validator = new Validator(mockConfig({ constructorNatspec: false }));
    });

    it('should ignore missing constructor natspec', () => {
      const node = contract.vFunctions.find(({ kind }) => kind === 'constructor')!;
      const result = validator.validate(node, mockNatspec({}));
      expect(result).toEqual([]);
    });
  });

  describe('with enforced inheritdoc', () => {
    beforeAll(async () => {
      validator = new Validator(mockConfig({ enforceInheritdoc: true }));
    });

    it('should return no warnings if inheritdoc is in place', () => {
      const node = findNode(contract.vFunctions, 'overriddenFunction');
      const natspec = mockNatspec({
        inheritdoc: { content: 'AbstractBasic' },
      });

      const result = validator.validate(node, natspec);
      expect(result).toEqual([]);
    });

    it('should reveal missing inheritdoc for an overridden function', () => {
      const node = findNode(contract.vFunctions, 'overriddenFunction');
      const result = validator.validate(node, mockNatspec({}));
      expect(result).toContainEqual(`@inheritdoc is missing`);
    });

    it('should reveal missing inheritdoc for a virtual function', () => {
      const node = findNode(contract.vFunctions, 'virtualFunction');
      const result = validator.validate(node, mockNatspec({}));
      expect(result).toContainEqual(`@inheritdoc is missing`);
    });

    it('should reveal missing inheritdoc for a public variable', () => {
      const node = findNode(contract.vStateVariables, 'somePublicNumber');
      const result = validator.validate(node, mockNatspec({}));
      expect(result).toContainEqual(`@inheritdoc is missing`);
    });
  });

  describe('with enforced contract-level natspec', () => {
    beforeAll(() => {
      validator = new Validator(mockConfig({ contractNatspec: true }));
    });

    it('should reveal missing natspec for a contract if enabled', () => {
      const result = validator.validate(contract, mockNatspec({}));
      expect(result).toContainEqual(`@notice is missing`);
    });

    it('should pay attention only to the @notice tag', () => {
      const result = validator.validate(
        contract,
        mockNatspec({
          tags: [{ name: 'author', content: 'Some author' }],
        })
      );
      expect(result).toContainEqual(`@notice is missing`);
      expect(result.length).toBe(1);
    });
  });

  describe('with disabled contract-level natspec', () => {
    beforeAll(async () => {
      validator = new Validator(mockConfig({ contractNatspec: false }));
    });

    it('should ignore missing natspec for a contract if disabled (by default)', () => {
      const result = validator.validate(contract, mockNatspec({}));
      expect(result).toEqual([]);
    });
  });
});
