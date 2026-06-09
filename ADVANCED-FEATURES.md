# Forte Advanced Features Implementation

## Overview

Tiga fitur canggih untuk Forte:
1. **Dependency Check** - Cek npm packages untuk MCPs
2. **AI Provider System** - Smart diagnosis untuk MCP issues
3. **MCP Disable Control** - Global dan per-tool disable

---

## 📦 Feature 1: Dependency Check

### Problem

MCP butuh npm packages yang mungkin belum terinstall:
```bash
npx @modelcontextprotocol/server-filesystem
npx @modelcontextprotocol/server-brave-search
npx @modelcontextprotocol/server-postgres
```

Kalau package belum ada, MCP akan gagal saat init.

### Solution: Dependency Check Command

```bash
# Cek semua MCP dependencies
forte deps check

# Cek specific MCP
forte deps check filesystem

# Install missing dependencies
forte deps install

# Install specific dependency
forte deps install @modelcontextprotocol/server-filesystem
```

### Output

```bash
forte deps check

📦 MCP Dependencies

Filesystem MCP:
  ✗ @modelcontextprotocol/server-filesystem NOT installed
  Install: npm install -g @modelcontextprotocol/server-filesystem

Brave Search MCP:
  ✗ @modelcontextprotocol/server-brave-search NOT installed
  Requires: BRAVE_API_KEY environment variable
  Install: npm install -g @modelcontextprotocol/server-brave-search

Postgres MCP:
  ✓ @modelcontextprotocol/server-postgres installed
  Version: 1.0.0

GitHub MCP:
  ✓ @modelcontextprotocol/server-github installed
  Version: 1.2.0

Missing: 2 packages
Run 'forte deps install' to install all missing packages
```

---

## 🤖 Feature 2: AI Provider System

### Problem

MCP rusak atau tidak jalan, user bingung kenapa. Butuh **smart diagnosis** dengan AI.

### Solution: AI Provider Check

```bash
# Cek semua MCPs dengan AI analysis
forte ai check

# Diagnose specific MCP
forte ai diagnose brave-search

# Analyze MCP failure
forte ai analyze --mcp brave-search --tool opencode
```

### AI Providers Supported

```yaml
# ~/.forte/ai-providers.yaml
providers:
  gemini:
    name: "Gemini"
    api_key: "GEMINI_API_KEY"
    base_url: "https://generativelanguage.googleapis.com/v1beta"
    model: "gemini-1.5-flash"
    enabled: true
  
  glm:
    name: "GLM (Zai)"
    api_key: "ZAI_API_KEY"
    base_url: "https://api.z.ai/v1"
    model: "glm-4-flash"
    enabled: true
  
  openrouter:
    name: "OpenRouter"
    api_key: "OPENROUTER_API_KEY"
    base_url: "https://openrouter.ai/api/v1"
    model: "anthropic/claude-3.5-sonnet"
    enabled: true
  
  localai:
    name: "Local AI"
    base_url: "http://localhost:11434/v1"
    model: "llama3"
    enabled: false
```

### How It Works

```bash
forte ai diagnose brave-search

# Output:
🤖 AI Diagnosis: brave-search

Analyzing MCP configuration...
  ✓ Command format: npx -y @modelcontextprotocol/server-brave-search
  ✓ Args: valid
  ✓ Env vars: BRAVE_API_KEY present

Checking npm package...
  ✗ @modelcontextprotocol/server-brave-search NOT installed
  → THIS IS THE PROBLEM

AI Recommendations:
  1. Install missing package:
     npm install -g @modelcontextprotocol/server-brave-search
  
  2. Verify API key:
     forte env check brave-search
  
  3. Test MCP manually:
     npx -y @modelcontextprotocol/server-brave-search
  
Root Cause: Missing npm package
Confidence: 95%
```

### Smart Analysis

```typescript
// AI analysis algorithm
async function diagnoseMCP(mcpName: string, toolName?: string) {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // 1. Check npm package
  const pkgCheck = await checkNpmPackage(mcpName);
  if (!pkgCheck.installed) {
    issues.push(`npm package not installed: ${pkgCheck.package}`);
    recommendations.push(`Install: npm install -g ${pkgCheck.package}`);
  }
  
  // 2. Check env vars
  const envCheck = checkEnvVars(mcpName);
  if (envCheck.missing.length > 0) {
    issues.push(`Missing env vars: ${envCheck.missing.join(', ')}`);
    recommendations.push(`Add env vars: forte env add ${envCheck.missing[0]}`);
  }
  
  // 3. Check config format
  const formatCheck = validateConfigFormat(mcpName, toolName);
  if (!formatCheck.valid) {
    issues.push(`Invalid config format: ${formatCheck.errors.join(', ')}`);
    recommendations.push(`Fix config: forte tool validate ${toolName}`);
  }
  
  // 4. Use AI to analyze if issues found
  if (issues.length > 0) {
    const aiAnalysis = await callAIProvider({
      prompt: `Analyze these MCP issues and provide solutions: ${issues.join(', ')}`,
      provider: getBestProvider()
    });
    
    return {
      issues,
      recommendations,
      aiAnalysis,
      rootCause: determineRootCause(issues),
      confidence: calculateConfidence(issues)
    };
  }
  
  return {
    issues: [],
    recommendations: ['MCP is healthy!'],
    aiAnalysis: 'No issues found',
    rootCause: 'None',
    confidence: 100
  };
}
```

---

## 🔧 Feature 3: MCP Disable Control

### Problem

User mau disable MCP tertentu:
- Global: Disable MCP di semua tools
- Per-tool: Disable di OpenCode tapi enable di KiloCode

### Solution: Disable System

```bash
# Disable MCP globally
forte disable brave-search

# Enable MCP globally
forte enable brave-search

# Disable MCP for specific tool
forte disable brave-search --tool opencode

# Enable MCP for specific tool
forte enable brave-search --tool kilocode

# List disabled MCPs
forte disable list

# Show disable status
forte disable status brave-search
```

### Storage Format

```yaml
# ~/.forte/disabled-mcps.yaml
global_disabled:
  - brave-search
  - postgres

tool_specific:
  opencode:
    - github
    - filesystem
  kilocode:
    - brave-search

metadata:
  version: "1.0"
  last_updated: "2026-06-09T13:00:00Z"
```

### Disable Logic

```typescript
// During init
function shouldEnableMCP(mcpName: string, toolName: string): boolean {
  // 1. Check global disabled
  if (globalDisabled.includes(mcpName)) {
    return false;
  }
  
  // 2. Check tool-specific disabled
  if (toolDisabled[toolName]?.includes(mcpName)) {
    return false;
  }
  
  // 3. Check if MCP is explicitly enabled for this tool
  if (toolEnabled[toolName]?.includes(mcpName)) {
    return true;
  }
  
  // 4. Default to enabled
  return true;
}
```

### Status Check

```bash
forte disable status brave-search

# Output:
🔍 Disable Status: brave-search

Global: ENABLED
Per-tool:
  opencode: DISABLED
  kilocode: ENABLED
  hermes: ENABLED

Active in: 2/3 tools
```

---

## 🎯 Implementation Plan

### Phase 1: Dependency Check

**Commands**:
```bash
forte deps check              # Check all dependencies
forte deps check <mcp>        # Check specific MCP
forte deps install           # Install all missing
forte deps install <package>  # Install specific package
```

**Library** (`src/lib/deps-check.ts`):
- `checkNpmPackage(pkg)` - Check if installed
- `getMcpRegistry()` - Get all MCPs with packages
- `installPackage(pkg)` - Install package
- `checkAllDeps()` - Check all MCP dependencies

### Phase 2: AI Provider System

**Commands**:
```bash
forte ai check                   # Quick health check
forte ai diagnose <mcp>         # Diagnose MCP issues
forte ai analyze <mcp> <tool>   # Deep analysis
forte ai provider set <name>    # Set AI provider
forte ai provider list          # List available providers
```

**Library** (`src/lib/ai-provider.ts`):
- `callAIProvider(prompt, provider)` - Call AI API
- `diagnoseMCP(mcp, tool)` - Analyze MCP issues
- `getBestProvider()` - Select best available provider
- `analyzeWithAI(issues)` - Get AI recommendations

### Phase 3: Disable System

**Commands**:
```bash
forte disable <mcp> [--tool <name>]    # Disable MCP
forte enable <mcp> [--tool <name>]     # Enable MCP
forte disable list                    # List disabled MCPs
forte disable status <mcp>            # Show status
```

**Library** (`src/lib/disable-control.ts`):
- `disableMCP(mcp, tool)` - Disable MCP
- `enableMCP(mcp, tool)` - Enable MCP
- `isDisabled(mcp, tool)` - Check status
- `getDisabledList()` - Get all disabled
- `shouldEnableMCP(mcp, tool)` - Init logic

---

## 📖 Complete Usage Examples

### Example 1: Dependency Check

```bash
# 1. Add MCP
forte add brave-search

# 2. Check dependencies
forte deps check brave-search

# 3. Install missing
forte deps install @modelcontextprotocol/server-brave-search

# 4. Verify
forte deps check brave-search
# ✓ All dependencies satisfied
```

### Example 2: AI Diagnosis

```bash
# MCP not working
forte init mcp brave-search
# ✗ Failed to apply to opencode

# Ask AI for help
forte ai diagnose brave-search --tool opencode

# AI Analysis:
# Root Cause: Missing npm package
# Recommendation: Install package
# Confidence: 95%

# Fix issue
forte deps install

# Retry
forte init mcp brave-search
# ✓ Success
```

### Example 3: Granular Disable

```bash
# Disable brave-search globally
forte disable brave-search

# Enable only for kilocode
forte enable brave-search --tool kilocode

# Check status
forte disable status brave-search
# Global: DISABLED
# Per-tool:
#   opencode: DISABLED
#   kilocode: ENABLED

# Init - will only apply to kilocode
forte init mcp brave-search
# ✓ Applied to kilocode only
# ✗ Skipped: opencode (disabled)
# ✗ Skipped: hermes (disabled)
```

---

## 🔧 Technical Details

### Dependency Check

```typescript
// Check npm package
async function checkNpmPackage(packageName: string): Promise<{
  installed: boolean;
  version?: string;
  location?: string;
}> {
  try {
    const result = await execAsync(`npm list -g ${packageName}`);
    
    if (result.stdout.includes(packageName)) {
      // Parse version
      const match = result.stdout.match(new RegExp(`${packageName}@(\\S+)`));
      return {
        installed: true,
        version: match ? match[1] : 'unknown',
        location: 'global'
      };
    }
    
    return { installed: false };
  } catch (error) {
    return { installed: false };
  }
}
```

### AI Provider Call

```typescript
// Call AI provider
async function callAIProvider(prompt: string, provider: string): Promise<string> {
  const config = loadAIProviders();
  const providerConfig = config.providers[provider];
  
  if (!providerConfig || !providerConfig.enabled) {
    throw new Error(`Provider ${provider} not available`);
  }
  
  // Call API
  const response = await fetch(providerConfig.base_url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${providerConfig.api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: providerConfig.model,
      prompt: prompt,
      max_tokens: 500
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Disable Logic

```typescript
// Init with disable logic
async function initMCPToTool(mcpName: string, toolName: string) {
  // Check if should enable
  if (!shouldEnableMCP(mcpName, toolName)) {
    console.log(`  ⊘ Skipped: ${mcpName} (disabled)`);
    return;
  }
  
  // Apply MCP
  const result = await applyMCP(mcpName, toolName);
  console.log(`  ✓ Applied: ${mcpName}`);
}
```

---

## 📊 Feature Matrix

| Feature | Status | Priority |
|---------|--------|----------|
| **Dependency Check** | ⏳ Pending | High |
| **AI Diagnosis** | ⏳ Pending | High |
| **Global Disable** | ⏳ Pending | Medium |
| **Per-Tool Disable** | ⏳ Pending | Medium |
| **Disable Status** | ⏳ Pending | Medium |
| **AI Provider Mgmt** | ⏳ Pending | Low |

---

## 🎯 Next Steps

### Implementation Priority

1. **Phase 1**: Dependency Check (High)
   - Implement deps check command
   - Add npm package detection
   - Create install command

2. **Phase 2**: AI Provider System (High)
   - Implement AI diagnose command
   - Add provider selection
   - Create smart analysis

3. **Phase 3**: Disable Control (Medium)
   - Implement disable/enable commands
   - Add status checking
   - Update init logic

### Testing Strategy

```bash
# Test dependency check
forte deps check
forte deps install

# Test AI diagnosis
forte ai diagnose brave-search

# Test disable control
forte disable brave-search
forte disable status brave-search
forte init mcp brave-search
```

---

## 🎉 Summary

**Tiga fitur canggih ini akan membuat Forte lebih powerful!**

1. **Dependency Check** - Otomatis cek npm packages
2. **AI Provider** - Smart diagnosis untuk MCP issues
3. **Disable Control** - Granular MCP management

**Forte akan menjadi MCP manager yang lebih intelligent!** 🚀
