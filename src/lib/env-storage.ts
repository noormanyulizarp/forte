import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';

export interface EnvVar {
  key: string;
  value: string;
  encrypted?: boolean;
  source?: 'forte' | 'shell' | 'system' | 'default';
}

export interface EnvStorage {
  environment: Record<string, string>;
  metadata?: {
    version: string;
    encryption?: string;
    created?: string;
    updated?: string;
  };
}

/**
 * Get Forte env storage path
 */
export function getEnvStoragePath(): string {
  return path.join(os.homedir(), '.forte', 'env.yaml');
}

/**
 * Ensure .forte directory exists with proper permissions
 */
export function ensureForteDir(): void {
  const forteDir = path.join(os.homedir(), '.forte');
  
  if (!fs.existsSync(forteDir)) {
    fs.mkdirSync(forteDir, { recursive: true });
    fs.chmodSync(forteDir, 0o700); // rwx------
  }
}

/**
 * Load environment variables from storage
 */
export function loadEnvStorage(): EnvStorage {
  const envPath = getEnvStoragePath();
  
  if (!fs.existsSync(envPath)) {
    return { environment: {} };
  }
  
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const storage = yaml.load(content) as EnvStorage;
    
    if (!storage.environment) {
      storage.environment = {};
    }
    
    return storage;
  } catch (error) {
    console.error('Error loading env storage:', error);
    return { environment: {} };
  }
}

/**
 * Save environment variables to storage
 */
export function saveEnvStorage(storage: EnvStorage): void {
  ensureForteDir();
  
  const envPath = getEnvStoragePath();
  
  // Update metadata
  if (!storage.metadata) {
    storage.metadata = {
      version: '1.0',
      encryption: 'none',
      created: new Date().toISOString()
    };
  }
  storage.metadata.updated = new Date().toISOString();
  
  const content = yaml.dump(storage);
  
  // Write with secure permissions
  fs.writeFileSync(envPath, content, { mode: 0o600 }); // rw-------
}

/**
 * Add environment variable to storage
 */
export function addEnvVar(key: string, value: string, encrypted: boolean = false): void {
  const storage = loadEnvStorage();
  storage.environment[key] = value;
  saveEnvStorage(storage);
}

/**
 * Get environment variable from storage
 */
export function getEnvVar(key: string): string | null {
  const storage = loadEnvStorage();
  return storage.environment[key] || null;
}

/**
 * Remove environment variable from storage
 */
export function removeEnvVar(key: string): void {
  const storage = loadEnvStorage();
  delete storage.environment[key];
  saveEnvStorage(storage);
}

/**
 * List all environment variables (masked)
 */
export function listEnvVars(): Record<string, string> {
  const storage = loadEnvStorage();
  
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(storage.environment)) {
    masked[key] = maskValue(value);
  }
  
  return masked;
}

/**
 * List all environment variables (raw)
 */
export function listEnvVarsRaw(): Record<string, string> {
  const storage = loadEnvStorage();
  return storage.environment;
}

/**
 * Mask sensitive value
 */
export function maskValue(value: string): string {
  if (value.length <= 8) {
    return '***REDACTED***';
  }
  
  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}

/**
 * Resolve environment variable with priority chain
 * Priority: Forte > Shell > System > Default
 */
export function resolveEnvVar(key: string, defaultValue?: string): string {
  // Priority 1: Forte env storage
  const forteValue = getEnvVar(key);
  if (forteValue) {
    return forteValue;
  }
  
  // Priority 2: Shell environment
  const shellValue = process.env[key];
  if (shellValue) {
    return shellValue;
  }
  
  // Priority 3: System environment (/etc/environment)
  // (Skipping for now - requires platform-specific implementation)
  
  // Priority 4: Default value
  if (defaultValue) {
    return defaultValue;
  }
  
  return '';
}

/**
 * Resolve all environment variables in a string
 * Replaces ${VAR_NAME} with actual values
 */
export function resolveEnvString(template: string): string {
  return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
    return resolveEnvVar(key);
  });
}

/**
 * Validate environment variable format
 */
export function validateEnvVar(key: string, value: string): { valid: boolean; error?: string } {
  if (!key || key.trim() === '') {
    return { valid: false, error: 'Key cannot be empty' };
  }
  
  if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
    return { valid: false, error: 'Key must be uppercase letters, numbers, and underscores only' };
  }
  
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Value cannot be empty' };
  }
  
  return { valid: true };
}

/**
 * Import from .env file
 */
export function importFromEnvFile(filePath: string): void {
  const resolvedPath = path.resolve(filePath);
  
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const content = fs.readFileSync(resolvedPath, 'utf-8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    // Parse KEY=VALUE or KEY='VALUE' or KEY="VALUE"
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      
      // Remove quotes if present
      let finalValue = value;
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        finalValue = value.substring(1, value.length - 1);
      }
      
      addEnvVar(key, finalValue);
    }
  }
}

/**
 * Export to .env file
 */
export function exportToEnvFile(filePath: string): void {
  const storage = loadEnvStorage();
  const lines: string[] = [];
  
  lines.push('# Forte Environment Variables');
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push('');
  
  for (const [key, value] of Object.entries(storage.environment)) {
    lines.push(`${key}=${value}`);
  }
  
  const content = lines.join('\n');
  fs.writeFileSync(filePath, content, { mode: 0o600 });
}

/**
 * Check MCP dependencies
 */
export function checkMcpEnvDependencies(mcpConfig: any): { missing: string[]; present: string[] } {
  const missing: string[] = [];
  const present: string[] = [];
  
  if (mcpConfig.env) {
    for (const key of Object.keys(mcpConfig.env)) {
      const value = resolveEnvVar(key);
      if (value) {
        present.push(key);
      } else {
        missing.push(key);
      }
    }
  }
  
  return { missing, present };
}

/**
 * Get all keys that reference environment variables
 */
export function getEnvVarReferences(mcpConfig: any): string[] {
  const references: string[] = [];
  
  function scanObject(obj: any, path: string = ''): void {
    if (typeof obj === 'string' && obj.includes('${')) {
      const matches = obj.matchAll(/\$\{([^}]+)\}/g);
      for (const match of matches) {
        references.push(match[1]);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        scanObject(value, path ? `${path}.${key}` : key);
      }
    }
  }
  
  scanObject(mcpConfig);
  return references;
}
