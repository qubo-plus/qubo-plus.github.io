/* Generated from demos/sched/app.js by demos/sync_docs_demos.py. Do not edit. */
// Machine Scheduling demo frontend (QUBO++ ABS3, CPU only)
// Data model and schedule computation: sched_core.js
'use strict';

const MACHINE_NAMES = ['Machine 1', 'Machine 2', 'Machine 3'];
const COLORS = [
  // no reddish colors: red marks late orders
  '#ffd6a5', '#caffbf', '#9bf6ff', '#bdb2ff', '#ffc6ff', '#fdffb6',
  '#a0c4ff', '#e9edc9', '#d0f4de', '#e4c1f9', '#cde7f0', '#b9fbc0',
  '#f1c0e8', '#cfbaf0', '#90dbf4', '#dde5b6',
];
const STORAGE_KEY = 'qbpp-sched-demo-v1';
const COOLDOWN_SEC = 3;
const LABEL_W = 112;

const state = {
  orders: [],        // [{id, due, time: [t1, t2, t3]}], minutes
  seq: [[], [], []], // processing order of each machine (order ids)
  objective: 'total', // 'total' (total processing time) or 'makespan'
  nextId: 1,
  ppm: null,         // pixels per minute (null = fit to width)
  solving: false,
  cooldown: 0,
  hover: -1,         // highlighted order index
  shownPpm: 1,       // pixels per minute of the chart on screen
  dragging: false,
};

const $ = (id) => document.getElementById(id);
const fmt = (x) => Number(x).toLocaleString('en-US');
const colorOf = (j) => COLORS[j % COLORS.length];
const OBJECTIVE_NAMES = { total: 'total processing time', makespan: 'makespan' };

// ── Orders and assignment ───────────────────────────────────────

// seqs[m] = order indices in processing order (null = all unassigned)
function loadOrders(list, seqs) {
  state.orders = list.map((o) => ({ id: state.nextId++, due: o.due, time: o.time.slice() }));
  setSequences(seqs);
}

function setSequences(seqs) {
  state.seq = [];
  for (let m = 0; m < MACHINE_COUNT; ++m)
    state.seq.push(seqs ? seqs[m].map((j) => state.orders[j].id) : []);
}

// Assignment in due-date order on each machine, as QUBO++ schedules it
function setAssignmentByEdd(assign) {
  setSequences(eddSequences(state.orders, assign));
}

function machineOf(id) {
  return state.seq.findIndex((seq) => seq.includes(id));
}

function sequenceIndices() {
  const index = new Map(state.orders.map((o, j) => [o.id, j]));
  return state.seq.map((seq) => seq.filter((id) => index.has(id)).map((id) => index.get(id)));
}

function schedule() {
  return computeSchedule(state.orders, sequenceIndices());
}

function removeOrder(id) {
  state.seq = state.seq.map((seq) => seq.filter((x) => x !== id));
}

// Put order j at position pos of machine m (m = -1: unassign)
function moveOrder(j, m, pos) {
  const id = state.orders[j].id;
  removeOrder(id);
  if (m >= 0) state.seq[m].splice(Math.max(0, Math.min(pos, state.seq[m].length)), 0, id);
}

// Assign order j to machine m at its due-date position (table selector)
function setAssign(j, m) {
  let pos = 0;
  if (m >= 0) {
    const due = state.orders[j].due;
    const index = new Map(state.orders.map((o, k) => [o.id, k]));
    const seq = state.seq[m].filter((id) => id !== state.orders[j].id);
    while (pos < seq.length) {
      const k = index.get(seq[pos]);
      if (state.orders[k].due > due || (state.orders[k].due === due && k > j)) break;
      ++pos;
    }
  }
  moveOrder(j, m, pos);
  setStatus('Assignment changed by hand.', '');
  render();
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

function renderSummary(s) {
  const n = state.orders.length;
  const complete = n > 0 && s.unassigned.length === 0;
  const feasible = complete && s.late === 0;
  const mk = state.objective === 'makespan';
  $('st-total').parentElement.classList.toggle('main', !mk);
  $('st-makespan').parentElement.classList.toggle('main', mk);
  setStat('st-total', n ? fmt(s.total) + ' min' : '–', feasible && !mk ? 'good' : '');
  setStat('st-late', n ? String(s.late) : '–', s.late > 0 ? 'bad' : (complete ? 'good' : ''));
  setStat('st-lateness', n ? fmt(s.lateness) + ' min' : '–', s.lateness > 0 ? 'bad' : (complete ? 'good' : ''));
  setStat('st-unassigned', n ? String(s.unassigned.length) : '–', s.unassigned.length > 0 ? 'bad' : '');
  setStat('st-makespan', n && s.tasks.length ? fmt(s.makespan) + ' min' : '–', feasible && mk ? 'good' : '');
  setStat('st-lb', n ? fmt(mk ? makespanLowerBound(state.orders) : lowerBound(state.orders)) + ' min' : '–', '');
  $('st-lb-box').title = mk
    ? 'Lower bound of the makespan: the fastest processing times spread evenly over the machines, or the longest of them'
    : 'Lower bound of the total processing time: every order on its fastest machine (ignoring due dates)';
  $('orders-count').textContent = String(n);
  renderLateList(s);
}

// Late orders with their due dates and finish times
function renderLateList(s) {
  const el = $('late-list');
  const late = s.tasks.filter((t) => t.late).sort((a, b) => a.j - b.j);
  el.classList.toggle('hidden', late.length === 0);
  el.innerHTML = '';
  if (late.length === 0) return;
  const head = document.createElement('span');
  head.className = 'late-head';
  head.textContent = 'Late orders:';
  el.appendChild(head);
  for (const t of late) {
    const o = state.orders[t.j];
    const chip = document.createElement('span');
    chip.className = 'late-chip';
    chip.dataset.j = String(t.j);
    chip.innerHTML = `<span class="swatch" style="background:${colorOf(t.j)}"></span>` +
      `<b>#${t.j + 1}</b> due ${o.due}, done ${t.end} on M${t.m + 1} <b>(+${t.end - o.due} min)</b>`;
    chip.addEventListener('mouseenter', () => setHover(t.j));
    chip.addEventListener('mouseleave', () => setHover(-1));
    el.appendChild(chip);
  }
}

// ── Gantt chart ─────────────────────────────────────────────────

function fitPpm(maxEnd) {
  const w = $('gantt-wrap').clientWidth - LABEL_W - 24;
  return Math.max(0.8, w / maxEnd);
}

function currentPpm(maxEnd) {
  return state.ppm === null ? fitPpm(maxEnd) : state.ppm;
}

function tickStep(ppm) {
  for (const s of [5, 10, 15, 30, 60, 120]) if (s * ppm >= 40) return s;
  return 120;
}

function gridStyle(track, ppm, step) {
  const minor = ppm * UNIT >= 6 ? UNIT : step;
  track.style.backgroundImage =
    `linear-gradient(to right, #d8d8d8 1px, transparent 1px),` +
    `linear-gradient(to right, #f0f0f0 1px, transparent 1px)`;
  track.style.backgroundSize = `${step * ppm}px 100%, ${minor * ppm}px 100%`;
}

function makeRow(label, sub, target, width) {
  const row = document.createElement('div');
  row.className = 'g-row';
  if (target !== null) row.dataset.target = target;
  const lbl = document.createElement('div');
  lbl.className = 'g-label';
  lbl.innerHTML = `<b>${label}</b>` + (sub ? `<span>${sub}</span>` : '');
  const track = document.createElement('div');
  track.className = 'g-track';
  if (width) track.style.width = width + 'px';
  row.appendChild(lbl);
  row.appendChild(track);
  return { row, track };
}

function taskTitle(j, t) {
  const o = state.orders[j];
  const lines = [`Order ${j + 1}`];
  if (t) {
    lines.push(`${MACHINE_NAMES[t.m]}: ${t.start}–${t.end} min (${t.end - t.start} min)`);
    lines.push(`Due ${o.due} min` + (t.late ? ` — late by ${t.end - o.due} min` : ' — on time'));
  } else {
    lines.push(`Unassigned, due ${o.due} min`);
  }
  lines.push('Processing time: ' + o.time.map((x, m) =>
    `M${m + 1} ${x > 0 ? x + ' min' : '—'}`).join(', '));
  return lines.join('\n');
}

function renderGantt(s) {
  const g = $('gantt');
  g.innerHTML = '';
  const maxEnd = Math.max(HORIZON, ...s.tasks.map((t) => t.end));
  const ppm = currentPpm(maxEnd);
  state.shownPpm = ppm;
  const width = Math.ceil(maxEnd * ppm) + 24;
  const step = tickStep(ppm);
  g.style.width = (LABEL_W + width) + 'px';

  // time axis
  const head = makeRow('minutes', '', null, width);
  head.row.classList.add('g-head');
  for (let m = 0; m <= maxEnd; m += step) {
    const tick = document.createElement('div');
    tick.className = 'g-tick';
    tick.style.left = (m * ppm) + 'px';
    tick.textContent = String(m);
    head.track.appendChild(tick);
  }
  g.appendChild(head.row);

  // machines
  for (let m = 0; m < MACHINE_COUNT; ++m) {
    const r = makeRow(MACHINE_NAMES[m], `busy ${fmt(s.loads[m])} min`, String(m), width);
    gridStyle(r.track, ppm, step);
    if (maxEnd > HORIZON) {
      const beyond = document.createElement('div');
      beyond.className = 'g-beyond';
      beyond.style.left = (HORIZON * ppm) + 'px';
      beyond.style.width = ((maxEnd - HORIZON) * ppm + 24) + 'px';
      r.track.appendChild(beyond);
    }
    for (const t of s.tasks.filter((x) => x.m === m)) r.track.appendChild(taskElement(t.j, t, ppm, r.track));
    placeLateLabels(r.track, ppm);
    g.appendChild(r.row);
  }

  // unassigned orders
  const u = makeRow('Unassigned', s.unassigned.length ? `${s.unassigned.length} orders` : '', 'un', width);
  u.row.classList.add('unassigned');
  for (const j of s.unassigned) u.track.appendChild(taskElement(j, null, ppm, null));
  g.appendChild(u.row);
}

// Labels of the due-date lines of late orders: in two lanes (top and bottom
// of the row) without overlapping; a line whose label fits in neither lane is
// drawn without a label (the late orders are also listed above the chart).
function placeLateLabels(track, ppm) {
  const marks = [...track.querySelectorAll('.late-mark')]
    .sort((a, b) => Number(a.dataset.due) - Number(b.dataset.due));
  const laneEnd = [-Infinity, -Infinity];
  for (const mark of marks) {
    const left = Number(mark.dataset.due) * ppm;
    const width = mark.dataset.label.length * 6 + 8;
    const lane = laneEnd.findIndex((e) => left >= e);
    mark.classList.toggle('lbl-bottom', lane === 1);
    mark.classList.toggle('no-lbl', lane < 0);
    if (lane >= 0) laneEnd[lane] = left + width;
  }
}

function taskElement(j, t, ppm, track) {
  const o = state.orders[j];
  const el = document.createElement('div');
  el.className = 'task';
  el.dataset.j = String(j);
  el.style.background = colorOf(j);
  el.title = taskTitle(j, t);
  if (t) {
    const w = (t.end - t.start) * ppm;
    el.style.left = (t.start * ppm) + 'px';
    el.style.width = Math.max(3, w - 1) + 'px';
    el.innerHTML = `<span class="t-line"><span class="t-id">#${j + 1}</span></span>` +
      `<span class="t-line">${t.start}–${t.end}</span>` +
      `<span class="t-line">due ${o.due}</span>`;
    if (t.late) {
      el.classList.add('late');
      const over = document.createElement('div');
      over.className = 't-over';
      over.style.width = Math.min(w, (t.end - Math.max(o.due, t.start)) * ppm) + 'px';
      el.appendChild(over);
    }
    // due date marker on the row: always for late orders (labels alternate
    // between the top and the bottom of the row), otherwise while highlighted
    const mark = document.createElement('div');
    mark.className = 'due-mark' + (t.late ? ' late-mark show' : (j === state.hover ? ' show' : ''));
    mark.style.left = (o.due * ppm) + 'px';
    mark.dataset.label = `due #${j + 1}: ${o.due}`;
    mark.dataset.due = String(o.due);
    mark.dataset.j = String(j);
    track.appendChild(mark);
  } else {
    el.innerHTML = `<span class="t-id">#${j + 1}</span>`;
  }
  if (j === state.hover) el.classList.add('hl');
  el.addEventListener('pointerdown', (ev) => startDrag(j, ev));
  el.addEventListener('mouseenter', () => { if (!state.dragging) setHover(j); });
  el.addEventListener('mouseleave', () => { if (!state.dragging) setHover(-1); });
  return el;
}

// Highlight an order in both the chart and the table
function setHover(j) {
  state.hover = j;
  document.querySelectorAll('.task').forEach((el) =>
    el.classList.toggle('hl', Number(el.dataset.j) === j));
  document.querySelectorAll('.due-mark').forEach((el) => {
    el.classList.toggle('show', Number(el.dataset.j) === j || el.classList.contains('late-mark'));
    el.classList.toggle('hl', Number(el.dataset.j) === j);
  });
  document.querySelectorAll('.late-chip').forEach((el) =>
    el.classList.toggle('hl', Number(el.dataset.j) === j));
  document.querySelectorAll('#orders-table tbody tr').forEach((tr) =>
    tr.classList.toggle('hl', Number(tr.dataset.j) === j));
}

// ── Drag and drop between machines ──────────────────────────────

function startDrag(j, ev) {
  if (state.solving || ev.button !== 0) return;
  ev.preventDefault();
  const o = state.orders[j];
  const src = ev.currentTarget;
  const ghost = $('drag-ghost');
  const x0 = ev.clientX;
  const y0 = ev.clientY;
  let moved = false;

  const rowAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest('.g-row[data-target]') : null;
  };
  const clearMarks = () => document.querySelectorAll('.g-row').forEach((r) =>
    r.classList.remove('drop-ok', 'drop-ng'));
  let dueLine = null;
  const canDrop = (target) => target === 'un' || o.time[Number(target)] > 0;
  const marker = document.createElement('div');
  marker.className = 'drop-marker';

  // Position in the processing order of the row's machine where the order
  // would be inserted (the other orders whose centre is left of x come first),
  // and the x coordinate of that gap within the track
  const insertAt = (row, x) => {
    const others = [...row.querySelectorAll('.task')].filter((el) => Number(el.dataset.j) !== j);
    let pos = 0;
    while (pos < others.length) {
      const r = others[pos].getBoundingClientRect();
      if (r.left + r.width / 2 > x) break;
      ++pos;
    }
    let left = 0;
    if (pos < others.length) left = others[pos].offsetLeft;
    else if (others.length > 0) left = others[others.length - 1].offsetLeft + others[others.length - 1].offsetWidth;
    return { pos, left };
  };

  function onMove(e) {
    if (!moved) {
      if (Math.abs(e.clientX - x0) < 4 && Math.abs(e.clientY - y0) < 4) return;
      moved = true;
      state.dragging = true;
      setHover(-1);
      src.classList.add('dragging');
      ghost.textContent = `#${j + 1}  due ${o.due}`;
      ghost.style.background = colorOf(j);
      ghost.classList.remove('hidden');
      dueLine = dragDueLine(o, j);
    }
    ghost.style.left = (e.clientX + 12) + 'px';
    ghost.style.top = (e.clientY + 10) + 'px';
    clearMarks();
    const row = rowAt(e.clientX, e.clientY);
    const ok = !row || canDrop(row.dataset.target);
    if (row) row.classList.add(ok ? 'drop-ok' : 'drop-ng');
    ghost.classList.toggle('ng', !ok);  // red X: the machine cannot process it
    if (row && ok && row.dataset.target !== 'un') {
      const track = row.querySelector('.g-track');
      marker.style.left = insertAt(row, e.clientX).left + 'px';
      if (marker.parentNode !== track) track.appendChild(marker);
    } else {
      marker.remove();
    }
  }

  function onUp(e) {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    ghost.classList.add('hidden');
    ghost.classList.remove('ng');
    marker.remove();
    state.dragging = false;
    src.classList.remove('dragging');
    clearMarks();
    if (dueLine) dueLine.remove();
    if (!moved) return;
    const row = rowAt(e.clientX, e.clientY);
    if (!row) return;
    const target = row.dataset.target;
    if (!canDrop(target)) {
      setStatus(`Order ${j + 1} cannot be processed on ${MACHINE_NAMES[Number(target)]}.`, 'err');
      return;
    }
    const before = JSON.stringify(state.seq);
    if (target === 'un') moveOrder(j, -1, 0);
    else moveOrder(j, Number(target), insertAt(row, e.clientX).pos);
    if (JSON.stringify(state.seq) === before) return;
    setStatus('Changed by hand.', '');
    render();
  }

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

// Vertical due-date line across all machine rows, shown while dragging
function dragDueLine(o, j) {
  const g = $('gantt');
  const rows = g.querySelectorAll('.g-row');
  const first = rows[1];
  const last = rows[MACHINE_COUNT];
  const line = document.createElement('div');
  line.className = 'drag-due';
  line.style.left = (LABEL_W + o.due * state.shownPpm) + 'px';
  line.style.top = first.offsetTop + 'px';
  line.style.height = (last.offsetTop + last.offsetHeight - first.offsetTop) + 'px';
  line.dataset.label = `due #${j + 1}: ${o.due}`;
  g.appendChild(line);
  return line;
}

// ── Orders table ────────────────────────────────────────────────

function parseMinutes(text, blankValue) {
  const s = String(text).trim();
  if (s === '') return blankValue;
  const v = Number(s);
  return Number.isFinite(v) ? v : NaN;
}

function validMinutes(v) {
  return Number.isInteger(v) && v >= UNIT && v <= HORIZON && v % UNIT === 0;
}

function numberInput(value, key, valid) {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = String(UNIT);
  input.max = String(HORIZON);
  input.step = String(UNIT);
  input.value = Number.isNaN(value) || value === 0 ? '' : String(value);
  input.dataset.key = key;
  input.disabled = state.solving;
  if (!valid) input.classList.add('invalid');
  return input;
}

function orderStatus(j, task) {
  const o = state.orders[j];
  const err = orderError(o);
  if (err) return { text: err, cls: 'st-late' };
  if (task && task.late) return { text: `late by ${task.end - o.due} min`, cls: 'st-late' };
  if (task) return { text: 'on time', cls: 'st-ok' };
  if (o.due < o.time[fastestMachine(o)]) return { text: 'cannot meet its due date', cls: 'st-warn' };
  return { text: 'unassigned', cls: 'st-none' };
}

function renderTable(s) {
  // keep the focus on the same input across re-rendering
  const active = document.activeElement;
  const focusKey = active && active.dataset ? active.dataset.key : null;

  const taskOf = new Map(s.tasks.map((t) => [t.j, t]));
  const tbody = document.querySelector('#orders-table tbody');
  tbody.innerHTML = '';
  state.orders.forEach((o, j) => {
    const t = taskOf.get(j) || null;
    const tr = document.createElement('tr');
    tr.dataset.j = String(j);
    if (orderError(o)) tr.classList.add('row-error');
    else if (t && t.late) tr.classList.add('row-late');
    if (j === state.hover) tr.classList.add('hl');

    const tdId = document.createElement('td');
    tdId.innerHTML = `<span class="swatch" style="background:${colorOf(j)}"></span>${j + 1}`;
    tr.appendChild(tdId);

    const tdDue = document.createElement('td');
    const dueIn = numberInput(o.due, `${o.id}:due`, validMinutes(o.due));
    dueIn.addEventListener('change', () => {
      o.due = parseMinutes(dueIn.value, NaN);
      renderSoon();
    });
    tdDue.appendChild(dueIn);
    tr.appendChild(tdDue);

    for (let m = 0; m < MACHINE_COUNT; ++m) {
      const td = document.createElement('td');
      if (t && t.m === m) td.className = 'assigned-cell';
      const v = o.time[m];
      const input = numberInput(v, `${o.id}:t${m}`, v === 0 || validMinutes(v));
      input.placeholder = '—';
      input.addEventListener('change', () => {
        o.time[m] = parseMinutes(input.value, 0);
        if (!(o.time[m] > 0) && machineOf(o.id) === m) removeOrder(o.id);
        renderSoon();
      });
      td.appendChild(input);
      tr.appendChild(td);
    }

    const tdSel = document.createElement('td');
    const sel = document.createElement('select');
    sel.dataset.key = `${o.id}:assign`;
    sel.disabled = state.solving;
    sel.add(new Option('—', '-1'));
    MACHINE_NAMES.forEach((name, m) => {
      const opt = new Option(name, String(m));
      opt.disabled = !(o.time[m] > 0);
      sel.add(opt);
    });
    sel.value = String(t ? t.m : -1);
    sel.addEventListener('change', () => setAssign(j, Number(sel.value)));
    tdSel.appendChild(sel);
    tr.appendChild(tdSel);

    const tdTime = document.createElement('td');
    tdTime.textContent = t ? `${t.start} – ${t.end}` : '';
    tr.appendChild(tdTime);

    const st = orderStatus(j, t);
    const tdSt = document.createElement('td');
    tdSt.className = st.cls;
    tdSt.textContent = st.text;
    tr.appendChild(tdSt);

    const tdDel = document.createElement('td');
    const del = document.createElement('button');
    del.className = 'del';
    del.title = 'Delete this order';
    del.textContent = '×';
    del.disabled = state.solving;
    del.addEventListener('click', () => {
      removeOrder(o.id);
      state.orders.splice(j, 1);
      state.hover = -1;
      render();
    });
    tdDel.appendChild(del);
    tr.appendChild(tdDel);

    tr.addEventListener('mouseenter', () => setHover(j));
    tr.addEventListener('mouseleave', () => setHover(-1));
    tbody.appendChild(tr);
  });

  if (focusKey) {
    const el = tbody.querySelector(`[data-key="${focusKey}"]`);
    if (el) el.focus();
  }
}

// ── Rendering and storage ───────────────────────────────────────

function render() {
  const s = schedule();
  renderSummary(s);
  renderGantt(s);
  renderTable(s);
  updateButtons();
  save();
}

// Re-render after the browser has moved the focus (Tab after editing a cell),
// so that renderTable() can put the focus back on the new input.
function renderSoon() {
  setTimeout(render, 0);
}

function updateButtons() {
  const busy = state.solving;
  for (const id of ['btn-sample', 'btn-random', 'btn-fastest', 'btn-clear', 'btn-add', 'random-count', 'solve-time', 'objective'])
    $(id).disabled = busy;
  $('btn-add').disabled = busy || state.orders.length >= MAX_ORDERS;
  $('btn-solve').disabled = busy || state.cooldown > 0 || state.orders.length === 0;
  $('btn-solve').textContent = busy ? 'Solving…' : 'Solve';
  $('cooldown-label').textContent = state.cooldown > 0 ? `${state.cooldown}s` : '';
  document.body.classList.toggle('solving', busy);
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      orders: state.orders.map((o) => ({ due: o.due, time: o.time })),
      seq: sequenceIndices(),
      objective: state.objective,
    }));
  } catch (e) { /* storage unavailable */ }
}

function restore() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!data || !Array.isArray(data.orders) || data.orders.length === 0) return false;
    if (data.objective === 'makespan' || data.objective === 'total') state.objective = data.objective;
    const orders = data.orders.slice(0, MAX_ORDERS).map((o) => ({
      due: Number(o.due),
      time: Array.from({ length: MACHINE_COUNT }, (_, m) => Number((o.time || [])[m]) || 0),
    }));
    const n = orders.length;
    const valid = (seqs) => Array.isArray(seqs) && seqs.length === MACHINE_COUNT &&
      seqs.every((q) => Array.isArray(q) && q.every((j) => Number.isInteger(j) && j >= 0 && j < n));
    if (valid(data.seq)) {
      loadOrders(orders, data.seq);
    } else {
      loadOrders(orders);
      // older format: the assignment only
      if (Array.isArray(data.assign) && data.assign.length === n) setAssignmentByEdd(data.assign.map(Number));
    }
    return true;
  } catch (e) {
    return false;
  }
}

// ── Solve (streaming NDJSON from the QUBO++ backend) ────────────

async function solve() {
  if (state.solving || state.orders.length === 0) return;
  const bad = state.orders.findIndex((o) => orderError(o));
  if (bad >= 0) {
    setStatus(`Order ${bad + 1}: ${orderError(state.orders[bad])}.`, 'err');
    return;
  }
  const ids = state.orders.map((o) => o.id);
  const timeLimit = Number($('solve-time').value);
  const body = JSON.stringify({
    orders: state.orders.map((o) => ({ due: o.due, time: o.time })),
    time: timeLimit,
    objective: state.objective,
  });

  state.solving = true;
  render();
  const t0 = performance.now();
  let best = null;
  const tick = () => {
    const sec = ((performance.now() - t0) / 1000).toFixed(1);
    const b = best ? ` — best so far: ` + (state.objective === 'makespan'
      ? `makespan ${fmt(best.makespan)} min, total processing time ${fmt(best.total)} min`
      : `total processing time ${fmt(best.total)} min`) +
      (best.late > 0 ? `, ${best.late} late (${fmt(best.lateness)} min)` : ', no late orders') +
      ` at ${best.tts.toFixed(3)} s` : '';
    setStatus(`Solving… ${sec} s${b}`, 'busy');
  };
  tick();
  const timer = setInterval(tick, 100);

  const apply = (ev) => {
    // the orders may not have changed, but keep the ids of the request
    const index = new Map(state.orders.map((o, j) => [o.id, j]));
    const assign = state.orders.map(() => -1);
    ev.assign.forEach((m, k) => { if (index.has(ids[k])) assign[index.get(ids[k])] = m; });
    setAssignmentByEdd(assign);
    best = ev;
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
    // window.QBPP_DEMO_API: the Lambda URL, set by the docs page (qubo-plus.github.io)
    const resp = await fetch(window.QBPP_DEMO_API ? window.QBPP_DEMO_API.replace(/\/$/, '') + '/solve' : 'solve', {
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
    finishStatus(result);
  } catch (e) {
    clearInterval(timer);
    setStatus('Error: ' + e.message, 'err');
  } finally {
    state.solving = false;
    startCooldown();
    render();
  }
}

function finishStatus(r) {
  if (r.unassigned > 0) {
    setStatus('Some orders could not be assigned. Try again with a longer time.', 'err');
    return;
  }
  const values = state.objective === 'makespan'
    ? `makespan ${fmt(r.makespan)} min, total processing time ${fmt(r.total)} min`
    : `total processing time ${fmt(r.total)} min`;
  if (r.late > 0) {
    setStatus(`QUBO++ found no schedule that meets every due date. Every order is assigned; ` +
      `${r.late} ${r.late === 1 ? 'order is' : 'orders are'} late by ${fmt(r.lateness)} min in total ` +
      `(highlighted in red), with ${values} (best solution found at ${r.tts.toFixed(3)} s).`, 'err');
  } else if (r.optimal) {
    setStatus(`Optimal: every order meets its due date and the ${OBJECTIVE_NAMES[state.objective]} ` +
      `reaches its lower bound; ${values} (found at ${r.tts.toFixed(3)} s).`, 'ok');
  } else {
    setStatus(`Done: every order meets its due date; ${values} ` +
      `(best solution found at ${r.tts.toFixed(3)} s).`, 'ok');
  }
}

function showModel(ev) {
  $('model-info').textContent = `— ${fmt(ev.variables)} binary` +
    (ev.integer_variables ? ` + ${ev.integer_variables} integer` : '') +
    ` variables, ${fmt(ev.constraints)} constraints, ` +
    `${fmt(ev.lateness_terms)} lateness terms (weight ${fmt(ev.late_weight)})`;
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

// ── Toolbar ─────────────────────────────────────────────────────

function init() {
  $('btn-sample').addEventListener('click', () => {
    loadOrders(SAMPLE_ORDERS);
    setStatus('Sample orders loaded. Try "Fastest machines", then "Solve".', '');
    render();
  });
  $('btn-random').addEventListener('click', () => {
    const n = Math.min(MAX_ORDERS, Math.max(3, Math.round(Number($('random-count').value) || 15)));
    $('random-count').value = String(n);
    loadOrders(generateOrders(n, (Date.now() ^ (Math.random() * 1e9)) >>> 0));
    setStatus(`${n} random orders generated (an assignment meeting every due date exists).`, '');
    render();
  });
  $('btn-fastest').addEventListener('click', () => {
    setAssignmentByEdd(state.orders.map(fastestMachine));
    const s = schedule();
    setStatus(s.late > 0
      ? `Every order on its fastest machine: ${s.late} orders are late. Press Solve to move orders so that ` +
        `they meet their due dates with the smallest ${OBJECTIVE_NAMES[state.objective]}.`
      : 'Every order on its fastest machine, and all meet their due dates.', s.late > 0 ? 'err' : 'ok');
    render();
  });
  $('btn-clear').addEventListener('click', () => {
    setSequences(null);
    setStatus('All orders unassigned.', '');
    render();
  });
  $('btn-add').addEventListener('click', () => {
    if (state.orders.length >= MAX_ORDERS) return;
    state.orders.push({ id: state.nextId++, due: 300, time: [60, 80, 100] });
    render();
  });
  $('btn-solve').addEventListener('click', solve);
  const shownPpm = () => currentPpm(Math.max(HORIZON, ...schedule().tasks.map((t) => t.end)));
  $('btn-zoom-in').addEventListener('click', () => { state.ppm = Math.min(12, shownPpm() * 1.5); render(); });
  $('btn-zoom-out').addEventListener('click', () => { state.ppm = Math.max(0.8, shownPpm() / 1.5); render(); });
  $('btn-zoom-fit').addEventListener('click', () => { state.ppm = null; render(); });
  window.addEventListener('resize', () => { if (state.ppm === null) renderGantt(schedule()); });

  $('objective').addEventListener('change', () => {
    state.objective = $('objective').value;
    setStatus(`Press Solve to find the assignment with the smallest ${OBJECTIVE_NAMES[state.objective]} ` +
      'that meets every due date.', '');
    render();
  });

  if (!restore()) loadOrders(SAMPLE_ORDERS);
  $('objective').value = state.objective;
  setStatus(`Press Solve to find the assignment with the smallest ${OBJECTIVE_NAMES[state.objective]} ` +
    'that meets every due date.', '');
  render();
}

init();
