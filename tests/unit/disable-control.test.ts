const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-disable-test-'));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
  process.exit = jest.fn() as any;
  const forteDir = path.join(tmpDir, '.forte');
  fs.mkdirSync(forteDir, { recursive: true });
  fs.chmodSync(forteDir, 0o700);
  const configPath = path.join(forteDir, 'disabled-mcps.yaml');
  try { fs.unlinkSync(configPath); } catch {}
});

afterAll(() => {
  jest.restoreAllMocks();
  try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
});

describe('disable-control', () => {
  it('starts with empty state', () => {
    const { loadDisableConfig } = require('../../src/lib/disable-control');
    expect(loadDisableConfig()).toEqual({ global_disabled: [], tool_specific: {} });
  });

  it('disables MCP globally', () => {
    const { disableMCP, isDisabled, loadDisableConfig } = require('../../src/lib/disable-control');
    disableMCP('brave-search');
    expect(isDisabled('brave-search')).toBe(true);
    expect(isDisabled('brave-search', 'openclaw')).toBe(true);
    expect(loadDisableConfig().global_disabled).toContain('brave-search');
  });

  it('disables idempotent', () => {
    const { disableMCP, loadDisableConfig } = require('../../src/lib/disable-control');
    disableMCP('filesystem');
    disableMCP('filesystem');
    const config = loadDisableConfig();
    expect(config.global_disabled.filter((x: string) => x === 'filesystem').length).toBe(1);
  });

  it('enables MCP globally after disable', () => {
    const { disableMCP, enableMCP, isDisabled } = require('../../src/lib/disable-control');
    disableMCP('memory');
    enableMCP('memory');
    expect(isDisabled('memory')).toBe(false);
    expect(isDisabled('memory', 'any-tool')).toBe(false);
  });

  it('disables for specific tool', () => {
    const { disableMCPForTool, loadDisableConfig, isDisabled } = require('../../src/lib/disable-control');
    disableMCPForTool('openai', 'claude-code');
    expect(isDisabled('openai', 'claude-code')).toBe(true);
    expect(isDisabled('openai', 'openclaw')).toBe(false);
    expect(loadDisableConfig().tool_specific['claude-code']).toContain('openai');
  });

  it('enables for specific tool removes empty entry', () => {
    const { disableMCPForTool, enableMCPForTool, loadDisableConfig } = require('../../src/lib/disable-control');
    disableMCPForTool('openai', 'claude-code');
    enableMCPForTool('openai', 'claude-code');
    expect(loadDisableConfig().tool_specific['claude-code']).toBeUndefined();
  });

  it('tool-specific enable removes tool override but global still applies to others', () => {
    const { disableMCP, enableMCPForTool, isDisabled } = require('../../src/lib/disable-control');
    disableMCP('foo');
    enableMCPForTool('foo', 'openclaw');
    expect(isDisabled('foo', 'openclaw')).toBe(true);
    expect(isDisabled('foo', 'claude-code')).toBe(true);
  });

  it('getDisableStatus reports global and per-tool', () => {
    const { disableMCP, disableMCPForTool, getDisableStatus } = require('../../src/lib/disable-control');
    disableMCP('bar');
    disableMCPForTool('bar', 'openclaw');
    const status = getDisableStatus('bar');
    expect(status.global).toBe(true);
    expect(status.tools['openclaw']).toBe(true);
    expect(status.tools['claude-code']).toBe(false);
  });

  it('getAllDisabled returns structure', () => {
    const { disableMCP, disableMCPForTool, getAllDisabled } = require('../../src/lib/disable-control');
    disableMCP('alpha');
    disableMCPForTool('beta', 'cline');
    const all = getAllDisabled();
    expect(all.global).toContain('alpha');
    expect(all.tool_specific['cline']).toContain('beta');
  });

  it('handles corrupted YAML gracefully', () => {
    fs.writeFileSync(path.join(tmpDir, '.forte', 'disabled-mcps.yaml'), 'key: [value');
    const { loadDisableConfig } = require('../../src/lib/disable-control');
    const result = loadDisableConfig();
    expect(Array.isArray(result.global_disabled)).toBe(true);
  });
});
