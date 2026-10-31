# Mandatory Engineering & Workflow Rules ({{AGENT_DISPLAY_NAME}})

Always follow these rules without exception across all tasks:

1. **Language & Code Comments**:
   - Always respond to the user in **Vietnamese** (`luôn luôn trả lời bằng tiếng Việt`).
   - Always write all source code comments and docstrings in **English** (`luôn luôn comment bằng tiếng Anh`).
2. **Database Migrations & Triggers**:
   - Whenever adding a database migration that creates a trigger, you **MUST** include `DROP TRIGGER IF EXISTS ...` before the `CREATE TRIGGER` statement.
3. **Feature Completeness (Documentation, Unit Tests & Swagger)**:
   - Whenever adding a new feature, endpoint, environment variable, or library, automatically update **Documentation (`README.md`, `.env.example`)**, **Unit Tests**, and **Swagger / OpenAPI** specifications.
4. **Skill-First Execution & 6-Skill Optimal Model/Effort Policy**:
   - Always read the relevant agent skill (`SKILL.md`) before executing a task (`luôn luôn đọc agent skill để làm task`).
   - Available product lifecycle skills: `/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`, and `archify`.
   - All 6 workflow skills have dedicated role subagents installed in `{{AGENTS_DIR}}` so each skill automatically executes on its optimal model and reasoning effort tier without requiring manual model switching:

{{MODEL_POLICY_TABLE}}

   - **Auto-Chaining Rule**: Whenever `dev` ({{DEV_PROFILE_SUMMARY}}) passes `gate dev-done` (`READY_FOR_TEST`), automatically chain into `tester` ({{TESTER_PROFILE_SUMMARY}}) to run 4-layer QA (`gate test-pass` / `test-fail`).
   - Global Shared Harness CLI path: `{{HARNESS_BIN}}`
   - Archify CLI path: `{{ARCHIFY_BIN}}`
5. **Shell Command Guardrail**:
   - Never chain shell commands using `&&` (`Không chạy cmd theo kiểu '&&'`). Run separate commands instead.
6. **Proactive Visual Explainers**:
   - `[archify explainer: proactive]` Make an Archify explainer page, unasked, for explanations, comparisons, decisions, diagnoses, reviews and plans that need a table, steps or several sections.
