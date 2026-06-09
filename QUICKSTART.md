# Forte - Quick Start Guide

## Installation

```bash
cd /root/forte
npm install
npm run build
sudo ln -sf /root/forte/dist/cli.js /usr/local/bin/forte
```

## Basic Usage

### 1. List all registered MCPs

```bash
forte list mcp
```

### 2. List all tool profiles

```bash
forte list tools
```

### 3. Auto-discover MCPs

```bash
forte discover
```

### 4. Share an MCP to all tools

```bash
forte share agentmemory --all
```

### 5. Share an MCP to specific tools

```bash
forte share github --to claude-code,openclaw
```

### 6. Sync all configurations

```bash
forte sync --all
```

### 7. Validate everything

```bash
forte validate
```

## Current MCPs Registered

- ✅ **agentmemory** - Long-term memory (port 3111)
- ✅ **github** - GitHub integration
- ⚪ **filesystem** - File system access (disabled)
- ⚪ **postgres** - PostgreSQL access (disabled)

## Current Tools Supported

- ✅ **Claude Code** - JSON config
- ✅ **OpenCode** - JSON config
- ✅ **KiloCode** - JSON config
- ✅ **OpenClaw** - YAML config
- ✅ **Hermes** - YAML config

## Example Workflow

```bash
# 1. Discover what's installed
forte discover

# 2. List current MCPs
forte list mcp

# 3. Share agentmemory to all tools
forte share agentmemory --all

# 4. Sync configurations
forte sync --all

# 5. Validate everything works
forte validate
```

## Configuration Files

- **MCP Registry**: `/root/forte/config/mcp-registry.json`
- **Tool Profiles**: `/root/forte/config/tools-profiles.json`
- **Forte Config**: `/root/forte/config/forte-config.json`
- **Backups**: `/root/forte/backups/`

## Adding a New MCP

1. Edit `/root/forte/config/mcp-registry.json`
2. Add to `mcp_servers` object:

```json
{
  "my-mcp": {
    "command": "npx",
    "args": ["-y", "@my/mcp-server"],
    "description": "My custom MCP",
    "enabled": true
  }
}
```

3. Share to tools: `forte share my-mcp --all`
4. Sync: `forte sync --all`

## Troubleshooting

### Command not found

```bash
# Check if symlink exists
ls -la /usr/local/bin/forte

# Re-create if needed
sudo ln -sf /root/forte/dist/cli.js /usr/local/bin/forte
```

### Sync fails

```bash
# Check if config paths exist
forte validate

# Backup before sync
ls -la /root/forte/backups/
```

### MCP not running

```bash
# Check ports
netstat -tulnp | grep -E "(3111|3112|3113)"

# Check processes
ps aux | grep -i mcp
```

## Advanced Usage

### Share specific MCP to specific tools

```bash
forte share github --to claude-code,openclaw
```

### Sync only one tool

```bash
forte sync --tool openclaw
```

### Validate specific MCP

```bash
forte validate --mcp agentmemory
```

### Validate specific tool

```bash
forte validate --tool claude-code
```

## Next Steps

1. ✅ Forte is installed and working
2. 🔄 Try sharing an MCP: `forte share agentmemory --all`
3. 🔄 Sync configurations: `forte sync --all`
4. ✅ Validate: `forte validate`

## Status

🚀 **Forte v1.0.0** - Ready for production use!

- 4 MCPs registered (2 enabled)
- 5 tools supported
- Auto-discovery working
- Sync and validation working
