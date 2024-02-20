#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { glob } from 'fast-glob';
import { getProjectCompiledSources } from './utils';
import { Processor } from './processor';
import { Config } from './types';
import { Validator } from './validator';

(async () => {
  const config: Config = getArguments();

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

function getArguments(): Config {
  return yargs(hideBin(process.argv))
    .strict()
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
      enforceInheritdoc: {
        type: 'boolean',
        description: 'If set to true, all external and public functions must have @inheritdoc.',
        default: true,
      },
      constructorNatspec: {
        type: 'boolean',
        description: 'True if constructor natspec is mandatory.',
        default: false,
      },
      contractNatspec: {
        type: 'boolean',
        description: 'True if contract natspec is mandatory.',
        default: false,
      },
    })
    .config()
    .default('config', 'natspec-smells.config')
    .parseSync();
}
