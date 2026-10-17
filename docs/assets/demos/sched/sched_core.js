/* Generated from demos/sched/sched_core.js by demos/sync_docs_demos.py. Do not edit. */
// Machine scheduling demo: data model shared by the page and the tests.
// Plain functions only (no DOM), so that node can run them as well.
//
// An order is {id, due, time: [t1, t2, t3]} with all times in minutes;
// time[m] = 0 means machine m cannot process the order.

'use strict';

const UNIT = 5;          // time grid (minutes)
const HORIZON = 600;     // planning horizon (minutes)
const MACHINE_COUNT = 3;
const MAX_ORDERS = 50;

// Default sample data (processing times in minutes, 0 = cannot process).
// generateOrders(12, 9): putting every order on its fastest machine makes
// 10 of the 12 orders late.
const SAMPLE_ORDERS = [
  { due: 250, time: [0, 75, 0] },
  { due: 170, time: [95, 0, 160] },
  { due: 320, time: [90, 0, 140] },
  { due: 405, time: [65, 0, 0] },
  { due: 190, time: [95, 155, 155] },
  { due: 355, time: [85, 95, 0] },
  { due: 360, time: [40, 60, 80] },
  { due: 225, time: [85, 120, 135] },
  { due: 480, time: [80, 130, 145] },
  { due: 100, time: [100, 100, 0] },
  { due: 300, time: [110, 135, 175] },
  { due: 500, time: [90, 150, 0] },
];

// Deterministic random numbers (mulberry32)
function makeRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundToUnit(x) {
  return Math.max(UNIT, Math.round(x / UNIT) * UNIT);
}

// Random orders that have a schedule meeting all due dates, while putting
// every order on its fastest machine misses some of them: machine 1 is the
// fastest, so it gets overloaded.
//   1. processing times: a base time per order times a speed factor per
//      machine (1.0, 1.3, 1.6) with +-15% noise; each machine can process an
//      order with probability 0.7 (at least one machine per order)
//   2. a hidden schedule: orders in random order, each on the processable
//      machine that finishes it first
//   3. due date = finish time in the hidden schedule + 0..40 min
function generateOrders(n, seed) {
  const rnd = makeRandom(seed);
  const speed = [1.0, 1.3, 1.6];
  const avg = Math.min(80, Math.max(20, 940 / n));
  let orders = [];
  for (let j = 0; j < n; ++j) {
    const base = avg * (0.5 + rnd());
    let can = speed.map(() => rnd() < 0.7);
    if (!can.some(Boolean)) can[Math.floor(rnd() * MACHINE_COUNT)] = true;
    const time = speed.map((s, m) =>
      can[m] ? Math.min(300, roundToUnit(base * s * (0.85 + 0.3 * rnd()))) : 0);
    orders.push({ due: 0, time: time });
  }
  const perm = orders.map((_, j) => j);
  for (let i = n - 1; i > 0; --i) {
    const k = Math.floor(rnd() * (i + 1));
    const t = perm[i]; perm[i] = perm[k]; perm[k] = t;
  }
  // Shrink the processing times until the hidden schedule ends by 540 min
  for (;;) {
    const load = new Array(MACHINE_COUNT).fill(0);
    for (const j of perm) {
      let best = -1;
      for (let m = 0; m < MACHINE_COUNT; ++m) {
        const t = orders[j].time[m];
        if (t > 0 && (best < 0 || load[m] + t < load[best] + orders[j].time[best]))
          best = m;
      }
      load[best] += orders[j].time[best];
      orders[j].due = load[best];
    }
    const makespan = Math.max.apply(null, load);
    if (makespan <= 540) break;
    const f = 540 / makespan;
    for (const o of orders)
      o.time = o.time.map((t) => (t > 0 ? roundToUnit(t * f) : 0));
  }
  for (const o of orders)
    o.due = Math.min(HORIZON, o.due + UNIT * Math.floor(rnd() * 9));
  return orders;
}

// Problems with an order that the solver cannot fix (null if none)
function orderError(o) {
  const ok = (t) => Number.isInteger(t) && t >= UNIT && t <= HORIZON && t % UNIT === 0;
  if (!ok(o.due)) return 'due date must be a multiple of 5 between 5 and 600';
  for (const t of o.time)
    if (t !== 0 && !ok(t)) return 'processing time must be a multiple of 5 between 5 and 600';
  if (!o.time.some((t) => t > 0)) return 'no machine can process it';
  return null;
}

// Machine with the shortest processing time (-1 if none)
function fastestMachine(o) {
  let best = -1;
  for (let m = 0; m < o.time.length; ++m)
    if (o.time[m] > 0 && (best < 0 || o.time[m] < o.time[best])) best = m;
  return best;
}

// Processing order of each machine for an assignment (assign[j] = machine
// or -1): due-date order (ties by position), as QUBO++ schedules it.
// Returns seqs[m] = order indices.
function eddSequences(orders, assign) {
  const seqs = [];
  for (let m = 0; m < MACHINE_COUNT; ++m) seqs.push([]);
  orders.forEach((o, j) => {
    const m = assign[j];
    if (m >= 0 && m < MACHINE_COUNT) seqs[m].push(j);
  });
  for (const seq of seqs) seq.sort((a, b) => orders[a].due - orders[b].due || a - b);
  return seqs;
}

// Schedule for the processing order of each machine (seqs[m] = order
// indices): each machine processes its orders in that order without gaps.
// Orders in no sequence, or on a machine that cannot process them, are
// unassigned. Returns {tasks: [{j, m, start, end, late}], unassigned: [j],
// total, lateness (sum of the lateness of the late orders), makespan, late,
// loads}.
function computeSchedule(orders, seqs) {
  const tasks = [];
  const loads = new Array(MACHINE_COUNT).fill(0);
  const placed = new Array(orders.length).fill(false);
  let total = 0;
  let late = 0;
  let lateness = 0;
  for (let m = 0; m < MACHINE_COUNT; ++m) {
    let t = 0;
    for (const j of seqs[m]) {
      if (placed[j] || !(orders[j].time[m] > 0)) continue;
      placed[j] = true;
      const start = t;
      t += orders[j].time[m];
      const isLate = t > orders[j].due;
      if (isLate) {
        ++late;
        lateness += t - orders[j].due;
      }
      tasks.push({ j: j, m: m, start: start, end: t, late: isLate });
      total += orders[j].time[m];
    }
    loads[m] = t;
  }
  const unassigned = [];
  placed.forEach((p, j) => { if (!p) unassigned.push(j); });
  return {
    tasks: tasks, unassigned: unassigned, total: total, late: late, lateness: lateness,
    makespan: Math.max.apply(null, loads), loads: loads,
  };
}

// Sum of the shortest processing times: no schedule can do better
function lowerBound(orders) {
  let lb = 0;
  for (const o of orders) {
    const m = fastestMachine(o);
    if (m >= 0) lb += o.time[m];
  }
  return lb;
}

// Makespan lower bound: the fastest processing times spread evenly over the
// machines (rounded up to the time grid), or the longest such time
function makespanLowerBound(orders) {
  let sum = 0;
  let longest = 0;
  for (const o of orders) {
    const m = fastestMachine(o);
    if (m < 0) continue;
    sum += o.time[m];
    longest = Math.max(longest, o.time[m]);
  }
  const avg = Math.ceil(sum / MACHINE_COUNT / UNIT) * UNIT;
  return Math.max(avg, longest);
}

if (typeof module !== 'undefined') {
  module.exports = {
    UNIT, HORIZON, MACHINE_COUNT, MAX_ORDERS, SAMPLE_ORDERS,
    makeRandom, generateOrders, orderError, fastestMachine,
    eddSequences, computeSchedule, lowerBound, makespanLowerBound,
  };
}
