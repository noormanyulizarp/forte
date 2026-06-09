const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-path-resolver-test-'));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
});

afterAll(() => {
  jest.restoreAllMocks();
  try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
});

describe('path-resolver', () => {
  describe('resolvePath', () => {
    it('expands tilde to homedir', () => {
      const { resolvePath } = require('../../src/lib/path-resolver');
      expect(resolvePath('~/.config/foo')).toBe(path.join(tmpDir, '.config/foo'));
    });

    it('expands Windows env vars on win32', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true });
      process.env.APPDATA = 'C:\\Users\\Test\\AppData\\Roaming';
      const { resolvePath } = require('../../src/lib/path-resolver');
      expect(resolvePath('%APPDATA%\\Claude\\config')).toBe('C:\\Users\\Test\\AppData\\Roaming\\Claude\\config');
      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true });
      delete process.env.APPDATA;
    });

    it('returns path unchanged if no expansion needed', () => {
      const { resolvePath } = require('../../src/lib/path-resolver');
      expect(resolvePath('/absolute/path')).toBe('/absolute/path');
    });
  });

  describe('getDefaultPath', () => {
    it('returns Linux default for claude-code', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true });
      const { getDefaultPath } = require('../../src/lib/path-resolver');
      const p = getDefaultPath('claude-code');
      expect(p).toBe(path.join(tmpDir, '.config/claude-code/claude_desktop_config.json'));
      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true });
    });

    it('returns Darwin default for openclaw', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin', writable: true });
      const { getDefaultPath } = require('../../src/lib/path-resolver');
      const p = getDefaultPath('openclaw');
      expect(p).toBe(path.join(tmpDir, '.openclaw/config.yaml'));
      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true });
    });

    it('returns win32 default for kilocode', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true });
      const { getDefaultPath } = require('../../src/lib/path-resolver');
      const p = getDefaultPath('kilocode');
      expect(p).toBe(path.join(tmpDir, '.kilocode/mcp.json'));
      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true });
    });
  });

  describe('resolveToolPath', () => {
    it('prefers custom path when provided', () => {
      const { resolveToolPath } = require('../../src/lib/path-resolver');
      const p = resolveToolPath('claude-code', '/custom/path');
      expect(p).toBe('/custom/path');
    });

    it('falls back to FORTE_* env var when no custom path', () => {
      process.env.FORTE_CLAUDE_CODE_PATH = '/env/path';
      const { resolveToolPath } = require('../../src/lib/path-resolver');
      const p = resolveToolPath('claude-code');
      expect(p).toBe('/env/path');
      delete process.env.FORTE_CLAUDE_CODE_PATH;
    });
  });

  describe('validatePath', () => {
    it('returns invalid when path does not exist', () => {
      const { validatePath } = require('../../src/lib/path-resolver');
      const result = validatePath('/nonexistent');
      expect(result.valid).toBe(false);
    });

    it('returns valid when path exists and readable', () => {
      const { validatePath } = require('../../src/lib/path-resolver');
      const target = path.join(tmpDir, 'existing.txt');
      fs.writeFileSync(target, 'hello');
      const result = validatePath(target);
      expect(result.valid).toBe(true);
    });
  });

  describe('getAvailableTools', () => {
    it('returns all known tool IDs', () => {
      const { getAvailableTools } = require('../../src/lib/path-resolver');
      const tools = getAvailableTools();
      expect(tools).toContain('claude-code');
      expect(tools).toContain('openclaw');
      expect(tools.length).toBeGreaterThanOrEqual(7);
    });
  });
});
