"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../rename-core.js");

function builderSettings(overrides = {}) {
  return {
    mode: "builder",
    builder: {
      prefix: "",
      base: "",
      suffix: "",
      numbering: false,
      start: 1,
      padding: 2,
      separator: "_",
      ...overrides,
    },
    regex: {
      find: "",
      replace: "",
      global: true,
      ignoreCase: false,
    },
  };
}

test("builder mode preserves original names while adding prefix and suffix", () => {
  const layers = [
    { name: "Car", selected: true },
    { name: "Tree", selected: false },
  ];

  const result = core.processSelectedLayers(
    layers,
    builderSettings({ prefix: "race-", suffix: "-high" }),
    false,
  );

  assert.equal(result.ok, true);
  assert.equal(result.selected, 1);
  assert.equal(layers[0].name, "race-Car-high");
  assert.equal(layers[1].name, "Tree");
});

test("numbering uses base, start, padding, and separator", () => {
  const layers = [
    { name: "One", selected: true },
    { name: "Two", selected: true },
  ];

  core.processSelectedLayers(
    layers,
    builderSettings({
      base: "car",
      suffix: "-high",
      numbering: true,
      start: 7,
      padding: 3,
      separator: "_",
    }),
    false,
  );

  assert.deepEqual(
    layers.map((layer) => layer.name),
    ["car-high_007", "car-high_008"],
  );
});

test("selected layers are collected inside nested groups", () => {
  const nested = { name: "Nested", selected: true };
  const layers = [
    {
      name: "Group",
      selected: false,
      layers: [{ name: "Unselected", selected: false }, nested],
    },
  ];

  const result = core.processSelectedLayers(
    layers,
    builderSettings({ prefix: "-e-" }),
    false,
  );

  assert.equal(result.selected, 1);
  assert.equal(nested.name, "-e-Nested");
});

test("preview reports changes without mutating layer names", () => {
  const layers = [{ name: "Original", selected: true }];

  const result = core.processSelectedLayers(
    layers,
    builderSettings({ prefix: "preview-" }),
    true,
  );

  assert.equal(result.dryRun, true);
  assert.equal(result.changed, 1);
  assert.equal(result.samples[0].after, "preview-Original");
  assert.equal(layers[0].name, "Original");
});

test("regex mode supports global, ignore-case, and capture groups", () => {
  const layers = [{ name: "Tree TREE 04", selected: true }];
  const settings = {
    mode: "regex",
    builder: builderSettings().builder,
    regex: {
      find: "tree (tree) (\\d+)",
      replace: "vegetation_$1_$2",
      global: true,
      ignoreCase: true,
    },
  };

  const result = core.processSelectedLayers(layers, settings, false);

  assert.equal(result.ok, true);
  assert.equal(layers[0].name, "vegetation_TREE_04");
});

test("invalid regex and empty selection return actionable errors", () => {
  const invalid = {
    mode: "regex",
    builder: builderSettings().builder,
    regex: {
      find: "[abc",
      replace: "",
      global: true,
      ignoreCase: false,
    },
  };

  assert.match(core.validateSettings(invalid).message, /Invalid regular expression/);
  assert.equal(
    core.processSelectedLayers([], builderSettings(), false).message,
    "Select one or more layers first.",
  );
});
