#!/usr/bin/env node
import path from 'path';
import yargs from 'yargs';
import fs from 'fs';
import { hideBin } from 'yargs/helpers';
import { glob } from 'fast-glob';
import { getProjectCompiledSources, processConfig } from './utils';
import { Processor } from './processor';
import { Config } from './types';
import { Validator } from './validator';
import { defaultFunctions, defaultTags } from './constants';

/**
 * Main function that processes the sources and prints the warnings
 */
(async () => {
  // Requires the config is in the root of the users directory
  const configPath = path.join(process.cwd(), './natspec-smells.config.json');
  const config: Config = await getConfig(configPath);

  // TODO: Add configuration logic to the linter
  const excludedPaths = config.exclude === '' ? [] : await glob(config.exclude, { cwd: config.root });
  const includedPaths = await glob(config.include, { cwd: config.root, ignore: excludedPaths });

  const sourceUnits = await getProjectCompiledSources(config.root, includedPaths);
  if (!sourceUnits.length) return console.error('No solidity files found in the specified directory');

  const validator = new Validator(config);
  const processor = new Processor(validator);
  const warnings = await processor.processSources(sourceUnits);

  if (!warnings.length) {
    console.warn('No issues found');
    return;
  }

  warnings.forEach(({ location, messages }) => {
    console.warn(location);
    messages.forEach((message) => {
      console.warn(`  ${message}`);
    });
    console.warn();
  });
})().catch(console.error);

/**
 * Gets the config from the CLI or the config file
 * @dev Prioritizes the config file over the CLI
 * @param {string} configPath - The expected config path
 * @returns {Config} - The config
 */
async function getConfig(configPath: string): Promise<Config> {
  if (fs.existsSync(configPath)) {
    return await processConfig(configPath);
  }

  const config: Partial<Config> = yargs(hideBin(process.argv))
    .options({
      include: {
        type: 'string',
        description: 'Glob pattern of files to process.',
        required: true,
      },
      exclude: {
        type: 'string',
        description: 'Glob pattern of files to exclude.',
        default: '',
      },
      root: {
        type: 'string',
        description: 'Root directory of the project.',
        default: './',
      },
      inheritdoc: {
        type: 'boolean',
        description: 'If set to true, all external and public functions must have @inheritdoc.',
        default: true,
      },
      constructorNatspec: {
        type: 'boolean',
        description: 'If set to true, all contracts must have a natspec for the constructor.',
        default: false,
      },
    })
    .parseSync();

  config.functions = defaultFunctions;
  config.modifiers = defaultTags;
  config.errors = defaultTags;
  config.events = defaultTags;
  config.structs = defaultTags;

  return config as Config;
}
