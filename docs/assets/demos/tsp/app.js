/* Generated from demos/tsp/app.js by demos/sync_docs_demos.py. Do not edit. */
// TSP Demo - QUBO++ EasySolver Frontend
// Click to place, drag to move, solve to find shortest tour

const CANVAS_W = 700;
const CANVAS_H = 700;
const PADDING = 40;
const DRAW_SIZE = CANVAS_W - PADDING * 2;
const GRID_SIZE = 500;
const NODE_RADIUS = 16;
const HIT_RADIUS = 22;
const MAX_NODES = 32;
const COOLDOWN_SEC = 5;
const API_KEY = 'tsp-demo-2026-qbpp';
// Solver endpoint. Empty = same origin (Lambda-served page, local server.py);
// the docs page (qubo-plus.github.io) sets window.QBPP_DEMO_API to the Lambda URL.
const API_BASE = (window.QBPP_DEMO_API || '').replace(/\/$/, '');

const state = {
    nodes: [],
    tour: null,
    energy: null,
    solving: false,
    cooldownUntil: 0,
    drag: null,       // { index, startX, startY } or null
    didDrag: false,    // true if mouse moved during drag
    solveStart: 0,     // timestamp when solve started
    solveTimer: null,  // interval ID for elapsed time display
    lastTTS: null,     // latest TTS from progress
};

// ==================== Coordinate Mapping ====================

function gridToCanvas(gx, gy) {
    return {
        x: PADDING + (gx / GRID_SIZE) * DRAW_SIZE,
        y: PADDING + ((GRID_SIZE - gy) / GRID_SIZE) * DRAW_SIZE,
    };
}

function canvasToGrid(cx, cy) {
    return {
        x: Math.round(((cx - PADDING) / DRAW_SIZE) * GRID_SIZE),
        y: Math.round(((PADDING + DRAW_SIZE - cy) / DRAW_SIZE) * GRID_SIZE),
    };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function getCanvasXY(e) {
    const canvas = document.getElementById('tsp-canvas');
    const rect = canvas.getBoundingClientRect();
    return {
        cx: (e.clientX - rect.left) * (CANVAS_W / rect.width),
        cy: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
}

function hitTestNode(cx, cy) {
    for (let i = state.nodes.length - 1; i >= 0; i--) {
        const p = gridToCanvas(state.nodes[i].x, state.nodes[i].y);
        const dx = p.x - cx, dy = p.y - cy;
        if (dx * dx + dy * dy <= HIT_RADIUS * HIT_RADIUS) return i;
    }
    return -1;
}

// ==================== Theme ====================

function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getThemeColors() {
    return {
        gridLine:  getCSSVar('--grid-line'),
        gridLabel: getCSSVar('--grid-label'),
        tour:      getCSSVar('--tour'),
        tourGlow:  getCSSVar('--tour-glow'),
        node:      getCSSVar('--node'),
        nodeStart: getCSSVar('--node-start'),
        nodeFill:    getCSSVar('--node-fill'),
        accentGlow:  getCSSVar('--accent-glow'),
        nodeStartGlow: getCSSVar('--node-start-glow'),
    };
}

// ==================== Rendering ====================

function render() {
    const canvas = document.getElementById('tsp-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const colors = getThemeColors();
    drawGrid(ctx, colors);
    drawTour(ctx, colors);
    drawNodes(ctx, colors);

    const hint = document.getElementById('canvas-hint');
    if (state.nodes.length > 0) hint.classList.add('hidden');
    else hint.classList.remove('hidden');
}

function drawGrid(ctx, c) {
    ctx.strokeStyle = c.gridLine;
    ctx.lineWidth = 0.5;
    for (let g = 0; g <= GRID_SIZE; g += 100) {
        let a = gridToCanvas(g, 0), b = gridToCanvas(g, GRID_SIZE);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        a = gridToCanvas(0, g); b = gridToCanvas(GRID_SIZE, g);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.fillStyle = c.gridLabel;
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    for (let g = 0; g <= GRID_SIZE; g += 100) {
        const px = gridToCanvas(g, 0);
        ctx.fillText(g, px.x, CANVAS_H - 10);
        const py = gridToCanvas(0, g);
        ctx.textAlign = 'right';
        ctx.fillText(g, PADDING - 8, py.y + 3);
        ctx.textAlign = 'center';
    }
}

function drawTour(ctx, c) {
    if (!state.tour || state.tour.length < 2) return;
    const tour = state.tour;

    // Glow layer
    ctx.save();
    ctx.strokeStyle = c.tourGlow;
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    drawTourPath(ctx, tour);
    ctx.stroke();
    ctx.restore();

    // Main line
    ctx.strokeStyle = c.tour;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    drawTourPath(ctx, tour);
    ctx.stroke();

    // Arrows
    ctx.fillStyle = c.tour;
    for (let i = 0; i < tour.length; i++) {
        const fi = tour[i], ti = tour[(i + 1) % tour.length];
        if (fi >= state.nodes.length || ti >= state.nodes.length) continue;
        const fp = gridToCanvas(state.nodes[fi].x, state.nodes[fi].y);
        const tp = gridToCanvas(state.nodes[ti].x, state.nodes[ti].y);
        const mx = (fp.x + tp.x) / 2, my = (fp.y + tp.y) / 2;
        const angle = Math.atan2(tp.y - fp.y, tp.x - fp.x);
        ctx.beginPath();
        ctx.moveTo(mx + 7 * Math.cos(angle), my + 7 * Math.sin(angle));
        ctx.lineTo(mx + 7 * Math.cos(angle + 2.5), my + 7 * Math.sin(angle + 2.5));
        ctx.lineTo(mx + 7 * Math.cos(angle - 2.5), my + 7 * Math.sin(angle - 2.5));
        ctx.closePath();
        ctx.fill();
    }
}

function drawTourPath(ctx, tour) {
    const first = state.nodes[tour[0]];
    if (!first) return;
    const fp = gridToCanvas(first.x, first.y);
    ctx.beginPath();
    ctx.moveTo(fp.x, fp.y);
    for (let i = 1; i < tour.length; i++) {
        if (tour[i] >= state.nodes.length) continue;
        const n = state.nodes[tour[i]];
        const p = gridToCanvas(n.x, n.y);
        ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(fp.x, fp.y);
}

function drawNodes(ctx, c) {
    state.nodes.forEach((node, i) => {
        const p = gridToCanvas(node.x, node.y);
        const isStart = i === 0;
        const color = isStart ? c.nodeStart : c.node;
        const glowColor = isStart ? c.nodeStartGlow : c.accentGlow;

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, NODE_RADIUS + 4, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();

        // Circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, NODE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = c.nodeFill;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 11px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i.toString(), p.x, p.y);
    });
}

// ==================== Interaction ====================

function onPointerDown(e) {
    if (state.solving) return;
    const { cx, cy } = getCanvasXY(e);
    const hit = hitTestNode(cx, cy);
    if (hit >= 0) {
        state.drag = { index: hit };
        state.didDrag = false;
        document.getElementById('tsp-canvas').style.cursor = 'grabbing';
    }
}

function onPointerMove(e) {
    const canvas = document.getElementById('tsp-canvas');
    const { cx, cy } = getCanvasXY(e);

    if (state.drag !== null) {
        state.didDrag = true;
        const g = canvasToGrid(cx, cy);
        state.nodes[state.drag.index].x = clamp(g.x, 0, GRID_SIZE);
        state.nodes[state.drag.index].y = clamp(g.y, 0, GRID_SIZE);
        render();
        return;
    }

    // Hover cursor
    const hit = hitTestNode(cx, cy);
    canvas.style.cursor = hit >= 0 ? 'grab' : 'crosshair';
}

function onPointerUp(e) {
    const canvas = document.getElementById('tsp-canvas');
    if (state.drag !== null) {
        if (!state.didDrag) {
            // Click on existing node without drag — no-op (don't add new node)
        }
        state.drag = null;
        canvas.style.cursor = 'crosshair';
        render();
        return;
    }

    // Click on empty space → add node
    if (state.solving) return;
    if (state.nodes.length >= MAX_NODES) {
        setStatus('Maximum 32 nodes reached.', 'error');
        return;
    }
    const { cx, cy } = getCanvasXY(e);
    const g = canvasToGrid(cx, cy);
    if (g.x < 0 || g.x > GRID_SIZE || g.y < 0 || g.y > GRID_SIZE) return;
    state.nodes.push({ x: g.x, y: g.y });
    setStatus('');
    render();
}

// ==================== NDJSON Streaming ====================

async function readNdjsonStream(resp) {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    handleStreamEvent(JSON.parse(line));
                } catch (_) {}
            }
        }
        // Process any remaining buffer
        if (buffer.trim()) {
            try {
                handleStreamEvent(JSON.parse(buffer));
            } catch (_) {}
        }
    } finally {
        reader.releaseLock();
    }
}

function handleStreamEvent(event) {
    if (event.type === 'progress') {
        state.tour = event.tour;
        state.energy = event.energy;
        state.lastTTS = event.tts;
        updateSolvingStatus();
        if (event.matrix) renderMatrix(event.matrix);
        render();
    } else if (event.type === 'expr') {
        renderResultPanels(event);
    } else if (event.type === 'result') {
        handleSolveResult(event);
    } else if (event.type === 'error') {
        setStatus('Error: ' + event.error, 'error');
    }
}

function handleSolveResult(data) {
    if (data.error) {
        setStatus('Error: ' + data.error, 'error');
        return;
    }

    const tours = data.tours || [];
    if (tours.length > 0) {
        state.tour = tours[0].tour;
        state.energy = tours[0].energy;
        const tts = data.tts != null ? data.tts.toFixed(2) : null;
        const ttsStr = tts != null ? `  (TTS: ${tts}s)` : '';
        setStatus(`Tour distance: ${state.energy}${ttsStr}`, 'success');
    } else {
        setStatus('No valid tour found. Try more time.', 'error');
    }
    renderResultPanels(data);
}

// ==================== Solver ====================

async function solve() {
    if (state.nodes.length < 3) {
        setStatus('Place at least 3 cities.', 'error');
        return;
    }
    if (state.solving) return;

    const now = Date.now();
    if (now < state.cooldownUntil) {
        const sec = Math.ceil((state.cooldownUntil - now) / 1000);
        setStatus(`Please wait ${sec}s.`, 'error');
        return;
    }

    state.solving = true;
    state.tour = null;
    state.energy = null;
    state.lastTTS = null;
    state.solveStart = Date.now();
    const btn = document.getElementById('btn-solve');
    const btnClear = document.getElementById('btn-clear');
    const timeControl = document.querySelector('.time-control');
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Solving...';
    btn.style.color = '';
    btnClear.disabled = true;
    timeControl.classList.add('disabled');
    document.getElementById('cooldown-label').textContent = '';
    document.getElementById('result-panels').classList.add('hidden');
    setStatus('Solving...', '');
    startElapsedTimer();
    render();

    const time = parseInt(document.getElementById('solver-time').value) || 10;

    try {
        const resp = await fetch(API_BASE + '/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
            body: JSON.stringify({
                nodes: state.nodes.map(n => [n.x, n.y]),
                time: time,
            }),
        });

        if (!resp.ok) {
            const data = await resp.json();
            if (resp.status === 429) {
                const wait = data.retry_after || 10;
                state.cooldownUntil = Date.now() + wait * 1000;
                setStatus(`Rate limited. Wait ${wait}s.`, 'error');
                startCooldownTimer();
            } else {
                setStatus('Error: ' + (data.error || 'Unknown error'), 'error');
            }
            return;
        }

        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('ndjson')) {
            // Streaming mode (Lambda)
            await readNdjsonStream(resp);
        } else {
            // JSON mode (local server)
            const data = await resp.json();
            handleSolveResult(data);
        }
    } catch (e) {
        setStatus('Error: ' + e.message, 'error');
    } finally {
        stopElapsedTimer();
        state.solving = false;
        btn.removeAttribute('aria-busy');
        btn.textContent = 'Solve';
        btnClear.disabled = false;
        timeControl.classList.remove('disabled');
        state.cooldownUntil = Date.now() + COOLDOWN_SEC * 1000;
        startCooldownTimer();
        render();
    }
}

function updateSolvingStatus() {
    const elapsed = ((Date.now() - state.solveStart) / 1000).toFixed(1);
    if (state.energy != null) {
        const tts = state.lastTTS != null ? state.lastTTS.toFixed(2) : '?';
        setStatus(`Solving [${elapsed}s] Distance: ${state.energy} (TTS: ${tts}s)`, '');
    } else {
        setStatus(`Solving [${elapsed}s]`, '');
    }
}

function startElapsedTimer() {
    stopElapsedTimer();
    state.solveTimer = setInterval(updateSolvingStatus, 100);
}

function stopElapsedTimer() {
    if (state.solveTimer) {
        clearInterval(state.solveTimer);
        state.solveTimer = null;
    }
}

function startCooldownTimer() {
    const btn = document.getElementById('btn-solve');
    const label = document.getElementById('cooldown-label');
    const tick = () => {
        const sec = Math.ceil((state.cooldownUntil - Date.now()) / 1000);
        if (sec <= 0) {
            label.textContent = '';
            btn.style.color = '';
            btn.disabled = false;
            return;
        }
        label.textContent = `Wait ${sec}s`;
        btn.style.color = 'transparent';
        btn.disabled = true;
        setTimeout(tick, 500);
    };
    tick();
}

// ==================== Result Panels ====================

function renderMatrix(matrix) {
    const panels = document.getElementById('result-panels');
    panels.classList.remove('hidden');
    const n = matrix.length;
    document.getElementById('matrix-dim').textContent = `(${n} x ${n})`;
    const wrap = document.getElementById('matrix-wrap');
    let html = '<table><tr><th></th>';
    for (let j = 0; j < n; j++) html += `<th>${j}</th>`;
    html += '</tr>';
    for (let i = 0; i < n; i++) {
        html += `<tr><th>${i}</th>`;
        for (let j = 0; j < n; j++) {
            const v = matrix[i][j];
            const cls = v === 1 ? (i === 0 && j === 0 ? 'fixed' : 'one') : '';
            html += `<td class="${cls}">${v}</td>`;
        }
        html += '</tr>';
    }
    html += '</table>';
    wrap.innerHTML = html;
}

function renderResultPanels(data) {
    const panels = document.getElementById('result-panels');
    if (!data.matrix && !data.expr) { panels.classList.add('hidden'); return; }
    panels.classList.remove('hidden');

    if (data.matrix) renderMatrix(data.matrix);

    // QUBO expression — format with line breaks per term for readability
    if (data.expr) {
        const vars = data.variables || 0;
        const lin = data.linear_terms || 0;
        const quad = data.quadratic_terms || 0;
        document.getElementById('expr-info').textContent =
            `(${vars} variables, ${lin} linear terms, ${quad} quadratic terms)`;
        // Insert line breaks before each + or - for readability
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

// ==================== Init ====================

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('btn-theme');
    btn.textContent = theme === 'dark' ? '\u263C' : '\u263E';
    btn.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    localStorage.setItem('tsp-theme', theme);
    render();
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tsp-canvas');
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', () => {
        if (state.drag !== null) {
            state.drag = null;
            canvas.style.cursor = 'crosshair';
            render();
        }
    });

    document.getElementById('btn-solve').addEventListener('click', solve);
    document.getElementById('btn-clear').addEventListener('click', () => {
        state.nodes = [];
        state.tour = null;
        state.energy = null;
        setStatus('');
        document.getElementById('result-panels').classList.add('hidden');
        render();
    });

    document.getElementById('btn-theme').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    const slider = document.getElementById('solver-time');
    const timeVal = document.getElementById('time-value');
    slider.addEventListener('input', () => { timeVal.textContent = slider.value + 's'; });

    // Restore saved theme
    const saved = localStorage.getItem('tsp-theme') || 'light';
    applyTheme(saved);
});
