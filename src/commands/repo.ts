import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  connectToRepo,
  pushToRepo,
  pullFromRepo,
  getRepoStatus,
  getRepoStatusSummary,
  getRepoConfig
} from '../lib/repo-sync';

export const repoCommand = new Command('repo')
  .description('Repository integration (GitHub/GitLab/Bitbucket)')
  .addCommand(
    new Command('connect <platform> <repo>')
      .description('Connect to a repository')
      .option('-t, --token <token>', 'Authentication token')
      .action(async (platform, repo, options) => {
        const result = await connectToRepo(
          platform as 'github' | 'gitlab' | 'bitbucket',
          repo
        );
        
        if (result.success) {
          console.log(`✓ ${result.message}`);
        } else {
          console.error(`✗ Failed: ${result.error}`);
          if (result.error?.includes('authentication')) {
            console.log('\n💡 Authentication required:');
            console.log('  GitHub: Create PAT with repo scope');
            console.log('  GitLab: Create Personal Access Token');
            console.log('  Bitbucket: Generate App Password');
          }
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('push')
      .description('Push config to repository')
      .option('-m, --message <message>', 'Commit message')
      .action(async (options) => {
        const result = await pushToRepo(options.message);
        
        if (result.success) {
          console.log(`✓ ${result.message}`);
        } else {
          console.error(`✗ Failed: ${result.error}`);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('pull')
      .description('Pull config from repository')
      .option('-f, --force', 'Force overwrite local config')
      .action(async (options) => {
        const result = await pullFromRepo(options.force);
        
        if (result.success) {
          console.log(`✓ ${result.message}`);
        } else {
          console.error(`✗ Failed: ${result.error}`);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Show repository status')
      .action(async () => {
        const summary = await getRepoStatusSummary();
        console.log(summary);
      })
  )
  .addCommand(
    new Command('disconnect')
      .description('Disconnect from repository')
      .action(async () => {
        const config = getRepoConfig();
        
        if (!config) {
          console.error('Error: Not connected to any repository');
          process.exit(1);
        }
        
        // Remove config
        const forteDir = path.join(os.homedir(), '.forte');
        const configPath = path.join(forteDir, 'repository.yaml');
        
        fs.unlinkSync(configPath);
        
        console.log('✓ Disconnected from repository');
      })
  );
