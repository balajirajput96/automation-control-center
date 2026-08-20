#!/usr/bin/env bash

workspace_script_dir() {
  cd "$(dirname "${BASH_SOURCE[0]}")" && pwd
}

workspace_project_root() {
  cd "$(workspace_script_dir)/../.." && pwd
}

workspace_output_dir() {
  printf '%s\n' "${WORKSPACE_OUTPUT_DIR:-$(workspace_project_root)/reports/private/workspace-maintenance}"
}

sanitize_metadata() {
  sed -E 's/(token|key|secret|password|authorization)[^[:space:];]*/[REDACTED]/Ig' | tr '\n' ' ' | tr '\t' ' '
}
