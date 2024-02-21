import fs from 'fs/promises';
import fstest from 'fs';
import path from 'path';
import * as utils from '../src/utils';
import { mockFoundryConfig, mockFunctionDefinition } from './utils/mocks';
import { FunctionKind } from 'solc-typed-ast';

describe('Utils', () => {
  describe('getSolidityFilesAbsolutePaths', () => {
    it('should return correct absolute paths', async () => {
      const relativePaths = ['test/contracts/ERC20.sol', 'test/contracts/ERC721.sol', 'test/wrong-file.txt'];
      const absolutePaths = await utils.getSolidityFilesAbsolutePaths(relativePaths);
      const expectedOutput = [path.resolve('test/contracts/ERC20.sol'), path.resolve('test/contracts/ERC721.sol')];
      expect(absolutePaths).toEqual(expectedOutput);
    });
  });

  describe('getProjectCompiledSources', () => {
    it('should return correct project compiled sources', async () => {
      const rootPath = './';
      const includedPaths = ['test/contracts/BasicSample.sol', 'test/contracts/InterfacedSample.sol'];
      const compiledSources = await utils.getProjectCompiledSources(rootPath, includedPaths);
      expect(compiledSources.length).toBe(2);
    });
  });

  describe('isFileInDirectory', () => {
    it('should return correct result', async () => {
      const directory = 'someDirectory';
      const filePath = 'someDirectory/someFile.sol';
      const result = utils.isFileInDirectory(directory, filePath);
      expect(result).toBe(true);
    });

    it('should work with deep enclosure', async () => {
      const directory = 'someDirectory';
      const filePath = 'someDirectory/subDirectory/someFile.sol';
      const result = utils.isFileInDirectory(directory, filePath);
      expect(result).toBe(true);
    });
  });

  describe('getRemappings', () => {
    it('should return right remappings from file first', async () => {
      const spy = jest.spyOn(utils, 'getRemappingsFromFile');
      spy.mockResolvedValueOnce(['file']);

      const output = await utils.getRemappings('');
      expect(output).toEqual(['file']);
    });

    it('should return remappings from config if fails', async () => {
      const spyGetRemappingsFromFile = jest.spyOn(utils, 'getRemappingsFromFile');
      spyGetRemappingsFromFile.mockRejectedValueOnce(new Error());

      const spy = jest.spyOn(utils, 'getRemappingsFromConfig');
      spy.mockResolvedValueOnce(['config']);

      const output = await utils.getRemappings('');
      expect(output).toEqual(['config']);
    });

    it('should return empty array if all fails', async () => {
      const output = await utils.getRemappings('wrong/path');
      expect(output).toEqual([]);
    });
  });

  describe('getRemappingsFromFile', () => {
    it('should return correct remappings from file', async () => {
      const mockRemappingsList = ['test/contracts/=contracts/', 'contract/contracts/=contracts/'];
      fs.readFile = jest.fn().mockResolvedValueOnce(mockRemappingsList.join('\n'));
      const remappings = await utils.getRemappingsFromFile('');
      expect(remappings).toEqual(mockRemappingsList);
    });
  });

  describe('getRemappingsFromConfig', () => {
    it('should return correct remappings from config', async () => {
      const remappings = new Map<string[], string[]>();

      remappings.set(
        [], // Expected value
        [''] // Remappings strings that when parsed should return the expected value
      );

      remappings.set(
        ['ds-test/=lib/ds-test/src'], // Expected value
        [`remappings = [ 'ds-test/=lib/ds-test/src' ]`] // Remappings strings that when parsed should return the expected value
      );

      remappings.set(
        ['ds-test/=node_modules/ds-test/src', 'forge-std/=node_modules/forge-std/src'], // Expected value
        [
          // Remappings strings that when parsed should return the expected value
          `remappings = [ 'ds-test/=node_modules/ds-test/src', 'forge-std/=node_modules/forge-std/src' ]`,
          `remappings= [ "ds-test/=node_modules/ds-test/src", 'forge-std/=node_modules/forge-std/src' ]`,
          `remappings   =     ["ds-test/=node_modules/ds-test/src","forge-std/=node_modules/forge-std/src"]`,
          `remappings   =     [
            "ds-test/=node_modules/ds-test/src", "forge-std/=node_modules/forge-std/src" ]`,
          `remappings   =[
              "ds-test/=node_modules/ds-test/src",
              "forge-std/=node_modules/forge-std/src" ]`,
          `remappings = [

            "ds-test/=node_modules/ds-test/src",    
            "forge-std/=node_modules/forge-std/src",     
          ]`,
          `remappings = [ 'ds-test/=node_modules/ds-test/src',
            'forge-std/=node_modules/forge-std/src'
          ]`,
        ]
      );

      remappings.set(
        ['@0x/contracts-utils/=../../node_modules/@0x/contracts-utils/', 'ERC721A/=lib/ERC721A/contracts/'], // Expected value
        [
          // Remappings strings that when parsed should return the expected value
          `remappings = [
            '@0x/contracts-utils/=../../node_modules/@0x/contracts-utils/',
            'ERC721A/=lib/ERC721A/contracts/',
          ]`,
        ]
      );

      for (const [expectedRemappings, remappingsLines] of remappings) {
        for (const remappingsLine of remappingsLines) {
          const mockConfig = mockFoundryConfig(remappingsLine);
          fs.readFile = jest.fn().mockResolvedValueOnce(mockConfig);

          const remappings = await utils.getRemappingsFromConfig('');
          expect(remappings).toEqual(expectedRemappings);
        }
      }
    });
  });

  describe('getLineNumberFromSrc', () => {
    it('should return correct line number', async () => {
      const mockFileContent = '0\n1\n2\n3\n';
      const lineNumber = utils.getLineNumberFromSrc(mockFileContent, '5:mock:123'); // 5th symbol
      expect(lineNumber).toEqual(3);
    });
  });

  describe('matchesFunctionKind', () => {
    it('should return correct function kind', async () => {
      const mockNode = mockFunctionDefinition({ kind: FunctionKind.Constructor });
      expect(utils.matchesFunctionKind(mockNode, 'constructor')).toBe(true);
    });
  });

  describe('getElementFrequency', () => {
    it('should return correct frequency', async () => {
      const example = [1, 1, 2, 2, 2, 'a', 'a', 'a', 'a'];
      const output = utils.getElementFrequency(example);
      expect(output).toEqual({
        1: 2,
        2: 3,
        a: 4,
      });
    });
  });

  describe('processConfig', () => {
    it('Should use a valid config', async () => {
      fs.readFile = jest.fn().mockResolvedValueOnce(
        JSON.stringify({
          include: './contracts/**/*.sol',
        })
      );
      const config = await utils.processConfig(path.join(__dirname, './valid.config.json'));

      // The default settings should be applied
      expect(config).toEqual({
        root: './',
        include: './contracts/**/*.sol',
        exclude: '',
        enforceInheritdoc: true,
        constructorNatspec: false,
      });
    });

    it('Should revert with an invalid config', async () => {
      fs.readFile = jest.fn().mockResolvedValueOnce(
        JSON.stringify({
          include: './contracts/**/*.sol',
          exclude: 123,
        })
      );
      await expect(utils.processConfig(path.join(__dirname, './invalid.config.json'))).rejects.toThrow();
    });

    it('Should overwrite defaults if values are set', async () => {
      fs.readFile = jest.fn().mockResolvedValueOnce(
        JSON.stringify({
          include: './contracts/**/*.sol',
          exclude: './contracts/ignored.sol',
          root: './contracts',
          enforceInheritdoc: false,
          constructorNatspec: true,
        })
      );
      const config = await utils.processConfig(path.join(__dirname, './valid.config.json'));

      expect(config).toEqual({
        root: './contracts',
        include: './contracts/**/*.sol',
        exclude: './contracts/ignored.sol',
        enforceInheritdoc: false,
        constructorNatspec: true,
        functions: undefined,
      });
    });

    it('Should set custom parameters for functions', async () => {
      fs.readFile = jest.fn().mockResolvedValueOnce(
        JSON.stringify({
          include: './contracts/**/*.sol',
          functions: {
            internal: {
              tags: {
                dev: true,
                notice: true,
                return: true,
              },
            },
          },
        })
      );
      const config = await utils.processConfig(path.join(__dirname, './valid.config.json'));

      expect(config).toEqual({
        root: './',
        include: './contracts/**/*.sol',
        exclude: '',
        enforceInheritdoc: true,
        constructorNatspec: false,
        functions: {
          internal: {
            tags: {
              dev: true,
              notice: true,
              return: true,
            },
          },
        },
      });
    });

    it('Should revert if a function block is incomplete', async () => {
      fs.readFile = jest.fn().mockResolvedValueOnce(
        JSON.stringify({
          include: './contracts/**/*.sol',
          functions: {
            internal: {
              tags: {
                dev: true,
                notice: true,
              },
            },
          },
        })
      );

      await expect(utils.processConfig(path.join(__dirname, './invalid.config.json'))).rejects.toThrow();
    });
  });
});
