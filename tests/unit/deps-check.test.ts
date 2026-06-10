const childProcess = require('child_process');

describe('deps-check', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();

    childProcess.exec = jest.fn((cmd: string, cb: any) => {
      if (cmd.includes('npm list -g npm')) {
        process.nextTick(cb, null, { stdout: 'npm@10.0.0\n', stderr: '' });
      } else if (cmd.includes('nonexistent-xyz')) {
        process.nextTick(cb, null, { stdout: '', stderr: '' });
      } else if (cmd.includes('this-package-does-not-exist')) {
        process.nextTick(cb, null, { stdout: '', stderr: '' });
      } else {
        process.nextTick(cb, new Error('ENOENT'));
      }
      return {} as any;
    });
  });

  it('detects installed npm package', async () => {
    const { checkNpmPackage } = require('../../src/lib/deps-check');
    const result = await checkNpmPackage('npm');
    expect(result.installed).toBe(true);
    expect(result.name).toBe('npm');
  });

  it('detects missing package', async () => {
    const { checkNpmPackage } = require('../../src/lib/deps-check');
    const result = await checkNpmPackage('nonexistent-xyz');
    expect(result.installed).toBe(false);
  });

  it('returns not installed on exec failure', async () => {
    const { checkNpmPackage } = require('../../src/lib/deps-check');
    const result = await checkNpmPackage('bad-pkg');
    expect(result.installed).toBe(false);
  });

  it('formatter runs for missing packages', () => {
    const { formatDepCheck } = require('../../src/lib/deps-check');
    const deps = {
      filesystem: {
        mcp: 'filesystem',
        packages: ['@modelcontextprotocol/server-filesystem'],
        env_vars: [] as string[],
        installed: false,
        missing_packages: ['@modelcontextprotocol/server-filesystem'],
        missing_env_vars: [] as string[]
      }
    };
    const out = formatDepCheck(deps);
    expect(out).toContain('missing');
  });

  it('formatter includes environment requirements', () => {
    const { formatDepCheck } = require('../../src/lib/deps-check');
    const deps = {
      database: {
        mcp: 'database',
        packages: ['db-mcp'],
        env_vars: ['DATABASE_URL'],
        installed: true,
        missing_packages: [],
        missing_env_vars: []
      }
    };
    const out = formatDepCheck(deps);
    expect(out).toContain('DATABASE_URL');
  });

  it('formatter reports mixed installation summary', () => {
    const { formatDepCheck } = require('../../src/lib/deps-check');
    const deps = {
      filesystem: {
        mcp: 'filesystem',
        packages: ['@modelcontextprotocol/server-filesystem'],
        env_vars: [] as string[],
        installed: true,
        missing_packages: [],
        missing_env_vars: []
      },
      database: {
        mcp: 'database',
        packages: ['db-mcp'],
        env_vars: [] as string[],
        installed: false,
        missing_packages: ['db-mcp'],
        missing_env_vars: []
      }
    };
    const out = formatDepCheck(deps);
    expect(out).toContain('1/2');
  });

  it('reports not installed for missing global packages', async () => {
    const { checkNpmPackage } = require('../../src/lib/deps-check');
    const result = await checkNpmPackage('this-package-does-not-exist');
    expect(result.installed).toBe(false);
  });
});
