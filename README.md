# Forte

> **Unified MCP Manager** - Share MCP configurations across Claude Code, OpenCode, KiloCode, OpenClaw, Hermes, and more!

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## 🎯 What is Forte?

Forte adalah **unified MCP manager** yang memudahkan konfigurasi dan sinkronisasi **Model Context Protocol (MCP)** lintas berbagai AI development tools.

**Problem**: Setiap tool (Claude Code, OpenClaw, Hermes, dll) punya format config MCP yang berbeda dan tidak compatible.

**Solution**: Forte menyediakan **satu unified format** yang bisa di-convert otomatis ke format tiap tool melalui **template-based smart merge**.

---

## ✨ Key Features

- 🔍 **Auto-Detection** - Scan dan detect installed AI tools automatically
- 🔄 **Smart Merge** - Template-based config transformation
- 📦 **Centralized Registry** - Satu MCP config untuk semua tools
- 🌐 **Repository Sync** - Share configs via GitHub/GitLab/Bitbucket
- 💾 **Safe Backups** - Auto-backup sebelum apply changes
- ✅ **Validation** - Config compatibility checks
- 🎨 **Web Dashboard** - Visual management interface

---

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/forte.git
cd forte

# Install dependencies
npm install

# Build CLI
npm run build

# Link globally (optional)
sudo npm link
```

### Basic Usage

```bash
# 1. Detect installed tools
forte detect

# 2. List all MCP configurations
forte list

# 3. Add MCP to registry
forte add brave-search

# 4. Initialize ALL MCPs to ALL tools
forte init all

# 5. Validate configurations
forte validate all
```

---

## 📖 How To Use

### 1. Tool Detection

Scan system untuk AI tools yang terinstall:

```bash
forte detect
```

**Output:**
```
🔍 Scanning for AI development tools...

✓ Found: Claude Code (claude_desktop_config.json)
✓ Found: OpenClaw (config.yaml)
✓ Found: Hermes (config.yaml)

Total: 3 tools detected
```

**With details:**
```bash
forte detect --verbose
```

---

### 2. List MCP Configurations

Lihat semua MCP yang terkonfigurasi:

```bash
forte list
```

**Output:**
```
📋 MCP Configurations

Claude Code:
  Config: ~/.config/claude-code/claude_desktop_config.json
  MCPs (3):
    - filesystem
    - brave-search
    - fetch

OpenClaw:
  Config: ~/.openclaw/config.yaml
  MCPs (2):
    - filesystem
    - memory

Total: 2 tool(s), 5 MCP(s)
```

**Filter by tool:**
```bash
forte list --tool openclaw
```

**Show detailed info:**
```bash
forte list --detailed
```

---

### 3. MCP Management

#### Add MCP to Registry

```bash
# From registry
forte add filesystem

# From file
forte add ./my-mcp.json

# From URL (coming soon)
forte add https://raw.githubusercontent.com/user/repo/mcp.json
```

#### Remove MCP

```bash
forte remove old-mcp
```

#### Update MCP

```bash
forte update filesystem
```

---

### 4. Initialize Configurations

#### Apply ALL MCPs to ALL Tools

```bash
forte init all
```

**Output:**
```
🚀 Initializing ALL MCPs to ALL tools...

Processing Claude Code...
  📦 Backed up to ~/.forte/backups/claude-code-20260609.bak
  ✓ Applied 6 MCPs

Processing OpenClaw...
  📦 Backed up to ~/.forte/backups/openclaw-20260609.bak
  ✓ Applied 6 MCPs

==================================================
Summary:
  Success: 2/2
  Failed: 0/2
```

#### Apply Specific MCP

```bash
# Apply brave-search to all tools
forte init mcp brave-search
```

#### Apply to Specific Tool

```bash
# Apply all MCPs to OpenClaw only
forte init tool openclaw
```

#### Apply Profile

```bash
forte init profile minimal
```

---

### 5. Validation

Validate config compatibility:

```bash
# Validate all tools
forte validate all

# Validate specific tool
forte validate hermes
```

**Output:**
```
🔍 Validating all tools...

✓ Claude Code
  ⚠️  MCP 'filesystem': Missing PATH argument

✓ OpenClaw
✓ Hermes

✗ KiloCode
  ❌ MCP 'postgres': Invalid database URL
```

---

### 6. Backup & Restore

#### Create Backup

```bash
forte backup create --name "before-changes"
```

#### List Backups

```bash
forte backup list
```

**Output:**
```
📦 Backups:

  1. before-changes.tar.gz
     Size: 12.5 KB
     Date: 2026-06-09 12:00:00

  2. backup-20260609.tar.gz
     Size: 11.2 KB
     Date: 2026-06-08 15:30:00
```

#### Restore Backup

```bash
forte backup restore before-changes.tar.gz
```

---

### 7. Environment Variables

Manage environment variables untuk MCP yang butuh API keys:

```bash
# List all env vars
forte env list

# Add env var
forte env add BRAVE_API_KEY "your-api-key"

# Remove env var
forte env remove BRAVE_API_KEY

# Import from .env file
forte env import .env

# Export to .env file
forte env export .env
```

---

### 8. Profile Management

Create dan gunakan configuration profiles:

```bash
# Create profile
forte profile create minimal \
  --description "Minimal MCP set for quick tasks"

# List profiles
forte profile list

# Use profile
forte profile use minimal

# Delete profile
forte profile delete old-profile
```

---

### 9. Repository Integration

#### Connect Repository

```bash
# GitHub
forte repo connect github username/forte-configs

# GitLab
forte repo connect gitlab username/forte-configs

# Bitbucket
forte repo connect bitbucket username/forte-configs
```

#### Push Config

```bash
forte repo push -m "Add Postgres MCP"
```

#### Pull Config

```bash
forte repo pull

# Force overwrite
forte repo pull --force
```

#### Show Status

```bash
forte repo status
```

---

## 📚 Advanced Usage

### Configuration File

Forte menggunakan `~/.forte/forte.config.yaml`:

```yaml
version: "1.0.0"

# MCP Registry
mcp_registry:
  filesystem:
    name: "Filesystem MCP"
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "<PATH>"]
  
  brave-search:
    name: "Brave Search"
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-brave-search"]
    env:
      BRAVE_API_KEY: "${BRAVE_API_KEY}"

# Profiles
profiles:
  default:
    description: "Default MCP configuration"
    mcp_list:
      - filesystem
      - brave-search
      - fetch
      - memory
  
  minimal:
    description: "Minimal MCP set"
    mcp_list:
      - filesystem
      - fetch

# Repository
repository:
  platform: github
  owner: username
  repo: forte-configs
  branch: main
```

### Environment Variables

File `~/.forte/env.yaml` untuk sensitive data:

```yaml
environment:
  BRAVE_API_KEY: "your-api-key"
  OPENAI_API_KEY: "your-api-key"
  ANTHROPIC_API_KEY: "your-api-key"
```

**Never commit env.yaml to repository!**

### Tool Registry

Custom tool definitions di `~/.forte/tools-registry.json`:

```json
{
  "tools": {
    "my-tool": {
      "name": "My Custom Tool",
      "type": "code_editor",
      "config_path": "~/.my-tool/config.json",
      "config_format": "json",
      "mcp_key": "mcpServers",
      "supports_env": true,
      "enable_key": null,
      "command_format": "string+array",
      "env_syntax": "env"
    }
  }
}
```

---

## 🔧 How It Works

### Template-Based Smart Merge

Forte menggunakan template per tool untuk transform config:

```typescript
// Template untuk Claude Code
{
  mcp_key: "mcpServers",
  command_format: "string+array",
  env_syntax: "env",
  transform: (forteConfig) => ({
    name: forteConfig.name,
    command: forteConfig.command,
    args: forteConfig.args,
    env: forteConfig.env
  })
}

// Template untuk OpenClaw (array format)
{
  mcp_key: "mcp",
  command_format: "array",
  env_syntax: "env",
  transform: (forteConfig) => [
    forteConfig.command,
    ...forteConfig.args
  ]
}
```

### Transformation Pipeline

```
Forte Unified Format
        ↓
   [Template Loader]
        ↓
   [Format Transformer]
        ↓
   [Config Validator]
        ↓
   [Backup Manager]
        ↓
   [Config Applier]
        ↓
Tool Native Format
```

---

## 🎨 Forte Dashboard

Web-based UI untuk visual management:

```bash
cd /root/forte/dashboard
npm run dev
# Visit http://localhost:3000
```

**Features:**
- Real-time stats
- Tool management
- MCP registry browser
- Profile management
- Repository integration

See [Forte Dashboard](./dashboard) for details.

---

## 📖 Examples

### Example 1: First-Time Setup

```bash
# 1. Detect tools
forte detect

# 2. Add popular MCPs
forte add filesystem
forte add brave-search
forte add fetch
forte add memory

# 3. Apply to all tools
forte init all

# 4. Validate
forte validate all
```

### Example 2: Multi-Machine Sync

**Machine A:**
```bash
forte repo connect github user/forte-configs
forte add postgres
forte init all
forte repo push -m "Add Postgres MCP"
```

**Machine B:**
```bash
forte repo connect github user/forte-configs
forte repo pull
forte init all
```

### Example 3: Team Workflow

**Team Lead:**
```bash
forte profile create team-standard --description "Team standard config"
forte profile use team-standard
forte repo push
```

**Team Member:**
```bash
forte repo pull
forte init profile team-standard
```

### Example 4: Quick Setup with Profile

```bash
# Use built-in minimal profile
forte init profile minimal

# Custom profile
forte profile create my-setup
# Edit ~/.forte/profiles/my-setup.yaml
forte init profile my-setup
```

---

## 🛠️ Troubleshooting

### Tool Not Detected

```bash
# Check if config file exists
ls ~/.config/claude-code/claude_desktop_config.json

# Verify path in tools-registry.json
cat ~/.forte/tools-registry.json | grep claude-code
```

### Config Not Applied

```bash
# Check if backup was created
ls ~/.forte/backups/

# Validate config
forte validate <tool-name>

# Restore from backup
forte backup restore <backup-id>
```

### Repository Sync Issues

```bash
# Check repo status
forte repo status

# Verify authentication
export GITHUB_TOKEN="your-token"
forte repo push
```

### Format Conflicts

```bash
# Preview merge result
forte merge preview <tool> <mcp>

# Show conflicts
forte merge conflicts <tool>

# Force apply
forte init all --force
```

---

## 🔒 Security

### Environment Variables

```bash
# Use env.yaml for sensitive data
forte env add BRAVE_API_KEY "your-key"

# Never commit env.yaml
echo "env.yaml" >> .gitignore
```

### Backup Security

```bash
# Backups stored in ~/.forte/backups/
# Encrypt if needed
gpg --cipher-algo AES256 --symmetric ~/.forte/backups/
```

### Repository Security

```bash
# Use personal access tokens
export GITHUB_TOKEN="ghp_xxx"

# Use SSH keys
git remote set-url origin git@github.com:user/repo.git
```

---

## 📊 Supported Tools

| Tool | Config Format | MCP Key | Status |
|------|--------------|---------|--------|
| Claude Code | JSON | `mcpServers` | ✅ Supported |
| Cline | YAML | `mcp` | ✅ Supported |
| OpenCode | JSON | `mcp` | ✅ Supported |
| KiloCode | JSON | `mcp_servers` | ✅ Supported |
| OpenClaw | YAML | `mcp` | ✅ Supported |
| Hermes | YAML | `mcp_servers` | ✅ Supported |
| PicoClaw | JSON | `mcp.servers` | ✅ Supported |

---

## 🤝 Contributing

Contributions are welcome!

1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Claude MCP** - Model Context Protocol specification
- **9router** - Inspiration for unified config management
- **All AI Tools** - Claude Code, OpenClaw, Hermes, and others

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/forte/issues)
- **Documentation**: [Forte Wiki](https://github.com/yourusername/forte/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/forte/discussions)

---

## 🗺️ Roadmap

### v1.0 (Current)
- ✅ Core CLI commands
- ✅ Tool detection
- ✅ Smart merge system
- ✅ Backup system
- ✅ Repository integration

### v1.1 (Planned)
- ⏳ Cloud sync (Dropbox, GDrive, iCloud)
- ⏳ Team sharing
- ⏳ Advanced conflict resolution
- ⏳ Config diff viewer

### v1.2 (Planned)
- ⏳ MCP marketplace
- ⏳ Plugin system
- ⏳ Webhook integrations
- ⏳ Multi-server management

---

**Made with ❤️ for the AI development community**

For more information, visit [forte.dev](https://forte.dev) or check out the [Forte Dashboard](../forte-dashboard/).
