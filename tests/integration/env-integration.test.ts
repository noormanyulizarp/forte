const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-env-integration-'));

beforeEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
  jest.spyOn(os, 'homedir').mockReturnValue(tmpHome);
  const forteDir = path.join(tmpHome, '.forte');
  fs.mkdirSync(forteDir, { recursive: true });
  fs.chmodSync(forteDir, 0o700);
  try { fs.unlinkSync(path.join(forteDir, 'env.yaml')); } catch {}
});

afterAll(() => {
  jest.restoreAllMocks();
  try { fs.rmSync(tmpHome, { recursive: true, force: true }); } catch {}
});

describe('integration: env storage with real files', () => {
  it('persists variables between process restarts', () => {
    const module = require('../../src/lib/env-storage');
    module.addEnvVar('PERSIST', 'value1');
    expect(module.getEnvVar('PERSIST')).toBe('value1');

    jest.resetModules();
    jest.spyOn(os, 'homedir').mockReturnValue(tmpHome);
    const fresh = require('../../src/lib/env-storage');
    expect(fresh.getEnvVar('PERSIST')).toBe('value1');
  });

  it('respects file permissions', () => {
    const module = require('../../src/lib/env-storage');
    module.addEnvVar('SECURE', 'secret');
    const envPath = path.join(tmpHome, '.forte', 'env.yaml');
    const stat = fs.statSync(envPath);
    expect((stat.mode & 0o777)).toBe(0o600);
  });

  it('imports and exports roundtrip', () => {
    const module = require('../../src/lib/env-storage');
    const envFile = path.join(tmpHome, '.env');
    fs.writeFileSync(envFile, 'A=1\nB=2\n');
    module.importFromEnvFile(envFile);
    const outFile = path.join(tmpHome, 'out.env');
    module.exportToEnvFile(outFile);
    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content).toContain('A=1');
    expect(content).toContain('B=2');
  });
});
