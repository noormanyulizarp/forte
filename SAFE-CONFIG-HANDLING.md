# Forte Config Handling Strategy

## Overview

Forte menggunakan **Safe Config Handling** untuk memastikan config file tools tidak rusak saat MCP ditambahkan. Ini sangat penting karena config files sering berisi setting selain MCP.

---

## ⚠️ Problem: Config Files Bukan Hanya MCP

### Example: Claude Code Config

```json
{
  "ignoredFile": "config.d.ts",
  "maxTokens": 200000,
  "maxFileSize": 3072,
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed"],
      "env": {}
    }
  },
  "chat": {
    "enabled": true,
    "historyEnabled": true
  }
}
```

**Kalau Forte naif replace**:
- ❌ Hilang `ignoredFile`, `maxTokens`, `maxFileSize`
- ❌ Hilang `chat.enabled`, `chat.historyEnabled`
- ❌ User setting hilang
- ❌ Tool behavior berubah

---

## 🔒 Safe Config Handling

### Strategy 1: MCP-Only Modification ✅ (DEFAULT)

**Prinsip**: Hanya modifikasi bagian MCP, preserve semua non-MCP settings.

```typescript
// 1. READ full config
const fullConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// 2. BACKUP original
backupConfig(toolId, configPath);

// 3. MODIFY hanya MCP section
if (fullConfig.mcpServers) {
  // Add/update MCP di sini
  fullConfig.mcpServers[newMCP] = transformedMCP;
} else {
  fullConfig.mcpServers = {};
  fullConfig.mcpServers[newMCP] = newMCP;
}

// 4. WRITE back (dengan MCP section updated)
fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));
```

**Kelebihan**:
- ✅ Preserve semua non-MCP settings
- ✅ User config tidak hilang
- ✅ Aman untuk semua tools

### Strategy 2: Merge with Conflict Detection ⚠️

**Prinsip**: Detect conflicts dan tanya user.

```typescript
// 1. Detect conflicts
const conflicts = detectConflicts(existingMCPs, newMCPs);

if (conflicts.length > 0) {
  console.warn('⚠️  Conflicts detected:');
  conflicts.forEach(c => console.log(`  - ${c}`));
  
  const choice = await promptUser(
    'How to resolve?',
    ['Keep existing', 'Use new', 'Cancel']
  );
  
  // Handle user choice
  if (choice === 'Keep existing') {
    // Skip conflicting MCPs
    const safeNewMCPs = { ...newMCPs };
    conflicts.forEach(c => delete safeNewMCPs[c]);
    
    existingMCPs = {
      ...existingMCPs,
      ...safeNewMCPs
    };
  } else if (choice === 'Use new') {
    // Remove conflicts, use new
    for (const mcp of Object.keys(existingMCPs)) {
      if (conflicts.includes(mcp)) {
        delete existingMCPs[mcp];
      }
    }
    
    existingMCPs = {
      ...existingMCPs,
      ...newMCPs
    };
  }
}
```

**Kelebihan**:
- ✅ User punya control
- ✅ Transparency
- ⚠️ Butuh user input

### Strategy 3: Append-Only 🟢 (FALLBACK)

**Prinsip**: Untuk tools tidak dikenal, append MCP section di akhir.

```typescript
// 1. Cek apakah MCP section ada
if (!config[mcpKey]) {
  // APPEND MCP section di akhir file
  config[mcpKey] = newMCPs;
} else {
  // MCP section ada, gunakan merge
  return strategy2(config, newMCPs);
}
```

**Kelebihan**:
- ✅ Aman untuk tools baru
- ✅ Tidak modify bagian lain
- ⚠️ Risk duplikasi MCP jika section already exists

---

## 🛡️ Implementation

### Config Handler Library

**Location**: `src/lib/config-handler.ts`

**Functions**:
- `analyzeConfig()` - Analisis config structure
- `safeWriteConfig()` - Safe write dengan strategy
- `detectConflicts()` - Detect MCP name conflicts
- `promptUser()` - Interactive prompts

### Safe Init Library

**Location**: `src/lib/init-safe.ts`

**Functions**:
- `initTool()` - Init dengan safe config handling
- `transformMCPForTool()` - Transform MCP ke tool format

---

## 📋 Comparison: 3 Strategies

| Strategy | Safety | Complexity | User Control | Use Case |
|----------|--------|------------|---------------|----------|
| **MCP-Only** | ⭐⭐⭐⭐⭐ | Low | None (automatic) | **DEFAULT** for known tools |
| **Merge** | ⭐⭐⭐⭐ | Medium | Interactive | Tools with complex configs |
| **Append** | ⭐⭐⭐ | Low | None | Unknown/new tools |

---

## 🎯 Default Behavior

### Untuk Known Tools (Built-in Registry)

**Default Strategy**: MCP-Only modification

**Rationale**:
- Forte tau persis format tiap tool
- Bisa safely modify MCP section
- Preserve user settings

**Tools**: Claude Code, Cline, OpenCode, KiloCode, OpenClaw, Hermes, PicoClaw

### Untuk Custom Tools

**Default Strategy**: Append

**Rationale**:
- Tool mungkin punya config kompleks
- Kita tidak tau structure-nya
- Append lebih safe daripada merusak

**Fallback**: User bisa switch ke merge strategy via:
```bash
forte config set strategy merge
```

---

## 🔧 Usage Examples

### Example 1: Claude Code (Safe MCP-Only)

```bash
# Before
{
  "maxTokens": 200000,
  "chat": { "enabled": true },
  "mcpServers": {
    "filesystem": { ... }
  }
}

# After forte init mcp brave-search
{
  "maxTokens": 200000,           # ✓ PRESERVED
  "chat": { "enabled": true },    # ✓ PRESERVED
  "mcpServers": {
    "filesystem": { ... },
    "brave-search": { ... }   # ✓ ADDED
  }
}
```

### Example 2: Custom Tool (Append)

```bash
# Before (no MCP section)
{
  "theme": "dark",
  "fontSize": 14
}

# After forte init mcp filesystem
{
  "theme": "dark",               # ✓ PRESERVED
  "fontSize": 14,               # ✓ PRESERVED
  "mcp": {                      # ✓ ADDED
    "filesystem": [ "npx", "-y", "@modelcontextprotocol/server-filesystem", "/" ]
  }
}
```

### Example 3: Conflict Detection

```bash
forte init mcp filesystem

# Output:
⚠️  Conflicts detected: filesystem
How to resolve?
  1. Keep existing (use existing config)
  2. Use new (replace with Forte's version)
   3. Cancel

# User selects "Keep existing"
# Result: filesystem MCP SKIPPED, existing MCP preserved
```

---

## 📊 Decision Tree

```
Forte init mcp <mcp-name> <tool-name>
    ↓
Is tool in built-in registry?
    ↓
YES → Use MCP-Only strategy (safe, automatic)
    ↓
NO → Check if custom tool exists?
    ↓
YES → Use Append strategy (safe)
    ↓
NO → Analyze config structure
    ↓
Is MCP section found?
    ↓
YES → Use Merge strategy (with conflict detection)
    ↓
NO → Use Append strategy (create MCP section)
```

---

## 🔒 Safety Checks

### Pre-Write Validation

```typescript
// 1. Backup existing config
await backupConfig(toolId, configPath);

// 2. Validate MCP data
const validation = validateMCPData(newMCPs);
if (!validation.valid) {
  console.error('Invalid MCP data:', validation.errors);
  return;
}

// 3. Check file write permissions
try {
  fs.accessSync(configPath, fs.constants.W_OK);
} catch {
  console.error('No write permission for:', configPath);
  return;
}

// 4. Write to temp file first
const tempPath = `${configPath}.tmp`;
fs.writeFileSync(tempPath, content);

// 5. Replace original
fs.renameSync(tempPath, configPath);
```

### Rollback on Error

```typescript
try {
  await safeWriteConfig(toolId, configPath, newMCPs, 'safe');
} catch (error) {
  // Restore from backup
  restoreFromBackup(toolId, configPath);
  
  console.error('Error occurred, config restored from backup');
  throw error;
}
```

---

## 🎯 Command Line Options

### Select Strategy Explicitly

```bash
# Default: MCP-Only (automatic)
forte init mcp filesystem

# Force merge with conflict detection
forte init mcp filesystem --strategy merge

# Force append
forte init mcp filesystem --strategy append

# Show what will change
forte init mcp filesystem --dry-run
```

### Configure Default Strategy

```bash
# Set default strategy
forte config set strategy merge

# Set strategy per tool
forte config set opencode.strategy append

# Show current strategy
forte config show strategy
```

---

## 📚 Related Documentation

- **SAFE-CONFIG-HANDLING.md** - (this file)
- **MCP-FORMATS-KNOWLEDGE-BASE.md** - Format per tool
- **TESTING.md** - Testing config handling
- **README.md** - User guide

---

## 🎉 Summary

**Forte menggunakan 3-layer strategy**:

1. **MCP-Only** (Default) - Hanya modify MCP section
2. **Merge with Conflict Detection** - Interactive conflict resolution
3. **Append** (Fallback) - Add MCP section untuk unknown tools

**Key Principle**: **Preserve user configuration selalu!**

**Safety First**:
- ✅ Auto-backup sebelum modify
- ✅ Validate sebelum write
- ⚠️ Conflict detection untuk merge
- 🔒 Rollback on error

**Forte aman digunakan bahkan untuk production!** 🔒
