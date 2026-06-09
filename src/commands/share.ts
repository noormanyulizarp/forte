/**
 * forte share commands
 */

import { promises as fs } from 'fs';
import path from 'path';

export async function shareMCP(mcp: string, options: any) {
  console.log(`🔄 Sharing ${mcp} MCP...`);

  if (options.all) {
    console.log('  Target: All tools');
    await shareToAll(mcp);
  } else if (options.to) {
    const tools = options.to.split(',').map((t: string) => t.trim());
    console.log(`  Target: ${tools.join(', ')}`);
    await shareToTools(mcp, tools);
  } else {
    console.log('❌ Please specify --to <tools> or --all');
    return;
  }

  console.log('✅ MCP shared successfully!');
  console.log('💡 Run "forte sync --all" to apply changes');
}

async function shareToAll(mcp: string) {
  const registryPath = path.join(process.cwd(), 'config', 'mcp-registry.json');
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf-8'));

  // Add MCP to all tools
  for (const [toolId, toolConfig] of Object.entries(registry.tools_profiles)) {
    const tool = toolConfig as any;

    if (tool.supported && !tool.enabled_mcps.includes(mcp)) {
      tool.enabled_mcps.push(mcp);
      console.log(`  ✅ Added to ${tool.name}`);
    }
  }

  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
}

async function shareToTools(mcp: string, tools: string[]) {
  const registryPath = path.join(process.cwd(), 'config', 'mcp-registry.json');
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf-8'));

  for (const toolId of tools) {
    if (registry.tools_profiles[toolId]) {
      const tool = registry.tools_profiles[toolId];

      if (tool.supported && !tool.enabled_mcps.includes(mcp)) {
        tool.enabled_mcps.push(mcp);
        console.log(`  ✅ Added to ${tool.name}`);
      }
    } else {
      console.log(`  ⚠️  Unknown tool: ${toolId}`);
    }
  }

  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
}
