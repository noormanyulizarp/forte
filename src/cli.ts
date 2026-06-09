#!/usr/bin/env node

import { Command } from 'commander';
import { detectCommand } from './commands/detect';
import { listCommand } from './commands/list';
import { initCommand } from './commands/init';
import { repoCommand } from './commands/repo';
import { addCommand, removeCommand, updateCommand } from './commands/mcp';
import { backupCommand } from './commands/backup';
import { envCommand } from './commands/env';
import { profileCommand } from './commands/profile';
import { validateCommand } from './commands/validate';
import { toolCommand } from './commands/tool';
import { depsCommand } from './commands/deps';
import { disableCommand, enableCommand, disableListCommand, disableStatusCommand } from './commands/disable';

const program = new Command();

program
  .name('forte')
  .description('Unified MCP Manager - Share MCPs across Claude Code, OpenCode, KiloCode, OpenClaw, Hermes')
  .version('1.0.0');

// Detect installed tools
program.addCommand(detectCommand);

// List MCP configurations
program.addCommand(listCommand);

// Initialize MCP configs
program.addCommand(initCommand);

// Repository management
program.addCommand(repoCommand);

// MCP management
program.addCommand(addCommand);
program.addCommand(removeCommand);
program.addCommand(updateCommand);

// Backup commands
program.addCommand(backupCommand);

// Environment management
program.addCommand(envCommand);

// Profile management
program.addCommand(profileCommand);

// Tool management
program.addCommand(toolCommand);

// Dependency management
program.addCommand(depsCommand);

// Disable management
program.addCommand(disableCommand);
program.addCommand(enableCommand);
program.addCommand(disableListCommand);
program.addCommand(disableStatusCommand);

// Validation
program.addCommand(validateCommand);

program.parse();
