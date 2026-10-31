/**
 * Core Multi-Agent Skill & Two-Tier Harness Generator Engine
 *
 * Generates and installs the 6 Product Lifecycle Skills (/ba, /harness, /po, /dev, /tester, /merge),
 * all 6 role-specialized Custom Subagents (`ba`, `harness`, `po`, `dev`, `tester`, `merge`) with
 * optimal automatic model + effort switching, the bundled Archify diagramming engine,
 * the Global Shared Harness (harness.mjs + pre-tool-hook.mjs), lifecycle hooks, and mandatory
 * engineering rules for Gemini, Claude Code, and OpenAI Codex.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SUPPORTED_TARGETS,
  WORKFLOW_SKILLS,
  ROLE_SUBAGENTS,
  resolveTargetLayout,
  formatProfileSummary,
  buildPortableInitCommand,
  buildGeminiSubagentPluginManifest,
  buildModelPolicyTable,
  buildSkillExecutionModeSection,
  buildRoleSubagentMarkdown,
  buildSubagentPipelineGuide,
  buildClaudeCommandWrapper,
  buildCodexPromptWrapper,
  buildGeminiHooksConfig,
  buildClaudeSettingsConfig
} from './adapters.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');
export const TEMPLATES_DIR = path.join(REPO_ROOT, 'templates');

/**
 * Recursively copy a directory from srcDir to destDir
 */
function copyDirectoryRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Replace template placeholders inside a markdown or text file
 */
export function renderTemplateString(templateContent, layout) {
  const normalizedHarnessBin = layout.harnessBin.replace(/\\/g, '/');
  const normalizedArchifyBin = layout.archifyBin.replace(/\\/g, '/');
  const normalizedAgentsDir = layout.agentsDir.replace(/\\/g, '/');

  const baSummary = formatProfileSummary(layout.target, layout.subagentProfiles.ba);
  const harnessSummary = formatProfileSummary(layout.target, layout.subagentProfiles.harness);
  const poSummary = formatProfileSummary(layout.target, layout.subagentProfiles.po);
  const devSummary = formatProfileSummary(layout.target, layout.subagentProfiles.dev);
  const testerSummary = formatProfileSummary(layout.target, layout.subagentProfiles.tester);
  const mergeSummary = formatProfileSummary(layout.target, layout.subagentProfiles.merge);

  const modelPolicyTable = buildModelPolicyTable(layout);
  const pipelineGuide = buildSubagentPipelineGuide(layout);

  // Expand execution-mode section blocks first because they embed inner placeholders
  let rendered = templateContent
    .replace(/\{\{BA_EXECUTION_MODE\}\}/g, buildSkillExecutionModeSection('ba', layout))
    .replace(/\{\{HARNESS_EXECUTION_MODE\}\}/g, buildSkillExecutionModeSection('harness', layout))
    .replace(/\{\{PO_EXECUTION_MODE\}\}/g, buildSkillExecutionModeSection('po', layout))
    .replace(/\{\{DEV_EXECUTION_MODE\}\}/g, buildSkillExecutionModeSection('dev', layout))
    .replace(/\{\{TESTER_EXECUTION_MODE\}\}/g, buildSkillExecutionModeSection('tester', layout))
    .replace(/\{\{MERGE_EXECUTION_MODE\}\}/g, buildSkillExecutionModeSection('merge', layout));

  rendered = rendered
    .replace(/\{\{MODEL_POLICY_TABLE\}\}/g, modelPolicyTable)
    .replace(/\{\{SUBAGENT_PIPELINE_GUIDE\}\}/g, pipelineGuide)
    .replace(/\{\{HARNESS_BIN\}\}/g, normalizedHarnessBin)
    .replace(/\{\{ARCHIFY_BIN\}\}/g, normalizedArchifyBin)
    .replace(/\{\{AGENTS_DIR\}\}/g, normalizedAgentsDir)
    .replace(/\{\{BA_PROFILE_SUMMARY\}\}/g, baSummary)
    .replace(/\{\{HARNESS_PROFILE_SUMMARY\}\}/g, harnessSummary)
    .replace(/\{\{PO_PROFILE_SUMMARY\}\}/g, poSummary)
    .replace(/\{\{DEV_PROFILE_SUMMARY\}\}/g, devSummary)
    .replace(/\{\{TESTER_PROFILE_SUMMARY\}\}/g, testerSummary)
    .replace(/\{\{MERGE_PROFILE_SUMMARY\}\}/g, mergeSummary)
    .replace(/\{\{ASK_TOOL\}\}/g, layout.askToolPlaceholder)
    .replace(/\{\{AGENT_DISPLAY_NAME\}\}/g, layout.displayName)
    .replace(/\{\{AGENT_TARGET\}\}/g, layout.target);

  return rendered;
}

/**
 * Generate and install skills, all 6 role subagents, harness, hooks, and rules for a single target ('gemini' | 'claude' | 'codex')
 */
export function generateForTarget(target, options = {}) {
  const layout = resolveTargetLayout(target, options);
  const installedFiles = [];

  // 1. Create base directories (including custom subagent directories)
  fs.mkdirSync(layout.skillsDir, { recursive: true });
  fs.mkdirSync(layout.agentsDir, { recursive: true });
  fs.mkdirSync(path.join(layout.harnessDir, 'bin'), { recursive: true });
  if (layout.commandsDir) fs.mkdirSync(layout.commandsDir, { recursive: true });
  if (layout.promptsDir) fs.mkdirSync(layout.promptsDir, { recursive: true });

  // For Gemini/Antigravity, write plugin.json inside plugins/skill-harness-subagents/ so agents/*.md are ingested
  if (layout.subagentPluginManifest) {
    const manifestObj = buildGeminiSubagentPluginManifest(layout);
    fs.writeFileSync(layout.subagentPluginManifest, JSON.stringify(manifestObj, null, 2), 'utf8');
    installedFiles.push(layout.subagentPluginManifest);
  }

  // 2. Install Global Shared Harness binaries (harness.mjs, pre-tool-hook.mjs & subagent-profiles.json)
  const srcHarnessBin = path.join(TEMPLATES_DIR, 'harness', 'bin', 'harness.mjs');
  const srcHookBin = path.join(TEMPLATES_DIR, 'harness', 'bin', 'pre-tool-hook.mjs');
  const profilesSnapshotPath = path.join(layout.harnessDir, 'subagent-profiles.json');
  fs.copyFileSync(srcHarnessBin, layout.harnessBin);
  fs.copyFileSync(srcHookBin, layout.hookBin);
  fs.writeFileSync(
    profilesSnapshotPath,
    JSON.stringify(
      {
        target: layout.target,
        updatedAt: new Date().toISOString(),
        profiles: layout.subagentProfiles
      },
      null,
      2
    ),
    'utf8'
  );
  installedFiles.push(layout.harnessBin, layout.hookBin, profilesSnapshotPath);

  // 3. Install bundled Archify skill (if skipArchify is not set)
  if (!options.skipArchify) {
    const srcArchifyDir = path.join(TEMPLATES_DIR, 'skills', 'archify');
    const destArchifyDir = path.join(layout.skillsDir, 'archify');
    if (fs.existsSync(srcArchifyDir)) {
      copyDirectoryRecursive(srcArchifyDir, destArchifyDir);
      installedFiles.push(path.join(destArchifyDir, 'SKILL.md'));
    }
  }

  // 4. Render and install all 6 workflow skills (/ba, /harness, /po, /dev, /tester, /merge) + all 6 role subagents
  for (const skillName of WORKFLOW_SKILLS) {
    const srcSkillDir = path.join(TEMPLATES_DIR, 'skills', skillName);
    const destSkillDir = path.join(layout.skillsDir, skillName);
    copyDirectoryRecursive(srcSkillDir, destSkillDir);

    const skillMdPath = path.join(destSkillDir, 'SKILL.md');
    const rawSkillMd = fs.readFileSync(skillMdPath, 'utf8');
    const renderedSkillMd = renderTemplateString(rawSkillMd, layout);
    fs.writeFileSync(skillMdPath, renderedSkillMd, 'utf8');
    installedFiles.push(skillMdPath);

    // Generate dedicated role subagent (`agents/<skill>.md`) with optimal target model + effort frontmatter
    if (ROLE_SUBAGENTS.includes(skillName)) {
      const subagentFilePath = path.join(layout.agentsDir, `${skillName}.md`);
      const subagentContent = buildRoleSubagentMarkdown(skillName, renderedSkillMd, destSkillDir, layout);
      fs.writeFileSync(subagentFilePath, subagentContent, 'utf8');
      installedFiles.push(subagentFilePath);
    }

    // Generate Claude Code slash command wrapper (.claude/commands/<skill>.md) with optimal model + effort
    if (layout.commandsDir) {
      const cmdFilePath = path.join(layout.commandsDir, `${skillName}.md`);
      const cmdContent = buildClaudeCommandWrapper(skillName, renderedSkillMd, destSkillDir, layout);
      fs.writeFileSync(cmdFilePath, cmdContent, 'utf8');
      installedFiles.push(cmdFilePath);
    }

    // Generate OpenAI Codex custom prompt wrapper (.codex/prompts/<skill>.md) with optimal model + reasoning_effort
    if (layout.promptsDir) {
      const promptFilePath = path.join(layout.promptsDir, `${skillName}.md`);
      const promptContent = buildCodexPromptWrapper(skillName, renderedSkillMd, destSkillDir, layout);
      fs.writeFileSync(promptFilePath, promptContent, 'utf8');
      installedFiles.push(promptFilePath);
    }
  }

  // 5. Configure Lifecycle PreToolUse Hook (hooks.json for Gemini, settings.json for Claude)
  if (layout.target === 'gemini' && layout.hooksConfigFile) {
    let existingHooks = {};
    if (fs.existsSync(layout.hooksConfigFile)) {
      try {
        existingHooks = JSON.parse(fs.readFileSync(layout.hooksConfigFile, 'utf8'));
      } catch {
        existingHooks = {};
      }
    }
    const mergedHooks = buildGeminiHooksConfig(existingHooks);
    fs.writeFileSync(layout.hooksConfigFile, JSON.stringify(mergedHooks, null, 2), 'utf8');
    installedFiles.push(layout.hooksConfigFile);
  } else if (layout.target === 'claude' && layout.hooksConfigFile) {
    let existingSettings = {};
    if (fs.existsSync(layout.hooksConfigFile)) {
      try {
        existingSettings = JSON.parse(fs.readFileSync(layout.hooksConfigFile, 'utf8'));
      } catch {
        existingSettings = {};
      }
    }
    const mergedSettings = buildClaudeSettingsConfig(existingSettings, layout.hookBin);
    fs.writeFileSync(layout.hooksConfigFile, JSON.stringify(mergedSettings, null, 2), 'utf8');
    installedFiles.push(layout.hooksConfigFile);
  }

  // 6. Install Mandatory Engineering Rules (GEMINI.md / CLAUDE.md / AGENTS.md)
  const rulesTemplatePath = path.join(TEMPLATES_DIR, 'rules', 'ENGINEERING_RULES.md');
  if (fs.existsSync(rulesTemplatePath) && layout.rulesFile) {
    const rawRules = fs.readFileSync(rulesTemplatePath, 'utf8');
    const renderedRules = renderTemplateString(rawRules, layout);
    const startMarker = '<!-- BEGIN AI-SKILL-HARNESS-RULES -->';
    const endMarker = '<!-- END AI-SKILL-HARNESS-RULES -->';
    const managedBlock = `${startMarker}\n${renderedRules.trim()}\n${endMarker}\n`;

    if (fs.existsSync(layout.rulesFile)) {
      const currentContent = fs.readFileSync(layout.rulesFile, 'utf8');
      if (currentContent.includes(startMarker) && currentContent.includes(endMarker)) {
        const updated = currentContent.replace(
          new RegExp(`${startMarker}[\\s\\S]*?${endMarker}\\n?`),
          managedBlock
        );
        fs.writeFileSync(layout.rulesFile, updated, 'utf8');
      } else {
        fs.writeFileSync(layout.rulesFile, `${currentContent.trim()}\n\n${managedBlock}`, 'utf8');
      }
    } else {
      fs.mkdirSync(path.dirname(layout.rulesFile), { recursive: true });
      fs.writeFileSync(layout.rulesFile, managedBlock, 'utf8');
    }
    installedFiles.push(layout.rulesFile);
  }

  return {
    ok: true,
    target: layout.target,
    displayName: layout.displayName,
    scope: layout.scope,
    baseDir: layout.baseDir,
    skillsDir: layout.skillsDir,
    agentsDir: layout.agentsDir,
    subagentPluginDir: layout.subagentPluginDir,
    commandsDir: layout.commandsDir,
    promptsDir: layout.promptsDir,
    harnessBin: layout.harnessBin,
    hookBin: layout.hookBin,
    hooksConfigFile: layout.hooksConfigFile,
    rulesFile: layout.rulesFile,
    skillsInstalled: [...WORKFLOW_SKILLS, ...(options.skipArchify ? [] : ['archify'])],
    subagentsInstalled: ROLE_SUBAGENTS,
    subagentProfiles: layout.subagentProfiles,
    restartRecommended: layout.target === 'gemini',
    installedFilesCount: installedFiles.length
  };
}

/**
 * Generate and install for one or multiple targets ('gemini', 'claude', 'codex', or 'all')
 */
export function generateAll(targetArg = 'all', options = {}) {
  const targets =
    targetArg === 'all'
      ? SUPPORTED_TARGETS
      : String(targetArg)
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);

  for (const t of targets) {
    if (!SUPPORTED_TARGETS.includes(t)) {
      throw new Error(`Invalid target '${t}'. Supported: gemini, claude, codex, all`);
    }
  }

  const results = targets.map((t) => generateForTarget(t, options));
  const profilesByTarget = {};
  for (const r of results) {
    profilesByTarget[r.target] = r.subagentProfiles;
  }

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    scope: options.scope || 'global',
    targetsInstalled: targets,
    portableInitCommand: buildPortableInitCommand({
      targets,
      scope: options.scope || 'global',
      dest: options.scope === 'workspace' ? options.workspaceDir : null,
      profilesByTarget,
      skipArchify: Boolean(options.skipArchify)
    }),
    results
  };
}

/**
 * Inspect installation health and 6-skill subagent model/effort profiles across Gemini, Claude Code, and OpenAI Codex
 */
export function runDoctor(options = {}) {
  const report = SUPPORTED_TARGETS.map((target) => {
    const layout = resolveTargetLayout(target, options);
    const hasHarness = fs.existsSync(layout.harnessBin);
    const hasHook = fs.existsSync(layout.hookBin);
    const installedSkills = WORKFLOW_SKILLS.filter((s) =>
      fs.existsSync(path.join(layout.skillsDir, s, 'SKILL.md'))
    );
    const installedSubagents = ROLE_SUBAGENTS.filter((role) =>
      fs.existsSync(path.join(layout.agentsDir, `${role}.md`))
    );
    const hasSubagentPlugin = layout.subagentPluginManifest
      ? fs.existsSync(layout.subagentPluginManifest)
      : true;
    const hasArchify = fs.existsSync(layout.archifyBin);
    const hasRules = fs.existsSync(layout.rulesFile);

    return {
      target,
      displayName: layout.displayName,
      baseDir: layout.baseDir,
      agentsDir: layout.agentsDir,
      installed:
        hasHarness &&
        installedSkills.length === WORKFLOW_SKILLS.length &&
        installedSubagents.length === ROLE_SUBAGENTS.length &&
        hasSubagentPlugin,
      hasHarness,
      hasHook,
      hasArchify,
      hasRules,
      installedSkills,
      installedSubagents,
      subagentProfiles: layout.subagentProfiles
    };
  });

  return {
    ok: true,
    devicePlatform: process.platform,
    nodeVersion: process.version,
    agents: report
  };
}
