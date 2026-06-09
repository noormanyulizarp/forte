# Forte - Unified MCP Manager

> **Forte** - Share MCP servers across Claude Code, OpenCode, KiloCode, OpenClaw, Hermes, and other AI tools.

## Vision

Instead of configuring every MCP server in every tool separately, Forte provides:

1. **Centralized MCP Registry** - Define once, share everywhere
2. **Auto-Discovery** - Detect installed MCP tools automatically
3. **One-Command Sync** - Share MCPs to Claude Code, OpenCode, KiloCode, etc.
4. **Resource Optimization** - Single MCP instance shared across tools
5. **Agent Integration** - Works with OpenClaw, Hermes, RTK, Compressor

## Use Cases

```bash
# Auto-detect and configure all MCPs
forte init mcp --detect

# Share all MCPs to Claude Code, OpenCode, KiloCode
forte init shared --all

# Share specific MCP to specific tool
forte share agentmemory --to claude-code,opencode

# List all configured MCPs
forte list mcp

# Sync MCP config to OpenClaw
forte sync openclaw

# Auto-configure for RTK or Compressor
forte init agent --rtk
```

## Architecture

```
┌─────────────────────────────────────────────┐
│              Forte CLI                      │
│  /root/forte/                               │
│  ├── config/mcp-registry.json              │
│  ├── config/tools-profiles.json            │
│  └── templates/                            │
└─────────────────────────────────────────────┘
           │                    │
           ├────────────────────┴──────────────┐
           │                                   │
    ┌──────▼──────┐  ┌────────────┐  ┌───────▼──────┐
    │ Claude Code │  │ OpenCode   │  │ KiloCode    │
    └─────────────┘  └────────────┘  └──────────────┘
           │                                   │
    ┌──────▼──────┐  ┌────────────┐  ┌───────▼──────┐
    │ OpenClaw    │  │ Hermes     │  │ RTK/AI Tools │
    └─────────────┘  └────────────┘  └──────────────┘
```

## MCP Registry Format

```json
{
  "mcp_servers": {
    "agentmemory": {
      "command": "npx",
      "args": ["-y", "@agentmemory/mcp"],
      "env": {
        "AGENTMEMORY_PORT": "3111"
      },
      "description": "Long-term memory for AI agents",
      "homepage": "http://localhost:3113"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "description": "GitHub integration"
    }
  },
  "tools_profiles": {
    "claude-code": {
      "config_path": "~/.config/claude-code/config.json",
      "enabled_mcps": ["agentmemory", "github"]
    },
    "opencode": {
      "config_path": "~/.opencode/config.json",
      "enabled_mcps": ["agentmemory"]
    },
    "kilocode": {
      "config_path": "~/.kilocode/config.json",
      "enabled_mcps": ["agentmemory"]
    },
    "openclaw": {
      "config_path": "/root/.openclaw/config.yaml",
      "enabled_mcps": ["agentmemory", "github"]
    },
    "hermes": {
      "config_path": "/root/.hermes/config.yaml",
      "enabled_mcps": ["agentmemory"]
    }
  }
}
```

## Features

### 1. Auto-Discovery
```bash
forte discover mcp
# Scans for: npm packages, binaries, docker containers
```

### 2. Tool Profiles
```bash
forte profile create claude-code
forte profile add agentmemory --to claude-code
```

### 3. One-Command Sync
```bash
forte sync --all
# Syncs all MCPs to all configured tools
```

### 4. Validation
```bash
forte validate
# Checks if all MCPs are healthy and reachable
```

## Project Structure

```
/root/forte/
├── README.md                 # This file
├── package.json             # Node.js project
├── src/
│   ├── cli.ts              # Main CLI entry point
│   ├── commands/
│   │   ├── init.ts         # forte init commands
│   │   ├── discover.ts     # Auto-discovery
│   │   ├── share.ts        # Share MCPs
│   │   ├── sync.ts         # Sync configs
│   │   └── validate.ts     # Validation
│   ├── core/
│   │   ├── registry.ts     # MCP registry
│   │   ├── profiles.ts     # Tool profiles
│   │   └── config.ts       # Config loader
│   └── utils/
│       ├── mcp-detector.ts # MCP detection
│       └── config-writer.ts# Config file writer
├── config/
│   ├── mcp-registry.json   # MCP server definitions
│   ├── tools-profiles.json # Tool-specific profiles
│   └── forte-config.json   # Forte configuration
└── templates/
    ├── claude-code.json.j2 # Claude Code config template
    ├── opencode.json.j2    # OpenCode config template
    └── kilocode.json.j2    # KiloCode config template
```

## Implementation Priority

1. **Phase 1: Core Registry**
   - MCP registry structure
   - Basic CRUD for MCP entries
   - Config file parser/writer

2. **Phase 2: Tool Integration**
   - Claude Code config sync
   - OpenCode config sync
   - KiloCode config sync

3. **Phase 3: Auto-Discovery**
   - NPM package detection
   - Binary detection
   - Docker container detection

4. **Phase 4: Agent Integration**
   - OpenClaw MCP sync
   - Hermes MCP sync
   - RTK/Compressor support

5. **Phase 5: Advanced Features**
   - MCP health monitoring
   - Dynamic reload
   - Web UI (optional)

## Technical Details

### Supported Tools
- Claude Code (Desktop CLI)
- OpenCode
- KiloCode
- OpenClaw (YAML config)
- Hermes (YAML config)
- RTK (if applicable)
- Compressor (if applicable)

### Config Formats
- **JSON**: Claude Code, OpenCode, KiloCode
- **YAML**: OpenClaw, Hermes

### MCP Discovery
- NPM packages: `@modelcontextprotocol/server-*`
- Binaries: `which mcp-*`
- Docker: `docker ps | grep mcp`

## Why Forte?

1. **DRY Principle** - Configure once, share everywhere
2. **Resource Efficient** - Single MCP instance, multiple consumers
3. **Time Saver** - No more repetitive YAML/JSON editing
4. **Agent Friendly** - Works with AI agents like OpenClaw/Hermes
5. **Cross-Platform** - Supports multiple coding tools

## Examples

### Initial Setup
```bash
cd /root/forte
npm init -y
npm install -D typescript tsx @types/node
npx tsx src/cli.ts init mcp --detect
```

### Daily Usage
```bash
# Add new MCP
forte add my-mcp --command "npx" --args "@my/mcp"

# Share to all tools
forte share my-mcp --all

# Sync everything
forte sync --all
```

## Next Steps

1. Initialize project structure
2. Create MCP registry format
3. Build CLI parser
4. Implement config writer for each tool
5. Add auto-discovery
6. Test with real MCPs (agentmemory, github)

## License

MIT

---

**Status**: 🚀 Project initialized, ready for development
