import { Command } from 'commander';
import {
  disableMCP,
  enableMCP,
  disableMCPForTool,
  enableMCPForTool,
  isDisabled,
  getDisableStatus,
  getAllDisabled
} from '../lib/disable-control';

export const disableCommand = new Command('disable')
  .description('MCP disable control')
  .addCommand(
    new Command('<mcp-name>')
      .description('Disable MCP (globally or for specific tool)')
      .option('-t, --tool <tool-name>', 'Disable for specific tool only')
      .action(async (mcpName, options) => {
        if (options.tool) {
          // Disable for specific tool
          disableMCPForTool(mcpName, options.tool);
          console.log(`✓ Disabled ${mcpName} for ${options.tool}`);
        } else {
          // Disable globally
          disableMCP(mcpName);
          console.log(`✓ Disabled ${mcpName} globally`);
        }
      })
  );

export const enableCommand = new Command('enable')
  .description('MCP enable control')
  .addCommand(
    new Command('<mcp-name>')
      .description('Enable MCP (globally or for specific tool)')
      .option('-t, --tool <tool-name>', 'Enable for specific tool only')
      .action(async (mcpName, options) => {
        if (options.tool) {
          // Enable for specific tool
          enableMCPForTool(mcpName, options.tool);
          console.log(`✓ Enabled ${mcpName} for ${options.tool}`);
        } else {
          // Enable globally
          enableMCP(mcpName);
          console.log(`✓ Enabled ${mcpName} globally`);
        }
      })
  );

export const disableListCommand = new Command('list-disabled')
  .description('List all disabled MCPs')
  .action(async () => {
    console.log('\n📋 Disabled MCPs\n');
    
    const disabled = getAllDisabled();
    
    if (disabled.global.length === 0 && Object.keys(disabled.tool_specific).length === 0) {
      console.log('No MCPs are currently disabled');
      return;
    }
    
    if (disabled.global.length > 0) {
      console.log('Globally disabled:');
      disabled.global.forEach(mcp => {
        console.log(`  - ${mcp}`);
      });
      console.log('');
    }
    
    if (Object.keys(disabled.tool_specific).length > 0) {
      console.log('Tool-specific disabled:');
      for (const [tool, mcps] of Object.entries(disabled.tool_specific)) {
        console.log(`  ${tool}:`);
        mcps.forEach(mcp => {
          console.log(`    - ${mcp}`);
        });
      }
      console.log('');
    }
  });

export const disableStatusCommand = new Command('status')
  .description('Show disable status for MCP')
  .addCommand(
    new Command('<mcp-name>')
      .description('Show disable status for specific MCP')
      .action(async (mcpName) => {
        console.log(`\n🔍 Disable Status: ${mcpName}\n`);
        
        const status = getDisableStatus(mcpName);
        
        console.log(`Global: ${status.global ? 'DISABLED' : 'ENABLED'}`);
        
        if (Object.keys(status.tools).length > 0) {
          console.log('\nPer-tool:');
          
          const activeCount = Object.values(status.tools).filter(t => t).length;
          const totalCount = Object.keys(status.tools).length;
          
          for (const [tool, enabled] of Object.entries(status.tools)) {
            console.log(`  ${tool}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
          }
          
          console.log(`\nActive in: ${activeCount}/${totalCount} tools`);
        } else {
          console.log('\nActive in: All tools (not disabled)');
        }
      })
  );
// Note: These commands need to be added to the main CLI
