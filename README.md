# Batch Rename for Photopea

A lightweight Photopea sidebar plugin for renaming selected layers.

## Features

- Prefix, suffix, and replacement base name
- Sequential numbering with start, padding, and separator controls
- Regular-expression find and replace with capture groups
- Preview before applying
- Selected layers inside nested folders
- No server, account, database, or document upload

## Install

1. Open the [installer page](https://chaxic.github.io/photopea-batch-rename/).
2. Download `batch-rename-photopea.json`.
3. In Photopea, open **Window → Plugins → Add Plugin**.
4. Select the downloaded JSON file.

The plugin is plain HTML, CSS, and JavaScript hosted by GitHub Pages.

## Development

Serve this folder through any static HTTP server. The full installer appears in
a normal browser tab. When loaded by Photopea as an iframe, it automatically
shows the compact plugin panel.

## License

Released under the [MIT License](LICENSE). Personal and commercial use,
modification, and redistribution are allowed. If you distribute copies or
substantial portions of the code, retain the copyright and license notice.
