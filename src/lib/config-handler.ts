import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { backupConfig } from './backup';

export interface ConfigAnalysis {
  format: 'json' | 'yaml' | 'toml' | 'unknown';
  mcp_key?: string;
  mcp_section_exists: boolean;
  non_mcp_sections: string[];
  is_safe_to_modify: boolean;
  warnings: string[];
}

export interface SafeWriteResult {
  success: boolean;
  message?: string;
  backup_path?: string;
  error?: string;
}

/**
 * Analyze config file structure
 */
export function analyzeConfig(configPath: string, mcpKey: string): ConfigAnalysis {
  const analysis: ConfigAnalysis = {
    format: 'unknown',
    mcp_key: mcpKey,
    mcp_section_exists: false,
    non_mcp_sections: [],
    is_safe_to_modify: true,
    warnings: []
  };

  try {
    // Detect format
    if (configPath.endsWith('.json')) {
      analysis.format = 'json';
    } else if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
      analysis.format = 'yaml';
    } else if (configPath.endsWith('.toml')) {
      analysis.format = 'toml';
    } else {
      analysis.warnings.push('Unknown config format');
      analysis.is_safe_to_modify = false;
      return analysis;
    }

    // Check if file exists
    if (!fs.existsSync(configPath)) {
      analysis.warnings.push(`Config file not found: ${configPath}`);
      analysis.is_safe_to_modify = true; // Safe to create new
      return analysis;
    }

    // Read and parse
    const content = fs.readFileSync(configPath, 'utf-8');
    let config: any;

    try {
      if (analysis.format === 'json') {
        config = JSON.parse(content);
      } else if (analysis.format === 'yaml') {
        // Simple YAML parse (key extraction)
        const keys = content.match(/^(\w+):/gm) || [];
        config = {};
        keys.forEach(key => {
          const k = key.replace(':', '');
          config[k] = {};
        });
      }
    } catch (error: any) {
      analysis.warnings.push(`Parse error: ${error.message}`);
      analysis.is_safe_to_modify = false;
      return analysis;
    }

    // Check for MCP section
    if (config && typeof config === 'object') {
      if (mcpKey in config) {
        analysis.mcp_section_exists = true;
      }

      // Find non-MCP sections
      Object.keys(config).forEach(key => {
        if (key !== mcpKey) {
          analysis.non_mcp_sections.push(key);
        }
      });
    }

    // Safety checks
    if (analysis.format === 'yaml' && analysis.non_mcp_sections.length === 0) {
      // YAML with only MCP section is suspicious
      analysis.warnings.push('YAML config appears to be MCP-only');
    }

  } catch (error: any) {
    analysis.warnings.push(`Analysis error: ${error.message}`);
    analysis.is_safe_to_modify = false;
  }

  return analysis;
}

/**
 * Safely write config with backup
 */
export async function safeWriteConfig(
  configPath: string,
  mcpData: any,
  mcpKey: string,
  options: {
    create_backup?: boolean;
    validate_before_write?: boolean;
    atomic?: boolean;
  } = {}
): Promise<SafeWriteResult> {
  const {
    create_backup = true,
    validate_before_write = true,
    atomic = true
  } = options;

  try {
    // Analyze before writing
    const analysis = analyzeConfig(configPath, mcpKey);

    if (!analysis.is_safe_to_modify && analysis.warnings.length > 0) {
      return {
        success: false,
        error: `Config not safe to modify: ${analysis.warnings.join(', ')}`
      };
    }

    // Create backup if requested
    let backupPath: string | undefined;
    if (create_backup && fs.existsSync(configPath)) {
      try {
        await backupConfig(configPath, 'auto-init');
        backupPath = configPath + '.backup';
      } catch (error) {
        // Continue without backup if it fails
        console.warn('Backup failed, continuing anyway');
      }
    }

    // Read existing config
    let existingConfig: any = {};
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      if (analysis.format === 'json') {
        existingConfig = JSON.parse(content);
      } else if (analysis.format === 'yaml') {
        // Simple YAML merge (append MCP section)
        existingConfig = {};
      }
    }

    // Merge MCP data (preserve non-MCP sections)
    const newConfig = { ...existingConfig };
    newConfig[mcpKey] = mcpData;

    // Write new config
    let newContent: string;
    if (analysis.format === 'json') {
      newContent = JSON.stringify(newConfig, null, 2);
    } else if (analysis.format === 'yaml') {
      // Simple YAML output
      newContent = Object.entries(newConfig)
        .map(([key, val]) => `${key}:\n  ${JSON.stringify(val, null, 2).split('\n').join('\n  ')}`)
        .join('\n');
    } else {
      return {
        success: false,
        error: 'Unsupported format for write'
      };
    }

    // Atomic write
    if (atomic) {
      const tempPath = configPath + '.tmp';
      fs.writeFileSync(tempPath, newContent, 'utf-8');
      fs.renameSync(tempPath, configPath);
    } else {
      fs.writeFileSync(configPath, newContent, 'utf-8');
    }

    return {
      success: true,
      message: 'Config written successfully',
      backup_path: backupPath
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
