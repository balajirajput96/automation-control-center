#!/usr/bin/env bash
set -Eeuo pipefail

state_branch="${1:-automation-state}"

if [ -z "$state_branch" ] || [[ "$state_branch" == refs/* ]] || [[ "$state_branch" == *..* ]]; then
  printf 'invalid state branch name\n' >&2
  exit 2
fi

if git show-ref --verify --quiet "refs/remotes/origin/$state_branch"; then
  git switch --create "$state_branch" --track "origin/$state_branch"
else
  git switch --orphan "$state_branch"
  git read-tree --empty
  git clean -fdx
fi

printf 'state_branch=%s\n' "$state_branch"
