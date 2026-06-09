const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-mcp-registry-test-'));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
});

afterAll(() => {
  jest.restoreAllMocks();
  try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
});

describe('mcp-registry', () => {
  it('saves and loads registry', () => {
    const { saveMCPRegistry, loadMCPRegistry } = require('../../src/lib/mcp-registry');
    saveMCPRegistry({ 'test-mcp': { command: 'npx', args: ['-y', 'pkg'] } });
    const loaded = loadMCPRegistry();
    expect(loaded['test-mcp'].command).toBe('npx');
  });

  it('adds MCP to registry', () => {
    const { addMCPToRegistry, loadMCPRegistry } = require('../../src/lib/mcp-registry');
    addMCPToRegistry('my-mcp', { command: 'npx', args: ['-y', 'pkg'] });
    const loaded = loadMCPRegistry();
    expect(loaded['my-mcp'].official).toBe(false);
    expect(loaded['my-mcp'].command).toBe('npx');
  });

  it('removes MCP from registry', () => {
    const { addMCPToRegistry, removeMCPFromRegistry, loadMCPRegistry } = require('../../src/lib/mcp-registry');
    addMCPToRegistry('temp-mcp', { command: 'npx', args: [] });
    removeMCPFromRegistry('temp-mcp');
    expect(loadMCPRegistry()['temp-mcp']).toBeUndefined();
  });

  it('loadMalformedRegistryReturnsEmpty', () => {
    fs.writeFileSync(path.join(tmpDir, '.forte', 'mcp-registry.json'), 'not json');
    const { loadMCPRegistry } = require('../../src/lib/mcp-registry');
    expect(loadMCPRegistry()).toEqual({});
  });
});
