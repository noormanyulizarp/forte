# Proposal: Forte Profile `use` Implementation

## Problem
The `forte profile use <name>` command currently prints "Profile application coming soon" without doing anything. Users cannot activate a saved profile to apply its MCP list to the active registry.

## Proposed Changes

1. **Wire CLI to lib** — Update `src/commands/profile.ts:use` to call `applyProfile` from `src/lib/profile.ts`
2. **Profile activation** — On success, apply can optionally trigger init-all to propagate the profile’s MCP list to all tools
3. **Feedback** — Print applied count and list the MCPs that were added/synced
4. **Tests** — Unit/integration for apply success, missing profile, and partial MCP matches
