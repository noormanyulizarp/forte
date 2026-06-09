# Forte Feature Specification

## Overview

Forte adalah unified MCP manager yang memudahkan konfigurasi dan sinkronisasi MCP (Model Context Protocol) lintas berbagai AI development tools.

## Core Philosophy

**"One Config to Rule Them All"**

Satu konfigurasi MCP di Forte bisa diterapkan ke semua tools: Claude Code, Cline, OpenCode, KiloCode, OpenClaw, Hermes, dll.

---

## 1. Repository Integration

### Supported Platforms
- GitHub
- GitLab
- Bitbucket

### Commands

```bash
# Connect repository
forte repo connect github <username>/<repo>
forte repo connect gitlab <username>/<repo>
forte repo connect bitbucket <username>/<repo>

# Push config to repository
forte repo push [-m "commit message"]

# Pull config from repository
forte repo pull [--force]

# Disconnect repository
forte repo disconnect

# Show repository status
forte repo status
```

### How It Works

1. **Initial Setup**:
   - Forte membuat `.forte/` directory di repository root
   - Menyimpan `config.json` berisi MCP configurations
   - Menambah `.forteignore` untuk sensitive data

2. **Push**:
   - Commit changes ke `.forte/config.json`
   - Push ke branch yang dikonfigurasi (default: `main`)

3. **Pull**:
   - Fetch dari remote
   - Validasi config format
   - Apply ke local tools

### Storage Format

```json
{
  "version": "1.0.0",
  "last_updated": "2026-06-09T10:00:00Z",
  "mcp_configs": {
    "filesystem": {
      "name": "Filesystem MCP",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed"],
      "env": {}
    },
    "brave-search": {
      "name": "Brave Search",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  },
  "profiles": {
    "default": ["filesystem", "brave-search", "fetch", "memory"],
    "minimal": ["filesystem", "fetch"]
  }
}
```

---

## 2. Detection & Discovery

### Commands

```bash
# Auto-detect installed tools
forte detect [--verbose]

# List all MCP configurations
forte list [--tool <tool-name>] [--detailed]

# Show MCP details
forte show <mcp-name>
```

### Detection Process

1. Scan common config paths:
   - `~/.config/claude-code/`
   - `~/.config/claude/`
   - `~/.openclaw/`
   - `~/.hermes/`
   - `~/Library/Application Support/Claude` (macOS)
   - `~/AppData/Roaming/Claude` (Windows)

2. Identify tool by config file pattern
3. Parse MCP configurations
4. Store in Forte cache

### Example Output

```bash
$ forte detect

Scanning for AI development tools...

✓ Found: Claude Code (claude_desktop_config.json)
✓ Found: OpenClaw (config.yaml)
✓ Found: Hermes (config.yaml)
✓ Found: KiloCode (mcp.json)

Total: 4 tools detected
Run 'forte list' to see all MCP configurations
```

---

## 3. Unified Configuration

### Commands

```bash
# Initialize ALL MCPs to ALL tools
forte init all

# Initialize specific MCP to all tools
forte init mcp <mcp-name>

# Initialize all MCPs to specific tool
forte init tool <tool-name>

# Initialize with profile
forte init profile <profile-name>
```

### How It Works

1. Read Forte's unified MCP config
2. Load tool-specific template
3. Transform config using template
4. Validate output format
5. Backup original config
6. Apply new config
7. Restart tool if needed

### Template System

Setiap tool punya template di `templates/<tool>.yaml`:

```yaml
# templates/claude-code.yaml
mcp_key: "mcpServers"
command_format: "string+array"
env_syntax: "env"

transform:
  # Convert Forte format to Claude Code format
  mcp:
    name: "{{.name}}"
    command: "{{.command}}"
    args: "{{.args}}"
    env: "{{.env}}"
```

---

## 4. Template-Based Smart Merge

### Commands

```bash
# Validate configuration compatibility
forte validate <tool-name>

# Preview merge result
forte merge preview <tool> <mcp>

# Merge without applying
forte merge dry-run <tool> <mcp>

# Show conflicts
forte merge conflicts <tool>
```

### Merge Strategies

1. **Safe Merge** (default):
   - Tambah MCP baru
   - Update MCP yang ada
   - Preserve existing config

2. **Force Merge**:
   - Replace all MCP config
   - Gunakan Forte config sebagai source of truth

3. **Interactive Merge**:
   - Prompt untuk setiap conflict
   - Pilih which config to keep

### Conflict Detection

Forte detect conflicts:
- Same MCP name, different command
- Environment variable conflicts
- Port conflicts (for local servers)

---

## 5. MCP Management

### Commands

```bash
# Add MCP from registry
forte add <mcp-name>

# Add MCP from URL
forte add https://raw.githubusercontent.com/user/repo/main/mcp.json

# Add MCP from file
forte add ./path/to/mcp.json

# Remove MCP
forte remove <mcp-name> [--force]

# Update MCP to latest version
forte update <mcp-name>

# Search available MCPs
forte search <query>
```

### MCP Registry

Forte menyimpan registry MCP yang dikenal:

```json
{
  "filesystem": {
    "name": "Filesystem MCP",
    "description": "Local filesystem access",
    "official": true,
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "<PATH>"],
    "requires_env": false
  },
  "brave-search": {
    "name": "Brave Search",
    "description": "Web search via Brave",
    "official": true,
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
    "requires_env": true,
    "env_vars": ["BRAVE_API_KEY"]
  }
}
```

---

## 6. Sync & Backup

### Commands

```bash
# Backup current configs
forte backup create [--name <name>]

# List backups
forte backup list

# Restore from backup
forte backup restore <backup-id>

# Sync to cloud storage
forte sync dropbox
forte sync gdrive
forte sync icloud

# Auto-sync (daemon mode)
forte sync start --interval 30
```

### Backup Format

```
~/.forte/backups/
├── 2026-06-09_10-00-00/
│   ├── claude-code.json
│   ├── openclaw.yaml
│   ├── hermes.yaml
│   └── metadata.json
└── 2026-06-08_15-30-00/
    └── ...
```

### Cloud Sync

- **Dropbox**: Sync ke `~/Dropbox/.forte/`
- **Google Drive**: Sync ke Google Drive API
- **iCloud**: Sync ke `~/Library/Mobile Documents/com~apple~CloudDocs/.forte/`

---

## 7. Environment Management

### Commands

```bash
# List all environment variables
forte env list

# Add environment variable
forte env add <key> <value>

# Remove environment variable
forte env remove <key>

# Import from .env file
forte env import .env

# Export to .env file
forte env export .env

# Show MCPs requiring env vars
forte env required
```

### Environment Variable Storage

```yaml
# ~/.forte/env.yaml
environment:
  BRAVE_API_KEY: "your-api-key"
  OPENAI_API_KEY: "your-api-key"
  ANTHROPIC_API_KEY: "your-api-key"

# MCP configs can reference:
env:
  BRAVE_API_KEY: "${BRAVE_API_KEY}"
```

---

## 8. Profiles & Workspaces

### Commands

```bash
# Create profile
forte profile create <name> [--description <desc>]

# List profiles
forte profile list

# Use profile
forte profile use <name>

# Delete profile
forte profile delete <name>

# Create workspace
forte workspace create <name>

# Switch workspace
forte workspace use <name>
```

### Profiles

Profiles adalah preset MCP configurations:

```yaml
# ~/.forte/profiles/default.yaml
name: "default"
description: "Default MCP configuration"
mcp_list:
  - filesystem
  - brave-search
  - fetch
  - memory

# ~/.forte/profiles/minimal.yaml
name: "minimal"
description: "Minimal MCP set for quick tasks"
mcp_list:
  - filesystem
  - fetch
```

### Workspaces

Workspaces untuk project-specific configs:

```
~/.forte/workspaces/
├── project-a/
│   └── config.yaml
├── project-b/
│   └── config.yaml
└── personal/
    └── config.yaml
```

---

## 9. Additional Features

### Validation

```bash
# Validate all configs
forte validate all

# Validate specific tool
forte validate <tool-name>

# Fix validation errors
forte fix <tool-name>
```

### Diff & Compare

```bash
# Show diff between Forte and tool
forte diff <tool-name>

# Compare two tools
forte compare <tool1> <tool2>

# Show what will change
forte preview init tool <tool-name>
```

### Import/Export

```bash
# Import from tool config
forte import <tool-name>

# Export Forte config
forte export [--format json|yaml] [-o output]

# Export to specific tool format
forte export --tool <tool-name> -o output.json
```

---

## 10. Advanced Features

### Remote Config

```bash
# Fetch remote config
forte remote fetch <url>

# Apply remote config
forte remote apply <url>

# Host config server
forte server start [--port 3000]
```

### Team Sharing

```bash
# Create team config
forte team init

# Invite team member
forte team invite <email>

# Share MCP with team
forte team share <mcp-name>

# Pull team updates
forte team pull
```

### Automation

```bash
# Generate init script
forte script generate --bash > init-mcp.sh

# Apply via script
bash init-mcp.sh

# CI/CD integration
forte ci generate --github
```

---

## Comparison: 9router vs Forte

| Feature | 9router | Forte |
|---------|---------|-------|
| Purpose | Model routing | MCP management |
| Scope | AI model selection | Tool configuration |
| Config type | API endpoints | MCP servers |
| Primary use | Choosing models | Syncing configs |
| Repository | Git-based | Git-based |
| Scope per tool | Per-tool routing | Unified config |

**Key Difference**:
- 9router: "Which model to use?"
- Forte: "Which MCPs to enable?"

---

## Security Considerations

1. **Environment Variables**:
   - Sensitive data stored in `~/.forte/env.yaml`
   - Never committed to repository
   - Use `.forteignore` to exclude

2. **Validation**:
   - All configs validated before apply
   - Dangerous operations require confirmation

3. **Backup**:
   - Automatic backup before changes
   - Easy rollback capability

4. **Sanitization**:
   - Remove secrets from diffs
   - Mask API keys in logs

---

## Roadmap

### v1.0 (Current)
- Core CLI commands
- Template-based merge
- Repository integration
- Backup system

### v1.1
- Cloud sync (Dropbox, GDrive)
- Team sharing
- Profile system

### v1.2
- Remote config server
- Web UI
- MCP marketplace

### v2.0
- MCP auto-discovery
- Dependency resolution
- Conflict auto-resolution
- Testing framework
