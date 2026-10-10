/* Generated from demos/nqueen/app.js by demos/sync_docs_demos.py. Do not edit. */
// N-Queens Demo - QUBO++ EasySolver Frontend

const CANVAS_W = 700;
const CANVAS_H = 700;
const PADDING = 40;
const DRAW_SIZE = CANVAS_W - PADDING * 2;
const MIN_DIM = 4;
const MAX_DIM = 32;
const COOLDOWN_SEC = 5;
const API_KEY = 'nqueen-demo-2026-qbpp';
// Solver endpoint. Empty = same origin (Lambda-served page, local server.py);
// the docs page (qubo-plus.github.io) sets window.QBPP_DEMO_API to the Lambda URL.
const API_BASE = (window.QBPP_DEMO_API || '').replace(/\/$/, '');

const state = {
    dimension: 8,
    timeLimit: 10,
    fixedQueens: [],   // [{row, col}, ...] user-placed queens
    solQueens: null,    // [{row, col}, ...] or null
    fixedSet: null,     // Set of "row,col" strings for fixed queens in solution
    conflicts: null,    // [[r1,c1,r2,c2], ...] or null
    missingRows: [],    // [row, ...]
    missingCols: [],    // [col, ...]
    energy: null,
    solving: false,
    cooldownUntil: 0,
    hoverQueen: null,   // {row, col} or null
    solveStart: 0,
    solveTimer: null,
};

// ==================== Theme ====================

function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getThemeColors() {
    return {
        boardLight:    getCSSVar('--board-light'),
        boardDark:     getCSSVar('--board-dark'),
        boardBorder:   getCSSVar('--board-border'),
        boardLabel:    getCSSVar('--board-label'),
        queen:         getCSSVar('--queen'),
        queenGlow:     getCSSVar('--queen-glow'),
        queenFill:     getCSSVar('--queen-fill'),
        fixed:         getCSSVar('--accent'),
        fixedGlow:     getCSSVar('--accent') + '40',
        fixedFill:     getCSSVar('--accent') + '20',
        conflict:      getCSSVar('--conflict'),
        conflictGlow:  getCSSVar('--conflict-glow'),
        accent:        getCSSVar('--accent'),
    };
}

// ==================== Coordinate Mapping ====================

function cellSize() {
    return DRAW_SIZE / state.dimension;
}

function cellToCanvas(row, col) {
    const cs = cellSize();
    return {
        x: PADDING + col * cs,
        y: PADDING + row * cs,
    };
}

function cellCenter(row, col) {
    const cs = cellSize();
    return {
        x: PADDING + (col + 0.5) * cs,
        y: PADDING + (row + 0.5) * cs,
    };
}

// ==================== Rendering ====================

function canvasToCell(cx, cy) {
    const cs = cellSize();
    const col = Math.floor((cx - PADDING) / cs);
    const row = Math.floor((cy - PADDING) / cs);
    if (row < 0 || row >= state.dimension || col < 0 || col >= state.dimension) return null;
    return { row, col };
}

function render() {
    const canvas = document.getElementById('nqueen-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const colors = getThemeColors();
    drawBoard(ctx, colors);
    drawFixedQueens(ctx, colors);
    drawHoverLines(ctx, colors);
    drawMissing(ctx, colors);
    drawConflicts(ctx, colors);
    drawSolQueens(ctx, colors);
}

function drawBoard(ctx, c) {
    const cs = cellSize();
    const dim = state.dimension;

    for (let r = 0; r < dim; r++) {
        for (let col = 0; col < dim; col++) {
            const { x, y } = cellToCanvas(r, col);
            ctx.fillStyle = (r + col) % 2 === 0 ? c.boardLight : c.boardDark;
            ctx.fillRect(x, y, cs, cs);
        }
    }

    // Board border
    ctx.strokeStyle = c.boardBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(PADDING, PADDING, DRAW_SIZE, DRAW_SIZE);

    // Labels
    ctx.fillStyle = c.boardLabel;
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < dim; i++) {
        // Column labels (bottom)
        ctx.fillText(i.toString(), PADDING + (i + 0.5) * cs, PADDING + DRAW_SIZE + 16);
        // Row labels (left)
        ctx.textAlign = 'right';
        ctx.fillText(i.toString(), PADDING - 8, PADDING + (i + 0.5) * cs);
        ctx.textAlign = 'center';
    }
}

function drawQueen(ctx, row, col, color, glowColor, fillColor, radius) {
    const { x, y } = cellCenter(row, col);

    // Glow
    ctx.beginPath();
    ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.fill();

    // Circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Crown symbol
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(radius * 1.1)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u265B', x, y + 1);
}

function drawFixedQueens(ctx, c) {
    if (state.fixedQueens.length === 0) return;
    const cs = cellSize();
    const radius = Math.min(cs * 0.35, 22);
    state.fixedQueens.forEach(q => {
        drawQueen(ctx, q.row, q.col, c.fixed, c.fixedGlow, c.fixedFill, radius);
    });
}

function drawSolQueens(ctx, c) {
    if (!state.solQueens) return;
    const cs = cellSize();
    const radius = Math.min(cs * 0.35, 22);
    state.solQueens.forEach(q => {
        // Fixed queens in solution: draw with accent color
        const isFixed = state.fixedSet && state.fixedSet.has(`${q.row},${q.col}`);
        if (isFixed) {
            drawQueen(ctx, q.row, q.col, c.fixed, c.fixedGlow, c.fixedFill, radius);
        } else {
            drawQueen(ctx, q.row, q.col, c.queen, c.queenGlow, c.queenFill, radius);
        }
    });
}

function drawMissing(ctx, c) {
    if (state.missingRows.length === 0 && state.missingCols.length === 0) return;
    const cs = cellSize();
    const dim = state.dimension;

    // Highlight missing row backgrounds
    ctx.fillStyle = c.conflictGlow;
    state.missingRows.forEach(r => {
        const { x, y } = cellToCanvas(r, 0);
        ctx.fillRect(x, y, cs * dim, cs);
    });

    // Highlight missing column backgrounds
    state.missingCols.forEach(col => {
        const { x, y } = cellToCanvas(0, col);
        ctx.fillRect(x, y, cs, cs * dim);
    });

    // Draw lines through missing rows
    ctx.strokeStyle = c.conflict;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    state.missingRows.forEach(r => {
        const y = PADDING + (r + 0.5) * cs;
        ctx.beginPath();
        ctx.moveTo(PADDING, y);
        ctx.lineTo(PADDING + DRAW_SIZE, y);
        ctx.stroke();
    });

    // Draw lines through missing columns
    state.missingCols.forEach(col => {
        const x = PADDING + (col + 0.5) * cs;
        ctx.beginPath();
        ctx.moveTo(x, PADDING);
        ctx.lineTo(x, PADDING + DRAW_SIZE);
        ctx.stroke();
    });
    ctx.setLineDash([]);
}

function drawConflicts(ctx, c) {
    if (!state.conflicts || state.conflicts.length === 0) return;

    // Glow layer
    ctx.save();
    ctx.strokeStyle = c.conflictGlow;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    state.conflicts.forEach(([r1, c1, r2, c2]) => {
        const a = cellCenter(r1, c1);
        const b = cellCenter(r2, c2);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    });
    ctx.restore();

    // Main line
    ctx.strokeStyle = c.conflict;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    state.conflicts.forEach(([r1, c1, r2, c2]) => {
        const a = cellCenter(r1, c1);
        const b = cellCenter(r2, c2);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    });
}

function drawAttackLines(ctx, c, queen) {
    const center = cellCenter(queen.row, queen.col);
    // Row
    ctx.beginPath();
    ctx.moveTo(PADDING, center.y);
    ctx.lineTo(PADDING + DRAW_SIZE, center.y);
    ctx.stroke();
    // Column
    ctx.beginPath();
    ctx.moveTo(center.x, PADDING);
    ctx.lineTo(center.x, PADDING + DRAW_SIZE);
    ctx.stroke();
    // Diagonal
    ctx.beginPath();
    ctx.moveTo(center.x - DRAW_SIZE, center.y - DRAW_SIZE);
    ctx.lineTo(center.x + DRAW_SIZE, center.y + DRAW_SIZE);
    ctx.stroke();
    // Anti-diagonal
    ctx.beginPath();
    ctx.moveTo(center.x + DRAW_SIZE, center.y - DRAW_SIZE);
    ctx.lineTo(center.x - DRAW_SIZE, center.y + DRAW_SIZE);
    ctx.stroke();
}

function drawHoverLines(ctx, c) {
    // During placement: show attack lines for all fixed queens
    const showAll = state.fixedQueens.length > 0 && !state.solQueens;
    const hoverOnly = state.hoverQueen && !showAll;
    if (!showAll && !hoverOnly) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(PADDING, PADDING, DRAW_SIZE, DRAW_SIZE);
    ctx.clip();
    ctx.strokeStyle = c.accent || 'rgba(0, 150, 255, 0.4)';
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);

    if (showAll) {
        state.fixedQueens.forEach(q => drawAttackLines(ctx, c, q));
    }
    if (hoverOnly) {
        drawAttackLines(ctx, c, state.hoverQueen);
    }
    ctx.restore();
}

// ==================== Fixed Queen Placement ====================

function clearState() {
    state.fixedQueens = [];
    state.solQueens = null;
    state.fixedSet = null;
    state.conflicts = null;
    state.missingRows = [];
    state.missingCols = [];
    state.energy = null;
    state.hoverQueen = null;
    setStatus('', '');
    document.getElementById('result-panels').classList.add('hidden');
    render();
}

// ==================== Solver ====================

function applyProgressData(data) {
    state.solQueens = (data.queens || []).map(([r, c]) => ({ row: r, col: c }));
    state.energy = data.energy;
    state.conflicts = data.conflicts || [];
    state.lastTTS = data.tts;

    // Compute missing rows/cols
    const n = state.dimension;
    const rowSet = new Set(state.solQueens.map(q => q.row));
    const colSet = new Set(state.solQueens.map(q => q.col));
    state.missingRows = [];
    state.missingCols = [];
    for (let i = 0; i < n; i++) {
        if (!rowSet.has(i)) state.missingRows.push(i);
        if (!colSet.has(i)) state.missingCols.push(i);
    }

    // Update matrix panel in real time
    if (data.matrix) {
        renderMatrixPanel(data.matrix);
    }

    render();
}

function handleStreamEvent(event) {
    if (event.type === 'progress') {
        applyProgressData(event);
    } else if (event.type === 'expr') {
        renderExprPanel(event);
    } else if (event.type === 'result') {
        handleSolveResult(event);
    } else if (event.type === 'error') {
        setStatus('Error: ' + event.error, 'error');
    }
}

function handleSolveResult(data) {
    state.solQueens = (data.queens || []).map(([r, c]) => ({ row: r, col: c }));
    state.energy = data.energy;
    state.conflicts = data.conflicts || [];

    // Track which queens were fixed
    const fixed = data.fixed || [];
    state.fixedSet = new Set(fixed.map(([r, c]) => `${r},${c}`));

    // Compute missing rows/cols
    const n = data.dimension || state.dimension;
    const rowSet = new Set(state.solQueens.map(q => q.row));
    const colSet = new Set(state.solQueens.map(q => q.col));
    state.missingRows = [];
    state.missingCols = [];
    for (let i = 0; i < n; i++) {
        if (!rowSet.has(i)) state.missingRows.push(i);
        if (!colSet.has(i)) state.missingCols.push(i);
    }

    const tts = data.tts != null ? `TTS: ${data.tts}s` : '';
    const fixedInfo = fixed.length > 0 ? ` (${fixed.length} fixed)` : '';
    if (data.energy === 0) {
        setStatus(`Valid Solution Found! (${state.solQueens.length} queens${fixedInfo}) ${tts}`, 'success');
    } else {
        let detail = `energy: ${data.energy}`;
        if (state.missingRows.length > 0) detail += `, missing rows: [${state.missingRows.join(',')}]`;
        if (state.missingCols.length > 0) detail += `, missing cols: [${state.missingCols.join(',')}]`;
        if (state.conflicts.length > 0) detail += `, ${state.conflicts.length} conflicts`;
        setStatus(`No Valid Solution Found! (${detail}) ${tts}`, 'error');
    }
    renderResultPanels(data);
}

async function readNdjsonStream(resp) {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                handleStreamEvent(JSON.parse(line));
            } catch (_) {}
        }
    }
    // Process final buffer
    if (buffer.trim()) {
        try {
            handleStreamEvent(JSON.parse(buffer));
        } catch (_) {}
    }
}

async function solve() {
    if (state.solving) return;

    const now = Date.now();
    if (now < state.cooldownUntil) {
        const sec = Math.ceil((state.cooldownUntil - now) / 1000);
        setStatus(`Please wait ${sec}s.`, 'error');
        return;
    }

    state.solving = true;
    state.solQueens = null;
    state.fixedSet = null;
    state.conflicts = null;
    state.missingRows = [];
    state.missingCols = [];
    state.energy = null;
    state.lastTTS = null;
    const btn = document.getElementById('btn-solve');
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Solving...';
    document.getElementById('solving-overlay').classList.remove('hidden');
    startElapsedTimer();
    render();

    const dim = state.dimension;
    const body = { dimension: dim, time: state.timeLimit };
    if (state.fixedQueens.length > 0) {
        body.fixed = state.fixedQueens.map(q => [q.row, q.col]);
    }

    try {
        const resp = await fetch(API_BASE + '/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
            body: JSON.stringify(body),
        });

        const contentType = resp.headers.get('Content-Type') || '';

        if (contentType.includes('application/x-ndjson')) {
            // Streaming NDJSON response (Lambda with RESPONSE_STREAM)
            if (resp.status === 429) {
                const text = await resp.text();
                try {
                    const data = JSON.parse(text);
                    const wait = data.retry_after || 10;
                    state.cooldownUntil = Date.now() + wait * 1000;
                    setStatus(`Rate limited. Wait ${wait}s.`, 'error');
                    startCooldownTimer();
                } catch {
                    setStatus(`Rate limited.`, 'error');
                }
                return;
            }
            await readNdjsonStream(resp);
        } else {
            // Non-streaming JSON response (local dev server)
            const text = await resp.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                setStatus(`Error: Server returned non-JSON (HTTP ${resp.status})`, 'error');
                return;
            }

            if (resp.status === 429) {
                const wait = data.retry_after || 10;
                state.cooldownUntil = Date.now() + wait * 1000;
                setStatus(`Rate limited. Wait ${wait}s.`, 'error');
                startCooldownTimer();
                return;
            }
            if (data.error) {
                setStatus('Error: ' + data.error, 'error');
                return;
            }

            // Process all NDJSON lines if the local server returns them concatenated
            const lines = text.split('\n').filter(l => l.trim());
            for (const line of lines) {
                try { handleStreamEvent(JSON.parse(line)); } catch (_) {}
            }
        }
    } catch (e) {
        setStatus('Error: ' + e.message, 'error');
    } finally {
        stopElapsedTimer();
        state.solving = false;
        document.getElementById('solving-overlay').classList.add('hidden');
        btn.removeAttribute('aria-busy');
        btn.textContent = 'Solve';
        state.cooldownUntil = Date.now() + COOLDOWN_SEC * 1000;
        startCooldownTimer();
        render();
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

function renderMatrixPanel(matrix) {
    const panels = document.getElementById('result-panels');
    panels.classList.remove('hidden');

    const n = matrix.length;
    const fixed = new Set(state.fixedQueens.map(q => `${q.row},${q.col}`));
    document.getElementById('matrix-dim').textContent = `(${n} x ${n})`;
    const wrap = document.getElementById('matrix-wrap');
    let html = '<table><tr><th></th>';
    for (let j = 0; j < n; j++) html += `<th>${j}</th>`;
    html += '</tr>';
    for (let i = 0; i < n; i++) {
        html += `<tr><th>${i}</th>`;
        for (let j = 0; j < n; j++) {
            const v = matrix[i][j];
            const isFixed = fixed.has(`${i},${j}`);
            const cls = v === 1 ? (isFixed ? 'one fixed' : 'one') : '';
            html += `<td class="${cls}">${v}</td>`;
        }
        html += '</tr>';
    }
    html += '</table>';
    wrap.innerHTML = html;
}

function renderExprPanel(data) {
    const panels = document.getElementById('result-panels');
    panels.classList.remove('hidden');

    const vars = data.variables || 0;
    const lin = data.linear_terms || 0;
    const quad = data.quadratic_terms || 0;
    document.getElementById('expr-info').textContent =
        `(${vars} variables, ${lin} linear terms, ${quad} quadratic terms)`;

    if (data.expr) {
        const formatted = data.expr.replace(/ ([+-])/g, '\n$1');
        document.getElementById('expr-box').textContent = formatted;
    } else {
        document.getElementById('expr-box').textContent =
            '(Expression omitted for N > 12)';
    }
}

function renderResultPanels(data) {
    const panels = document.getElementById('result-panels');
    if (!data.matrix && !data.expr && !data.variables) { panels.classList.add('hidden'); return; }
    panels.classList.remove('hidden');

    if (data.matrix) {
        renderMatrixPanel(data.matrix);
    }
    renderExprPanel(data);
}

// ==================== Utility ====================

function setStatus(msg, type) {
    const el = document.getElementById('status-bar');
    el.textContent = msg;
    el.className = 'status-bar' + (type ? ' ' + type : '');
}

function updateSolvingStatus() {
    const elapsed = ((Date.now() - state.solveStart) / 1000).toFixed(1);
    let text = `Solving [${elapsed}s]`;
    if (state.energy != null) {
        text += ` Energy: ${state.energy}`;
        if (state.lastTTS != null) {
            text += ` (TTS: ${state.lastTTS}s)`;
        }
    }
    setStatus(text, '');
    document.getElementById('solving-overlay').textContent = `Solving [${elapsed}s]`;
}

function startElapsedTimer() {
    stopElapsedTimer();
    state.solveStart = Date.now();
    updateSolvingStatus();
    state.solveTimer = setInterval(updateSolvingStatus, 100);
}

function stopElapsedTimer() {
    if (state.solveTimer) {
        clearInterval(state.solveTimer);
        state.solveTimer = null;
    }
}

// ==================== Init ====================

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('btn-theme');
    btn.textContent = theme === 'dark' ? '\u263C' : '\u263E';
    btn.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    localStorage.setItem('nqueen-theme', theme);
    render();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-solve').addEventListener('click', solve);
    document.getElementById('btn-clear').addEventListener('click', clearState);

    // Click on board to place/remove fixed queens
    const canvas = document.getElementById('nqueen-canvas');
    canvas.addEventListener('click', (e) => {
        if (state.solving) return;
        // If solution is displayed, clear it first
        if (state.solQueens) {
            state.solQueens = null;
            state.fixedSet = null;
            state.conflicts = null;
            state.missingRows = [];
            state.missingCols = [];
            state.energy = null;
            setStatus('', '');
            document.getElementById('result-panels').classList.add('hidden');
        }
        const rect = canvas.getBoundingClientRect();
        const cx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
        const cy = (e.clientY - rect.top) * (CANVAS_H / rect.height);
        const cell = canvasToCell(cx, cy);
        if (!cell) return;
        // Toggle fixed queen at this cell
        const idx = state.fixedQueens.findIndex(q => q.row === cell.row && q.col === cell.col);
        if (idx >= 0) {
            state.fixedQueens.splice(idx, 1);
        } else {
            // Check if this cell is attacked by any existing fixed queen
            const attacker = state.fixedQueens.find(q =>
                q.row === cell.row || q.col === cell.col ||
                Math.abs(q.row - cell.row) === Math.abs(q.col - cell.col)
            );
            if (attacker) {
                setStatus(`Cannot place: attacked by queen at (${attacker.row}, ${attacker.col}).`, 'error');
                return;
            }
            state.fixedQueens.push({ row: cell.row, col: cell.col });
        }
        const n = state.fixedQueens.length;
        if (n > 0) {
            setStatus(`${n} queen${n > 1 ? 's' : ''} placed. Click to add/remove, then Solve.`, '');
        } else {
            setStatus('', '');
        }
        render();
    });

    // Hover over queen to show attack lines
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const cx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
        const cy = (e.clientY - rect.top) * (CANVAS_H / rect.height);
        const cell = canvasToCell(cx, cy);
        let hover = null;
        if (cell) {
            // Check solution queens
            if (state.solQueens) {
                hover = state.solQueens.find(q => q.row === cell.row && q.col === cell.col) || null;
            }
            // Check fixed queens
            if (!hover && state.fixedQueens.length > 0) {
                hover = state.fixedQueens.find(q => q.row === cell.row && q.col === cell.col) || null;
            }
        }
        const prev = state.hoverQueen;
        if (hover === prev || (hover && prev && hover.row === prev.row && hover.col === prev.col)) return;
        state.hoverQueen = hover;
        render();
    });
    canvas.addEventListener('mouseleave', () => {
        if (state.hoverQueen) { state.hoverQueen = null; render(); }
    });

    document.getElementById('btn-theme').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    // Dimension slider
    const dimSlider = document.getElementById('board-dim');
    const dimVal = document.getElementById('dim-value');
    dimSlider.addEventListener('input', () => {
        state.dimension = parseInt(dimSlider.value);
        dimVal.textContent = dimSlider.value;
        state.fixedQueens = [];
        state.solQueens = null;
        state.fixedSet = null;
        state.conflicts = null;
        state.missingRows = [];
        state.missingCols = [];
        state.energy = null;
        setStatus('');
        document.getElementById('result-panels').classList.add('hidden');
        render();
    });

    // Time limit slider
    const timeSlider = document.getElementById('time-limit');
    const timeVal = document.getElementById('time-value');
    timeSlider.addEventListener('input', () => {
        state.timeLimit = parseInt(timeSlider.value);
        timeVal.textContent = timeSlider.value + 's';
    });

    // Restore saved theme
    const saved = localStorage.getItem('nqueen-theme') || 'light';
    applyTheme(saved);
});
