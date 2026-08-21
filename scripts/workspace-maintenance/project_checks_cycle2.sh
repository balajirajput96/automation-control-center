#!/usr/bin/env bash
set -u

ROOT="${WORKSPACE_ROOT:-$PWD/.workspace}"
REPOS="${WORKSPACE_REPOS:-$ROOT/repos}"
OUT="${1:-${WORKSPACE_OUTPUT:-$ROOT/checkpoints/project_checks_cycle2.tsv}}"
LOGS="${WORKSPACE_LOGS:-$ROOT/checkpoints/project_logs_cycle2}"

mkdir -p "$(dirname "$OUT")" "$LOGS"
printf 'repo\tinstall\ttypecheck\ttest\tbuild\tresult\n' > "$OUT"

run_cmd() {
  local log="$1"
  local seconds="$2"
  shift 2
  timeout --kill-after=20s "$seconds" bash -lc "$*" >"$log" 2>&1
  echo $?
}

for dir in "$REPOS"/*; do
  [ -d "$dir/.git" ] || continue
  [ -f "$dir/package.json" ] || continue

  name="${dir##*/}"
  install="na"
  typecheck="na"
  test="na"
  build="na"
  result="pass"

  if [ -d "$dir/node_modules" ]; then
    install="cached"
  elif [ -f "$dir/pnpm-lock.yaml" ]; then
    install=$(run_cmd "$LOGS/${name}_install.log" 300 "cd '$dir' && pnpm install --frozen-lockfile --ignore-scripts")
  elif [ -f "$dir/package-lock.json" ]; then
    install=$(run_cmd "$LOGS/${name}_install.log" 300 "cd '$dir' && npm ci --ignore-scripts")
  else
    install="not_applicable"
  fi
  [[ "$install" == "0" || "$install" == "cached" || "$install" == "not_applicable" ]] || result="install_failure"

  if [ "$result" = "pass" ] && [ -f "$dir/tsconfig.json" ]; then
    typecheck=$(run_cmd "$LOGS/${name}_typecheck.log" 300 "cd '$dir' && pnpm exec tsc --noEmit")
    [ "$typecheck" -eq 0 ] || result="typecheck_failure"
  fi

  if [ "$result" = "pass" ]; then
    if node -e 'let p=require(process.argv[1]); process.exit(p.scripts&&p.scripts.test?0:1)' "$dir/package.json" >/dev/null 2>&1; then
      if [ "$name" = "chatbot" ]; then
        # Next.js/Playwright needs a bounded heap in constrained local environments.
        test=$(run_cmd "$LOGS/${name}_test.log" 600 "cd '$dir' && NODE_OPTIONS=--max-old-space-size=1536 pnpm test")
      else
        test=$(run_cmd "$LOGS/${name}_test.log" 600 "cd '$dir' && pnpm test")
      fi
    else
      test="not_applicable"
    fi
    [ "$test" = "not_applicable" ] || { [ "$test" -eq 0 ] || result="test_failure"; }
  fi

  if [ "$result" = "pass" ]; then
    if [ "$name" = "chatbot" ]; then
      # Its standalone build runs a database migration and may wait indefinitely without a DB;
      # the bounded test already performs the production build and Playwright verification.
      build="covered_by_test"
    elif node -e 'let p=require(process.argv[1]); process.exit(p.scripts&&p.scripts.build?0:1)' "$dir/package.json" >/dev/null 2>&1; then
      build=$(run_cmd "$LOGS/${name}_build.log" 600 "cd '$dir' && pnpm run build")
    else
      build="not_applicable"
    fi
    [ "$build" = "not_applicable" ] || [ "$build" = "covered_by_test" ] || { [ "$build" -eq 0 ] || result="build_failure"; }
  fi

  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$name" "$install" "$typecheck" "$test" "$build" "$result" >> "$OUT"
done

for name in daily-research-reels-automation pharma-outreach-automation; do
  dir="$REPOS/$name"
  [ -d "$dir" ] || continue
  log="$LOGS/${name}_pytest.log"
  timeout --kill-after=20s 600 bash -lc "cd '$dir' && pytest -q" >"$log" 2>&1
  rc=$?
  printf '%s\tna\tna\t%s\tna\t%s\n' "$name" "$rc" "$([ "$rc" -eq 0 ] && echo pass || echo pytest_failure)" >> "$OUT"
done

printf 'output=%s\n' "$OUT"
