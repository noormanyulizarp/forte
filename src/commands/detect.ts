import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';

const toolsRegistry = require('../../config/tools-registry.json');

export const detectCommand = new Command('detect')
  .description('Auto-detect installed AI development tools')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    console.log('🔍 Scanning for AI development tools...\n');
    
    const results = [];
    const tools = toolsRegistry.tools;
    
    for (const [toolId, toolConfig] of Object.entries(tools)) {
      const result = await detectTool(toolId, toolConfig as any);
      results.push(result);
      
      if (options.verbose) {
        console.log(`  ${result.found ? '✓' : '✗'} ${result.tool}`);
        if (result.found) {
          console.log(`    Path: ${result.config_path}`);
          console.log(`    MCPs: ${result.mcp_count}`);
        } else if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
      } else {
        process.stdout.write(result.found ? '✓' : '✗');
      }
    }
    
    if (!options.verbose) {
      console.log('');
    }
    
    const found = results.filter(r => r.found);
    console.log(`\nTotal: ${found.length} tools detected`);
    
    if (found.length > 0) {
      console.log(`\nRun 'forte list' to see all MCP configurations`);
    }
  });

async function detectTool(
  toolId: string,
  toolConfig: any
): Promise<any> {
  try {
    const configPath = toolConfig.config_path.replace('~', os.homedir());
    const fullPath = path.resolve(configPath);
    
    if (!fs.existsSync(fullPath)) {
      return {
        tool: toolConfig.name,
        found: false,
        error: 'Config file not found'
      };
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    let config: any;
    
    if (toolConfig.config_format === 'json') {
      config = JSON.parse(content);
    } else {
      config = yaml.load(content);
    }
    
    const mcpKey = toolConfig.mcp_key;
    const mcpConfigs = getNestedValue(config, mcpKey);
    
    const mcpCount = mcpConfigs ? Object.keys(mcpConfigs).length : 0;
    
    return {
      tool: toolConfig.name,
      found: true,
      config_path: fullPath,
      mcp_count: mcpCount
    };
    
  } catch (error: any) {
    return {
      tool: toolConfig.name,
      found: false,
      error: error.message
    };
  }
}

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
