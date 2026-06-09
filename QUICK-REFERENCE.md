# Forte Quick Reference

## Essential Commands

### Detection & Listing
```bash
forte detect              # Detect installed tools
forte detect --verbose    # Show detailed info
forte list               # List all MCPs
forte list --tool <name> # Filter by tool
```

### MCP Management
```bash
forte add <mcp>          # Add MCP from registry
forte remove <mcp>       # Remove MCP
forte update <mcp>       # Update MCP
```

### Initialization
```bash
forte init all           # Apply ALL MCPs to ALL tools
forte init mcp <name>    # Apply specific MCP to all tools
forte init tool <name>   # Apply all MCPs to specific tool
forte init profile <name> # Apply from profile
```

### Validation & Backup
```bash
forte validate all       # Validate all tools
forte validate <tool>    # Validate specific tool
forte backup create      # Create backup
forte backup list        # List backups
forte backup restore <id> # Restore backup
```

### Environment & Profiles
```bash
forte env list           # List env vars
forte env add <key> <val> # Add env var
forte profile create <name> # Create profile
forte profile use <name>     # Use profile
```

### Repository
```bash
forte repo connect github <user/repo> # Connect repo
forte repo push -m "msg"   # Push config
forte repo pull           # Pull config
forte repo status         # Show status
```

## Common Workflows

### First-Time Setup
```bash
forte detect
forte add filesystem
forte add brave-search
forte init all
forte validate all
```

### Multi-Machine Sync
```bash
# Machine A
forte repo connect github user/forte-configs
forte repo push -m "Initial config"

# Machine B
forte repo connect github user/forte-configs
forte repo pull
forte init all
```

### Quick Profile Setup
```bash
forte profile create minimal
forte init profile minimal
```

## Config Files

| File | Location | Purpose |
|------|----------|---------|
| Main config | `~/.forte/forte.config.yaml` | MCP registry, profiles |
| Environment | `~/.forte/env.yaml` | API keys, secrets |
| Tool registry | `~/.forte/tools-registry.json` | Tool definitions |
| Profiles | `~/.forte/profiles/` | Profile configs |
| Backups | `~/.forte/backups/` | Config backups |

## Troubleshooting

```bash
# Tool not detected
ls ~/.config/claude-code/claude_desktop_config.json

# Config not applied
forte validate <tool>
forte backup restore <id>

# Repository issues
forte repo status
export GITHUB_TOKEN="your-token"
```

## Tips

- Always `validate` after `init`
- Use `--force` to skip confirmations
- Check `backups` before major changes
- Use `profiles` for different setups
- Commit `forte.config.yaml` to Git
- Never commit `env.yaml`
