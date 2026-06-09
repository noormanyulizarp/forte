import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface NpmPackage {
  name: string;
  installed: boolean;
  version?: string;
  location?: 'global' | 'local';
}

export interface MCPDependency {
  mcp: string;
  packages: string[];
  env_vars?: string[];
  installed: boolean;
  missing_packages: string[];
  missing_env_vars: string[];
}

/**
 * Check if npm package is installed globally
 */
export async function checkNpmPackage(packageName: string): Promise<NpmPackage> {
  try {
    const result = await execAsync(`npm list -g ${packageName} 2>/dev/null || echo "not_installed"`);
    
    if (result.stdout.includes('not_installed') || result.stdout.includes('ENOENT')) {
      return { name: packageName, installed: false };
    }
    
    // Try to parse version
    const match = result.stdout.match(new RegExp(`${packageName.replace('/', '@\\d+x')}@([\\d.]+)`));
    if (match) {
      return {
        name: packageName,
        installed: true,
        version: match[1],
        location: 'global'
      };
    }
    
    // Package might be installed but version unclear
    if (result.stdout.includes(packageName)) {
      return {
        name: packageName,
        installed: true,
        version: 'unknown',
        location: 'global'
      };
    }
    
    return { name: packageName, installed: false };
  } catch (error) {
    return { name: packageName, installed: false };
  }
}

/**
 * Install npm package globally
 */
export async function installPackage(packageName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await execAsync(`npm install -g ${packageName}`);
    
    if (result.stderr && result.stderr.includes('ERR!')) {
      return {
        success: false,
        error: result.stderr
      };
    }
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get MCP registry with dependencies
 */
export async function getMCPDependencies(): Promise<Record<string, MCPDependency>> {
  // MCP to npm packages mapping
  const mcpPackages: Record<string, { packages: string[]; env_vars?: string[] }> = {
    'filesystem': {
      packages: ['@modelcontextprotocol/server-filesystem'],
      env_vars: []
    },
    'brave-search': {
      packages: ['@modelcontextprotocol/server-brave-search'],
      env_vars: ['BRAVE_API_KEY']
    },
    'fetch': {
      packages: ['@modelcontextprotocol/server-fetch'],
      env_vars: []
    },
    'memory': {
      packages: ['@modelcontextprotocol/server-memory'],
      env_vars: []
    },
    'github': {
      packages: ['@modelcontextprotocol/server-github'],
      env_vars: ['GITHUB_TOKEN']
    },
    'postgres': {
      packages: ['@modelcontextprotocol/server-postgres'],
      env_vars: ['POSTGRES_URL', 'DATABASE_URL']
    },
    'sqlite': {
      packages: ['@modelcontextprotocol/server-sqlite'],
      env_vars: []
    },
    'puppeteer': {
      packages: ['@modelcontextprotocol/server-puppeteer'],
      env_vars: []
    },
    'slack': {
      packages: ['@modelcontextprotocol/server-slack'],
      env_vars: ['SLACK_API_TOKEN', 'SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET', 'SLACK_SIGNING_SECRET']
    },
    'sequential-thinking': {
      packages: ['@modelcontextprotocol/server-sequential-thinking'],
      env_vars: []
    }
  };
  
  const result: Record<string, MCPDependency> = {};
  
  for (const [mcp, deps] of Object.entries(mcpPackages)) {
    const pkgChecks = await Promise.all(
      deps.packages.map(pkg => checkNpmPackage(pkg))
    );
    
    const missingPackages = pkgChecks.filter(p => !p.installed).map(p => p.name);
    const installed = pkgChecks.some(p => p.installed);
    
    result[mcp] = {
      mcp,
      packages: deps.packages,
      env_vars: deps.env_vars,
      installed,
      missing_packages: missingPackages,
      missing_env_vars: deps.env_vars || [] // Will be checked separately
    };
  }
  
  return result;
}

/**
 * Check all MCP dependencies
 */
export async function checkAllDeps(): Promise<Record<string, MCPDependency>> {
  return await getMCPDependencies();
}

/**
 * Install all missing dependencies
 */
export async function installAllMissing(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const deps = await getMCPDependencies();
  const errors: string[] = [];
  let success = 0;
  let failed = 0;
  
  for (const [mcp, dep] of Object.entries(deps)) {
    for (const pkg of dep.missing_packages) {
      console.log(`Installing ${pkg}...`);
      const result = await installPackage(pkg);
      
      if (result.success) {
        success++;
        console.log(`  ✓ Installed ${pkg}`);
      } else {
        failed++;
        errors.push(`${pkg}: ${result.error}`);
        console.log(`  ✗ Failed: ${result.error}`);
      }
    }
  }
  
  return { success, failed, errors };
}

/**
 * Format dependency check output
 */
export function formatDepCheck(deps: Record<string, MCPDependency>): string {
  let output = '\n📦 MCP Dependencies\n\n';
  
  for (const [mcp, dep] of Object.entries(deps)) {
    output += `${mcp}:\n`;
    
    if (dep.installed) {
      output += `  ✓ All packages installed\n`;
      for (const pkg of dep.packages) {
        const pkgCheck = deps[mcp].packages.find((p: string) => p === pkg);
        output += `    - ${pkg}: installed\n`;
      }
    } else {
      output += `  ✗ Missing packages:\n`;
      for (const pkg of dep.missing_packages) {
        output += `    - ${pkg}\n`;
      }
      output += `  Install: npm install -g ${dep.missing_packages.join(' ')}\n`;
    }
    
    if (dep.env_vars && dep.env_vars.length > 0) {
      output += `  Environment variables required:\n`;
      for (const env of dep.env_vars) {
        output += `    - ${env}\n`;
      }
    }
    
    output += '\n';
  }
  
  const totalMCPs = Object.keys(deps).length;
  const installed = Object.values(deps).filter(d => d.installed).length;
  const missing = totalMCPs - installed;
  
  output += `\nSummary: ${installed}/${totalMCPs} MCPs have all dependencies\n`;
  
  if (missing > 0) {
    output += `Missing: ${missing} MCP(s)\n`;
    output += `Run 'forte deps install' to install all missing packages\n`;
  }
  
  return output;
}
