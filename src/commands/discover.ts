/**
 * forte discover commands
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export async function discoverMCPs() {
  console.log('🔍 Discovering MCP servers...');
  console.log('');

  const discovered: any = {};

  // Check NPM packages
  await discoverNPM(discovered);

  // Check running processes
  await discoverProcesses(discovered);

  // Check ports
  await discoverPorts(discovered);

  // Check Docker
  await discoverDocker(discovered);

  // Update registry
  await updateRegistry(discovered);

  console.log('✅ Discovery completed!');
}

async function discoverNPM(discovered: any) {
  console.log('📦 Checking NPM packages...');

  try {
    // Check agentmemory
    try {
      execSync('which agentmemory-mcp', { stdio: 'ignore' });
      discovered['agentmemory'] = {
        command: 'npx',
        args: ['-y', '@agentmemory/mcp'],
        description: 'Long-term memory for AI agents',
        homepage: 'http://localhost:3113',
        enabled: true
      };
      console.log('  ✅ agentmemory-mcp');
    } catch (e) {
      // Not installed
    }

    // Check github
    try {
      execSync('npx @modelcontextprotocol/server-github --help', {
        stdio: 'ignore',
        timeout: 3000
      });
      discovered['github'] = {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        description: 'GitHub integration',
        enabled: true
      };
      console.log('  ✅ mcp-server-github');
    } catch (e) {
      // Not installed
    }

    // Check filesystem
    try {
      execSync('npx @modelcontextprotocol/server-filesystem --help', {
        stdio: 'ignore',
        timeout: 3000
      });
      discovered['filesystem'] = {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        description: 'File system access',
        enabled: false
      };
      console.log('  ✅ mcp-server-filesystem');
    } catch (e) {
      // Not installed
    }
  } catch (error) {
    console.log('  ⚠️  NPM discovery failed');
  }
}

async function discoverProcesses(discovered: any) {
  console.log('⚙️  Checking running processes...');

  try {
    const psOutput = execSync('ps aux | grep -iE "(mcp|agentmemory)" | grep -v grep', {
      encoding: 'utf-8'
    });

    const lines = psOutput.split('\n').filter(l => l.trim());

    for (const line of lines) {
      if (line.includes('agentmemory')) {
        console.log('  ✅ agentmemory-mcp (running)');
      }
      if (line.includes('github') && line.includes('mcp')) {
        console.log('  ✅ mcp-server-github (running)');
      }
    }
  } catch (error) {
    console.log('  ℹ️  No running MCP processes');
  }
}

async function discoverPorts(discovered: any) {
  console.log('🌐 Checking open ports...');

  const portToMCP: Record<number, string> = {
    3111: 'agentmemory',
    3112: 'iii',
    3113: 'agentmemory-web'
  };

  try {
    for (const [port, mcp] of Object.entries(portToMCP)) {
      const result = execSync(`netstat -tulnp | grep ${port}`, {
        encoding: 'utf-8'
      });

      if (result) {
        console.log(`  ✅ ${mcp} (port ${port})`);
      }
    }
  } catch (error) {
    console.log('  ℹ️  No MCP ports detected');
  }
}

async function discoverDocker(discovered: any) {
  console.log('🐳 Checking Docker containers...');

  try {
    const dockerOutput = execSync('docker ps --format "{{.Names}}" | grep -i mcp', {
      encoding: 'utf-8'
    });

    const containers = dockerOutput.split('\n').filter(c => c.trim());

    for (const container of containers) {
      console.log(`  ✅ ${container} (Docker)`);
    }
  } catch (error) {
    console.log('  ℹ️  No Docker MCP containers');
  }
}

async function updateRegistry(discovered: any) {
  console.log('');
  console.log('📝 Updating MCP registry...');

  const registryPath = path.join(process.cwd(), 'config', 'mcp-registry.json');
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf-8'));

  let added = 0;

  for (const [mcpId, mcpConfig] of Object.entries(discovered)) {
    if (!registry.mcp_servers[mcpId]) {
      registry.mcp_servers[mcpId] = mcpConfig;
      added++;
    }
  }

  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

  if (added > 0) {
    console.log(`  ✅ Added ${added} new MCPs`);
  } else {
    console.log('  ℹ️  No new MCPs discovered');
  }
}
