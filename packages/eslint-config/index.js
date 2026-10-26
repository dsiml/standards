import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const TS_FILES = ['**/*.{ts,tsx,mts,cts}']
const JS_FILES = ['**/*.{js,jsx,mjs,cjs}']
const ALL_FILES = [...TS_FILES, ...JS_FILES]
const TEST_FILES = [
	'**/test/**/*.{ts,tsx,mts,js,mjs}',
	'**/tests/**/*.{ts,tsx,mts,js,mjs}',
	'**/*.{test,spec}.{ts,tsx,mts,js,mjs}',
]

/** Build output, coverage and local agent tooling are not hand-written code. */
const DEFAULT_IGNORES = [
	'**/node_modules/**',
	'**/dist/**',
	'**/build/**',
	'**/coverage/**',
	'**/.nyc_output/**',
	'**/.react-router/**',
	'.agents/**',
	'.claude/**',
	'.superpowers/**',
]

/** Loops are replaced by array methods, or by a helper for sequential async work. */
const NO_LOOPS = [
	'ForStatement',
	'ForInStatement',
	'ForOfStatement',
	'WhileStatement',
	'DoWhileStatement',
].map((selector) => ({
	selector,
	message:
		'Use an array method (map, filter, flatMap, reduce, some, every), or a helper that runs async work sequentially.',
}))

const LET_MESSAGE =
	'Use `const`: derive the value with an expression, an early return or a small function instead of reassigning it.'

const NO_LET = {
	selector: "VariableDeclaration[kind='let']",
	message: LET_MESSAGE,
}

/**
 * In tests, a fixture declared without a value and assigned by a `before` /
 * `beforeEach` hook is the lifecycle of the test runner, not a reassignment:
 * only a `let` with an initializer is refused there.
 */
const NO_INITIALISED_LET = {
	selector: "VariableDeclaration[kind='let'] > VariableDeclarator[init]",
	message: LET_MESSAGE,
}

function typescript(tsconfigRootDir) {
	return {
		files: TS_FILES,
		extends: [
			tseslint.configs.recommendedTypeChecked,
			tseslint.configs.stylisticTypeChecked,
		],
		languageOptions: {
			parserOptions: { projectService: true, tsconfigRootDir },
			globals: { ...globals.node },
		},
		rules: {
			// A leading `_` marks a deliberately unused variable.
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrors: 'all',
				},
			],
			// `any` defeats the whole point of type checking.
			'@typescript-eslint/no-explicit-any': 'error',
			// An unawaited promise silently swallows its errors.
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error',
			'@typescript-eslint/await-thenable': 'error',
		},
	}
}

/**
 * Plain JavaScript (config files, scripts): no type information is available,
 * so no rule that depends on it.
 */
const javascript = {
	files: JS_FILES,
	extends: [tseslint.configs.disableTypeChecked],
	languageOptions: { globals: { ...globals.node } },
}

const everywhere = {
	files: ALL_FILES,
	rules: {
		// `==` across different types is almost always a bug.
		eqeqeq: ['error', 'always', { null: 'ignore' }],
		'no-console': ['warn', { allow: ['warn', 'error'] }],
	},
}

function reactConfigs(files, reactRouter) {
	return [
		{
			files,
			extends: [
				react.configs.flat.recommended,
				react.configs.flat['jsx-runtime'],
				jsxA11y.flatConfigs.recommended,
			],
			plugins: { 'react-hooks': reactHooks },
			languageOptions: { globals: { ...globals.browser } },
			settings: { react: { version: 'detect' } },
			rules: {
				...reactHooks.configs['recommended-latest'].rules,
				// TypeScript already checks props.
				'react/prop-types': 'off',
				// The apostrophe is everywhere in French; only `>` and `}` are truly
				// ambiguous in JSX.
				'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
			},
		},
		reactRouter
			? {
					// React Router signals a redirect by throwing a `Response`, and a
					// status with a typed body by throwing the object `data()` returns:
					// these are its two control-flow idioms, not a badly typed error.
					files,
					ignores: JS_FILES,
					rules: {
						'@typescript-eslint/only-throw-error': [
							'error',
							{
								allow: [
									{ from: 'lib', name: 'Response' },
									{
										from: 'package',
										package: 'react-router',
										name: 'DataWithResponseInit',
									},
								],
							},
						],
					},
				}
			: [],
	]
}

/**
 * Data is transformed with array methods, never mutated in a loop: the intent
 * (filter, map, accumulate) is named instead of rebuilt by hand.
 */
const codeShapeConfig = {
	files: ALL_FILES,
	rules: {
		'no-restricted-syntax': ['error', ...NO_LOOPS, NO_LET],
		'prefer-const': 'error',
		'no-nested-ternary': 'error',
		'no-else-return': ['error', { allowElseIf: false }],
		'no-lonely-if': 'error',
		complexity: ['error', 10],
		'max-depth': ['error', 3],
		'max-lines-per-function': [
			'error',
			{ max: 80, skipBlankLines: true, skipComments: true, IIFEs: true },
		],
	},
}

function testConfig(codeShape) {
	return {
		files: TEST_FILES,
		languageOptions: { globals: { ...globals.mocha } },
		rules: {
			// Tests stub dependencies: strict typing of test doubles would hurt
			// readability without proving anything.
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'no-console': 'off',
			...(codeShape && {
				// A `describe` block is one function that groups many cases: its
				// length measures the number of cases, not a lack of structure.
				'max-lines-per-function': 'off',
				'no-restricted-syntax': ['error', ...NO_LOOPS, NO_INITIALISED_LET],
			}),
		},
	}
}

/**
 * @typedef {object} Options
 * @property {string} [tsconfigRootDir] Directory the TypeScript project
 *   service resolves `tsconfig.json` files from: pass `import.meta.dirname`.
 * @property {boolean | string[]} [react] React, hooks and accessibility rules,
 *   on every file (`true`) or on the given globs only.
 * @property {boolean} [reactRouter] Allow React Router's control-flow throws
 *   (`Response`, `data()`) in the React files.
 * @property {boolean} [codeShape] Forbid loops and `let`, and cap complexity,
 *   nesting depth and function length.
 * @property {string[]} [ignores] Extra glob patterns to ignore.
 */

/**
 * Builds the DSIML ESLint configuration.
 *
 * @param {Options} [options]
 * @param {...import('eslint').Linter.Config} overrides Project-specific
 *   blocks, applied last so they can override any shared rule.
 */
export default function dsiml(options = {}, ...overrides) {
	const {
		tsconfigRootDir = process.cwd(),
		react: reactFiles = false,
		reactRouter = false,
		codeShape = false,
		ignores = [],
	} = options

	return defineConfig(
		globalIgnores([...DEFAULT_IGNORES, ...ignores]),
		js.configs.recommended,
		typescript(tsconfigRootDir),
		javascript,
		everywhere,
		reactFiles
			? reactConfigs(reactFiles === true ? ALL_FILES : reactFiles, reactRouter)
			: [],
		codeShape ? codeShapeConfig : [],
		testConfig(codeShape),
		// Turns off the rules Prettier owns: formatting is never an ESLint error.
		prettier,
		...overrides,
	)
}
