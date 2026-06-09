# Repository API Research
# GitHub, GitLab, and Bitbucket Integration

## GitHub API

### Authentication
```bash
# Personal Access Token (PAT)
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# OAuth Apps
Client ID + Client Secret
```

### Key Endpoints

#### 1. Repository Info
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/<owner>/<repo>
```

#### 2. Get File Contents
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/<owner>/<repo>/contents/.forte/config.json
```

Response:
```json
{
  "name": "config.json",
  "path": ".forte/config.json",
  "sha": "abc123...",
  "content": "base64encodedcontent",
  "size": 1234
}
```

#### 3. Update/Create File
```bash
curl -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  https://api.github.com/repos/<owner>/<repo>/contents/.forte/config.json \
  -d '{
    "message": "Update Forte config",
    "content": "<base64content>",
    "sha": "abc123..."
  }'
```

#### 4. Get Branch Info
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/<owner>/<repo>/git/refs/heads/main
```

#### 5. Create Pull Request
```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  https://api.github.com/repos/<owner>/<repo>/pulls \
  -d '{
    "title": "Update MCP config",
    "body": "Automated update via Forte",
    "head": "feature/update-mcp",
    "base": "main"
  }'
```

### Rate Limits
- Unauthenticated: 60 requests/hour
- Authenticated: 5000 requests/hour
- Check rate limit: `curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit`

### Webhooks
```json
{
  "config": {
    "url": "https://your-server.com/webhook",
    "content_type": "json"
  },
  "events": ["push"],
  "active": true
}
```

---

## GitLab API

### Authentication
```bash
# Personal Access Token
export GITLAB_TOKEN="glpat-xxxxxxxxxxxxx"

# OAuth2
```

### Key Endpoints

#### 1. Repository Info
```bash
curl -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  https://gitlab.com/api/v4/projects/<owner>%2F<repo>
```

#### 2. Get File Contents
```bash
curl -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/<project_id>/repository/files/.forte%2Fconfig.json/raw?ref=main"
```

#### 3. Update/Create File
```bash
curl -X PUT \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  -H "Content-Type: application/json" \
  "https://gitlab.com/api/v4/projects/<project_id>/repository/files/.forte%2Fconfig.json" \
  -d '{
    "branch": "main",
    "content": "<rawcontent>",
    "commit_message": "Update Forte config"
  }'
```

#### 4. Get Branch Info
```bash
curl -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/<project_id>/repository/branches/main"
```

#### 5. Create Merge Request
```bash
curl -X POST \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  -H "Content-Type: application/json" \
  "https://gitlab.com/api/v4/projects/<project_id>/merge_requests" \
  -d '{
    "title": "Update MCP config",
    "description": "Automated update via Forte",
    "source_branch": "feature/update-mcp",
    "target_branch": "main"
  }'
```

### Rate Limits
- authenticated users: 2000 requests per minute
- Check headers: `RateLimit-Limit`, `RateLimit-Remaining`

### Webhooks
```json
{
  "url": "https://your-server.com/webhook",
  "push_events": true,
  "issues_events": false,
  "merge_requests_events": false
}
```

---

## Bitbucket API

### Authentication
```bash
# Basic Auth with App Password
export BITBUCKET_USERNAME="your_username"
export BITBUCKET_APP_PASSWORD="your_app_password"

# OAuth2
```

### Key Endpoints

#### 1. Repository Info
```bash
curl -u $BITBUCKET_USERNAME:$BITBUCKET_APP_PASSWORD \
  https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>
```

#### 2. Get File Contents
```bash
curl -u $BITBUCKET_USERNAME:$BITBUCKET_APP_PASSWORD \
  "https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/src/main/.forte/config.json"
```

#### 3. Update/Create File
```bash
# Bitbucket requires commit API, not direct file update
curl -X POST \
  -u $BITBUCKET_USERNAME:$BITBUCKET_APP_PASSWORD \
  -H "Content-Type: application/json" \
  "https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/src" \
  -d '{
    "message": "Update Forte config",
    "branch": "main",
    ".forte/config.json": "<rawcontent>"
  }'
```

#### 4. Get Branch Info
```bash
curl -u $BITBUCKET_USERNAME:$BITBUCKET_APP_PASSWORD \
  "https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/refs/branches/main"
```

#### 5. Create Pull Request
```bash
curl -X POST \
  -u $BITBUCKET_USERNAME:$BITBUCKET_APP_PASSWORD \
  -H "Content-Type: application/json" \
  "https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/pullrequests" \
  -d '{
    "title": "Update MCP config",
    "description": "Automated update via Forte",
    "source": {
      "branch": {
        "name": "feature/update-mcp"
      }
    },
    "destination": {
      "branch": {
        "name": "main"
      }
    }
  }'
```

### Rate Limits
- Bitbucket Cloud: 1000 requests per hour per IP
- Check headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### Webhooks
```json
{
  "description": "Forte webhook",
  "url": "https://your-server.com/webhook",
  "events": ["repo:push"],
  "active": true
}
```

---

## Implementation Strategy for Forte

### 1. Unified Interface

```typescript
interface RepositoryAdapter {
  // Authentication
  authenticate(token: string): Promise<void>
  
  // File operations
  readFile(path: string, branch?: string): Promise<string>
  writeFile(path: string, content: string, message: string): Promise<void>
  
  // Branch operations
  getBranch(branch: string): Promise<BranchInfo>
  createBranch(from: string, to: string): Promise<void>
  
  // Pull Request / Merge Request
  createPR(title: string, body: string, source: string, target: string): Promise<void>
  
  // Repository info
  getRepoInfo(): Promise<RepoInfo>
}
```

### 2. Platform Detection

```typescript
function detectPlatform(repoUrl: string): Platform {
  if (repoUrl.includes('github.com')) return 'github'
  if (repoUrl.includes('gitlab.com')) return 'gitlab'
  if (repoUrl.includes('bitbucket.org')) return 'bitbucket'
  throw new Error('Unsupported platform')
}
```

### 3. Configuration Storage

```yaml
# ~/.forte/repository.yaml
platform: github
owner: username
repo: forte-configs
branch: main
default_branch: main
auth_method: token
token_env: GITHUB_TOKEN

# Or multiple repos
repositories:
  primary:
    platform: github
    owner: username
    repo: forte-configs
    branch: main
  
  backup:
    platform: gitlab
    owner: username
    repo: forte-configs-backup
    branch: main
```

### 4. Error Handling

```typescript
class RepositoryError extends Error {
  constructor(
    public platform: string,
    public operation: string,
    public statusCode?: number,
    message: string
  ) {
    super(message)
  }
}

// Rate limit handling
if (response.status === 429) {
  const resetTime = response.headers['X-RateLimit-Reset']
  throw new RateLimitError(resetTime)
}

// Conflict handling
if (response.status === 409) {
  // File changed, need to re-fetch
  await fetchLatest()
  retry = true
}
```

### 5. Conflict Resolution

```typescript
async resolveConflict(
  localContent: string,
  remoteContent: string,
  baseContent: string
): Promise<string> {
  // Use 3-way merge
  const mergeResult = threeWayMerge(localContent, remoteContent, baseContent)
  
  if (mergeResult.hasConflicts) {
    // Prompt user
    console.log('Conflict detected:')
    console.log(mergeResult.conflicts)
    
    const choice = await promptUser([
      'Keep local',
      'Keep remote',
      'Manual merge'
    ])
    
    switch (choice) {
      case 'local': return localContent
      case 'remote': return remoteContent
      case 'manual': return await manualMerge(mergeResult)
    }
  }
  
  return mergeResult.result
}
```

---

## Security Best Practices

### 1. Token Management
```bash
# Never hardcode tokens
# Use environment variables
export GITHUB_TOKEN="ghp_..."
export GITLAB_TOKEN="glpat_..."
export BITBUCKET_APP_PASSWORD="..."

# Or use system keychain
# macOS Keychain, Windows Credential Manager, Linux Secret Service
```

### 2. Token Scopes
**GitHub:**
- `repo` (Full control)
- `repo:status` (for commit status)
- `repo_deployment` (for deployments)

**GitLab:**
- `api` (Full api access)
- `read_repository` (Read-only)
- `write_repository` (Read-write)

**Bitbucket:**
- `repository:write`
- `pullrequest:write`

### 3. `.forteignore` Pattern
```
# Always ignore
.env
*.key
*.pem
secrets.yaml

# But include
config.json
mcp-list.json
profiles/
```

### 4. Sanitization
```typescript
function sanitizeConfig(config: any): any {
  const sanitized = { ...config }
  
  // Remove sensitive keys
  const sensitiveKeys = ['api_key', 'token', 'password', 'secret']
  sensitiveKeys.forEach(key => {
    if (sanitized[key]) {
      sanitized[key] = '***REDACTED***'
    }
  })
  
  // Sanitize env vars
  if (sanitized.env) {
    Object.keys(sanitized.env).forEach(k => {
      if (k.includes('KEY') || k.includes('TOKEN')) {
        sanitized.env[k] = '***REDACTED***'
      }
    })
  }
  
  return sanitized
}
```

---

## Testing Strategy

### 1. Mock API Responses
```typescript
// Mock GitHub API
const mockGitHubResponse = {
  name: 'config.json',
  content: Buffer.from(JSON.stringify(testConfig)).toString('base64'),
  sha: 'abc123'
}

nock('https://api.github.com')
  .get('/repos/test/test/contents/.forte/config.json')
  .reply(200, mockGitHubResponse)
```

### 2. Rate Limit Testing
```typescript
// Test rate limit handling
nock('https://api.github.com')
  .get('/repos/test/test/contents/.forte/config.json')
  .reply(429, {}, { 'X-RateLimit-Reset': Date.now() + 60000 })

await expect(adapter.readFile('config.json'))
  .rejects.toThrow(RateLimitError)
```

### 3. Conflict Testing
```typescript
// Test 409 Conflict
nock('https://api.github.com')
  .put('/repos/test/test/contents/.forte/config.json')
  .reply(409, { message: 'File does not match current SHA' })

await expect(adapter.writeFile('config.json', content, 'message'))
  .rejects.toThrow(ConflictError)
```

---

## Use Cases

### 1. Initial Setup
```bash
forte repo connect github user/forte-configs
# Creates .forte/config.json in repo
# Commits and pushes
```

### 2. Sync Workflow
```bash
# On machine A
forte repo push -m "Update MCP configs"

# On machine B
forte repo pull
```

### 3. Team Workflow
```bash
# Team member creates PR
forte repo push --branch feature/add-postgres-mcp
forte repo pr create "Add PostgreSQL MCP"

# Team lead reviews and merges
forte repo pr merge
```

### 4. Backup Workflow
```bash
forte repo connect github user/forte-configs
forte repo connect gitlab user/forte-backup --backup

# Push to primary
forte repo push

# Sync to backup
forte repo sync --to backup
```

---

## Comparison Summary

| Feature | GitHub | GitLab | Bitbucket |
|---------|--------|--------|-----------|
| Auth Method | PAT / OAuth | PAT / OAuth | App Password / OAuth |
| File API | Direct read/write | Direct read/write | Requires commit API |
| Rate Limit | 5000/hr (auth) | 2000/min (auth) | 1000/hr (per IP) |
| PR Name | Pull Request | Merge Request | Pull Request |
| Webhook Support | ✅ | ✅ | ✅ |
| Branch Protection | ✅ | ✅ | ✅ |
| Auto-merge | ✅ | ✅ | ✅ (via API) |

**Recommended**: GitHub as primary, GitLab as backup, Bitbucket optional.

---

## Next Steps

1. Implement `RepositoryAdapter` interface for each platform
2. Add comprehensive error handling
3. Implement rate limit backoff
4. Add conflict resolution UI
5. Create test suite for each platform
6. Add webhook support for auto-sync
