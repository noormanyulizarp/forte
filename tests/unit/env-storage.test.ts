const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-env-test-'));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
  const forteDir = path.join(tmpDir, '.forte');
  fs.mkdirSync(forteDir, { recursive: true });
  fs.chmodSync(forteDir, 0o700);
  try { fs.unlinkSync(path.join(forteDir, 'env.yaml')); } catch {}
});

afterAll(() => {
  jest.restoreAllMocks();
  try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
});

describe('env-storage', () => {
  it('adds and loads an environment variable', () => {
    const { addEnvVar, getEnvVar } = require('../../src/lib/env-storage');
    addEnvVar('API_KEY', 'secret123');
    expect(getEnvVar('API_KEY')).toBe('secret123');
  });

  it('removes an environment variable', () => {
    const { addEnvVar, getEnvVar, removeEnvVar } = require('../../src/lib/env-storage');
    addEnvVar('API_KEY', 'secret123');
    removeEnvVar('API_KEY');
    expect(getEnvVar('API_KEY')).toBeNull();
  });

  it('masks long values in listEnvVars', () => {
    const { addEnvVar, listEnvVars } = require('../../src/lib/env-storage');
    addEnvVar('LONG_KEY', 'abcdefghijklmnop');
    const vars = listEnvVars();
    expect(vars.LONG_KEY).toBe('abcd***mnop');
  });

  it('fully masks short values', () => {
    const { addEnvVar, listEnvVars } = require('../../src/lib/env-storage');
    addEnvVar('SHORT', 'abc');
    const vars = listEnvVars();
    expect(vars.SHORT).toBe('***REDACTED***');
  });

  it('returns raw values via listEnvVarsRaw', () => {
    const { addEnvVar, listEnvVarsRaw } = require('../../src/lib/env-storage');
    addEnvVar('KEY', 'rawvalue');
    const vars = listEnvVarsRaw();
    expect(vars.KEY).toBe('rawvalue');
  });

  it('imports from env file', () => {
    const { importFromEnvFile, getEnvVar } = require('../../src/lib/env-storage');
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'KEY1=val1\n# comment\nKEY2="val2"\nKEY3=val3\n');
    importFromEnvFile(envFile);
    expect(getEnvVar('KEY1')).toBe('val1');
    expect(getEnvVar('KEY2')).toBe('val2');
    expect(getEnvVar('KEY3')).toBe('val3');
  });

  it('exports to env file', () => {
    const { addEnvVar, exportToEnvFile } = require('../../src/lib/env-storage');
    addEnvVar('KEY1', 'val1');
    addEnvVar('KEY2', 'val2');
    const outFile = path.join(tmpDir, 'output.env');
    exportToEnvFile(outFile);
    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content).toContain('KEY1=val1');
    expect(content).toContain('KEY2=val2');
  });

  it('validates uppercase keys', () => {
    const { validateEnvVar } = require('../../src/lib/env-storage');
    expect(validateEnvVar('lowercase', 'v').valid).toBe(false);
    expect(validateEnvVar('KEY-1', 'v').valid).toBe(false);
    expect(validateEnvVar('', 'v').valid).toBe(false);
    expect(validateEnvVar('VALID_KEY', 'v').valid).toBe(true);
  });

  it('resolves via priority chain', () => {
    const { addEnvVar, resolveEnvVar } = require('../../src/lib/env-storage');
    addEnvVar('PRIORITY', 'managed');
    process.env.PRIORITY = 'shell';
    expect(resolveEnvVar('PRIORITY')).toBe('managed');
    delete process.env.PRIORITY;
  });

  it('falls back to shell env', () => {
    const { resolveEnvVar } = require('../../src/lib/env-storage');
    process.env.SHELL_ONLY = 'shellval';
    expect(resolveEnvVar('SHELL_ONLY')).toBe('shellval');
    delete process.env.SHELL_ONLY;
  });

  it('resolves env string interpolation', () => {
    const { addEnvVar, resolveEnvString } = require('../../src/lib/env-storage');
    addEnvVar('TOKEN', 'abc123');
    const result = resolveEnvString('https://api.example.com?key=${TOKEN}');
    expect(result).toBe('https://api.example.com?key=abc123');
  });

  it('checks MCP env dependencies', () => {
    const { addEnvVar, checkMcpEnvDependencies } = require('../../src/lib/env-storage');
    addEnvVar('EXISTING', 'yes');
    const { missing, present } = checkMcpEnvDependencies({ env: { EXISTING: '${EXISTING}', MISSING: '${MISSING}' } });
    expect(present).toContain('EXISTING');
    expect(missing).toContain('MISSING');
  });
});
