# Batch Rename for Photopea

A lightweight, client-side Photopea sidebar plugin for renaming selected
layers with templates, numbering, and regular expressions.

**Current version:** v1.0.0  
**Compatibility:** Tested with Photopea 5.6 · scripting v30  
**Last verified:** 27 July 2026

## Features

- Prefix, suffix, and replacement base name
- Sequential numbering with start, padding, and separator controls
- Regular-expression find and replace with capture groups
- Read-only preview before applying
- Selected layers inside nested folders
- Clear empty, success, and error states
- Stale-response protection and a 15-second failure timeout
- No server, account, database, or document upload

## Install

1. Open the [v1.0.0 installer page](https://chaxic.github.io/photopea-batch-rename/?v=1.0.0).
2. Download `batch-rename-photopea.json`.
3. In Photopea, open **Window → Plugins → Add Plugin**.
4. Select the downloaded JSON file.
5. Open the panel and confirm that it shows **v1.0.0**.

The plugin is plain HTML, CSS, and JavaScript hosted by GitHub Pages.

## Use

1. Select one or more layers in Photopea.
2. Choose **Build name** or **Regex**.
3. Enter the rename settings.
4. Select **Preview** to check the proposed names without changing the document.
5. Select **Apply rename** to rename the selected layers.

Applying a rename intentionally changes layer names. Use Photopea's History or
Undo command if you need to revert the operation. Unselected layers, pixels,
effects, visibility, and document dimensions are not modified.

## Development

Serve this folder through any static HTTP server. The full installer appears in
a normal browser tab. When loaded by Photopea as an iframe, it automatically
shows the compact plugin panel.

No build step or runtime dependency is required. Run the automated checks with:

```bash
node --test tests/*.test.cjs
```

Releases follow the project's semantic-versioning, cache-busting, changelog,
live Photopea verification, and GitHub Pages checks.

## Privacy

The plugin runs entirely in the browser. It sends a rename script to Photopea
through Photopea's documented messaging interface; document and layer data are
not uploaded to a server.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

Released under the [MIT License](LICENSE). Personal and commercial use,
modification, and redistribution are allowed. If you distribute copies or
substantial portions of the code, retain the copyright and license notice.
