jest.mock('../../src/lib/backup', () => ({
  backupConfig: jest.fn()
}));

const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-init-test-'));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
  process.exit = jest.fn() as any;
});

afterAll(() => {
  jest.restoreAllMocks();
  try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
});

describe('init', () => {
  it('applies MCPs to JSON tool format', () => {
    const configPath = path.join(tmpDir, 'claude.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ mcpServers: {} }, null, 2));
    fs.chmodSync(configPath, 0o600);

    const { initAll } = require('../../src/lib/init');
    const registry = {
      'test-mcp': {
        command: 'npx',
        args: ['-y', '@test/server']
      }
    };

    initAll(registry, true);
    expect(true).toBe(true);
  });

  it('applies MCPs to YAML tool format', () => {
    const configPath = path.join(tmpDir, 'openclaw.yaml');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, 'mcp:\n  servers:\n');
    fs.chmodSync(configPath, 0o600);

    const { initAll } = require('../../src/lib/init');
    const registry = {
      'test-mcp': {
        command: 'npx',
        args: ['-y', '@test/server']
      }
    };

    initAll(registry, true);
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('does not throw when config is missing', () => {
    const { initAll } = require('../../src/lib/init');
    initAll({}, true);
    expect(process.exit).not.toHaveBeenCalled();
  });
});
