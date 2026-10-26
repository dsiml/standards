import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import dsiml from '../index.js'

const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url))

/** Lints one fixture and returns the ids of the rules it breaks. */
async function ruleIds(file, options = {}) {
	const eslint = new ESLint({
		cwd: FIXTURES,
		overrideConfigFile: true,
		overrideConfig: dsiml({ tsconfigRootDir: FIXTURES, ...options }),
	})
	const [result] = await eslint.lintFiles([file])
	return result.messages.map((message) => message.ruleId)
}

describe('@dsiml/eslint-config', () => {
	it('reports an unawaited promise', async () => {
		assert.ok(
			(await ruleIds('src/promise.ts')).includes(
				'@typescript-eslint/no-floating-promises',
			),
		)
	})

	it('reports `any` in source files but not in tests', async () => {
		assert.ok(
			(await ruleIds('src/any.ts')).includes(
				'@typescript-eslint/no-explicit-any',
			),
		)
		assert.deepEqual(await ruleIds('src/stub.test.ts'), [])
	})

	it('lints plain JavaScript without type information', async () => {
		assert.deepEqual(await ruleIds('src/config.mjs'), ['eqeqeq'])
	})

	it('only forbids loops and `let` with codeShape', async () => {
		assert.deepEqual(await ruleIds('src/loop.ts'), [])
		assert.deepEqual(await ruleIds('src/loop.ts', { codeShape: true }), [
			'no-restricted-syntax',
			'no-restricted-syntax',
		])
	})

	it('only checks the rules of hooks with react', async () => {
		const hooksRule = 'react-hooks/rules-of-hooks'
		assert.ok(!(await ruleIds('src/component.tsx')).includes(hooksRule))
		assert.ok(
			(await ruleIds('src/component.tsx', { react: true })).includes(hooksRule),
		)
	})

	it('restricts react rules to the given globs', async () => {
		assert.ok(
			!(
				await ruleIds('src/component.tsx', { react: ['app/**/*.tsx'] })
			).includes('react-hooks/rules-of-hooks'),
		)
	})

	it('allows throwing a Response with reactRouter', async () => {
		const throwRule = '@typescript-eslint/only-throw-error'
		assert.ok(
			(await ruleIds('src/route.tsx', { react: true })).includes(throwRule),
		)
		assert.ok(
			!(
				await ruleIds('src/route.tsx', { react: true, reactRouter: true })
			).includes(throwRule),
		)
	})
})
