import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';

export interface RepoConfig {
  platform: 'github' | 'gitlab' | 'bitbucket';
  owner: string;
  repo: string;
  url: string;
  localPath: string;
  branch?: string;
}

export interface Profile {
  name: string;
  description: string;
  mcp_list: string[];
  created_at: string;
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

export interface MCPRegistry {
  [key: string]: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    enabled?: boolean;
    disabled?: boolean;
  };
}

function getConfigPath(): string {
  return path.join(os.homedir(), '.forte', 'forte.config.yaml');
}

function getProfileDir(): string {
  return path.join(os.homedir(), '.forte', 'profiles');
}

export function loadForteConfig(): any {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return yaml.load(content);
  } catch (error) {
    return null;
  }
}

export function saveForteConfig(config: any): void {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.chmodSync(dir, 0o700);
  }
  fs.writeFileSync(configPath, yaml.dump(config), { mode: 0o600 });
}

export function loadProfile(name: string): Profile | null {
  const profileDir = getProfileDir();
  const profilePath = path.join(profileDir, `${name}.yaml`);

  if (!fs.existsSync(profilePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(profilePath, 'utf-8');
    return yaml.load(content) as Profile;
  } catch (error) {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  const profileDir = getProfileDir();
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
    fs.chmodSync(profileDir, 0o700);
  }

  const profilePath = path.join(profileDir, `${profile.name}.yaml`);
  fs.writeFileSync(profilePath, yaml.dump(profile), { mode: 0o600 });
}

export function listProfiles(): Profile[] {
  const profileDir = getProfileDir();

  if (!fs.existsSync(profileDir)) {
    return [];
  }

  const files = fs.readdirSync(profileDir)
    .filter(f => f.endsWith('.yaml') && f !== 'README.md');

  const profiles: Profile[] = [];

  for (const file of files) {
    const profilePath = path.join(profileDir, file);
    try {
      const content = fs.readFileSync(profilePath, 'utf-8');
      const profile = yaml.load(content) as Profile;
      profiles.push(profile);
    } catch (error) {
      // Skip invalid profiles
    }
  }

  return profiles.sort((a, b) => a.name.localeCompare(b.name));
}

export function deleteProfile(name: string): boolean {
  const profilePath = path.join(getProfileDir(), `${name}.yaml`);

  if (!fs.existsSync(profilePath)) {
    return false;
  }

  fs.unlinkSync(profilePath);
  return true;
}

export function applyProfile(name: string, mcpRegistry: MCPRegistry): { success: boolean; applied: number; error?: string } {
  const profile = loadProfile(name);

  if (!profile) {
    return {
      success: false,
      applied: 0,
      error: `Profile '${name}' not found`
    };
  }

  try {
    const config = loadForteConfig() || {};

    // Initialize mcp_registry if it doesn't exist
    if (!config.mcp_registry) {
      config.mcp_registry = {};
    }

    // Apply MCPs from profile to registry
    let applied = 0;
    for (const mcpName of profile.mcp_list) {
      if (mcpRegistry[mcpName]) {
        config.mcp_registry[mcpName] = mcpRegistry[mcpName];
        applied++;
      }
    }

    // Update profile metadata
    profile.mcp_list = profile.mcp_list || [];
    
    saveForteConfig(config);

    return {
      success: true,
      applied
    };
  } catch (error: any) {
    return {
      success: false,
      applied: 0,
      error: error.message
    };
  }
}

export function createProfile(
  name: string,
  description: string,
  mcpList: string[] = []
): { success: boolean; profile?: Profile; error?: string } {
  try {
    const profile: Profile = {
      name,
      description,
      mcp_list: mcpList,
      created_at: new Date().toISOString()
    };

    saveProfile(profile);

    return {
      success: true,
      profile
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export function updateProfile(
  name: string,
  updates: Partial<Pick<Profile, 'description' | 'mcp_list'>>
): { success: boolean; profile?: Profile; error?: string } {
  const existing = loadProfile(name);

  if (!existing) {
    return {
      success: false,
      error: `Profile '${name}' not found`
    };
  }

  const updated: Profile = {
    ...existing,
    ...updates,
    name: existing.name // Name cannot be changed via update
  };

  saveProfile(updated);

  return {
    success: true,
    profile: updated
  };
}
