/* Generated from demos/naesat/app.js by demos/sync_docs_demos.py. Do not edit. */
// NAE-SAT Demo - QUBO++ Frontend

const MIN_N = 3;
const MAX_N = 24;
const COOLDOWN_SEC = 5;

const state = {
    n: 6,
    clauses: [[0, 1, 2], [3, 4, 5], [0, 2, 4]],
    timeLimit: 10,
    solverType: 'easy',
    objectiveType: 'balance',
    assignment: null,
    clauseStatus: null,
    energy: null,
    trueCount: 0,
    falseCount: 0,
    balance: 0,
    violatedCount: 0,
    solving: false,
    cooldownUntil: 0,
};

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
    if (hasResult) html += '<th>T-F</th>';
    html += '<th></th></tr>';

    // Assignment row (if result available)
    if (hasResult) {
        html += '<tr class="assign-row"><th></th>';
        for (let j = 0; j < n; j++) {
            const val = state.assignment[j];
            const cls = val === 1 ? 'val-true' : 'val-false';
            const label = val === 1 ? 'T' : 'F';
            html += `<td class="${cls}">${label}</td>`;
        }
        const tCount = state.assignment.filter(v => v === 1).length;
        const fCount = n - tCount;
        html += `<td>${tCount}-${fCount}</td><td></td></tr>`;
    }

    // Clause rows
    state.clauses.forEach((clause, row) => {
        html += `<tr><th>${row}</th>`;
        const clauseSet = new Set(clause);
        for (let j = 0; j < n; j++) {
            const checked = clauseSet.has(j);
            let cellClass = '';
            if (checked && hasResult) {
                cellClass = state.assignment[j] === 1 ? ' checked-true' : ' checked-false';
            } else if (checked) {
                cellClass = ' checked';
            }
            const checkedAttr = checked ? ' checked' : '';
            html += `<td class="${cellClass}">`;
            html += `<input type="checkbox" data-row="${row}" data-col="${j}"${checkedAttr}>`;
            html += '</td>';
        }
        // T-F count column
        if (hasResult) {
            const trueInClause = clause.filter(j => state.assignment[j] === 1).length;
            const falseInClause = clause.length - trueInClause;
            // NAE satisfied: at least one T and one F (requires 2+ vars)
            const ok = clause.length >= 2 && trueInClause > 0 && falseInClause > 0;
            const cls = ok ? 'status-ok' : 'status-violated';
            html += `<td class="${cls}">${trueInClause}-${falseInClause}</td>`;
        }
        // Remove button
        html += `<td class="remove-cell"><button class="btn-remove-clause" data-row="${row}" title="Remove clause">\u00d7</button></td>`;
        html += '</tr>';
    });

    html += '</table>';
    wrap.innerHTML = html;

    // Attach checkbox event listeners
    wrap.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', onCheckboxChange);
    });

    // Attach remove button listeners
    wrap.querySelectorAll('.btn-remove-clause').forEach(btn => {
        btn.addEventListener('click', onRemoveClause);
    });
}

function onCheckboxChange(e) {
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const checked = e.target.checked;

    // Update clause
    const clause = state.clauses[row];
    if (checked) {
        if (!clause.includes(col)) {
            clause.push(col);
            clause.sort((a, b) => a - b);
        }
    } else {
        const idx = clause.indexOf(col);
        if (idx >= 0) clause.splice(idx, 1);
    }

    // Clear result when matrix changes
    clearResult();
    renderMatrix();
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
    state.balance = 0;
    state.violatedCount = 0;
    setStatus('', '');
    document.getElementById('result-panels').classList.add('hidden');
}

function clearAll() {
    state.clauses = [[0, 1, 2], [3, 4, 5], [0, 2, 4]];
    trimClauses();
    clearResult();
    renderMatrix();
}

function randomAddChecks() {
    const count = parseInt(document.getElementById('random-count').value) || 5;
    const unchecked = [];
    state.clauses.forEach((clause, row) => {
        const clauseSet = new Set(clause);
        for (let j = 0; j < state.n; j++) {
            if (!clauseSet.has(j)) unchecked.push({ row, col: j });
        }
    });
    for (let i = unchecked.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unchecked[i], unchecked[j]] = [unchecked[j], unchecked[i]];
    }
    const toAdd = unchecked.slice(0, count);
    toAdd.forEach(({ row, col }) => {
        state.clauses[row].push(col);
        state.clauses[row].sort((a, b) => a - b);
    });
    clearResult();
    renderMatrix();
}

function randomDeleteChecks() {
    const count = parseInt(document.getElementById('random-count').value) || 5;
    const checked = [];
    state.clauses.forEach((clause, row) => {
        clause.forEach(col => checked.push({ row, col }));
    });
    for (let i = checked.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [checked[i], checked[j]] = [checked[j], checked[i]];
    }
    const toDel = checked.slice(0, count);
    toDel.forEach(({ row, col }) => {
        const idx = state.clauses[row].indexOf(col);
        if (idx >= 0) state.clauses[row].splice(idx, 1);
    });
    clearResult();
    renderMatrix();
}

function trimClauses() {
    const n = state.n;
    state.clauses = state.clauses.map(clause =>
        clause.filter(idx => idx < n)
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

    // Validate: need at least one clause with 2+ variables
    const validClauses = state.clauses.filter(c => c.length >= 2);
    if (validClauses.length === 0) {
        setStatus('Error: At least one clause with 2+ variables is required.', 'error');
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
        objective: state.objectiveType,
    };

    try {
        const apiUrl = window.QBPP_DEMO_API || window.NAESAT_API_URL || window.location.href.replace(/\/$/, '');
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

            // Process complete NDJSON lines
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep incomplete last line
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
        state.balance = data.balance || 0;
        state.violatedCount = data.violated_count || 0;

        const tts = data.tts != null ? ` TTS: ${data.tts}s` : '';
        const objLabels = { minimize: ' [Min T]', minimize_f: ' [Min F]', balance: ' [Balance]' };
        const objLabel = objLabels[data.objective] || '';
        if (state.violatedCount === 0) {
            let objStr;
            if (data.objective === 'minimize') {
                objStr = `True minimized to ${state.trueCount}`;
            } else if (data.objective === 'minimize_f') {
                objStr = `False minimized to ${state.falseCount}`;
            } else {
                objStr = state.balance === 0
                    ? 'perfectly balanced'
                    : `balance: ${state.trueCount}T / ${state.falseCount}F`;
            }
            setStatus(`All NAE constraints satisfied! ${state.trueCount}T : ${state.falseCount}F (${objStr})${tts}${objLabel}`, 'success');
        } else {
            setStatus(`${state.violatedCount} clause(s) violated. ${state.trueCount}T : ${state.falseCount}F, energy: ${state.energy}${tts}${objLabel}`, 'error');
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
    localStorage.setItem('naesat-theme', theme);
}

// ==================== Init ====================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-solve').addEventListener('click', solve);
    document.getElementById('btn-clear').addEventListener('click', clearAll);
    document.getElementById('btn-add-clause').addEventListener('click', addClause);
    document.getElementById('btn-add-var').addEventListener('click', addVariable);
    document.getElementById('btn-del-var').addEventListener('click', removeVariable);
    document.getElementById('btn-random-add').addEventListener('click', randomAddChecks);
    document.getElementById('btn-random-del').addEventListener('click', randomDeleteChecks);

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

    // Objective select
    const objectiveSelect = document.getElementById('objective-select');
    objectiveSelect.addEventListener('change', () => {
        state.objectiveType = objectiveSelect.value;
        clearResult();
        renderMatrix();
    });

    // Time limit slider
    const timeSlider = document.getElementById('time-limit');
    const timeVal = document.getElementById('time-value');
    timeSlider.addEventListener('input', () => {
        state.timeLimit = parseInt(timeSlider.value);
        timeVal.textContent = timeSlider.value + 's';
    });

    // Restore saved theme
    const saved = localStorage.getItem('naesat-theme') || 'light';
    applyTheme(saved);

    // Initial render
    trimClauses();
    renderMatrix();
});
