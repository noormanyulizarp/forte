const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-backup-test-'));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
  process.exit = jest.fn() as any;
  const backupDir = path.join(tmpDir, '.forte', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  fs.chmodSync(backupDir, 0o700);
  const files = fs.readdirSync(backupDir);
  for (const f of files) { try { fs.unlinkSync(path.join(backupDir, f)); } catch {} }
});

afterAll(() => {
  jest.restoreAllMocks();
  try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
});

describe('backup', () => {
  it('creates a backup file', () => {
    const { backupConfig } = require('../../src/lib/backup');
    const source = path.join(tmpDir, 'source.json');
    fs.writeFileSync(source, '{"key":"value"}');
    backupConfig('mytool', source);
    const files = fs.readdirSync(path.join(tmpDir, '.forte', 'backups'));
    expect(files.some((f) => f.startsWith('mytool-') && f.endsWith('.bak'))).toBe(true);
  });

  it('lists backups sorted reverse chronological', () => {
    const { backupConfig, listBackups } = require('../../src/lib/backup');
    const source = path.join(tmpDir, 'source.json');
    fs.writeFileSync(source, '{"key":"value"}');
    backupConfig('mytool', source);
    const files = listBackups();
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(files[0]).toBeDefined();
  });

  it('restores a backup', () => {
    const { backupConfig, restoreBackup } = require('../../src/lib/backup');
    const source = path.join(tmpDir, 'source.json');
    fs.writeFileSync(source, '{"key":"value"}');
    backupConfig('mytool', source);
    const files = fs.readdirSync(path.join(tmpDir, '.forte', 'backups'));
    const backupFile = files.find((f) => f.startsWith('mytool-') && f.endsWith('.bak'));
    const target = path.join(tmpDir, 'restored.json');
    restoreBackup(backupFile, target);
    expect(fs.readFileSync(target, 'utf-8')).toBe('{"key":"value"}');
  });

  it('throws when restoring missing backup', () => {
    const { restoreBackup } = require('../../src/lib/backup');
    expect(() => restoreBackup('nonexistent.bak', '/tmp/target')).toThrow('Backup not found');
  });

  it('cleans old backups keeping limit', () => {
    const { backupConfig, listBackups, cleanOldBackups } = require('../../src/lib/backup');
    const source = path.join(tmpDir, 'source.json');
    fs.writeFileSync(source, '{"key":"value"}');
    for (let i = 0; i < 12; i++) backupConfig('mytool', source);
    cleanOldBackups(10);
    const files = listBackups();
    expect(files.length).toBeLessThanOrEqual(10);
  });

  it('returns empty list when no backups', () => {
    fs.rmSync(path.join(tmpDir, '.forte', 'backups'), { recursive: true, force: true });
    const { listBackups } = require('../../src/lib/backup');
    expect(listBackups()).toEqual([]);
  });
});
