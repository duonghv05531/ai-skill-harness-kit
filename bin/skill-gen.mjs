#!/usr/bin/env node
/**
 * Multi-Agent Skill & Harness Generator CLI (`skill-gen.mjs`)
 *
 * Usage on any machine:
 *   npm run init                                               # Interactive wizard to choose target(s) & models per agent
 *   npx --yes github:<owner>/<repo> init                       # Zero-clone 1-command interactive wizard on a new machine
 *   node bin/skill-gen.mjs init --target all --yes \           # 1-line non-interactive init with per-agent model options
 *     --gemini-models "ba=pro,po=flash_lite,dev=pro,tester=flash" \
 *     --claude-models "ba=opus:high,dev=opus:high,tester=haiku:high,po=haiku:low" \
 *     --codex-models "ba=gpt-5.4:high,dev=gpt-5.4:high,tester=gpt-5.4-mini:high"
 *   node bin/skill-gen.mjs models                              # List supported models, efforts & presets per agent
 *   node bin/skill-gen.mjs doctor                              # Verify installation & 6-skill subagent profiles
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAll, runDoctor } from '../src/generator.mjs';
import { runInteractiveInit } from '../src/init-wizard.mjs';
import {
  SUPPORTED_TARGETS,
  ROLE_SUBAGENTS,
  AGENT_MODEL_CATALOG,
  MODEL_PRESETS
} from '../src/adapters.mjs';

/**
 * Parse CLI arguments into positional tokens and named flags (supports `--key value`, `--key=value`, and `-y`)
 */
export function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '-y') {
      flags.yes = true;
      continue;
    }
    if (token.startsWith('--')) {
      const raw = token.slice(2);
      const eqIdx = raw.indexOf('=');
      if (eqIdx !== -1) {
        const key = raw.slice(0, eqIdx);
        const val = raw.slice(eqIdx + 1);
        flags[key] = val;
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          flags[raw] = next;
          i++;
        } else {
          flags[raw] = true;
        }
      }
    } else {
      positional.push(token);
    }
  }
  return { positional, flags };
}

/**
 * Build generator options object from parsed CLI flags and optional JSON config file
 */
export function buildOptionsFromFlags(flags) {
  let loadedConfig = {};
  if (flags.config) {
    const configPath = path.resolve(flags.config);
    loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  const options = {
    scope: flags.scope || loadedConfig.scope || 'global',
    explicitScope: Boolean(flags.scope || loadedConfig.scope),
    explicitTarget: flags.target || (Array.isArray(loadedConfig.targets) ? loadedConfig.targets.join(',') : undefined),
    workspaceDir: flags.dest || process.cwd(),
    homeDir: flags.home || undefined,
    preset: flags.preset || loadedConfig.preset || 'optimal',
    geminiModels: flags['gemini-models'] || undefined,
    claudeModels: flags['claude-models'] || undefined,
    codexModels: flags['codex-models'] || undefined,
    subagentProfiles: loadedConfig.subagentProfiles || undefined,
    saveConfigPath: flags['save-config'] || undefined,
    skipArchify: Boolean(flags['skip-archify']),
    targetRoleOverrides: {}
  };

  // Map global `--<role>-model` and `--<role>-effort` CLI flags
  for (const role of ROLE_SUBAGENTS) {
    if (flags[`${role}-model`]) {
      options[`${role}Model`] = flags[`${role}-model`];
    }
    if (flags[`${role}-effort`]) {
      options[`${role}Effort`] = flags[`${role}-effort`];
    }
  }

  // Map per-agent `--<target>-<role>-model` and `--<target>-<role>-effort` CLI flags
  for (const target of SUPPORTED_TARGETS) {
    options.targetRoleOverrides[target] = {};
    for (const role of ROLE_SUBAGENTS) {
      const mKey = `${target}-${role}-model`;
      const eKey = `${target}-${role}-effort`;
      if (flags[mKey] || flags[eKey]) {
        options.targetRoleOverrides[target][role] = {
          ...(flags[mKey] ? { model: flags[mKey] } : {}),
          ...(flags[eKey] ? { effort: flags[eKey] } : {})
        };
      }
    }
  }

  return options;
}

function printHelp() {
  const helpText = `
Multi-Agent Skill & Two-Tier Harness Generator (Gemini · Claude Code · OpenAI Codex)

Commands:
  init      Interactive wizard (or 1-line CLI with --yes) to select models per agent (gemini, claude, codex) and generate all skills
  install   Non-interactive generator alias for CI/scripts (same options as 'init --yes')
  models    Display valid models, reasoning efforts, and built-in presets per agent
  doctor    Verify installation status and 6-skill model+effort profiles across Gemini, Claude Code, and Codex
  help      Show this help message

Core Options:
  --target <gemini|claude|codex|all>      Target agent(s) to generate for (default: all, or comma-separated e.g. gemini,claude)
  --scope <global|workspace>              Install into OS user config (~/.gemini, ~/.claude, ~/.codex) or project folder (default: global)
  --dest <path>                           Target project directory when --scope workspace is used
  --yes, -y                               Run 'init' non-interactively without terminal prompts
  --preset <optimal|max|economy>          Select built-in 6-skill model pyramid preset (default: optimal)
  --skip-archify                          Skip copying the bundled archify package (faster when already installed)

Per-Agent Model & Effort Options (for 'init' and 'install'):
  --gemini-models "<role=tier,...>"       Set Gemini tiers per skill (allowed: pro, flash, flash_lite, inherit)
                                          e.g. --gemini-models "ba=pro,harness=pro,po=flash_lite,dev=pro,tester=flash,merge=flash"
  --claude-models "<role=model:eff,...>"  Set Claude models & efforts (efforts: low, medium, high, max)
                                          e.g. --claude-models "ba=opus:high,harness=sonnet:high,po=haiku:low,dev=opus:high,tester=haiku:high,merge=sonnet:medium"
  --codex-models  "<role=model:eff,...>"  Set Codex models & reasoning_effort (efforts: low, medium, high)
                                          e.g. --codex-models "ba=gpt-5.4:high,harness=gpt-5.4:medium,po=gpt-5.4-mini:low,dev=gpt-5.4:high,tester=gpt-5.4-mini:high,merge=gpt-5.4:medium"
  --<agent>-<role>-model <model>          Override a single skill's model on a specific agent (e.g. --claude-dev-model opus)
  --<agent>-<role>-effort <effort>        Override a single skill's effort on a specific agent (e.g. --claude-tester-effort high)
  --save-config <file.json>               Save the chosen per-agent model profiles to a portable JSON file
  --config <file.json>                    Load target & per-agent model profiles from a saved JSON file

Examples (Run on any new machine):
  # 1. Interactive step-by-step wizard (choose agent & models per skill):
  npm run init
  npx --yes github:<owner>/<repo> init

  # 2. Single 1-line command customizing models per agent without prompts:
  node ./bin/skill-gen.mjs init --target all --yes --gemini-models "po=flash_lite,tester=flash" --claude-models "dev=opus:high,tester=haiku:high" --codex-models "dev=gpt-5.4:high,tester=gpt-5.4-mini:high"
`.trim();
  console.log(helpText);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const command = positional[0] || 'help';

  try {
    if (command === 'help' || flags.help) {
      printHelp();
      return;
    }

    if (command === 'models' || command === 'catalog') {
      console.log(
        JSON.stringify(
          {
            ok: true,
            skills: ROLE_SUBAGENTS,
            presets: Object.keys(MODEL_PRESETS),
            catalog: AGENT_MODEL_CATALOG,
            defaultOptimalProfiles: MODEL_PRESETS.optimal
          },
          null,
          2
        )
      );
      return;
    }

    const options = buildOptionsFromFlags(flags);

    if (command === 'init') {
      const hasExplicitModelFlags = Boolean(
        flags.yes ||
          flags.preset ||
          flags.config ||
          flags['gemini-models'] ||
          flags['claude-models'] ||
          flags['codex-models']
      );

      // Run interactive wizard when terminal is interactive and `--yes` was not passed
      if (!flags.yes && process.stdin.isTTY && !hasExplicitModelFlags) {
        await runInteractiveInit(options);
        return;
      }

      if (!flags.yes && process.stdin.isTTY && !flags['gemini-models'] && !flags['claude-models'] && !flags['codex-models'] && !flags.preset && !flags.config) {
        await runInteractiveInit(options);
        return;
      }

      // If user explicitly ran `init` in an interactive TTY without `--yes` (even with `--target gemini`), launch wizard unless model flags + `--yes` were passed
      if (!flags.yes && process.stdin.isTTY) {
        await runInteractiveInit(options);
        return;
      }

      const target = options.explicitTarget || positional[1] || 'all';
      const result = generateAll(target, options);

      if (options.saveConfigPath) {
        const saveAbs = path.resolve(options.saveConfigPath);
        const profilesMap = {};
        for (const r of result.results) {
          profilesMap[r.target] = r.subagentProfiles;
        }
        fs.mkdirSync(path.dirname(saveAbs), { recursive: true });
        fs.writeFileSync(
          saveAbs,
          JSON.stringify(
            {
              schemaVersion: 1,
              targets: result.targetsInstalled,
              scope: result.scope,
              subagentProfiles: profilesMap
            },
            null,
            2
          ),
          'utf8'
        );
        result.savedConfigPath = saveAbs;
      }

      console.log(JSON.stringify(result, null, 2));
      return;
    }

    if (command === 'install' || command === 'gen') {
      const target = options.explicitTarget || positional[1] || 'all';
      const result = generateAll(target, options);
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    if (command === 'doctor' || command === 'status') {
      const report = runDoctor(options);
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    throw new Error(`Unknown command '${command}'. Run 'node bin/skill-gen.mjs help' for usage.`);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message }, null, 2));
    process.exit(1);
  }
}

// Execute CLI only when invoked directly as the main entrypoint
const currentScriptPath = fileURLToPath(import.meta.url);
const isDirectExecution =
  process.argv[1] &&
  fs.existsSync(process.argv[1]) &&
  fs.realpathSync(process.argv[1]) === fs.realpathSync(currentScriptPath);

if (isDirectExecution) {
  main();
}
