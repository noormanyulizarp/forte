/**
 * forte sync commands
 */

import { promises as fs } from 'fs';
import path from 'path';

export async function syncAll() {
  const registryPath = path.join(process.cwd(), 'config', 'mcp-registry.json');
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf-8'));

  for (const [toolId, toolConfig] of Object.entries(registry.tools_profiles)) {
    const tool = toolConfig as any;

    if (tool.supported) {
      console.log(`  📝 ${tool.name}...`);
      await syncTool(toolId);
    }
  }
}

export async function syncTool(toolId: string) {
  const registryPath = path.join(process.cwd(), 'config', 'mcp-registry.json');
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf-8'));
  const tool = registry.tools_profiles[toolId] as any;

  if (!tool || !tool.supported) {
    console.log(`  ⚠️  Tool ${toolId} not supported`);
    return;
  }

  // Backup current config
  await backupConfig(tool.config_path);

  // Get MCP configs for this tool
  const mcpConfigs = await getMCPConfigs(tool.enabled_mcps, registry.mcp_servers);

  if (tool.config_type === 'json') {
    await syncJsonConfig(tool.config_path, mcpConfigs);
    console.log(`  ✅ ${tool.name} synced (${tool.enabled_mcps.length} MCPs)`);
  } else if (tool.config_type === 'yaml') {
    await syncYamlConfig(tool.config_path, mcpConfigs);
    console.log(`  ✅ ${tool.name} synced (${tool.enabled_mcps.length} MCPs)`);
  }
}

async function backupConfig(configPath: string) {
  const backupDir = path.join(process.cwd(), 'backups');
  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `${path.basename(configPath)}.${timestamp}.bak`);

  try {
    const expandedPath = configPath.replace('~', process.env.HOME || '');
    await fs.copyFile(expandedPath, backupPath);
    console.log(`  💾 Backup: ${backupPath}`);
  } catch (error) {
    console.log(`  ⚠️  Backup failed (config may not exist yet)`);
  }
}

async function getMCPConfigs(mcpIds: string[], mcpRegistry: any): Promise<any> {
  const configs: any = {};

  for (const mcpId of mcpIds) {
    const mcp = mcpRegistry[mcpId];

    if (mcp && mcp.enabled) {
      configs[mcpId] = {
        command: mcp.command,
        args: mcp.args,
        env: mcp.env || {}
      };
    }
  }

  return configs;
}

async function syncJsonConfig(configPath: string, mcpConfigs: any) {
  const expandedPath = configPath.replace('~', process.env.HOME || '');

  let config: any = {};

  try {
    const content = await fs.readFile(expandedPath, 'utf-8');
    config = JSON.parse(content);
  } catch (error) {
    config = { mcpServers: {} };
  }

  // Merge MCP configs
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  for (const [mcpId, mcpConfig] of Object.entries(mcpConfigs)) {
    config.mcpServers[mcpId] = mcpConfig;
  }

  await fs.writeFile(expandedPath, JSON.stringify(config, null, 2));
}

async function syncYamlConfig(configPath: string, mcpConfigs: any) {
  // For YAML configs (OpenClaw, Hermes)
  // We'll need to use a YAML library or do string manipulation
  console.log(`  📝 YAML sync for ${configPath}`);

  const expandedPath = configPath.replace('~', process.env.HOME || '');

  try {
    let content = await fs.readFile(expandedPath, 'utf-8');

    // Check if mcp section exists
    if (!content.includes('mcp:')) {
      content += '\nmcp:\n  servers:\n';
    }

    // Add each MCP
    for (const [mcpId, mcpConfig] of Object.entries(mcpConfigs)) {
      const config = mcpConfig as any;

      // Check if MCP already exists
      if (!content.includes(`- ${mcpId}`)) {
        const mcpEntry = `    - name: ${mcpId}
      command: ${config.command}
      args: ${JSON.stringify(config.args)}`;

        content = content.replace('mcp:\n  servers:', `mcp:\n  servers:${mcpEntry}`);
      }
    }

    await fs.writeFile(expandedPath, content);
  } catch (error) {
    console.log(`  ⚠️  YAML sync error: ${error}`);
  }
}
