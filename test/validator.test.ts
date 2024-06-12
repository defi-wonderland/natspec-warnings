import { defaultConfig, defaultFunctions, defaultTags } from './utils/helpers';
import { Validator } from '../src/validator';
import { getFileCompiledSource, expectWarning, findNode } from './utils/helpers';
import { mockConfig, mockNatspec } from './utils/mocks';
import { ContractDefinition } from 'solc-typed-ast';

describe('Validator', () => {
  let contract: ContractDefinition;
  let validator: Validator = new Validator(mockConfig(defaultConfig));

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
      validator = new Validator(mockConfig({ constructorNatspec: true, functions: defaultFunctions }));
    });

    it('should reveal missing constructor natspec', () => {
      const node = contract.vFunctions.find(({ kind }) => kind === 'constructor')!;
      const result = validator.validate(node, mockNatspec({}));
      expectWarning(result, `@param _randomFlag is missing`, 1);
    });
  });

  describe('with disabled constructor natspec', () => {
    beforeAll(async () => {
      validator = new Validator(mockConfig({ constructorNatspec: true }));
    });

    it('should ignore missing constructor natspec', () => {
      const node = contract.vFunctions.find(({ kind }) => kind === 'constructor')!;
      const result = validator.validate(node, mockNatspec({}));
      expect(result).toEqual([]);
    });
  });

  describe('with enforced inheritdoc', () => {
    beforeAll(async () => {
      validator = new Validator(mockConfig({ inheritdoc: true }));
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

  describe('config rules', () => {
    it('should have no warnings if return is disabled for a function', () => {
      const mockFunctions = defaultFunctions;
      mockFunctions.external.tags.return = false;
      const noReturnValidator = new Validator(mockConfig({ functions: mockFunctions }));
      const node = findNode(contract.vFunctions, 'externalNoReturn');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'External function that returns a bool',
          },
        ],
        params: [],
        returns: [],
      });

      const result = noReturnValidator.validate(node, natspec);
      expect(result).toEqual([]);
    });

    it('should have no warnings if param is disabled', () => {
      const mockFunctions = defaultFunctions;
      mockFunctions.external.tags.param = false;
      const noParamValidator = new Validator(mockConfig({ functions: mockFunctions }));
      const node = findNode(contract.vFunctions, 'externalSimple');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'External function that returns a bool',
          },
        ],
        params: [],
        returns: [
          {
            name: '_isMagic',
            content: 'Some return data',
          },
        ],
      });

      const result = noParamValidator.validate(node, natspec);
      expect(result).toEqual([]);
    });

    it('should have no warnings if notice is disabled', () => {
      const mockFunctions = defaultFunctions;
      mockFunctions.external.tags.notice = false;
      const noNoticeValidator = new Validator(mockConfig({ functions: mockFunctions }));
      const node = findNode(contract.vFunctions, 'externalSimple');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'dev',
            content: 'A dev comment',
          },
        ],
        params: [],
        returns: [
          {
            name: '_isMagic',
            content: 'Some return data',
          },
        ],
      });

      const result = noNoticeValidator.validate(node, natspec);
      expect(result).toEqual([]);
    });

    it('should have a warning if notice is forced for a function', () => {
      const mockFunctions = defaultFunctions;
      mockFunctions.external.tags.notice = true;
      const noticeValidator = new Validator(mockConfig({ functions: mockFunctions }));
      const node = findNode(contract.vFunctions, 'externalSimple');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'dev',
            content: 'A dev comment',
          },
        ],
        params: [],
        returns: [
          {
            name: '_isMagic',
            content: 'Some return data',
          },
        ],
      });

      const result = noticeValidator.validate(node, natspec);
      expectWarning(result, `@notice is missing`, 1);
    });

    it('should have a warning if notice is forced for a modifier', () => {
      const mockModifier = defaultTags;
      mockModifier.tags.notice = true;
      const noticeValidator = new Validator(mockConfig({ modifiers: mockModifier }));
      const node = findNode(contract.vModifiers, 'transferFee');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'dev',
            content: 'Modifier notice',
          },
        ],
        params: [],
      });

      const result = noticeValidator.validate(node, natspec);
      expectWarning(result, `@notice is missing`, 1);
    });

    it('should have a warning if notice is forced for a struct', () => {
      const mockStruct = defaultTags;
      mockStruct.tags.notice = true;
      const noticeValidator = new Validator(mockConfig({ structs: mockStruct }));
      const node = findNode(contract.vStructs, 'TestStruct');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'dev',
            content: 'Modifier notice',
          },
        ],
        params: [],
      });

      const result = noticeValidator.validate(node, natspec);
      expectWarning(result, `@notice is missing`, 1);
    });

    it('should have a warning if notice is forced for an error', () => {
      const mockError = defaultTags;
      mockError.tags.notice = true;
      const noticeValidator = new Validator(mockConfig({ errors: mockError }));
      const node = findNode(contract.vErrors, 'BasicSample_SomeError');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'dev',
            content: 'Modifier notice',
          },
        ],
        params: [],
      });

      const result = noticeValidator.validate(node, natspec);
      expectWarning(result, `@notice is missing`, 1);
    });

    it('should have a warning if notice is forced for an event', () => {
      const mockEvent = defaultTags;
      mockEvent.tags.notice = true;
      const noticeValidator = new Validator(mockConfig({ events: mockEvent }));
      const node = findNode(contract.vEvents, 'BasicSample_BasicEvent');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'dev',
            content: 'Modifier notice',
          },
        ],
        params: [],
      });

      const result = noticeValidator.validate(node, natspec);
      expectWarning(result, `@notice is missing`, 1);
    });

    it('should have a warning if dev is forced for a function', () => {
      const mockFunctions = defaultFunctions;
      mockFunctions.external.tags.dev = true;
      const devValidator = new Validator(mockConfig({ functions: mockFunctions }));
      const node = findNode(contract.vFunctions, 'externalSimple');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'External function that returns a bool',
          },
        ],
        params: [],
        returns: [
          {
            name: '_isMagic',
            content: 'Some return data',
          },
        ],
      });

      const result = devValidator.validate(node, natspec);
      expectWarning(result, `@dev is missing`, 1);
    });

    it('should have a warning if dev is forced for a modifier', () => {
      const mockModifier = defaultTags;
      mockModifier.tags.dev = true;
      const devValidator = new Validator(mockConfig({ modifiers: mockModifier }));
      const node = findNode(contract.vModifiers, 'transferFee');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'Modifier notice',
          },
        ],
        params: [],
      });

      const result = devValidator.validate(node, natspec);
      expectWarning(result, `@dev is missing`, 1);
    });

    it('should have a warning if dev is forced for a struct', () => {
      const mockStruct = defaultTags;
      mockStruct.tags.dev = true;
      const devValidator = new Validator(mockConfig({ structs: mockStruct }));
      const node = findNode(contract.vStructs, 'TestStruct');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'Modifier notice',
          },
        ],
        params: [],
      });

      const result = devValidator.validate(node, natspec);
      expectWarning(result, `@dev is missing`, 1);
    });

    it('should have a warning if dev is forced for an error', () => {
      const mockError = defaultTags;
      mockError.tags.dev = true;
      const devValidator = new Validator(mockConfig({ errors: mockError }));
      const node = findNode(contract.vErrors, 'BasicSample_SomeError');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'Modifier notice',
          },
        ],
        params: [],
      });

      const result = devValidator.validate(node, natspec);
      expectWarning(result, `@dev is missing`, 1);
    });

    it('should have a warning if dev is forced for an event', () => {
      const mockEvent = defaultTags;
      mockEvent.tags.dev = true;
      const devValidator = new Validator(mockConfig({ events: mockEvent }));
      const node = findNode(contract.vEvents, 'BasicSample_BasicEvent');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'Modifier notice',
          },
        ],
        params: [],
      });

      const result = devValidator.validate(node, natspec);
      expectWarning(result, `@dev is missing`, 1);
    });

    it('should have a warning if notice is duplicated for a function', () => {
      const mockFunctions = defaultFunctions;
      mockFunctions.external.tags.notice = true;
      const noticeValidator = new Validator(mockConfig({ functions: mockFunctions }));
      const node = findNode(contract.vFunctions, 'externalSimple');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'External function that returns a bool',
          },
          {
            name: 'notice',
            content: 'External function that returns a bool',
          },
        ],
        params: [],
        returns: [
          {
            name: '_isMagic',
            content: 'Some return data',
          },
        ],
      });

      const result = noticeValidator.validate(node, natspec);
      expectWarning(result, `@notice is duplicated`, 1);
    });

    it('should have a warning if noticve is duplicated for a modifier', () => {
      const mockModifier = defaultTags;
      mockModifier.tags.notice = true;
      const noticeValidator = new Validator(mockConfig({ modifiers: mockModifier }));
      const node = findNode(contract.vModifiers, 'transferFee');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'Modifier notice',
          },
          {
            name: 'notice',
            content: 'Modifier notice',
          },
        ],
        params: [],
      });

      const result = noticeValidator.validate(node, natspec);
      expectWarning(result, `@notice is duplicated`, 1);
    });

    it('should have a warning if notice is duplicated for a struct', () => {
      const mockStruct = defaultTags;
      mockStruct.tags.notice = true;
      const noticeValidator = new Validator(mockConfig({ structs: mockStruct }));
      const node = findNode(contract.vStructs, 'TestStruct');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'Modifier notice',
          },
          {
            name: 'notice',
            content: 'Modifier notice',
          },
        ],
        params: [],
      });

      const result = noticeValidator.validate(node, natspec);
      expectWarning(result, `@notice is duplicated`, 1);
    });

    it('should have a warning if notice is duplicated for an error', () => {
      const mockError = defaultTags;
      mockError.tags.notice = true;
      const noticeValidator = new Validator(mockConfig({ errors: mockError }));
      const node = findNode(contract.vErrors, 'BasicSample_SomeError');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'Modifier notice',
          },
          {
            name: 'notice',
            content: 'Modifier notice',
          },
        ],
        params: [],
      });

      const result = noticeValidator.validate(node, natspec);
      expectWarning(result, `@notice is duplicated`, 1);
    });

    it('should have a warning if notice is duplicated for an event', () => {
      const mockEvent = defaultTags;
      mockEvent.tags.notice = true;
      const noticeValidator = new Validator(mockConfig({ events: mockEvent }));
      const node = findNode(contract.vEvents, 'BasicSample_BasicEvent');
      const natspec = mockNatspec({
        tags: [
          {
            name: 'notice',
            content: 'Modifier notice',
          },
          {
            name: 'notice',
            content: 'Modifier notice',
          },
        ],
        params: [],
      });

      const result = noticeValidator.validate(node, natspec);
      expectWarning(result, `@notice is duplicated`, 1);
    });

    it('should have no warnings if everything is disabled for a function', () => {
      const mockFunctions = defaultFunctions;
      mockFunctions.external.tags.dev = false;
      mockFunctions.external.tags.notice = false;
      mockFunctions.external.tags.param = false;
      mockFunctions.external.tags.return = false;
      const noNoticeValidator = new Validator(mockConfig({ functions: mockFunctions }));
      const node = findNode(contract.vFunctions, 'externalSimple');
      const natspec = mockNatspec({
        tags: [],
        params: [],
        returns: [],
      });

      const result = noNoticeValidator.validate(node, natspec);
      expect(result).toEqual([]);
    });

    it('should have no warnings if everything is disabled for a modifier', () => {
      const mockModifier = defaultTags;
      mockModifier.tags.dev = false;
      mockModifier.tags.notice = false;
      mockModifier.tags.param = false;
      const noNoticeValidator = new Validator(mockConfig({ modifiers: mockModifier }));
      const node = findNode(contract.vModifiers, 'transferFee');
      const natspec = mockNatspec({
        tags: [],
        params: [],
      });

      const result = noNoticeValidator.validate(node, natspec);
      expect(result).toEqual([]);
    });

    it('should have no warnings if everything is disabled for a struct', () => {
      const mockStruct = defaultTags;
      mockStruct.tags.dev = false;
      mockStruct.tags.notice = false;
      mockStruct.tags.param = false;
      const noNoticeValidator = new Validator(mockConfig({ structs: mockStruct }));
      const node = findNode(contract.vStructs, 'TestStruct');
      const natspec = mockNatspec({
        tags: [],
        params: [],
      });

      const result = noNoticeValidator.validate(node, natspec);
      expect(result).toEqual([]);
    });

    it('should have no warnings if everything is disabled for an error', () => {
      const mockError = defaultTags;
      mockError.tags.dev = false;
      mockError.tags.notice = false;
      mockError.tags.param = false;
      const noNoticeValidator = new Validator(mockConfig({ errors: mockError }));
      const node = findNode(contract.vErrors, 'BasicSample_SomeError');
      const natspec = mockNatspec({
        tags: [],
        params: [],
      });

      const result = noNoticeValidator.validate(node, natspec);
      expect(result).toEqual([]);
    });

    it('should have no warnings if everything is disabled for an event', () => {
      const mockEvent = defaultTags;
      mockEvent.tags.dev = false;
      mockEvent.tags.notice = false;
      mockEvent.tags.param = false;
      const noNoticeValidator = new Validator(mockConfig({ events: mockEvent }));
      const node = findNode(contract.vEvents, 'BasicSample_BasicEvent');
      const natspec = mockNatspec({
        tags: [],
        params: [],
      });

      const result = noNoticeValidator.validate(node, natspec);
      expect(result).toEqual([]);
    });

    it('should have a warning if tags are empty and notice is forced for a modifier', () => {
      const mockModifier = defaultTags;
      mockModifier.tags.notice = true;
      const noticeValidator = new Validator(mockConfig({ modifiers: mockModifier }));
      const node = findNode(contract.vModifiers, 'transferFee');
      const natspec = mockNatspec({
        tags: [],
        params: [],
      });

      const result = noticeValidator.validate(node, natspec);
      expectWarning(result, `Natspec is missing`, 1);
    });
  });
});
