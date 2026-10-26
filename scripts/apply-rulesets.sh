#!/usr/bin/env bash
# Creates or updates the DSIML rulesets of one repository:
#   - main:         pull request, linear history, required checks;
#   - release tags: only repository admins create `v*` tags, which deploy to
#                   production.
#
# Usage:   scripts/apply-rulesets.sh <repository> [--reviews N] <check>...
# Example: scripts/apply-rulesets.sh gestcompte 'ci / Result'
#
# Requires a paid GitHub plan for private repositories, and admin rights on
# the repository.
set -euo pipefail

OWNER=dsiml
RULESETS_DIR="$(cd "$(dirname "$0")/../rulesets" && pwd)"

usage() {
	echo "Usage: $0 <repository> [--reviews N] <check>..." >&2
	exit 2
}

[ $# -ge 1 ] || usage
repository="$1"
shift

reviews=1
if [ "${1:-}" = --reviews ]; then
	[ $# -ge 2 ] || usage
	reviews="$2"
	shift 2
fi

checks_json="$(jq --null-input --compact-output '$ARGS.positional | map({context: .})' --args "$@")"

# Creates the ruleset, or replaces the one of the same name.
apply() {
	local body="$1"
	local name existing
	name="$(jq --raw-output .name <<<"$body")"
	existing="$(gh api "repos/$OWNER/$repository/rulesets" \
		--jq ".[] | select(.name == \"$name\") | .id")"
	if [ -n "$existing" ]; then
		gh api --method PUT "repos/$OWNER/$repository/rulesets/$existing" --input - <<<"$body" >/dev/null
		echo "$repository: ruleset '$name' updated"
	else
		gh api --method POST "repos/$OWNER/$repository/rulesets" --input - <<<"$body" >/dev/null
		echo "$repository: ruleset '$name' created"
	fi
}

apply "$(jq --argjson checks "$checks_json" --argjson reviews "$reviews" '
	.rules |= map(
		if .type == "required_status_checks" then .parameters.required_status_checks = $checks
		elif .type == "pull_request" then .parameters.required_approving_review_count = $reviews
		else . end
	)
	| if ($checks | length) == 0 then .rules |= map(select(.type != "required_status_checks")) else . end
' "$RULESETS_DIR/main.json")"

apply "$(cat "$RULESETS_DIR/release-tags.json")"
