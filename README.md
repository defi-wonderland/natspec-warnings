[![Version](https://img.shields.io/npm/v/@defi-wonderland/natspec-smells?label=Version)](https://www.npmjs.com/package/@defi-wonderland/natspec-smells)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/defi-wonderland/natspec-smells/blob/main/LICENSE)

# Natspec Smells

Just like code, documentation can smell too.
Natspec Smells aims to help automatically identify missing or incomplete natspec.

What can it do?

- Verifies natspec for: constructors, variables, functions, ~~structs~~, errors, events, modifiers
- Finds misspelled or missing `@param` or `@return`'s.
- Lets you enforce the need for `@inheritdoc` in public/external functions.
- Can integrate on your daily workflow, or just as a final check.

## No setup usage

Want to quickly check if your natspec smells?

Just run:

```
npx @defi-wonderland/natspec-smells --include "src/**/*.sol" --exclude "(test|scripts)/**/*.sol"
```

> [!NOTE]
> Remember to put quotes around the glob strings when using the `include` and `exclude` options.

## Recommended setup

1. Install the package:

   ```bash
   yarn add --dev @defi-wonderland/natspec-smells
   ```

2. Create a config file named `natspec-smells.config.js`, you can use the following as an example:

   ```javascript
   /**
    * List of supported options: https://github.com/defi-wonderland/natspec-smells?tab=readme-ov-file#options
    */

   /** @type {import('@defi-wonderland/natspec-smells').Config} */
   module.exports = {
     include: 'src/**/*.sol',
     exclude: '(test|scripts)/**/*.sol',
   };
   ```

3. Run
   ```bash
   yarn natspec-smells
   ```

## Verify your natspec in CI

_Soon to come._

## Options

| Option               | Description                                                        | Required | Default |
| -------------------- | ------------------------------------------------------------------ | -------- | ------- |
| `include`            | Glob pattern of files to process.                                  | Yes      |         |
| `exclude`            | Glob pattern of files to exclude.                                  | No       | `""`    |
| `root`               | Project root directory.                                            | No       | `./`    |
| `enforceInheritdoc`  | True if all external and public functions should have @inheritdoc. | No       | `true`  |
| `constructorNatspec` | True if the constructor should have natspec.                       | No       | `false` |

## Contributors

Natspec Smells was built with ❤️ by [Wonderland](https://defi.sucks).

Wonderland the largest core development group in web3. Our commitment is to a financial future that's open, decentralized, and accessible to all.

[DeFi sucks](https://defi.sucks), but Wonderland is here to make it better.
