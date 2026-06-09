# Forte Dashboard - Complete SPA Implementation

## Overview

Single Page Application (SPA) untuk manage Forte dengan semua features:
- Environment variable management (tokens)
- Path configuration per tool
- Tools enable/disable status
- MCP loading dari Forte ke tools

---

## 🎨 Dashboard Features

### 1. Environment Variables Section

**Display**:
- List semua environment variables (masked)
- Add/Edit/Delete environment variables
- Group by MCP usage
- Validation status (required/optional)

**Actions**:
- Add new variable (dengan hidden input)
- Edit existing value
- Delete variable
- Test connection (cek API key validity)

**UI Components**:
```tsx
<EnvSection>
  <EnvList vars={envVars} />
  <EnvAddDialog />
  <EnvEditDialog />
  <DeleteConfirmation />
</EnvSection>
```

### 2. Path Configuration Section

**Display**:
- List semua tools dengan paths
- Custom path indicators
- Path status (valid/invalid/not found)
- Priority indicators (custom > ENV > default)

**Actions**:
- Edit tool path
- Reset ke default path
- Test path (cek existence)
- Add new tool

**UI Components**:
```tsx
<PathSection>
  <ToolPathList tools={tools} />
  <PathEditDialog />
  <PathTestButton />
  <ResetPathButton />
</PathSection>
```

### 3. Tools Status Section

**Display**:
- List semua supported tools
- Enable/disable toggle per tool
- MCP count per tool
- Status indicators (detected/not_found)
- Global MCP status

**Actions**:
- Toggle tool enable/disable
- Refresh tool detection
- View tool details
- Configure MCP loading

**UI Components**:
```tsx
<ToolsSection>
  <ToolList tools={tools} />
  <ToolToggle tool={tool} />
  <ToolDetailsDialog />
  <MCPStatusChart />
</ToolsSection>
```

### 4. MCP Loading Section

**Display**:
- List semua MCPs dari Forte registry
- Load status per tool
- Enable/disable per MCP
- Dependency check status
- Apply ke tools button

**Actions**:
- Load MCP ke tool
- Load MCP ke semua tools
- Disable MCP globally/per-tool
- Check dependencies
- View MCP details

**UI Components**:
```tsx
<MCPLoadingSection>
  <MCPList mcps={mcps} />
  <LoadButton mcp={mcp} tool={tool} />
  <GlobalMCPControl />
  <DependencyCheckBadge />
  <MCPDetailsDialog />
</MCPLoadingSection>
```

---

## 🔧 Technical Implementation

### Backend API Requirements

```typescript
// Environment Variables API
GET  /api/env/list           # List all (masked)
POST /api/env/add            # Add variable
POST /api/env/edit           # Edit variable
DELETE /api/env/remove/:key  # Delete variable
POST /api/env/test/:key      # Test API key

// Path Configuration API
GET  /api/paths/tools         # Get all tool paths
POST /api/paths/edit          # Edit tool path
POST /api/paths/reset        # Reset to default
POST /api/paths/test         # Test path validity

// Tools Status API
GET  /api/tools/status        # Get all tools status
POST /api/tools/toggle       # Toggle tool enable/disable
POST /api/tools/refresh      # Refresh detection

// MCP Loading API
GET  /api/mcps/list          # List all MCPs
POST /api/mcps/load          # Load MCP to tool
POST /api/mcps/disable       # Disable MCP
POST /api/mcps/enable        # Enable MCP
GET  /api/mcps/deps          # Check dependencies
```

### Frontend Architecture

```typescript
// Main Dashboard Component
function Dashboard() {
  const [envVars, setEnvVars] = useState<EnvVar[]>([])
  const [tools, setTools] = useState<ToolStatus[]>([])
  const [mcps, setMcps] = useState<MCP[]>([])
  
  // Load all data on mount
  useEffect(() => {
    loadEnvVars()
    loadToolsStatus()
    loadMCPs()
  }, [])
  
  return (
    <div className="dashboard">
      <EnvSection vars={envVars} onUpdate={loadEnvVars} />
      <PathSection tools={tools} onUpdate={loadToolsStatus} />
      <ToolsSection tools={tools} onUpdate={loadToolsStatus} />
      <MCPSection mcps={mcps} tools={tools} />
    </div>
  )
}
```

---

## 📱 UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ Forte Dashboard                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │   Env   │  │  Paths  │  │  Tools  │  │   MCP   │ │
│  │  Vars   │  │         │  │         │  │ Loading │ │
│  │         │  │         │  │         │  │         │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Global Actions                                 │   │
│  │  [Detect Tools] [Refresh All] [Apply All]      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Detailed Section Specs

### Environment Variables Section

**State Management**:
```typescript
interface EnvVar {
  key: string;
  value: string; // masked
  required_for: string[]; // MCPs yang butuh
  status: 'valid' | 'invalid' | 'untested';
  last_tested?: string;
}

interface EnvSectionState {
  vars: EnvVar[];
  loading: boolean;
  showAddDialog: boolean;
  showEditDialog: boolean;
  selectedVar: EnvVar | null;
}
```

**Features**:
- **Add Variable**: Dialog dengan hidden input field
- **Edit Variable**: Update existing value
- **Delete Variable**: Confirmation dialog
- **Test Connection**: Test API key validity
- **Group by MCP**: Show MCPs yang menggunakan variable tersebut
- **Validation**: Cek format (uppercase, underscores)

**Example Usage**:
```tsx
<EnvVarCard 
  key="BRAVE_API_KEY"
  masked="***REDACTED***"
  requiredFor={["brave-search"]}
  status="valid"
  onEdit={() => openEditDialog("BRAVE_API_KEY")}
  onTest={() => testAPIKey("BRAVE_API_KEY")}
/>
```

### Path Configuration Section

**State Management**:
```typescript
interface ToolPath {
  toolId: string;
  name: string;
  currentPath: string;
  pathSource: 'default' | 'env' | 'custom';
  status: 'valid' | 'invalid' | 'not_found';
  priority: number;
}

interface PathSectionState {
  tools: ToolPath[];
  loading: boolean;
  showEditDialog: boolean;
  selectedTool: ToolPath | null;
}
```

**Features**:
- **List Tools**: Show semua tools dengan path info
- **Path Source Badge**: Show sumber path (default/ENV/custom)
- **Status Indicator**: Valid (✓) / Invalid (✗) / Not Found (!)
- **Edit Path**: Update tool path
- **Reset Path**: Reset ke default
- **Test Path**: Cek file existence dan permissions
- **Priority Display**: Custom paths ditandai

**Example Usage**:
```tsx
<ToolPathCard
  tool="opencode"
  name="OpenCode"
  currentPath="~/custom/opencode.json"
  source="custom"
  status="valid"
  onEdit={() => openEditDialog("opencode")}
  onReset={() => resetPath("opencode")}
  onTest={() => testPath("opencode")}
/>
```

### Tools Status Section

**State Management**:
```typescript
interface ToolStatus {
  toolId: string;
  name: string;
  enabled: boolean;
  detected: boolean;
  mcpCount: number;
  configPath: string;
  status: 'active' | 'disabled' | 'not_found';
  lastSync: string;
}

interface ToolsSectionState {
  tools: ToolStatus[];
  loading: boolean;
  showDetailsDialog: boolean;
  selectedTool: ToolStatus | null;
}
```

**Features**:
- **Toggle Enable/Disable**: Switch aktif/nonaktif tool
- **Detection Status**: Show if tool terdeteksi
- **MCP Count**: Jumlah MCP yang diload
- **Refresh Button**: Re-detect tool
- **Config Path**: Show lokasi config file
- **Last Sync**: Show terakhir kali MCP di-load

**Example Usage**:
```tsx
<ToolStatusCard
  tool="hermes"
  name="Hermes"
  enabled={true}
  detected={true}
  mcpCount={5}
  onToggle={() => toggleTool("hermes")}
  onRefresh={() => detectTool("hermes")}
/>
```

### MCP Loading Section

**State Management**:
```typescript
interface MCP {
  id: string;
  name: string;
  description: string;
  globalDisabled: boolean;
  toolStatus: Record<string, boolean>;
  dependencies: {
    packages: string[];
    installed: boolean;
    missing: string[];
  };
}

interface MCPSectionState {
  mcps: MCP[];
  tools: ToolStatus[];
  loading: boolean;
  showLoadDialog: boolean;
  selectedMCP: MCP | null;
  globalActions: boolean;
}
```

**Features**:
- **Global Disable**: Disable MCP di semua tools
- **Per-Tool Disable**: Enable/disable di tool tertentu
- **Dependency Status**: Show npm package status
- **Load Button**: Load MCP ke tool
- **Apply to All**: Load ke semua tools
- **View Details**: Show MCP configuration details

**Example Usage**:
```tsx
<MCPControlCard
  mcp="brave-search"
  name="Brave Search"
  globalDisabled={false}
  toolStatus={{
    opencode: true,
    kilocode: false,
    hermes: true
  }}
  dependencies={{
    packages: ["@modelcontextprotocol/server-brave-search"],
    installed: false,
    missing: ["@modelcontextprotocol/server-brave-search"]
  }}
  onGlobalToggle={() => toggleGlobalMCP("brave-search")}
  onToolToggle={(tool) => toggleToolMCP("brave-search", tool)}
  onLoad={(tool) => loadMCP("brave-search", tool)}
/>
```

---

## 🌊 Data Flow

### Complete Flow

```
Dashboard Mount
    ↓
Load Env Vars → /api/env/list
Load Paths → /api/paths/tools
Load Tools → /api/tools/status
Load MCPs → /api/mcps/list
    ↓
Render Sections
    ↓
User Actions (Add/Edit/Delete/Load/Disable)
    ↓
API Call → Backend (Forte CLI)
    ↓
Update State → Re-render
    ↓
Show Success/Error → User
```

### Example Flow: Load MCP

```
User: Click "Load to OpenCode" button for brave-search
    ↓
Frontend: POST /api/mcps/load
Body: { mcp: "brave-search", tool: "opencode" }
    ↓
Backend: forte init mcp brave-search --tool opencode
    ↓
Frontend: Show success/error toast
    ↓
Update state: brave-search loaded to opencode
```

---

## 🔒 Security Considerations

### 1. Environment Variables

**Frontend**:
- Tampilkan masked values saja (***REDACTED***)
- Hidden input untuk add/edit
- Tidak kirim raw values ke frontend unless perlu

**Backend**:
- Store dengan 600 permissions
- Encrypt di storage (future)
- Validate format sebelum save

### 2. Path Configuration

**Validation**:
- Cek path validity sebelum save
- Prevent directory traversal
- Validate permissions (read access)

### 3. Tool Control

**Safety**:
- Confirmation dialog untuk destructive actions
- Auto-backup sebelum load MCP
- Validate tool config sebelum apply

---

## 📊 Implementation Plan

### Phase 1: Backend API (Forte CLI Extension)

**New Commands**:
```bash
forte serve                    # Start API server
forte serve --port 3001       # Custom port
```

**API Endpoints**:
```typescript
// Environment Variables
GET    /api/env/list
POST   /api/env/add
POST   /api/env/edit
DELETE /api/env/remove/:key
POST   /api/env/test/:key

// Paths
GET    /api/paths/tools
POST   /api/paths/edit
POST   /api/paths/reset
POST   /api/paths/test

// Tools
GET    /api/tools/status
POST   /api/tools/toggle
POST   /api/tools/refresh

// MCPs
GET    /api/mcps/list
POST   /api/mcps/load
POST   /api/mcps/disable
POST   /api/mcps/enable
GET    /api/mcps/deps
```

### Phase 2: Frontend Dashboard

**File Structure**:
```
forte-dashboard/
├── app/
│   ├── page.tsx                 # Main dashboard
│   ├── api/
│   │   ├── env/route.ts
│   │   ├── paths/route.ts
│   │   ├── tools/route.ts
│   │   └── mcps/route.ts
│   └── components/
│       ├── EnvSection.tsx
│       ├── PathSection.tsx
│       ├── ToolsSection.tsx
││       └── MCPSection.tsx
└── lib/
    └── api.ts               # API client
```

### Phase 3: Integration

**API Client**:
```typescript
// lib/api.ts
export const api = {
  // Environment Variables
  listEnv: () => fetch('/api/env/list').then(r => r.json()),
  addEnv: (key, value) => fetch('/api/env/add', {
    method: 'POST',
    body: JSON.stringify({ key, value })
  }).then(r => r.json()),
  
  // Paths
  listPaths: () => fetch('/api/paths/tools').then(r => r.json()),
  editPath: (tool, path) => fetch('/api/paths/edit', {
    method: 'POST',
    body: JSON.stringify({ tool, path })
  }).then(r => r.json()),
  
  // Tools
  listTools: () => fetch('/api/tools/status').then(r => r.json()),
  toggleTool: (tool) => fetch('/api/tools/toggle', {
    method: 'POST',
    body: JSON.stringify({ tool })
  }).then(r => r.json()),
  
  // MCPs
  listMCPs: () => fetch('/api/mcps/list').then(r => r => r.json()),
  loadMCP: (mcp, tool) => fetch('/api/mcps/load', {
    method: 'POST',
    body: JSON.stringify({ mcp, tool })
  }).then(r => r.json())
}
```

---

## 🎨 UI Design

### Color Scheme

```css
/* Light Mode */
--bg-primary: #f8fafc
--bg-card: #ffffff
--text-primary: #0f172a
--border: #e2e8f0
--accent: #3b82f6
--success: #10b981
--danger: #ef4444
--warning: #f59e0b

/* Dark Mode */
--bg-primary: #0f172a
--bg-card: #1e293b
--text-primary: #f1f5f9
--border: #334155
--accent: #60a5fa
--success: #22c55e
--danger: #f87171
--warning: #fbbf24
```

### Component Styling

**Cards**:
- Rounded corners (8px)
- Subtle shadow
- Hover effects
- Status badges

**Buttons**:
- Primary: Accent color
- Destructive: Danger color
- Success: Success color
- Loading: Disabled with spinner

**Inputs**:
- Hidden password field untuk env vars
- Validation feedback
- Error messages

---

## 📝 Mock Data Structure

### Environment Variables

```json
{
  "envVars": [
    {
      "key": "BRAVE_API_KEY",
      "value": "***REDACTED***",
      "required_for": ["brave-search"],
      "status": "valid",
      "last_tested": "2026-06-09T12:00:00Z"
    },
    {
      "key": "GITHUB_TOKEN",
      "value": "***REDACTED***",
      "required_for": ["github"],
      "status": "valid",
      "last_tested": "2026-06-09T12:30:00Z"
    },
    {
      "key": "POSTGRES_URL",
      "value": "***REDACTED***",
      "required_for": ["postgres"],
      "status": "invalid",
      "last_tested": "2026-06-09T12:15:00Z"
    }
  ]
}
```

### Tool Paths

```json
{
  "tools": [
    {
      "toolId": "opencode",
      "name": "OpenCode",
      "currentPath": "~/.opencode/settings.json",
      "pathSource": "default",
      "status": "valid",
      "priority": 10
    },
    {
      "toolId": "kilocode",
      "name": "KiloCode",
      "currentPath": "~/custom/kilocode/mcp.json",
      "pathSource": "custom",
      "status": "valid",
      "priority": 50
    },
    {
      "toolId": "windsurf",
      "name": "Windsurf",
      "currentPath": "~/.windsurf/settings.json",
      "pathSource": "env",
      "status": "not_found",
      "priority": 30
    }
  ]
}
```

### Tools Status

```json
{
  "tools": [
    {
      "toolId": "hermes",
      "name": "Hermes",
      "enabled": true,
      "detected": true,
      "mcpCount": 5,
      "configPath": "/root/.hermes/config.yaml",
      "status": "active",
      "lastSync": "2026-06-09T12:00:00Z"
    },
    {
      "toolId": "opencode",
      "name": "OpenCode",
      "enabled": true,
      "disabled": false,
      "detected": false,
      "mcpCount": 0,
      "configPath": "~/.opencode/settings.json",
      "status": "disabled"
    },
    {
      "toolId": "kilocode",
      "name": "KiloCode",
      "enabled": true,
      "detected": true,
      "mcpCount": 2,
      "configPath": "~/custom/kilocode/mcp.json",
      "status": "active"
    }
  ]
}
```

### MCP Loading

```json
{
  "mcps": [
    {
      "id": "brave-search",
      "name": "Brave Search",
      "description": "Web search via Brave",
      "globalDisabled": false,
      "toolStatus": {
        "hermes": true,
        "opencode": false,
        "kilocode": true
      },
      "dependencies": {
        "packages": ["@modelcontextprotocol/server-brave-search"],
        "installed": false,
        "missing": ["@modelcontextprotocol/server-brave-search"]
      },
      "loadedIn": ["hermes", "kilocode"]
    },
    {
      "id": "filesystem",
      "name": "Forteystem MCP",
      "description": "Local filesystem access",
      "globalDisabled": false,
      "toolStatus": {
        "hermes": true,
        "opencode": true,
        "kilocode: true
      },
      "dependencies": {
        "packages": ["@modelcontextprotocol/server-filesystem"],
        "installed": true,
        "missing": []
      },
      "loadedIn": ["hermes", "opencode", "kilocode"]
    }
  ]
}
```

---

## 🚀 Quick Start

### 1. Start Forte Server

```bash
cd /root/forte
forte serve --port 3001
# API server running on http://localhost:3001
```

### 2. Start Dashboard

```bash
cd /root/forte-dashboard
npm run dev
# Dashboard running on http://localhost:3000
```

### 3. Open Browser

Visit `http://localhost:3000`

## 🎉 Summary

**Forte Dashboard akan menjadi single page application yang:**

✅ **Complete Feature Parity** - Semua CLI features reflected
✅ **Environment Variables** - Secure token management
✅ **Path Configuration** - Custom path per tool
✅ **Tools Control** - Enable/disable per tool
✅ **MCP Loading** - Load MCPs dari Forte ke tools
✅ **Real-time Updates** - Auto-refresh setelah actions
✅ **Validation** - Cek path validity, API key validity
✅ **Beautiful UI** - Modern, responsive design

**Forte Dashboard akan menjadi control center untuk semua MCP configurations!** 🎨
