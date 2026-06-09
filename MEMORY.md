# Forte Project Memory & Context Document

**Purpose**: Retreivable knowledge base for AI agents (Hermes, Claude, etc.) working on the Forte project.  
**Last Updated**: 2026-06-09  
**Project Root**: `/root/forte`

---

## Project Overview

**Forte** is a **Unified MCP Manager** — a CLI tool and dashboard app that lets you manage and sync Model Context Protocol (MCP) configurations across multiple AI development tools from a single source of truth.

### Supported Tools
- Claude Code
- OpenCode
- KiloCode
- OpenClaw
- Hermes
- PicoClaw
- Cline
- Gemini Code
- Cursor
- Windsurf

### Core Value Proposition
Each tool has different config formats and MCP key paths. Forte provides:
1. One unified registry format
2. Template-based smart transformation per tool
3. Safe init with automatic backups
4. Validation, env management, disable control, and repo sync

---

## Architecture Decisions

### 1. Monorepo Structure
All code lives under `/root/forte/` — including the dashboard (Next.js app). No external sibling repos.

```
/root/forte/
├── src/                    # TypeScript source (CLI + libs)
│   ├── cli.ts             # Entry point
│   ├── commands/          # CLI command implementations
│   ├── lib/               # Core business logic
│   └── types/             # Shared TypeScript interfaces
├── dashboard/             # Next.js web dashboard (migrated from /root/forte-dashboard)
├── config/                # Static configs (tools-registry.json, forte.config.yaml)
├── tests/                 # Jest test suites
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── openspec/              # OpenSpec specifications
│   └── specs/             # Feature + testing specs
├── templates/             # Tool transformation templates
├── dist/                  # Compiled CLI output
├── node_modules/          # Dependencies
└── package.json           # Root package (CLI + Jest deps)
```

### 2. Testing Strategy
- **Framework**: Jest + ts-jest (configured in `jest.config.js`)
- **Unit tests**: `tests/unit/*.test.ts` — isolated with mocked `os.homedir()` and temp dirs
- **Integration tests**: `tests/integration/*.test.ts` — real filesystem fixtures
- **E2E tests**: `tests/e2e/*.test.ts` — full workflow isolation via temp HOME
- **CI gate**: `npm test` runs all suites; `npm run test:unit|integration|e2e` for targeted runs

### 3. Environment Isolation Pattern
Tests use this pattern to avoid touching real `~/.forte`:
```typescript
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-<module>-test-'));
jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
```
This ensures `.forte/`, `env.yaml`, backups, etc. go to `/tmp/...` during tests.

### 4. Gitignore Policy
Ignore generated/runtime artifacts only:
- `node_modules/`, `dist/`, `*.log`, `logs/`
- `backups/` (user backup data)
- `dashboard/.next/`, `dashboard/node_modules/` (build/runtime for dashboard sub-app)
- `.open-mem/` (runtime DB state for open-mem context tool)
- `openspec/changes/` (change proposals not meant for version control)

---

## Key Commands

### Development
```bash
npm run build      # tsc -> dist/
npm run dev        # tsx src/cli.ts
npm run start      # node dist/cli.js
```

### Testing
```bash
npm test           # Run all Jest tests
npm run test:unit      # Unit only
npm run test:integration  # Integration only
npm run test:e2e       # E2E only
npm run test:cov       # With coverage report
```

### Dashboard (Next.js)
```bash
cd /root/forte/dashboard
npm install
npm run dev        # http://localhost:3000
npm run build      # Production build
```

---

## OpenSpec Setup

Initialized with `openspec init . --tools none`. Specs live in `openspec/specs/`.

### Spec Index (openspec/specs/README.md)
- **Core Features**: tool detection, smart merge, env resolution
- **MCP Initialization**: init workflow, backups, nested keys
- **MCP Registry**: CRUD, persistence
- **Config Validation**: parse + sanity checks
- **Custom Tools**: registration, import, builder
- **Disable Control**: global + per-tool enable/disable
- **Discover**: NPM, process, port, Docker discovery
- **Backup System**: create, list, restore, rotation
- **Safe Config**: atomic writes, format detection
- **Testing specs**: per-module unit test requirements (path-resolver, env-storage, disable-control, backup, mcp-registry, config-handler, tool-manager, deps-check)

**Note**: `openspec validate --specs` currently does not auto-discover specs in this setup (known tooling quirk). Specs are still valid as design/test documentation.

---

## Critical Implementation Details

### Path Resolution Priority
1. CLI flag `--<tool>-path`
2. Env var `FORTE_<TOOL>_PATH`
3. `~/.forte/paths.yaml`
4. Built-in platform default (`darwin/linux/win32`)

### MCP Transformation Rules
- `string+array`: `{ command, args }` (Claude Code style)
- `array`: `[command, ...args]` (OpenClaw style)
- `scalar+list`: same as string+array but with different env key
- `env` vs `environment` field mapped per tool's `env_syntax`
- `enabled` / `disabled` flag mapped per tool's `enable_key`

### Env Resolution Chain
1. Forte managed storage (`~/.forte/env.yaml`, 0600 perms)
2. Shell environment (`process.env`)
3. Default value fallback

Variables in MCP configs use `${VAR}` syntax and are resolved before writing to tool configs.

### Backup Strategy
- Auto-backup before any `init` write: `~/.forte/backups/<toolId>-<timestamp>.bak`
- Library exposes `backupConfig`, `listBackups`, `restoreBackup`, `cleanOldBacksets`

### Disable Control Storage
File: `~/.forte/disabled-mcps.yaml` (0600 perms)
```yaml
global_disabled: [mcp-a, mcp-b]
tool_specific:
  claude-code: [mcp-c]
```
Rules: tool-specific overrides global; empty tool arrays are cleaned up.

---

## Current State (as of last commit)

**Commit**: `c2b3a37` — "Add Jest testing infrastructure and cleanup .gitignore"

### Completed
- OpenSpec initialized with 20 spec files
- Jest config + test infrastructure
- 9 unit test files created (some may need debug runs)
- Dashboard moved into `/root/forte/dashboard`
- README updated to reference local dashboard path
- .gitignore updated for monorepo layout

### Known Gaps / Next Steps
- Some unit tests still failing due to module resolution or `process.exit` in lib code (tests need `process.exit` mocked)
- Dashboard is a full Next.js app; needs its own README and run instructions documented
- `openspec validate` doesn’t auto-detect specs in this version (1.3.1) — specs serve as design docs
- Repo sync (`src/lib/repo-sync.ts`) is a stub returning "not yet implemented"
- Profile `use` command is TODO
- Backup `create`/`restore` tar.gz is TODO

---

## How Hermes / Future Agents Should Use This

1. **Read this file first** for project context
2. **Check `openspec/specs/`** for detailed requirements before implementing features
3. **Follow the isolation pattern** in tests to avoid modifying real user state
4. **Keep changes scoped**: CLI in `src/commands/`, business logic in `src/lib/`, types in `src/types/`
5. **Dashboard changes** live in `/root/forte/dashboard/` — treat it as a sub-app
6. **Run tests** before pushing: `npm test`
7. **Commit messages** should follow existing style: short imperative mood ("Add X", "Fix Y")

---

## Important File References

| File | Purpose |
|------|---------|
| `src/cli.ts` | Commander CLI entry, registers all commands |
| `src/lib/init.ts` | Core init logic: transform + apply MCPs |
| `src/lib/path-resolver.ts` | Platform-specific tool config paths |
| `src/lib/env-storage.ts` | Env var CRUD, resolution, masking |
| `src/lib/disable-control.ts` | Global + per-tool disable states |
| `src/lib/backup.ts` | Backup create/list/restore/clean |
| `src/lib/mcp-registry.ts` | MCP registry load/save/CRUD |
| `src/lib/tool-manager.ts` | Custom tool registration + validation |
| `src/lib/config-handler.ts` | Safe config analysis + atomic writes |
| `src/lib/deps-check.ts` | npm package dependency checker |
| `config/tools-registry.json` | Built-in tool definitions |
| `jest.config.js` | Jest + ts-jest configuration |
| `dashboard/` | Next.js dashboard sub-app |

---

*End of memory document*
