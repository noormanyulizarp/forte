import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';

export interface DisableConfig {
  global_disabled: string[];
  tool_specific: Record<string, string[]>;
  metadata?: {
    version: string;
    last_updated: string;
  };
}

/**
 * Get disable config path
 */
export function getDisableConfigPath(): string {
  return path.join(os.homedir(), '.forte', 'disabled-mcps.yaml');
}

/**
 * Ensure .forte directory exists
 */
export function ensureDisableDir(): void {
  const forteDir = path.join(os.homedir(), '.forte');
  
  if (!fs.existsSync(forteDir)) {
    fs.mkdirSync(forteDir, { recursive: true });
    fs.chmodSync(forteDir, 0o700);
  }
}

/**
 * Load disable config
 */
export function loadDisableConfig(): DisableConfig {
  const configPath = getDisableConfigPath();
  
  if (!fs.existsSync(configPath)) {
    return {
      global_disabled: [],
      tool_specific: {}
    };
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return yaml.load(content) as DisableConfig;
  } catch (error) {
    return {
      global_disabled: [],
      tool_specific: {}
    };
  }
}

/**
 * Save disable config
 */
export function saveDisableConfig(config: DisableConfig): void {
  ensureDisableDir();
  
  const configPath = getDisableConfigPath();
  
  // Update metadata
  if (!config.metadata) {
    config.metadata = {
      version: '1.0',
      last_updated: new Date().toISOString()
    };
  }
  config.metadata.last_updated = new Date().toISOString();
  
  const content = yaml.dump(config);
  fs.writeFileSync(configPath, content, { mode: 0o600 });
}

/**
 * Disable MCP globally
 */
export function disableMCP(mcpName: string): void {
  const config = loadDisableConfig();
  
  if (!config.global_disabled.includes(mcpName)) {
    config.global_disabled.push(mcpName);
  }
  
  saveDisableConfig(config);
}

/**
 * Enable MCP globally
 */
export function enableMCP(mcpName: string): void {
  const config = loadDisableConfig();
  
  config.global_disabled = config.global_disabled.filter(name => name !== mcpName);
  
  saveDisableConfig(config);
}

/**
 * Disable MCP for specific tool
 */
export function disableMCPForTool(mcpName: string, toolName: string): void {
  const config = loadDisableConfig();
  
  if (!config.tool_specific[toolName]) {
    config.tool_specific[toolName] = [];
  }
  
  if (!config.tool_specific[toolName].includes(mcpName)) {
    config.tool_specific[toolName].push(mcpName);
  }
  
  saveDisableConfig(config);
}

/**
 * Enable MCP for specific tool
 */
export function enableMCPForTool(mcpName: string, toolName: string): void {
  const config = loadDisableConfig();
  
  if (config.tool_specific[toolName]) {
    config.tool_specific[toolName] = config.tool_specific[toolName].filter(name => name !== mcpName);
    
    // Remove empty tool entry
    if (config.tool_specific[toolName].length === 0) {
      delete config.tool_specific[toolName];
    }
  }
  
  saveDisableConfig(config);
}

/**
 * Check if MCP is disabled (global or tool-specific)
 */
export function isDisabled(mcpName: string, toolName?: string): boolean {
  const config = loadDisableConfig();
  
  // Check global disabled
  if (config.global_disabled.includes(mcpName)) {
    return true;
  }
  
  // Check tool-specific disabled
  if (toolName && config.tool_specific[toolName]) {
    return config.tool_specific[toolName].includes(mcpName);
  }
  
  return false;
}

/**
 * Get disabled status for MCP
 */
export function getDisableStatus(mcpName: string): {
  global: boolean;
  tools: Record<string, boolean>;
} {
  const config = loadDisableConfig();
  
  const globalDisabled = config.global_disabled.includes(mcpName);
  
  const tools: Record<string, boolean> = {};
  
  // Check all tools that might have this MCP disabled
  const allTools = ['claude-code', 'cline', 'opencode', 'kilocode', 'gemini-code', 'cursor', 'windsurf', 'openclaw', 'hermes', 'picoclaw'];
  
  for (const tool of allTools) {
    if (config.tool_specific[tool]) {
      tools[tool] = config.tool_specific[tool].includes(mcpName);
    } else {
      tools[tool] = !globalDisabled; // Inherit global status
    }
  }
  
  return {
    global: globalDisabled,
    tools
  };
}

/**
 * Get all disabled MCPs
 */
export function getAllDisabled(): {
  global: string[];
  tool_specific: Record<string, string[]>;
} {
  const config = loadDisableConfig();
  
  return {
    global: config.global_disabled,
    tool_specific: config.tool_specific
  };
}
