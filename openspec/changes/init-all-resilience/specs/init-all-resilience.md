## ADDED Requirements

### Requirement: Resilient Batch Init
`forte init all` MUST continue processing remaining tools when one tool's config file is missing. Missing configs MUST be reported as skipped and count as success, not failure.

#### Scenario: Missing config is skipped
- **WHEN** `initAll` processes a tool whose `config_path` does not exist
- **THEN** the tool is skipped with a warning, `applied: 0` is recorded, and the batch continues.

#### Scenario: Missing config does not fail the batch
- **WHEN** 5 of 7 tools are missing configs
- **THEN** the summary shows `Success: 2/7` and `Failed: 0/7`, and `process.exit` is NOT called.

#### Scenario: Existing configs still get initialized
- **WHEN** a tool config exists
- **THEN** backup is created, MCPs are applied, and the success count increments.
