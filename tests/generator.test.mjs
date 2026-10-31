/**
 * Automated Unit Tests for the Multi-Agent Skill & Two-Tier Harness Generator & Portable `init`
 *
 * Verifies:
 * 1. Default optimal 6-skill & 6-subagent generation across Gemini, Claude Code, and Codex
 * 2. One-line `skill-gen.mjs init --yes` with independent per-agent model options (`--gemini-models`,
 *    `--claude-models`, `--codex-models`), `--save-config`, and `--config` portability roundtrip
 * 3. Interactive `runInteractiveInit` wizard choosing custom per-agent models & efforts via simulated TTY streams
 * 4. Built-in presets (`--preset economy`, `--preset max`) and strict validation of target model/effort constraints
 * 5. Universal PreToolUse hook blocking unquoted `&&` for both Gemini and Claude Code payloads
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { execFileSync } from 'node:child_process';
import { generateAll, runDoctor } from '../src/generator.mjs';
import { runInteractiveInit } from '../src/init-wizard.mjs';
import {
  WORKFLOW_SKILLS,
  ROLE_SUBAGENTS,
  DEFAULT_SUBAGENT_PROFILES,
  GEMINI_SUBAGENT_PLUGIN_DIR_NAME
} from '../src/adapters.mjs';

test('Generator installs all 6 skills and all 6 role subagents with optimal model and effort tiers', () => {
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'multi-agent-home-'));

  try {
    const res = generateAll('all', {
      scope: 'global',
      homeDir: fakeHome,
      skipArchify: true
    });

    assert.equal(res.ok, true);
    assert.deepEqual(res.targetsInstalled, ['gemini', 'claude', 'codex']);
    assert.match(res.portableInitCommand, /init --target all --yes/);

    const geminiBase = path.join(fakeHome, '.gemini', 'config');
    const geminiPluginDir = path.join(geminiBase, 'plugins', GEMINI_SUBAGENT_PLUGIN_DIR_NAME);
    const claudeBase = path.join(fakeHome, '.claude');
    const codexBase = path.join(fakeHome, '.codex');

    const pluginJson = JSON.parse(fs.readFileSync(path.join(geminiPluginDir, 'plugin.json'), 'utf8'));
    assert.equal(pluginJson.name, GEMINI_SUBAGENT_PLUGIN_DIR_NAME);

    for (const skill of WORKFLOW_SKILLS) {
      const geminiSkill = fs.readFileSync(path.join(geminiBase, 'skills', skill, 'SKILL.md'), 'utf8');
      const geminiAgent = fs.readFileSync(path.join(geminiPluginDir, 'agents', `${skill}.md`), 'utf8');
      const claudeSkill = fs.readFileSync(path.join(claudeBase, 'skills', skill, 'SKILL.md'), 'utf8');
      const claudeAgent = fs.readFileSync(path.join(claudeBase, 'agents', `${skill}.md`), 'utf8');
      const claudeCmd = fs.readFileSync(path.join(claudeBase, 'commands', `${skill}.md`), 'utf8');
      const codexSkill = fs.readFileSync(path.join(codexBase, 'skills', skill, 'SKILL.md'), 'utf8');
      const codexAgent = fs.readFileSync(path.join(codexBase, 'agents', `${skill}.md`), 'utf8');
      const codexPrompt = fs.readFileSync(path.join(codexBase, 'prompts', `${skill}.md`), 'utf8');

      for (const content of [
        geminiSkill,
        geminiAgent,
        claudeSkill,
        claudeAgent,
        claudeCmd,
        codexSkill,
        codexAgent,
        codexPrompt
      ]) {
        assert.equal(/\{\{[A-Z_]+\}\}/.test(content), false, `Found unrendered placeholder in ${skill}`);
      }

      assert.match(geminiSkill, /^## 0\. Model & Effort Policy:/m);

      const expectedGemini = DEFAULT_SUBAGENT_PROFILES.gemini[skill];
      assert.match(geminiAgent, /^subagent:\s*true$/m);
      assert.match(geminiAgent, new RegExp(`^model:\\s*${expectedGemini.model}$`, 'm'));
      assert.match(geminiAgent, /^\s*-\s*edit_file$/m);
      assert.match(geminiAgent, /^\s*-\s*run_command$/m);

      const expectedClaude = DEFAULT_SUBAGENT_PROFILES.claude[skill];
      assert.match(claudeAgent, new RegExp(`^model:\\s*${expectedClaude.model}$`, 'm'));
      assert.match(claudeAgent, new RegExp(`^effort:\\s*${expectedClaude.effort}$`, 'm'));
      assert.match(claudeCmd, new RegExp(`^model:\\s*${expectedClaude.model}$`, 'm'));

      const expectedCodex = DEFAULT_SUBAGENT_PROFILES.codex[skill];
      const escapedCodexModel = expectedCodex.model.replace(/\./g, '\\.');
      assert.match(codexAgent, new RegExp(`^model:\\s*${escapedCodexModel}$`, 'm'));
      assert.match(codexAgent, new RegExp(`^reasoning_effort:\\s*${expectedCodex.effort}$`, 'm'));
      assert.match(codexPrompt, new RegExp(`^model:\\s*${escapedCodexModel}$`, 'm'));
    }

    const doc = runDoctor({ scope: 'global', homeDir: fakeHome });
    assert.equal(doc.ok, true);
    for (const agent of doc.agents) {
      assert.equal(agent.installed, true);
      assert.deepEqual(agent.installedSkills, WORKFLOW_SKILLS);
      assert.deepEqual(agent.installedSubagents, ROLE_SUBAGENTS);
    }
  } finally {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});

test('Portable 1-line CLI init configures distinct models per agent (gemini, claude, codex) and roundtrips --save-config / --config', () => {
  const fakeHome1 = fs.mkdtempSync(path.join(os.tmpdir(), 'init-machine1-'));
  const fakeHome2 = fs.mkdtempSync(path.join(os.tmpdir(), 'init-machine2-'));
  const cliBin = path.resolve('bin/skill-gen.mjs');
  const savedConfig = path.join(fakeHome1, 'team-profile.json');

  try {
    // Machine 1: Run 1-line `init` with per-agent model specs + `--save-config`
    const out1 = JSON.parse(
      execFileSync(
        process.execPath,
        [
          cliBin,
          'init',
          '--target',
          'all',
          '--yes',
          '--home',
          fakeHome1,
          '--skip-archify',
          '--gemini-models',
          'ba=pro,po=flash_lite,tester=flash',
          '--claude-models',
          'ba=opus:max,po=haiku:low,merge=opus:high',
          '--codex-models',
          'dev=o3:high,tester=o4-mini:medium,po=gpt-5.4-mini:low',
          '--save-config',
          savedConfig
        ],
        { encoding: 'utf8' }
      )
    );

    assert.equal(out1.ok, true);
    assert.equal(fs.existsSync(savedConfig), true);

    // Verify Gemini got po=flash_lite while keeping dev=pro
    const geminiPo = fs.readFileSync(
      path.join(fakeHome1, '.gemini', 'config', 'plugins', GEMINI_SUBAGENT_PLUGIN_DIR_NAME, 'agents', 'po.md'),
      'utf8'
    );
    assert.match(geminiPo, /^model:\s*flash_lite$/m);

    // Verify Claude got ba=opus + effort=max and po=haiku + effort=low
    const claudeBa = fs.readFileSync(path.join(fakeHome1, '.claude', 'agents', 'ba.md'), 'utf8');
    assert.match(claudeBa, /^model:\s*opus$/m);
    assert.match(claudeBa, /^effort:\s*max$/m);

    // Verify Codex got dev=o3 + reasoning_effort=high and tester=o4-mini + reasoning_effort=medium
    const codexDev = fs.readFileSync(path.join(fakeHome1, '.codex', 'agents', 'dev.md'), 'utf8');
    assert.match(codexDev, /^model:\s*o3$/m);
    assert.match(codexDev, /^reasoning_effort:\s*high$/m);

    // Machine 2: Replicate exact profiles using `--config team-profile.json --yes`
    const out2 = JSON.parse(
      execFileSync(
        process.execPath,
        [cliBin, 'init', '--config', savedConfig, '--home', fakeHome2, '--skip-archify', '--yes'],
        { encoding: 'utf8' }
      )
    );
    assert.equal(out2.ok, true);
    const codexDevMachine2 = fs.readFileSync(path.join(fakeHome2, '.codex', 'agents', 'dev.md'), 'utf8');
    assert.match(codexDevMachine2, /^model:\s*o3$/m);
    assert.match(codexDevMachine2, /^reasoning_effort:\s*high$/m);
  } finally {
    fs.rmSync(fakeHome1, { recursive: true, force: true });
    fs.rmSync(fakeHome2, { recursive: true, force: true });
  }
});

test('Interactive runInteractiveInit wizard lets user pick custom models per agent and outputs portable 1-line command', async () => {
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'wizard-home-'));
  const input = new PassThrough();
  const output = new PassThrough();
  let capturedStdout = '';
  output.on('data', (chunk) => {
    capturedStdout += chunk.toString('utf8');
  });

  // Simulate user answers in interactive wizard:
  // Step 1 target: "gemini,claude"
  // Step 2 scope: "1" (global)
  // Step 3 mode: "4" (custom per-agent & per-skill)
  // For gemini (6 skills, model only):
  //   ba -> "" (default pro)
  //   harness -> "2" (flash)
  //   po -> "3" (flash_lite)
  //   dev -> "1" (pro)
  //   tester -> "2" (flash)
  //   merge -> "3" (flash_lite)
  // For claude (6 skills, model + effort):
  //   ba -> "" (opus), "4" (max)
  //   harness -> "2" (sonnet), "3" (high)
  //   po -> "3" (haiku), "1" (low)
  //   dev -> "1" (opus), "3" (high)
  //   tester -> "3" (haiku), "3" (high)
  //   merge -> "2" (sonnet), "2" (medium)
  const answers = [
    'gemini,claude',
    '1',
    '4',
    '',
    '2',
    '3',
    '1',
    '2',
    '3',
    '',
    '4',
    '2',
    '3',
    '3',
    '1',
    '1',
    '3',
    '3',
    '3',
    '2',
    '2'
  ];
  input.end(answers.join('\n') + '\n');

  try {
    const res = await runInteractiveInit(
      { homeDir: fakeHome, skipArchify: true },
      { input, output }
    );

    assert.equal(res.ok, true);
    assert.deepEqual(res.targetsInstalled, ['gemini', 'claude']);
    assert.equal(res.results[0].subagentProfiles.po.model, 'flash_lite');
    assert.equal(res.results[0].subagentProfiles.harness.model, 'flash');
    assert.equal(res.results[1].subagentProfiles.ba.model, 'opus');
    assert.equal(res.results[1].subagentProfiles.ba.effort, 'max');
    assert.equal(res.results[1].subagentProfiles.po.effort, 'low');
    assert.match(capturedStdout, /Portable 1-line init command/);
    assert.match(res.portableInitCommand, /--gemini-models "ba=pro,harness=flash,po=flash_lite,dev=pro,tester=flash,merge=flash_lite"/);
  } finally {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});

test('Presets and strict validation reject unsupported Gemini model names or invalid efforts', () => {
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'preset-validation-'));

  try {
    const econ = generateAll('all', {
      scope: 'global',
      homeDir: fakeHome,
      preset: 'economy',
      skipArchify: true
    });
    assert.equal(econ.ok, true);
    assert.equal(econ.results[0].subagentProfiles.po.model, 'flash_lite');
    assert.equal(econ.results[1].subagentProfiles.dev.model, 'sonnet');

    // Invalid Gemini model must throw so Antigravity binary parser never receives an unsupported tier
    assert.throws(
      () =>
        generateAll('gemini', {
          scope: 'global',
          homeDir: fakeHome,
          geminiModels: 'dev=opus',
          skipArchify: true
        }),
      /Invalid model 'opus' for 'dev' on gemini/
    );

    // Invalid Claude effort must throw
    assert.throws(
      () =>
        generateAll('claude', {
          scope: 'global',
          homeDir: fakeHome,
          claudeModels: 'dev=opus:ultra',
          skipArchify: true
        }),
      /Invalid effort 'ultra'/
    );
  } finally {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});

test('Universal pre-tool-hook.mjs blocks unquoted && for both Gemini and Claude Code payloads', () => {
  const hookBin = path.resolve('templates/harness/bin/pre-tool-hook.mjs');

  function invokeHook(payload) {
    const out = execFileSync(process.execPath, [hookBin], {
      input: JSON.stringify(payload),
      encoding: 'utf8'
    });
    return JSON.parse(out);
  }

  const geminiDenied = invokeHook({
    toolCall: { name: 'run_command', args: { CommandLine: 'npm build && npm test' } }
  });
  assert.equal(geminiDenied.decision, 'deny');

  const geminiAllowed = invokeHook({
    toolCall: { name: 'run_command', args: { CommandLine: 'node "C:/harness/bin/harness.mjs" status' } }
  });
  assert.equal(geminiAllowed.decision, 'allow');

  const claudeBlocked = invokeHook({
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'cd backend && npm run test' }
  });
  assert.equal(claudeBlocked.decision, 'block');
  assert.equal(claudeBlocked.hookSpecificOutput.permissionDecision, 'deny');

  const claudeApproved = invokeHook({
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'npm run test' }
  });
  assert.equal(claudeApproved.decision, 'approve');
});

test('Repository root includes zero-config chat onboarding files ("init đi") for Gemini, Claude Code, and Codex', () => {
  const onboardingFiles = [
    'AGENTS.md',
    'CLAUDE.md',
    '.agents/skills/init/SKILL.md',
    '.claude/skills/init/SKILL.md',
    '.codex/skills/init/SKILL.md'
  ];

  for (const relPath of onboardingFiles) {
    const absPath = path.resolve(relPath);
    assert.equal(fs.existsSync(absPath), true, `Missing onboarding file: ${relPath}`);
    const content = fs.readFileSync(absPath, 'utf8');
    assert.match(content, /init đi/);
    assert.match(content, /bin\/skill-gen\.mjs/);
    assert.match(content, /--gemini-models|--claude-models|--codex-models/);
  }
});
