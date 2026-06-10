# Proposal: Forte Distribution via npm, Homebrew, and GitHub Releases

## Problem
Forte is currently buildable (`dist/cli.js`) but not published or installable by end users. There is no documented distribution pipeline, package registry setup, or release workflow.

## Proposed Changes

1. **npm publishing**
   - Finalize `package.json` publish metadata (name, version, files/bin/main)
   - Add `prepublishOnly` build script
   - Document publish workflow in README

2. **Homebrew tap/formula**
   - Create a Homebrew formula under a maintained tap
   - Keep formula minimal: installs from npm tarball or GitHub release
   - Document `brew install` instructions

3. **GitHub binary releases**
   - Add release assets: `forte-darwin-x64`, `forte-linux-x64`, etc.
   - Use `pkg` or GitHub Actions to produce binaries
   - Document install steps for users without npm

4. **Docs**
   - Update README install section to cover all 3 channels
   - Keep one authoritative source of truth
