#!/usr/bin/env node
/**
 * Antigravity Two-Tier Skill Harness CLI Engine
 *
 * Tier 1 (Global Shared Harness): Lives in ~/.gemini/config/harness/bin/harness.mjs
 *   - Shared across all skills (/ba, /po, /dev, /tester, /merge, /harness) and all repositories.
 *   - Enforces universal engineering rules, Ticket State Machine, Git Worktree lifecycle, and JSON Receipts.
 *
 * Tier 2 (Per-Repo Parent-Folder Harness): Lives in <parentRoot>/harness/ alongside <parentRoot>/<repoName>/
 *   - Detected and tailored per project by the /harness skill (using `harness.mjs detect` & `harness.mjs init`).
 *   - Executes project-specific hooks: worktree-setup.mjs, custom-check.mjs, smoke-test.mjs, and harness.config.json commands.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

// Regex to detect Vietnamese diacritics inside source code comments
const VIETNAMESE_DIACRITIC_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỖÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

/**
 * Parse CLI arguments into positional args and named flags
 */
function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(token);
    }
  }
  return { positional, flags };
}

/**
 * Compute SHA-256 hash of a string or buffer
 */
function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Execute a shell command synchronously and return stdout/stderr
 */
function runShell(cmd, cwd) {
  try {
    const stdout = execSync(cmd, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { ok: true, stdout: stdout.trim(), stderr: '' };
  } catch (err) {
    return {
      ok: false,
      stdout: err.stdout ? String(err.stdout).trim() : '',
      stderr: err.stderr ? String(err.stderr).trim() : err.message
    };
  }
}

/**
 * Auto-discover Parent Folder, Repo Folder, Harness Folder, and Worktrees Folder
 * whether the user opened Antigravity in the Parent Folder, the Repo Folder, or a Worktree.
 */
function resolveTopology(startDir, explicitRepoName = null) {
  let cwd = path.resolve(startDir || process.cwd());
  try {
    cwd = fs.realpathSync(cwd);
  } catch {
    // Keep original resolved path if realpath fails
  }

  // Case 1: Current directory already has ./harness/harness.config.json (User opened Parent Folder)
  const localConfigPath = path.join(cwd, 'harness', 'harness.config.json');
  if (fs.existsSync(localConfigPath)) {
    const config = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
    const parentRoot = cwd;
    const repoRoot = path.resolve(parentRoot, config.repoName);
    return buildPaths(parentRoot, repoRoot, config.repoName, config);
  }

  // Case 2: Parent directory has ../harness/harness.config.json (User opened Repo Folder)
  const parentDir = path.dirname(cwd);
  const parentConfigPath = path.join(parentDir, 'harness', 'harness.config.json');
  if (fs.existsSync(parentConfigPath)) {
    const config = JSON.parse(fs.readFileSync(parentConfigPath, 'utf8'));
    const parentRoot = parentDir;
    const repoRoot = path.resolve(parentRoot, config.repoName);
    return buildPaths(parentRoot, repoRoot, config.repoName, config);
  }

  // Case 3: Grandparent directory has ../../harness/harness.config.json (User is inside worktrees/<TICKET_ID>)
  const grandParentDir = path.dirname(parentDir);
  const grandParentConfigPath = path.join(grandParentDir, 'harness', 'harness.config.json');
  if (fs.existsSync(grandParentConfigPath)) {
    const config = JSON.parse(fs.readFileSync(grandParentConfigPath, 'utf8'));
    const parentRoot = grandParentDir;
    const repoRoot = path.resolve(parentRoot, config.repoName);
    return buildPaths(parentRoot, repoRoot, config.repoName, config);
  }

  // Case 3b: Sibling container folder has ../<container>/harness/harness.config.json matching repoName
  try {
    const baseName = path.basename(cwd);
    const siblings = fs.readdirSync(parentDir, { withFileTypes: true }).filter((d) => d.isDirectory());
    for (const sib of siblings) {
      const sibConfigPath = path.join(parentDir, sib.name, 'harness', 'harness.config.json');
      if (fs.existsSync(sibConfigPath)) {
        const config = JSON.parse(fs.readFileSync(sibConfigPath, 'utf8'));
        if (config.repoName === baseName || config.repoName === explicitRepoName) {
          const parentRoot = path.join(parentDir, sib.name);
          const repoRoot = path.resolve(parentRoot, config.repoName);
          return buildPaths(parentRoot, repoRoot, config.repoName, config);
        }
      }
    }
  } catch {
    // Ignore sibling scan errors
  }

  // Case 4: Uninitialized workspace — determine if cwd is the Repo Folder or the Parent Folder
  const hasGitHere = fs.existsSync(path.join(cwd, '.git'));
  if (hasGitHere) {
    const repoRoot = cwd;
    const parentRoot = path.dirname(cwd);
    const repoName = path.basename(cwd);
    return buildPaths(parentRoot, repoRoot, repoName, null);
  }

  if (explicitRepoName) {
    const parentRoot = cwd;
    const repoRoot = path.join(cwd, explicitRepoName);
    return buildPaths(parentRoot, repoRoot, explicitRepoName, null);
  }

  const subdirs = fs
    .readdirSync(cwd, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !['harness', 'worktrees', '.git', '.agents', '.archify', 'node_modules'].includes(d.name));

  const gitSubdir = subdirs.find((d) => fs.existsSync(path.join(cwd, d.name, '.git')));
  if (gitSubdir) {
    const parentRoot = cwd;
    const repoRoot = path.join(cwd, gitSubdir.name);
    return buildPaths(parentRoot, repoRoot, gitSubdir.name, null);
  }

  // Default fallback: treat cwd as Repo Root and dirname(cwd) as Parent Root
  const repoRoot = cwd;
  const parentRoot = path.dirname(cwd);
  const repoName = path.basename(cwd);
  return buildPaths(parentRoot, repoRoot, repoName, null);
}

/**
 * Construct canonical path map for the Two-Tier Harness
 */
function buildPaths(parentRoot, repoRoot, repoName, config) {
  const harnessDir = path.join(parentRoot, 'harness');
  const productDir = path.join(harnessDir, 'product');
  const worktreesDir = path.join(parentRoot, 'worktrees');
  return {
    initialized: Boolean(config),
    parentRoot,
    repoRoot,
    repoName,
    harnessDir,
    configPath: path.join(harnessDir, 'harness.config.json'),
    statePath: path.join(harnessDir, 'state.json'),
    envDir: path.join(harnessDir, 'env'),
    scriptsDir: path.join(harnessDir, 'scripts'),
    receiptsDir: path.join(harnessDir, 'receipts'),
    productDir,
    prdPath: path.join(productDir, 'PRD.md'),
    srsPath: path.join(productDir, 'SRS.md'),
    backlogPath: path.join(productDir, 'BACKLOG.md'),
    currentTicketPath: path.join(productDir, 'CURRENT_TICKET.md'),
    ticketsDir: path.join(productDir, 'tickets'),
    diagramsDir: path.join(productDir, 'diagrams'),
    worktreesDir,
    config: config || null
  };
}

/**
 * Inspect the repository and/or SRS.md to detect tech stack and recommend Repo-Specific Harnesses (Used by /harness skill)
 */
function detectProjectHarnesses(topo) {
  const repoRoot = topo.repoRoot;
  const exists = fs.existsSync(repoRoot);
  const detected = {
    repoExists: exists,
    hasSrs: fs.existsSync(topo.srsPath),
    hasPrd: fs.existsSync(topo.prdPath),
    languages: [],
    packageManager: null,
    frameworks: [],
    databaseAndOrm: [],
    testRunner: null,
    linterAndTypecheck: [],
    hasSwaggerOrOpenApi: false,
    hasDockerCompose: false,
    hasEnvExample: false,
    suggestedCommands: {
      install: '',
      build: '',
      test: '',
      lint: '',
      typecheck: '',
      migrate: ''
    },
    sharedTouchpointFiles: ['README.md', '.env.example'],
    recommendedHarnesses: []
  };

  if (exists) {
    // Check package.json (Node.js / TypeScript ecosystem)
    const pkgPath = path.join(repoRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
      detected.languages.push('JavaScript/TypeScript');
      if (fs.existsSync(path.join(repoRoot, 'pnpm-lock.yaml'))) detected.packageManager = 'pnpm';
      else if (fs.existsSync(path.join(repoRoot, 'yarn.lock'))) detected.packageManager = 'yarn';
      else if (fs.existsSync(path.join(repoRoot, 'bun.lockb'))) detected.packageManager = 'bun';
      else detected.packageManager = 'npm';

      const pmRun = detected.packageManager === 'npm' ? 'npm run' : detected.packageManager;
      detected.suggestedCommands.install = `${detected.packageManager} install`;
      detected.sharedTouchpointFiles.push('package.json');

      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

        if (allDeps['@nestjs/core']) {
          detected.frameworks.push('NestJS');
          detected.sharedTouchpointFiles.push('src/app.module.ts', 'src/main.ts');
        }
        if (allDeps['next']) {
          detected.frameworks.push('Next.js');
        }
        if (allDeps['express']) {
          detected.frameworks.push('Express');
          detected.sharedTouchpointFiles.push('src/index.ts', 'src/app.ts', 'src/routes/index.ts');
        }
        if (allDeps['fastify']) {
          detected.frameworks.push('Fastify');
        }
        if (allDeps['react'] || allDeps['vue']) {
          detected.frameworks.push(allDeps['react'] ? 'React' : 'Vue');
        }

        // Database & ORM detection
        if (allDeps['prisma'] || allDeps['@prisma/client'] || fs.existsSync(path.join(repoRoot, 'prisma'))) {
          detected.databaseAndOrm.push('Prisma');
          detected.sharedTouchpointFiles.push('prisma/schema.prisma');
        }
        if (allDeps['typeorm']) detected.databaseAndOrm.push('TypeORM');
        if (allDeps['drizzle-orm']) detected.databaseAndOrm.push('Drizzle');
        if (allDeps['knex']) detected.databaseAndOrm.push('Knex');
        if (allDeps['sequelize']) detected.databaseAndOrm.push('Sequelize');
        if (allDeps['mongoose']) detected.databaseAndOrm.push('Mongoose/MongoDB');
        if (allDeps['pg']) detected.databaseAndOrm.push('PostgreSQL (pg)');
        if (allDeps['mysql2']) detected.databaseAndOrm.push('MySQL');

        // Swagger / OpenAPI detection
        if (
          allDeps['@nestjs/swagger'] ||
          allDeps['swagger-ui-express'] ||
          allDeps['swagger-jsdoc'] ||
          allDeps['@fastify/swagger']
        ) {
          detected.hasSwaggerOrOpenApi = true;
        }

        // Test runner detection
        if (allDeps['vitest']) detected.testRunner = 'Vitest';
        else if (allDeps['jest']) detected.testRunner = 'Jest';
        else if (allDeps['mocha']) detected.testRunner = 'Mocha';
        else if (allDeps['@playwright/test']) detected.testRunner = 'Playwright';

        // Linter & Typecheck detection
        if (allDeps['typescript'] || fs.existsSync(path.join(repoRoot, 'tsconfig.json'))) {
          detected.linterAndTypecheck.push('TypeScript (tsc)');
          detected.suggestedCommands.typecheck = 'npx tsc --noEmit';
        }
        if (allDeps['eslint']) detected.linterAndTypecheck.push('ESLint');
        if (allDeps['@biomejs/biome']) detected.linterAndTypecheck.push('Biome');

        // Extract scripts
        if (pkg.scripts?.build) detected.suggestedCommands.build = `${pmRun} build`;
        if (pkg.scripts?.test && !pkg.scripts.test.includes('no test specified')) {
          detected.suggestedCommands.test = `${detected.packageManager} test`;
        }
        if (pkg.scripts?.lint) detected.suggestedCommands.lint = `${pmRun} lint`;
      } catch {
        // Ignore parse errors
      }
    }

    // Check Python ecosystem
    if (
      fs.existsSync(path.join(repoRoot, 'pyproject.toml')) ||
      fs.existsSync(path.join(repoRoot, 'requirements.txt'))
    ) {
      detected.languages.push('Python');
      detected.packageManager = fs.existsSync(path.join(repoRoot, 'poetry.lock')) ? 'poetry' : 'pip';
      detected.testRunner = detected.testRunner || 'pytest';
      detected.suggestedCommands.test = detected.suggestedCommands.test || 'pytest';
    }

    // Check Go ecosystem
    if (fs.existsSync(path.join(repoRoot, 'go.mod'))) {
      detected.languages.push('Go');
      detected.packageManager = 'go';
      detected.testRunner = 'go test';
      detected.suggestedCommands.test = 'go test ./...';
      detected.suggestedCommands.build = 'go build ./...';
    }

    // Check Docker Compose & .env.example
    detected.hasDockerCompose =
      fs.existsSync(path.join(repoRoot, 'docker-compose.yml')) ||
      fs.existsSync(path.join(repoRoot, 'docker-compose.yaml')) ||
      fs.existsSync(path.join(repoRoot, 'compose.yml'));
    detected.hasEnvExample = fs.existsSync(path.join(repoRoot, '.env.example'));
  }

  // Always recommend modular Repo Harnesses based on findings
  detected.recommendedHarnesses.push({
    id: 'worktree-env-port-harness',
    name: 'Worktree Bootstrap, Dependency Linker & Env/Port Isolator',
    file: 'harness/scripts/worktree-setup.mjs',
    reason: 'Automatically provisions .env files, links shared dependencies, and assigns isolated PORT offsets per parallel worktree.'
  });

  detected.recommendedHarnesses.push({
    id: 'db-migration-trigger-harness',
    name: 'Database & Migration Trigger Safety Harness',
    file: 'harness/scripts/custom-check.mjs',
    reason:
      detected.databaseAndOrm.length > 0
        ? `Detected ${detected.databaseAndOrm.join(', ')}. Validates schema/migrations and enforces DROP TRIGGER IF EXISTS before CREATE TRIGGER.`
        : 'Enforces SQL migration safety rules (DROP TRIGGER IF EXISTS) and schema consistency.'
  });

  detected.recommendedHarnesses.push({
    id: 'swagger-docs-test-harness',
    name: 'Feature Completeness Harness (Unit Tests + Swagger/OpenAPI + Docs)',
    file: 'harness/scripts/custom-check.mjs',
    reason:
      'Verifies that new feature modules include corresponding Unit Tests (.spec/.test), Swagger/OpenAPI updates, .env.example, and README documentation.'
  });

  detected.recommendedHarnesses.push({
    id: 'system-smoke-health-harness',
    name: 'System Compilation & Runtime Smoke Harness',
    file: 'harness/scripts/smoke-test.mjs',
    reason:
      'Used by /tester Layer 4 to verify build/typecheck, module imports, and runtime startup health before allowing /merge.'
  });

  detected.recommendedHarnesses.push({
    id: 'parallel-merge-touchpoint-harness',
    name: 'Parallel Merge Touchpoint & Conflict Guard',
    file: 'harness/harness.config.json',
    reason: `Registers ${detected.sharedTouchpointFiles.join(', ')} as shared touchpoints so /ba, /dev, and /merge avoid and resolve parallel conflicts cleanly.`
  });

  return detected;
}

/**
 * Ensure the Tier-2 Repo Harness folder structure exists in the Parent Folder
 */
function initRepoHarness(startDir, explicitRepoName) {
  const topo = resolveTopology(startDir, explicitRepoName);

  const dirsToCreate = [
    topo.repoRoot,
    topo.harnessDir,
    topo.envDir,
    topo.scriptsDir,
    topo.receiptsDir,
    topo.productDir,
    topo.ticketsDir,
    topo.diagramsDir,
    topo.worktreesDir
  ];
  for (const dir of dirsToCreate) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Ensure Repo Root is a git repository
  if (!fs.existsSync(path.join(topo.repoRoot, '.git'))) {
    runShell('git init', topo.repoRoot);
  }

  const detected = detectProjectHarnesses(topo);

  // Write harness.config.json if not present
  if (!fs.existsSync(topo.configPath)) {
    const baseProfiles = {
      gemini: {
        ba: { agent: 'ba', model: 'pro', effort: 'high' },
        harness: { agent: 'harness', model: 'pro', effort: 'high' },
        po: { agent: 'po', model: 'flash', effort: 'low' },
        dev: { agent: 'dev', model: 'pro', effort: 'high' },
        tester: { agent: 'tester', model: 'flash', effort: 'medium' },
        merge: { agent: 'merge', model: 'flash', effort: 'medium' }
      },
      claude: {
        ba: { agent: 'ba', model: 'opus', effort: 'high' },
        harness: { agent: 'harness', model: 'sonnet', effort: 'high' },
        po: { agent: 'po', model: 'haiku', effort: 'medium' },
        dev: { agent: 'dev', model: 'opus', effort: 'high' },
        tester: { agent: 'tester', model: 'haiku', effort: 'high' },
        merge: { agent: 'merge', model: 'sonnet', effort: 'medium' }
      },
      codex: {
        ba: { agent: 'ba', model: 'gpt-5.4', effort: 'high' },
        harness: { agent: 'harness', model: 'gpt-5.4', effort: 'medium' },
        po: { agent: 'po', model: 'gpt-5.4-mini', effort: 'medium' },
        dev: { agent: 'dev', model: 'gpt-5.4', effort: 'high' },
        tester: { agent: 'tester', model: 'gpt-5.4-mini', effort: 'high' },
        merge: { agent: 'merge', model: 'gpt-5.4', effort: 'medium' }
      }
    };

    // Merge any custom profiles configured by `skill-gen init` across Gemini, Claude, and Codex
    const home = os.homedir();
    const snapshotLocations = [
      { target: 'gemini', file: path.join(home, '.gemini', 'config', 'harness', 'subagent-profiles.json') },
      { target: 'claude', file: path.join(home, '.claude', 'harness', 'subagent-profiles.json') },
      { target: 'codex', file: path.join(home, '.codex', 'harness', 'subagent-profiles.json') }
    ];
    for (const loc of snapshotLocations) {
      if (fs.existsSync(loc.file)) {
        try {
          const snap = JSON.parse(fs.readFileSync(loc.file, 'utf8'));
          if (snap?.profiles && typeof snap.profiles === 'object') {
            for (const [role, prof] of Object.entries(snap.profiles)) {
              if (prof?.model) {
                baseProfiles[loc.target][role] = {
                  agent: role,
                  model: prof.model,
                  effort: prof.effort || baseProfiles[loc.target][role]?.effort || 'medium'
                };
              }
            }
          }
        } catch {
          // Ignore malformed snapshot files and keep defaults
        }
      }
    }

    const defaultConfig = {
      schemaVersion: 1,
      projectName: path.basename(topo.parentRoot),
      repoName: topo.repoName,
      parentRoot: topo.parentRoot,
      repoRoot: topo.repoRoot,
      detectedProfile: {
        languages: detected.languages,
        packageManager: detected.packageManager,
        frameworks: detected.frameworks,
        databaseAndOrm: detected.databaseAndOrm,
        testRunner: detected.testRunner,
        hasSwaggerOrOpenApi: detected.hasSwaggerOrOpenApi
      },
      commands: detected.suggestedCommands,
      rules: {
        requireEnglishComments: true,
        requireDropTriggerIfExists: true,
        requireTestsAndDocsOnFeature: true,
        forbidDoubleAmpersand: true
      },
      subagentPipeline: {
        autoChainDevToTester: true,
        maxBugRepairRounds: 2,
        profiles: baseProfiles
      },
      sharedTouchpointFiles: detected.sharedTouchpointFiles,
      envFilesToCopy: ['.env', '.env.local', '.env.development']
    };
    fs.writeFileSync(topo.configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
  }

  // Write state.json if not present
  if (!fs.existsSync(topo.statePath)) {
    const initialState = {
      schemaVersion: 1,
      projectName: path.basename(topo.parentRoot),
      repoName: topo.repoName,
      activeWave: null,
      activeTickets: [],
      tickets: {},
      history: [
        {
          timestamp: new Date().toISOString(),
          event: 'HARNESS_INITIALIZED',
          detail: `Initialized Repo Harness in ${topo.harnessDir}`
        }
      ]
    };
    fs.writeFileSync(topo.statePath, JSON.stringify(initialState, null, 2), 'utf8');
  }

  // Create worktree-setup.mjs in <parentRoot>/harness/scripts/ if not present
  const worktreeSetupPath = path.join(topo.scriptsDir, 'worktree-setup.mjs');
  if (!fs.existsSync(worktreeSetupPath)) {
    const wtSetupContent = [
      '// Per-repo Worktree Bootstrap Harness for ' + topo.repoName,
      '// Automatically executed by Global Harness when `worktree-start <TICKET_ID>` runs.',
      '// Can be customized by the /harness skill to link node_modules/.venv or assign isolated ports.',
      'import fs from "node:fs";',
      'import path from "node:path";',
      '',
      'const worktreeDir = process.argv[2] || process.cwd();',
      'const repoRoot = process.argv[3] || "";',
      'const ticketId = process.argv[4] || "TASK-000";',
      '',
      '// Optional: Link shared node_modules from repoRoot into worktree if present to speed up parallel worktrees',
      'if (repoRoot) {',
      '  const mainNodeModules = path.join(repoRoot, "node_modules");',
      '  const wtNodeModules = path.join(worktreeDir, "node_modules");',
      '  if (fs.existsSync(mainNodeModules) && !fs.existsSync(wtNodeModules)) {',
      '    try {',
      '      fs.symlinkSync(mainNodeModules, wtNodeModules, "junction");',
      '    } catch {',
      '      // Ignore symlink errors if permissions restrict junctions',
      '    }',
      '  }',
      '}',
      'console.log(JSON.stringify({ ok: true, ticketId, worktreeDir, message: "Worktree bootstrap completed." }));'
    ].join('\n');
    fs.writeFileSync(worktreeSetupPath, wtSetupContent, 'utf8');
  }

  // Create custom-check.mjs template in <parentRoot>/harness/scripts/ if not present
  const customCheckPath = path.join(topo.scriptsDir, 'custom-check.mjs');
  if (!fs.existsSync(customCheckPath)) {
    const scriptContent = [
      '// Per-repo Custom Quality Gate Script for ' + topo.repoName,
      '// Executed automatically by Global Harness during `gate dev-done` and `gate test-pass`.',
      '// Tailored by the /harness skill to check project-specific Swagger, Unit Tests, Migrations, and Docs.',
      'import fs from "node:fs";',
      '',
      'const targetDir = process.argv[2] || process.cwd();',
      'console.log(JSON.stringify({ ok: true, checkedDir: targetDir, message: "Repo custom check passed." }));'
    ].join('\n');
    fs.writeFileSync(customCheckPath, scriptContent, 'utf8');
  }

  // Create smoke-test.mjs template in <parentRoot>/harness/scripts/ if not present
  const smokeTestPath = path.join(topo.scriptsDir, 'smoke-test.mjs');
  if (!fs.existsSync(smokeTestPath)) {
    const smokeContent = [
      '// Per-repo System & Runtime Smoke Test Harness for ' + topo.repoName,
      '// Executed automatically by Global Harness during `gate test-pass` (/tester Layer 4).',
      'import fs from "node:fs";',
      '',
      'const targetDir = process.argv[2] || process.cwd();',
      'console.log(JSON.stringify({ ok: true, checkedDir: targetDir, message: "Repo smoke test passed." }));'
    ].join('\n');
    fs.writeFileSync(smokeTestPath, smokeContent, 'utf8');
  }

  return resolveTopology(topo.parentRoot, topo.repoName);
}

/**
 * Load state.json from the Repo Harness
 */
function loadState(topo) {
  if (!fs.existsSync(topo.statePath)) {
    initRepoHarness(topo.parentRoot, topo.repoName);
  }
  return JSON.parse(fs.readFileSync(topo.statePath, 'utf8'));
}

/**
 * Save state.json to the Repo Harness
 */
function saveState(topo, state) {
  fs.writeFileSync(topo.statePath, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Register or update a ticket in state.json (Used by /po)
 */
function registerTicket(topo, ticketId, flags) {
  const state = loadState(topo);
  const existing = state.tickets[ticketId] || {};
  state.tickets[ticketId] = {
    id: ticketId,
    title: flags.title || existing.title || ticketId,
    wave: flags.wave || existing.wave || 'SEQ-1',
    boundary: flags.boundary || existing.boundary || '',
    status: existing.status || 'TODO',
    branch: `feat/${ticketId}`,
    worktreePath: path.join(topo.worktreesDir, ticketId),
    receipts: existing.receipts || {},
    updatedAt: new Date().toISOString()
  };
  state.history.push({
    timestamp: new Date().toISOString(),
    event: 'TICKET_REGISTERED',
    ticketId,
    wave: state.tickets[ticketId].wave
  });
  saveState(topo, state);
  return state.tickets[ticketId];
}

/**
 * Activate one or more tickets as the current active wave (Used exclusively by /po)
 */
function activateTickets(topo, ticketIds, waveName) {
  const state = loadState(topo);
  state.activeWave = waveName || state.activeWave || 'ACTIVE_WAVE';
  state.activeTickets = ticketIds;

  for (const id of ticketIds) {
    if (!state.tickets[id]) {
      state.tickets[id] = {
        id,
        title: id,
        wave: state.activeWave,
        boundary: '',
        status: 'IN_PROGRESS',
        branch: `feat/${id}`,
        worktreePath: path.join(topo.worktreesDir, id),
        receipts: {},
        updatedAt: new Date().toISOString()
      };
    } else {
      state.tickets[id].status = 'IN_PROGRESS';
      state.tickets[id].updatedAt = new Date().toISOString();
    }
  }

  state.history.push({
    timestamp: new Date().toISOString(),
    event: 'WAVE_ACTIVATED',
    wave: state.activeWave,
    tickets: ticketIds
  });
  saveState(topo, state);
  return { activeWave: state.activeWave, activeTickets: state.activeTickets };
}

/**
 * Provision an isolated Git Worktree in <parentRoot>/worktrees/<TICKET_ID>, inject .env, and run worktree-setup.mjs
 */
function startWorktree(topo, ticketId) {
  const state = loadState(topo);
  const ticket = state.tickets[ticketId];
  if (!ticket) {
    throw new Error(`Ticket ${ticketId} is not registered in harness/state.json. Run /po to register and activate it first.`);
  }

  const allowedStartStates = ['IN_PROGRESS', 'WORKTREE_CODING', 'BUG_FOUND', 'CHANGES_REQUESTED'];
  if (!allowedStartStates.includes(ticket.status)) {
    throw new Error(`Ticket ${ticketId} is in status '${ticket.status}', which cannot start a worktree. Allowed: ${allowedStartStates.join(', ')}`);
  }

  // Ensure repoRoot has at least one commit so git worktree can branch
  const headCheck = runShell('git rev-parse --verify HEAD', topo.repoRoot);
  if (!headCheck.ok) {
    const gitignorePath = path.join(topo.repoRoot, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, 'node_modules/\n.env\n.env.local\n', 'utf8');
    }
    runShell('git add -A', topo.repoRoot);
    runShell('git commit --allow-empty -m "chore: initial repository commit"', topo.repoRoot);
  }

  const worktreePath = path.join(topo.worktreesDir, ticketId);
  const branchName = `feat/${ticketId}`;

  if (!fs.existsSync(worktreePath)) {
    const branchExists = runShell(`git show-ref --verify --quiet refs/heads/${branchName}`, topo.repoRoot).ok;
    const wtCmd = branchExists
      ? `git worktree add "${worktreePath}" "${branchName}"`
      : `git worktree add "${worktreePath}" -b "${branchName}"`;
    const wtRes = runShell(wtCmd, topo.repoRoot);
    if (!wtRes.ok) {
      throw new Error(`Failed to create Git Worktree: ${wtRes.stderr}`);
    }
  }

  // Auto-inject .env files from <parentRoot>/harness/env/ and <repoRoot> into the worktree
  const injectedEnvFiles = [];
  if (fs.existsSync(topo.envDir)) {
    for (const file of fs.readdirSync(topo.envDir)) {
      if (file.startsWith('.env')) {
        const src = path.join(topo.envDir, file);
        const destName = file === '.env.shared' ? '.env' : file;
        fs.copyFileSync(src, path.join(worktreePath, destName));
        injectedEnvFiles.push(destName);
      }
    }
  }
  const configEnvList = topo.config?.envFilesToCopy || ['.env'];
  for (const envName of configEnvList) {
    const repoEnvPath = path.join(topo.repoRoot, envName);
    const destEnvPath = path.join(worktreePath, envName);
    if (fs.existsSync(repoEnvPath) && !fs.existsSync(destEnvPath)) {
      fs.copyFileSync(repoEnvPath, destEnvPath);
      injectedEnvFiles.push(envName);
    }
  }

  // Execute per-repo worktree-setup.mjs hook if present
  let bootstrapResult = null;
  const worktreeSetupPath = path.join(topo.scriptsDir, 'worktree-setup.mjs');
  if (fs.existsSync(worktreeSetupPath)) {
    bootstrapResult = runShell(`node "${worktreeSetupPath}" "${worktreePath}" "${topo.repoRoot}" "${ticketId}"`, worktreePath);
  }

  ticket.status = 'WORKTREE_CODING';
  ticket.worktreePath = worktreePath;
  ticket.branch = branchName;
  ticket.updatedAt = new Date().toISOString();
  state.history.push({
    timestamp: new Date().toISOString(),
    event: 'WORKTREE_STARTED',
    ticketId,
    worktreePath,
    branchName,
    injectedEnvFiles
  });
  saveState(topo, state);

  return {
    ok: true,
    ticketId,
    status: ticket.status,
    branch: branchName,
    worktreePath,
    injectedEnvFiles,
    bootstrapResult
  };
}

/**
 * Audit git diff in targetDir for mandatory global engineering rules:
 * 1. English comments only (no Vietnamese diacritics in code comments)
 * 2. DROP TRIGGER IF EXISTS before CREATE TRIGGER in migrations
 */
function auditDiffRules(topo, targetDir) {
  const diagnostics = [];
  const diffStat = runShell('git status --porcelain', targetDir);
  const diffText = runShell('git diff HEAD', targetDir).stdout || runShell('git show --format="" HEAD', targetDir).stdout;

  const changedFilesOutput =
    runShell('git diff --name-only HEAD', targetDir).stdout ||
    runShell('git diff-tree --no-commit-id --name-only -r HEAD', targetDir).stdout;
  const changedFiles = changedFilesOutput
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const relFile of changedFiles) {
    const absFile = path.join(targetDir, relFile);
    if (!fs.existsSync(absFile) || fs.statSync(absFile).isDirectory()) continue;

    const ext = path.extname(relFile).toLowerCase();
    const content = fs.readFileSync(absFile, 'utf8');

    // Rule 1: Check SQL / Migration files for CREATE TRIGGER without DROP TRIGGER IF EXISTS
    if (ext === '.sql' || relFile.toLowerCase().includes('migration')) {
      if (/CREATE\s+(OR\s+REPLACE\s+)?TRIGGER/i.test(content) && !/DROP\s+TRIGGER\s+IF\s+EXISTS/i.test(content)) {
        diagnostics.push({
          code: 'rule/trigger-missing-drop',
          severity: 'error',
          file: relFile,
          message: 'Migration contains CREATE TRIGGER without a preceding DROP TRIGGER IF EXISTS statement.'
        });
      }
    }

    // Rule 2: Check source code files for Vietnamese comments
    const codeExts = ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.go', '.cs', '.java', '.rb', '.php', '.sql'];
    if (codeExts.includes(ext)) {
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        const isComment =
          trimmed.startsWith('//') ||
          trimmed.startsWith('/*') ||
          trimmed.startsWith('*') ||
          trimmed.startsWith('#') ||
          trimmed.startsWith('--');
        if (isComment && VIETNAMESE_DIACRITIC_REGEX.test(trimmed)) {
          diagnostics.push({
            code: 'rule/vietnamese-comment-in-code',
            severity: 'error',
            file: relFile,
            line: idx + 1,
            message: 'Code comment contains Vietnamese characters. All code comments must be in English.'
          });
        }
      });
    }
  }

  return {
    changedFiles,
    uncommittedChanges: Boolean(diffStat.stdout),
    diagnostics,
    diffHash: sha256(diffText || changedFiles.join(','))
  };
}

/**
 * Run Quality Gate & State Transition (dev-done, test-pass, test-fail, po-approve, po-reject)
 */
function runGate(topo, stage, ticketId, flags) {
  const state = loadState(topo);
  const ticket = state.tickets[ticketId];
  if (!ticket) {
    throw new Error(`Ticket ${ticketId} not found in harness/state.json.`);
  }

  const worktreeDir = fs.existsSync(ticket.worktreePath) ? ticket.worktreePath : topo.repoRoot;
  const audit = auditDiffRules(topo, worktreeDir);
  const errors = audit.diagnostics.filter((d) => d.severity === 'error');

  let targetState = null;
  let commandTestResult = null;

  if (stage === 'dev-done') {
    if (errors.length > 0) {
      return writeReceiptAndReturn(topo, state, ticket, stage, false, ticket.status, audit, commandTestResult, 'Mandatory engineering rule violations found.');
    }
    // Run repo custom-check.mjs if present
    const customCheckPath = path.join(topo.scriptsDir, 'custom-check.mjs');
    if (fs.existsSync(customCheckPath)) {
      const customRes = runShell(`node "${customCheckPath}" "${worktreeDir}" "${ticketId}"`, worktreeDir);
      if (!customRes.ok) {
        audit.diagnostics.push({
          code: 'harness/custom-check-failed',
          severity: 'error',
          message: customRes.stderr || customRes.stdout
        });
        return writeReceiptAndReturn(topo, state, ticket, stage, false, ticket.status, audit, null, 'Repo custom check failed.');
      }
    }
    targetState = 'READY_FOR_TEST';
  } else if (stage === 'test-pass') {
    if (ticket.status !== 'READY_FOR_TEST' && !flags.force) {
      throw new Error(`Ticket ${ticketId} must be in READY_FOR_TEST state before running 'gate test-pass' (current: ${ticket.status}).`);
    }
    if (errors.length > 0) {
      return writeReceiptAndReturn(topo, state, ticket, stage, false, 'BUG_FOUND', audit, null, 'Static audit found rule violations during QA.');
    }
    // Run repo custom-check.mjs and smoke-test.mjs if present
    const customCheckPath = path.join(topo.scriptsDir, 'custom-check.mjs');
    if (fs.existsSync(customCheckPath)) {
      const customRes = runShell(`node "${customCheckPath}" "${worktreeDir}" "${ticketId}"`, worktreeDir);
      if (!customRes.ok) {
        audit.diagnostics.push({
          code: 'harness/custom-check-failed',
          severity: 'error',
          message: customRes.stderr || customRes.stdout
        });
        return writeReceiptAndReturn(topo, state, ticket, stage, false, 'BUG_FOUND', audit, null, 'Repo custom check failed during QA.');
      }
    }
    const smokeTestPath = path.join(topo.scriptsDir, 'smoke-test.mjs');
    if (fs.existsSync(smokeTestPath)) {
      const smokeRes = runShell(`node "${smokeTestPath}" "${worktreeDir}" "${ticketId}"`, worktreeDir);
      if (!smokeRes.ok) {
        audit.diagnostics.push({
          code: 'harness/smoke-test-failed',
          severity: 'error',
          message: smokeRes.stderr || smokeRes.stdout
        });
        return writeReceiptAndReturn(topo, state, ticket, stage, false, 'BUG_FOUND', audit, null, 'Repo smoke test failed during QA.');
      }
    }
    // Run configured test command if defined in harness.config.json
    const testCmd = topo.config?.commands?.test;
    if (testCmd) {
      commandTestResult = runShell(testCmd, worktreeDir);
      if (!commandTestResult.ok) {
        return writeReceiptAndReturn(topo, state, ticket, stage, false, 'BUG_FOUND', audit, commandTestResult, `Test command '${testCmd}' failed.`);
      }
    }
    targetState = 'READY_TO_MERGE';
  } else if (stage === 'test-fail') {
    targetState = 'BUG_FOUND';
  } else if (stage === 'po-approve') {
    if (ticket.status !== 'READY_FOR_REVIEW' && !flags.force) {
      throw new Error(`Ticket ${ticketId} must be in READY_FOR_REVIEW (merged) state before PO approval (current: ${ticket.status}).`);
    }
    targetState = 'DONE';
  } else if (stage === 'po-reject') {
    targetState = 'CHANGES_REQUESTED';
  } else {
    throw new Error(`Unknown gate stage '${stage}'. Supported: dev-done, test-pass, test-fail, po-approve, po-reject`);
  }

  return writeReceiptAndReturn(topo, state, ticket, stage, true, targetState, audit, commandTestResult, flags.reason || 'Gate passed.');
}

function computeNextAutoAction(ticketId, newStatus) {
  if (newStatus === 'READY_FOR_TEST') {
    return {
      action: 'AUTO_INVOKE_SUBAGENT',
      role: 'tester',
      ticketId,
      message: 'Dev gate passed. Automatically spawn the tester subagent using its configured model and effort tier.'
    };
  }
  if (newStatus === 'BUG_FOUND') {
    return {
      action: 'AUTO_INVOKE_SUBAGENT',
      role: 'dev',
      ticketId,
      message: 'QA gate reported defects. Automatically re-spawn the dev subagent (High effort) to fix reported bugs.'
    };
  }
  if (newStatus === 'READY_TO_MERGE') {
    return {
      action: 'READY_FOR_MERGE',
      role: 'merge',
      ticketId,
      message: 'All 4 QA layers passed. Ready to run /merge subagent.'
    };
  }
  if (newStatus === 'READY_FOR_REVIEW') {
    return {
      action: 'READY_FOR_PO_REVIEW',
      role: 'po',
      ticketId,
      message: 'Worktree merged into main repository. Ready to run /po subagent for final acceptance.'
    };
  }
  return null;
}

/**
 * Write a deterministic Receipt JSON to <parentRoot>/harness/receipts/ and update state.json
 */
function writeReceiptAndReturn(topo, state, ticket, stage, ok, newStatus, audit, commandTestResult, note) {
  const nextAutoAction = computeNextAutoAction(ticket.id, newStatus);
  const receipt = {
    schemaVersion: 1,
    ok,
    stage,
    ticketId: ticket.id,
    previousStatus: ticket.status,
    newStatus,
    nextAutoAction,
    timestamp: new Date().toISOString(),
    note,
    audit,
    commandTestResult
  };
  const receiptFileName = `${ticket.id}.${stage}.receipt.json`;
  const receiptPath = path.join(topo.receiptsDir, receiptFileName);
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8');

  ticket.status = newStatus;
  ticket.receipts = ticket.receipts || {};
  ticket.receipts[stage] = receiptPath;
  ticket.updatedAt = new Date().toISOString();

  state.history.push({
    timestamp: receipt.timestamp,
    event: `GATE_${stage.toUpperCase().replace(/-/g, '_')}`,
    ticketId: ticket.id,
    ok,
    newStatus,
    receiptPath
  });
  saveState(topo, state);
  return { ...receipt, receiptPath };
}

/**
 * Merge tested worktree branch(es) into the main repository and clean up worktrees
 */
function mergeWorktrees(topo, ticketIds, flags) {
  const state = loadState(topo);
  const targets =
    ticketIds.length > 0
      ? ticketIds
      : Object.values(state.tickets)
          .filter((t) => t.status === 'READY_TO_MERGE')
          .map((t) => t.id);

  if (targets.length === 0) {
    throw new Error('No tickets are currently in READY_TO_MERGE status.');
  }

  const results = [];
  for (const id of targets) {
    const ticket = state.tickets[id];
    if (!ticket) {
      throw new Error(`Ticket ${id} is not registered in harness/state.json.`);
    }
    if (ticket.status !== 'READY_TO_MERGE' && !flags.force) {
      throw new Error(`Ticket ${id} is in status '${ticket.status}'. It must pass /tester (READY_TO_MERGE) before merging.`);
    }

    // Commit any uncommitted files in the worktree before merging
    if (fs.existsSync(ticket.worktreePath)) {
      const wtStatus = runShell('git status --porcelain', ticket.worktreePath);
      if (wtStatus.stdout) {
        runShell('git add -A', ticket.worktreePath);
        runShell(`git commit -m "chore(${id}): auto-commit remaining worktree changes before merge"`, ticket.worktreePath);
      }
    }

    // Merge branch into main repoRoot
    const mergeRes = runShell(`git merge "${ticket.branch}" --no-ff -m "merge(${id}): integrate ${ticket.branch}"`, topo.repoRoot);
    if (!mergeRes.ok) {
      results.push({
        ticketId: id,
        ok: false,
        status: 'MERGE_CONFLICT',
        error: mergeRes.stderr || mergeRes.stdout,
        message: 'Merge conflict detected in main repository. Resolve conflicted files in repoRoot, commit, and re-run.'
      });
      continue;
    }

    // Remove worktree and temporary branch if merge succeeded
    if (fs.existsSync(ticket.worktreePath)) {
      runShell(`git worktree remove "${ticket.worktreePath}" --force`, topo.repoRoot);
    }
    runShell(`git branch -d "${ticket.branch}"`, topo.repoRoot);
    runShell('git worktree prune', topo.repoRoot);

    const receipt = writeReceiptAndReturn(
      topo,
      state,
      ticket,
      'merge-done',
      true,
      'READY_FOR_REVIEW',
      { changedFiles: [], diagnostics: [] },
      null,
      `Merged ${ticket.branch} into main repo and cleaned up worktree.`
    );
    results.push({ ticketId: id, ok: true, status: 'READY_FOR_REVIEW', receiptPath: receipt.receiptPath });
  }

  return { ok: results.every((r) => r.ok), merged: results };
}

// Main CLI Dispatcher
function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const command = positional[0] || 'status';
  const startDir = flags.cwd || process.cwd();

  try {
    if (command === 'resolve') {
      const topo = resolveTopology(startDir, flags.repo);
      console.log(JSON.stringify({ ok: true, ...topo }, null, 2));
      return;
    }

    if (command === 'detect') {
      const topo = resolveTopology(startDir, flags.repo);
      const detection = detectProjectHarnesses(topo);
      console.log(JSON.stringify({ ok: true, topology: topo, detection }, null, 2));
      return;
    }

    if (command === 'init') {
      const topo = initRepoHarness(startDir, flags.repo);
      const detection = detectProjectHarnesses(topo);
      console.log(JSON.stringify({ ok: true, command: 'init', ...topo, detection }, null, 2));
      return;
    }

    const topo = resolveTopology(startDir, flags.repo);

    if (command === 'status') {
      const state = fs.existsSync(topo.statePath) ? loadState(topo) : null;
      const worktreeList = fs.existsSync(topo.repoRoot) ? runShell('git worktree list', topo.repoRoot).stdout : '';
      console.log(JSON.stringify({ ok: true, topology: topo, state, gitWorktrees: worktreeList }, null, 2));
      return;
    }

    if (command === 'ticket-register') {
      const ticketId = positional[1];
      if (!ticketId) throw new Error('Usage: harness.mjs ticket-register <TICKET_ID> [--title "..."] [--wave "..."] [--boundary "..."]');
      const ticket = registerTicket(topo, ticketId, flags);
      console.log(JSON.stringify({ ok: true, ticket }, null, 2));
      return;
    }

    if (command === 'activate') {
      const ticketIds = positional.slice(1);
      if (ticketIds.length === 0) throw new Error('Usage: harness.mjs activate <TICKET_ID> [TICKET_ID_2 ...] [--wave "PARA-W1"]');
      const res = activateTickets(topo, ticketIds, flags.wave);
      console.log(JSON.stringify({ ok: true, ...res }, null, 2));
      return;
    }

    if (command === 'worktree-start') {
      const ticketId = positional[1];
      if (!ticketId) throw new Error('Usage: harness.mjs worktree-start <TICKET_ID>');
      const res = startWorktree(topo, ticketId);
      console.log(JSON.stringify(res, null, 2));
      return;
    }

    if (command === 'gate') {
      const stage = positional[1];
      const ticketId = positional[2];
      if (!stage || !ticketId) throw new Error('Usage: harness.mjs gate <dev-done|test-pass|test-fail|po-approve|po-reject> <TICKET_ID>');
      const res = runGate(topo, stage, ticketId, flags);
      console.log(JSON.stringify(res, null, 2));
      if (!res.ok) process.exit(1);
      return;
    }

    if (command === 'merge') {
      const ticketIds = positional.slice(1);
      const res = mergeWorktrees(topo, ticketIds, flags);
      console.log(JSON.stringify(res, null, 2));
      if (!res.ok) process.exit(1);
      return;
    }

    throw new Error(`Unknown command '${command}'. Supported: resolve, detect, init, status, ticket-register, activate, worktree-start, gate, merge`);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message }, null, 2));
    process.exit(1);
  }
}

main();
