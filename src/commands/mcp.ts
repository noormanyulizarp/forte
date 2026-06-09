import { Command } from 'commander';
import { addMCPToRegistry, removeMCPFromRegistry, loadMCPRegistry } from '../lib/mcp-registry';
import * as fs from 'fs';
import * as path from 'path';

export const addCommand = new Command('add')
  .description('Add MCP to registry')
  .argument('<name>', 'MCP name')
  .argument('[source]', 'MCP config source (file path or URL)')
  .option('-d, --description <desc>', 'MCP description')
  .action(async (name, source, options) => {
    console.log(`Adding MCP '${name}'...`);
    
    if (source) {
      // Load from file
      if (fs.existsSync(source)) {
        const content = fs.readFileSync(source, 'utf-8');
        const config = JSON.parse(content);
        addMCPToRegistry(name, { ...config, description: options.description });
        console.log(`✓ Added '${name}' from file`);
      } else {
        // Try as URL
        console.log(`Adding from URL: ${source}`);
        // TODO: Implement URL fetch
        console.log('URL support coming soon');
      }
    } else {
      // Interactive add
      console.log('Interactive add coming soon');
    }
  });

export const removeCommand = new Command('remove')
  .description('Remove MCP from registry')
  .argument('<name>', 'MCP name')
  .option('-f, --force', 'Remove without confirmation')
  .action(async (name, options) => {
    const registry = loadMCPRegistry();
    
    if (!(name in registry)) {
      console.error(`Error: MCP '${name}' not found in registry`);
      process.exit(1);
    }
    
    if (!options.force) {
      console.log(`Removing MCP '${name}' from registry`);
      // TODO: Add confirmation prompt
    }
    
    removeMCPFromRegistry(name);
    console.log(`✓ Removed '${name}' from registry`);
  });

export const updateCommand = new Command('update')
  .description('Update MCP to latest version')
  .argument('<name>', 'MCP name')
  .action(async (name) => {
    console.log(`Updating MCP '${name}'...`);
    // TODO: Implement update from registry
    console.log('Update functionality coming soon');
  });
