/**
 * Commit message convention: `type(scope): subject`.
 *
 * `subject-case` is off: it wrongly fires on accented capitals and on the
 * acronyms (ARML, UNML, RGAA) found in French subjects.
 */
export default {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'subject-case': [0],
		'header-max-length': [2, 'always', 100],
		'body-max-line-length': [0],
	},
}
