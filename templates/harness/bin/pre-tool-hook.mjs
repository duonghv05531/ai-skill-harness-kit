#!/usr/bin/env node
/**
 * Universal PreToolUse Lifecycle Hook (Supports Google Gemini/Antigravity & Anthropic Claude Code)
 *
 * Enforces mandatory user engineering guardrails before shell command execution:
 * 1. Blocks shell commands that chain commands with unquoted `&&`.
 */

import fs from 'node:fs';

/**
 * Read raw UTF-8 string from standard input
 */
function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Check if a command string contains unquoted `&&` operator
 */
function hasUnquotedDoubleAmpersand(cmd) {
  if (typeof cmd !== 'string' || !cmd.includes('&&')) {
    return false;
  }
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < cmd.length - 1; i++) {
    const ch = cmd[i];
    const prev = i > 0 ? cmd[i - 1] : '';
    if (ch === "'" && !inDouble && prev !== '\\') {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle && prev !== '\\') {
      inDouble = !inDouble;
    } else if (!inSingle && !inDouble && ch === '&' && cmd[i + 1] === '&') {
      return true;
    }
  }
  return false;
}

function main() {
  const raw = readStdin().trim();
  if (!raw) {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    return;
  }

  try {
    const payload = JSON.parse(raw);

    // 1. Google Gemini / Antigravity PreToolUse Contract (`toolCall.name` + `toolCall.args.CommandLine`)
    if (payload?.toolCall) {
      const toolName = payload.toolCall.name || '';
      const args = payload.toolCall.args || {};
      if (toolName === 'run_command') {
        const commandLine = String(args.CommandLine || '');
        if (hasUnquotedDoubleAmpersand(commandLine)) {
          process.stdout.write(
            JSON.stringify({
              decision: 'deny',
              reason:
                "Global Harness Guardrail: Chaining commands with '&&' is strictly forbidden. Execute separate commands or use ';' in PowerShell."
            })
          );
          return;
        }
      }
      process.stdout.write(JSON.stringify({ decision: 'allow' }));
      return;
    }

    // 2. Anthropic Claude Code PreToolUse Contract (`tool_name: "Bash"` + `tool_input.command`)
    if (payload?.tool_name || payload?.tool_input) {
      const toolName = String(payload.tool_name || '');
      const commandLine = String(payload.tool_input?.command || '');
      if ((toolName === 'Bash' || toolName === 'run_command') && hasUnquotedDoubleAmpersand(commandLine)) {
        const reason =
          "Global Harness Guardrail: Chaining commands with '&&' is strictly forbidden. Execute separate commands instead.";
        process.stdout.write(
          JSON.stringify({
            decision: 'block',
            reason,
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason: reason
            }
          })
        );
        return;
      }
      process.stdout.write(JSON.stringify({ decision: 'approve' }));
      return;
    }

    process.stdout.write(JSON.stringify({ decision: 'allow' }));
  } catch {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
  }
}

main();
