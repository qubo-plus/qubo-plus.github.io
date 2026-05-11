// QUBO++ User Portal SPA — vanilla JS + amazon-cognito-identity-js.
// Hash routes: #/signup, #/verify, #/signin, #/forgot, #/dashboard, #/profile, #/account.

(function () {
  "use strict";

  const cfg = window.QBPP_PORTAL_CONFIG;
  if (!cfg || cfg.USER_POOL_ID.startsWith("REPLACE_ME")) {
    document.body.innerHTML =
      "<main style='padding:2rem'><h2>Portal not configured yet</h2>" +
      "<p>Run <code>setup_cognito.sh</code> and <code>deploy.sh</code>, then update <code>config.js</code>.</p></main>";
    return;
  }

  const userPool = new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: cfg.USER_POOL_ID,
    ClientId: cfg.APP_CLIENT_ID,
    Storage: window.sessionStorage,
  });

  // -------- helpers --------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function show(view) {
    document.querySelectorAll("[data-view]").forEach((el) => {
      el.hidden = el.dataset.view !== view;
    });
    document.querySelectorAll("nav#topnav [data-tab]").forEach((a) => {
      a.classList.toggle("active", a.dataset.tab === view);
    });
    // Wide layout for authenticated tabs that benefit from more horizontal
    // room (license cards, activation details).
    const wide = view === "dashboard" || view === "profile" || view === "account";
    document.getElementById("app").classList.toggle("wide", wide);
  }
  function setError(el, msg) {
    if (!msg) { el.hidden = true; el.textContent = ""; return; }
    el.hidden = false;
    el.textContent = msg;
  }
  function setInfo(el, msg) {
    if (!msg) { el.hidden = true; el.textContent = ""; return; }
    el.hidden = false;
    el.textContent = msg;
  }
  function disable(form, on) {
    form.querySelectorAll("button, input, textarea").forEach((b) => { b.disabled = on; });
  }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // Browsers (Chrome/Edge/Firefox/Safari) won't offer to save passwords for
  // SPA forms with preventDefault() + hash routing. The Credential Management
  // API lets us explicitly request save / update. No-ops on browsers that
  // lack PasswordCredential support.
  //
  // We try the form-based PasswordCredential(form) constructor first (which
  // Chrome's password manager treats more like a real form submission) and
  // fall back to the dictionary form. Logs to console for diagnosability.
  // Browsers won't reliably offer to save passwords for SPA forms with
  // preventDefault() + hash routing. Use the dictionary form of
  // PasswordCredential (the form-element form has stricter Chrome
  // validation that we can't always satisfy). Logs to console.
  async function saveCredential(email, password) {
    if (!window.PasswordCredential || !navigator.credentials || !navigator.credentials.store) {
      console.warn("[QUBO++] PasswordCredential API not available; password not saved.");
      return;
    }
    if (!email || !password) {
      console.warn("[QUBO++] saveCredential: missing email or password, skipping.");
      return;
    }
    try {
      const cred = new window.PasswordCredential({
        id: email,
        password: password,
        name: email,
      });
      const stored = await navigator.credentials.store(cred);
      console.log("[QUBO++] Credential stored:", stored ? stored.id : "(null result — Chrome may show key icon in address bar instead of a popup)");
    } catch (e) {
      console.warn("[QUBO++] saveCredential failed:", e);
    }
  }

  function getCurrentUser() { return userPool.getCurrentUser(); }

  function getValidSession() {
    return new Promise((resolve, reject) => {
      const u = getCurrentUser();
      if (!u) return reject(new Error("not signed in"));
      u.getSession((err, session) => {
        if (err || !session || !session.isValid()) {
          return reject(err || new Error("invalid session"));
        }
        resolve({ user: u, session });
      });
    });
  }

  function getUserAttrs(user) {
    return new Promise((resolve, reject) => {
      user.getUserAttributes((err, attrs) => {
        if (err) return reject(err);
        const out = {};
        (attrs || []).forEach((a) => { out[a.Name] = a.Value; });
        resolve(out);
      });
    });
  }

  // -------- Cognito flows --------
  function signUp({ email, password, first_name, last_name, organization, position, country, purpose, trial_code }) {
    const attrs = [
      new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "email", Value: email }),
      new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "given_name", Value: first_name }),
      new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "family_name", Value: last_name }),
      new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "custom:organization", Value: organization }),
      new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "custom:purpose", Value: purpose }),
      new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "custom:country", Value: country }),
    ];
    if (position) {
      attrs.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "custom:position", Value: position }));
    }
    const clientMetadata = trial_code ? { trial_code: trial_code } : null;
    return new Promise((resolve, reject) => {
      userPool.signUp(email, password, attrs, null, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }, clientMetadata);
    });
  }

  function confirmSignUp(email, code) {
    return new Promise((resolve, reject) => {
      const user = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: userPool, Storage: window.sessionStorage });
      user.confirmRegistration(code, true, (err, ok) => err ? reject(err) : resolve(ok));
    });
  }

  function resendCode(email) {
    return new Promise((resolve, reject) => {
      const user = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: userPool, Storage: window.sessionStorage });
      user.resendConfirmationCode((err, ok) => err ? reject(err) : resolve(ok));
    });
  }

  function signIn(email, password) {
    return new Promise((resolve, reject) => {
      const user = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: userPool, Storage: window.sessionStorage });
      const auth = new AmazonCognitoIdentity.AuthenticationDetails({ Username: email, Password: password });
      user.authenticateUser(auth, { onSuccess: resolve, onFailure: reject });
    });
  }

  function forgotPasswordRequest(email) {
    return new Promise((resolve, reject) => {
      const user = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: userPool, Storage: window.sessionStorage });
      user.forgotPassword({ onSuccess: resolve, onFailure: reject });
    });
  }

  function forgotPasswordConfirm(email, code, password) {
    return new Promise((resolve, reject) => {
      const user = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: userPool, Storage: window.sessionStorage });
      user.confirmPassword(code, password, { onSuccess: resolve, onFailure: reject });
    });
  }

  function changePassword(currentPw, newPw) {
    return new Promise(async (resolve, reject) => {
      try {
        const { user } = await getValidSession();
        user.changePassword(currentPw, newPw, (err, ok) => err ? reject(err) : resolve(ok));
      } catch (e) { reject(e); }
    });
  }

  function updateAttributes(updates) {
    return new Promise(async (resolve, reject) => {
      try {
        const { user } = await getValidSession();
        const attrs = Object.entries(updates).map(([k, v]) =>
          new AmazonCognitoIdentity.CognitoUserAttribute({ Name: k, Value: v })
        );
        user.updateAttributes(attrs, (err, ok) => err ? reject(err) : resolve(ok));
      } catch (e) { reject(e); }
    });
  }

  function verifyAttribute(attrName, code) {
    return new Promise(async (resolve, reject) => {
      try {
        const { user } = await getValidSession();
        user.verifyAttribute(attrName, code, { onSuccess: resolve, onFailure: reject });
      } catch (e) { reject(e); }
    });
  }

  function deleteCognitoUser() {
    return new Promise(async (resolve, reject) => {
      try {
        const { user } = await getValidSession();
        user.deleteUser((err, ok) => err ? reject(err) : resolve(ok));
      } catch (e) { reject(e); }
    });
  }

  // -------- API --------
  async function apiFetch(path, opts) {
    const { session } = await getValidSession();
    const idToken = session.getIdToken().getJwtToken();
    const r = await fetch(cfg.API_BASE.replace(/\/$/, "") + path, {
      method: (opts && opts.method) || "GET",
      headers: { "Authorization": "Bearer " + idToken, "Content-Type": "application/json" },
      body: opts && opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const text = await r.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }
    if (!r.ok) {
      const msg = (data && data.message) || `HTTP ${r.status}`;
      const e = new Error(msg);
      e.status = r.status;
      throw e;
    }
    return data;
  }

  // -------- Topnav --------
  function renderTopnav() {
    const u = getCurrentUser();
    const nav = $("#topnav");
    const sub = $("#subtitle");
    if (!u) {
      nav.hidden = true;
      sub.textContent = "Create your QUBO++ account. A Trial License is issued automatically.";
      return;
    }
    u.getSession((err, session) => {
      if (err || !session || !session.isValid()) { nav.hidden = true; return; }
      u.getUserAttributes((e2, attrs) => {
        if (!e2 && attrs) {
          const email = (attrs.find((a) => a.Name === "email") || {}).Value || "";
          $("#user-email").textContent = email;
        }
        nav.hidden = false;
        sub.textContent = "Self-service license portal.";
      });
    });
  }

  // -------- Dashboard --------
  function fmtDateTime(unix) {
    const d = new Date(unix * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  function fmtExpiry(item) {
    const now = Math.floor(Date.now() / 1000);
    if (item.suspended) return "Suspended";
    if (item.expiry && item.expiry > 0) {
      const ts = fmtDateTime(item.expiry);
      return item.expiry < now ? `Expired at: ${ts}` : `Expires at: ${ts}`;
    }
    // expiry not yet started — typical for admin-issued node_locked / floating
    // licenses where the v2 Lambda computes the deadline on first activate /
    // checkout. Show the configured duration so the user isn't surprised.
    if (item.expiry_days && item.expiry_days > 0) {
      const verb = (item.license_type === "floating") ? "first checkout" : "first activate";
      return `${item.expiry_days}-day window — clock starts on ${verb}`;
    }
    return "No expiry";
  }
  function isActive(lic) {
    const now = Math.floor(Date.now() / 1000);
    if (lic.suspended) return false;
    if (lic.expiry && lic.expiry > 0 && lic.expiry < now) return false;
    return true;
  }

  function renderLicense(lic) {
    const status = fmtExpiry(lic);
    const cls = isActive(lic) ? "active" : "inactive";
    const isPortalTrial = lic.source === "portal_trial";
    let renewBtn = "";
    if (isPortalTrial) {
      // Renew is gated server-side; the SPA mirrors the same check using
      // renew_available_at so the button explains itself before the click.
      const now = Math.floor(Date.now() / 1000);
      const avail = Number(lic.renew_available_at || 0);
      const expired = lic.expiry && lic.expiry > 0 && lic.expiry < now;
      const allowed = expired || !avail || now >= avail;
      if (allowed) {
        renewBtn = `<button type="button" class="secondary" data-renew="1" title="Delete this key and issue a new one">Renew</button>`;
      } else {
        const dt = fmtDateTime(avail);
        renewBtn = `<button type="button" class="secondary" data-renew="1" disabled title="Renew available from ${escapeHTML(dt)}">Renew</button>`;
      }
    }
    const note = lic.user_note || "";
    const noteId = "note-" + encodeURIComponent(lic.license_key).replace(/[^A-Za-z0-9]/g, "_");
    return `
      <div class="license-card ${cls}">
        <h3>${escapeHTML(lic.license_name || lic.license_type || "License")}</h3>
        <div class="key-row">
          <code>${escapeHTML(lic.license_key)}</code>
          <button type="button" class="secondary" data-copy="${escapeHTML(lic.license_key)}">Copy</button>
          ${renewBtn}
        </div>
        <div class="meta"><strong>Type:</strong> ${escapeHTML(lic.license_type || "node_locked")}</div>
        <div class="meta"><strong>Limits:</strong> ${fmtVarCount(lic.max_var_count)} CPU vars / ${fmtVarCount(lic.gpu_max_var_count)} GPU vars</div>
        <div class="meta"><strong>Status:</strong> ${escapeHTML(status)}</div>
        <div class="memo-row">
          <strong>Memo:</strong>
          <input type="text" class="memo-input" maxlength="100"
                 data-note-key="${escapeHTML(lic.license_key)}"
                 data-note-orig="${escapeHTML(note)}"
                 id="${noteId}"
                 value="${escapeHTML(note)}"
                 placeholder="Optional note (max 100 chars, visible to admin)">
          <span class="memo-counter" data-note-counter="${escapeHTML(lic.license_key)}">${[...note].length}/100</span>
          <button type="button" class="secondary memo-save" data-note-save="${escapeHTML(lic.license_key)}" disabled>Save</button>
          <span class="memo-status" data-note-status="${escapeHTML(lic.license_key)}"></span>
        </div>
      </div>`;
  }

  // Per-license memo: wire up input change → enable Save, click → POST, optimistic.
  // Counter uses [...str].length to count Unicode code points, matching the
  // server's Python len() which also counts code points. Surrogate pairs count
  // as 2 (one each), so a single 😀 = 2 — predictable and matches the input's
  // built-in maxlength attribute.
  function bindMemoEditors(container) {
    container.querySelectorAll(".memo-input").forEach((input) => {
      const key = input.dataset.noteKey;
      const orig = input.dataset.noteOrig || "";
      const counter = container.querySelector(`[data-note-counter="${cssEsc(key)}"]`);
      const saveBtn = container.querySelector(`[data-note-save="${cssEsc(key)}"]`);
      const status = container.querySelector(`[data-note-status="${cssEsc(key)}"]`);
      const refresh = () => {
        const v = input.value;
        if (counter) counter.textContent = v.length + "/100";
        const dirty = v !== orig;
        if (saveBtn) saveBtn.disabled = !dirty;
        if (status && dirty) status.textContent = "";
      };
      input.addEventListener("input", refresh);
      refresh();
      if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
          saveBtn.disabled = true;
          const orig2 = saveBtn.textContent;
          saveBtn.textContent = "Saving…";
          if (status) { status.textContent = ""; status.className = "memo-status"; }
          try {
            await apiFetch("/me/licenses/note", {
              method: "POST",
              body: { license_key: key, note: input.value },
            });
            // Update baseline so subsequent edits compare against new value.
            input.dataset.noteOrig = input.value;
            saveBtn.textContent = orig2;
            if (status) {
              status.textContent = "Saved";
              status.className = "memo-status memo-saved";
              setTimeout(() => { if (status.textContent === "Saved") status.textContent = ""; }, 2000);
            }
            refresh();
          } catch (e) {
            saveBtn.textContent = orig2;
            saveBtn.disabled = false;
            if (status) {
              status.textContent = "Error: " + (e.message || "save failed");
              status.className = "memo-status memo-error";
            }
          }
        });
      }
    });
  }

  // CSS.escape polyfill-ish — only needed for our attribute selectors above.
  function cssEsc(s) { return (s + "").replace(/(["\\])/g, "\\$1"); }

  async function renewLicense(btn) {
    if (!confirm(
      "This will permanently delete your current Trial License key and any " +
      "machine activations bound to it, then issue a fresh Trial License key " +
      "under your account. Continue?"
    )) return;
    btn.disabled = true;
    const orig = btn.textContent;
    btn.textContent = "Renewing…";
    try {
      const data = await apiFetch("/me/trial/renew", { method: "POST" });
      await loadDashboard();
      alert("New license issued: " + data.license_key);
    } catch (e) {
      btn.disabled = false;
      btn.textContent = orig;
      alert("Could not renew: " + e.message);
    }
  }

  // Negative values are an "unlimited" sentinel from the C++ client; cap them
  // to the QUBO++ vindex_t maximum (2^31 - 1) for human display.
  const MAX_VAR_DISPLAY = 2147483647;
  function fmtVarCount(n) {
    const num = Number(n);
    if (!Number.isFinite(num) || num < 0 || num >= MAX_VAR_DISPLAY) {
      return MAX_VAR_DISPLAY.toLocaleString();
    }
    return num.toLocaleString();
  }

  function fmtIsoLocal(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return fmtDateTime(Math.floor(d.getTime() / 1000));
  }

  function renderActivation(act, licenseLabelMap) {
    const labelInfo = (licenseLabelMap && licenseLabelMap[act.license_key]) || {};
    const licName = labelInfo.name || "(unnamed)";
    const licenseLine = `${escapeHTML(licName)} · <code>${escapeHTML(act.license_key)}</code>`;
    const isFloating = act.kind === "floating_session";

    // Label per row type: node-locked is permanent until explicit deactivate;
    // floating is a transient session keyed by session_id.
    const lastVerifiedLabel = isFloating ? "Last Heartbeat" : "Last Verified";
    const startedLabel       = isFloating ? "Checked Out"   : "Activated";
    const lastVerifiedTs = fmtIsoLocal(act.last_verified);
    const startedTs      = fmtIsoLocal(act.activated_at);
    const buttonLabel    = isFloating ? "Release" : "Deactivate";
    // For floating: only show button while the session is still in lease.
    const buttonHtml = (isFloating && !act.session_active)
      ? ""
      : `<button type="button" class="secondary deactivate-btn"
            data-license="${escapeHTML(act.license_key)}"
            data-machine="${escapeHTML(act.machine_id)}"
            data-floating="${isFloating ? "1" : "0"}">${buttonLabel}</button>`;

    let statusBadge = "";
    if (isFloating) {
      statusBadge = act.session_active
        ? ` <span class="meta-tag tag-active">Active session · ${act.lease_remaining_seconds}s lease left</span>`
        : ` <span class="meta-tag tag-inactive">Last checkout (released)</span>`;
    }

    return `
      <div class="activation-row${isFloating ? " floating-row" : ""}">
        ${buttonHtml}
        <div class="meta-stack">
          <div class="host-row">
            <strong>${escapeHTML(act.hostname || "(unknown host)")}</strong>
            <span class="muted">${escapeHTML(act.user || "(unknown user)")}</span>
            ${statusBadge}
          </div>
          <div class="meta"><strong>License:</strong> ${licenseLine}</div>
          <div class="meta"><strong>${startedLabel}:</strong> ${escapeHTML(startedTs)}</div>
          <div class="meta"><strong>${lastVerifiedLabel}:</strong> ${escapeHTML(lastVerifiedTs)}</div>
          <div class="meta"><strong>IP:</strong> ${escapeHTML(act.ip || "-")}${act.country ? " (" + escapeHTML(act.country) + ")" : ""}</div>
          <div class="meta"><strong>OS:</strong> ${escapeHTML(act.os || "-")}</div>
          <div class="meta"><strong>CPU:</strong> ${escapeHTML(act.cpu || "-")}</div>
          <div class="meta"><strong>GPU:</strong> ${escapeHTML(act.gpu || "-")}</div>
          <div class="meta"><strong>RAM:</strong> ${escapeHTML(act.ram || "-")}</div>
        </div>
      </div>`;
  }

  async function loadDashboard() {
    show("dashboard");
    renderTopnav();
    const loading = $("#dashboard-loading");
    const empty = $("#dashboard-empty");
    const list = $("#license-list");
    const actions = $("#dashboard-actions");
    const acts = $("#activations-list");
    loading.hidden = false; empty.hidden = true; list.hidden = true; actions.hidden = true;
    list.innerHTML = "";

    let data = null;  // Hoisted so the Activations block can read data.licenses
    try {
      data = await apiFetch("/me/licenses");
      const hasActive = (data.licenses || []).some(isActive);
      if (!hasActive) {
        // Heal the case where PostConfirmation trigger failed, or user was missing one
        try {
          await apiFetch("/trial/issue", { method: "POST" });
          data = await apiFetch("/me/licenses");
        } catch (_) { /* show empty + retry button */ }
      }
      loading.hidden = true;
      const licenses = data.licenses || [];
      if (licenses.length === 0) {
        empty.hidden = false;
      } else {
        list.innerHTML = licenses.map(renderLicense).join("");
        list.hidden = false;
        list.querySelectorAll("[data-copy]").forEach((btn) => {
          btn.addEventListener("click", () => {
            navigator.clipboard.writeText(btn.dataset.copy).then(() => {
              const orig = btn.textContent;
              btn.textContent = "Copied";
              setTimeout(() => { btn.textContent = orig; }, 1500);
            });
          });
        });
        list.querySelectorAll("[data-renew]").forEach((btn) => {
          btn.addEventListener("click", () => renewLicense(btn));
        });
        bindMemoEditors(list);
        // Show "Issue a new trial" only when the user has no active trial
        actions.hidden = hasActive;
      }
    } catch (e) {
      loading.hidden = true;
      empty.hidden = false;
      setError($("#issue-error"), "Could not load licenses: " + e.message);
    }

    // Activations
    acts.innerHTML = "Loading…";
    try {
      const aData = await apiFetch("/me/activations");
      if (!aData.activations || aData.activations.length === 0) {
        acts.innerHTML = '<p class="muted">No activated machines yet.</p>';
      } else {
        // Build a lookup map license_key -> { name } so each activation can
        // show which license it belongs to.
        const licenseMap = {};
        for (const lic of (data && data.licenses) || []) {
          licenseMap[lic.license_key] = { name: lic.license_name };
        }
        acts.innerHTML = aData.activations
          .map((a) => renderActivation(a, licenseMap))
          .join("");
        acts.querySelectorAll(".deactivate-btn").forEach((btn) => {
          btn.addEventListener("click", () => deactivate(btn));
        });
      }
    } catch (e) {
      acts.innerHTML = `<p class="error">Could not load activations: ${escapeHTML(e.message)}</p>`;
    }
  }

  async function deactivate(btn) {
    const isFloating = btn.dataset.floating === "1";
    const verb = isFloating ? "Release this Floating session" : "Deactivate this machine";
    if (!confirm(`${verb}?\n\n${btn.dataset.machine.slice(0,16)}…`)) return;
    btn.disabled = true; btn.textContent = isFloating ? "Releasing…" : "Deactivating…";
    try {
      await apiFetch("/me/activations/delete", {
        method: "POST",
        body: { license_key: btn.dataset.license, machine_id: btn.dataset.machine },
      });
      await loadDashboard();
    } catch (e) {
      btn.disabled = false; btn.textContent = "Deactivate";
      alert("Failed: " + e.message);
    }
  }

  // -------- Profile --------
  async function loadProfile() {
    show("profile");
    renderTopnav();
    const f = $("#profile-form");
    setError($("#profile-error"), ""); setInfo($("#profile-info"), "");
    try {
      const { user } = await getValidSession();
      const a = await getUserAttrs(user);
      f.email.value = a["email"] || "";
      f.first_name.value = a["given_name"] || "";
      f.last_name.value = a["family_name"] || "";
      f.organization.value = a["custom:organization"] || "";
      f.position.value = a["custom:position"] || "";
      f.country.value = a["custom:country"] || "";
      f.purpose.value = a["custom:purpose"] || "";
    } catch (e) {
      setError($("#profile-error"), "Could not load profile: " + e.message);
    }
  }

  // -------- Account: change password / email / delete --------
  async function changeEmailRequest(newEmail) {
    await updateAttributes({ email: newEmail });
    // Cognito sends verification code to the new email
  }
  async function confirmEmailChange(code) {
    await verifyAttribute("email", code);
  }

  async function deleteAccount() {
    // 1. Lambda: suspend portal_trial licenses + drop their activations
    try {
      await apiFetch("/me/account/delete", { method: "POST" });
    } catch (e) {
      throw new Error("Could not suspend licenses: " + e.message);
    }
    // 2. Cognito: remove the user (after Lambda success)
    await deleteCognitoUser();
    const u = getCurrentUser();
    if (u) u.signOut();
  }

  // -------- Routing --------
  function route() {
    const hash = location.hash || "#/signin";
    const u = getCurrentUser();
    const authedRoutes = ["#/dashboard", "#/profile", "#/account"];

    if (hash.startsWith("#/dashboard")) {
      if (!u) { location.hash = "#/signin"; return; }
      loadDashboard();
    } else if (hash.startsWith("#/profile")) {
      if (!u) { location.hash = "#/signin"; return; }
      loadProfile();
    } else if (hash.startsWith("#/account")) {
      if (!u) { location.hash = "#/signin"; return; }
      show("account"); renderTopnav();
      // Reset account section
      $("#email-form").hidden = false;
      $("#email-verify-form").hidden = true;
      ["password-error","password-info","email-error","email-verify-error","email-verify-info","delete-error"].forEach((id) => setError($("#" + id), ""));
    } else if (hash.startsWith("#/verify")) {
      const params = new URLSearchParams(hash.split("?")[1] || "");
      $("#verify-email").textContent = params.get("email") || "";
      show("verify"); renderTopnav();
    } else if (hash.startsWith("#/forgot")) {
      $("#forgot-request-form").hidden = false;
      $("#forgot-confirm-form").hidden = true;
      show("forgot"); renderTopnav();
    } else if (hash.startsWith("#/signup")) {
      if (u) { location.hash = "#/dashboard"; return; }
      show("signup"); renderTopnav();
    } else {
      // Default: signin. If already signed in, send to dashboard.
      if (u) { location.hash = "#/dashboard"; return; }
      show("signin"); renderTopnav();
    }
  }

  window.addEventListener("hashchange", route);

  // -------- Form bindings --------
  $("#signup-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#signup-error"), "");
    disable(f, true);
    const data = {
      trial_code: f.trial_code.value.trim().toUpperCase(),
      email: f.email.value.trim().toLowerCase(),
      password: f.password.value,
      first_name: f.first_name.value.trim(),
      last_name: f.last_name.value.trim(),
      organization: f.organization.value.trim(),
      position: f.position.value.trim(),
      country: f.country.value.trim(),
      purpose: f.purpose.value.trim(),
    };
    try {
      await signUp(data);
      await saveCredential(data.email, data.password);
      location.hash = "#/verify?email=" + encodeURIComponent(data.email);
    } catch (e) {
      setError($("#signup-error"), e.message || "Sign up failed.");
    } finally { disable(f, false); }
  });

  $("#verify-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#verify-error"), ""); setInfo($("#verify-info"), "");
    disable(f, true);
    const email = $("#verify-email").textContent.trim();
    try {
      await confirmSignUp(email, f.code.value.trim());
      location.hash = "#/signin";
    } catch (e) {
      setError($("#verify-error"), e.message || "Verification failed.");
    } finally { disable(f, false); }
  });

  $("#resend-btn").addEventListener("click", async () => {
    const email = $("#verify-email").textContent.trim();
    setError($("#verify-error"), ""); setInfo($("#verify-info"), "");
    try {
      await resendCode(email);
      setInfo($("#verify-info"), "A new code was sent.");
    } catch (e) {
      setError($("#verify-error"), e.message || "Could not resend code.");
    }
  });

  $("#signin-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#signin-error"), "");
    disable(f, true);
    const email = f.email.value.trim().toLowerCase();
    const password = f.password.value;
    try {
      await signIn(email, password);
      await saveCredential(email, password);
      location.hash = "#/dashboard";
    } catch (e) {
      setError($("#signin-error"), e.message || "Sign in failed.");
    } finally { disable(f, false); }
  });

  $("#forgot-request-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#forgot-request-error"), "");
    disable(f, true);
    const email = f.email.value.trim().toLowerCase();
    try {
      await forgotPasswordRequest(email);
      $("#forgot-email").textContent = email;
      f.hidden = true;
      $("#forgot-confirm-form").hidden = false;
    } catch (e) {
      setError($("#forgot-request-error"), e.message || "Could not start reset.");
    } finally { disable(f, false); }
  });

  $("#forgot-confirm-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#forgot-confirm-error"), "");
    disable(f, true);
    const email = $("#forgot-email").textContent.trim();
    const newPassword = f.password.value;
    try {
      await forgotPasswordConfirm(email, f.code.value.trim(), newPassword);
      // Sign the user in immediately with the new password and jump to the
      // dashboard. Otherwise browser autofill on /signin can replay the old
      // saved password and look like the reset failed.
      try {
        await signIn(email, newPassword);
        await saveCredential(email, newPassword);
        location.hash = "#/dashboard";
      } catch (signInErr) {
        // Fallback: just send them to signin with their freshly set credentials.
        await saveCredential(email, newPassword);
        location.hash = "#/signin";
      }
    } catch (e) {
      setError($("#forgot-confirm-error"), e.message || "Reset failed.");
    } finally { disable(f, false); }
  });

  $("#btn-dashboard-refresh").addEventListener("click", async () => {
    const btn = $("#btn-dashboard-refresh");
    btn.disabled = true;
    const orig = btn.textContent;
    btn.textContent = "Refreshing…";
    try {
      await loadDashboard();
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  });

  $("#redeem-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#redeem-error"), ""); setInfo($("#redeem-info"), "");
    const code = f.code.value.trim().toUpperCase();
    if (!code) return;
    disable(f, true);
    try {
      const data = await apiFetch("/me/activation/redeem",
        { method: "POST", body: { code: code } });
      setInfo($("#redeem-info"),
        "License issued: " + data.license_key + " — refreshing your dashboard…");
      f.code.value = "";
      await loadDashboard();
    } catch (e) {
      setError($("#redeem-error"), e.message || "Could not redeem code.");
    } finally {
      disable(f, false);
    }
  });

  $("#issue-btn").addEventListener("click", async () => {
    setError($("#issue-error"), "");
    const btn = $("#issue-btn");
    btn.disabled = true;
    try {
      await apiFetch("/trial/issue", { method: "POST" });
      await loadDashboard();
    } catch (e) {
      setError($("#issue-error"), e.message || "Could not issue Trial License.");
    } finally { btn.disabled = false; }
  });

  $("#reissue-btn").addEventListener("click", async () => {
    if (!confirm("Issue a new Trial License? Your previous Trial License must be expired or suspended.")) return;
    const btn = $("#reissue-btn");
    btn.disabled = true;
    try {
      const data = await apiFetch("/trial/issue", { method: "POST" });
      alert("New license issued: " + data.license_key);
      await loadDashboard();
    } catch (e) {
      alert("Could not issue: " + e.message);
    } finally { btn.disabled = false; }
  });

  $("#profile-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#profile-error"), ""); setInfo($("#profile-info"), "");
    disable(f, true);
    try {
      await updateAttributes({
        "given_name": f.first_name.value.trim(),
        "family_name": f.last_name.value.trim(),
        "custom:organization": f.organization.value.trim(),
        "custom:position": f.position.value.trim(),
        "custom:country": f.country.value.trim(),
        "custom:purpose": f.purpose.value.trim(),
      });
      setInfo($("#profile-info"), "Profile saved.");
    } catch (e) {
      setError($("#profile-error"), e.message || "Save failed.");
    } finally { disable(f, false); }
  });

  $("#password-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#password-error"), ""); setInfo($("#password-info"), "");
    disable(f, true);
    const newPassword = f.next.value;
    try {
      await changePassword(f.current.value, newPassword);
      try {
        const { user } = await getValidSession();
        const attrs = await getUserAttrs(user);
        if (attrs.email) await saveCredential(attrs.email, newPassword);
      } catch (_) { /* credential save failure is non-fatal */ }
      setInfo($("#password-info"), "Password updated.");
      f.reset();
    } catch (e) {
      setError($("#password-error"), e.message || "Change failed.");
    } finally { disable(f, false); }
  });

  $("#email-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#email-error"), "");
    disable(f, true);
    const newEmail = f.email.value.trim().toLowerCase();
    try {
      await changeEmailRequest(newEmail);
      $("#email-pending").textContent = newEmail;
      f.hidden = true;
      $("#email-verify-form").hidden = false;
    } catch (e) {
      setError($("#email-error"), e.message || "Could not start change.");
    } finally { disable(f, false); }
  });

  $("#email-verify-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#email-verify-error"), ""); setInfo($("#email-verify-info"), "");
    disable(f, true);
    try {
      await confirmEmailChange(f.code.value.trim());
      setInfo($("#email-verify-info"), "Email updated. You may need to sign in again.");
      // Refresh topnav with new email
      renderTopnav();
    } catch (e) {
      setError($("#email-verify-error"), e.message || "Verification failed.");
    } finally { disable(f, false); }
  });

  $("#delete-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#delete-error"), "");
    if (!confirm("Permanently delete your account? Licenses will be suspended. This cannot be undone.")) return;
    disable(f, true);
    try {
      await deleteAccount();
      alert("Account deleted.");
      location.hash = "#/signup";
      setTimeout(route, 0);
    } catch (e) {
      setError($("#delete-error"), e.message || "Delete failed.");
      disable(f, false);
    }
  });

  $("#signout-btn").addEventListener("click", () => {
    const u = getCurrentUser();
    if (u) u.signOut();
    location.hash = "#/signin";
    setTimeout(route, 0);
  });

  route();
})();
