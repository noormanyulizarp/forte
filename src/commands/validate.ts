import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';

interface ToolConfigType {
  name: string;
  type: string;
  config_path: string;
  config_format: string;
  mcp_key: string;
  supports_env: boolean;
  enable_key: string | null;
  command_format: string;
  env_syntax: string;
}

const toolsRegistry = require('../../config/tools-registry.json');

export const validateCommand = new Command('validate')
  .description('Validate configuration compatibility')
  .argument('[tool]', 'Tool to validate (or "all")', 'all')
  .action(async (tool) => {
    if (tool === 'all') {
      console.log('🔍 Validating all tools...\n');
      
      const tools = toolsRegistry.tools;
      let hasErrors = false;
      
      for (const [toolId, toolConfig] of Object.entries(tools)) {
        const result = await validateTool(toolId, toolConfig as ToolConfigType);
        
        if (result.valid) {
          console.log(`✓ ${(toolConfig as any).name}`);
          if (result.warnings.length > 0) {
            result.warnings.forEach((w: string) => console.log(`  ⚠️  ${w}`));
          }
        } else {
          console.log(`✗ ${(toolConfig as any).name}`);
          result.errors.forEach((e: string) => console.log(`  ❌ ${e}`));
          hasErrors = true;
        }
      }
      
      if (hasErrors) {
        process.exit(1);
      }
    } else {
      // Validate specific tool
      const toolConfig = toolsRegistry.tools[tool];
      if (!toolConfig) {
        console.error(`Error: Tool '${tool}' not found`);
        process.exit(1);
      }
      
      const result = await validateTool(tool, toolConfig as ToolConfigType);
      
      if (result.valid) {
        console.log(`✓ ${toolConfig.name} is valid`);
        result.warnings.forEach((w: string) => console.log(`  ⚠️  ${w}`));
      } else {
        console.log(`✗ ${toolConfig.name} has errors:`);
        result.errors.forEach((e: string) => console.log(`  ❌ ${e}`));
        process.exit(1);
      }
    }
  });

async function validateTool(toolId: string, toolConfig: ToolConfigType): Promise<any> {
  const result = {
    valid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };
  
  try {
    const configPath = toolConfig.config_path.replace('~', os.homedir());
    const fullPath = path.resolve(configPath);
    
    if (!fs.existsSync(fullPath)) {
      result.valid = false;
      result.errors.push('Config file not found');
      return result;
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    let config: any;
    
    // Try parse
    try {
      if (toolConfig.config_format === 'json') {
        config = JSON.parse(content);
      } else {
        config = yaml.load(content);
      }
    } catch (parseError: any) {
      result.valid = false;
      result.errors.push(`Parse error: ${parseError.message}`);
      return result;
    }
    
    // Check MCP key exists
    const mcpKey = toolConfig.mcp_key;
    const keys = mcpKey.split('.');
    let mcpObj = config;
    
    for (const key of keys) {
      if (!mcpObj || typeof mcpObj !== 'object' || !(key in mcpObj)) {
        result.warnings.push(`MCP key '${mcpKey}' not found in config`);
        break;
      }
      mcpObj = mcpObj[key];
    }
    
    // Validate MCP configs
    if (mcpObj && typeof mcpObj === 'object') {
      for (const [mcpName, mcpConfig] of Object.entries(mcpObj)) {
        const mcpValidation = validateMCPConfig(mcpConfig as any, toolConfig);
        
        if (!mcpValidation.valid) {
          result.valid = false;
          result.errors.push(`MCP '${mcpName}': ${mcpValidation.errors.join(', ')}`);
        }
        
        result.warnings.push(...mcpValidation.warnings.map((w: string) => `MCP '${mcpName}': ${w}`));
      }
    }
    
  } catch (error: any) {
    result.valid = false;
    result.errors.push(`Validation error: ${error.message}`);
  }
  
  return result;
}

function validateMCPConfig(mcpConfig: any, toolConfig: ToolConfigType): any {
  const result = {
    valid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };
  
  // Check command
  if (!mcpConfig.command && !mcpConfig.url) {
    result.valid = false;
    result.errors.push('Missing command or url');
  }
  
  // Check args
  if (!mcpConfig.args && toolConfig.command_format === 'string+array') {
    result.warnings.push('No args specified');
  }
  
  // Check env
  if (mcpConfig.env) {
    for (const [key, value] of Object.entries(mcpConfig.env)) {
      if (typeof value !== 'string') {
        result.errors.push(`Invalid env value for ${key}`);
        result.valid = false;
      }
    }
  }
  
  return result;
}
