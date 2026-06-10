## ADDED Requirements

### Requirement: Profile Activation Command
`forte profile use <name>` MUST load the named profile, apply its MCP list to the active Forte configuration, and report which MCPs were activated.

#### Scenario: Apply existing profile
- **WHEN** user runs `forte profile use minimal`
- **THEN** system loads `~/.forte/profiles/minimal.yaml`, writes its `mcp_list` into `~/.forte/forte.config.yaml` under `mcp_registry`, and prints success with the applied list.

#### Scenario: Profile not found
- **WHEN** user runs `forte profile use unknown`
- **THEN** system prints `Error: Profile 'unknown' not found` and exits `1`.

#### Scenario: MCP registry created if missing
- **WHEN** the active config has no `mcp_registry` key
- **THEN** the apply creates the section before inserting the profile entries.

#### Scenario: Partial MCP match warning
- **WHEN** the profile lists an MCP that is not present in the known registry
- **THEN** the system skips that MCP silently but still applies the rest, reporting the applied count.
