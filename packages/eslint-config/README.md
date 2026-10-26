# @dsiml/eslint-config

Shared ESLint flat config for DSIML TypeScript and React projects.

```sh
npm install --save-dev eslint@9 typescript @dsiml/eslint-config
```

```js
// eslint.config.mjs
import dsiml from '@dsiml/eslint-config'

export default dsiml(
	{
		tsconfigRootDir: import.meta.dirname,
		react: ['apps/web/**/*.{ts,tsx}'],
		reactRouter: true,
		codeShape: true,
		ignores: ['apps/api/src/generated/**'],
	},
	// Project-specific blocks, applied last.
	{ files: ['scripts/**'], rules: { 'no-console': 'off' } },
)
```

## Options

| Option            | Default         | Effect                                                                                      |
| ----------------- | --------------- | ------------------------------------------------------------------------------------------- |
| `tsconfigRootDir` | `process.cwd()` | Where the TypeScript project service looks for `tsconfig.json`. Pass `import.meta.dirname`. |
| `react`           | `false`         | React, hooks and `jsx-a11y` rules: `true` for every file, or an array of globs.             |
| `reactRouter`     | `false`         | Allows React Router's control-flow throws (`Response`, `data()`) in React files.            |
| `codeShape`       | `false`         | No loops, no `let`, complexity ≤ 10, depth ≤ 3, functions ≤ 80 lines.                       |
| `ignores`         | `[]`            | Extra ignored globs, on top of build output, coverage and `node_modules`.                   |

## What it includes

- `@eslint/js` recommended rules.
- `typescript-eslint` `recommendedTypeChecked` and `stylisticTypeChecked` on
  TypeScript files, with type information through the project service.
- No `any`, no floating or misused promises, `eqeqeq`, `no-console` (warning).
- Relaxed typing rules in test files (`test/`, `tests/`, `*.test.*`, `*.spec.*`).
- `eslint-config-prettier`: formatting belongs to Prettier.

## Existing code

Freeze the current violations instead of fixing them all at once, and let the
file shrink as code is touched:

```sh
npx eslint . --suppress-all        # creates eslint-suppressions.json, to commit
npx eslint . --prune-suppressions  # drops the entries that are fixed
```
