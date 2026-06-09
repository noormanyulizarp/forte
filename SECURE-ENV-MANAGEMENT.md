# Forte Secure Environment Variable Management

## Overview

Forte provides **safe storage** for MCP environment variables (API tokens, secrets, etc.) with multiple layers of security and flexibility in variable resolution.

---

## 🔒 Security Features

### 1. Secure Storage Location

Environment variables stored in **`~/.forte/env.yaml`** with proper permissions:

```bash
# File permissions: 600 (owner read/write only)
~/.forte/env.yaml
```

**Never committed to git**:
```bash
# Added to .gitignore automatically
.env.yaml
env.yaml
*.key
*.pem
secrets.yaml
```

### 2. Multiple Source Priority

Forte resolves environment variables from multiple sources (highest to lowest):

1. **Forte env.yaml** - Encrypted storage (highest priority)
2. **User .bashrc/.zshrc** - Shell environment variables
3. **System /etc/environment** - System-wide variables
4. **Default values** - Fallback templates

---

## 🎯 Usage Scenarios

### Scenario 1: MCP with API Token

```bash
# 1. Store token securely in Forte
forte env add BRAVE_API_KEY "your-api-key-here"

# 2. Use in MCP config
forte add brave-search
# MCP config automatically references ${BRAVE_API_KEY}

# 3. Initialize to tools
forte init mcp brave-search
# All tools get encrypted token reference
```

**Result**: Token stored once, used everywhere safely.

### Scenario 2: Multiple MCP Tokens

```bash
# Store multiple tokens
forte env add BRAVE_API_KEY "brave-token"
forte env add OPENAI_API_KEY "openai-token"
forte env add ANTHROPIC_API_KEY "anthropic-token"
forte env add GITHUB_TOKEN "github-token"

# List all stored tokens
forte env list

# Use in MCPs
forte add brave-search          # Uses ${BRAVE_API_KEY}
forte add github                # Uses ${GITHUB_TOKEN}
forte add postgres              # Uses ${DATABASE_URL}
```

### Scenario 3: Load from Shell Environment

```bash
# Token already in .bashrc
export MCP_A_TOKEN="xyz123"

# Forte can read it directly
forte detect
# MCP configs automatically resolve ${MCP_A_TOKEN}
```

### Scenario 4: Mixed Sources

```bash
# .bashrc
export POSTGRES_URL="postgres://user:pass@localhost/db"

# Forte env.yaml (higher priority)
forte env add POSTGRES_URL "postgres://prod-user:prod-pass@prod-db/db"

# Forte env.yaml takes priority
forte init mcp postgres
# Uses Forte's stored value, not .bashrc
```

---

## 🛠️ Implementation

### Storage Format

**`~/.forte/env.yaml`**:
```yaml
# Encrypted at rest (AES-256)
environment:
  BRAVE_API_KEY: "encrypted:aes256:base64encrypteddata"
  OPENAI_API_KEY: "encrypted:aes256:base64encrypteddata"
  MCP_A_TOKEN: "encrypted:aes256:base64encrypteddata"
  POSTGRES_URL: "encrypted:aes256:base64encrypteddata"

# Metadata
metadata:
  version: "1.0"
  encryption: "aes256"
  created: "2026-06-09T12:00:00Z"
  updated: "2026-06-09T12:30:00Z"
```

### MCP Config Reference

**Forte unified format**:
```yaml
brave-search:
  name: "Brave Search"
  command: "npx"
  args: ["-y", "@modelcontextprotocol/server-brave-search"]
  env:
    BRAVE_API_KEY: "${BRAVE_API_KEY}"  # Auto-resolved
```

**Tool-specific format** (auto-transformed):
```json
// Claude Code
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "actual-token-value"  // Decrypted during init
      }
    }
  }
}
```

---

## 🔧 Commands

### Add Environment Variable

```bash
# Add with prompt (recommended)
forte env add BRAVE_API_KEY
# Prompt: Enter value (hidden):
# Stores encrypted

# Add with value
forte env add BRAVE_API_KEY "your-key"

# Add from file
forte env add GITHUB_TOKEN < github-token.txt

# Add from existing ENV var
forte env add BRAVE_API_KEY --from-env
```

### List Environment Variables

```bash
# List all (masked)
forte env list

# Output:
# BRAVE_API_KEY: ***REDACTED***
# OPENAI_API_KEY: ***REDACTED***
# MCP_A_TOKEN: ***REDACTED***

# Show raw values (dangerous)
forte env list --raw

# Output:
# BRAVE_API_KEY: abc123xyz
# OPENAI_API_KEY: xyz789abc
```

### Remove Environment Variable

```bash
forte env remove BRAVE_API_KEY
```

### Import/Export

```bash
# Import from .env file
forte env import .env

# Export to .env file (decrypted)
forte env export .env

# Export with template
forte env export .env --template bash
```

### Validation

```bash
# Validate all env vars
forte env validate

# Validate specific MCP
forte env validate brave-search
# Checks: BRAVE_API_KEY exists and not empty
```

---

## 🔐 Encryption

### Encryption Methods

**Option 1: System Keychain** (recommended)
```bash
# Uses system keychain for encryption key
forte env add BRAVE_API_KEY
# Key stored in macOS Keychain / Windows Credential Manager / Linux secret service
```

**Option 2: Password-based encryption**
```bash
# Set master password
forte env set-master-password

# All subsequent operations use this password
forte env add BRAVE_API_KEY "key"
# Encrypted with master password
```

**Option 3: No encryption** (not recommended)
```bash
# Store plaintext (dangerous!)
forte env add BRAVE_API_KEY "key" --no-encryption
```

### Decryption During Init

```bash
forte init mcp brave-search
# Process:
# 1. Read MCP config: ${BRAVE_API_KEY}
# 2. Resolve from Forte env.yaml (decrypt if needed)
# 3. Fall back to shell ENV var
# 4. Fall back to system /etc/environment
# 5. Insert actual value into tool config
# 6. Tool config never contains encrypted values
```

---

## 🌊 Variable Resolution Flow

```
MCP Config: ${BRAVE_API_KEY}
        ↓
┌─────────────────────────────────┐
│  Forte Resolution Chain         │
├─────────────────────────────────┤
│  1. Forte env.yaml (decrypt)    │ ← Highest priority
│  2. Shell ENV var (.bashrc)     │
│  3. System /etc/environment     │
│  4. Default value               │ ← Lowest priority
└─────────────────────────────────┘
        ↓
Actual Value: "abc123xyz"
        ↓
Tool Config (plaintext)
```

---

## 📝 Examples

### Example 1: Brave Search MCP

```bash
# 1. Add token
forte env add BRAVE_API_KEY "BSAxxxxx"

# 2. Add MCP
forte add brave-search

# 3. View MCP config
forte show brave-search
# Output:
# brave-search:
#   env:
#     BRAVE_API_KEY: "${BRAVE_API_KEY}"

# 4. Initialize to tools
forte init mcp brave-search
# Claude Code config gets actual token value

# 5. Verify
cat ~/.config/claude-code/claude_desktop_config.json | grep BRAVE_API_KEY
# Shows: "BRAVE_API_KEY": "BSAxxxxx"
```

### Example 2: Postgres MCP

```bash
# 1. Add connection string
forte env add POSTGRES_URL "postgres://user:pass@localhost/db"

# 2. Add MCP
forte add postgres

# 3. Initialize
forte init mcp postgres
# All tools get actual connection string

# 4. Verify
forte validate postgres
# Checks POSTGRES_URL is valid format
```

### Example 3: Custom MCP with Token

```bash
# 1. Add custom token
forte env add MCP_A_TOKEN "xyz123"

# 2. Add custom MCP
forte add my-custom-mcp ./my-mcp.json

# 3. Edit MCP config
cat > ~/.forte/mcp-registry/my-custom-mcp.yaml << EOF
my-custom-mcp:
  name: "My Custom MCP"
  command: "node"
  args: ["~/mcp-server/index.js"]
  env:
    API_TOKEN: "${MCP_A_TOKEN}"
EOF

# 4. Initialize
forte init mcp my-custom-mcp
# Gets actual token value
```

---

## 🛡️ Security Best Practices

### 1. File Permissions

```bash
# Set restrictive permissions
chmod 600 ~/.forte/env.yaml

# Automatic on creation
forte env add BRAVE_API_KEY "key"
# Creates with 600 permissions automatically
```

### 2. .gitignore

```bash
# ~/.forte/.gitignore
env.yaml
*.key
*.pem
secrets.yaml
.env
.encrypted
```

### 3. Encryption

```bash
# Always use encryption
forte env set-master-password

# Verify encryption
forte env list --raw
# Should fail without password
```

### 4. Audit Trail

```bash
# View access logs
forte env logs

# Output:
# 2026-06-09 12:00:00 - Added BRAVE_API_KEY
# 2026-06-09 12:05:00 - Read BRAVE_API_KEY
# 2026-06-09 12:10:00 - Updated BRAVE_API_KEY
```

---

## 🔍 Troubleshooting

### Issue: Variable Not Resolved

```bash
# Check if variable exists
forte env list | grep BRAVE_API_KEY

# Check shell ENV
echo $BRAVE_API_KEY

# Check resolution
forte env resolve BRAVE_API_KEY
# Shows: Resolved from Forte env.yaml
```

### Issue: Permission Denied

```bash
# Fix permissions
chmod 600 ~/.forte/env.yaml
chown $USER:$USER ~/.forte/env.yaml

# Retry
forte env list
```

### Issue: Decryption Failed

```bash
# Check master password
forte env verify-master-password

# Reset if needed
forte env reset-master-password
# Re-enter all tokens
```

---

## 📊 Comparison: Forte vs Manual Management

| Aspect | Manual (.bashrc) | Forte (env.yaml) |
|--------|------------------|------------------|
| **Security** | Plaintext | Encrypted |
| **Scope** | Shell-wide | Forte-specific |
| **Portability** | Machine-specific | Sync via repo |
| **Backup** | Manual | Automatic |
| **Validation** | None | Built-in |
| **Resolution** | Static | Multi-source |

---

## 🎯 Use Cases

### Use Case 1: Development Team

```bash
# Lead developer
forte env add BRAVE_API_KEY "team-key"
forte repo push --include-env  # Prompts for encryption password

# Team member
forte repo pull
forte env decrypt  # Enters team password
forte init all  # Gets team's tokens
```

### Use Case 2: Multi-Machine

```bash
# Machine A (dev)
forte env add POSTGRES_URL "postgres://dev-db"
forte repo push

# Machine B (prod)
forte repo pull
forte env add POSTGRES_URL "postgres://prod-db"  # Override
forte init all
```

### Use Case 3: Temporary Override

```bash
# Permanent value
forte env add BRAVE_API_KEY "prod-key"

# Temporary override
export BRAVE_API_KEY="test-key"
forte init mcp brave-search
# Uses test-key from ENV var

# Remove override
unset BRAVE_API_KEY
forte init mcp brave-search
# Back to prod-key from Forte
```

---

## 🚀 Advanced Features

### 1. Variable Templates

```yaml
# ~/.forte/env-templates.yaml
templates:
  postgres-dev:
    DATABASE_URL: "postgres://dev-user:dev-pass@localhost/db"
  postgres-prod:
    DATABASE_URL: "postgres://prod-user:prod-pass@prod-db"

# Use template
forte env apply-template postgres-dev
```

### 2. Variable Groups

```bash
# Group related variables
forte env group create production
forte env group add-production OPENAI_API_KEY "key"
forte env group add-production ANTHROPIC_API_KEY "key"

# Apply group
forte env use-group production
```

### 3. Variable Validation

```bash
# Define validation rules
forte env validate-rule BRAVE_API_KEY --regex "BSA.*"

# Test
forte env validate BRAVE_API_KEY
# Checks if matches regex
```

---

## 📚 Related Documentation

- [TESTING.md](./TESTING.md) - Testing environment variables
- [README.md](./README.md) - Environment management commands
- [SECURITY.md](./SECURITY.md) - Security best practices (if exists)

---

## 🎉 Summary

Forte provides **secure, flexible, and multi-source** environment variable management:

✅ **Secure Storage**: Encrypted at rest with proper permissions
✅ **Multi-Source Resolution**: Forte > Shell > System > Default
✅ **Easy Management**: Add, list, remove, import, export
✅ **Safe Integration**: Decrypts only during tool initialization
✅ **Team Sharing**: Encrypted sync via repository
✅ **Validation**: Built-in format checking

**Your MCP tokens are safe with Forte!** 🔒
