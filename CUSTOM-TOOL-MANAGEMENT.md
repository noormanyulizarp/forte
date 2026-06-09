# Forte Custom Tool Management

## Overview

Forte supports **custom tool addition** when auto-detection fails. This allows users to manually add tools, import tool configurations, and maintain them properly.

---

## 🎯 Use Cases

### When Detection Fails

```bash
# Scenario: Tool installed in non-standard location
forte detect
# Output: ✗ VSCode - Config file not found

# Solution: Add custom tool
forte tool add vscode
# Follow prompts to specify path and format
```

### When Tool Not Supported

```bash
# Scenario: New tool not in registry
forte detect
# Output: ✗ Windsurf - Not in tool registry

# Solution: Import tool config
forte tool import windsurf ~/.windsurf/settings.json
# Automatically analyzes format and adds to registry
```

### When Custom Configuration

```bash
# Scenario: Custom tool with unique MCP format
forte tool create my-custom-tool
# Interactive tool builder
```

---

## 🔧 Tool Management Commands

### 1. Add Custom Tool

```bash
forte tool add <tool-name>
```

**Interactive prompts**:
```
Tool name: my-custom-tool
Display name: My Custom Tool
Config path: ~/my-tool/config.json
Config format: (json/yaml) json
MCP key: (e.g., mcpServers) mcp
Command format: (string+array/array/scalar+list) array
Env syntax: (env/environment) env
Enable key: (enabled/disabled/null) null
```

**Example**:
```bash
forte tool add vscode
# Prompts for configuration
# Adds to ~/.forte/tools/custom-tools.yaml
```

### 2. Import Tool from Config

```bash
forte tool import <tool-name> <config-path>
```

**Automatic analysis**:
```bash
forte tool import windsurf ~/.windsurf/settings.json
# Analyzes:
# - Config format (JSON/YAML)
# - MCP key location
# - Command format
# - Env syntax
# - Enable/disable flags

# Output:
# ✓ Detected: JSON format
# ✓ MCP key: mcp
# ✓ Command format: array
# ✓ Added to registry
```

### 3. Create Tool Manually

```bash
forte tool create <tool-name>
```

**Interactive builder**:
```
🔧 Tool Builder: my-custom-tool

Step 1: Basic Info
  Display name: My Custom Tool
  Type: (code_editor/agent_framework) code_editor

Step 2: Configuration
  Config path: ~/my-tool/config.json
  Config format: (json/yaml) json

Step 3: MCP Format
  Analyze config file...
  Detected MCP key: mcp
  Detected command format: array
  Confirm? (y/n) y

Step 4: Advanced
  Supports environment variables? (y/n) y
  Enable/disable key? (enabled/disabled/null) null

Step 5: Test
  Testing detection...
  ✓ Tool found
  ✓ MCPs detected: 2
  ✓ Tool added successfully
```

### 4. List Custom Tools

```bash
forte tool list
```

**Output**:
```
📋 Custom Tools

  1. VSCode
     Path: ~/vscode/settings.json
     Format: JSON
     MCP Key: mcpServers
     Status: detected

  2. Windsurf
     Path: ~/.windsurf/settings.json
     Format: JSON
     MCP Key: mcp
     Status: detected

  3. My Custom Tool
     Path: ~/my-tool/config.json
     Format: JSON
     MCP Key: mcp
     Status: not_found
```

### 5. Remove Tool

```bash
forte tool remove <tool-name>
```

### 6. Update Tool Config

```bash
forte tool update <tool-name>
```

**Interactive prompts**:
```
What to update?
  1. Path
  2. MCP key
  3. Command format
  4. Env syntax
  > 1

New path: ~/new/path/config.json
Testing detection...
✓ Updated successfully
```

### 7. Validate Tool

```bash
forte tool validate <tool-name>
```

**Output**:
```
🔍 Validating: VSCode

✓ Config file exists
✓ Format is valid JSON
✓ MCP key exists: mcpServers
✓ 2 MCPs detected
✓ All configs valid

Status: READY
```

---

## 📝 Tool Storage

### Custom Tools File

**Location**: `~/.forte/tools/custom-tools.yaml`

```yaml
# ~/.forte/tools/custom-tools.yaml
custom_tools:
  vscode:
    name: "VSCode"
    type: "code_editor"
    config_path: "~/vscode/settings.json"
    config_format: "json"
    mcp_key: "mcpServers"
    supports_env: true
    enable_key: null
    command_format: "string+array"
    env_syntax: "env"
    priority: 50
    added_at: "2026-06-09T13:00:00Z"
    last_detected: "2026-06-09T13:05:00Z"

  windsurf:
    name: "Windsurf"
    type: "code_editor"
    config_path: "~/.windsurf/settings.json"
    config_format: "json"
    mcp_key: "mcp"
    supports_env: true
    enable_key: null
    command_format: "array"
    env_syntax: "env"
    priority: 50
    added_at: "2026-06-09T13:00:00Z"
    last_detected: "2026-06-09T13:05:00Z"

metadata:
  version: "1.0"
  total_tools: 2
  last_updated: "2026-06-09T13:05:00Z"
```

### Merge with Built-in Tools

When listing/detecting, Forte merges:
```typescript
const allTools = {
  ...BUILTIN_TOOLS,     // From tools-registry.json
  ...CUSTOM_TOOLS       // From custom-tools.yaml
}
```

---

## 🔍 Automatic Config Analysis

### Import Algorithm

```typescript
// When importing tool
async function analyzeConfig(configPath: string) {
  // 1. Read file
  const content = fs.readFileSync(configPath, 'utf-8')
  
  // 2. Detect format
  const format = detectFormat(content)  // JSON or YAML
  
  // 3. Parse config
  const config = parseConfig(content, format)
  
  // 4. Find MCP key
  const mcpKey = findMcpKey(config)  // mcpServers, mcp, mcp_servers, etc.
  
  // 5. Analyze command format
  const commandFormat = analyzeCommandFormat(config[mcpKey])
  
  // 6. Detect env syntax
  const envSyntax = detectEnvSyntax(config[mcpKey])
  
  // 7. Check enable/disable flags
  const enableKey = detectEnableKey(config[mcpKey])
  
  return {
    format,
    mcpKey,
    commandFormat,
    envSyntax,
    enableKey
  }
}
```

### Command Format Detection

```typescript
function analyzeCommandFormat(mcpConfig: any): string {
  const sampleMcp = Object.values(mcpConfig)[0]
  
  if (sampleMcp.command && Array.isArray(sampleMcp.args)) {
    return 'string+array'
  }
  
  if (Array.isArray(sampleMcp)) {
    return 'array'
  }
  
  if (sampleMcp.command && sampleMcp.args && typeof sampleMcp.args === 'object') {
    return 'scalar+list'
  }
  
  return 'unknown'
}
```

---

## 🎨 Tool Templates

### Built-in vs Custom

**Built-in tools**: Pre-configured in tools-registry.json
**Custom tools**: User-defined in custom-tools.yaml

**Priority**: Custom tools override built-in if same name

### Template Application

```typescript
// When applying MCP to tool
function applyTemplate(toolName: string, mcpData: any) {
  // 1. Check if custom tool exists
  const customTool = getCustomTool(toolName)
  
  if (customTool) {
    // Use custom template
    return transformWithTemplate(mcpData, customTool)
  }
  
  // 2. Fall back to built-in
  const builtTool = getBuiltInTool(toolName)
  if (builtTool) {
    return transformWithTemplate(mcpData, builtTool)
  }
  
  // 3. Error if not found
  throw new Error(`Tool ${toolName} not found`)
}
```

---

## 📋 Tool Management Workflow

### Complete Workflow

```bash
# 1. Try detection
forte detect
# Output: ✗ MyTool - Config not found

# 2. Add custom tool
forte tool add mytool
# Follow prompts

# 3. Verify detection
forte detect
# Output: ✓ MyTool - Detected

# 4. List MCPs
forte list --tool mytool
# Output: Shows MCPs in MyTool

# 5. Initialize MCPs
forte init tool mytool
# Applies Forte MCPs to MyTool

# 6. Validate
forte validate mytool
# Checks compatibility
```

---

## 🧪 Testing

### Test Custom Tool

```bash
# Create mock config
cat > ~/test-tool/config.json << 'EOF'
{
  "mcp": {
    "test-mcp": ["npx", "-y", "@test/mcp"]
  }
}
EOF

# Import tool
forte tool import test-tool ~/test-tool/config.json

# Test detection
forte detect --tool test-tool

# Test MCP application
forte init tool test-tool
```

### Test Tool Priority

```bash
# Built-in tool exists
forte list --tool opencode

# Add custom tool with same name
forte tool add opencode --path ~/custom/opencode.json

# Custom should override
forte detect --tool opencode
# Uses custom path
```

---

## 🛠️ Advanced Features

### Tool Profiles

```bash
# Save tool configuration as profile
forte tool profile save mytool-profile

# Load profile
forte tool profile load mytool-profile
```

### Tool Sync

```bash
# Sync tool config to repository
forte tool sync mytool

# Pull tool config from repository
forte tool pull mytool
```

### Tool Migration

```bash
# Migrate from old format to new
forte tool migrate mytool --from-format v1 --to-format v2
```

---

## 📊 Tool Comparison

### Built-in vs Custom

| Feature | Built-in | Custom |
|---------|----------|---------|
| **Location** | tools-registry.json | custom-tools.yaml |
| **Priority** | Low | High (overrides) |
| **Updates** | Via Forte updates | User-controlled |
| **Sharing** | Yes (via repo) | Yes (via repo) |
| **Auto-detect** | Pre-configured paths | User-specified |

---

## 🎯 Use Cases

### Use Case 1: Custom Tool Location

```bash
# Tool installed in non-standard location
forte tool add vscode
# Path: ~/custom/vscode/settings.json

# Forte now detects from custom location
forte detect
# ✓ VSCode detected
```

### Use Case 2: New Tool

```bash
# New tool not supported by Forte
forte tool import new-ai-tool ~/.new-ai-tool/config.json
# Automatically analyzes and adds

# Use immediately
forte init tool new-ai-tool
```

### Use Case 3: Development Tool

```bash
# Custom development tool
forte tool create dev-tool
# Interactive builder

# Test with Forte MCPs
forte init mcp filesystem --tool dev-tool
```

---

## 🔒 Security

### Path Validation

```bash
# Validate path before adding
forte tool add mytool
# Path: ~/my-tool/config.json
# ✓ Path exists
# ✓ Readable
# ✓ Valid format
```

### Permission Checks

```typescript
function validateToolPath(path: string): boolean {
  // Check existence
  if (!fs.existsSync(path)) return false
  
  // Check read permission
  try {
    fs.accessSync(path, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}
```

---

## 📚 Documentation

### Tool Files

- `~/.forte/tools/custom-tools.yaml` - Custom tool definitions
- `~/.forte/tools/built-in-tools.yaml` - Built-in tools (backup)

### Related Commands

```bash
forte tool add <name>           # Add custom tool
forte tool import <name> <path> # Import from config
forte tool create <name>       # Interactive builder
forte tool list               # List all tools
forte tool remove <name>       # Remove tool
forte tool validate <name>     # Validate tool
```

---

## 🎉 Summary

**Forte supports complete custom tool management!**

**Features**:
- ✅ Add custom tools when detection fails
- ✅ Import tools from config files
- ✅ Automatic config analysis
- ✅ Interactive tool builder
- ✅ Tool validation and testing
- ✅ Tool priority (custom > built-in)
- ✅ Tool profiles and sync

**Commands**:
- `forte tool add` - Add custom tool
- `forte tool import` - Import from config
- `forte tool create` - Interactive builder
- `forte tool list` - List all tools
- `forte tool validate` - Validate tool

**Forte adapts to any tool!** 🚀
