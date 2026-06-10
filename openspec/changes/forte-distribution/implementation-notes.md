## Implementation Notes

### Validated on VPS
- Build succeeds: `npm run build` produces `dist/cli.js` (1.0.0)
- Binary runs: `node dist/cli.js --version` and `--help` work cleanly
- Storage impact checked: `dist/ ~672K`, `node_modules/ 95M`, `dashboard/ 438M` (gitignored)

### Package identity
- Renamed from `forte` to `forte-mcp-manager` to avoid npm name collision
- Added `repository` + `homepage` fields
- Added `prepublishOnly` script

### Not yet executed (requires auth)
- `npm login` + `npm publish` (cannot run without npm token on this VPS)
- Homebrew formula setup (requires tap ownership)
- GitHub Actions workflow for binary releases

### Done
- `package.json` publish metadata updated
- `README.md` install section updated
- Build verified working
