# Changelog

All notable changes to Batch Rename for Photopea are documented here.

## [1.0.0] - 2026-07-27

### Added

- Visible plugin version on the panel and installer page.
- Visible compatibility information for Photopea 5.6 and scripting v30.
- Automated checks for builder rules, regex replacement, nested selections,
  preview safety, manifest URLs, cache busting, and version consistency.
- Dated compatibility and verification information in the README.

### Changed

- Added request IDs so late replies from older operations are ignored.
- Added a 15-second timeout with a useful failure message.
- Disabled conflicting controls while Photopea is processing a request.
- Added versioned panel and icon URLs to reduce stale cached installations.
- Kept the existing client-side architecture, GitHub source link, and rename
  behaviour.

### Verification

- Automated checks passed on 27 July 2026.
- Public GitHub Pages assets were checked without authentication.
- Tested with Photopea 5.6 · scripting v30 on 27 July 2026.
