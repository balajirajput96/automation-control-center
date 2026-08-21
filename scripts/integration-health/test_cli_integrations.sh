#!/usr/bin/env bash
set -Eeuo pipefail

root=$(mktemp -d)
trap 'rm -rf "$root"' EXIT
mkdir -p "$root/bin" "$root/home/.jules" "$root/out"

cat > "$root/bin/gh" <<'EOF'
#!/usr/bin/env bash
if [ "${1:-}" = "--version" ]; then
  printf '%s\n' 'gh version test'
elif [ "${1:-}" = "auth" ] && [ "${2:-}" = "status" ]; then
  printf '%s\n' 'Logged in to github.com account test-user'
else
  exit 1
fi
EOF

cat > "$root/bin/jules" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' 'Jules CLI help v0.0.0'
EOF

chmod +x "$root/bin/gh" "$root/bin/jules"
PATH="$root/bin:/usr/bin:/bin" HOME="$root/home" scripts/integration-health/check_cli_integrations.sh "$root/out/report.tsv"

[ "$(wc -l < "$root/out/report.tsv")" -eq 5 ]
grep -q $'gh\tyes\tgh version test\tauthenticated\tyes' "$root/out/report.tsv"
grep -q $'jules\tyes\tv0.0.0\tdeferred\tyes' "$root/out/report.tsv"
grep -q $'agy\tno\tunavailable\tunavailable\tno' "$root/out/report.tsv"
grep -q $'gemini\tno\tunavailable\tunavailable\tno' "$root/out/report.tsv"
! grep -Eqi '(token|secret|password|authorization: bearer)' "$root/out/report.tsv"
printf '%s\n' 'integration-health-tests=pass'
