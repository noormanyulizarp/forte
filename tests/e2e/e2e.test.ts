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

  it('init-all applies MCPs when config exists', () => {
    const configPath = path.join(tmpHome, 'claude_desktop_config.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ mcpServers: {} }, null, 2));

    const { initAll } = require('../../src/lib/init');
    initAll({
      'demo-mcp': { command: 'npx', args: ['-y', 'demo'] }
    }, true);

    expect(process.exit).not.toHaveBeenCalled();
    const updated = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(updated.mcpServers['demo-mcp']).toBeDefined();
  });
});
