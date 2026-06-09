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
  disconnectFromRepo
} from '../lib/repo-sync';

export const repoCommand = new Command('repo')
  .description('Repository integration (GitHub/GitLab/Bitbucket)')
  .addCommand(
    new Command('connect <platform> <repo>')
      .description('Connect to a repository')
      .action(async (platform, repo) => {
        const result = await connectToRepo(
          platform as 'github' | 'gitlab' | 'bitbucket',
          repo
        );
        
        if (result.success) {
          console.log(`✓ ${result.message}`);
        } else {
          console.error(`✗ Failed: ${result.error}`);
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
          if (result.commit_hash) {
            console.log(`  Commit: ${result.commit_hash}`);
          }
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
        const result = await disconnectFromRepo();
        
        if (result.success) {
          console.log(`✓ ${result.message}`);
        } else {
          console.error(`✗ Failed: ${result.error}`);
          process.exit(1);
        }
      })
  );
