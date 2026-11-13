/* Generated from demos/sat/app.js by demos/sync_docs_demos.py. Do not edit. */
// SAT Demo - QUBO++ Frontend

const MIN_N = 2;
const MAX_N = 24;
const COOLDOWN_SEC = 5;

const state = {
    n: 6,
    // Each clause is an array of {var, neg} literals
    clauses: [
        [{var: 0, neg: false}, {var: 1, neg: true}, {var: 2, neg: false}],
        [{var: 3, neg: false}, {var: 4, neg: false}, {var: 5, neg: true}],
        [{var: 0, neg: true}, {var: 2, neg: false}, {var: 4, neg: false}],
    ],
    timeLimit: 10,
    solverType: 'easy',
    assignment: null,  // True=0, False=1
    clauseStatus: null,
    energy: null,
    trueCount: 0,
    falseCount: 0,
    violatedCount: 0,
    solving: false,
    cooldownUntil: 0,
};

// ==================== Literal helpers ====================

// Get literal state for variable j in clause row: null, 'pos', or 'neg'
function getLiteral(row, col) {
    const clause = state.clauses[row];
    for (const lit of clause) {
        if (lit.var === col) return lit.neg ? 'neg' : 'pos';
    }
    return null;
}

// Cycle literal: null -> pos -> neg -> null
function cycleLiteral(row, col) {
    const clause = state.clauses[row];
    const idx = clause.findIndex(lit => lit.var === col);
    if (idx < 0) {
        clause.push({var: col, neg: false});
    } else if (!clause[idx].neg) {
        clause[idx].neg = true;
    } else {
        clause.splice(idx, 1);
    }
    clearResult();
    renderMatrix();
}

// Check if a clause is satisfied (True=0, False=1)
function isClauseSatisfied(clause, assignment) {
    for (const lit of clause) {
        const val = assignment[lit.var];
        // Positive: satisfied when val=0 (True)
        // Negative: satisfied when val=1 (False, so ~x is True)
        if (lit.neg ? (val === 1) : (val === 0)) return true;
    }
    return false;
}

// ==================== Matrix Rendering ====================

function renderMatrix() {
    const wrap = document.getElementById('clause-matrix-wrap');
    const n = state.n;
    const hasResult = state.assignment !== null;

    let html = '<table>';

    // Header row: variable names
    html += '<tr><th></th>';
    for (let j = 0; j < n; j++) {
        html += `<th>x<sub>${j}</sub></th>`;
    }
    if (hasResult) html += '<th>Status</th>';
    html += '<th></th></tr>';

    // Assignment row (if result available)
    // True=0, False=1 → display T for val=0, F for val=1
    if (hasResult) {
        html += '<tr class="assign-row"><th></th>';
        for (let j = 0; j < n; j++) {
            const val = state.assignment[j];
            const cls = val === 0 ? 'val-true' : 'val-false';
            const label = val === 0 ? 'T' : 'F';
            html += `<td class="${cls}">${label}</td>`;
        }
        const tCount = state.assignment.filter(v => v === 0).length;
        const fCount = n - tCount;
        html += `<td>${tCount}T-${fCount}F</td><td></td></tr>`;
    }

    // Clause rows
    state.clauses.forEach((clause, row) => {
        html += `<tr><th>${row}</th>`;
        for (let j = 0; j < n; j++) {
            const litState = getLiteral(row, j);
            let cellClass = '';
            let cellContent = '';

            if (litState === 'pos') {
                cellContent = '+';
                if (hasResult) {
                    // Positive literal: True(val=0) satisfies
                    cellClass = state.assignment[j] === 0 ? ' lit-satisfied' : ' lit-unsatisfied';
                } else {
                    cellClass = ' lit-pos';
                }
            } else if (litState === 'neg') {
                cellContent = '\u2212';  // minus sign
                if (hasResult) {
                    // Negative literal: False(val=1) satisfies
                    cellClass = state.assignment[j] === 1 ? ' lit-satisfied' : ' lit-unsatisfied';
                } else {
                    cellClass = ' lit-neg';
                }
            }

            html += `<td class="lit-cell${cellClass}" data-row="${row}" data-col="${j}">${cellContent}</td>`;
        }
        // Status column
        if (hasResult) {
            const ok = isClauseSatisfied(clause, state.assignment);
            const cls = ok ? 'status-ok' : 'status-violated';
            const label = ok ? 'SAT' : 'UNSAT';
            html += `<td class="${cls}">${label}</td>`;
        }
        // Remove button
        html += `<td class="remove-cell"><button class="btn-remove-clause" data-row="${row}" title="Remove clause">\u00d7</button></td>`;
        html += '</tr>';
    });

    html += '</table>';
    wrap.innerHTML = html;

    // Attach cell click listeners (for cycling literals)
    wrap.querySelectorAll('td.lit-cell').forEach(td => {
        td.addEventListener('click', onCellClick);
    });

    // Attach remove button listeners
    wrap.querySelectorAll('.btn-remove-clause').forEach(btn => {
        btn.addEventListener('click', onRemoveClause);
    });
}

function onCellClick(e) {
    const row = parseInt(e.currentTarget.dataset.row);
    const col = parseInt(e.currentTarget.dataset.col);
    cycleLiteral(row, col);
}

function onRemoveClause(e) {
    const row = parseInt(e.target.dataset.row);
    state.clauses.splice(row, 1);
    clearResult();
    renderMatrix();
}

function addVariable() {
    if (state.n >= MAX_N) {
        setStatus(`Maximum ${MAX_N} variables.`, 'error');
        return;
    }
    state.n++;
    clearResult();
    renderMatrix();
}

function removeVariable() {
    if (state.n <= MIN_N) {
        setStatus(`Minimum ${MIN_N} variables.`, 'error');
        return;
    }
    state.n--;
    trimClauses();
    clearResult();
    renderMatrix();
}

function addClause() {
    state.clauses.push([]);
    clearResult();
    renderMatrix();
}

function clearResult() {
    state.assignment = null;
    state.clauseStatus = null;
    state.energy = null;
    state.trueCount = 0;
    state.falseCount = 0;
    state.violatedCount = 0;
    setStatus('', '');
    document.getElementById('result-panels').classList.add('hidden');
}

function clearAll() {
    state.clauses = [
        [{var: 0, neg: false}, {var: 1, neg: true}, {var: 2, neg: false}],
        [{var: 3, neg: false}, {var: 4, neg: false}, {var: 5, neg: true}],
        [{var: 0, neg: true}, {var: 2, neg: false}, {var: 4, neg: false}],
    ];
    trimClauses();
    clearResult();
    renderMatrix();
}

function randomAddLiterals() {
    const count = parseInt(document.getElementById('random-count').value) || 5;
    // Collect all empty cells
    const empty = [];
    state.clauses.forEach((clause, row) => {
        for (let j = 0; j < state.n; j++) {
            if (!clause.some(lit => lit.var === j)) {
                empty.push({ row, col: j });
            }
        }
    });
    // Shuffle
    for (let i = empty.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [empty[i], empty[j]] = [empty[j], empty[i]];
    }
    // Add random literals (randomly positive or negative)
    const toAdd = empty.slice(0, count);
    toAdd.forEach(({ row, col }) => {
        const neg = Math.random() < 0.5;
        state.clauses[row].push({var: col, neg});
    });
    clearResult();
    renderMatrix();
}

function randomDeleteLiterals() {
    const count = parseInt(document.getElementById('random-count').value) || 5;
    const existing = [];
    state.clauses.forEach((clause, row) => {
        clause.forEach((lit, idx) => existing.push({ row, idx }));
    });
    for (let i = existing.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [existing[i], existing[j]] = [existing[j], existing[i]];
    }
    // Delete from highest index first to avoid shifting
    const toDel = existing.slice(0, count);
    toDel.sort((a, b) => b.idx - a.idx || b.row - a.row);
    toDel.forEach(({ row, idx }) => {
        if (idx < state.clauses[row].length) {
            state.clauses[row].splice(idx, 1);
        }
    });
    clearResult();
    renderMatrix();
}

function randomNSat() {
    const k = parseInt(document.getElementById('nsat-k').value) || 3;
    if (k > state.n) {
        setStatus(`k=${k} exceeds number of variables (${state.n}).`, 'error');
        return;
    }
    const numClauses = Math.max(1, state.clauses.length);
    const newClauses = [];
    for (let i = 0; i < numClauses; i++) newClauses.push([]);

    // Ensure every variable appears at least once (round-robin)
    const allVars = Array.from({length: state.n}, (_, i) => i);
    for (let i = allVars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allVars[i], allVars[j]] = [allVars[j], allVars[i]];
    }
    let ci = 0;
    for (const v of allVars) {
        for (let tries = 0; tries < numClauses; tries++) {
            const idx = (ci + tries) % numClauses;
            if (newClauses[idx].length < k) {
                newClauses[idx].push({var: v, neg: Math.random() < 0.5});
                ci = (idx + 1) % numClauses;
                break;
            }
        }
    }

    // Fill remaining slots randomly (no duplicate vars in same clause)
    for (let i = 0; i < numClauses; i++) {
        while (newClauses[i].length < k) {
            const usedVars = new Set(newClauses[i].map(lit => lit.var));
            const available = [];
            for (let v = 0; v < state.n; v++) {
                if (!usedVars.has(v)) available.push(v);
            }
            if (available.length === 0) break;
            const v = available[Math.floor(Math.random() * available.length)];
            newClauses[i].push({var: v, neg: Math.random() < 0.5});
        }
    }
    state.clauses = newClauses;
    clearResult();
    renderMatrix();
}

function trimClauses() {
    const n = state.n;
    state.clauses = state.clauses.map(clause =>
        clause.filter(lit => lit.var < n)
    );
}

// ==================== Solver ====================

async function solve() {
    if (state.solving) return;

    const now = Date.now();
    if (now < state.cooldownUntil) {
        const sec = Math.ceil((state.cooldownUntil - now) / 1000);
        setStatus(`Please wait ${sec}s.`, 'error');
        return;
    }

    // Validate: need at least one non-empty clause
    const validClauses = state.clauses.filter(c => c.length >= 1);
    if (validClauses.length === 0) {
        setStatus('Error: At least one clause with literals is required.', 'error');
        return;
    }

    state.solving = true;
    clearResult();
    const btn = document.getElementById('btn-solve');
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Solving...';
    setStatus('Solving...', '');
    document.getElementById('solving-overlay').classList.remove('hidden');
    renderMatrix();

    const reqBody = {
        n: state.n,
        clauses: validClauses,
        time: state.timeLimit,
        solver: state.solverType,
    };

    try {
        const apiUrl = window.QBPP_DEMO_API || window.SAT_API_URL || window.location.href.replace(/\/$/, '');
        const resp = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody),
        });

        if (resp.status === 429) {
            const data = await resp.json();
            const wait = data.retry_after || 10;
            state.cooldownUntil = Date.now() + wait * 1000;
            setStatus(`Rate limited. Wait ${wait}s.`, 'error');
            startCooldownTimer();
            return;
        }
        if (!resp.ok) {
            const data = await resp.json().catch(() => ({}));
            setStatus('Error: ' + (data.error || `HTTP ${resp.status}`), 'error');
            return;
        }

        // Read NDJSON streaming response
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let data = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
                if (!line.trim()) continue;
                let ev;
                try { ev = JSON.parse(line); } catch { continue; }

                if (ev.type === 'error') {
                    setStatus('Error: ' + ev.error, 'error');
                    return;
                }
                if (ev.type === 'expr') {
                    renderExprInfo(ev);
                }
                if (ev.type === 'progress') {
                    state.assignment = ev.assignment || [];
                    state.clauseStatus = ev.clause_status || [];
                    state.energy = ev.energy;
                    state.trueCount = ev.true_count || 0;
                    state.violatedCount = ev.violated_count || 0;
                    state.falseCount = state.n - state.trueCount;
                    setStatus(`Solving... energy: ${ev.energy}, violated: ${ev.violated_count}`, '');
                    renderMatrix();
                }
                if (ev.type === 'result') {
                    data = ev;
                }
            }
        }

        if (!data) {
            setStatus('Error: No result received from solver', 'error');
            return;
        }

        // Store final results
        state.assignment = data.assignment || [];
        state.clauseStatus = data.clause_status || [];
        state.energy = data.energy;
        state.trueCount = data.true_count || 0;
        state.falseCount = data.false_count || 0;
        state.violatedCount = data.violated_count || 0;

        const tts = data.tts != null ? ` TTS: ${data.tts}s` : '';
        if (state.violatedCount === 0) {
            setStatus(`All clauses satisfied! ${state.trueCount}T : ${state.falseCount}F${tts}`, 'success');
        } else {
            setStatus(`${state.violatedCount} clause(s) violated. ${state.trueCount}T : ${state.falseCount}F, energy: ${state.energy}${tts}`, 'error');
        }

        renderResultPanels(data);
    } catch (e) {
        setStatus('Error: ' + e.message, 'error');
    } finally {
        state.solving = false;
        document.getElementById('solving-overlay').classList.add('hidden');
        btn.removeAttribute('aria-busy');
        btn.textContent = 'Solve';
        state.cooldownUntil = Date.now() + COOLDOWN_SEC * 1000;
        startCooldownTimer();
        renderMatrix();
    }
}

function startCooldownTimer() {
    const btn = document.getElementById('btn-solve');
    const tick = () => {
        const sec = Math.ceil((state.cooldownUntil - Date.now()) / 1000);
        if (sec <= 0) {
            btn.textContent = 'Solve';
            btn.disabled = false;
            return;
        }
        btn.textContent = `Wait ${sec}s`;
        btn.disabled = true;
        setTimeout(tick, 500);
    };
    tick();
}

// ==================== Result Panels ====================

function renderExprInfo(ev) {
    const panels = document.getElementById('result-panels');
    panels.classList.remove('hidden');

    const tc = ev.term_counts || [];
    let info = `(${ev.var_count || 0} variables`;
    for (let d = 1; d < tc.length; d++) {
        if (tc[d] > 0) {
            const label = d === 1 ? 'linear' : d === 2 ? 'quadratic' : `degree-${d}`;
            info += `, ${tc[d]} ${label}`;
        }
    }
    info += ' terms)';
    document.getElementById('expr-info').textContent = info;

    if (ev.expr) {
        const formatted = ev.expr.replace(/ ([+-])/g, '\n$1');
        document.getElementById('expr-box').textContent = formatted;
    }

    // No negative literals version
    const tcg = ev.no_neg_term_counts || [];
    let infoG = `(${ev.no_neg_var_count || 0} variables`;
    for (let d = 1; d < tcg.length; d++) {
        if (tcg[d] > 0) {
            const label = d === 1 ? 'linear' : d === 2 ? 'quadratic' : `degree-${d}`;
            infoG += `, ${tcg[d]} ${label}`;
        }
    }
    infoG += ' terms)';
    document.getElementById('expr-no-neg-info').textContent = infoG;

    if (ev.expr_no_neg) {
        const formatted = ev.expr_no_neg.replace(/ ([+-])/g, '\n$1');
        document.getElementById('expr-no-neg-box').textContent = formatted;
    }

    // Term count comparison table
    renderTermTable(tc, tcg);
}

function renderTermTable(tc, tcg) {
    const maxDeg = Math.max(tc.length, tcg.length) - 1;
    if (maxDeg < 1) {
        document.getElementById('term-table-panel').style.display = 'none';
        return;
    }

    const table = document.getElementById('term-table');
    let html = '<tr><th>Degree</th>';
    for (let d = 1; d <= maxDeg; d++) html += `<th>${d}</th>`;
    html += '<th>Total</th></tr>';

    // HUBO Expression row
    let totalF = 0;
    html += '<tr><td class="row-label">HUBO</td>';
    for (let d = 1; d <= maxDeg; d++) {
        const v = (d < tc.length ? tc[d] : 0) || 0;
        totalF += v;
        html += `<td>${v || ''}</td>`;
    }
    html += `<td class="total">${totalF}</td></tr>`;

    // No negative literals row
    let totalG = 0;
    html += '<tr><td class="row-label">No neg</td>';
    for (let d = 1; d <= maxDeg; d++) {
        const v = (d < tcg.length ? tcg[d] : 0) || 0;
        totalG += v;
        html += `<td>${v || ''}</td>`;
    }
    html += `<td class="total">${totalG}</td></tr>`;

    table.innerHTML = html;
    document.getElementById('term-table-panel').style.display = '';
}

function renderResultPanels(data) {
    const panels = document.getElementById('result-panels');
    panels.classList.remove('hidden');

    const tc = data.term_counts || [];
    let info = `(${data.var_count || 0} variables`;
    for (let d = 1; d < tc.length; d++) {
        if (tc[d] > 0) {
            const label = d === 1 ? 'linear' : d === 2 ? 'quadratic' : `degree-${d}`;
            info += `, ${tc[d]} ${label}`;
        }
    }
    info += ' terms)';
    document.getElementById('expr-info').textContent = info;

    if (data.expr) {
        const formatted = data.expr.replace(/ ([+-])/g, '\n$1');
        document.getElementById('expr-box').textContent = formatted;
    }
}

// ==================== Utility ====================

function setStatus(msg, type) {
    const el = document.getElementById('status-bar');
    el.textContent = msg;
    el.className = 'status-bar' + (type ? ' ' + type : '');
}

// ==================== Theme ====================

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('btn-theme');
    btn.textContent = theme === 'dark' ? '\u263C' : '\u263E';
    btn.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    localStorage.setItem('sat-theme', theme);
}

// ==================== Init ====================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-solve').addEventListener('click', solve);
    document.getElementById('btn-clear').addEventListener('click', clearAll);
    document.getElementById('btn-add-clause').addEventListener('click', addClause);
    document.getElementById('btn-add-var').addEventListener('click', addVariable);
    document.getElementById('btn-del-var').addEventListener('click', removeVariable);
    document.getElementById('btn-random-add').addEventListener('click', randomAddLiterals);
    document.getElementById('btn-random-del').addEventListener('click', randomDeleteLiterals);
    document.getElementById('btn-random-nsat').addEventListener('click', randomNSat);

    // Update nSAT button label when k changes
    const nsatInput = document.getElementById('nsat-k');
    nsatInput.addEventListener('input', () => {
        document.getElementById('nsat-label').textContent = nsatInput.value;
    });

    document.getElementById('btn-theme').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    // Solver select
    const solverSelect = document.getElementById('solver-select');
    solverSelect.addEventListener('change', () => {
        state.solverType = solverSelect.value;
        const timeControl = document.getElementById('time-control');
        timeControl.style.display = solverSelect.value === 'exhaustive' ? 'none' : '';
        clearResult();
    });

    // Time limit slider
    const timeSlider = document.getElementById('time-limit');
    const timeVal = document.getElementById('time-value');
    timeSlider.addEventListener('input', () => {
        state.timeLimit = parseInt(timeSlider.value);
        timeVal.textContent = timeSlider.value + 's';
    });

    // Restore saved theme
    const saved = localStorage.getItem('sat-theme') || 'light';
    applyTheme(saved);

    // Initial render
    trimClauses();
    renderMatrix();
});
