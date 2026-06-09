import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';
import { backupConfig } from './backup';
import { safeWriteConfig, ConfigWriteStrategy } from './config-handler';

const toolsRegistry = require('../../config/tools-registry.json');

export async function safeInitMCPToTool(
  toolId: string,
  mcpName: string,
  mcpData: any,
  strategy: ConfigWriteStrategy['mcp_only'] = 'safe'
): Promise<{ success: boolean; message: string }> {
  
  try {
    // Get tool config
    const toolConfig = toolsRegistry.tools[toolId];
    
    if (!toolConfig) {
      return {
        success: false,
        message: `Tool ${toolId} not found in registry`
      };
    }
    
    // Get config path
    const configPath = toolConfig.config_path.replace('~', os.homedir());
    const fullPath = path.resolve(configPath);
    
    // Check if exists
    if (!fs.existsSync(fullPath)) {
      return {
        success: false,
        message: `Config file not found: ${fullPath}`
      };
    }
    
    // Transform MCP data for tool
    const transformedMCP = transformMCPForTool(mcpData, toolConfig);
    
    // Prepare MCP object
    const newMCPs = {
      [mcpName]: transformedMCP
    };
    
    // Safe write
    const result = await safeWriteConfig(toolId, fullPath, newMCPs, strategy);
    
    return result;
    
  } catch (error: any) {
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
}

/**
 * Transform MCP data to tool-specific format
 */
function transformMCPForTool(mcpData: any, toolConfig: any): any {
  const transformed: any = {};
  
  // Command format transformation
  switch (toolConfig.command_format) {
    case 'string+array':
      transformed.command = mcpData.command;
      transformed.args = mcpData.args;
      break;
    
    case 'array':
      // Only args, no command key
      return [mcpData.command, ...mcpData.args];
    
    case 'scalar+list':
      transformed.command = mcpData.command;
      transformed.args = mcpData.args;
      break;
  }
  
  // Environment variables
  if (mcpData.env && Object.keys(mcpData.env).length > 0) {
    if (toolConfig.env_syntax === 'env') {
      transformed.env = mcpData.env;
    } else if (toolConfig.env_syntax === 'environment') {
      transformed.environment = mcpData.env;
    }
  }
  
  // Enable/disable flags
  if (toolConfig.enable_key === 'enabled') {
    transformed.enabled = mcpData.enabled !== false;
  } else if (toolConfig.enable_key === 'disabled') {
    transformed.disabled = mcpData.disabled !== true;
  }
  
  return transformed;
}
