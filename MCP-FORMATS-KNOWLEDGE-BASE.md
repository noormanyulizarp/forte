# MCP Configuration Formats - Complete Knowledge Base

> **Comprehensive reference for all MCP config formats across AI coding tools**
> 
> Last updated: 2025-06-07 | Research sources: Official docs, community guides, actual configs

---

## Table of Contents

1. [Quick Comparison](#quick-comparison)
2. [Claude Code](#1-claude-code)
3. [OpenCode](#2-opencode)
4. [KiloCode](#3-kilocode)
5. [Cline](#4-cline)
6. [OpenClaw](#5-openclaw)
7. [Hermes](#6-hermes)
8. [Transport Types](#transport-types)
9. [Migration Guide](#migration-guide)
10. [Forte Templates](#forte-templates)

---

## Quick Comparison

| Tool | Config Location | Top-level Key | Format | Env Syntax | Unique Features |
|------|-----------------|---------------|---------|-------------|------------------|
| **Claude Code** | `~/.config/claude-code/config.json` | `mcpServers` | JSON | `"env": { "KEY": "value" }` | `type: "stdio"\|"sse"\|"http"`, simple array args |
| **OpenCode** | `~/.config/opencode/opencode.json` | `mcp` | JSON | `"environment": { "KEY": "{env:VAR}" }` | `type: "local"\|"remote"`, command array, headers |
| **KiloCode** | `~/.config/kilo/kilo.jsonc` | `mcp` | JSONC | `"environment": { "KEY": "{env:VAR}" }` | Same as OpenCode, plus `permission` section |
| **Cline** | `~/.config/.../cline_mcp_settings.json` | `mcpServers` | JSON | `"env": { "KEY": "${VAR}" }` | `disabled: false`, `alwaysAllow`, `transport` object |
| **OpenClaw** | `/root/.openclaw/config.yaml` | `mcpServers` or `mcp.servers` | YAML | `env: { KEY: "$VAR" }` | YAML array or map style, `mode: stdio\|sse` |
| **Hermes** | `/root/.hermes/config.yaml` | `mcp_servers` | YAML | `env: { KEY: "${VAR}" }` | Advanced filtering, `tools.include/exclude`, SSL options |

---

## 1. Claude Code

### Config Location
- **Global**: `~/.config/claude-code/config.json` or `~/.claude.json`
- **Project**: `.mcp.json` in project root

### Format Structure

```json
{
  "mcpServers": {
    "server-name": {
      // STDIO (local process)
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {
        "ALLOWED_PATHS": "/Users/me/projects"
      }
    }
  }
}
```

### Key Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes (stdio) | Executable to run |
| `args` | array | Yes (stdio) | Arguments for command |
| `env` | object | No | Environment variables |
| `type` | string | No (remote) | `"stdio"`, `"sse"`, `"http"` |
| `url` | string | Yes (remote) | MCP endpoint URL |
| `headers` | object | No (remote) | HTTP headers |

### Examples

**Local STDIO server:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/projects"],
      "env": {
        "ALLOWED_PATHS": "/Users/me/projects"
      }
    }
  }
}
```

**Remote SSE server:**
```json
{
  "mcpServers": {
    "remote-api": {
      "type": "sse",
      "url": "https://api.example.com/mcp/sse",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

**Remote HTTP server:**
```json
{
  "mcpServers": {
    "http-service": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "X-API-Key": "${API_KEY}"
      }
    }
  }
}
```

### Unique Characteristics

- **Simple `args` array** - Not nested in `command`
- **Explicit `type` for remote** - Must specify `"sse"` or `"http"`
- **Plain `env` object** - Direct key-value pairs
- **Global + Project config** - Can have both, project overrides global

---

## 2. OpenCode

### Config Location
- **Global**: `~/.config/opencode/opencode.json` (Linux/macOS), `%APPDATA%\opencode\opencode.json` (Windows)
- **Project**: `opencode.json` in project root

### Format Structure

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "server-name": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-everything"],
      "enabled": true,
      "environment": {
        "MY_ENV_VAR": "{env:VAR_NAME}"
      }
    }
  }
}
```

### Key Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `"local"` or `"remote"` |
| `command` | array | Yes (local) | Full argv array |
| `enabled` | boolean | Yes | Enable/disable toggle |
| `environment` | object | No | Env vars with `{env:VAR}` syntax |
| `url` | string | Yes (remote) | MCP endpoint URL |
| `headers` | object | No (remote) | HTTP headers for auth |

### Examples

**Local MCP server:**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-local-mcp": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-everything"],
      "enabled": true,
      "environment": {
        "MY_ENV_VAR": "value"
      }
    }
  }
}
```

**Remote MCP server:**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

**Third-party integration (Augment Code):**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "augment-context-engine": {
      "type": "local",
      "command": ["auggie", "--mcp", "--mcp-auto-workspace"],
      "enabled": true
    }
  }
}
```

### Unique Characteristics

- **`command` is array** - Full argv including executable
- **`type: "local"\|"remote"`** - Explicit, not implicit
- **`enabled: true`** - Use positive flag, not `disabled: false`
- **`{env:VAR}` syntax** - Env var placeholder
- **No `args` separate field** - All in `command` array

---

## 3. KiloCode

### Config Location
- **Global**: `~/.config/kilo/kilo.jsonc` (Linux/macOS), `C:\Users\{USER}\.config\kilo\kilo.jsonc` (Windows)
- **Legacy CLI**: `~/.kilocode/cli/global/settings/mcp_settings.json`

### Format Structure

**Modern (kilo.jsonc):**
```jsonc
{
  "$schema": "https://app.kilo.ai/config.json",
  "mcp": {
    "my-local-server": {
      "type": "local",
      "command": ["node", "/path/to/server.js"],
      "environment": {
        "API_KEY": "your_api_key"
      },
      "enabled": true,
      "timeout": 10000
    }
  }
}
```

**Legacy CLI (mcpSettings.json):**
```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "API_KEY": "your_api_key"
      },
      "disabled": false,
      "timeout": 3600
    }
  }
}
```

### Key Differences from OpenCode

| Aspect | KiloCode (kilo.jsonc) | KiloCode (Legacy CLI) | OpenCode |
|--------|----------------------|----------------------|----------|
| Top-level key | `mcp` | `mcpServers` | `mcp` |
| Command format | Array only | `command` + `args` | Array only |
| Env key name | `environment` | `env` | `environment` |
| Enable flag | `enabled: true` | `disabled: false` | `enabled: true` |
| Extra fields | `permission` section | `alwaysAllow` list | None |

### Examples

**Local MCP (kilo.jsonc):**
```jsonc
{
  "$schema": "https://app.kilo.ai/config.json",
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp@latest"]
    }
  }
}
```

**Remote MCP (kilo.jsonc):**
```jsonc
{
  "$schema": "https://app.kilo.ai/config.json",
  "mcp": {
    "banksync": {
      "type": "remote",
      "url": "https://mcp.banksync.io",
      "headers": {
        "X-API-Key": "bsk_your_api_key_here"
      },
      "enabled": true
    }
  }
}
```

**With permission section (kilo.jsonc):**
```jsonc
{
  "$schema": "https://app.kilo.ai/config.json",
  "plugin": ["open-mem"],
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "enabled": true,
      "environment": {
        "GITHUB_TOKEN": "{env:GITHUB_TOKEN}"
      }
    }
  },
  "permission": {
    "bash": {
      "git *": "allow",
      "npm *": "allow"
    },
    "external_directory": {
      "/root/*": "allow"
    }
  }
}
```

### Unique Characteristics

- **Two config systems** - Modern `kilo.jsonc` vs Legacy CLI `mcpServers`
- **`permission` section** - Controls command/directory access
- **JSONC format** - Supports comments (`//` or `/* */`)
- **Fork of OpenCode** - MCP semantics same, outer wrapper different
- **Timeout field** - Per-server timeout in milliseconds

---

## 4. Cline

### Config Location
- **Global**: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Windows**: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- **VS Code Server**: `~/.vscode-server/data/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

### Format Structure

```json
{
  "mcpServers": {
    "server-name": {
      "command": "python",
      "args": ["/path/to/server.py"],
      "env": {
        "API_KEY": "your_api_key"
      },
      "disabled": false,
      "alwaysAllow": ["tool1", "tool2"],
      "timeout": 30
    }
  }
}
```

### Key Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes (stdio) | Executable |
| `args` | array | Yes (stdio) | Arguments |
| `env` | object | No | Environment variables |
| `disabled` | boolean | Yes | Enable/disable (false = active) |
| `alwaysAllow` | array | No | Auto-approve tools without confirmation |
| `timeout` | number | No | Per-action timeout (seconds) |
| `type` | string | No | `"stdio"`, `"streamableHttp"` |
| `url` | string | Yes (remote) | MCP endpoint |
| `transport` | object | No | SSE transport config |

### Examples

**Local STDIO server:**
```json
{
  "mcpServers": {
    "local_mcp_server": {
      "command": "/absolute/path/to/venv/bin/mcp",
      "args": ["dev", "/absolute/path/to/mcp_server.py"],
      "disabled": false
    }
  }
}
```

**Remote SSE server (transport object style):**
```json
{
  "mcpServers": {
    "debug-mcp": {
      "command": "node",
      "args": [],
      "transport": {
        "type": "sse",
        "url": "http://localhost:37337/mcp"
      }
    }
  }
}
```

**Streamable HTTP server:**
```json
{
  "mcpServers": {
    "integratedBrowser": {
      "type": "streamableHttp",
      "url": "http://127.0.0.1:3100/mcp?token=<your-token>"
    }
  }
}
```

**With alwaysAllow:**
```json
{
  "mcpServers": {
    "Bright Data Web": {
      "command": "npx",
      "args": ["@brightdata/mcp"],
      "env": {
        "API_TOKEN": "YOUR_BRIGHT_DATA_API_TOKEN"
      },
      "disabled": false,
      "alwaysAllow": ["search_engine", "scrape_as_markdown"],
      "timeout": 180
    }
  }
}
```

### Unique Characteristics

- **`disabled: false` pattern** - Uses negative flag, not `enabled: true`
- **`alwaysAllow` array** - Auto-approve specific tools
- **`transport` object** - Can specify SSE as nested object
- **`type: "streamableHttp"`** - Special HTTP streaming mode
- **Separate from VS Code native MCP** - Uses `cline_mcp_settings.json`, not `mcp.json`

---

## 5. OpenClaw

### Config Location
- **Global**: `/root/.openclaw/config.yaml`
- **Project**: `openclaw.yaml` or `config.yaml` in project root
- **Agent-level**: Inside `agents:` list in `config.yaml`

### Format Structure

**Array style (mcp.servers):**
```yaml
mcp:
  servers:
    - name: "filesystem"
      command: "npx"
      args:
        - "-y"
        - "@anthropic/mcp-server-filesystem"
        - "/home/user/docs"
      env:
        ALLOWED_PATHS: "/home/user"
```

**Map style (mcpServers):**
```yaml
mcpServers:
  filesystem:
    command: npx
    args:
      - -y
      - "@modelcontextprotocol/server-filesystem"
      - /Users/me/projects
    env:
      MY_TOKEN: $MY_TOKEN
```

**Agent-level:**
```yaml
agents:
  - id: marketing-director
    name: "Marketing Director"
    model: anthropic/claude-sonnet-4-5
    mcp_servers:
      - name: ga4
        command: npx
        args:
          - "-y"
          - "mcp-server-google-analytics"
        env:
          GOOGLE_CLIENT_EMAIL: "${GA4_CLIENT_EMAIL}"
```

### Key Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes (array style) | Server identifier |
| `command` | string | Yes (stdio) | Executable |
| `args` | list | Yes (stdio) | Arguments |
| `env` | map | No | Environment variables |
| `url` | string | Yes (HTTP) | MCP endpoint |
| `headers` | map | No (HTTP) | HTTP headers |
| `mode` | string | No | `"stdio"` or `"sse"` |

### Examples

**STDIO server (array style):**
```yaml
mcp:
  servers:
    - name: local-fs
      mode: stdio
      command: npx
      args: ["@modelcontextprotocol/server-filesystem", "/Users/me/projects"]
```

**HTTP server (map style):**
```yaml
mcpServers:
  latenode:
    url: "https://mcp.latenode.com/v1"
    headers:
      Authorization: "Bearer ${LATENODE_API_KEY}"
```

**Mixed (both stdio and HTTP):**
```yaml
model: anthropic/claude-sonnet-4-5

mcpServers:
  filesystem:
    command: npx
    args:
      - -y
      - "@anthropic/mcp-server-filesystem"
      - "/home/user/docs"

  postgres:
    command: npx
    args:
      - -y
      - "@anthropic/mcp-server-postgres"
    env:
      DATABASE_URL: "postgres://user:pass@localhost:5432/db"

  latenode:
    url: "https://mcp.latenode.com/v1"
    headers:
      Authorization: "Bearer ${LATENODE_API_KEY}"
```

### Unique Characteristics

- **YAML format** - Human-readable, supports comments
- **Two styles** - Array (`mcp.servers`) or map (`mcpServers`)
- **`mode` field** - Explicit `"stdio"` or `"sse"`
- **Agent-level MCP** - Can attach MCPs to specific agents
- **`$VAR` syntax** - Environment variable substitution
- **Precedence** - `openclaw.json` overrides `config.yaml`

---

## 6. Hermes

### Config Location
- **Main config**: `/root/.hermes/config.yaml`
- **Env file**: `/root/.hermes/.env` (for secrets)

### Format Structure

```yaml
mcp_servers:
  server_name:
    # STDIO (local process)
    command: "npx"
    args:
      - "-y"
      - "@modelcontextprotocol/server-filesystem"
      - "/home/user/projects"
    env:
      NODE_ENV: "production"
    timeout: 120
    connect_timeout: 60
    
    # OR HTTP/SSE (remote)
    url: "https://mcp.example.com/sse"
    headers:
      Authorization: "Bearer ${API_KEY}"
    ssl_verify: true
    
    # Common options
    enabled: true
    supports_parallel_tool_calls: false
    
    # Tool filtering
    tools:
      include: []
      exclude: []
    resources: true
    prompts: true
```

### Key Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes (stdio) | Executable |
| `args` | list | Yes (stdio) | Arguments |
| `env` | map | No | Environment variables |
| `url` | string | Yes (HTTP) | MCP endpoint |
| `headers` | map | No (HTTP) | HTTP headers |
| `enabled` | boolean | No | Enable/disable server |
| `timeout` | number | No | Per-tool-call timeout (seconds) |
| `connect_timeout` | number | No | Connection timeout (seconds) |
| `ssl_verify` | bool/string | No | SSL verification |
| `client_cert` | string | No | mTLS client cert path |
| `tools.include` | list | No | Whitelist tools |
| `tools.exclude` | list | No | Blacklist tools |
| `resources` | bool | No | Enable resources API |
| `prompts` | bool | No | Enable prompts API |
| `supports_parallel_tool_calls` | bool | No | Parallel execution support |

### Examples

**Minimal STDIO server:**
```yaml
mcp_servers:
  time:
    command: "uvx"
    args: ["mcp-server-time"]
```

**Full STDIO server with env:**
```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args:
      - "-y"
      - "@modelcontextprotocol/server-filesystem"
      - "/home/user/projects"
    env:
      NODE_ENV: "production"
    timeout: 120
    connect_timeout: 60
```

**HTTP/SSE server with TLS:**
```yaml
mcp_servers:
  github:
    url: "https://mcp.github.com/sse"
    headers:
      Authorization: "Bearer ${GITHUB_TOKEN}"
    timeout: 180
    connect_timeout: 60
    ssl_verify: true
```

**With tool filtering:**
```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_your_token_here"
    
    tools:
      include:
        - create_issue
        - list_repos
      exclude:
        - delete_repo
    
    resources: false
    prompts: false
```

**Advanced with mTLS:**
```yaml
mcp_servers:
  corporate-mcp:
    url: "https://mcp.company.com/v1"
    headers:
      Authorization: "Bearer ${CORP_API_KEY}"
    ssl_verify: "/path/to/ca-bundle.pem"
    client_cert: "/path/to/client-cert.pem"
    client_key: "/path/to/client-key.pem"
    timeout: 300
    connect_timeout: 60
```

### Unique Characteristics

- **Advanced filtering** - `tools.include/exclude` for fine-grained control
- **SSL/TLS options** - CA bundle, mTLS client certs
- **Timeout granularity** - Separate `timeout` and `connect_timeout`
- **Resource/Prompt toggles** - Can disable resources or prompts per server
- **Parallel tool calls** - `supports_parallel_tool_calls` flag
- **`${VAR}` syntax** - Environment variable substitution in strings

---

## Transport Types

### STDIO (Local Process)

**Characteristics:**
- MCP server runs as subprocess
- Communicates via stdin/stdout
- Most common for local tools

**When to use:**
- Local MCP packages (npm, Python)
- Full control over server lifecycle
- Low latency

**Common patterns:**
```json
// Claude Code / Cline
{ "command": "npx", "args": ["-y", "@package/mcp"] }

// OpenCode / KiloCode
{ "type": "local", "command": ["npx", "-y", "@package/mcp"] }

// YAML
command: npx
args: ["-y", "@package/mcp"]
```

### HTTP / SSE (Remote)

**Characteristics:**
- MCP server accessed via HTTP
- Can be SSE (Server-Sent Events) or plain HTTP
- Requires URL and often auth headers

**When to use:**
- Cloud-hosted MCP services
- Shared MCP instances
- Managed MCP providers

**Common patterns:**
```json
// Claude Code
{ "type": "sse", "url": "https://api.example.com/mcp/sse", "headers": { "Authorization": "Bearer ${TOKEN}" } }

// OpenCode / KiloCode
{ "type": "remote", "url": "https://api.example.com/mcp", "headers": { "X-API-Key": "${TOKEN}" } }

// Cline
{ "type": "streamableHttp", "url": "https://api.example.com/mcp?token=${TOKEN}" }
```

---

## Migration Guide

### Claude Code → OpenCode

**Before (Claude Code):**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    }
  }
}
```

**After (OpenCode):**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "enabled": true,
      "environment": {
        "GITHUB_TOKEN": "{env:GITHUB_TOKEN}"
      }
    }
  }
}
```

**Changes:**
1. `"mcpServers"` → `"mcp"`
2. `"command"` + `"args"` → `"command"` array
3. `"env"` → `"environment"`
4. Add `"type": "local"`
5. Add `"enabled": true`
6. Env values: `"ghp_..."` → `"{env:GITHUB_TOKEN}"`

### OpenCode → KiloCode

**Before (OpenCode):**
```json
{
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "enabled": true,
      "environment": {
        "GITHUB_TOKEN": "{env:GITHUB_TOKEN}"
      }
    }
  }
}
```

**After (KiloCode):**
```jsonc
{
  "$schema": "https://app.kilo.ai/config.json",
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "enabled": true,
      "environment": {
        "GITHUB_TOKEN": "{env:GITHUB_TOKEN}"
      }
    }
  },
  "permission": {
    "bash": {},
    "external_directory": {}
  }
}
```

**Changes:**
1. Schema URL: `opencode.ai` → `app.kilo.ai`
2. File format: JSON → JSONC (allow comments)
3. Add `permission` section (Kilo-specific)

### OpenCode → OpenClaw YAML

**Before (OpenCode JSON):**
```json
{
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "environment": {
        "GITHUB_TOKEN": "{env:GITHUB_TOKEN}"
      }
    }
  }
}
```

**After (OpenClaw YAML - map style):**
```yaml
mcpServers:
  github:
    command: npx
    args:
      - -y
      - "@modelcontextprotocol/server-github"
    env:
      GITHUB_TOKEN: "${GITHUB_TOKEN}"
```

**Changes:**
1. `"mcp"` → `"mcpServers"` (map style)
2. `"type": "local"` → implicit (no `type` needed)
3. `"command"` array → `"command"` scalar
4. `"environment"` → `"env"`
5. `"{env:VAR}"` → `"${VAR}"`

### OpenCode → Hermes

**Before (OpenCode JSON):**
```json
{
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "enabled": true,
      "environment": {
        "GITHUB_TOKEN": "{env:GITHUB_TOKEN}"
      }
    }
  }
}
```

**After (Hermes YAML):**
```yaml
mcp_servers:
  github:
    command: "npx"
    args:
      - "-y"
      - "@modelcontextprotocol/server-github"
    env:
      GITHUB_TOKEN: "${GITHUB_TOKEN}"
    enabled: true
    timeout: 120
    connect_timeout: 60
    tools:
      include: []
      exclude: []
    resources: true
    prompts: true
```

**Changes:**
1. Top-level: `"mcp"` → `"mcp_servers"`
2. `"command"` array → `"command"` scalar
3. `"environment"` → `"env"`
4. Add Hermes-specific fields (timeout, tools filtering)

---

## Forte Templates

### Template Structure for Forte v1.1

```
/root/forte/templates/
├── claude-code/
│   └── config.json.j2
├── opencode/
│   └── config.json.j2
├── kilocode/
│   └── config.jsonc.j2
├── cline/
│   └── mcp_settings.json.j2
├── openclaw/
│   └── config.yaml.j2
└── hermes/
    └── config.yaml.j2
```

### Key Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{mcp_id}}` | MCP server name | `"github"`, `"agentmemory"` |
| `{{mcp_command}}` | Command executable | `"npx"`, `"node"` |
| `{{mcp_args}}` | Arguments array | `["-y", "@package/mcp"]` |
| `{{mcp_env}}` | Environment variables | `{ "API_KEY": "value" }` |
| `{{mcp_url}}` | Remote MCP URL | `"https://api.example.com/mcp"` |
| `{{mcp_headers}}` | HTTP headers | `{ "Authorization": "Bearer ${TOKEN}" }` |
| `{{mcp_type}}` | Transport type | `"local"`, `"remote"`, `"stdio"`, `"sse"` |
| `{{mcp_enabled}}` | Enable flag | `true` / `false` / `null` |

### Sample Template: OpenCode

```jinja2
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["open-mem"],
  "mcp": {
    {% for mcp in mcps %}
    "{{ mcp.id }}": {
      "type": "{{ mcp.type }}",
      {% if mcp.type == "local" %}
      "command": [{{ mcp.command | join(', ') }}],
      {% if mcp.env %}
      "environment": {
        {% for key, value in mcp.env.items() %}
        "{{ key }}": "{{ value }}"{% if not loop.last %},{% endif %}
        {% endfor %}
      },
      {% endif %}
      {% elif mcp.type == "remote" %}
      "url": "{{ mcp.url }}",
      {% if mcp.headers %}
      "headers": {
        {% for key, value in mcp.headers.items() %}
        "{{ key }}": "{{ value }}"{% if not loop.last %},{% endif %}
        {% endfor %}
      },
      {% endif %}
      {% endif %}
      "enabled": {{ mcp.enabled | default(true) }}
    }{% if not loop.last %},{% endif %}
    {% endfor %}
  }
}
```

### Sample Template: Hermes

```jinja2
mcp_servers:
  {% for mcp in mcps %}
  {{ mcp.id }}:
    {% if mcp.type == "local" %}
    command: "{{ mcp.command }}"
    args:
      {% for arg in mcp.args %}
      - "{{ arg }}"
      {% endfor %}
    {% if mcp.env %}
    env:
      {% for key, value in mcp.env.items() %}
      {{ key }}: "{{ value }}"
      {% endfor %}
    {% endif %}
    {% elif mcp.type == "remote" %}
    url: "{{ mcp.url }}"
    {% if mcp.headers %}
    headers:
      {% for key, value in mcp.headers.items() %}
      {{ key }}: "{{ value }}"
      {% endfor %}
    {% endif %}
    {% endif %}
    enabled: {{ mcp.enabled | default(true) }}
    timeout: {{ mcp.timeout | default(120) }}
    connect_timeout: {{ mcp.connect_timeout | default(60) }}
    tools:
      include: []
      exclude: []
    resources: true
    prompts: true
  
  {% endfor %}
```

---

## Summary Matrix

| Tool | Format | Top Key | Command | Args | Env | Type | URL | Enable Flag | Unique |
|------|--------|----------|---------|------|-----|------|-----|-------------|---------|
| Claude Code | JSON | `mcpServers` | string | array | `env` | `"stdio"\|"sse"\|"http"` | ✓ | N/A | Simple args |
| OpenCode | JSON | `mcp` | array | N/A | `environment` | `"local"\|"remote"` | ✓ | `enabled: true` | Command array, `{env:VAR}` |
| KiloCode | JSONC | `mcp` | array | N/A | `environment` | `"local"\|"remote"` | ✓ | `enabled: true` | `permission`, comments |
| KiloCode CLI | JSON | `mcpServers` | string | array | `env` | N/A | ✓ | `disabled: false` | Legacy format |
| Cline | JSON | `mcpServers` | string | array | `env` | `"stdio"\|"streamableHttp"` | ✓ | `disabled: false` | `alwaysAllow`, `transport` |
| OpenClaw | YAML | `mcpServers` or `mcp.servers` | scalar | list | `env` | N/A | ✓ | N/A | YAML, two styles |
| Hermes | YAML | `mcp_servers` | scalar | list | `env` | N/A | ✓ | `enabled: true` | Filtering, SSL, timeouts |

---

## Sources

- Claude Code: Anthropic official docs, community guides
- OpenCode: open-code.ai official docs, community examples
- KiloCode: kilo.ai docs, GitHub issues, community posts
- Cline: docs.cline.bot, VS Code marketplace, GitHub repo
- OpenClaw: learnopenclaw.org, community tutorials, GitHub
- Hermes: hermes-agent.nousresearch.com, official docs, GitHub

---

**Last Updated:** 2025-06-07  
**Status:** ✅ Complete - Ready for Forte implementation  
**Next Step:** Build Forte v1.1 with template-based mapping
