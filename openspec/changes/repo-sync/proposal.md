# Proposal: Implement Repository Sync Feature

## Problem
Repository sync (`forte repo`) commands currently return "Repository sync not yet implemented". Users cannot connect Forte to a GitHub/GitLab/Bitbucket repo, push/pull configs, or check sync status. The `repo.ts` CLI command file exists but calls stub functions in `lib/repo-sync.ts`.

## Proposed Changes

1. **Implement `lib/repo-sync.ts`** with real YAML config persistence in `~/.forte/repository.yaml` and git-backed push/pull via `simple-git`
2. **Implement `commands/repo.ts`** to call working lib functions instead of returning errors
3. **Add `connect`, `push`, `pull`, `status`, `disconnect` behavior** matching existing CLI contracts
4. **Add tests** for config read/write and command flows
