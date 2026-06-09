const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

jest.mock('simple-git', () => {
  return jest.fn(() => ({
    checkIsRepo: jest.fn().mockResolvedValue(true),
    clone: jest.fn().mockResolvedValue(undefined),
    init: jest.fn().mockResolvedValue(undefined),
    addRemote: jest.fn().mockResolvedValue(undefined),
    status: jest.fn().mockResolvedValue({ files: [], branches: [] }),
    add: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue('abc123'),
    push: jest.fn().mockResolvedValue(undefined),
    pull: jest.fn().mockResolvedValue(undefined),
    fetch: jest.fn().mockResolvedValue(undefined),
    revparse: jest.fn().mockResolvedValue('main')
  }));
});

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-repo-test-'));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.spyOn(os, 'homedir').mockReturnValue(tmpHome);
  const repoDir = path.join(tmpHome, '.forte');
  fs.mkdirSync(repoDir, { recursive: true });
  fs.chmodSync(repoDir, 0o700);
  const configPath = path.join(repoDir, 'repository.yaml');
  try { fs.unlinkSync(configPath); } catch {}
});

afterAll(() => {
  jest.restoreAllMocks();
  try { fs.rmSync(tmpHome, { recursive: true, force: true }); } catch {}
});

describe('repo-sync', () => {
  it('loads null when no config exists', () => {
    const { loadRepoConfig } = require('../../src/lib/repo-sync');
    expect(loadRepoConfig()).toBeNull();
  });

  it('saves and loads repo config', () => {
    const { saveRepoConfig, loadRepoConfig } = require('../../src/lib/repo-sync');
    const config = {
      platform: 'github' as const,
      owner: 'user',
      repo: 'my-configs',
      url: 'https://github.com/user/my-configs.git',
      localPath: path.join(tmpHome, '.forte', 'repo-sync'),
      branch: 'main'
    };
    saveRepoConfig(config);
    const loaded = loadRepoConfig();
    expect(loaded).not.toBeNull();
    expect(loaded!.owner).toBe('user');
    expect(loaded!.repo).toBe('my-configs');
  });

  it('connect validates repo format', async () => {
    const { connectToRepo } = require('../../src/lib/repo-sync');
    const result = await connectToRepo('github', 'invalid');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid repo format');
  });

  it('disconnect removes config', async () => {
    const { saveRepoConfig, disconnectFromRepo } = require('../../src/lib/repo-sync');
    saveRepoConfig({
      platform: 'github',
      owner: 'user',
      repo: 'repo',
      url: 'https://github.com/user/repo.git',
      localPath: path.join(tmpHome, '.forte', 'repo-sync')
    });
    const result = await disconnectFromRepo();
    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tmpHome, '.forte', 'repository.yaml'))).toBe(false);
  });
});
