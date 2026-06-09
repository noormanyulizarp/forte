import { Command } from 'commander';
import { initAll } from '../lib/init';
import { loadMCPRegistry } from '../lib/mcp-registry';

export const initCommand = new Command('init')
  .description('Initialize MCP configurations')
  .addCommand(
    new Command('all')
      .description('Apply ALL MCPs to ALL tools')
      .option('-f, --force', 'Apply without confirmation')
      .action(async (options) => {
        console.log('🚀 Initializing ALL MCPs to ALL tools...\n');
        
        const registry = loadMCPRegistry();
        await initAll(registry, options.force);
      })
  )
  .addCommand(
    new Command('mcp <mcp-name>')
      .description('Apply specific MCP to all tools')
      .option('-f, --force', 'Apply without confirmation')
      .action(async (mcpName, options) => {
        console.log(`🚀 Initializing MCP '${mcpName}' to all tools...\n`);
        
        const registry = loadMCPRegistry();
        if (!(mcpName in registry)) {
          console.error(`Error: MCP '${mcpName}' not found in registry`);
          console.log('Run "forte list" to see available MCPs');
          process.exit(1);
        }
        
        await initAll({ [mcpName]: registry[mcpName] }, options.force);
      })
  )
  .addCommand(
    new Command('tool <tool-name>')
      .description('Apply all MCPs to specific tool')
      .option('-f, --force', 'Apply without confirmation')
      .action(async (toolName, options) => {
        console.log(`🚀 Initializing all MCPs to tool '${toolName}'...\n`);
        // TODO: Implement tool-specific init
        console.log('Tool-specific init coming soon');
      })
  )
  .addCommand(
    new Command('profile <profile-name>')
      .description('Apply MCPs from a profile')
      .option('-f, --force', 'Apply without confirmation')
      .action(async (profileName, options) => {
        console.log(`🚀 Initializing profile '${profileName}'...\n`);
        // TODO: Implement profile-based init
        console.log('Profile-based init coming soon');
      })
  );
