// Core types for Forte

export interface ToolConfig {
  name: string;
  type: 'code_editor' | 'agent_framework';
  config_path: string;
  config_format: 'json' | 'yaml';
  mcp_key: string;
  supports_env: boolean;
  enable_key: string | null;
  command_format: 'string+array' | 'array' | 'scalar+list';
  env_syntax: 'env' | 'environment';
}

export interface MCPConfig {
  name: string;
  description?: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled?: boolean;
  disabled?: boolean;
}

export interface ToolMCPConfig {
  tool: string;
  mcp_key: string;
  configs: Record<string, MCPConfig>;
}

export interface DetectionResult {
  tool: string;
  found: boolean;
  config_path?: string;
  mcp_count?: number;
  error?: string;
}

export interface RepoConfig {
  platform: 'github' | 'gitlab' | 'bitbucket';
  owner: string;
  repo: string;
  branch: string;
  auth_method: 'token' | 'oauth';
  token_env?: string;
}

export interface ForteConfig {
  version: string;
  mcp_configs: Record<string, MCPConfig>;
  profiles: Record<string, string[]>;
  repository?: RepoConfig;
}

export interface Template {
  mcp_key: string;
  command_format: 'string+array' | 'array' | 'scalar+list';
  env_syntax: 'env' | 'environment';
  transform: {
    mcp: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MergeResult {
  success: boolean;
  conflicts: Array<{
    mcp: string;
    local: any;
    remote: any;
  }>;
  result: any;
}
