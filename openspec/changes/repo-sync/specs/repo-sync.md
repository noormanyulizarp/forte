## ADDED Requirements

### Requirement: Repository Connection
Forte MUST connect to a remote Git repository (GitHub/GitLab/Bitbucket) and persist the connection configuration in `~/.forte/repository.yaml` with restrictive permissions (`0600`).

#### Scenario: Connect to GitHub repo
- **WHEN** user runs `forte repo connect github user/my-configs`
- **THEN** system validates the `owner/repo` format, constructs the HTTPS clone URL, saves config to `~/.forte/repository.yaml`, and clones or initializes the local mirror at `~/.forte/repo-sync`.

#### Scenario: Connect to GitLab/Bitbucket
- **WHEN** user runs `forte repo connect gitlab group/project` or `forte repo connect bitbucket workspace/repo`
- **THEN** system uses the correct base URL (`gitlab.com` or `bitbucket.org`) and behaves identically to GitHub.

#### Scenario: Invalid repo format
- **WHEN** user runs `forte repo connect github invalid`
- **THEN** system returns failure with message `Invalid repo format. Use owner/repo`.

#### Scenario: Already connected
- **WHEN** user connects to a second repo without disconnecting
- **THEN** the new connection overwrites `~/.forte/repository.yaml` and the subsequent operations target the new remote.

#### Scenario: Repo not found / auth failure
- **WHEN** the clone URL is unreachable or invalid
- **THEN** `connectToRepo` returns `{ success: false, error: <message> }` and the CLI prints `✗ Failed: ...`.

---

### Requirement: Push Local Changes
After connecting, `forte repo push [-m message]` MUST commit any modified tracked files, push to `origin/<branch>`, and report the outcome.

#### Scenario: No local changes
- **WHEN** user runs `forte repo push` and the working tree is clean
- **THEN** command reports `No changes to commit` and exits successfully.

#### Scenario: Push success
- **WHEN** local changes exist and push succeeds
- **THEN** system stages all changes (`git add .`), commits with the provided or default message, pushes, and reports the commit hash and file count.

#### Scenario: Push auth failure
- **WHEN** the remote rejects authentication
- **THEN** system returns `{ success: false, error: 'Push failed: ...' }` and CLI exits `1`.

---

### Requirement: Pull Remote Changes
`forte repo pull [-f]` MUST update the local mirror from the remote branch.

#### Scenario: Clean pull
- **WHEN** user runs `forte repo pull` and there are no local modifications
- **THEN** system runs `git pull origin <branch>` and reports success.

#### Scenario: Local changes guard
- **WHEN** user runs `forte repo pull` and the local mirror has modifications
- **THEN** system refuses with `Local changes detected. Use --force to overwrite local changes.` and exits without pulling.

#### Scenario: Force pull
- **WHEN** user runs `forte repo pull --force`
- **THEN** system proceeds with `git pull` even when local modifications exist.

#### Scenario: Not connected
- **WHEN** user runs `forte repo pull` before connecting
- **THEN** system returns `{ success: false, error: 'Not connected to any repository' }`.

---

### Requirement: Repository Status
`forte repo status` MUST show platform, local path, branch, and sync relationship with the remote.

#### Scenario: Connected and clean
- **WHEN** local mirror matches remote
- **THEN** status reports `CLEAN` with zero ahead/behind.

#### Scenario: Local commits ahead
- **WHEN** local has commits not on remote
- **THEN** status reports `AHEAD` and shows the ahead count.

#### Scenario: Remote commits behind
- **WHEN** remote has commits not in local
- **THEN** status reports `BEHIND` and shows the behind count.

#### Scenario: Diverged
- **WHEN** both sides have unique commits
- **THEN** status reports `DIVERGED` and shows both counts.

#### Scenario: Not connected
- **WHEN** `getRepoStatus` is called with no saved config
- **THEN** it returns `null` and `getRepoStatusSummary` prints a connect hint.

---

### Requirement: Disconnect
`forte repo disconnect` MUST remove the saved repository configuration without touching the local mirror directory.

#### Scenario: Disconnect success
- **WHEN** user runs `forte repo disconnect` while a config exists
- **THEN** `~/.forte/repository.yaml` is deleted and a confirmation message is printed.

#### Scenario: Disconnect when not connected
- **WHEN** user runs `forte repo disconnect` without an existing config
- **THEN** CLI prints `Error: Not connected to any repository` and exits `1`.
