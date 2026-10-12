// Delivery Workbench standalone demo: sprint capacity calculator and browser-local draft.
// Formulas follow client/src/components/tabs/SprintTab.tsx in the full app.
"use strict";

(function () {
  var STORAGE_KEY = "delivery-workbench-demo:draft:v1";
  var COMMIT_RATIO = 0.9; // SprintTab "Recommended commit: 90% of dev capacity"
  var BAND_LOW = 85; // SprintTab benchmark: capacity utilization 85–95% is green
  var BAND_HIGH = 95; // above 95% is overcommit

  var FIELDS = {
    people: { label: "People", min: 1, max: 200, integer: true, required: true },
    days: { label: "Sprint days", min: 0.5, max: 30, integer: false, required: true },
    hours: { label: "Hours per day", min: 0.5, max: 12, integer: false, required: true },
    focus: { label: "Focus %", min: 1, max: 100, integer: false, required: true },
    planned: { label: "Planned work", min: 0, max: 100000, integer: false, required: false }
  };
  var FIELD_IDS = Object.keys(FIELDS);
  var EXAMPLE = { people: "5", days: "10", hours: "6", focus: "70", planned: "230" };
  var DRAFT_LIMITS = { name: 80, goal: 280, notes: 1000 };

  var $ = function (id) { return document.getElementById(id); };

  function fmt(n) {
    return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  }

  function fmtSigned(n) {
    return (n >= 0 ? "+" : "−") + fmt(Math.abs(n)) + " h";
  }

  // ---- Validation ----

  function parseField(id) {
    var spec = FIELDS[id];
    var el = $(id);
    var raw = el.value.trim();
    if (el.validity && el.validity.badInput) return { error: "Enter a number." };
    if (raw === "") return { empty: true };
    var n = Number(raw);
    if (!isFinite(n)) return { error: "Enter a number." };
    if (spec.integer && !Number.isInteger(n)) return { error: "Use a whole number." };
    if (n < spec.min || n > spec.max) {
      return { error: "Enter a value from " + fmt(spec.min) + " to " + fmt(spec.max) + "." };
    }
    return { value: n };
  }

  function readInputs() {
    var parsed = {};
    FIELD_IDS.forEach(function (id) { parsed[id] = parseField(id); });
    return parsed;
  }

  // ---- Calculation ----

  function compute(v) {
    var focus = v.focus / 100;
    var available = v.people * v.days * v.hours * focus;
    var ceiling = available * COMMIT_RATIO;
    var hasPlanned = typeof v.planned === "number";
    var load = hasPlanned ? (v.planned / available) * 100 : null;
    var status = !hasPlanned ? "none" : load < BAND_LOW ? "under" : load <= BAND_HIGH ? "healthy" : "over";
    return {
      available: available,
      ceiling: ceiling,
      planned: hasPlanned ? v.planned : null,
      load: load,
      status: status,
      // Focus % at which the planned work would sit exactly on the 90% line
      requiredFocus: hasPlanned ? (v.planned / (COMMIT_RATIO * v.people * v.days * v.hours)) * 100 : null,
      sensitivity: {
        person: v.days * v.hours * focus,
        day: -(v.people * v.hours * focus),
        focus: -(v.people * v.days * v.hours * 0.1)
      }
    };
  }

  function decide(r, v) {
    if (r.status === "none") {
      return {
        tag: "Ceiling",
        head: "Commit up to " + fmt(r.ceiling) + " h of estimated work.",
        body: "Add planned work hours to check this sprint's load against capacity."
      };
    }
    var loadText = fmt(r.load) + "%";
    if (r.status === "under") {
      return {
        tag: "Under " + BAND_LOW + "% · room to add",
        head: "Room to add about " + fmt(Math.max(r.ceiling - r.planned, 0)) + " h before the 90% line.",
        body: "Planned " + fmt(r.planned) + " h uses " + loadText + " of available hours. Pull in more backlog, or keep the slack on purpose and say why."
      };
    }
    if (r.status === "healthy") {
      return {
        tag: BAND_LOW + "–" + BAND_HIGH + "% · within band",
        head: "Commit as planned: " + loadText + " load.",
        body: "Planned " + fmt(r.planned) + " h leaves " + fmt(r.available - r.planned) + " h of slack for unplanned work and support."
      };
    }
    var cut = r.planned - r.ceiling;
    var focusLine = r.requiredFocus <= 100
      ? " Keeping this scope would need " + fmt(r.requiredFocus) + "% focus (currently " + fmt(v.focus) + "%)."
      : " Focus alone can't fix this: keeping this scope would need " + fmt(r.requiredFocus) + "% focus.";
    return {
      tag: "Over " + BAND_HIGH + "% · overcommitted",
      head: "Overcommitted: cut or defer about " + fmt(cut) + " h.",
      body: "Planned " + fmt(r.planned) + " h is " + loadText + " of available hours." + focusLine
    };
  }

  // ---- Rendering ----

  var lastStatus = null;
  var lastResult = null;

  function setFieldError(id, message) {
    var el = $(id);
    $(id + "-err").textContent = message || "";
    if (message) el.setAttribute("aria-invalid", "true");
    else el.removeAttribute("aria-invalid");
  }

  function resetLedger() {
    $("v-available").textContent = "—";
    $("v-ceiling").textContent = "—";
    $("v-load").textContent = "—";
    $("f-available").textContent = "people × days × hours per day × focus %";
    $("f-ceiling").textContent = "available × 90%";
    $("f-load").textContent = "planned ÷ available";
    ["s-person", "s-day", "s-focus"].forEach(function (id) { $(id).textContent = "—"; });
  }

  function showDecision(d, status) {
    var box = $("decision");
    box.setAttribute("data-status", status);
    $("decision-tag").textContent = d.tag;
    $("decision-head").textContent = d.head;
    $("decision-body").textContent = d.body;
    if (status !== lastStatus) {
      box.classList.remove("changed");
      void box.offsetWidth; // restart the highlight animation
      box.classList.add("changed");
      lastStatus = status;
    }
  }

  function showState(kind, message) {
    var el = $("state-msg");
    el.hidden = !message;
    el.textContent = message || "";
    el.setAttribute("data-kind", kind || "");
  }

  function render() {
    var parsed = readInputs();
    var errors = [];
    var missing = [];
    var values = {};

    FIELD_IDS.forEach(function (id) {
      var p = parsed[id];
      setFieldError(id, p.error);
      if (p.error) errors.push(FIELDS[id].label);
      else if (p.empty && FIELDS[id].required) missing.push(FIELDS[id].label);
      else if (!p.empty) values[id] = p.value;
    });

    var allEmpty = FIELD_IDS.every(function (id) { return parsed[id].empty; });
    if (allEmpty) {
      lastResult = null;
      resetLedger();
      showState("empty", "No inputs yet. Enter people, sprint days, hours per day and focus, or load the example.");
      showDecision({ tag: "No result", head: "Enter sprint inputs to see a decision.", body: "" }, "none");
      return;
    }
    if (errors.length || missing.length) {
      lastResult = null;
      resetLedger();
      var parts = [];
      if (errors.length) parts.push("Fix " + errors.join(", ") + ".");
      if (missing.length) parts.push("Still needed: " + missing.join(", ") + ".");
      showState("invalid", parts.join(" "));
      showDecision({ tag: "No result", head: "No decision until the inputs are valid.", body: "" }, "none");
      return;
    }

    showState(null, "");
    var r = compute(values);
    lastResult = { values: values, result: r, decision: decide(r, values) };

    $("v-available").textContent = fmt(r.available) + " h";
    $("f-available").textContent = values.people + " people × " + fmt(values.days) + " days × " +
      fmt(values.hours) + " h × " + fmt(values.focus) + "% = " + fmt(r.available) + " h";
    $("v-ceiling").textContent = fmt(r.ceiling) + " h";
    $("f-ceiling").textContent = fmt(r.available) + " h × 90% = " + fmt(r.ceiling) + " h";
    if (r.planned === null) {
      $("v-load").textContent = "—";
      $("f-load").textContent = "planned ÷ available (enter planned work)";
    } else {
      $("v-load").textContent = fmt(r.load) + "%";
      $("f-load").textContent = fmt(r.planned) + " h ÷ " + fmt(r.available) + " h = " + fmt(r.load) + "%";
    }
    $("s-person").textContent = fmtSigned(r.sensitivity.person);
    $("s-day").textContent = values.days > 1 ? fmtSigned(r.sensitivity.day) : "n/a";
    $("s-focus").textContent = values.focus > 10 ? fmtSigned(r.sensitivity.focus) : "n/a";

    showDecision(lastResult.decision, r.status);
  }

  function setInputs(source) {
    FIELD_IDS.forEach(function (id) { $(id).value = source[id] || ""; });
    render();
  }

  function currentInputs() {
    var out = {};
    FIELD_IDS.forEach(function (id) { out[id] = $(id).value.trim(); });
    return out;
  }

  // ---- Draft: localStorage and export ----

  var storageOk = (function () {
    try {
      var k = "__dw_probe__";
      window.localStorage.setItem(k, k);
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  })();

  function setDraftStatus(message, kind) {
    var el = $("draft-status");
    el.textContent = message;
    el.setAttribute("data-kind", kind || "");
  }

  function currentDraft() {
    return {
      name: $("d-name").value,
      goal: $("d-goal").value,
      notes: $("d-notes").value
    };
  }

  function buildSaved() {
    return { version: 1, savedAt: new Date().toISOString(), draft: currentDraft(), inputs: currentInputs() };
  }

  // Never trust stored data: accept only the expected shape and clip lengths.
  function validateSaved(obj) {
    if (!obj || obj.version !== 1 || typeof obj.draft !== "object" || typeof obj.inputs !== "object" || !obj.draft || !obj.inputs) {
      return null;
    }
    var draft = {};
    Object.keys(DRAFT_LIMITS).forEach(function (k) {
      var v = obj.draft[k];
      draft[k] = typeof v === "string" ? v.slice(0, DRAFT_LIMITS[k]) : "";
    });
    var inputs = {};
    FIELD_IDS.forEach(function (id) {
      var v = obj.inputs[id];
      inputs[id] = typeof v === "string" && /^[0-9.]{0,12}$/.test(v) ? v : "";
    });
    var savedAt = typeof obj.savedAt === "string" && !isNaN(Date.parse(obj.savedAt)) ? obj.savedAt : null;
    return { draft: draft, inputs: inputs, savedAt: savedAt };
  }

  function applySaved(saved) {
    $("d-name").value = saved.draft.name;
    $("d-goal").value = saved.draft.goal;
    $("d-notes").value = saved.draft.notes;
    setInputs(saved.inputs);
  }

  function when(iso) {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  function save() {
    if (!storageOk) return;
    var payload = buildSaved();
    var text = JSON.stringify(payload);
    try {
      window.localStorage.setItem(STORAGE_KEY, text);
      var readBack = window.localStorage.getItem(STORAGE_KEY);
      if (readBack !== text) throw new Error("readback mismatch");
      setDraftStatus("Saved and read back in this browser at " + when(payload.savedAt) + ".");
    } catch (e) {
      setDraftStatus("Couldn't save. Browser storage may be full or blocked. Use Export JSON to keep a copy.", "error");
    }
  }

  function remove() {
    if (!storageOk) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setDraftStatus("Saved draft deleted from this browser. The fields on screen are unchanged.");
    } catch (e) {
      setDraftStatus("Couldn't delete the saved draft. Browser storage is blocked.", "error");
    }
  }

  function restore() {
    if (!storageOk) return false;
    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      setDraftStatus("Couldn't read browser storage.", "error");
      return false;
    }
    if (raw === null) {
      setDraftStatus("No saved draft in this browser yet.");
      return false;
    }
    var saved = null;
    try { saved = validateSaved(JSON.parse(raw)); } catch (e) { saved = null; }
    if (!saved) {
      setDraftStatus("A saved draft was found but couldn't be read, so it was ignored. Saving will replace it.", "error");
      return false;
    }
    applySaved(saved);
    setDraftStatus("Restored the draft saved " + (saved.savedAt ? "on " + when(saved.savedAt) : "earlier") + " in this browser.");
    return true;
  }

  function exportJson() {
    var now = new Date();
    var payload = {
      source: "Delivery Workbench standalone demo (browser-local, no server)",
      exportedAt: now.toISOString(),
      draft: currentDraft(),
      inputs: currentInputs(),
      formula: {
        availableHours: "people × days × hours per day × focus %",
        commitCeiling: "available hours × " + COMMIT_RATIO,
        load: "planned hours ÷ available hours",
        bands: "under " + BAND_LOW + "% = room to add; " + BAND_LOW + "–" + BAND_HIGH + "% = within band; over " + BAND_HIGH + "% = overcommitted"
      },
      result: lastResult ? {
        availableHours: round1(lastResult.result.available),
        commitCeilingHours: round1(lastResult.result.ceiling),
        plannedHours: lastResult.result.planned,
        loadPercent: lastResult.result.load === null ? null : round1(lastResult.result.load),
        decision: lastResult.decision.head
      } : null
    };
    var fileName = "delivery-draft-" + now.toISOString().slice(0, 10) + ".json";
    try {
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      setDraftStatus("Exported " + fileName + (lastResult ? "." : ", without a result because the inputs aren't valid yet."));
    } catch (e) {
      setDraftStatus("Export failed in this browser.", "error");
    }
  }

  function round1(n) { return Math.round(n * 10) / 10; }

  // ---- Wiring ----

  $("calc").addEventListener("input", render);
  $("calc").addEventListener("submit", function (e) { e.preventDefault(); });
  $("example").addEventListener("click", function () { setInputs(EXAMPLE); });
  $("clear").addEventListener("click", function () { setInputs({}); $("people").focus(); });
  $("save").addEventListener("click", save);
  $("delete").addEventListener("click", remove);
  $("export").addEventListener("click", exportJson);

  if (!storageOk) {
    var note = $("storage-note");
    note.textContent = "Browser storage is unavailable here (private mode, or blocked by settings), so this draft can't be saved and will be lost when the page closes. Export JSON still works.";
    note.setAttribute("data-kind", "unavailable");
    $("save").disabled = true;
    $("delete").disabled = true;
  }

  if (!restore()) setInputs(EXAMPLE);
})();
