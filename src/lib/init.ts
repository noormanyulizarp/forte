import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';
import { backupConfig } from './backup';
import { resolveEnvString, checkMcpEnvDependencies } from './env-storage';

const toolsRegistry = require('../../config/tools-registry.json');

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

export async function initAll(
  mcpRegistry: Record<string, any>,
  force: boolean = false
): Promise<void> {
  const tools = toolsRegistry.tools;
  const results: any[] = [];
  
  for (const [toolId, toolConfig] of Object.entries(tools)) {
    const config = toolConfig as ToolConfigType;
    console.log(`\nProcessing ${config.name}...`);
    
    try {
      const result = await applyMCPsToTool(toolId, config, mcpRegistry, force);
      results.push({ tool: config.name, success: true });
      console.log(`  ✓ Applied ${result.applied} MCPs`);
    } catch (error: any) {
      results.push({ tool: config.name, success: false, error: error.message });
      console.log(`  ✗ Failed: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`  Success: ${success}/${results.length}`);
  console.log(`  Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

async function applyMCPsToTool(
  toolId: string,
  toolConfig: ToolConfigType,
  mcpRegistry: Record<string, any>,
  force: boolean
): Promise<{ applied: number }> {
  const configPath = toolConfig.config_path.replace('~', os.homedir());
  const fullPath = path.resolve(configPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  Config not found, skipping: ${fullPath}`);
    return { applied: 0 };
  }
  
  // Backup original config
  await backupConfig(toolId, fullPath);
  
  // Read current config
  const content = fs.readFileSync(fullPath, 'utf-8');
  let config: any;
  
  if (toolConfig.config_format === 'json') {
    config = JSON.parse(content);
  } else {
    config = yaml.load(content);
  }
  
  // Get MCP key path
  const mcpKey = toolConfig.mcp_key;
  const keys = mcpKey.split('.');
  
  // Ensure MCP object exists
  let mcpObj = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!mcpObj[keys[i]]) {
      mcpObj[keys[i]] = {};
    }
    mcpObj = mcpObj[keys[i]];
  }
  const finalKey = keys[keys.length - 1];
  
  if (!mcpObj[finalKey]) {
    mcpObj[finalKey] = {};
  }
  
  // Apply MCPs
  const mcpConfigs = mcpObj[finalKey];
  let applied = 0;
  
  for (const [mcpName, mcpData] of Object.entries(mcpRegistry)) {
    const transformed = transformMCPForTool(mcpData as any, toolConfig);
    
    if (force || !mcpConfigs[mcpName]) {
      mcpConfigs[mcpName] = transformed;
      applied++;
    }
  }
  
  // Write back
  const output = toolConfig.config_format === 'json' 
    ? JSON.stringify(config, null, 2)
    : yaml.dump(config);
  
  fs.writeFileSync(fullPath, output, 'utf-8');
  
  return { applied };
}

function transformMCPForTool(mcpData: any, toolConfig: ToolConfigType): any {
  const transformed: any = {};
  
  // Check env dependencies
  const { missing } = checkMcpEnvDependencies(mcpData);
  if (missing.length > 0) {
    console.warn(`  ⚠️  Missing env vars: ${missing.join(', ')}`);
  }
  
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
  
  // Environment variables (resolve ${VAR} references)
  if (mcpData.env && Object.keys(mcpData.env).length > 0) {
    const resolvedEnv: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(mcpData.env)) {
      // Resolve ${VAR} references
      resolvedEnv[key] = resolveEnvString(value as string);
    }
    
    if (toolConfig.env_syntax === 'env') {
      transformed.env = resolvedEnv;
    } else if (toolConfig.env_syntax === 'environment') {
      transformed.environment = resolvedEnv;
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
