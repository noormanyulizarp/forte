import { Command } from 'commander';
import {
  checkAllDeps,
  checkNpmPackage,
  installAllMissing,
  installPackage,
  formatDepCheck
} from '../lib/deps-check';

export const depsCommand = new Command('deps')
  .description('Dependency management for MCPs')
  .addCommand(
    new Command('check')
      .description('Check all MCP dependencies')
      .option('-m, --mcp <mcp-name>', 'Check specific MCP')
      .action(async (options) => {
        console.log('\n📦 Checking MCP dependencies...\n');
        
        if (options.mcp) {
          // Check specific MCP
          const pkg = await checkNpmPackage(options.mcp);
          
          if (pkg.installed) {
            console.log(`✓ ${options.mcp}: ${pkg.name}@${pkg.version || 'latest'} (${pkg.location})`);
          } else {
            console.log(`✗ ${options.mcp}: NOT installed`);
            console.log(`  Install: npm install -g ${options.mcp}`);
          }
        } else {
          // Check all MCPs
          const deps = await checkAllDeps();
          console.log(formatDepCheck(deps));
        }
      })
  )
  .addCommand(
    new Command('install')
      .description('Install all missing MCP dependencies')
      .option('-p, --package <package>', 'Install specific package')
      .action(async (options) => {
        if (options.package) {
          // Install specific package
          console.log(`\n📦 Installing ${options.package}...\n`);
          
          const result = await installPackage(options.package);
          
          if (result.success) {
            console.log(`✓ Installed ${options.package}`);
          } else {
            console.error(`✗ Failed: ${result.error}`);
            process.exit(1);
          }
        } else {
          // Install all missing
          console.log('\n📦 Installing all missing MCP dependencies...\n');
          
          const result = await installAllMissing();
          
          console.log('\n' + '='.repeat(50));
          console.log('Summary:');
          console.log(`  Success: ${result.success}`);
          console.log(`  Failed: ${result.failed}`);
          
          if (result.errors.length > 0) {
            console.log('\nErrors:');
            result.errors.forEach(err => console.log(`  - ${err}`));
          }
          
          if (result.failed === 0) {
            console.log('\n✓ All dependencies installed!');
          } else {
            console.log('\n⚠️  Some packages failed to install');
            console.log('You may need to install them manually:');
            result.errors.forEach(err => {
              const match = err.match(/([^:]+):/);
              if (match) {
                console.log(`  npm install -g ${match[1]}`);
              }
            });
          }
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List all MCPs with their dependencies')
      .action(async () => {
        const deps = await checkAllDeps();
        
        console.log('\n📋 MCP Dependencies\n');
        
        for (const [mcp, dep] of Object.entries(deps)) {
          console.log(`\n${mcp}:`);
          console.log(`  Packages: ${dep.packages.join(', ')}`);
          console.log(`  Installed: ${dep.installed ? '✓' : '✗'}`);
          
          if (dep.missing_packages.length > 0) {
            console.log(`  Missing: ${dep.missing_packages.join(', ')}`);
          }
          
          if (dep.env_vars && dep.env_vars.length > 0) {
            console.log(`  Env vars: ${dep.env_vars.join(', ')}`);
          }
        }
      })
  );
