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
      sub.textContent = "Sign up to receive a free trial license key.";
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
  function fmtExpiry(item) {
    const now = Math.floor(Date.now() / 1000);
    if (item.suspended) return "Suspended";
    if (item.expiry && item.expiry > 0) {
      const d = new Date(item.expiry * 1000).toISOString().slice(0, 10);
      return item.expiry < now ? `Expired (${d})` : `Expires ${d}`;
    }
    if (item.expiry_days) {
      return `${item.expiry_days}-day window starts on first \`qbpp-license activate\``;
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
    return `
      <div class="license-card ${cls}">
        <h3>${escapeHTML(lic.license_name || lic.license_type || "License")}</h3>
        <div class="key-row">
          <code>${escapeHTML(lic.license_key)}</code>
          <button type="button" class="secondary" data-copy="${escapeHTML(lic.license_key)}">Copy</button>
        </div>
        <div class="meta"><strong>Type:</strong> ${escapeHTML(lic.license_type || "node_locked")}</div>
        <div class="meta"><strong>Limits:</strong> ${lic.max_var_count.toLocaleString()} CPU vars / ${lic.gpu_max_var_count.toLocaleString()} GPU vars</div>
        <div class="meta"><strong>Status:</strong> ${escapeHTML(status)}</div>
      </div>`;
  }

  function renderActivation(act) {
    const lastSeen = act.last_verified
      ? new Date(act.last_verified).toISOString().slice(0, 10)
      : (act.activated_at ? new Date(act.activated_at).toISOString().slice(0, 10) : "?");
    const id = `${act.license_key}::${act.machine_id}`;
    return `
      <div class="activation-row">
        <div class="meta-stack">
          <div><strong>${escapeHTML(act.hostname || "(unknown host)")}</strong>
            <span class="muted">${escapeHTML(act.os || "")}</span></div>
          <div class="muted small">user=${escapeHTML(act.user || "?")} · last verified=${escapeHTML(lastSeen)}</div>
          <div class="muted small">key=${escapeHTML(act.license_key)} · machine=${escapeHTML(act.machine_id.slice(0,12))}…</div>
        </div>
        <button type="button" class="secondary deactivate-btn"
          data-license="${escapeHTML(act.license_key)}"
          data-machine="${escapeHTML(act.machine_id)}">Deactivate</button>
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

    try {
      let data = await apiFetch("/me/licenses");
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
        acts.innerHTML = '<p class="muted">No activated machines. Run <code>qbpp-license activate &lt;KEY&gt;</code> on a Linux machine to use a license key.</p>';
      } else {
        acts.innerHTML = aData.activations.map(renderActivation).join("");
        acts.querySelectorAll(".deactivate-btn").forEach((btn) => {
          btn.addEventListener("click", () => deactivate(btn));
        });
      }
    } catch (e) {
      acts.innerHTML = `<p class="error">Could not load activations: ${escapeHTML(e.message)}</p>`;
    }
  }

  async function deactivate(btn) {
    if (!confirm(`Deactivate this machine?\n\n${btn.dataset.machine.slice(0,16)}…`)) return;
    btn.disabled = true; btn.textContent = "Deactivating…";
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
    const hash = location.hash || "#/signup";
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
    } else if (hash === "#/signin") {
      show("signin"); renderTopnav();
    } else {
      // Default: signup. But if signed in, send to dashboard.
      if (u && hash === "#/signup") { location.hash = "#/dashboard"; return; }
      show("signup"); renderTopnav();
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
      position: f.position.value,
      country: f.country.value.trim(),
      purpose: f.purpose.value.trim(),
    };
    try {
      await signUp(data);
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
    try {
      await signIn(f.email.value.trim().toLowerCase(), f.password.value);
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
    try {
      await forgotPasswordConfirm(email, f.code.value.trim(), f.password.value);
      location.hash = "#/signin";
    } catch (e) {
      setError($("#forgot-confirm-error"), e.message || "Reset failed.");
    } finally { disable(f, false); }
  });

  $("#issue-btn").addEventListener("click", async () => {
    setError($("#issue-error"), "");
    const btn = $("#issue-btn");
    btn.disabled = true;
    try {
      await apiFetch("/trial/issue", { method: "POST" });
      await loadDashboard();
    } catch (e) {
      setError($("#issue-error"), e.message || "Could not issue trial.");
    } finally { btn.disabled = false; }
  });

  $("#reissue-btn").addEventListener("click", async () => {
    if (!confirm("Issue a new trial license? Your previous trial must be expired or suspended.")) return;
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
        "custom:position": f.position.value,
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
    try {
      await changePassword(f.current.value, f.next.value);
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
