import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';
import * as readline from 'readline';

export interface CustomTool {
  name: string;
  type: 'code_editor' | 'agent_framework';
  config_path: string;
  config_format: 'json' | 'yaml';
  mcp_key: string;
  supports_env: boolean;
  enable_key: string | null;
  command_format: 'string+array' | 'array' | 'scalar+list';
  env_syntax: 'env' | 'environment';
  priority?: number;
  added_at?: string;
  last_detected?: string;
}

export interface CustomToolsStorage {
  custom_tools: Record<string, CustomTool>;
  metadata?: {
    version: string;
    total_tools: number;
    last_updated: string;
  };
}

/**
 * Get custom tools storage path
 */
export function getCustomToolsPath(): string {
  return path.join(os.homedir(), '.forte', 'tools', 'custom-tools.yaml');
}

/**
 * Ensure .forte/tools directory exists
 */
export function ensureToolsDir(): void {
  const forteDir = path.join(os.homedir(), '.forte');
  const toolsDir = path.join(forteDir, 'tools');
  
  if (!fs.existsSync(toolsDir)) {
    fs.mkdirSync(toolsDir, { recursive: true });
    fs.chmodSync(toolsDir, 0o700); // rwx------
  }
}

/**
 * Load custom tools
 */
export function loadCustomTools(): CustomToolsStorage {
  const toolsPath = getCustomToolsPath();
  
  if (!fs.existsSync(toolsPath)) {
    return { custom_tools: {} };
  }
  
  try {
    const content = fs.readFileSync(toolsPath, 'utf-8');
    const storage = yaml.load(content) as CustomToolsStorage;
    
    if (!storage.custom_tools) {
      storage.custom_tools = {};
    }
    
    return storage;
  } catch (error) {
    console.error('Error loading custom tools:', error);
    return { custom_tools: {} };
  }
}

/**
 * Save custom tools
 */
export function saveCustomTools(storage: CustomToolsStorage): void {
  ensureToolsDir();
  
  const toolsPath = getCustomToolsPath();
  
  // Update metadata
  if (!storage.metadata) {
    storage.metadata = {
      version: '1.0',
      total_tools: 0,
      last_updated: new Date().toISOString()
    };
  }
  storage.metadata.total_tools = Object.keys(storage.custom_tools).length;
  storage.metadata.last_updated = new Date().toISOString();
  
  const content = yaml.dump(storage);
  
  // Write with secure permissions
  fs.writeFileSync(toolsPath, content, { mode: 0o600 }); // rw-------
}

/**
 * Add custom tool
 */
export function addCustomTool(toolId: string, tool: CustomTool): void {
  const storage = loadCustomTools();
  tool.added_at = new Date().toISOString();
  tool.priority = tool.priority || 50; // Default priority
  storage.custom_tools[toolId] = tool;
  saveCustomTools(storage);
}

/**
 * Get custom tool
 */
export function getCustomTool(toolId: string): CustomTool | null {
  const storage = loadCustomTools();
  return storage.custom_tools[toolId] || null;
}

/**
 * Remove custom tool
 */
export function removeCustomTool(toolId: string): void {
  const storage = loadCustomTools();
  delete storage.custom_tools[toolId];
  saveCustomTools(storage);
}

/**
 * List all custom tools
 */
export function listCustomTools(): Record<string, CustomTool> {
  const storage = loadCustomTools();
  return storage.custom_tools;
}

/**
 * Validate tool config
 */
export function validateToolConfig(tool: CustomTool): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!tool.name || tool.name.trim() === '') {
    errors.push('Tool name cannot be empty');
  }
  
  if (!tool.config_path || tool.config_path.trim() === '') {
    errors.push('Config path cannot be empty');
  }
  
  const configPath = tool.config_path.replace('~', os.homedir());
  if (!fs.existsSync(configPath)) {
    errors.push('Config file does not exist');
  }
  
  if (!['json', 'yaml'].includes(tool.config_format)) {
    errors.push('Config format must be json or yaml');
  }
  
  if (!tool.mcp_key || tool.mcp_key.trim() === '') {
    errors.push('MCP key cannot be empty');
  }
  
  if (!['string+array', 'array', 'scalar+list'].includes(tool.command_format)) {
    errors.push('Command format must be string+array, array, or scalar+list');
  }
  
  if (!['env', 'environment'].includes(tool.env_syntax)) {
    errors.push('Env syntax must be env or environment');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Analyze config file to detect format
 */
export function analyzeConfigFile(configPath: string): {
  format: 'json' | 'yaml';
  mcp_key?: string;
  command_format?: 'string+array' | 'array' | 'scalar+list';
  env_syntax?: 'env' | 'environment';
  enable_key?: string | null;
} | null {
  try {
    const resolvedPath = configPath.replace('~', os.homedir());
    
    if (!fs.existsSync(resolvedPath)) {
      return null;
    }
    
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    
    // Detect format
    let format: 'json' | 'yaml';
    try {
      JSON.parse(content);
      format = 'json';
    } catch {
      try {
        yaml.load(content);
        format = 'yaml';
      } catch {
        return null;
      }
    }
    
    // Parse config
    let config: any;
    if (format === 'json') {
      config = JSON.parse(content);
    } else {
      config = yaml.load(content);
    }
    
    // Find MCP key
    const mcpKey = findMcpKey(config);
    if (!mcpKey) {
      return { format };
    }
    
    // Analyze MCP config
    const mcpConfig = getNestedValue(config, mcpKey);
    if (!mcpConfig || typeof mcpConfig !== 'object') {
      return { format, mcp_key: mcpKey };
    }
    
    // Analyze command format
    const commandFormat = analyzeCommandFormat(mcpConfig);
    
    // Detect env syntax
    const envSyntax = detectEnvSyntax(mcpConfig);
    
    // Check enable/disable flags
    const enableKey = detectEnableKey(mcpConfig);
    
    return {
      format,
      mcp_key: mcpKey,
      command_format: commandFormat,
      env_syntax: envSyntax,
      enable_key: enableKey
    };
    
  } catch (error) {
    return null;
  }
}

/**
 * Find MCP key in config
 */
function findMcpKey(config: any): string | null {
  const possibleKeys = ['mcpServers', 'mcp', 'mcp_servers', 'mcp.servers'];
  
  for (const key of possibleKeys) {
    if (config[key]) {
      return key;
    }
  }
  
  return null;
}

/**
 * Get nested value from object
 */
function getNestedValue(obj: any, keyPath: string): any {
  const keys = keyPath.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return null;
    }
  }
  
  return value;
}

/**
 * Analyze command format from MCP config
 */
function analyzeCommandFormat(mcpConfig: any): 'string+array' | 'array' | 'scalar+list' {
  const sampleMcp = Object.values(mcpConfig)[0] as any;
  
  if (!sampleMcp) {
    return 'array'; // Default
  }
  
  if (typeof sampleMcp === 'object' && sampleMcp !== null) {
    if (sampleMcp.command && Array.isArray(sampleMcp.args)) {
      return 'string+array';
    }
    
    if (sampleMcp.command && sampleMcp.args && typeof sampleMcp.args === 'object') {
      return 'scalar+list';
    }
  }
  
  if (Array.isArray(sampleMcp)) {
    return 'array';
  }
  
  return 'array'; // Default fallback
}

/**
 * Detect environment variable syntax
 */
function detectEnvSyntax(mcpConfig: any): 'env' | 'environment' {
  for (const mcp of Object.values(mcpConfig)) {
    if (typeof mcp === 'object' && mcp !== null) {
      if ((mcp as any).env) {
        return 'env';
      }
      if ((mcp as any).environment) {
        return 'environment';
      }
    }
  }
  
  return 'env'; // Default
}

/**
 * Detect enable/disable key
 */
function detectEnableKey(mcpConfig: any): string | null {
  for (const mcp of Object.values(mcpConfig)) {
    if (typeof mcp === 'object' && mcp !== null) {
      if ('enabled' in mcp) {
        return 'enabled';
      }
      if ('disabled' in mcp) {
        return 'disabled';
      }
    }
  }
  
  return null;
}

/**
 * Prompt for input
 */
export function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Prompt with choices
 */
export function promptChoice(question: string, choices: string[]): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log(question);
    choices.forEach((choice, i) => {
      console.log(`  ${i + 1}. ${choice}`);
    });
    
    rl.question('Enter choice (number): ', (answer) => {
      rl.close();
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < choices.length) {
        resolve(choices[index]);
      } else {
        resolve(choices[0]); // Default to first choice
      }
    });
  });
}
