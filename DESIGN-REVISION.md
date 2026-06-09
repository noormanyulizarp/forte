# Forte Design Revision - Handling Config Differences

## Problem

Setiap tool punya config format yang **BEDA**:
- OpenCode vs KiloCode (fork OpenCode tapi ada differences)
- Claude Code (format berbeda total)
- OpenClaw/Hermes (YAML format)

## Solution: Template-based Mapping + Schema Discovery

### Phase 1: Template Mapping (REALISTIC)

Forte maintain **template per tool**:

```
/root/forte/templates/
├── claude-code/
│   └── config.json.j2
├── opencode/
│   └── config.json.j2
├── kilocode/
│   └── config.json.j2
├── openclaw/
│   └── config.yaml.j2
└── hermes/
    └── config.yaml.j2
```

### Phase 2: Schema Discovery (ADVANCED)

Auto-detect config format dari tool yang exist:

```bash
forte discover tool opencode
# Reads: ~/.config/opencode/opencode.json
# Detects: mcp structure, type: local/remote
# Generates: template automatically
```

### Phase 3: Validation & Merge

Forte tidak **OVERWRITE** tapi **MERGE**:

1. **Backup** existing config
2. **Read** current config
3. **Detect** existing MCPs
4. **Merge** dengan Forte registry
5. **Write** merged config

## Implementation Plan

### v1.1 - Template-based Approach (Short-term)

```typescript
// /root/forte/src/core/templates.ts
export function renderTemplate(tool: string, mcps: MCP[]): string {
  const template = loadTemplate(tool);

  if (tool === 'opencode') {
    return renderOpenCodeTemplate(mcps);
  } else if (tool === 'kilocode') {
    return renderKiloCodeTemplate(mcps);
  } else if (tool === 'claude-code') {
    return renderClaudeCodeTemplate(mcps);
  } else if (tool === 'openclaw') {
    return renderOpenClawTemplate(mcps);
  }
}

function renderOpenCodeTemplate(mcps: MCP[]): string {
  const config: any = {
    "$schema": "https://opencode.ai/config.json",
    "plugin": ["open-mem"],
    "mcp": {}
  };

  for (const mcp of mcps) {
    config.mcp[mcp.id] = {
      "type": mcp.type || "local",
      "command": mcp.command,
      "enabled": mcp.enabled,
      ...(mcp.env && { "environment": mcp.env }),
      ...(mcp.url && { "url": mcp.url }),
      ...(mcp.headers && { "headers": mcp.headers })
    };
  }

  return JSON.stringify(config, null, 2);
}

function renderKiloCodeTemplate(mcps: MCP[]): string {
  const config: any = {
    "$schema": "https://app.kilo.ai/config.json",
    "plugin": ["open-mem"],
    "mcp": {},
    "permission": {
      "bash": {},
      "external_directory": {}
    }
  };

  // Same MCP structure as OpenCode
  for (const mcp of mcps) {
    config.mcp[mcp.id] = {
      "type": mcp.type || "local",
      "command": mcp.command,
      "enabled": mcp.enabled,
      ...(mcp.env && { "environment": mcp.env })
    };
  }

  return JSON.stringify(config, null, 2);
}
```

### v1.2 - Schema Discovery (Medium-term)

```bash
# Auto-detect schema dari existing config
forte discover schema --tool kilocode

# Output:
# Schema detected:
# - Format: JSONC
# - MCP structure: mcp.{name}.type = "local"|"remote"
# - Env vars: mcp.{name}.environment.{key} = "{env:VAR_NAME}"
# - Remote MCPs: mcp.{name}.url, mcp.{name}.headers
```

### v1.3 - Smart Merge (Long-term)

```typescript
// Merge config tanpa destroy existing settings
function mergeConfig(existing: any, forte: any): any {
  const merged = { ...existing };

  // Preserve non-MCP settings
  // (plugin, permission, snapshot, etc)

  // Update only MCP section
  merged.mcp = {
    ...existing.mcp,  // Keep existing MCPs
    ...forte.mcp      // Add/update from Forte
  };

  return merged;
}
```

## Command Flow

```bash
# 1. Discover existing config
forte discover config --tool opencode

# 2. Generate template (auto or manual)
forte template generate --tool opencode

# 3. Sync dengan merge
forte sync --tool opencode --merge

# 4. Validate result
forte validate --tool opencode
```

## Key Insights

1. **OpenCode & KiloCode MCP format sama** - Ini bagus!
2. **KiloCode punya `permission` section** - Must preserve!
3. **Claude Code format beda** - Need separate template
4. **Remote MCPs** - OpenCode/KiloCode support remote MCPs via URL
5. **Env vars** - Use `{env:VAR_NAME}` placeholder syntax

## Next Steps

1. ✅ Update Forte dengan template system
2. ✅ Implement smart merge (preserve non-MCP settings)
3. ✅ Add schema discovery
4. ✅ Support remote MCPs
5. ✅ Handle env var placeholders

---

**Status**: 🔄 Design revision needed - Forte v1.1 will use template-based approach
