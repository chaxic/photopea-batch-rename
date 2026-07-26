"use strict";

const RESULT_PREFIX = "BATCH_RENAME_RESULT::";
const REPOSITORY_URL = "https://github.com/chaxic/photopea-batch-rename";
const defaultBuilder = {
  prefix: "",
  base: "",
  suffix: "",
  numbering: false,
  start: 1,
  padding: 2,
  separator: "_",
};

const state = {
  embedded: window.parent !== window,
  mode: "builder",
  builder: { ...defaultBuilder },
  regex: {
    find: "",
    replace: "",
    ignoreCase: false,
    global: true,
  },
  statusKind: "idle",
  statusText: "",
  samples: [],
};

const templates = {
  prefix: {
    label: "Prefix",
    message: "Prefix template loaded.",
    value: { ...defaultBuilder, prefix: "-e-" },
  },
  suffix: {
    label: "Suffix",
    message: "Suffix template loaded.",
    value: { ...defaultBuilder, suffix: "_final" },
  },
  numbered: {
    label: "Numbered",
    message: "Numbered template loaded.",
    value: { ...defaultBuilder, base: "Layer", numbering: true },
  },
  export: {
    label: "Export",
    message: "Export template loaded.",
    value: { ...defaultBuilder, prefix: "export_", numbering: true, padding: 3 },
  },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pluginBaseUrl() {
  return new URL("./", document.baseURI).href;
}

function makePhotopeaScript(mode, builder, regex, dryRun) {
  const payload = JSON.stringify({ mode, builder, regex, dryRun });

  return `
(function () {
  var resultTag = ${JSON.stringify(RESULT_PREFIX)};
  var settings = ${payload};

  function sendResult(result) {
    app.echoToOE(resultTag + JSON.stringify(result));
  }

  function padNumber(value, width) {
    var output = String(value);
    while (output.length < width) output = "0" + output;
    return output;
  }

  try {
    if (!app.documents || app.documents.length === 0) {
      sendResult({ ok: false, message: "Open a document before renaming layers." });
      return;
    }

    var selectedLayers = [];

    function collect(layers) {
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (layer.selected) selectedLayers.push(layer);
        if (layer.layers && layer.layers.length > 0) collect(layer.layers);
      }
    }

    collect(app.activeDocument.layers);

    if (selectedLayers.length === 0) {
      sendResult({ ok: false, message: "Select one or more layers first." });
      return;
    }

    var expression = null;
    if (settings.mode === "regex") {
      if (!settings.regex.find) {
        sendResult({ ok: false, message: "Enter a regular expression to find." });
        return;
      }
      var flags = "";
      if (settings.regex.global) flags += "g";
      if (settings.regex.ignoreCase) flags += "i";
      expression = new RegExp(settings.regex.find, flags);
    }

    var changed = 0;
    var unchanged = 0;
    var samples = [];

    for (var index = 0; index < selectedLayers.length; index++) {
      var target = selectedLayers[index];
      var before = String(target.name);
      var after = before;

      if (settings.mode === "regex") {
        after = before.replace(expression, settings.regex.replace);
      } else {
        var core = settings.builder.base ? settings.builder.base : before;
        after = settings.builder.prefix + core + settings.builder.suffix;

        if (settings.builder.numbering) {
          after += settings.builder.separator +
            padNumber(settings.builder.start + index, settings.builder.padding);
        }
      }

      if (samples.length < 6) samples.push({ before: before, after: after });

      if (after !== before) {
        changed++;
        if (!settings.dryRun) target.name = after;
      } else {
        unchanged++;
      }
    }

    sendResult({
      ok: true,
      dryRun: settings.dryRun,
      selected: selectedLayers.length,
      changed: changed,
      unchanged: unchanged,
      samples: samples
    });
  } catch (error) {
    sendResult({
      ok: false,
      message: error && error.message ? error.message : String(error)
    });
  }
}());`;
}

function statusIcon() {
  if (state.statusKind === "working") {
    return '<span class="spinner" aria-hidden="true"></span>';
  }

  const path =
    state.statusKind === "ok"
      ? "m5 10.2 3.1 3.1L15.4 6"
      : state.statusKind === "error"
        ? "M10 5.4v5.4M10 14.5v.1"
        : "M4.8 6.2h10.4M4.8 10h7.6M4.8 13.8h5.2";

  return `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${path}"></path></svg>`;
}

function previewHtml() {
  if (!state.samples.length) return "";

  return `
    <div class="rename-preview" aria-label="Rename preview">
      <div class="preview-title">Preview</div>
      ${state.samples
        .map(
          (sample) => `
            <div class="preview-item">
              <span title="${escapeHtml(sample.before)}">${escapeHtml(sample.before)}</span>
              <b aria-hidden="true">→</b>
              <strong title="${escapeHtml(sample.after)}">${escapeHtml(sample.after)}</strong>
            </div>`,
        )
        .join("")}
    </div>`;
}

function builderHtml() {
  const builder = state.builder;

  return `
    <div class="template-row" aria-label="Templates">
      ${Object.entries(templates)
        .map(
          ([key, template]) =>
            `<button type="button" data-template="${key}">${template.label}</button>`,
        )
        .join("")}
    </div>

    <div class="field-grid">
      <label>
        <span>Prefix</span>
        <input id="prefix" value="${escapeHtml(builder.prefix)}" placeholder="-e-" />
      </label>
      <label>
        <span>Suffix</span>
        <input id="suffix" value="${escapeHtml(builder.suffix)}" placeholder="_final" />
      </label>
    </div>

    <label class="stacked-field">
      <span>Base name <em>leave blank to keep current name</em></span>
      <input id="base" value="${escapeHtml(builder.base)}" placeholder="Layer" />
    </label>

    <div class="number-header">
      <label class="check-label">
        <input id="numbering" type="checkbox" ${builder.numbering ? "checked" : ""} />
        <span>Sequential numbering</span>
      </label>
    </div>

    ${
      builder.numbering
        ? `<div class="number-grid">
            <label><span>Start</span><input id="start" type="number" min="0" value="${builder.start}" /></label>
            <label><span>Digits</span><input id="padding" type="number" min="1" max="8" value="${builder.padding}" /></label>
            <label><span>Separator</span><input id="separator" value="${escapeHtml(builder.separator)}" maxlength="8" /></label>
          </div>`
        : ""
    }`;
}

function regexHtml() {
  const regex = state.regex;

  return `
    <label class="stacked-field">
      <span>Find pattern</span>
      <input id="find" value="${escapeHtml(regex.find)}" placeholder="^old_(.*)$" spellcheck="false" />
    </label>
    <label class="stacked-field">
      <span>Replace with</span>
      <input id="replace" value="${escapeHtml(regex.replace)}" placeholder="new_$1" spellcheck="false" />
    </label>
    <div class="regex-options">
      <label class="check-label">
        <input id="global" type="checkbox" ${regex.global ? "checked" : ""} />
        <span>Replace all matches</span>
      </label>
      <label class="check-label">
        <input id="ignore-case" type="checkbox" ${regex.ignoreCase ? "checked" : ""} />
        <span>Ignore case</span>
      </label>
    </div>
    <p class="regex-help">
      Supports capture groups such as <code>(.*)</code> and replacements such as <code>$1</code>.
    </p>`;
}

function panelHtml() {
  return `
    <section class="plugin-panel" aria-label="Batch Rename plugin">
      <header class="panel-header">
        <div class="brand-mark" aria-hidden="true">ab</div>
        <div>
          <h1>Batch Rename</h1>
          <p>Rename selected layers</p>
        </div>
      </header>

      <div class="mode-tabs" role="tablist" aria-label="Rename mode">
        <button class="${state.mode === "builder" ? "active" : ""}" data-mode="builder" role="tab" aria-selected="${state.mode === "builder"}">Build name</button>
        <button class="${state.mode === "regex" ? "active" : ""}" data-mode="regex" role="tab" aria-selected="${state.mode === "regex"}">Regex</button>
      </div>

      <div class="panel-body">
        ${state.mode === "builder" ? builderHtml() : regexHtml()}
        ${previewHtml()}
        <div class="panel-actions">
          <div class="status status-${state.statusKind}" role="status" aria-live="polite">
            ${statusIcon()}
            <span>${escapeHtml(state.statusText)}</span>
          </div>
          <div class="action-row">
            <button class="secondary" type="button" data-run="preview" ${state.statusKind === "working" ? "disabled" : ""}>Preview</button>
            <button class="primary" type="button" data-run="apply" ${state.statusKind === "working" ? "disabled" : ""}>Apply rename</button>
          </div>
        </div>
      </div>

      <footer class="panel-footer">
        <span>Selected layers only · Nested folders supported</span>
        <a href="${REPOSITORY_URL}" target="_blank" rel="noreferrer" title="View the Batch Rename source code on GitHub">
          View source <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </section>`;
}

function installerHtml() {
  const hostname = new URL(pluginBaseUrl()).host;
  return `
    <div class="install-layout">
      <section class="install-copy">
        <div class="eyebrow"><span class="eyebrow-dot"></span>Photopea plugin</div>
        <h1>Rename a whole layer stack in seconds.</h1>
        <p class="intro">
          Build consistent names with prefixes, suffixes and numbering—or use
          regular expressions for precise find-and-replace.
        </p>
        <div class="feature-pills">
          <span>Regex</span><span>Templates</span><span>Numbering</span><span>Safe preview</span>
        </div>
        <div class="install-actions">
          <button class="download-button" id="download-plugin">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.5v8m0 0 3-3m-3 3-3-3M4 14.5v2h12v-2"></path></svg>
            Download plugin
          </button>
          <a href="https://www.photopea.com" target="_blank" rel="noreferrer">Open Photopea <span aria-hidden="true">↗</span></a>
          <a href="${REPOSITORY_URL}" target="_blank" rel="noreferrer">View source <span aria-hidden="true">↗</span></a>
        </div>
        <ol class="steps">
          <li><span>1</span><div><strong>Download the installer</strong><p>Save the small Batch Rename JSON file.</p></div></li>
          <li><span>2</span><div><strong>Open Window → Plugins</strong><p>Choose Add Plugin at the top of Photopea’s plugin window.</p></div></li>
          <li><span>3</span><div><strong>Select the JSON file</strong><p>Batch Rename will appear in Photopea’s plugin rail.</p></div></li>
        </ol>
        <p class="privacy-note">Runs locally in Photopea. No document or layer data is uploaded.</p>
      </section>
      <section class="preview-wrap" aria-label="Plugin preview">
        <div class="preview-label"><span>Plugin preview</span><span>${escapeHtml(hostname)}</span></div>
        ${panelHtml()}
      </section>
    </div>`;
}

function render() {
  const root = document.querySelector("#app");
  if (!root) return;

  root.className = state.embedded ? "embedded-shell" : "install-page";
  root.innerHTML = state.embedded ? panelHtml() : installerHtml();
  bindEvents();
}

function resetFeedback(message) {
  state.statusKind = "idle";
  state.statusText = message || "Preview your changes before applying.";
  state.samples = [];
}

function updateBuilderFromInputs() {
  const read = (selector, fallback = "") =>
    document.querySelector(selector)?.value ?? fallback;
  state.builder.prefix = read("#prefix", state.builder.prefix);
  state.builder.suffix = read("#suffix", state.builder.suffix);
  state.builder.base = read("#base", state.builder.base);
  state.builder.numbering =
    document.querySelector("#numbering")?.checked ?? state.builder.numbering;
  state.builder.start = Number(read("#start", state.builder.start)) || 0;
  state.builder.padding = Math.max(
    1,
    Math.min(8, Number(read("#padding", state.builder.padding)) || 1),
  );
  state.builder.separator = read("#separator", state.builder.separator);
}

function updateRegexFromInputs() {
  const read = (selector, fallback = "") =>
    document.querySelector(selector)?.value ?? fallback;
  state.regex.find = read("#find", state.regex.find);
  state.regex.replace = read("#replace", state.regex.replace);
  state.regex.global =
    document.querySelector("#global")?.checked ?? state.regex.global;
  state.regex.ignoreCase =
    document.querySelector("#ignore-case")?.checked ?? state.regex.ignoreCase;
}

function runRename(dryRun) {
  if (!state.embedded) {
    state.statusKind = "idle";
    state.statusText = "Install the plugin to use it inside Photopea.";
    render();
    return;
  }

  if (state.mode === "builder") updateBuilderFromInputs();
  else updateRegexFromInputs();

  if (state.mode === "regex" && !state.regex.find) {
    state.statusKind = "error";
    state.statusText = "Enter a regular expression to find.";
    render();
    return;
  }

  state.statusKind = "working";
  state.statusText = dryRun ? "Building preview…" : "Renaming selected layers…";
  render();
  window.parent.postMessage(
    makePhotopeaScript(
      state.mode,
      state.builder,
      state.regex,
      dryRun,
    ),
    "*",
  );
}

function downloadInstaller() {
  const base = pluginBaseUrl();
  const manifest = {
    name: "Batch Rename",
    url: base,
    icon: `===${new URL("icon.svg", base).href}`,
  };
  const blob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: "application/json",
  });
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = "batch-rename-photopea.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
}

function bindEvents() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.mode === "builder") updateBuilderFromInputs();
      else updateRegexFromInputs();
      state.mode = button.dataset.mode;
      resetFeedback();
      render();
    });
  });

  document.querySelectorAll("[data-template]").forEach((button) => {
    button.addEventListener("click", () => {
      const template = templates[button.dataset.template];
      state.builder = { ...template.value };
      resetFeedback(template.message);
      render();
    });
  });

  document.querySelectorAll("[data-run]").forEach((button) => {
    button.addEventListener("click", () => {
      runRename(button.dataset.run === "preview");
    });
  });

  document.querySelector("#download-plugin")?.addEventListener("click", downloadInstaller);

  document.querySelector("#numbering")?.addEventListener("change", () => {
    updateBuilderFromInputs();
    resetFeedback();
    render();
  });

  document.querySelectorAll(".panel-body input").forEach((input) => {
    if (input.id === "numbering") return;
    input.addEventListener("input", () => {
      if (state.mode === "builder") updateBuilderFromInputs();
      else updateRegexFromInputs();
      state.statusKind = "idle";
      state.statusText = "Preview your changes before applying.";
      state.samples = [];
    });
  });
}

window.addEventListener("message", (event) => {
  if (
    !state.embedded ||
    event.source !== window.parent ||
    typeof event.data !== "string" ||
    !event.data.startsWith(RESULT_PREFIX)
  ) {
    return;
  }

  try {
    const result = JSON.parse(event.data.slice(RESULT_PREFIX.length));
    if (!result.ok) {
      state.statusKind = "error";
      state.statusText =
        result.message || "Photopea could not process the layer names.";
      state.samples = [];
      render();
      return;
    }

    state.statusKind = "ok";
    state.samples = result.samples || [];
    if (result.dryRun) {
      state.statusText = result.changed
        ? `${result.changed} of ${result.selected} selected layer(s) will change.`
        : "The selected layer names would not change.";
    } else {
      state.statusText = result.changed
        ? `Renamed ${result.changed} of ${result.selected} selected layer(s).`
        : "No selected layer names needed changing.";
    }
  } catch {
    state.statusKind = "error";
    state.statusText = "Photopea returned an unreadable result.";
    state.samples = [];
  }
  render();
});

state.statusText = state.embedded
  ? "Select layers, then preview the new names."
  : "Interactive plugin preview.";
render();
