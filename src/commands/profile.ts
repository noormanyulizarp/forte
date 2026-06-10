import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';
import { applyProfile } from '../lib/profile';
import { loadMCPRegistry } from '../lib/mcp-registry';

export const profileCommand = new Command('profile')
  .description('Profile management')
  .addCommand(
    new Command('create <name>')
      .description('Create a new profile')
      .option('-d, --description <desc>', 'Profile description')
      .action(async (name, options) => {
        const forteDir = path.join(os.homedir(), '.forte');
        const profileDir = path.join(forteDir, 'profiles');
        
        if (!fs.existsSync(profileDir)) {
          fs.mkdirSync(profileDir, { recursive: true });
        }
        
        const profilePath = path.join(profileDir, `${name}.yaml`);
        
        const profile = {
          name: name,
          description: options.description || `Profile: ${name}`,
          mcp_list: [],
          created_at: new Date().toISOString()
        };
        
        fs.writeFileSync(profilePath, yaml.dump(profile));
        console.log(`✓ Created profile '${name}'`);
      })
  )
  .addCommand(
    new Command('list')
      .description('List all profiles')
      .action(async () => {
        const profileDir = path.join(os.homedir(), '.forte', 'profiles');
        
        if (!fs.existsSync(profileDir)) {
          console.log('No profiles found');
          return;
        }
        
        const profiles = fs.readdirSync(profileDir)
          .filter(f => f.endsWith('.yaml'))
          .sort();
        
        console.log('\n📋 Profiles:\n');
        profiles.forEach((profileFile, i) => {
          const profilePath = path.join(profileDir, profileFile);
          const content = fs.readFileSync(profilePath, 'utf-8');
          const profile = yaml.load(content) as any;
          
          console.log(`  ${i + 1}. ${profile.name}`);
          console.log(`     Description: ${profile.description}`);
          console.log(`     MCPs: ${profile.mcp_list?.length || 0}\n`);
        });
      })
  )
  .addCommand(
    new Command('use <name>')
      .description('Use a profile')
      .action(async (name) => {
        const mcpRegistry = loadMCPRegistry();
        const result = applyProfile(name, mcpRegistry);

        if (!result.success) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }

        console.log(`✓ Applied profile '${name}'`);
        console.log(`  MCPs activated: ${result.applied}`);
      })
  )
  .addCommand(
    new Command('delete <name>')
      .description('Delete a profile')
      .action(async (name) => {
        const profilePath = path.join(os.homedir(), '.forte', 'profiles', `${name}.yaml`);
        
        if (!fs.existsSync(profilePath)) {
          console.error(`Error: Profile '${name}' not found`);
          process.exit(1);
        }
        
        fs.unlinkSync(profilePath);
        console.log(`✓ Deleted profile '${name}'`);
      })
  );
