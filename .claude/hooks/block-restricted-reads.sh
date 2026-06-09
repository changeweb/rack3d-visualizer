#!/usr/bin/env bash
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')

[ -z "$file" ] && exit 0

if printf '%s' "$file" | grep -qE '(^|/)(node_modules|dist|build|coverage|\.cache|\.git|logs)(/|$)|(^|/)\.env(\.|$)|(^|/)(package-lock\.json|yarn\.lock)$'; then
  jq -n --arg p "$file" '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "deny",
      "permissionDecisionReason": ("Blocked: restricted path — " + $p)
    }
  }'
  exit 2
fi

exit 0
