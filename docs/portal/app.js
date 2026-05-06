// QUBO++ User Portal SPA — vanilla JS + amazon-cognito-identity-js.
// State machine: hash routes (#/signup, #/verify, #/signin, #/dashboard).
//
// Flow: signUp -> email verification code -> signIn -> dashboard
//   On dashboard load: GET /me/licenses; if empty, POST /trial/issue then re-fetch.
//   Tokens stored in sessionStorage (cleared on tab close).

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
  }
  function setError(el, msg) {
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

  // -------- Cognito calls --------
  function signUp({ email, password, organization, purpose, country }) {
    const attrs = [
      new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "email", Value: email }),
      new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "custom:organization", Value: organization }),
      new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "custom:purpose", Value: purpose }),
    ];
    if (country) {
      attrs.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "custom:country", Value: country }));
    }
    return new Promise((resolve, reject) => {
      userPool.signUp(email, password, attrs, null, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
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
      user.authenticateUser(auth, {
        onSuccess: resolve,
        onFailure: reject,
      });
    });
  }

  // -------- API calls --------
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

  // -------- Views --------
  function renderTopnav() {
    const u = getCurrentUser();
    const nav = $("#topnav");
    if (!u) { nav.hidden = true; return; }
    u.getSession((err, session) => {
      if (err || !session) { nav.hidden = true; return; }
      u.getUserAttributes((e2, attrs) => {
        if (!e2 && attrs) {
          const email = (attrs.find((a) => a.Name === "email") || {}).Value || "";
          $("#user-email").textContent = email;
        }
        nav.hidden = false;
      });
    });
  }

  function fmtExpiry(item) {
    if (item.expiry && item.expiry > 0) {
      return "Expires " + new Date(item.expiry * 1000).toISOString().slice(0, 10);
    }
    if (item.expiry_days) {
      return `Activates a ${item.expiry_days}-day window on first \`qbpp-license activate\``;
    }
    return "No expiry";
  }

  function renderLicense(lic) {
    const tpl = `
      <div class="license-card">
        <h3>${escapeHTML(lic.license_name || lic.license_type || "License")}</h3>
        <div class="key-row">
          <code id="lk-${escapeHTML(lic.license_key)}">${escapeHTML(lic.license_key)}</code>
          <button type="button" class="secondary" data-copy="${escapeHTML(lic.license_key)}">Copy</button>
        </div>
        <div class="meta"><strong>Type:</strong> ${escapeHTML(lic.license_type || "node_locked")}</div>
        <div class="meta"><strong>Limit:</strong> ${lic.max_var_count.toLocaleString()} CPU vars / ${lic.gpu_max_var_count.toLocaleString()} GPU vars</div>
        <div class="meta"><strong>Status:</strong> ${escapeHTML(fmtExpiry(lic))}</div>
        ${lic.suspended ? '<div class="error">This license has been suspended.</div>' : ""}
      </div>`;
    return tpl;
  }

  async function loadDashboard() {
    show("dashboard");
    renderTopnav();
    const loading = $("#dashboard-loading");
    const empty = $("#dashboard-empty");
    const list = $("#license-list");
    loading.hidden = false; empty.hidden = true; list.hidden = true; list.innerHTML = "";
    try {
      let data = await apiFetch("/me/licenses");
      if (!data.licenses || data.licenses.length === 0) {
        // Heal the case where PostConfirmation trigger failed
        try {
          await apiFetch("/trial/issue", { method: "POST" });
          data = await apiFetch("/me/licenses");
        } catch (e) {
          // Fall through and show empty state with retry button
        }
      }
      loading.hidden = true;
      if (data.licenses && data.licenses.length > 0) {
        list.innerHTML = data.licenses.map(renderLicense).join("");
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
      } else {
        empty.hidden = false;
      }
    } catch (e) {
      loading.hidden = true;
      empty.hidden = false;
      setError($("#issue-error"), "Could not load licenses: " + e.message);
    }
  }

  // -------- Routing --------
  function route() {
    const hash = location.hash || "#/signup";
    const u = getCurrentUser();
    // If already signed in, jump to dashboard unless explicitly viewing other auth pages
    if (u && hash !== "#/signin" && hash !== "#/signup" && hash !== "#/verify") {
      loadDashboard();
      return;
    }
    if (hash.startsWith("#/verify")) {
      const params = new URLSearchParams(hash.split("?")[1] || "");
      $("#verify-email").textContent = params.get("email") || "";
      show("verify");
    } else if (hash === "#/signin") {
      show("signin");
    } else if (hash === "#/dashboard") {
      if (!u) { location.hash = "#/signin"; return; }
      loadDashboard();
    } else {
      show("signup");
    }
    renderTopnav();
  }

  window.addEventListener("hashchange", route);

  // -------- Form bindings --------
  $("#signup-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#signup-error"), "");
    disable(f, true);
    const data = {
      email: f.email.value.trim().toLowerCase(),
      password: f.password.value,
      organization: f.organization.value.trim(),
      purpose: f.purpose.value.trim(),
      country: f.country.value.trim(),
    };
    try {
      await signUp(data);
      location.hash = "#/verify?email=" + encodeURIComponent(data.email);
    } catch (e) {
      setError($("#signup-error"), e.message || "Sign up failed.");
    } finally {
      disable(f, false);
    }
  });

  $("#verify-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    setError($("#verify-error"), "");
    setError($("#verify-info"), "");
    disable(f, true);
    const email = $("#verify-email").textContent.trim();
    const code = f.code.value.trim();
    try {
      await confirmSignUp(email, code);
      location.hash = "#/signin";
    } catch (e) {
      setError($("#verify-error"), e.message || "Verification failed.");
    } finally {
      disable(f, false);
    }
  });

  $("#resend-btn").addEventListener("click", async () => {
    const email = $("#verify-email").textContent.trim();
    setError($("#verify-error"), "");
    setError($("#verify-info"), "");
    try {
      await resendCode(email);
      const info = $("#verify-info");
      info.hidden = false;
      info.textContent = "A new code was sent.";
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
      location.hash = "#/dashboard";
    } catch (e) {
      setError($("#signin-error"), e.message || "Sign in failed.");
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
      setError($("#issue-error"), e.message || "Could not issue trial.");
    } finally {
      btn.disabled = false;
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
