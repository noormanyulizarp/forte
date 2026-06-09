import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';
import { resolveToolPath, validatePath, getToolInfo } from '../lib/path-resolver';

const toolsRegistry = require('../../config/tools-registry.json');

export const detectCommand = new Command('detect')
  .description('Auto-detect installed AI development tools')
  .option('-v, --verbose', 'Show detailed information')
  .option('--tool <tool-name>', 'Detect specific tool only')
  // Dynamic path options for each tool
  .option('--claude-code-path <path>', 'Custom path for Claude Code')
  .option('--cline-path <path>', 'Custom path for Cline')
  .option('--opencode-path <path>', 'Custom path for OpenCode')
  .option('--kilocode-path <path>', 'Custom path for KiloCode')
  .option('--gemini-code-path <path>', 'Custom path for Gemini Code')
  .option('--cursor-path <path>', 'Custom path for Cursor')
  .option('--windsurf-path <path>', 'Custom path for Windsurf')
  .option('--openclaw-path <path>', 'Custom path for OpenClaw')
  .option('--hermes-path <path>', 'Custom path for Hermes')
  .option('--picoclaw-path <path>', 'Custom path for PicoClaw')
  .action(async (options) => {
    console.log('🔍 Scanning for AI development tools...\n');
    
    const results = [];
    const tools = toolsRegistry.tools;
    
    // Filter by tool if specified
    const toolsToDetect = options.tool 
      ? { [options.tool]: tools[options.tool] } 
      : tools;
    
    for (const [toolId, toolConfig] of Object.entries(toolsToDetect)) {
      const result = await detectTool(toolId, toolConfig as any, options);
      results.push(result);
      
      if (options.verbose) {
        console.log(`  ${result.found ? '✓' : '✗'} ${result.tool}`);
        if (result.found) {
          console.log(`    Path: ${result.config_path}`);
          console.log(`    Source: ${result.config_source || 'default'}`);
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
  toolConfig: any,
  options: any
): Promise<any> {
  // Resolve path with priority: custom > ENV > config > default
  const pathOption = `${toolId.replace(/-/g, '-')}-path` as keyof typeof options
  const customPath = options[pathOption] as string | undefined
  
  const configPath = resolveToolPath(toolId, customPath)
  const fullPath = path.resolve(configPath)
  
  try {
    
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
      config_source: customPath ? 'custom' : 'default',
      mcp_count: mcpCount
    };
    
  } catch (error: any) {
    return {
      tool: toolConfig.name,
      found: false,
      config_path: fullPath,
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
