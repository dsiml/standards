import dsiml from '@dsiml/eslint-config'

export default dsiml({
	tsconfigRootDir: import.meta.dirname,
	codeShape: true,
	// Fixtures are deliberately broken code that the tests lint.
	ignores: ['packages/eslint-config/test/fixtures/**'],
})
