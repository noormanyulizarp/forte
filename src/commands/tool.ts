import { Command } from 'commander';
import * as fs from 'fs';
import {
  addCustomTool,
  getCustomTool,
  removeCustomTool,
  listCustomTools,
  validateToolConfig,
  analyzeConfigFile,
  prompt,
  promptChoice
} from '../lib/tool-manager';

export const toolCommand = new Command('tool')
  .description('Custom tool management')
  .addCommand(
    new Command('add <tool-name>')
      .description('Add custom tool')
      .action(async (toolName) => {
        console.log(`\n🔧 Adding custom tool: ${toolName}\n`);
        
        // Prompt for configuration
        const displayName = await prompt('Display name: ');
        const type = await promptChoice('Tool type: ', ['code_editor', 'agent_framework']);
        const configPath = await prompt('Config path: ');
        const configFormat = await promptChoice('Config format: ', ['json', 'yaml']);
        const mcpKey = await prompt('MCP key (e.g., mcpServers): ');
        const commandFormat = await promptChoice('Command format: ', ['string+array', 'array', 'scalar+list']);
        const envSyntax = await promptChoice('Env syntax: ', ['env', 'environment']);
        const enableKey = await prompt('Enable key (enabled/disabled/null): ');
        
        const tool = {
          name: displayName,
          type: type as 'code_editor' | 'agent_framework',
          config_path: configPath,
          config_format: configFormat as 'json' | 'yaml',
          mcp_key: mcpKey,
          supports_env: true,
          enable_key: enableKey === 'null' ? null : enableKey,
          command_format: commandFormat as 'string+array' | 'array' | 'scalar+list',
          env_syntax: envSyntax as 'env' | 'environment'
        };
        
        // Validate
        const validation = validateToolConfig(tool);
        if (!validation.valid) {
          console.error('\n❌ Validation errors:');
          validation.errors.forEach(err => console.log(`  - ${err}`));
          process.exit(1);
        }
        
        // Add tool
        addCustomTool(toolName, tool);
        
        console.log(`\n✓ Added ${toolName}`);
        console.log(`  Display name: ${displayName}`);
        console.log(`  Config path: ${configPath}`);
        console.log(`  MCP key: ${mcpKey}`);
        console.log(`\nYou can now use 'forte detect --tool ${toolName}'`);
      })
  )
  .addCommand(
    new Command('import <tool-name> <config-path>')
      .description('Import tool from config file')
      .action(async (toolName, configPath) => {
        console.log(`\n📥 Importing tool: ${toolName}\n`);
        console.log(`Config path: ${configPath}\n`);
        
        // Analyze config file
        const analysis = analyzeConfigFile(configPath);
        
        if (!analysis) {
          console.error('❌ Failed to analyze config file');
          process.exit(1);
        }
        
        console.log('Analysis results:');
        console.log(`  Format: ${analysis.format}`);
        if (analysis.mcp_key) console.log(`  MCP key: ${analysis.mcp_key}`);
        if (analysis.command_format) console.log(`  Command format: ${analysis.command_format}`);
        if (analysis.env_syntax) console.log(`  Env syntax: ${analysis.env_syntax}`);
        if (analysis.enable_key !== undefined) console.log(`  Enable key: ${analysis.enable_key}`);
        
        const confirm = await prompt('\nConfirm import? (y/n): ');
        if (confirm.toLowerCase() !== 'y') {
          console.log('Import cancelled');
          return;
        }
        
        // Create tool from analysis
        const tool = {
          name: toolName.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          type: 'code_editor' as const,
          config_path: configPath,
          config_format: analysis.format as 'json' | 'yaml',
          mcp_key: analysis.mcp_key || 'mcp',
          supports_env: true,
          enable_key: analysis.enable_key || null,
          command_format: analysis.command_format || 'array',
          env_syntax: analysis.env_syntax || 'env'
        };
        
        addCustomTool(toolName, tool);
        
        console.log(`\n✓ Imported ${toolName}`);
        console.log(`  Format: ${analysis.format}`);
        console.log(`  MCP key: ${analysis.mcp_key}`);
        console.log(`\nYou can now use 'forte detect --tool ${toolName}'`);
      })
  )
  .addCommand(
    new Command('create <tool-name>')
      .description('Interactive tool builder')
      .action(async (toolName) => {
        console.log(`\n🔨 Tool Builder: ${toolName}\n`);
        
        // Step 1: Basic Info
        console.log('Step 1: Basic Info');
        const displayName = await prompt('Display name: ');
        const type = await promptChoice('Type: ', ['code_editor', 'agent_framework']);
        
        // Step 2: Configuration
        console.log('\nStep 2: Configuration');
        const configPath = await prompt('Config path: ');
        
        // Analyze config file
        console.log('\nAnalyzing config file...');
        const analysis = analyzeConfigFile(configPath);
        
        let configFormat = 'json' as 'json' | 'yaml';
        let mcpKey = 'mcp';
        let commandFormat = 'array' as 'string+array' | 'array' | 'scalar+list';
        let envSyntax = 'env' as 'env' | 'environment';
        let enableKey: string | null = null;
        
        if (analysis) {
          console.log('✓ Config file analyzed');
          console.log(`  Format: ${analysis.format}`);
          if (analysis.mcp_key) console.log(`  MCP key: ${analysis.mcp_key}`);
          
          configFormat = analysis.format;
          if (analysis.mcp_key) mcpKey = analysis.mcp_key;
          if (analysis.command_format) commandFormat = analysis.command_format;
          if (analysis.env_syntax) envSyntax = analysis.env_syntax;
          if (analysis.enable_key !== undefined) enableKey = analysis.enable_key;
          
          const confirm = await prompt('\nUse detected values? (y/n): ');
          if (confirm.toLowerCase() !== 'y') {
            // Prompt for manual values
            configFormat = await promptChoice('Config format: ', ['json', 'yaml']) as 'json' | 'yaml';
            mcpKey = await prompt('MCP key: ');
            commandFormat = await promptChoice('Command format: ', ['string+array', 'array', 'scalar+list']) as 'string+array' | 'array' | 'scalar+list';
            envSyntax = await promptChoice('Env syntax: ', ['env', 'environment']) as 'env' | 'environment';
            const enableKeyInput = await prompt('Enable key (enabled/disabled/null): ');
            enableKey = enableKeyInput === 'null' ? null : enableKeyInput;
          }
        } else {
          console.log('⚠️  Could not analyze config file');
          configFormat = await promptChoice('Config format: ', ['json', 'yaml']) as 'json' | 'yaml';
          mcpKey = await prompt('MCP key: ');
          commandFormat = await promptChoice('Command format: ', ['string+array', 'array', 'scalar+list']) as 'string+array' | 'array' | 'scalar+list';
          envSyntax = await promptChoice('Env syntax: ', ['env', 'environment']) as 'env' | 'environment';
          const enableKeyInput = await prompt('Enable key (enabled/disabled/null): ');
          enableKey = enableKeyInput === 'null' ? null : enableKeyInput;
        }
        
        // Step 3: Advanced
        console.log('\nStep 3: Advanced');
        const supportsEnv = await prompt('Supports environment variables? (y/n): ');
        const finalEnableKey = enableKey || null;
        
        // Step 4: Test
        console.log('\nStep 4: Testing');
        const tool = {
          name: displayName,
          type: type as 'code_editor' | 'agent_framework',
          config_path: configPath,
          config_format: configFormat,
          mcp_key: mcpKey,
          supports_env: supportsEnv.toLowerCase() === 'y',
          enable_key: finalEnableKey,
          command_format: commandFormat,
          env_syntax: envSyntax
        };
        
        const validation = validateToolConfig(tool);
        if (!validation.valid) {
          console.error('\n❌ Validation errors:');
          validation.errors.forEach(err => console.log(`  - ${err}`));
          
          const fix = await prompt('\nFix errors and retry? (y/n): ');
          if (fix.toLowerCase() === 'y') {
            console.log('\nPlease fix the errors and try again');
            process.exit(1);
          }
        }
        
        // Add tool
        addCustomTool(toolName, tool);
        
        console.log(`\n✓ Tool created successfully: ${toolName}`);
        console.log(`  Display name: ${displayName}`);
        console.log(`  Config path: ${configPath}`);
        console.log(`  MCP key: ${mcpKey}`);
        console.log(`  Command format: ${commandFormat}`);
        console.log(`\nYou can now use 'forte detect --tool ${toolName}'`);
      })
  )
  .addCommand(
    new Command('list')
      .description('List all custom tools')
      .action(async () => {
        console.log('\n📋 Custom Tools\n');
        
        const tools = listCustomTools();
        
        if (Object.keys(tools).length === 0) {
          console.log('No custom tools configured');
          return;
        }
        
        let index = 1;
        for (const [toolId, tool] of Object.entries(tools)) {
          console.log(`${index}. ${tool.name}`);
          console.log(`   ID: ${toolId}`);
          console.log(`   Path: ${tool.config_path}`);
          console.log(`   Format: ${tool.config_format.toUpperCase()}`);
          console.log(`   MCP Key: ${tool.mcp_key}`);
          console.log(`   Command Format: ${tool.command_format}`);
          console.log(`   Type: ${tool.type}`);
          console.log(`   Priority: ${tool.priority}`);
          console.log('');
          index++;
        }
      })
  )
  .addCommand(
    new Command('remove <tool-name>')
      .description('Remove custom tool')
      .action(async (toolName) => {
        const tool = getCustomTool(toolName);
        
        if (!tool) {
          console.error(`Error: Tool '${toolName}' not found`);
          process.exit(1);
        }
        
        console.log(`Removing tool: ${tool.name} (${toolName})`);
        
        const confirm = await prompt('Confirm removal? (y/n): ');
        if (confirm.toLowerCase() !== 'y') {
          console.log('Removal cancelled');
          return;
        }
        
        removeCustomTool(toolName);
        
        console.log(`✓ Removed ${toolName}`);
      })
  )
  .addCommand(
    new Command('validate <tool-name>')
      .description('Validate custom tool')
      .action(async (toolName) => {
        console.log(`\n🔍 Validating: ${toolName}\n`);
        
        const tool = getCustomTool(toolName);
        
        if (!tool) {
          console.error(`Error: Tool '${toolName}' not found`);
          process.exit(1);
        }
        
        console.log(`Display name: ${tool.name}`);
        console.log(`Config path: ${tool.config_path}`);
        
        const validation = validateToolConfig(tool);
        
        if (!validation.valid) {
          console.error('\n❌ Validation errors:');
          validation.errors.forEach(err => console.log(`  - ${err}`));
          process.exit(1);
        }
        
        console.log('\n✓ Config file exists');
        console.log('✓ Format is valid');
        console.log(`✓ MCP key: ${tool.mcp_key}`);
        console.log(`✓ Command format: ${tool.command_format}`);
        console.log(`✓ Env syntax: ${tool.env_syntax}`);
        
        console.log('\n✓ Tool is valid and ready to use');
      })
  )
  .addCommand(
    new Command('update <tool-name>')
      .description('Update tool configuration')
      .action(async (toolName) => {
        console.log(`\n🔧 Updating tool: ${toolName}\n`);
        
        const tool = getCustomTool(toolName);
        
        if (!tool) {
          console.error(`Error: Tool '${toolName}' not found`);
          process.exit(1);
        }
        
        console.log('Current configuration:');
        console.log(`  Display name: ${tool.name}`);
        console.log(`  Path: ${tool.config_path}`);
        console.log(`  MCP key: ${tool.mcp_key}`);
        
        console.log('\nWhat to update?');
        console.log('  1. Path');
        console.log('  2. MCP key');
        console.log('  3. Command format');
        console.log('  4. Env syntax');
        
        const choice = await prompt('Enter choice (1-4): ');
        
        switch (choice) {
          case '1':
            const newPath = await prompt('New path: ');
            tool.config_path = newPath;
            break;
          case '2':
            const newMcpKey = await prompt('New MCP key: ');
            tool.mcp_key = newMcpKey;
            break;
          case '3':
            const newFormat = await promptChoice('New command format: ', ['string+array', 'array', 'scalar+list']);
            tool.command_format = newFormat as 'string+array' | 'array' | 'scalar+list';
            break;
          case '4':
            const newEnvSyntax = await promptChoice('New env syntax: ', ['env', 'environment']);
            tool.env_syntax = newEnvSyntax as 'env' | 'environment';
            break;
          default:
            console.log('Invalid choice');
            process.exit(1);
        }
        
        // Validate
        const validation = validateToolConfig(tool);
        if (!validation.valid) {
          console.error('\n❌ Validation errors:');
          validation.errors.forEach(err => console.log(`  - ${err}`));
          process.exit(1);
        }
        
        // Save updated tool
        const { addCustomTool } = require('../lib/tool-manager');
        addCustomTool(toolName, tool);
        
        console.log('\n✓ Tool updated successfully');
      })
  );
