jest.mock('../../src/lib/backup', () => ({
  backupConfig: jest.fn()
}));

const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-integration-init-'));

beforeEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
  jest.spyOn(os, 'homedir').mockReturnValue(tmpHome);
  process.exit = jest.fn() as any;
});

afterAll(() => {
  jest.restoreAllMocks();
  try { fs.rmSync(tmpHome, { recursive: true, force: true }); } catch {}
});

describe('integration: init', () => {
  function makeJsonConfig(subpath, initial) {
    const configPath = path.join(tmpHome, subpath);
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(initial || { mcpServers: {} }, null, 2));
    return configPath;
  }

  it('applies registry MCPs to a JSON tool config', async () => {
    const { applyMCPsToTool } = require('../../src/lib/init');
    const configPath = makeJsonConfig('.config/claude-code/claude_desktop_config.json');

    const toolConfig = {
      name: 'Claude Code',
      config_path: configPath,
      config_format: 'json',
      mcp_key: 'mcpServers',
      command_format: 'string+array',
      env_syntax: 'env',
      enable_key: null,
      supports_env: true
    };

    const registry = {
      'test-mcp': { command: 'npx', args: ['-y', '@test/server'] }
    };

    const result = await applyMCPsToTool('claude-code', toolConfig, registry, true);
    expect(result.applied).toBe(1);
    expect(JSON.parse(fs.readFileSync(configPath, 'utf-8')).mcpServers['test-mcp']).toBeDefined();
  });

  it('preserves existing MCP entries when not forced', async () => {
    const { applyMCPsToTool } = require('../../src/lib/init');
    const configPath = makeJsonConfig('.config/claude-code/claude_desktop_config.json', {
      mcpServers: { 'existing-mcp': { command: 'npx', args: ['-y', 'existing'] } }
    });

    const toolConfig = {
      name: 'Claude Code',
      config_path: configPath,
      config_format: 'json',
      mcp_key: 'mcpServers',
      command_format: 'string+array',
      env_syntax: 'env',
      enable_key: null,
      supports_env: true
    };

    const registry = {
      'new-mcp': { command: 'npx', args: ['-y', '@test/server'] }
    };

    const result = await applyMCPsToTool('claude-code', toolConfig, registry, false);
    expect(result.applied).toBe(1);
    const updated = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(updated.mcpServers['existing-mcp']).toBeDefined();
    expect(updated.mcpServers['new-mcp']).toBeDefined();
  });

  it('skips missing configs', async () => {
    const { applyMCPsToTool } = require('../../src/lib/init');
    const toolConfig = {
      name: 'Missing Tool',
      config_path: path.join(tmpHome, 'does-not-exist.json'),
      config_format: 'json',
      mcp_key: 'mcpServers',
      command_format: 'string+array',
      env_syntax: 'env',
      enable_key: null,
      supports_env: true
    };
    const result = await applyMCPsToTool('missing', toolConfig, {}, true);
    expect(result.applied).toBe(0);
  });
});
