import dsiml from '@dsiml/eslint-config'

export default dsiml(
	{
		tsconfigRootDir: import.meta.dirname,
		// true for a front-end project, or the globs of the React code only.
		react: ['client/**/*.{ts,tsx}'],
		reactRouter: true,
		// Generated code is not linted.
		ignores: ['server/src/generated/**'],
	},
	// Project-specific rules, applied after the shared ones.
	{
		files: ['scripts/**/*.ts'],
		rules: { 'no-console': 'off' },
	},
)
