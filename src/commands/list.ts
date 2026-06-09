import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';

const toolsRegistry = require('../../config/tools-registry.json');

export const listCommand = new Command('list')
  .description('List all MCP configurations')
  .option('-t, --tool <tool-name>', 'Filter by tool')
  .option('-d, --detailed', 'Show detailed information')
  .action(async (options) => {
    const results = await listMCPs(options);
    
    if (results.length === 0) {
      console.log('No MCP configurations found.');
      console.log('Run "forte detect" to scan for tools.');
      return;
    }
    
    console.log('\n📋 MCP Configurations\n');
    
    results.forEach(result => {
      console.log(`\n${result.tool}:`);
      console.log(`  Config: ${result.config_path}`);
      console.log(`  MCPs (${result.mcp_list.length}):`);
      
      result.mcp_list.forEach((mcp: any) => {
        if (options.detailed) {
          console.log(`    - ${mcp.name}`);
          console.log(`      Command: ${mcp.command}`);
          console.log(`      Args: ${mcp.args.join(' ')}`);
          if (Object.keys(mcp.env || {}).length > 0) {
            console.log(`      Env: ${Object.keys(mcp.env).join(', ')}`);
          }
        } else {
          console.log(`    - ${mcp.name}`);
        }
      });
    });
    
    console.log(`\nTotal: ${results.length} tool(s), ${results.reduce((sum, r) => sum + r.mcp_list.length, 0)} MCP(s)`);
  });

async function listMCPs(options: any): Promise<any[]> {
  const results = [];
  const tools = toolsRegistry.tools;
  
  for (const [toolId, toolConfig] of Object.entries(tools)) {
    if (options.tool && toolId !== options.tool) {
      continue;
    }
    
    const result = await getToolMCPs(toolId, toolConfig as any);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
}

async function getToolMCPs(toolId: string, toolConfig: any): Promise<any> {
  try {
    const configPath = toolConfig.config_path.replace('~', os.homedir());
    const fullPath = path.resolve(configPath);
    
    if (!fs.existsSync(fullPath)) {
      return null;
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
    
    if (!mcpConfigs) {
      return {
        tool: toolConfig.name,
        config_path: fullPath,
        mcp_list: []
      };
    }
    
    const mcpList = Object.entries(mcpConfigs).map(([name, mcpConfig]: [string, any]) => {
      return {
        name,
        command: mcpConfig.command || mcpConfig.url,
        args: mcpConfig.args || [],
        env: mcpConfig.env || mcpConfig.environment || {}
      };
    });
    
    return {
      tool: toolConfig.name,
      config_path: fullPath,
      mcp_list: mcpList
    };
    
  } catch (error: any) {
    return null;
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
