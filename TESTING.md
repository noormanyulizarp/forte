# Forte Testing Guide

## Testing Strategy

### 1. Default Path Detection

Forte punya **default paths** untuk setiap tool:

```typescript
const DEFAULT_PATHS = {
  'claude-code': {
    darwin: '~/Library/Application Support/Claude/claude_desktop_config.json',
    linux: '~/.config/claude-code/claude_desktop_config.json',
    win32: '%APPDATA%\\Claude\\claude_desktop_config.json'
  },
  'cline': {
    darwin: '~/.clinerules',
    linux: '~/.clinerules',
    win32: '%USERPROFILE%\\.clinerules'
  },
  'opencode': {
    darwin: '~/Library/Application Support/OpenCode/settings.json',
    linux: '~/.opencode/settings.json',
    win32: '%APPDATA%\\OpenCode\\settings.json'
  },
  'kilocode': {
    darwin: '~/.kilocode/mcp.json',
    linux: '~/.kilocode/mcp.json',
    win32: '%USERPROFILE%\\.kilocode\\mcp.json'
  },
  'gemini-code': {
    darwin: '~/Library/Application Support/Gemini Code/config.json',
    linux: '~/.config/gemini-code/config.json',
    win32: '%APPDATA%\\Gemini Code\\config.json'
  },
  'cursor': {
    darwin: '~/Library/Application Support/Cursor/settings.json',
    linux: '~/.cursor/settings.json',
    win32: '%APPDATA%\\Cursor\\settings.json'
  },
  'windsurf': {
    darwin: '~/Library/Application Support/Windsurf/settings.json',
    linux: '~/.windsurf/settings.json',
    win32: '%APPDATA%\\Windsurf\\settings.json'
  },
  'openclaw': {
    darwin: '~/.openclaw/config.yaml',
    linux: '~/.openclaw/config.yaml',
    win32: '%USERPROFILE%\\.openclaw\\config.yaml'
  },
  'hermes': {
    darwin: '~/.hermes/config.yaml',
    linux: '~/.hermes/config.yaml',
    win32: '%USERPROFILE%\\.hermes\\config.yaml'
  }
}
```

### 2. Custom Path Override

User bisa override default paths via:

#### Option A: Config File (`~/.forte/paths.yaml`)

```yaml
# ~/.forte/paths.yaml
custom_paths:
  opencode: ~/my-custom-path/opencode/settings.json
  kilocode: /opt/kilocode/config/mcp.json
  gemini-code: ~/.config/gemini-custom.json
```

#### Option B: Environment Variables

```bash
export FORTE_OPENCODE_PATH="~/my-custom-path/opencode/settings.json"
export FORTE_KILOCODE_PATH="/opt/kilocode/config/mcp.json"
```

#### Option C: Command Line Flags

```bash
forte detect --opencode-path ~/custom/path/settings.json
forte list --kilocode-path /opt/kilocode/mcp.json
```

### 3. Detection Priority

1. **Custom path** (command flag) - Highest priority
2. **Environment variable** - Medium priority
3. **Config file** - Low priority
4. **Default path** - Fallback

---

## Testing Scenarios

### Scenario 1: Fresh Installation

```bash
# Test: No tools installed
forte detect
# Expected: All tools show "not_found"

# Test: Add custom path for KiloCode
forte config set kilocode-path ~/dev/kilocode/config.json

# Test: Detect again
forte detect
# Expected: KiloCode shows "detected"
```

### Scenario 2: Multi-Path Detection

```bash
# Setup: Multiple tools with custom paths
forte config set opencode-path ~/.opencode-dev/settings.json
forte config set kilocode-path ~/kilocode-test/mcp.json

# Test: Detect all
forte detect --verbose

# Expected Output:
# ✓ OpenCode (custom path)
#   Path: ~/.opencode-dev/settings.json
# ✓ KiloCode (custom path)
#   Path: ~/kilocode-test/mcp.json
```

### Scenario 3: Path Override Priority

```bash
# Setup: Default + ENV + Custom
export FORTE_OPENCODE_PATH="~/env-opencode.json"
forte config set opencode-path ~/.config-opencode.json

# Test: Command flag overrides all
forte detect --opencode-path ~/flag-opencode.json

# Expected: Uses ~/flag-opencode.json
```

### Scenario 4: Invalid Path Handling

```bash
# Test: Invalid path
forte detect --opencode-path /nonexistent/path.json

# Expected:
# ✗ OpenCode
#   Error: Path does not exist
#   Suggestion: Check if path is correct
```

### Scenario 5: Cross-Platform Testing

```bash
# macOS
forte detect
# Uses ~/Library/Application Support/

# Linux
forte detect
# Uses ~/.config/

# Windows
forte detect
# Uses %APPDATA%\\
```

---

## Test Commands

### Basic Detection Test

```bash
# Test 1: Default detection
forte detect

# Test 2: Verbose detection
forte detect --verbose

# Test 3: Specific tool
forte detect --tool opencode

# Test 4: Custom path
forte detect --opencode-path ~/custom/path.json
```

### Path Configuration Test

```bash
# Test 1: Set custom path
forte config set kilocode-path ~/custom/kilocode.json

# Test 2: List custom paths
forte config list

# Test 3: Remove custom path
forte config remove kilocode-path

# Test 4: Reset to default
forte config reset kilocode-path
```

### Integration Test

```bash
# Test 1: Full workflow
forte detect
forte add filesystem
forte init all
forte validate all

# Test 2: With custom paths
forte config set opencode-path ~/dev/opencode.json
forte detect
forte init tool opencode
forte validate opencode
```

---

## Mock Test Data

### Create Mock Config Files

```bash
# Create test directory
mkdir -p ~/.forte-test/tools

# Mock Claude Code config
cat > ~/.forte-test/tools/claude-desktop-config.json << 'EOF'
{
  "mcpServers": {
    "test-mcp": {
      "command": "npx",
      "args": ["-y", "@test/mcp"]
    }
  }
}
EOF

# Mock OpenCode config
cat > ~/.forte-test/tools/opencode.json << 'EOF'
{
  "mcp": {
    "test-mcp": ["npx", "-y", "@test/mcp"]
  }
}
EOF

# Mock KiloCode config
cat > ~/.forte-test/tools/kilocode.json << 'EOF'
{
  "mcp_servers": {
    "test-mcp": {
      "command": "npx",
      "args": ["-y", "@test/mcp"],
      "environment": {}
    }
  }
}
EOF
```

### Test with Mock Data

```bash
# Test with mock configs
forte detect --claude-code-path ~/.forte-test/tools/claude-desktop-config.json
forte detect --opencode-path ~/.forte-test/tools/opencode.json
forte detect --kilocode-path ~/.forte-test/tools/kilocode.json

# Expected: All tools detected
```

---

## Automated Tests

### Test Suite

```bash
# Run all tests
npm test

# Run specific test
npm test -- --grep "Detection"

# Run with coverage
npm test -- --coverage
```

### Test Cases

```typescript
// detection.test.ts
describe('Tool Detection', () => {
  test('should detect Claude Code with default path', async () => {
    const result = await detectTool('claude-code')
    expect(result.found).toBe(true)
  })

  test('should detect OpenCode with custom path', async () => {
    const result = await detectTool('opencode', '~/custom/path.json')
    expect(result.found).toBe(true)
  })

  test('should handle invalid path gracefully', async () => {
    const result = await detectTool('opencode', '/invalid/path.json')
    expect(result.found).toBe(false)
    expect(result.error).toContain('does not exist')
  })

  test('should respect path priority', async () => {
    // Custom > ENV > Config > Default
    const result = await detectTool('opencode')
    expect(result.path).toBe(customPath)
  })
})
```

---

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Forte

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Test detection
        run: npm run test:detection
      
      - name: Test path override
        run: npm run test:paths
```

---

## Debug Mode

### Enable Debug Logging

```bash
# Enable debug mode
export FORTE_DEBUG=1

# Run detection
forte detect --verbose

# Output includes:
# - Scanned paths
# - Detection results
# - Path resolution
# - Priority chain
```

### Debug Output Example

```
[DEBUG] Scanning for Claude Code...
[DEBUG] Trying default path: ~/.config/claude-code/claude_desktop_config.json
[DEBUG] Path not found, trying ENV: FORTE_CLAUDE_CODE_PATH
[DEBUG] ENV not set, trying config file
[DEBUG] Config path found: ~/custom/claude.json
[DEBUG] File exists: true
[DEBUG] Parsing JSON...
[DEBUG] MCP key: mcpServers
[DEBUG] MCPs found: 2
[DEBUG] ✓ Claude Code detected
```

---

## Performance Testing

### Benchmark Detection Speed

```bash
# Test detection performance
time forte detect

# Expected: < 1 second for 7 tools
```

### Test with Large Configs

```bash
# Create large config
cat > ~/large-config.json << 'EOF'
{
  "mcpServers": {
$(for i in {1..100}; do echo "    \"mcp-$i\": {\"command\": \"test\"},"; done)
  }
}
EOF

# Test detection performance
time forte detect --claude-code-path ~/large-config.json

# Expected: < 2 seconds
```

---

## Edge Cases

### Case 1: Permission Denied

```bash
# Test: No read permission
chmod 000 ~/.opencode/settings.json
forte detect
# Expected: Error message suggesting permission check
```

### Case 2: Corrupted Config

```bash
# Test: Invalid JSON/YAML
echo "{" > ~/.opencode/settings.json
forte detect
# Expected: Parse error with line number
```

### Case 3: Circular Symlinks

```bash
# Test: Symlink loop
ln -s /tmp/link /tmp/link
forte detect --opencode-path /tmp/link
# Expected: Error about circular symlink
```

### Case 4: Unicode Paths

```bash
# Test: Unicode characters
forte detect --opencode-path "~/路径/配置.json"
# Expected: Handle Unicode correctly
```

---

## Testing Checklist

### Pre-Release Testing

- [ ] Default paths work on all platforms
- [ ] Custom path override works
- [ ] ENV variable override works
- [ ] Config file override works
- [ ] Priority chain is correct
- [ ] Invalid paths handled gracefully
- [ ] Parse errors show useful messages
- [ ] Permission errors handled
- [ ] Unicode paths supported
- [ ] Performance acceptable (< 1s per tool)

### Regression Testing

- [ ] All previous test cases pass
- [ ] No breaking changes
- [ ] Backward compatibility maintained
- [ ] Documentation updated

---

## Troubleshooting Tests

### Test Not Working?

1. **Enable debug mode**:
   ```bash
   export FORTE_DEBUG=1
   forte detect --verbose
   ```

2. **Check path resolution**:
   ```bash
   forte config list
   forte config show <tool>-path
   ```

3. **Verify file exists**:
   ```bash
   ls -la ~/.opencode/settings.json
   ```

4. **Test parse manually**:
   ```bash
   cat ~/.opencode/settings.json | jq .
   ```

---

## Next Steps

1. Implement dynamic path detection
2. Add path configuration commands
3. Create automated test suite
4. Add CI/CD integration
5. Document edge cases
