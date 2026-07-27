(function (root, factory) {
  var meta = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = meta;
  }

  root.BATCH_RENAME_META = meta;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  return Object.freeze({
    name: "Batch Rename",
    version: "1.0.0",
    testedPhotopea: "5.6",
    scriptingVersion: "30",
    verifiedDate: "2026-07-27",
    verifiedLabel: "27 July 2026",
    requestTimeoutMs: 15000,
    repositoryUrl: "https://github.com/chaxic/photopea-batch-rename",
    pluginUrl: "https://chaxic.github.io/photopea-batch-rename/",
  });
}));
