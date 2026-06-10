## ADDED Requirements

### Requirement: npm Registry Publishing
Forte MUST be publishable to npm as a global CLI. The published package MUST include the compiled `dist/cli.js` and MUST declare the `forte` binary in the `bin` field. Users MUST be able to install with `npm install -g forte` and run `forte` from any shell.

#### Scenario: npm publish
- **WHEN** maintainer runs `npm publish`
- **THEN** package.json build/prepublish hooks run, `dist/cli.js` exists, and the published tarball exposes a `forte` binary.

#### Scenario: npm global install
- **WHEN** user runs `npm install -g forte`
- **THEN** `forte` is available on PATH and `forte --help` prints usage.

#### Scenario: npx usage without install
- **WHEN** user runs `npx forte`
- **THEN** npm downloads the package, invokes `dist/cli.js`, and the command runs without permanent install.

---

### Requirement: Homebrew Installation
Forte MUST support installation via Homebrew. Maintainers MUST provide a formula that installs the released binary or fetches from npm. The formula MUST declare dependencies and caveats where needed.

#### Scenario: Brew install
- **WHEN** user runs `brew install user/tap/forte`
- **THEN** formula installs the CLI and `forte --version` returns the package version.

#### Scenario: Brew upgrade
- **WHEN** maintainer bumps the version in the formula
- **THEN** `brew upgrade forte` fetches the new release.

---

### Requirement: GitHub Binary Releases
Forte MUST produce platform-specific release assets on GitHub Releases. Each release MUST include at least `darwin-x64`, `linux-x64`, and `linux-arm64` binaries.

#### Scenario: Release asset
- **WHEN** maintainer publishes a GitHub Release tagged `v1.0.0`
- **THEN** the release page lists downloadable archives/binaries named `forte-<os>-<arch>`.

#### Scenario: Binary install
- **WHEN** user downloads and runs the binary
- **THEN** the executable starts without requiring Node.js or npm.
