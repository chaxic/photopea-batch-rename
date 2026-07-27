"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const meta = require("../meta.js");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const escapedVersion = meta.version.replaceAll(".", "\\.");

test("release version is consistent across public files", () => {
  const manifest = JSON.parse(read("plugin.json"));
  const index = read("index.html");
  const readme = read("README.md");
  const changelog = read("CHANGELOG.md");

  assert.match(manifest.url, new RegExp(`\\?v=${escapedVersion}$`));
  assert.match(manifest.icon, new RegExp(`\\?v=${escapedVersion}$`));
  assert.match(index, new RegExp(`meta\\.js\\?v=${escapedVersion}`));
  assert.match(index, new RegExp(`rename-core\\.js\\?v=${escapedVersion}`));
  assert.match(index, new RegExp(`app\\.js\\?v=${escapedVersion}`));
  assert.match(index, new RegExp(`style\\.css\\?v=${escapedVersion}`));
  assert.match(readme, new RegExp(`v${escapedVersion}`));
  assert.match(changelog, new RegExp(`\\[${escapedVersion}\\]`));
});

test("manifest uses public GitHub Pages URLs and a theme-aware icon", () => {
  const manifest = JSON.parse(read("plugin.json"));

  assert.equal(new URL(manifest.url).origin, "https://chaxic.github.io");
  assert.match(manifest.icon, /^===https:\/\/chaxic\.github\.io\//);
});

test("all JavaScript files parse", () => {
  for (const file of ["meta.js", "rename-core.js", "app.js"]) {
    assert.doesNotThrow(
      () => new vm.Script(read(file), { filename: file }),
      `${file} should parse`,
    );
  }
});

test("panel includes timeout and stale-response protection", () => {
  const app = read("app.js");

  assert.match(app, /activeRequestId/);
  assert.match(app, /requestTimeoutMs/);
  assert.match(app, /result\.requestId !== state\.activeRequestId/);
  assert.match(app, /View source/);
});
