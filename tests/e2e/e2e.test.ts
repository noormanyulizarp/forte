jest.mock('../../src/lib/backup', () => ({
  backupConfig: jest.fn()
}));

const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-e2e-init-'));

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

describe('e2e: init-all resilience', () => {
  it('init-all exits 0 when all tool configs are missing', () => {
    const { initAll } = require('../../src/lib/init');
    initAll({}, true);
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('applies MCPs to an existing config via applyMCPsToTool', async () => {
    const configPath = path.join(tmpHome, '.config', 'claude-code', 'claude_desktop_config.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ mcpServers: {} }, null, 2));

    const { applyMCPsToTool } = require('../../src/lib/init');
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
    const result = await applyMCPsToTool('claude-code', toolConfig, {
      'demo-mcp': { command: 'npx', args: ['-y', 'demo'] }
    }, true);

    expect(result.applied).toBe(1);
    const updated = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(updated.mcpServers['demo-mcp']).toBeDefined();
  });
});
