/* Generated from demos/shift/shift_core.js by demos/sync_docs_demos.py. Do not edit. */
// Shift scheduling demo: data model and rule checks shared by the page and
// the tests. Plain functions only (no DOM), so that node can run them too.
//
// Four weeks from a Monday (28 days, Saturdays and Sundays are weekend days).
// shift[d] of a person: 0 off, 1 day shift, 2 night shift, 3 both (invalid).

'use strict';

const DAYS = 28;
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const KIND_NAMES = { M: 'Manager', S: 'Skilled', E: 'Staff' };
const MAX_STAFF = 40;

function isWeekend(d) {
  return d % 7 >= 5;
}

// Default sample: 3 managers, 3 skilled and 5 regular staff, with a few
// requested days off ([person, day]: paid leave on a weekday, no holiday work
// on a weekend day)
const SAMPLE = {
  staff: [
    { name: 'Avery', kind: 'M' }, { name: 'Blake', kind: 'M' }, { name: 'Casey', kind: 'M' },
    { name: 'Drew', kind: 'S' }, { name: 'Ellis', kind: 'S' }, { name: 'Finley', kind: 'S' },
    { name: 'Gray', kind: 'E' }, { name: 'Harper', kind: 'E' }, { name: 'Indy', kind: 'E' },
    { name: 'Jordan', kind: 'E' }, { name: 'Kai', kind: 'E' },
  ],
  off: [[1, 9], [4, 3], [6, 17], [9, 22], [10, 2], [3, 15], [0, 5], [5, 13], [8, 20]],
  req: [5, 3, 3, 3],   // weekday day, weekday night, weekend day, weekend night
  maxRun: 6,
};

const EXTRA_NAMES = ['Logan', 'Morgan', 'Noel', 'Parker', 'Quinn', 'Reese', 'Sage', 'Taylor',
  'Uma', 'Val', 'Wren', 'Yael', 'Zion', 'Ari', 'Bay', 'Cruz', 'Dane', 'Eden', 'Fox'];

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

// Random requested days off for n people: up to 2 days of paid leave and up to
// 1 weekend day without holiday work each. Returns [[person, day], ...].
function randomOff(n, seed) {
  const rnd = makeRandom(seed);
  const off = [];
  for (let i = 0; i < n; ++i) {
    const leave = Math.floor(rnd() * 3);
    const used = new Set();
    for (let k = 0; k < leave; ++k) {
      const d = Math.floor(rnd() * 4) * 7 + Math.floor(rnd() * 5);
      if (!used.has(d)) { used.add(d); off.push([i, d]); }
    }
    if (rnd() < 0.5) off.push([i, Math.floor(rnd() * 4) * 7 + 5 + Math.floor(rnd() * 2)]);
  }
  return off;
}

function required(req, d, s) {
  return req[(isWeekend(d) ? 2 : 0) + s];
}

// Can a person of this kind lead shift s on day d? A weekday day shift needs
// a manager; a night shift or a weekend day shift a manager or a skilled worker.
function leads(kind, d, s) {
  return kind === 'M' || (kind === 'S' && (s === 1 || isWeekend(d)));
}

// Smallest sum of squares of n nonnegative integers with the given total
function balancedSquares(total, n) {
  if (n <= 0) return 0;
  const q = Math.floor(total / n);
  const r = total % n;
  return r * (q + 1) * (q + 1) + (n - r) * q * q;
}

// Lower bound of the objective: the staffing fixes the total number of
// working days, night shifts and holiday shifts; spread them evenly
function lowerBound(n, req) {
  let work = 0;
  let nights = 0;
  let holiday = 0;
  for (let d = 0; d < DAYS; ++d) {
    work += required(req, d, 0) + required(req, d, 1);
    nights += required(req, d, 1);
    if (isWeekend(d)) holiday += required(req, d, 0) + required(req, d, 1);
  }
  return balancedSquares(work, n) + balancedSquares(nights, n) + balancedSquares(holiday, n);
}

// Check a roster against the rules.
//   kinds[i]: 'M' | 'S' | 'E';  isOff(i, d): requested day off
//   shift[i][d]: 0 off, 1 day, 2 night, 3 both
// Returns {people: [{work, leave, holiday, nights, longest}], days: [{count: [day, night],
// lead: [bool, bool]}], cells: Map("i:d" -> reason), staffing: [[bool, bool]] (wrong count or no leader),
// violations, objective}.
function evaluate(kinds, isOff, shift, req, maxRun) {
  const n = kinds.length;
  const cells = new Map();
  const mark = (i, d, reason) => { if (!cells.has(i + ':' + d)) cells.set(i + ':' + d, reason); };
  let violations = 0;
  const people = [];
  for (let i = 0; i < n; ++i) {
    const p = { work: 0, leave: 0, holiday: 0, nights: 0, longest: 0 };
    let run = 0;
    for (let d = 0; d < DAYS; ++d) {
      const v = shift[i][d];
      const works = v !== 0;
      if (isOff(i, d) && !isWeekend(d)) ++p.leave;
      if (v === 3) { mark(i, d, 'two shifts on one day'); ++violations; }
      if (works && isOff(i, d)) { mark(i, d, 'works on a requested day off'); ++violations; }
      if (works) ++p.work;
      if (v & 2) ++p.nights;
      if (works && isWeekend(d)) ++p.holiday;
      run = works ? run + 1 : 0;
      p.longest = Math.max(p.longest, run);
      if (run > maxRun) { mark(i, d, `more than ${maxRun} working days in a row`); ++violations; }
      if (d > 0 && (shift[i][d - 1] & 2) && (v & 1)) { mark(i, d, 'day shift right after a night shift'); ++violations; }
      if (d > 0 && (shift[i][d - 1] & 1) && (v & 2)) { mark(i, d, 'night shift right after a day shift'); ++violations; }
    }
    people.push(p);
  }
  const days = [];
  const staffing = [];
  for (let d = 0; d < DAYS; ++d) {
    const day = { count: [0, 0], lead: [false, false] };
    for (let i = 0; i < n; ++i) {
      for (let s = 0; s < 2; ++s) {
        if (shift[i][d] & (s + 1)) {
          ++day.count[s];
          if (leads(kinds[i], d, s)) day.lead[s] = true;
        }
      }
    }
    const short = [0, 1].map((s) => {
      const need = required(req, d, s);
      let bad = false;
      if (day.count[s] !== need) { ++violations; bad = true; }
      if (need > 0 && !day.lead[s]) { ++violations; bad = true; }
      return bad;
    });
    days.push(day);
    staffing.push(short);
  }
  let objective = 0;
  for (const p of people) objective += p.work * p.work + p.nights * p.nights + p.holiday * p.holiday;
  return { people, days, cells, staffing, violations, objective };
}

if (typeof module !== 'undefined') {
  module.exports = {
    DAYS, DAY_NAMES, KIND_NAMES, MAX_STAFF, SAMPLE, EXTRA_NAMES,
    isWeekend, makeRandom, randomOff, required, leads, balancedSquares, lowerBound, evaluate,
  };
}
