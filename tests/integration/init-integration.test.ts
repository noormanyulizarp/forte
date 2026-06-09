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
  it('applies registry MCPs to a JSON tool config', () => {
    const configPath = path.join(tmpHome, 'claude_desktop_config.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ mcpServers: {} }, null, 2));

    const { initAll } = require('../../src/lib/init');

    const registry = {
      'test-mcp': {
        command: 'npx',
        args: ['-y', '@test/server']
      }
    };

    initAll(registry, true);

    expect(process.exit).not.toHaveBeenCalled();
    expect(JSON.parse(fs.readFileSync(configPath, 'utf-8')).mcpServers['test-mcp']).toBeDefined();
  });

  it('skips missing configs gracefully without failing', () => {
    const { initAll } = require('../../src/lib/init');

    const registry = {
      'test-mcp': {
        command: 'npx',
        args: ['-y', '@test/server']
      }
    };

    initAll(registry, true);

    expect(process.exit).not.toHaveBeenCalled();
  });

  it('preserves existing MCP entries when not forced', () => {
    const configPath = path.join(tmpHome, 'claude_desktop_config.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({
      mcpServers: {
        'existing-mcp': { command: 'npx', args: ['-y', 'existing'] }
      }
    }, null, 2));

    const { initAll } = require('../../src/lib/init');

    const registry = {
      'new-mcp': {
        command: 'npx',
        args: ['-y', '@test/server']
      }
    };

    initAll(registry, false);

    const updated = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(updated.mcpServers['existing-mcp']).toBeDefined();
    expect(updated.mcpServers['new-mcp']).toBeDefined();
  });
});
