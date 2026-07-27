(function (root, factory) {
  var api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.BatchRenameCore = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function padNumber(value, width) {
    var output = String(value);
    while (output.length < width) output = "0" + output;
    return output;
  }

  function compileRegex(regex) {
    var flags = "";
    if (regex.global) flags += "g";
    if (regex.ignoreCase) flags += "i";
    return new RegExp(regex.find, flags);
  }

  function validateSettings(settings) {
    if (!settings || (settings.mode !== "builder" && settings.mode !== "regex")) {
      return { ok: false, message: "Choose a valid rename mode." };
    }

    if (settings.mode === "regex") {
      if (!settings.regex || !settings.regex.find) {
        return { ok: false, message: "Enter a regular expression to find." };
      }

      try {
        compileRegex(settings.regex);
      } catch (error) {
        return {
          ok: false,
          message: "Invalid regular expression: " +
            (error && error.message ? error.message : String(error)),
        };
      }
    }

    return { ok: true };
  }

  function collectSelectedLayers(layers, selectedLayers) {
    var output = selectedLayers || [];
    if (!layers) return output;

    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (layer.selected) output.push(layer);
      if (layer.layers && layer.layers.length > 0) {
        collectSelectedLayers(layer.layers, output);
      }
    }

    return output;
  }

  function renameLayerName(before, index, settings, expression) {
    if (settings.mode === "regex") {
      expression.lastIndex = 0;
      return before.replace(expression, settings.regex.replace);
    }

    var builder = settings.builder;
    var core = builder.base ? builder.base : before;
    var after = builder.prefix + core + builder.suffix;

    if (builder.numbering) {
      after += builder.separator +
        padNumber(builder.start + index, builder.padding);
    }

    return after;
  }

  function processSelectedLayers(layers, settings, dryRun) {
    var validation = validateSettings(settings);
    if (!validation.ok) return validation;

    var selectedLayers = collectSelectedLayers(layers);
    if (selectedLayers.length === 0) {
      return { ok: false, message: "Select one or more layers first." };
    }

    var expression = settings.mode === "regex"
      ? compileRegex(settings.regex)
      : null;
    var changed = 0;
    var unchanged = 0;
    var samples = [];

    for (var index = 0; index < selectedLayers.length; index++) {
      var target = selectedLayers[index];
      var before = String(target.name);
      var after = renameLayerName(before, index, settings, expression);

      if (samples.length < 6) {
        samples.push({ before: before, after: after });
      }

      if (after !== before) {
        changed++;
        if (!dryRun) target.name = after;
      } else {
        unchanged++;
      }
    }

    return {
      ok: true,
      dryRun: Boolean(dryRun),
      selected: selectedLayers.length,
      changed: changed,
      unchanged: unchanged,
      samples: samples,
    };
  }

  return Object.freeze({
    padNumber: padNumber,
    compileRegex: compileRegex,
    validateSettings: validateSettings,
    collectSelectedLayers: collectSelectedLayers,
    renameLayerName: renameLayerName,
    processSelectedLayers: processSelectedLayers,
  });
}));
