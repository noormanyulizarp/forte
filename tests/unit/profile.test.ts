const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

jest.mock('../../src/lib/backup', () => ({
  backupConfig: jest.fn()
}));

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-profile-test-'));

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

describe('profile: use', () => {
  it('applies a profile to forte config', async () => {
    const forteDir = path.join(tmpHome, '.forte');
    fs.mkdirSync(forteDir, { recursive: true });
    fs.chmodSync(forteDir, 0o700);

    const profileDir = path.join(forteDir, 'profiles');
    fs.mkdirSync(profileDir, { recursive: true });

    const profile = {
      name: 'minimal',
      description: 'Minimal MCP set',
      mcp_list: ['filesystem', 'fetch'],
      created_at: new Date().toISOString()
    };
    fs.writeFileSync(path.join(profileDir, 'minimal.yaml'), yaml.dump(profile));

    const { applyProfile } = require('../../src/lib/profile');
    const registry = {
      filesystem: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] },
      fetch: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-fetch'] }
    };

    const result = applyProfile('minimal', registry);
    expect(result.success).toBe(true);
    expect(result.applied).toBe(2);

    const configPath = path.join(forteDir, 'forte.config.yaml');
    expect(fs.existsSync(configPath)).toBe(true);

    const config = yaml.load(fs.readFileSync(configPath, 'utf-8'));
    expect(config.mcp_registry.filesystem).toBeDefined();
    expect(config.mcp_registry.fetch).toBeDefined();
  });

  it('reports 0 applied when profile is empty', async () => {
    const forteDir = path.join(tmpHome, '.forte');
    fs.mkdirSync(forteDir, { recursive: true });

    const profileDir = path.join(forteDir, 'profiles');
    fs.mkdirSync(profileDir, { recursive: true });

    const profile = {
      name: 'empty',
      description: 'Empty profile',
      mcp_list: [],
      created_at: new Date().toISOString()
    };
    fs.writeFileSync(path.join(profileDir, 'empty.yaml'), yaml.dump(profile));

    const { applyProfile } = require('../../src/lib/profile');
    const registry = { filesystem: {} };
    const result = applyProfile('empty', registry);
    expect(result.success).toBe(true);
    expect(result.applied).toBe(0);
  });

  it('returns failure for missing profile', async () => {
    const { applyProfile } = require('../../src/lib/profile');
    const result = applyProfile('unknown', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('unknown');
  });
});
