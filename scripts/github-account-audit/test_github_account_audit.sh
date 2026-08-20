#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="${SCRIPT_DIR}/run_audit.sh"
BOOTSTRAP="${SCRIPT_DIR}/bootstrap_state_branch.sh"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

bash -n "$RUNNER" "$BOOTSTRAP" "$SCRIPT_DIR/test_github_account_audit.sh"

fake_bin="$work/bin"
mkdir -p "$fake_bin"
cat > "$fake_bin/gh" <<'FAKE_GH'
#!/usr/bin/env bash
set -Eeuo pipefail
case "$*" in
  *"user/repos?per_page=100&affiliation=owner"*)
    printf '%s\n' '[{"name":"example-repo","default_branch":"main","updated_at":"2026-08-21T00:00:00Z","html_url":"https://github.com/example/repo","fork":false,"archived":false,"owner":{"login":"balajirajput96"}}]'
    ;;
  *"pulls?state=open&per_page=100"*) printf '%s\n' '[]' ;;
  *"actions/runs?per_page=20"*) printf '%s\n' '{"workflow_runs":[]}' ;;
  *) printf 'unexpected gh invocation: %s\n' "$*" >&2; exit 1 ;;
esac
FAKE_GH
chmod +x "$fake_bin/gh"
cat > "$fake_bin/curl" <<'FAKE_CURL'
#!/usr/bin/env bash
printf 'unexpected external curl invocation: %s\n' "$*" >&2
exit 99
FAKE_CURL
chmod +x "$fake_bin/curl"

printf '%s\n' '{"execution_number":7}' > "$work/previous-state.json"
gemini_env_name=GEMINI_API_KEY
env PATH="$fake_bin:$PATH" "$gemini_env_name=synthetic-test-key" GH_PAGER=cat GH_FORCE_TTY=0 NO_COLOR=1 "$RUNNER" "$work/audit" "$work/previous-state.json" > "$work/runner-output.txt"

jq -e '
  .execution_number == 8 and
  (.timestamp | type == "string") and
  (.repository | type == "string") and
  (.task | type == "string") and
  (.workflow | type == "string") and
  (.cli_connector_api_used | type == "string") and
  (.result == "completed") and
  (.failure_category | type == "string") and
  (.recovery_attempt | type == "string") and
  (.validation_status | type == "string") and
  (.remaining_blocker | type == "string") and
  (.next_recommended_action | type == "string")
' "$work/audit/execution-state.json" >/dev/null

test "$(wc -l < "$work/audit/repos.tsv")" -eq 2
test "$(wc -l < "$work/audit/open-prs.tsv")" -eq 1
test "$(wc -l < "$work/audit/recent-runs.tsv")" -eq 1
! grep -RInE '(ghp_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|-----BEGIN (RSA|OPENSSH|EC|PRIVATE) KEY-----)' "$work/audit"

bare="$work/remote.git"
git init --bare -q "$bare"
repo="$work/repo"
git init -q -b main "$repo"
git -C "$repo" config user.name test
git -C "$repo" config user.email test@example.invalid
printf '%s\n' main > "$repo/README.md"
git -C "$repo" add README.md
git -C "$repo" commit -qm initial
git -C "$repo" remote add origin "$bare"
git -C "$repo" push -q -u origin main
git -C "$repo" fetch -q origin main
(
  cd "$repo"
  "$BOOTSTRAP" automation-state > "$work/bootstrap-output.txt"
  test "$(git branch --show-current)" = automation-state
  test -z "$(git ls-files)"
)

echo "github-account-audit checks passed"
