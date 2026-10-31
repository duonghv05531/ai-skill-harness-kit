/**
 * Multi-Agent Target Adapters for Gemini (Antigravity), Claude Code, and OpenAI Codex
 *
 * Defines directory layouts, tool mappings, per-agent model & reasoning effort catalogs,
 * presets (`optimal`, `max`, `economy`), custom per-agent CLI spec parsers, slash-command
 * wrappers, and hook formats so the same canonical skills and Two-Tier Harness can be
 * initialized on any device (Windows, macOS, Linux) with a single `init` command.
 */

import os from 'node:os';
import path from 'node:path';

export const SUPPORTED_TARGETS = ['gemini', 'claude', 'codex'];

export const WORKFLOW_SKILLS = ['ba', 'harness', 'po', 'dev', 'tester', 'merge'];

export const ROLE_SUBAGENTS = [...WORKFLOW_SKILLS];

export const PIPELINE_SUBAGENTS = ['dev', 'tester'];

export const GEMINI_SUBAGENT_PLUGIN_DIR_NAME = 'skill-harness-subagents';

/**
 * Supported model and effort catalog per AI coding platform used by `skill-gen init`
 */
export const AGENT_MODEL_CATALOG = {
  gemini: {
    displayName: 'Google Gemini / Antigravity',
    models: [
      { id: 'pro', description: 'MODEL_TIER_PRO — Deep Architecture & Complex Coding (Gemini Pro / Argon High)' },
      { id: 'flash', description: 'MODEL_TIER_FLASH — Fast Smart QA, Merge & Orchestration (Gemini Flash / Argon Medium)' },
      { id: 'flash_lite', description: 'MODEL_TIER_FLASH_LITE — Ultra-Light / Lowest Cost' },
      { id: 'inherit', description: 'MODEL_TIER_UNSPECIFIED — Inherit active Main Chat model' }
    ],
    efforts: null,
    allowCustomModel: false
  },
  claude: {
    displayName: 'Anthropic Claude Code',
    models: [
      { id: 'opus', description: 'Claude Opus — Deepest Architectural Reasoning & Multi-File Coding' },
      { id: 'sonnet', description: 'Claude Sonnet — Balanced Systems Engineering & Safe Merge' },
      { id: 'haiku', description: 'Claude Haiku — High-Speed Adversarial QA & Lean Orchestration' },
      { id: 'inherit', description: 'Inherit active Claude Code session model' }
    ],
    efforts: ['low', 'medium', 'high', 'max'],
    allowCustomModel: true
  },
  codex: {
    displayName: 'OpenAI Codex CLI',
    models: [
      { id: 'gpt-5.4', description: 'GPT-5.4 — Frontier Reasoning & Complex Multi-File Coding' },
      { id: 'gpt-5.4-mini', description: 'GPT-5.4-mini — Fast, Cost-Efficient QA & Backlog Orchestration' },
      { id: 'gpt-5.3-codex', description: 'GPT-5.3-Codex — Codex-Specialized Engineering Model' },
      { id: 'o3', description: 'o3 — Deep Analytical Reasoning' },
      { id: 'o4-mini', description: 'o4-mini — Fast Compact Reasoning' }
    ],
    efforts: ['low', 'medium', 'high'],
    allowCustomModel: true
  }
};

/**
 * Role metadata used across subagent manifests, prompts, wizards, and documentation tables
 */
export const SKILL_ROLE_METADATA = {
  ba: {
    title: 'Senior Business & System Analyst',
    tierLabel: 'Tier 1 — Deep Architecture',
    description:
      'Senior Business & System Analyst subagent authoring PRD.md, SRS.md, parallel file-ownership boundaries, and interactive Archify diagrams.',
    rationale:
      'Deep architectural reasoning, domain ERD modeling, and conflict-free parallel boundary design.'
  },
  harness: {
    title: 'Principal Repo Harness Architect',
    tierLabel: 'Tier 2 — Systems Engineering',
    description:
      'Principal Repo Harness Architect subagent detecting project tech stacks and generating custom quality-gate scripts in <parentRoot>/harness/.',
    rationale:
      'Accurate stack inspection and deterministic gate script authoring (worktree-setup, custom-check, smoke-test).'
  },
  po: {
    title: 'Focused Project / Product Owner',
    tierLabel: 'Tier 3 — Lean Orchestration',
    description:
      'Focused Project Owner subagent slicing BACKLOG.md waves from SRS.md, activating tickets in state.json, and verifying receipts via gate po-approve.',
    rationale:
      'Fast, low-cost structured backlog slicing, state activation, and deterministic receipt review.'
  },
  dev: {
    title: 'Senior Worktree Software Developer',
    tierLabel: 'Tier 1 — Deep Coding',
    description:
      'Senior Software Developer subagent implementing ACTIVE tickets inside isolated Parent-Folder Git Worktrees (<parentRoot>/worktrees/<TICKET_ID>) and running gate dev-done.',
    rationale:
      'High-accuracy multi-file feature implementation, safe DB migrations, unit tests, and OpenAPI/Swagger updates.'
  },
  tester: {
    title: 'Senior QA & System Tester',
    tierLabel: 'Tier 3 — Fast Adversarial QA',
    description:
      'Senior QA & System Tester subagent verifying READY_FOR_TEST worktrees across 4 testing layers and running gate test-pass or test-fail.',
    rationale:
      'Fast, cost-efficient 4-layer QA execution with high adversarial rigor for edge-case and negative tests.'
  },
  merge: {
    title: 'Release & Worktree Integration Engineer',
    tierLabel: 'Tier 2 — Safe Integration',
    description:
      'Release & Integration Engineer subagent merging READY_TO_MERGE worktree branches into <repoRoot>, resolving shared touchpoint conflicts, and running post-merge tests.',
    rationale:
      'Balanced speed and code accuracy for resolving sharedTouchpointFiles conflicts and verifying integration builds.'
  }
};

/**
 * Optimal default model + reasoning effort tiers per target platform across all 6 workflow skills
 */
export const DEFAULT_SUBAGENT_PROFILES = {
  gemini: {
    ba: { model: 'pro', effort: 'high' },
    harness: { model: 'pro', effort: 'high' },
    po: { model: 'flash', effort: 'low' },
    dev: { model: 'pro', effort: 'high' },
    tester: { model: 'flash', effort: 'medium' },
    merge: { model: 'flash', effort: 'medium' }
  },
  claude: {
    ba: { model: 'opus', effort: 'high' },
    harness: { model: 'sonnet', effort: 'high' },
    po: { model: 'haiku', effort: 'medium' },
    dev: { model: 'opus', effort: 'high' },
    tester: { model: 'haiku', effort: 'high' },
    merge: { model: 'sonnet', effort: 'medium' }
  },
  codex: {
    ba: { model: 'gpt-5.4', effort: 'high' },
    harness: { model: 'gpt-5.4', effort: 'medium' },
    po: { model: 'gpt-5.4-mini', effort: 'medium' },
    dev: { model: 'gpt-5.4', effort: 'high' },
    tester: { model: 'gpt-5.4-mini', effort: 'high' },
    merge: { model: 'gpt-5.4', effort: 'medium' }
  }
};

/**
 * Built-in presets selectable via `--preset <optimal|max|economy>` or the interactive `init` wizard
 */
export const MODEL_PRESETS = {
  optimal: DEFAULT_SUBAGENT_PROFILES,
  max: {
    gemini: {
      ba: { model: 'pro', effort: 'high' },
      harness: { model: 'pro', effort: 'high' },
      po: { model: 'pro', effort: 'high' },
      dev: { model: 'pro', effort: 'high' },
      tester: { model: 'pro', effort: 'high' },
      merge: { model: 'pro', effort: 'high' }
    },
    claude: {
      ba: { model: 'opus', effort: 'high' },
      harness: { model: 'opus', effort: 'high' },
      po: { model: 'opus', effort: 'high' },
      dev: { model: 'opus', effort: 'high' },
      tester: { model: 'opus', effort: 'high' },
      merge: { model: 'opus', effort: 'high' }
    },
    codex: {
      ba: { model: 'gpt-5.4', effort: 'high' },
      harness: { model: 'gpt-5.4', effort: 'high' },
      po: { model: 'gpt-5.4', effort: 'high' },
      dev: { model: 'gpt-5.4', effort: 'high' },
      tester: { model: 'gpt-5.4', effort: 'high' },
      merge: { model: 'gpt-5.4', effort: 'high' }
    }
  },
  economy: {
    gemini: {
      ba: { model: 'flash', effort: 'medium' },
      harness: { model: 'flash', effort: 'medium' },
      po: { model: 'flash_lite', effort: 'low' },
      dev: { model: 'pro', effort: 'high' },
      tester: { model: 'flash', effort: 'medium' },
      merge: { model: 'flash_lite', effort: 'low' }
    },
    claude: {
      ba: { model: 'sonnet', effort: 'medium' },
      harness: { model: 'haiku', effort: 'high' },
      po: { model: 'haiku', effort: 'low' },
      dev: { model: 'sonnet', effort: 'high' },
      tester: { model: 'haiku', effort: 'medium' },
      merge: { model: 'haiku', effort: 'medium' }
    },
    codex: {
      ba: { model: 'gpt-5.4', effort: 'medium' },
      harness: { model: 'gpt-5.4-mini', effort: 'medium' },
      po: { model: 'gpt-5.4-mini', effort: 'low' },
      dev: { model: 'gpt-5.4', effort: 'medium' },
      tester: { model: 'gpt-5.4-mini', effort: 'medium' },
      merge: { model: 'gpt-5.4-mini', effort: 'low' }
    }
  }
};

/**
 * Validate a single role's `{ model, effort }` profile against the target agent's constraints
 */
export function validateRoleProfile(target, role, profile) {
  const catalog = AGENT_MODEL_CATALOG[target];
  if (!catalog) {
    throw new Error(`Unsupported target '${target}'.`);
  }
  if (!ROLE_SUBAGENTS.includes(role)) {
    throw new Error(`Unknown skill role '${role}'. Valid skills: ${ROLE_SUBAGENTS.join(', ')}`);
  }
  if (!profile.model || typeof profile.model !== 'string') {
    throw new Error(`Missing model for skill '${role}' on target '${target}'.`);
  }

  if (!catalog.allowCustomModel) {
    const validIds = catalog.models.map((m) => m.id);
    if (!validIds.includes(profile.model)) {
      throw new Error(
        `Invalid model '${profile.model}' for '${role}' on ${target}. Allowed values for Gemini/Antigravity: ${validIds.join(', ')}`
      );
    }
  }

  if (catalog.efforts && profile.effort) {
    if (!catalog.efforts.includes(profile.effort)) {
      throw new Error(
        `Invalid effort '${profile.effort}' for '${role}' on ${target}. Allowed efforts: ${catalog.efforts.join(', ')}`
      );
    }
  }
}

/**
 * Parse a compact per-agent CLI model mapping string such as:
 * - Gemini: `"ba=pro,harness=pro,po=flash_lite,dev=pro,tester=flash,merge=flash"`
 * - Claude: `"ba=opus:high,dev=opus:high,tester=haiku:high,po=haiku:low"`
 * - Codex:  `"ba=gpt-5.4:high,tester=gpt-5.4-mini:high,po=gpt-5.4-mini:low"`
 */
export function parseTargetModelSpec(target, specString) {
  if (!specString || typeof specString !== 'string') return {};
  const parsed = {};
  const entries = specString
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const eqIdx = entry.indexOf('=');
    if (eqIdx === -1) {
      throw new Error(
        `Invalid model mapping '${entry}' for ${target}. Expected format: '<skill>=<model>' or '<skill>=<model>:<effort>' (e.g. 'dev=opus:high').`
      );
    }
    const role = entry.slice(0, eqIdx).trim().toLowerCase();
    const rawValue = entry.slice(eqIdx + 1).trim();
    if (!ROLE_SUBAGENTS.includes(role)) {
      throw new Error(`Unknown skill '${role}' in --${target}-models. Valid skills: ${ROLE_SUBAGENTS.join(', ')}`);
    }

    // Split optional `:effort` or `@effort` suffix
    const sepMatch = rawValue.match(/^([^:@]+)[:@]([^:@]+)$/);
    const model = sepMatch ? sepMatch[1].trim() : rawValue;
    const effort = sepMatch ? sepMatch[2].trim().toLowerCase() : undefined;

    if (!model) {
      throw new Error(`Empty model value in '${entry}' for ${target}.`);
    }

    parsed[role] = {
      model,
      ...(effort ? { effort } : {})
    };
  }

  return parsed;
}

/**
 * Format a resolved profiles map for a single target back into a compact `--<target>-models` spec string
 */
export function formatTargetModelSpec(target, profilesForTarget) {
  const hasEffort = Boolean(AGENT_MODEL_CATALOG[target]?.efforts);
  return ROLE_SUBAGENTS.map((role) => {
    const p = profilesForTarget[role];
    return hasEffort ? `${role}=${p.model}:${p.effort}` : `${role}=${p.model}`;
  }).join(',');
}

/**
 * Build a reproducible 1-line `init` command that replicates the exact selected configuration on another machine
 */
export function buildPortableInitCommand({
  targets = SUPPORTED_TARGETS,
  scope = 'global',
  dest = null,
  profilesByTarget = {},
  skipArchify = false
}) {
  const targetArg = targets.length === SUPPORTED_TARGETS.length ? 'all' : targets.join(',');
  const parts = [`node ./bin/skill-gen.mjs init`, `--target ${targetArg}`, `--yes`];

  if (scope === 'workspace') {
    parts.push(`--scope workspace`);
    if (dest) {
      parts.push(`--dest "${dest}"`);
    }
  }

  for (const t of targets) {
    if (profilesByTarget[t]) {
      const spec = formatTargetModelSpec(t, profilesByTarget[t]);
      parts.push(`--${t}-models "${spec}"`);
    }
  }

  if (skipArchify) {
    parts.push(`--skip-archify`);
  }

  return parts.join(' ');
}

/**
 * Resolve subagent model + effort profiles for all 6 skills on a target, merging presets,
 * config objects, compact `--<target>-models` specs, and individual role flags.
 */
export function resolveSubagentProfiles(target, options = {}) {
  const presetName = (options.preset || 'optimal').toLowerCase();
  const presetTable = MODEL_PRESETS[presetName];
  if (!presetTable) {
    throw new Error(
      `Unknown preset '${options.preset}'. Supported presets: ${Object.keys(MODEL_PRESETS).join(', ')}`
    );
  }

  const defaults = presetTable[target];
  if (!defaults) {
    throw new Error(`Unsupported target '${target}' for subagent profiles.`);
  }

  const customFromConfig = options.subagentProfiles?.[target] || {};
  const customFromSpec = parseTargetModelSpec(target, options[`${target}Models`]);
  const perTargetRoleOverrides = options.targetRoleOverrides?.[target] || {};

  const resolved = {};
  for (const role of ROLE_SUBAGENTS) {
    const globalModelFlag = options[`${role}Model`];
    const globalEffortFlag = options[`${role}Effort`];
    const targetSpecificModel = perTargetRoleOverrides[role]?.model;
    const targetSpecificEffort = perTargetRoleOverrides[role]?.effort;

    const model =
      targetSpecificModel ||
      customFromSpec[role]?.model ||
      globalModelFlag ||
      customFromConfig[role]?.model ||
      defaults[role].model;

    const effort =
      targetSpecificEffort ||
      customFromSpec[role]?.effort ||
      globalEffortFlag ||
      customFromConfig[role]?.effort ||
      defaults[role].effort;

    resolved[role] = { model, effort };
    validateRoleProfile(target, role, resolved[role]);
  }

  return resolved;
}

/**
 * Format a concise human-readable summary of a subagent's model and effort profile
 */
export function formatProfileSummary(target, profile) {
  if (target === 'gemini') {
    return `model \`${profile.model}\``;
  }
  if (target === 'codex') {
    return `model \`${profile.model}\` (\`reasoning_effort: ${profile.effort}\`)`;
  }
  return `model \`${profile.model}\` (\`effort: ${profile.effort}\`)`;
}

/**
 * Resolve target configuration paths for a specific AI coding agent
 *
 * @param {'gemini'|'claude'|'codex'} target - Target agent identifier
 * @param {object} options - Resolution options
 * @param {'global'|'workspace'} [options.scope='global'] - Installation scope
 * @param {string} [options.homeDir] - Override OS home directory (used for testing or custom devices)
 * @param {string} [options.workspaceDir] - Target workspace directory when scope === 'workspace'
 */
export function resolveTargetLayout(target, options = {}) {
  const scope = options.scope || 'global';
  const homeDir = path.resolve(options.homeDir || os.homedir());
  const workspaceDir = path.resolve(options.workspaceDir || process.cwd());
  const subagentProfiles = resolveSubagentProfiles(target, options);

  if (target === 'gemini') {
    const baseDir =
      scope === 'workspace'
        ? path.join(workspaceDir, '.agents')
        : path.join(homeDir, '.gemini', 'config');
    const skillsDir = path.join(baseDir, 'skills');
    const subagentPluginDir = path.join(baseDir, 'plugins', GEMINI_SUBAGENT_PLUGIN_DIR_NAME);
    const subagentPluginManifest = path.join(subagentPluginDir, 'plugin.json');
    const agentsDir = path.join(subagentPluginDir, 'agents');
    const harnessDir = path.join(baseDir, 'harness');
    const rulesFile =
      scope === 'workspace'
        ? path.join(workspaceDir, 'GEMINI.md')
        : path.join(baseDir, 'GEMINI.md');

    return {
      target: 'gemini',
      displayName: 'Google Gemini / Antigravity',
      scope,
      baseDir,
      skillsDir,
      agentsDir,
      subagentPluginDir,
      subagentPluginManifest,
      commandsDir: null,
      promptsDir: null,
      harnessDir,
      harnessBin: path.join(harnessDir, 'bin', 'harness.mjs'),
      hookBin: path.join(harnessDir, 'bin', 'pre-tool-hook.mjs'),
      archifyBin: path.join(skillsDir, 'archify', 'bin', 'archify.mjs'),
      hooksConfigFile: path.join(baseDir, 'hooks.json'),
      rulesFile,
      askToolPlaceholder: '`ask_question`',
      subagentProfiles
    };
  }

  if (target === 'claude') {
    const baseDir =
      scope === 'workspace'
        ? path.join(workspaceDir, '.claude')
        : path.join(homeDir, '.claude');
    const skillsDir = path.join(baseDir, 'skills');
    const agentsDir = path.join(baseDir, 'agents');
    const commandsDir = path.join(baseDir, 'commands');
    const harnessDir = path.join(baseDir, 'harness');
    const rulesFile =
      scope === 'workspace'
        ? path.join(workspaceDir, 'CLAUDE.md')
        : path.join(baseDir, 'CLAUDE.md');

    return {
      target: 'claude',
      displayName: 'Anthropic Claude Code',
      scope,
      baseDir,
      skillsDir,
      agentsDir,
      subagentPluginDir: null,
      subagentPluginManifest: null,
      commandsDir,
      promptsDir: null,
      harnessDir,
      harnessBin: path.join(harnessDir, 'bin', 'harness.mjs'),
      hookBin: path.join(harnessDir, 'bin', 'pre-tool-hook.mjs'),
      archifyBin: path.join(skillsDir, 'archify', 'bin', 'archify.mjs'),
      hooksConfigFile: path.join(baseDir, 'settings.json'),
      rulesFile,
      askToolPlaceholder: '`AskUserQuestion` (or concise clarifying questions)',
      subagentProfiles
    };
  }

  if (target === 'codex') {
    const baseDir =
      scope === 'workspace'
        ? path.join(workspaceDir, '.codex')
        : path.join(homeDir, '.codex');
    const skillsDir = path.join(baseDir, 'skills');
    const agentsDir = path.join(baseDir, 'agents');
    const promptsDir = path.join(baseDir, 'prompts');
    const harnessDir = path.join(baseDir, 'harness');
    const rulesFile =
      scope === 'workspace'
        ? path.join(workspaceDir, 'AGENTS.md')
        : path.join(baseDir, 'AGENTS.md');

    return {
      target: 'codex',
      displayName: 'OpenAI Codex CLI',
      scope,
      baseDir,
      skillsDir,
      agentsDir,
      subagentPluginDir: null,
      subagentPluginManifest: null,
      commandsDir: null,
      promptsDir,
      harnessDir,
      harnessBin: path.join(harnessDir, 'bin', 'harness.mjs'),
      hookBin: path.join(harnessDir, 'bin', 'pre-tool-hook.mjs'),
      archifyBin: path.join(skillsDir, 'archify', 'bin', 'archify.mjs'),
      hooksConfigFile: null,
      rulesFile,
      askToolPlaceholder: 'structured clarifying questions',
      subagentProfiles
    };
  }

  throw new Error(`Unsupported target '${target}'. Supported targets: ${SUPPORTED_TARGETS.join(', ')}`);
}

/**
 * Strip YAML frontmatter from a SKILL.md content string
 */
export function stripYamlFrontmatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, '');
}

/**
 * Build the Antigravity plugin manifest (`plugin.json`) that exposes all 6 role subagents (`agents/*.md`).
 * Uses only documented top-level manifest keys (`name`, `displayName`, `description`, `version`).
 */
export function buildGeminiSubagentPluginManifest(layout) {
  const summaryParts = ROLE_SUBAGENTS.map((role) => `${role}=${layout.subagentProfiles[role].model}`);
  return {
    name: GEMINI_SUBAGENT_PLUGIN_DIR_NAME,
    displayName: 'Skill Harness Role Subagents (6-Skill Optimal Tiers)',
    description: `Role-specialized workflow subagents with optimal automatic model tiering (${summaryParts.join(', ')}).`,
    version: '1.4.0'
  };
}

/**
 * Build a Markdown table summarizing the 6-Skill Optimal Model & Effort Policy for ENGINEERING_RULES.md
 */
export function buildModelPolicyTable(layout) {
  const rows = [
    `| Skill | Subagent | Assigned Tier | Model & Effort Rule (${layout.displayName}) | Optimal Rationale |`,
    `| :--- | :--- | :--- | :--- | :--- |`
  ];
  for (const role of ROLE_SUBAGENTS) {
    const meta = SKILL_ROLE_METADATA[role];
    const summary = formatProfileSummary(layout.target, layout.subagentProfiles[role]);
    rows.push(`| \`/${role}\` | \`${role}\` | ${meta.tierLabel} | ${summary} | ${meta.rationale} |`);
  }
  return rows.join('\n');
}

/**
 * Build a single-role delegation instruction line tailored to Gemini, Claude Code, or Codex
 */
function buildSingleRoleDelegationCall(role, layout, taskDetail) {
  const profile = layout.subagentProfiles[role];
  const meta = SKILL_ROLE_METADATA[role];
  const profileSummary = formatProfileSummary(layout.target, profile);
  const normalizedAgentsDir = layout.agentsDir.replace(/\\/g, '/');

  if (layout.target === 'gemini') {
    return `If \`${role}\` is listed in \`Available subagents\`, call \`invoke_subagent\` with \`TypeName: "${role}"\` and \`Model: "inherit"\` (uses \`model: ${profile.model}\` from \`${role}.md\`). Otherwise (before IDE reload), call \`invoke_subagent\` with \`TypeName: "self"\`, \`Model: "${profile.model}"\`, \`Role: "${meta.title}"\`, passing \`[SUBAGENT_ROLE: ${role}]\` + ${taskDetail} in \`Prompt\`.`;
  }

  return `Delegate ${taskDetail} to the \`${role}\` subagent (\`${normalizedAgentsDir}/${role}.md\`, pre-configured with ${profileSummary}), passing \`[SUBAGENT_ROLE: ${role}]\`.`;
}

/**
 * Build Section 0 (`Model & Effort Policy`) for any of the 6 workflow skills
 */
export function buildSkillExecutionModeSection(role, layout) {
  const profile = layout.subagentProfiles[role];
  const meta = SKILL_ROLE_METADATA[role];
  const profileSummary = formatProfileSummary(layout.target, profile);

  if (role === 'dev') {
    const testerSummary = formatProfileSummary(layout.target, layout.subagentProfiles.tester);
    return [
      `## 0. Model & Effort Policy: \`/dev\` (${meta.tierLabel} — ${profileSummary})`,
      ``,
      `Check whether your prompt/context contains \`[SUBAGENT_ROLE: dev]\`:`,
      ``,
      `- **A. Worker Mode (\`[SUBAGENT_ROLE: dev]\` IS present)**:`,
      `  - You are already running inside the dedicated \`dev\` worker subagent (${profileSummary}).`,
      `  - Execute **Steps 1–4** below directly inside \`<parentRoot>/worktrees/<TICKET_ID>/\` using your file and command tools.`,
      `  - Do **NOT** call interactive question tools or spawn nested \`dev\` / \`tester\` subagents from inside Worker Mode. Once \`node "{{HARNESS_BIN}}" gate dev-done <TICKET_ID>\` passes (\`READY_FOR_TEST\`), return a concise summary with the receipt path so the parent orchestrator immediately launches \`tester\`.`,
      `- **B. Main-Session Orchestrator Mode (\`[SUBAGENT_ROLE: dev]\` is NOT present — user invoked \`/dev\` in Main Chat)**:`,
      `  - If multiple parallel tickets are \`[ACTIVE]\` and the user did not specify a \`<TICKET_ID>\`, clarify which ticket to run using {{ASK_TOOL}} first.`,
      `  - Then automatically run the model/effort-switched Subagent Pipeline (\`{{AGENTS_DIR}}\`) so \`dev\` executes on ${profileSummary} and **automatically chains straight into \`tester\`** on ${testerSummary}:`,
      `{{SUBAGENT_PIPELINE_GUIDE}}`
    ].join('\n');
  }

  if (role === 'ba') {
    const delegationLine = buildSingleRoleDelegationCall(
      'ba',
      layout,
      'the clarified requirements, target operating mode, and `<parentRoot>` paths'
    );
    return [
      `## 0. Model & Effort Policy: \`/ba\` (${meta.tierLabel} — ${profileSummary})`,
      ``,
      `Check whether your prompt/context contains \`[SUBAGENT_ROLE: ba]\`:`,
      ``,
      `- **A. Worker Mode (\`[SUBAGENT_ROLE: ba]\` IS present)**:`,
      `  - You are running inside the dedicated \`ba\` subagent (${profileSummary}).`,
      `  - Execute specification authoring (\`PRD.md\`, \`SRS.md\`, Parallel Wave file boundaries) and \`archify\` diagram generation directly without calling interactive question tools or spawning nested subagents, then return the generated file paths and summary.`,
      `- **B. Main-Session Mode (\`[SUBAGENT_ROLE: ba]\` is NOT present — user invoked \`/ba\` in Main Chat)**:`,
      `  - **Clarification First**: If requirements are ambiguous (e.g., Mode 1 Greenfield kickoff), interview the user in Main Chat using {{ASK_TOOL}} first (worker subagents do not expose interactive prompt UI).`,
      `  - **Mode 6 (End-to-End Task Dispatch)**: Keep orchestration in Main Chat so you can chain \`dev\` ({{DEV_PROFILE_SUMMARY}}) ➔ \`tester\` ({{TESTER_PROFILE_SUMMARY}}) directly.`,
      `  - **All Specification & Diagram Synthesis (Modes 1–5)**: ${delegationLine}`
    ].join('\n');
  }

  if (role === 'harness') {
    const delegationLine = buildSingleRoleDelegationCall(
      'harness',
      layout,
      'the target repository path and stack preferences'
    );
    return [
      `## 0. Model & Effort Policy: \`/harness\` (${meta.tierLabel} — ${profileSummary})`,
      ``,
      `Check whether your prompt/context contains \`[SUBAGENT_ROLE: harness]\`:`,
      ``,
      `- **A. Worker Mode (\`[SUBAGENT_ROLE: harness]\` IS present)**:`,
      `  - You are running inside the dedicated \`harness\` subagent (${profileSummary}).`,
      `  - Execute **Steps 1–4** below directly (run \`harness.mjs detect\` & \`init\`, tailor \`harness.config.json\`, \`worktree-setup.mjs\`, \`custom-check.mjs\`, and \`smoke-test.mjs\`, and verify them) without calling interactive question tools or spawning nested subagents, then return the diagnosis summary and generated file paths.`,
      `- **B. Main-Session Mode (\`[SUBAGENT_ROLE: harness]\` is NOT present — user invoked \`/harness\` in Main Chat)**:`,
      `  - If optional stack choices require user confirmation, ask via {{ASK_TOOL}} in Main Chat first.`,
      `  - Delegate Repo Harness detection, script authoring, and verification to the dedicated \`harness\` worker: ${delegationLine}`
    ].join('\n');
  }

  if (role === 'po') {
    const delegationLine = buildSingleRoleDelegationCall(
      'po',
      layout,
      'the requested PO mode (Backlog Slicing, Wave Activation, or QA Acceptance) and target ticket/wave'
    );
    return [
      `## 0. Model & Effort Policy: \`/po\` (${meta.tierLabel} — ${profileSummary})`,
      ``,
      `Check whether your prompt/context contains \`[SUBAGENT_ROLE: po]\`:`,
      ``,
      `- **A. Worker Mode (\`[SUBAGENT_ROLE: po]\` IS present)**:`,
      `  - You are running inside the lean, fast \`po\` subagent (${profileSummary}).`,
      `  - Execute **Mode 1, Mode 2, or Mode 3** directly (\`BACKLOG.md\` wave slicing, \`ticket-register\`, \`activate\`, \`tickets/<TICKET_ID>.md\`, \`CURRENT_TICKET.md\`, or \`gate po-approve\` / \`po-reject\`) without spawning nested subagents, then return the updated backlog table and receipt paths.`,
      `- **B. Main-Session Mode (\`[SUBAGENT_ROLE: po]\` is NOT present — user invoked \`/po\` in Main Chat)**:`,
      `  - **Mode 4 (Autonomous Subagent Pipeline Dispatch)**: Keep orchestration in Main Chat so you can spawn \`dev\` ({{DEV_PROFILE_SUMMARY}}) ➔ \`tester\` ({{TESTER_PROFILE_SUMMARY}}) directly.`,
      `  - **Modes 1–3 (Backlog Slicing, Wave Activation & QA Acceptance)**: ${delegationLine}`
    ].join('\n');
  }

  if (role === 'tester') {
    const delegationLine = buildSingleRoleDelegationCall('tester', layout, 'the target `<TICKET_ID>`');
    return [
      `## 0. Model & Effort Policy: \`/tester\` (${meta.tierLabel} — ${profileSummary})`,
      ``,
      `Check whether your prompt/context contains \`[SUBAGENT_ROLE: tester]\`:`,
      ``,
      `- **A. Worker Mode (\`[SUBAGENT_ROLE: tester]\` IS present)**:`,
      `  - You are running inside the dedicated \`tester\` subagent (${profileSummary}).`,
      `  - Execute **Steps 1–3** (all 4 QA layers + \`gate test-pass\` / \`gate test-fail\`) directly inside \`<parentRoot>/worktrees/<TICKET_ID>/\` without spawning nested subagents, then return the QA verdict (\`READY_TO_MERGE\` or \`BUG_FOUND\`) and receipt path.`,
      `- **B. Main-Session Mode (\`[SUBAGENT_ROLE: tester]\` is NOT present — user invoked \`/tester\` in Main Chat)**:`,
      `  - If multiple tickets are in \`READY_FOR_TEST\` and none was specified, ask the user via {{ASK_TOOL}} first.`,
      `  - Delegate 4-layer QA verification to the dedicated \`tester\` worker: ${delegationLine}`
    ].join('\n');
  }

  const delegationLine = buildSingleRoleDelegationCall(
    'merge',
    layout,
    'the target `READY_TO_MERGE` ticket ID(s)'
  );
  return [
    `## 0. Model & Effort Policy: \`/merge\` (${meta.tierLabel} — ${profileSummary})`,
    ``,
    `Check whether your prompt/context contains \`[SUBAGENT_ROLE: merge]\`:`,
    ``,
    `- **A. Worker Mode (\`[SUBAGENT_ROLE: merge]\` IS present)**:`,
    `  - You are running inside the dedicated \`merge\` subagent (${profileSummary}).`,
    `  - Execute **Steps 1–4** directly (\`harness.mjs merge\`, \`sharedTouchpointFiles\` conflict resolution, full post-merge integration tests in \`<repoRoot>\`, and status update to \`READY_FOR_REVIEW [MERGED]\`) without spawning nested subagents, then return the merged commit hash and receipt path.`,
    `- **B. Main-Session Mode (\`[SUBAGENT_ROLE: merge]\` is NOT present — user invoked \`/merge\` in Main Chat)**:`,
    `  - Delegate worktree branch merging, conflict resolution, and post-merge integration verification to the dedicated \`merge\` worker: ${delegationLine}`
  ].join('\n');
}

/**
 * Build a Custom Subagent markdown file (`agents/<role>.md`) for any of the 6 workflow roles
 * with native model + reasoning effort frontmatter for Gemini, Claude Code, or Codex.
 */
export function buildRoleSubagentMarkdown(role, renderedSkillMarkdown, skillDir, layout) {
  const body = stripYamlFrontmatter(renderedSkillMarkdown);
  const normalizedSkillDir = skillDir.replace(/\\/g, '/');
  const rewrittenBody = body
    .replace(/\(\.\/resources\//g, `(${normalizedSkillDir}/resources/`)
    .replace(/\(\.\/references\//g, `(${normalizedSkillDir}/references/`);

  const profile = layout.subagentProfiles[role];
  const meta = SKILL_ROLE_METADATA[role];
  const description = meta.description;

  let frontmatterLines = [];
  if (layout.target === 'gemini') {
    frontmatterLines = [
      `---`,
      `name: ${role}`,
      `description: ${JSON.stringify(description)}`,
      `subagent: true`,
      `model: ${profile.model}`,
      `tools:`,
      `  - read_file`,
      `  - write_file`,
      `  - edit_file`,
      `  - run_command`,
      `  - manage_task`,
      `  - send_message`,
      `  - search_web`,
      `---`
    ];
  } else if (layout.target === 'claude') {
    frontmatterLines = [
      `---`,
      `name: ${role}`,
      `description: ${JSON.stringify(description)}`,
      `model: ${profile.model}`,
      `effort: ${profile.effort}`,
      `---`
    ];
  } else {
    frontmatterLines = [
      `---`,
      `name: ${role}`,
      `description: ${JSON.stringify(description)}`,
      `model: ${profile.model}`,
      `reasoning_effort: ${profile.effort}`,
      `---`
    ];
  }

  return [
    ...frontmatterLines,
    ``,
    `[SUBAGENT_ROLE: ${role}]`,
    `You are executing directly inside the dedicated \`${role}\` worker subagent (${meta.tierLabel} — ${formatProfileSummary(layout.target, profile)}).`,
    `Execute your assigned \`/${role}\` workflow directly using your file and shell tools without calling interactive question UI tools or spawning nested subagents, then return a concise structured summary and file/receipt paths to the parent orchestrator.`,
    ``,
    rewrittenBody
  ].join('\n');
}

/**
 * Build target-specific instructions for orchestrating the automatic `dev` -> `tester` subagent pipeline
 */
export function buildSubagentPipelineGuide(layout) {
  const devSummary = formatProfileSummary(layout.target, layout.subagentProfiles.dev);
  const testerSummary = formatProfileSummary(layout.target, layout.subagentProfiles.tester);
  const normalizedAgentsDir = layout.agentsDir.replace(/\\/g, '/');

  if (layout.target === 'gemini') {
    const devTier = layout.subagentProfiles.dev.model;
    const testerTier = layout.subagentProfiles.tester.model;
    return [
      `1. **Spawn \`dev\` Subagent (${devSummary})**:`,
      `   - If \`dev\` is listed in \`Available subagents\`, call \`invoke_subagent\` with \`TypeName: "dev"\` and \`Model: "inherit"\` (uses \`model: ${devTier}\` from \`dev.md\`). Otherwise, call \`invoke_subagent\` with \`TypeName: "self"\`, \`Model: "${devTier}"\`, \`Role: "Senior Worktree Developer"\`, passing \`[SUBAGENT_ROLE: dev]\` + \`<TICKET_ID>\` in \`Prompt\`.`,
      `2. **Auto-Chain \`tester\` Subagent (${testerSummary})**:`,
      `   - As soon as \`dev\` completes and \`gate dev-done\` transitions \`<TICKET_ID>\` to \`READY_FOR_TEST\` (\`nextAutoAction.role === "tester"\`), **immediately and automatically** call \`invoke_subagent\` with \`TypeName: "tester"\` (\`Model: "inherit"\`) if listed in \`Available subagents\`, or \`TypeName: "self"\` with \`Model: "${testerTier}"\`, \`Role: "Senior QA System Tester"\`, passing \`[SUBAGENT_ROLE: tester]\` + \`<TICKET_ID>\` in \`Prompt\`.`,
      `3. **Self-Healing Repair Loop (Max 2 Rounds)**:`,
      `   - If \`tester\` returns \`BUG_FOUND\` (\`gate test-fail\`), automatically re-invoke \`dev\` (\`Model: "${devTier}"\`) with the Bug Report to fix the defects, then re-invoke \`tester\` (\`Model: "${testerTier}"\`) until \`READY_TO_MERGE\`.`
    ].join('\n');
  }

  if (layout.target === 'claude') {
    return [
      `1. **Spawn \`dev\` Subagent (${devSummary})**:`,
      `   - Delegate ticket implementation to the \`dev\` subagent (\`${normalizedAgentsDir}/dev.md\`, pre-configured with \`model: ${layout.subagentProfiles.dev.model}\` and \`effort: ${layout.subagentProfiles.dev.effort}\`), passing \`[SUBAGENT_ROLE: dev]\` and \`<TICKET_ID>\`.`,
      `2. **Auto-Chain \`tester\` Subagent (${testerSummary})**:`,
      `   - Immediately after \`dev\` finishes \`gate dev-done\` (\`READY_FOR_TEST\`, \`nextAutoAction.role === "tester"\`), **automatically delegate** to the \`tester\` subagent (\`${normalizedAgentsDir}/tester.md\`, pre-configured with \`model: ${layout.subagentProfiles.tester.model}\` and \`effort: ${layout.subagentProfiles.tester.effort}\`), passing \`[SUBAGENT_ROLE: tester]\` and \`<TICKET_ID>\`.`,
      `3. **Self-Healing Repair Loop (Max 2 Rounds)**:`,
      `   - If \`tester\` returns \`BUG_FOUND\` (\`gate test-fail\`), automatically re-delegate to \`dev\` (${devSummary}) with the Bug Report, then re-run \`tester\` (${testerSummary}) until \`READY_TO_MERGE\`.`
    ].join('\n');
  }

  return [
    `1. **Spawn \`dev\` Subagent (${devSummary})**:`,
    `   - Delegate ticket implementation to the \`dev\` subagent (\`${normalizedAgentsDir}/dev.md\`, \`model: ${layout.subagentProfiles.dev.model}\`, \`reasoning_effort: ${layout.subagentProfiles.dev.effort}\`) with \`[SUBAGENT_ROLE: dev]\` and \`<TICKET_ID>\`.`,
    `2. **Auto-Chain \`tester\` Subagent (${testerSummary})**:`,
    `   - Once \`gate dev-done\` transitions \`<TICKET_ID>\` to \`READY_FOR_TEST\`, automatically delegate QA verification to the \`tester\` subagent (\`${normalizedAgentsDir}/tester.md\`, \`model: ${layout.subagentProfiles.tester.model}\`, \`reasoning_effort: ${layout.subagentProfiles.tester.effort}\`) with \`[SUBAGENT_ROLE: tester]\` and \`<TICKET_ID>\`.`,
    `3. **Self-Healing Repair Loop (Max 2 Rounds)**:`,
    `   - If \`tester\` returns \`BUG_FOUND\`, loop back to \`dev\` (${devSummary}) and re-verify with \`tester\` (${testerSummary}) up to 2 rounds until \`READY_TO_MERGE\`.`
  ].join('\n');
}

/**
 * Build a Claude Code slash-command markdown file (`.claude/commands/<skill>.md`)
 * that supports `$ARGUMENTS` and embeds the optimal model + effort frontmatter.
 */
export function buildClaudeCommandWrapper(skillName, renderedSkillMarkdown, skillDir, layout) {
  const body = stripYamlFrontmatter(renderedSkillMarkdown);
  const normalizedSkillDir = skillDir.replace(/\\/g, '/');
  const rewrittenBody = body
    .replace(/\(\.\/resources\//g, `(${normalizedSkillDir}/resources/`)
    .replace(/\(\.\/references\//g, `(${normalizedSkillDir}/references/`);

  const profile = layout?.subagentProfiles?.[skillName];
  const modelLines = profile ? [`model: ${profile.model}`, `effort: ${profile.effort}`] : [];

  return [
    `---`,
    `description: Invoke the /${skillName} workflow skill with Two-Tier Harness integration`,
    `argument-hint: [TICKET_ID or instructions]`,
    ...modelLines,
    `---`,
    ``,
    `User arguments / target ticket (if provided): \`$ARGUMENTS\``,
    ``,
    rewrittenBody
  ].join('\n');
}

/**
 * Build an OpenAI Codex custom prompt file (`~/.codex/prompts/<skill>.md`)
 * with optimal model + reasoning_effort frontmatter.
 */
export function buildCodexPromptWrapper(skillName, renderedSkillMarkdown, skillDir, layout) {
  const body = stripYamlFrontmatter(renderedSkillMarkdown);
  const normalizedSkillDir = skillDir.replace(/\\/g, '/');
  const rewrittenBody = body
    .replace(/\(\.\/resources\//g, `(${normalizedSkillDir}/resources/`)
    .replace(/\(\.\/references\//g, `(${normalizedSkillDir}/references/`);

  const profile = layout?.subagentProfiles?.[skillName];
  const modelLines = profile ? [`model: ${profile.model}`, `reasoning_effort: ${profile.effort}`] : [];

  return [
    `---`,
    `description: Execute the /${skillName} workflow skill with Two-Tier Harness integration`,
    ...modelLines,
    `---`,
    ``,
    `Context / arguments from user: $ARGUMENTS`,
    ``,
    rewrittenBody
  ].join('\n');
}

/**
 * Build the Gemini/Antigravity hooks.json configuration object
 */
export function buildGeminiHooksConfig(existingObj = {}) {
  return {
    ...existingObj,
    'global-skill-harness-guard': {
      enabled: true,
      PreToolUse: [
        {
          matcher: 'run_command',
          hooks: [
            {
              type: 'command',
              command: 'node ./harness/bin/pre-tool-hook.mjs',
              timeout: 10
            }
          ]
        }
      ]
    }
  };
}

/**
 * Merge the PreToolUse Bash safety hook into Claude Code's settings.json object
 */
export function buildClaudeSettingsConfig(existingSettings = {}, hookBinPath) {
  const normalizedHookPath = hookBinPath.replace(/\\/g, '/');
  const hookCommand = `node "${normalizedHookPath}"`;
  const hooks = existingSettings.hooks || {};
  const preToolUse = Array.isArray(hooks.PreToolUse) ? [...hooks.PreToolUse] : [];

  const filtered = preToolUse.filter(
    (entry) => !entry?.hooks?.some((h) => String(h.command || '').includes('pre-tool-hook.mjs'))
  );

  filtered.push({
    matcher: 'Bash',
    hooks: [
      {
        type: 'command',
        command: hookCommand
      }
    ]
  });

  return {
    ...existingSettings,
    hooks: {
      ...hooks,
      PreToolUse: filtered
    }
  };
}
