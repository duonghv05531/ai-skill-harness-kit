/**
 * Interactive Cross-Platform `init` Wizard for Multi-Agent Skill & Harness Setup
 *
 * Guides the user through target agent selection (`gemini`, `claude`, `codex`, or `all`),
 * installation scope (`global` vs `workspace`), and per-agent model + reasoning effort
 * selection across all 6 workflow skills (`/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`).
 * Built exclusively on Node's standard `node:readline/promises` so zero `npm install` step
 * is needed on a fresh machine.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {
  SUPPORTED_TARGETS,
  ROLE_SUBAGENTS,
  AGENT_MODEL_CATALOG,
  SKILL_ROLE_METADATA,
  MODEL_PRESETS,
  validateRoleProfile,
  formatProfileSummary
} from './adapters.mjs';
import { generateAll } from './generator.mjs';

/**
 * Create a buffered async prompt reader that supports both live interactive TTY input
 * and pre-piped multi-line streams without premature ERR_USE_AFTER_CLOSE errors.
 */
function createBufferedPrompter(input, output) {
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  const queuedLines = [];
  const pendingResolvers = [];
  let closed = false;

  rl.on('line', (line) => {
    if (pendingResolvers.length > 0) {
      const resolve = pendingResolvers.shift();
      resolve(line);
    } else {
      queuedLines.push(line);
    }
  });

  rl.on('close', () => {
    closed = true;
    while (pendingResolvers.length > 0) {
      const resolve = pendingResolvers.shift();
      resolve('');
    }
  });

  return {
    async ask(promptText, defaultValue = '') {
      output.write(promptText);
      let raw = '';
      if (queuedLines.length > 0) {
        raw = queuedLines.shift();
      } else if (!closed) {
        raw = await new Promise((resolve) => pendingResolvers.push(resolve));
      }
      const trimmed = String(raw || '').trim();
      return trimmed.length > 0 ? trimmed : defaultValue;
    },
    close() {
      rl.close();
    }
  };
}

/**
 * Resolve target selection from numbered menu or comma-separated names
 */
function parseTargetChoice(answer) {
  const normalized = answer.trim().toLowerCase();
  if (normalized === '1' || normalized === 'all') {
    return [...SUPPORTED_TARGETS];
  }
  if (normalized === '2') return ['gemini'];
  if (normalized === '3') return ['claude'];
  if (normalized === '4') return ['codex'];

  const parts = normalized
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return [...SUPPORTED_TARGETS];

  for (const p of parts) {
    if (!SUPPORTED_TARGETS.includes(p)) {
      throw new Error(`Unsupported target '${p}'. Choose 1-4 or comma-separated: gemini,claude,codex`);
    }
  }
  return parts;
}

/**
 * Prompt the user to choose a model (and optional effort) for a single skill on a specific agent
 */
async function askRoleProfileForAgent(prompter, out, target, role, baseProfile) {
  const catalog = AGENT_MODEL_CATALOG[target];
  const meta = SKILL_ROLE_METADATA[role];

  out.write(`\n  -> Skill /${role} (${meta.title} — ${meta.tierLabel})\n`);
  catalog.models.forEach((m, idx) => {
    const marker = m.id === baseProfile.model ? ' *default*' : '';
    out.write(`     [${idx + 1}] ${m.id.padEnd(13)} - ${m.description}${marker}\n`);
  });

  const modelHint = catalog.allowCustomModel
    ? `Enter 1-${catalog.models.length} or custom model ID`
    : `Enter 1-${catalog.models.length} or valid tier ID`;

  let selectedModel = baseProfile.model;
  while (true) {
    const ans = await prompter.ask(
      `     [${target}] Model for /${role} (${modelHint}) [${baseProfile.model}]: `,
      baseProfile.model
    );

    const num = Number(ans);
    const candidate =
      Number.isInteger(num) && num >= 1 && num <= catalog.models.length
        ? catalog.models[num - 1].id
        : ans;

    try {
      validateRoleProfile(target, role, { model: candidate, effort: baseProfile.effort });
      selectedModel = candidate;
      break;
    } catch (err) {
      out.write(`     [!] ${err.message}\n`);
    }
  }

  let selectedEffort = baseProfile.effort;
  if (catalog.efforts) {
    const effortMenu = catalog.efforts
      .map((eff, idx) => `[${idx + 1}] ${eff}${eff === baseProfile.effort ? '*' : ''}`)
      .join('  ');

    while (true) {
      const ans = await prompter.ask(
        `     [${target}] Effort for /${role} (${effortMenu}) [${baseProfile.effort}]: `,
        baseProfile.effort
      );
      const num = Number(ans);
      const candidate =
        Number.isInteger(num) && num >= 1 && num <= catalog.efforts.length
          ? catalog.efforts[num - 1]
          : ans.toLowerCase();

      try {
        validateRoleProfile(target, role, { model: selectedModel, effort: candidate });
        selectedEffort = candidate;
        break;
      } catch (err) {
        out.write(`     [!] ${err.message}\n`);
      }
    }
  }

  return { model: selectedModel, effort: selectedEffort };
}

/**
 * Run the interactive `skill-gen init` wizard and execute installation
 *
 * @param {object} initialOptions - Pre-parsed CLI options (used as defaults when provided)
 * @param {object} [io] - Optional `{ input, output }` streams for automated unit testing
 */
export async function runInteractiveInit(initialOptions = {}, io = {}) {
  const input = io.input || process.stdin;
  const output = io.output || process.stdout;
  const prompter = createBufferedPrompter(input, output);

  try {
    output.write(`\n========================================================================\n`);
    output.write(`  AI Skill & Two-Tier Harness Interactive Init (Gemini · Claude · Codex)\n`);
    output.write(`========================================================================\n\n`);

    // Step 1: Select target AI agent(s)
    let targets = null;
    if (initialOptions.explicitTarget) {
      targets = parseTargetChoice(initialOptions.explicitTarget);
    } else {
      output.write(`Step 1/3 — Select Target AI Agent(s):\n`);
      output.write(`  [1] all    — Install for Gemini (Antigravity) + Claude Code + OpenAI Codex (Default)\n`);
      output.write(`  [2] gemini — Google Gemini / Antigravity only\n`);
      output.write(`  [3] claude — Anthropic Claude Code only\n`);
      output.write(`  [4] codex  — OpenAI Codex CLI only\n`);
      output.write(`  (Or type comma-separated names, e.g. gemini,claude)\n`);

      while (!targets) {
        const rawTarget = await prompter.ask(`Select target [1]: `, '1');
        try {
          targets = parseTargetChoice(rawTarget);
        } catch (err) {
          output.write(`  [!] ${err.message}\n`);
        }
      }
    }

    // Step 2: Select installation scope (global vs workspace)
    let scope = initialOptions.scope || 'global';
    let workspaceDir = initialOptions.workspaceDir || process.cwd();
    if (!initialOptions.explicitScope) {
      output.write(`\nStep 2/3 — Select Installation Scope:\n`);
      output.write(`  [1] global    — Machine-wide user config (~/.gemini, ~/.claude, ~/.codex) (Default)\n`);
      output.write(`  [2] workspace — Project-local folder (commit skills & subagents to Git)\n`);
      const scopeAns = await prompter.ask(`Select scope [1]: `, '1');
      if (scopeAns === '2' || scopeAns.toLowerCase() === 'workspace') {
        scope = 'workspace';
        workspaceDir = await prompter.ask(
          `Target project directory [${workspaceDir}]: `,
          workspaceDir
        );
      } else {
        scope = 'global';
      }
    }

    // Step 3: Select model & effort preset or customize per-agent & per-skill
    output.write(`\nStep 3/3 — Configure Model & Reasoning Effort for the 6 Skills:\n`);
    output.write(`  [1] optimal — Recommended 3-Tier Pyramid (Best Intelligence-vs-Cost Balance) (Default)\n`);
    output.write(`  [2] max     — Maximum Intelligence Tier across all 6 skills (pro / opus:high / gpt-5.4:high)\n`);
    output.write(`  [3] economy — Token-Saver Tier (Lean models for orchestration, QA & merge)\n`);
    output.write(`  [4] custom  — Choose Model & Effort per Skill for each Agent (${targets.join(', ')})\n`);

    const modeAns = await prompter.ask(`Select model mode [1]: `, '1');
    let preset = 'optimal';
    const subagentProfiles = {};

    if (modeAns === '2' || modeAns.toLowerCase() === 'max') {
      preset = 'max';
    } else if (modeAns === '3' || modeAns.toLowerCase() === 'economy') {
      preset = 'economy';
    } else if (modeAns === '4' || modeAns.toLowerCase() === 'custom') {
      preset = 'optimal';
      for (const target of targets) {
        const catalog = AGENT_MODEL_CATALOG[target];
        output.write(`\n------------------------------------------------------------------------\n`);
        output.write(`  Customizing 6 Skills for ${catalog.displayName} (${target})\n`);
        output.write(`------------------------------------------------------------------------`);

        subagentProfiles[target] = {};
        for (const role of ROLE_SUBAGENTS) {
          const baseDefault = MODEL_PRESETS.optimal[target][role];
          subagentProfiles[target][role] = await askRoleProfileForAgent(
            prompter,
            output,
            target,
            role,
            baseDefault
          );
        }
      }
    }

    // Display final confirmation summary before writing files
    output.write(`\nSummary of Selected Model & Effort Profiles:\n`);
    for (const target of targets) {
      const previewProfiles = subagentProfiles[target] || MODEL_PRESETS[preset][target];
      const summaryItems = ROLE_SUBAGENTS.map(
        (r) => `/${r}=${formatProfileSummary(target, previewProfiles[r]).replace(/`/g, '')}`
      ).join(', ');
      output.write(`  - ${target.padEnd(6)}: ${summaryItems}\n`);
    }

    const finalOptions = {
      ...initialOptions,
      scope,
      workspaceDir,
      preset,
      subagentProfiles: Object.keys(subagentProfiles).length > 0 ? subagentProfiles : initialOptions.subagentProfiles
    };

    const result = generateAll(targets.join(','), finalOptions);

    if (initialOptions.saveConfigPath) {
      const saveAbs = path.resolve(initialOptions.saveConfigPath);
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
            targets,
            scope,
            subagentProfiles: profilesMap
          },
          null,
          2
        ),
        'utf8'
      );
      result.savedConfigPath = saveAbs;
    }

    output.write(`\n[OK] Installed ${ROLE_SUBAGENTS.length} skills + ${ROLE_SUBAGENTS.length} subagents for: ${targets.join(', ')}\n`);
    output.write(`\nPortable 1-line init command to replicate this exact setup on other machines:\n`);
    output.write(`  ${result.portableInitCommand}\n\n`);

    return result;
  } finally {
    prompter.close();
  }
}
