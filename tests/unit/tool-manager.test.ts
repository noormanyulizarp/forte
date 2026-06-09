const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forte-tool-test-'));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
  const toolsDir = path.join(tmpDir, '.forte', 'tools');
  fs.mkdirSync(toolsDir, { recursive: true });
  fs.chmodSync(toolsDir, 0o700);
  const storagePath = path.join(toolsDir, 'custom-tools.yaml');
  try { fs.unlinkSync(storagePath); } catch {}
});

afterAll(() => {
  jest.restoreAllMocks();
  try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
});

describe('tool-manager', () => {
  it('adds and retrieves a custom tool', () => {
    const { addCustomTool, getCustomTool, listCustomTools } = require('../../src/lib/tool-manager');
    const tool = {
      name: 'Test Tool',
      type: 'code_editor',
      config_path: '/tmp/config.json',
      config_format: 'json',
      mcp_key: 'mcpServers',
      supports_env: true,
      enable_key: null,
      command_format: 'string+array',
      env_syntax: 'env'
    };
    addCustomTool('test-tool', tool);
    expect(getCustomTool('test-tool').name).toBe('Test Tool');
    expect(Object.keys(listCustomTools())).toContain('test-tool');
  });

  it('removes a custom tool', () => {
    const { addCustomTool, removeCustomTool, listCustomTools } = require('../../src/lib/tool-manager');
    addCustomTool('remove-tool', {
      name: 'Remove Tool',
      type: 'code_editor',
      config_path: '/tmp/config.json',
      config_format: 'json',
      mcp_key: 'mcpServers',
      supports_env: true,
      enable_key: null,
      command_format: 'string+array',
      env_syntax: 'env'
    });
    removeCustomTool('remove-tool');
    expect(listCustomTools()['remove-tool']).toBeUndefined();
  });

  it('rejects invalid tool config', () => {
    const { validateToolConfig } = require('../../src/lib/tool-manager');
    const result = validateToolConfig({
      name: '',
      config_path: '',
      config_format: 'xml',
      mcp_key: '',
      command_format: 'object',
      env_syntax: 'env'
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
