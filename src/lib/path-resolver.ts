import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

export interface ToolPathConfig {
  toolId: string
  customPath?: string
  envVar?: string
  defaultPaths: Record<string, string>
}

const DEFAULT_PATHS: Record<string, Record<string, string>> = {
  'claude-code': {
    darwin: '~/Library/Application Support/Claude/claude_desktop_config.json',
    linux: '~/.config/claude-code/claude_desktop_config.json',
    win32: '%APPDATA%\\Claude\\claude_desktop_config.json'
  },
  'cline': {
    darwin: '~/.clinerules',
    linux: '~/.clinerules',
    win32: '%USERPROFILE%\\.clinerules'
  },
  'opencode': {
    darwin: '~/Library/Application Support/OpenCode/settings.json',
    linux: '~/.opencode/settings.json',
    win32: '%APPDATA%\\OpenCode\\settings.json'
  },
  'kilocode': {
    darwin: '~/.kilocode/mcp.json',
    linux: '~/.kilocode/mcp.json',
    win32: '%USERPROFILE%\\.kilocode\\mcp.json'
  },
  'gemini-code': {
    darwin: '~/Library/Application Support/Gemini Code/config.json',
    linux: '~/.config/gemini-code/config.json',
    win32: '%APPDATA%\\Gemini Code\\config.json'
  },
  'cursor': {
    darwin: '~/Library/Application Support/Cursor/settings.json',
    linux: '~/.cursor/settings.json',
    win32: '%APPDATA%\\Cursor\\settings.json'
  },
  'windsurf': {
    darwin: '~/Library/Application Support/Windsurf/settings.json',
    linux: '~/.windsurf/settings.json',
    win32: '%APPDATA%\\Windsurf\\settings.json'
  },
  'openclaw': {
    darwin: '~/.openclaw/config.yaml',
    linux: '~/.openclaw/config.yaml',
    win32: '%USERPROFILE%\\.openclaw\\config.yaml'
  },
  'hermes': {
    darwin: '~/.hermes/config.yaml',
    linux: '~/.hermes/config.yaml',
    win32: '%USERPROFILE%\\.hermes\\config.yaml'
  },
  'picoclaw': {
    darwin: '~/.picoclaw/config.json',
    linux: '~/.picoclaw/config.json',
    win32: '%USERPROFILE%\\.picoclaw\\config.json'
  }
}

/**
 * Resolve path with ~ expansion
 */
export function resolvePath(inputPath: string): string {
  if (inputPath.startsWith('~')) {
    return inputPath.replace('~', os.homedir())
  }
  
  // Windows environment variables
  if (process.platform === 'win32' && inputPath.includes('%')) {
    return inputPath.replace(/%(\w+)%/g, (_, varName) => process.env[varName] || '')
  }
  
  return inputPath
}

/**
 * Get platform-specific default path for tool
 */
export function getDefaultPath(toolId: string): string {
  const platform = os.platform() as keyof typeof DEFAULT_PATHS[string]
  const paths = DEFAULT_PATHS[toolId]
  
  if (!paths) {
    throw new Error(`Unknown tool: ${toolId}`)
  }
  
  const platformPath = paths[platform]
  if (!platformPath) {
    throw new Error(`No default path for ${toolId} on ${platform}`)
  }
  
  return resolvePath(platformPath)
}

/**
 * Get environment variable name for tool path
 */
export function getEnvVarName(toolId: string): string {
  return `FORTE_${toolId.toUpperCase().replace(/-/g, '_')}_PATH`
}

/**
 * Get custom path from config file
 */
export function getConfigPath(toolId: string): string | null {
  try {
    const forteDir = path.join(os.homedir(), '.forte')
    const pathsFile = path.join(forteDir, 'paths.yaml')
    
    if (!fs.existsSync(pathsFile)) {
      return null
    }
    
    const content = fs.readFileSync(pathsFile, 'utf-8')
    // Parse YAML (simplified)
    const lines = content.split('\n')
    for (const line of lines) {
      const match = line.match(new RegExp(`^\\s+${toolId}:\\s*(.+)$`))
      if (match) {
        return resolvePath(match[1].trim())
      }
    }
    
    return null
  } catch (error) {
    return null
  }
}

/**
 * Resolve tool path with priority:
 * 1. Custom path (parameter)
 * 2. Environment variable
 * 3. Config file
 * 4. Default path
 */
export function resolveToolPath(
  toolId: string,
  customPath?: string
): string {
  // Priority 1: Custom path parameter
  if (customPath) {
    return resolvePath(customPath)
  }
  
  // Priority 2: Environment variable
  const envVarName = getEnvVarName(toolId)
  const envPath = process.env[envVarName]
  if (envPath) {
    return resolvePath(envPath)
  }
  
  // Priority 3: Config file
  const configPath = getConfigPath(toolId)
  if (configPath) {
    return configPath
  }
  
  // Priority 4: Default path
  return getDefaultPath(toolId)
}

/**
 * Check if path exists and is accessible
 */
export function validatePath(filePath: string): { valid: boolean; error?: string } {
  try {
    const resolved = resolvePath(filePath)
    
    if (!fs.existsSync(resolved)) {
      return { valid: false, error: 'Path does not exist' }
    }
    
    // Check read permission
    fs.accessSync(resolved, fs.constants.R_OK)
    
    return { valid: true }
  } catch (error: any) {
    if (error.code === 'EACCES') {
      return { valid: false, error: 'Permission denied' }
    }
    return { valid: false, error: error.message }
  }
}

/**
 * Get all available tools
 */
export function getAvailableTools(): string[] {
  return Object.keys(DEFAULT_PATHS)
}

/**
 * Get tool information
 */
export function getToolInfo(toolId: string): { 
  name: string
  platforms: string[]
  defaultPaths: Record<string, string>
} | null {
  const paths = DEFAULT_PATHS[toolId]
  if (!paths) {
    return null
  }
  
  return {
    name: toolId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    platforms: Object.keys(paths),
    defaultPaths: paths
  }
}
