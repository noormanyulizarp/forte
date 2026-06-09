import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import {
  addEnvVar,
  getEnvVar,
  removeEnvVar,
  listEnvVars,
  listEnvVarsRaw,
  resolveEnvVar,
  validateEnvVar,
  importFromEnvFile,
  exportToEnvFile,
  checkMcpEnvDependencies,
  getEnvVarReferences
} from '../lib/env-storage';

export const envCommand = new Command('env')
  .description('Environment variable management')
  .addCommand(
    new Command('list')
      .description('List all environment variables')
      .option('--raw', 'Show actual values (dangerous)')
      .action(async (options) => {
        console.log('\n🔐 Environment Variables\n');
        
        if (options.raw) {
          const vars = listEnvVarsRaw();
          
          if (Object.keys(vars).length === 0) {
            console.log('No environment variables configured');
            return;
          }
          
          console.log('⚠️  WARNING: Showing raw values!\n');
          
          for (const [key, value] of Object.entries(vars)) {
            console.log(`${key}=${value}`);
          }
        } else {
          const vars = listEnvVars();
          
          if (Object.keys(vars).length === 0) {
            console.log('No environment variables configured');
            return;
          }
          
          for (const [key, value] of Object.entries(vars)) {
            console.log(`${key}=${value}`);
          }
        }
      })
  )
  .addCommand(
    new Command('add <key> [value]')
      .description('Add environment variable')
      .option('--from-env', 'Read value from shell environment')
      .option('-f, --force', 'Add without validation')
      .action(async (key, value, options) => {
        let finalValue = value;
        
        // Read from shell ENV if requested
        if (options.fromEnv) {
          finalValue = process.env[key];
          if (!finalValue) {
            console.error(`Error: ${key} not found in shell environment`);
            process.exit(1);
          }
        }
        
        // Prompt for value if not provided
        if (!finalValue) {
          finalValue = await promptHidden(`Enter value for ${key} (hidden): `);
        }
        
        // Validate
        if (!options.force) {
          const validation = validateEnvVar(key, finalValue);
          if (!validation.valid) {
            console.error(`Error: ${validation.error}`);
            process.exit(1);
          }
        }
        
        // Add to storage
        addEnvVar(key, finalValue);
        console.log(`✓ Added ${key}`);
      })
  )
  .addCommand(
    new Command('remove <key>')
      .description('Remove environment variable')
      .action(async (key) => {
        const existing = getEnvVar(key);
        if (!existing) {
          console.error(`Error: ${key} not found`);
          process.exit(1);
        }
        
        removeEnvVar(key);
        console.log(`✓ Removed ${key}`);
      })
  )
  .addCommand(
    new Command('import <file>')
      .description('Import from .env file')
      .action(async (file) => {
        try {
          importFromEnvFile(file);
          console.log(`✓ Imported from ${file}`);
        } catch (error: any) {
          console.error(`Error: ${error.message}`);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('export <file>')
      .description('Export to .env file')
      .action(async (file) => {
        try {
          exportToEnvFile(file);
          console.log(`✓ Exported to ${file}`);
        } catch (error: any) {
          console.error(`Error: ${error.message}`);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('resolve <key>')
      .description('Show resolved value for environment variable')
      .action(async (key) => {
        const value = resolveEnvVar(key);
        
        if (!value) {
          console.log(`${key} is not set`);
          return;
        }
        
        console.log(`${key}=${value}`);
        
        // Show source
        const forteValue = getEnvVar(key);
        const shellValue = process.env[key];
        
        console.log('\nResolution chain:');
        if (forteValue) {
          console.log('  ✓ Forte env storage (highest priority)');
        } else if (shellValue) {
          console.log('  ✓ Shell environment variable');
        } else {
          console.log('  ⚠️  Source: Unknown');
        }
      })
  )
  .addCommand(
    new Command('check <mcp-name>')
      .description('Check MCP environment variable dependencies')
      .action(async (mcpName) => {
        // Load MCP config
        const forteDir = `${process.env.HOME}/.forte`;
        const mcpRegistryPath = `${forteDir}/mcp-registry.json`;
        
        if (!fs.existsSync(mcpRegistryPath)) {
          console.error('Error: MCP registry not found');
          process.exit(1);
        }
        
        const mcpRegistry = JSON.parse(fs.readFileSync(mcpRegistryPath, 'utf-8'));
        const mcpConfig = mcpRegistry[mcpName];
        
        if (!mcpConfig) {
          console.error(`Error: MCP '${mcpName}' not found in registry`);
          process.exit(1);
        }
        
        console.log(`\n🔍 Checking MCP: ${mcpName}\n`);
        
        const { missing, present } = checkMcpEnvDependencies(mcpConfig);
        
        if (present.length > 0) {
          console.log('✓ Present environment variables:');
          present.forEach(key => {
            const value = resolveEnvVar(key);
            console.log(`  ${key}=${value.substring(0, 10)}...`);
          });
        }
        
        if (missing.length > 0) {
          console.log('\n✗ Missing environment variables:');
          missing.forEach(key => {
            console.log(`  ${key}`);
          });
          console.log('\nAdd them with:');
          missing.forEach(key => {
            console.log(`  forte env add ${key} <value>`);
          });
        } else {
          console.log('\n✓ All dependencies satisfied!');
        }
      })
  )
  .addCommand(
    new Command('validate')
      .description('Validate all environment variables')
      .action(async () => {
        const vars = listEnvVarsRaw();
        
        console.log('\n🔍 Validating environment variables...\n');
        
        let hasErrors = false;
        
        for (const [key, value] of Object.entries(vars)) {
          const validation = validateEnvVar(key, value);
          
          if (validation.valid) {
            console.log(`✓ ${key}`);
          } else {
            console.log(`✗ ${key}: ${validation.error}`);
            hasErrors = true;
          }
        }
        
        if (!hasErrors) {
          console.log('\n✓ All variables are valid');
        } else {
          console.log('\n✗ Some variables have errors');
          process.exit(1);
        }
      })
  );

/**
 * Prompt for hidden input (password/token)
 */
function promptHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
