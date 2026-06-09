const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-config-test-'));

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

describe('config-handler', () => {
  it('detects JSON format', () => {
    const { analyzeConfig } = require('../../src/lib/config-handler');
    const target = path.join(tmpDir, 'c.json');
    fs.writeFileSync(target, '{"mcpServers":{}}');
    const result = analyzeConfig(target, 'mcpServers');
    expect(result.format).toBe('json');
  });

  it('detects YAML format', () => {
    const { analyzeConfig } = require('../../src/lib/config-handler');
    const target = path.join(tmpDir, 'c.yaml');
    fs.writeFileSync(target, 'mcpServers:\n  test: {}\n');
    const result = analyzeConfig(target, 'mcpServers');
    expect(result.format).toBe('yaml');
  });

  it('reports unknown format for unknown extension', () => {
    const { analyzeConfig } = require('../../src/lib/config-handler');
    const target = path.join(tmpDir, 'c.ini');
    fs.writeFileSync(target, '');
    const result = analyzeConfig(target, 'mcpServers');
    expect(result.is_safe_to_modify).toBe(false);
    expect(result.warnings).toContain('Unknown config format');
  });

  it('marks missing file safe to create', () => {
    const { analyzeConfig } = require('../../src/lib/config-handler');
    const result = analyzeConfig(path.join(tmpDir, 'missing.json'), 'mcpServers');
    expect(result.is_safe_to_modify).toBe(true);
    expect(result.mcp_section_exists).toBe(false);
  });
});
