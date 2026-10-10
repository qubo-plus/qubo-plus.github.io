/* Generated from demos/shift/app.js by demos/sync_docs_demos.py. Do not edit. */
// Shift Scheduling demo frontend (QUBO++ ABS3, CPU only)
// Data model and rule checks: shift_core.js
'use strict';

const STORAGE_KEY = 'qbpp-shift-demo-v1';
const COOLDOWN_SEC = 3;

const state = {
  staff: [],         // [{id, name, kind}]
  off: new Set(),    // requested days off, "id:d"
  shift: new Map(),  // id -> [28] of 0 off / 1 day / 2 night / 3 both (none = not scheduled)
  req: SAMPLE.req.slice(),
  maxRun: SAMPLE.maxRun,
  nextId: 1,
  solving: false,
  cooldown: 0,
};

const $ = (id) => document.getElementById(id);
const fmt = (x) => Number(x).toLocaleString('en-US');
const cellKey = (id, d) => id + ':' + d;
const violationsText = (n) => `${n} rule violation${n === 1 ? '' : 's'}`;

// ── Data ────────────────────────────────────────────────────────

function loadData(data) {
  state.staff = data.staff.slice(0, MAX_STAFF).map((s) => ({
    id: state.nextId++, name: String(s.name).slice(0, 20), kind: KIND_NAMES[s.kind] ? s.kind : 'E',
  }));
  setOff(data.off || []);
  state.shift = new Map();
  if (Array.isArray(data.shift)) {
    data.shift.forEach((row, i) => {
      if (typeof row === 'string' && row.length === DAYS && i < state.staff.length)
        state.shift.set(state.staff[i].id, Array.from(row).map(Number));
    });
  }
  state.req = Array.isArray(data.req) && data.req.length === 4 ? data.req.map(Number) : SAMPLE.req.slice();
  state.maxRun = Number(data.maxRun) || SAMPLE.maxRun;
  syncSettings();
}

function setOff(pairs) {
  state.off = new Set();
  for (const [i, d] of pairs)
    if (i >= 0 && i < state.staff.length && d >= 0 && d < DAYS) state.off.add(cellKey(state.staff[i].id, d));
}

function isOffIdx(i, d) {
  return state.off.has(cellKey(state.staff[i].id, d));
}

function hasSchedule() {
  return state.staff.some((s) => state.shift.has(s.id));
}

function shiftRows() {
  return state.staff.map((s) => state.shift.get(s.id) || new Array(DAYS).fill(0));
}

function evaluateNow() {
  return evaluate(state.staff.map((s) => s.kind), isOffIdx, shiftRows(), state.req, state.maxRun);
}

function syncSettings() {
  for (let k = 0; k < 4; ++k) $('req-' + k).value = String(state.req[k]);
  $('max-run').value = String(state.maxRun);
}

// ── Status and summary ──────────────────────────────────────────

function setStatus(text, cls) {
  const el = $('status');
  el.textContent = text;
  el.className = 'status' + (cls ? ' ' + cls : '');
}

function setStat(id, text, cls) {
  const el = $(id);
  el.textContent = text;
  el.parentElement.classList.remove('good', 'bad');
  if (cls) el.parentElement.classList.add(cls);
}

function range(values) {
  return values.length ? `${Math.min(...values)} – ${Math.max(...values)}` : '–';
}

function renderSummary(ev) {
  const lb = lowerBound(state.staff.length, state.req);
  setStat('st-lb', state.staff.length ? fmt(lb) : '–', '');
  if (!hasSchedule()) {
    for (const id of ['st-viol', 'st-obj', 'st-work', 'st-nights', 'st-holiday']) setStat(id, '–', '');
    return;
  }
  setStat('st-viol', String(ev.violations), ev.violations ? 'bad' : 'good');
  setStat('st-obj', fmt(ev.objective), ev.violations ? '' : 'good');
  setStat('st-work', range(ev.people.map((p) => p.work)), '');
  setStat('st-nights', range(ev.people.map((p) => p.nights)), '');
  setStat('st-holiday', range(ev.people.map((p) => p.holiday)), '');
}

// ── Roster table ────────────────────────────────────────────────

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function renderTable(ev) {
  const table = $('roster');
  table.innerHTML = '';
  const scheduled = hasSchedule();

  // dates and day types
  const thead = el('thead');
  const r1 = el('tr');
  const r2 = el('tr');
  r1.appendChild(el('th', 'name-col', 'Staff'));
  r2.appendChild(el('th', 'name-col'));
  for (let d = 0; d < DAYS; ++d) {
    const we = isWeekend(d) ? ' weekend' : '';
    const h = el('th', 'day-head' + we);
    h.innerHTML = `<b>${d + 1}</b>${DAY_NAMES[d % 7]}`;
    r1.appendChild(h);
    const t = el('th', we.trim());
    t.appendChild(el('span', 'daytype' + (we ? ' we' : ''), we ? 'Weekend' : 'Weekday'));
    r2.appendChild(t);
  }
  thead.appendChild(r1);
  thead.appendChild(r2);
  table.appendChild(thead);

  // staff rows
  const tbody = el('tbody');
  state.staff.forEach((s, i) => {
    const tr = el('tr');
    const name = el('td', 'name-col');
    const line = el('div', 'staff-name');
    const input = el('input');
    input.type = 'text';
    input.value = s.name;
    input.maxLength = 20;
    input.disabled = state.solving;
    input.addEventListener('change', () => { s.name = input.value.slice(0, 20); save(); });
    const kind = el('select');
    for (const k of ['M', 'S', 'E']) kind.add(new Option(KIND_NAMES[k], k));
    kind.value = s.kind;
    kind.className = 'kind kind-' + s.kind;
    kind.disabled = state.solving;
    kind.addEventListener('change', () => { s.kind = kind.value; render(); });
    const del = el('button', 'del', '×');
    del.title = 'Remove this staff member';
    del.disabled = state.solving;
    del.addEventListener('click', () => removeStaff(i));
    line.appendChild(input);
    line.appendChild(kind);
    line.appendChild(del);
    name.appendChild(line);
    const p = ev.people[i];
    const stats = el('div', 'staff-stats');
    stats.innerHTML = state.shift.has(s.id)
      ? `Work <b>${p.work}</b> · Paid leave ${p.leave}<br>Night <b>${p.nights}</b> · Holiday <b>${p.holiday}</b>`
      : `Not scheduled · Paid leave ${p.leave}`;
    name.appendChild(stats);
    tr.appendChild(name);

    const row = state.shift.get(s.id);
    for (let d = 0; d < DAYS; ++d) {
      const we = isWeekend(d);
      const td = el('td', 'cell' + (we ? ' weekend' : ''));
      td.dataset.i = String(i);
      td.dataset.d = String(d);
      const off = isOffIdx(i, d);
      td.appendChild(el('span', 'req' + (off ? ' on' : ''), off ? (we ? 'No work' : 'Leave') : '—'));
      if (row) {
        const v = row[d];
        const [cls, text] = v === 1 ? ['day', 'Day'] : v === 2 ? ['night', 'Night'] : v === 3 ? ['both', 'Both'] : ['off', 'Off'];
        td.appendChild(el('span', 'tag ' + cls, text));
      }
      const reason = ev.cells.get(i + ':' + d);
      const tips = [`${s.name}, day ${d + 1} (${DAY_NAMES[d % 7]})`,
        off ? (we ? 'No holiday work (click to remove)' : 'Paid leave (click to remove)')
          : (we ? 'Click: no holiday work on this day' : 'Click: paid leave on this day')];
      if (reason && row) {
        td.classList.add('bad');
        tips.push('Rule broken: ' + reason);
      }
      td.title = tips.join('\n');
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // staffing of each shift
  const tfoot = el('tfoot');
  ['Day shift', 'Night shift'].forEach((label, s) => {
    const tr = el('tr');
    tr.appendChild(el('td', 'name-col foot-label', label));
    for (let d = 0; d < DAYS; ++d) {
      const we = isWeekend(d);
      const need = required(state.req, d, s);
      const day = ev.days[d];
      const td = el('td', 'count' + (we ? ' weekend' : '') + (scheduled && ev.staffing[d][s] ? ' short' : ''));
      if (scheduled) {
        td.innerHTML = `${day.count[s]}/${need}` + (day.lead[s] ? '<span class="lead">★</span>' : '');
        const leader = s === 0 && !we ? 'a manager' : 'a manager or a skilled worker';
        td.title = `${label}, day ${d + 1}: ${day.count[s]} staff (exactly ${need} required), ` +
          (day.lead[s] ? `with ${leader}` : `without ${leader}`);
      } else {
        td.textContent = `–/${need}`;
      }
      tr.appendChild(td);
    }
    tfoot.appendChild(tr);
  });
  table.appendChild(tfoot);
}

function toggleOff(i, d) {
  if (state.solving) return;
  const s = state.staff[i];
  const k = cellKey(s.id, d);
  if (state.off.has(k)) {
    state.off.delete(k);
  } else {
    state.off.add(k);
    const row = state.shift.get(s.id);
    if (row) row[d] = 0;  // a requested day off is not worked
  }
  setStatus('Requests changed. Press Solve to update the schedule.', '');
  render();
}

function removeStaff(i) {
  if (state.solving) return;
  const s = state.staff[i];
  for (let d = 0; d < DAYS; ++d) state.off.delete(cellKey(s.id, d));
  state.shift.delete(s.id);
  state.staff.splice(i, 1);
  render();
}

// ── Rendering and storage ───────────────────────────────────────

function render() {
  const ev = evaluateNow();
  renderSummary(ev);
  renderTable(ev);
  updateButtons();
  save();
}

function updateButtons() {
  const busy = state.solving;
  for (const id of ['btn-sample', 'btn-random', 'btn-clear', 'solve-time', 'req-0', 'req-1', 'req-2', 'req-3', 'max-run'])
    $(id).disabled = busy;
  $('btn-add').disabled = busy || state.staff.length >= MAX_STAFF;
  $('btn-solve').disabled = busy || state.cooldown > 0 || state.staff.length === 0;
  $('btn-solve').textContent = busy ? 'Solving…' : 'Solve';
  $('cooldown-label').textContent = state.cooldown > 0 ? `${state.cooldown}s` : '';
  document.body.classList.toggle('solving', busy);
}

function offPairs() {
  const pairs = [];
  state.staff.forEach((s, i) => {
    for (let d = 0; d < DAYS; ++d) if (state.off.has(cellKey(s.id, d))) pairs.push([i, d]);
  });
  return pairs;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      staff: state.staff.map((s) => ({ name: s.name, kind: s.kind })),
      off: offPairs(),
      shift: state.staff.map((s) => (state.shift.has(s.id) ? state.shift.get(s.id).join('') : null)),
      req: state.req,
      maxRun: state.maxRun,
    }));
  } catch (e) { /* storage unavailable */ }
}

function restore() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!data || !Array.isArray(data.staff) || data.staff.length === 0) return false;
    loadData(data);
    return true;
  } catch (e) {
    return false;
  }
}

// ── Solve (streaming NDJSON from the QUBO++ backend) ────────────

async function solve() {
  if (state.solving || state.staff.length === 0) return;
  const n = state.staff.length;
  if (state.req.some((r) => !Number.isInteger(r) || r < 0 || r > n)) {
    setStatus(`Required staff must be whole numbers between 0 and ${n} (the number of staff).`, 'err');
    return;
  }
  const ids = state.staff.map((s) => s.id);
  const lb = lowerBound(n, state.req);
  const body = JSON.stringify({
    staff: state.staff.map((s) => s.kind),
    off: offPairs(),
    req: state.req,
    max_run: state.maxRun,
    time: Number($('solve-time').value),
  });

  state.solving = true;
  render();
  const t0 = performance.now();
  let best = null;
  const tick = () => {
    const sec = ((performance.now() - t0) / 1000).toFixed(1);
    const b = best ? ` — best so far: ${violationsText(best.violations)}, fairness ${fmt(best.objective)} ` +
      `(lower bound ${fmt(lb)}) at ${best.tts.toFixed(3)} s` : '';
    setStatus(`Solving… ${sec} s${b}`, 'busy');
  };
  tick();
  const timer = setInterval(tick, 100);

  const apply = (ev) => {
    ev.shift.forEach((row, i) => state.shift.set(ids[i], Array.from(row).map(Number)));
    const e = evaluateNow();
    best = { violations: e.violations, objective: e.objective, tts: ev.tts };
    render();
  };

  let result = null;
  const handle = (ev) => {
    if (ev.type === 'model') showModel(ev);
    else if (ev.type === 'progress') apply(ev);
    else if (ev.type === 'result') { apply(ev); result = ev; }
    else if (ev.type === 'error') throw new Error(ev.error || 'Solver error');
  };

  try {
    // window.QBPP_DEMO_API: the Lambda URL, set by a page on another site
    const api = window.QBPP_DEMO_API ? window.QBPP_DEMO_API.replace(/\/$/, '') + '/solve' : 'solve';
    const resp = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    });
    if (!resp.ok) {
      let msg = `HTTP ${resp.status}`;
      try { msg = (await resp.json()).error || msg; } catch (e) { /* not JSON */ }
      throw new Error(msg);
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (value) buf += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (line) handle(JSON.parse(line));
      }
      if (done) break;
    }
    if (buf.trim()) handle(JSON.parse(buf));
    clearInterval(timer);
    if (!result) throw new Error('No result from the solver');
    finishStatus(result, lb);
  } catch (e) {
    clearInterval(timer);
    setStatus('Error: ' + e.message, 'err');
  } finally {
    state.solving = false;
    startCooldown();
    render();
  }
}

function finishStatus(r, lb) {
  const ev = evaluateNow();
  const work = range(ev.people.map((p) => p.work));
  const nights = range(ev.people.map((p) => p.nights));
  const holiday = range(ev.people.map((p) => p.holiday));
  if (ev.violations > 0) {
    setStatus(`QUBO++ found no roster that follows every rule: ${violationsText(ev.violations)} remain (in red). ` +
      'Try fewer requests, more staff, or other requirements.', 'err');
  } else if (r.optimal) {
    setStatus(`Optimal: every rule is met and the fairness reaches its lower bound ${fmt(lb)} ` +
      `(found at ${r.tts.toFixed(3)} s). Per person: working days ${work}, night shifts ${nights}, holiday work ${holiday}.`, 'ok');
  } else {
    setStatus(`Done: every rule is met; fairness ${fmt(ev.objective)} (lower bound ${fmt(lb)}), ` +
      `per person: working days ${work}, night shifts ${nights}, holiday work ${holiday} (best found at ${r.tts.toFixed(3)} s).`, 'ok');
  }
}

function showModel(ev) {
  $('model-info').textContent = `— ${fmt(ev.variables)} binary variables, ${fmt(ev.constraints)} constraints ` +
    `(weight ${fmt(ev.weight)})`;
  $('model-expr').textContent = ev.expr;
}

function startCooldown() {
  state.cooldown = COOLDOWN_SEC;
  const iv = setInterval(() => {
    state.cooldown -= 1;
    if (state.cooldown <= 0) { state.cooldown = 0; clearInterval(iv); }
    updateButtons();
  }, 1000);
}

// ── Toolbar and settings ────────────────────────────────────────

function init() {
  $('btn-sample').addEventListener('click', () => {
    loadData(SAMPLE);
    setStatus('Sample loaded: 15 staff with a few requested days off. Press Solve.', '');
    render();
  });
  $('btn-random').addEventListener('click', () => {
    setOff(randomOff(state.staff.length, (Date.now() ^ (Math.random() * 1e9)) >>> 0));
    state.shift = new Map();
    setStatus('Random requests set. Press Solve.', '');
    render();
  });
  $('btn-add').addEventListener('click', () => {
    if (state.staff.length >= MAX_STAFF) return;
    const used = new Set(state.staff.map((s) => s.name));
    const name = EXTRA_NAMES.find((x) => !used.has(x)) || `Staff ${state.staff.length + 1}`;
    state.staff.push({ id: state.nextId++, name: name, kind: 'E' });
    setStatus(`${name} added. Press Solve to schedule.`, '');
    render();
  });
  $('btn-clear').addEventListener('click', () => {
    state.shift = new Map();
    setStatus('Schedule cleared (the requests are kept).', '');
    render();
  });
  $('btn-solve').addEventListener('click', solve);
  for (let k = 0; k < 4; ++k) {
    $('req-' + k).addEventListener('change', () => {
      state.req[k] = Math.max(0, Math.round(Number($('req-' + k).value) || 0));
      $('req-' + k).value = String(state.req[k]);
      render();
    });
  }
  $('max-run').addEventListener('change', () => {
    state.maxRun = Math.min(13, Math.max(1, Math.round(Number($('max-run').value) || 6)));
    $('max-run').value = String(state.maxRun);
    render();
  });
  $('roster').addEventListener('click', (e) => {
    const td = e.target.closest('td.cell');
    if (td) toggleOff(Number(td.dataset.i), Number(td.dataset.d));
  });

  if (!restore()) loadData(SAMPLE);
  setStatus('Click cells to request days off, then press Solve.', '');
  render();
}

init();
