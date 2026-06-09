import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';
import simpleGit, { SimpleGit } from 'simple-git';

export interface RepoConfig {
  platform: 'github' | 'gitlab' | 'bitbucket';
  owner: string;
  repo: string;
  url: string;
  localPath: string;
  branch?: string;
}

export interface RepoStatus {
  platform: string;
  connected: boolean;
  status: 'not_connected' | 'clean' | 'ahead' | 'behind' | 'diverged';
  localPath: string;
  currentBranch?: string;
  ahead?: number;
  behind?: number;
  error?: string;
}

export interface CommitResult {
  success: boolean;
  commit_hash?: string;
  message?: string;
  error?: string;
}

export interface RepoManifest {
  configs: string[];
  env: string[];
  tools: string[];
}

function getConfigPath(): string {
  return path.join(os.homedir(), '.forte', 'repository.yaml');
}

function ensureFortedir(): void {
  const dir = path.join(os.homedir(), '.forte');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.chmodSync(dir, 0o700);
  }
}

export function loadRepoConfig(): RepoConfig | null {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return yaml.load(content) as RepoConfig;
  } catch (error) {
    return null;
  }
}

export function saveRepoConfig(config: RepoConfig): void {
  ensureFortedir();
  const configPath = getConfigPath();
  const content = yaml.dump(config);
  fs.writeFileSync(configPath, content, { mode: 0o600 });
}

export async function connectToRepo(
  platform: 'github' | 'gitlab' | 'bitbucket',
  ownerRepo: string
): Promise<CommitResult> {
  try {
    const [owner, repo] = ownerRepo.split('/');
    if (!owner || !repo) {
      return {
        success: false,
        error: 'Invalid repo format. Use owner/repo (e.g., user/my-configs)'
      };
    }

    let baseUrl: string;
    switch (platform) {
      case 'github':
        baseUrl = 'https://github.com';
        break;
      case 'gitlab':
        baseUrl = 'https://gitlab.com';
        break;
      case 'bitbucket':
        baseUrl = 'https://bitbucket.org';
        break;
      default:
        return {
          success: false,
          error: `Unsupported platform: ${platform}`
        };
    }

    const url = `${baseUrl}/${owner}/${repo}.git`;
    const config: RepoConfig = {
      platform,
      owner,
      repo,
      url,
      localPath: path.join(os.homedir(), '.forte', 'repo-sync'),
      branch: 'main'
    };

    saveRepoConfig(config);

    // Clone or init repo
    const localPath = config.localPath;
    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
      const git = simpleGit(localPath);
      await git.clone(url, localPath, ['--branch', config.branch || 'main']);
    } else {
      const git = simpleGit(localPath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        await git.init();
        await git.addRemote('origin', url);
      }
    }

    return {
      success: true,
      message: `Connected to ${platform}/${owner}/${repo} at ${localPath}`
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to connect: ${error.message}`
    };
  }
}

export async function pushToRepo(message?: string): Promise<CommitResult> {
  const config = loadRepoConfig();
  if (!config) {
    return {
      success: false,
      error: 'Not connected to any repository. Run `forte repo connect <platform> <owner/repo>` first.'
    };
  }

  try {
    const git = simpleGit(config.localPath);
    const status = await git.status();
    
    if (status.files.length === 0) {
      return {
        success: true,
        message: 'No changes to commit'
      };
    }

    await git.add('.');
    const commitMessage = message || `chore: update forte configs`;
    const commitHash = await git.commit(commitMessage);
    await git.push('origin', config.branch || 'main');

    return {
      success: true,
      commit_hash: commitHash,
      message: `Pushed ${status.files.length} files to ${config.platform}/${config.owner}/${config.repo}`
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Push failed: ${error.message}`
    };
  }
}

export async function pullFromRepo(force: boolean = false): Promise<CommitResult> {
  const config = loadRepoConfig();
  if (!config) {
    return {
      success: false,
      error: 'Not connected to any repository'
    };
  }

  try {
    const git = simpleGit(config.localPath);
    
    if (!force) {
      const status = await git.status();
      if (status.files.length > 0) {
        return {
          success: false,
          error: 'Local changes detected. Use --force to overwrite local changes.'
        };
      }
    }

    await git.pull('origin', config.branch || 'main');

    return {
      success: true,
      message: `Pulled latest from ${config.platform}/${config.owner}/${config.repo}`
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Pull failed: ${error.message}`
    };
  }
}

export async function getRepoStatus(): Promise<RepoStatus | null> {
  const config = loadRepoConfig();
  if (!config) {
    return null;
  }

  try {
    const git = simpleGit(config.localPath);
    const isRepo = await git.checkIsRepo();

    if (!isRepo) {
      return {
        platform: config.platform,
        connected: true,
        status: 'not_connected',
        localPath: config.localPath,
        error: 'Local path is not a valid git repository'
      };
    }

    const status = await git.status();
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    const aheadBehind = await git.fetch(['origin']);
    
    // Get ahead/behind counts
    let ahead = 0;
    let behind = 0;
    try {
      const aheadBehindResult = await git.exec(['rev-list', '--left-right', '--count', `origin/${config.branch}...HEAD`]);
      const parts = aheadBehindResult.stdout.trim().split('\t');
      behind = parseInt(parts[0]) || 0;
      ahead = parseInt(parts[1]) || 0;
    } catch {
      // Ignore if remote branch doesn't exist yet
    }

    let repoStatus: RepoStatus['status'] = 'clean';
    if (ahead > 0 && behind > 0) repoStatus = 'diverged';
    else if (ahead > 0) repoStatus = 'ahead';
    else if (behind > 0) repoStatus = 'behind';

    return {
      platform: config.platform,
      connected: true,
      status: repoStatus,
      localPath: config.localPath,
      currentBranch: branch,
      ahead,
      behind
    };
  } catch (error: any) {
    return {
      platform: config.platform,
      connected: true,
      status: 'not_connected',
      localPath: config.localPath,
      error: error.message
    };
  }
}

export async function getRepoStatusSummary(): Promise<string> {
  const status = await getRepoStatus();
  
  if (!status) {
    return 'Not connected to any repository.\nUse `forte repo connect <platform> <owner/repo>` to connect.';
  }

  let summary = `\nRepository Status\n`;
  summary += `${'='.repeat(50)}\n`;
  summary += `Platform: ${status.platform}\n`;
  summary += `Local: ${status.localPath}\n`;
  summary += `Status: ${status.status.toUpperCase()}\n`;
  
  if (status.currentBranch) {
    summary += `Branch: ${status.currentBranch}\n`;
  }
  
  if (status.ahead !== undefined && status.behind !== undefined) {
    summary += `Ahead: ${status.ahead}\n`;
    summary += `Behind: ${status.behind}\n`;
  }

  if (status.error) {
    summary += `\nError: ${status.error}\n`;
  }

  return summary;
}

export async function disconnectFromRepo(): Promise<CommitResult> {
  const config = loadRepoConfig();
  if (!config) {
    return {
      success: false,
      error: 'Not connected to any repository'
    };
  }

  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }

    return {
      success: true,
      message: `Disconnected from ${config.platform}/${config.owner}/${config.repo}`
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Disconnect failed: ${error.message}`
    };
  }
}

export function getRepoManifest(localPath?: string): RepoManifest | null {
  const config = loadRepoConfig();
  if (!config) {
    return null;
  }

  const targetPath = localPath || config.localPath;
  const manifestPath = path.join(targetPath, 'forte-manifest.yaml');

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return yaml.load(content) as RepoManifest;
  } catch (error) {
    return null;
  }
}

export function createRepoManifest(manifest: RepoManifest, localPath?: string): void {
  const config = loadRepoConfig();
  if (!config) {
    throw new Error('Not connected to any repository');
  }

  const targetPath = localPath || config.localPath;
  const manifestPath = path.join(targetPath, 'forte-manifest.yaml');
  const content = yaml.dump(manifest);
  fs.writeFileSync(manifestPath, content, { mode: 0o600 });
}

export function updateRepoManifestFile(filename: string, localPath?: string): void {
  const config = loadRepoConfig();
  if (!config) {
    throw new Error('Not connected to any repository');
  }

  const targetPath = localPath || config.localPath;
  const manifestPath = path.join(targetPath, 'forte-manifest.yaml');
  
  let manifest: RepoManifest = {
    configs: [],
    env: [],
    tools: []
  };

  if (fs.existsSync(manifestPath)) {
    try {
      const content = fs.readFileSync(manifestPath, 'utf-8');
      manifest = yaml.load(content) as RepoManifest;
    } catch (error) {
      manifest = {
        configs: [],
        env: [],
        tools: []
      };
    }
  }

  // Add file to appropriate category
  if (filename.includes('config') || filename.includes('registry')) {
    if (!manifest.configs.includes(filename)) {
      manifest.configs.push(filename);
    }
  } else if (filename.includes('env')) {
    if (!manifest.env.includes(filename)) {
      manifest.env.push(filename);
    }
  } else if (filename.includes('tools')) {
    if (!manifest.tools.includes(filename)) {
      manifest.tools.push(filename);
    }
  }

  const content = yaml.dump(manifest);
  fs.writeFileSync(manifestPath, content, { mode: 0o600 });
}
