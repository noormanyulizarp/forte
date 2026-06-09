import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';

export function loadMCPRegistry(): Record<string, any> {
  try {
    // Check for local registry
    const localRegistry = path.join(os.homedir(), '.forte', 'mcp-registry.json');
    if (fs.existsSync(localRegistry)) {
      const content = fs.readFileSync(localRegistry, 'utf-8');
      return JSON.parse(content);
    }
    
    // Check for project registry
    const projectRegistry = path.join(__dirname, '../../config/forte.config.yaml');
    if (fs.existsSync(projectRegistry)) {
      const content = fs.readFileSync(projectRegistry, 'utf-8');
      const config = yaml.load(content) as any;
      return config.mcp_registry || {};
    }
    
    return {};
    
  } catch (error) {
    console.error('Error loading MCP registry:', error);
    return {};
  }
}

export function saveMCPRegistry(registry: Record<string, any>): void {
  const forteDir = path.join(os.homedir(), '.forte');
  if (!fs.existsSync(forteDir)) {
    fs.mkdirSync(forteDir, { recursive: true });
  }
  
  const registryPath = path.join(forteDir, 'mcp-registry.json');
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
}

export function addMCPToRegistry(name: string, config: any): void {
  const registry = loadMCPRegistry();
  registry[name] = {
    name: name,
    description: config.description || '',
    command: config.command,
    args: config.args || [],
    env: config.env || {},
    official: false
  };
  saveMCPRegistry(registry);
}

export function removeMCPFromRegistry(name: string): void {
  const registry = loadMCPRegistry();
  delete registry[name];
  saveMCPRegistry(registry);
}
