/* Generated from demos/graph/app.js by demos/sync_docs_demos.py. Do not edit. */
// Graph Problem Demo - QUBO++ EasySolver Frontend
// Click to add nodes, click two nodes to toggle edge, solve MIS or MVC

const CANVAS_W = 700;
const CANVAS_H = 700;
const PADDING = 40;
const NODE_RADIUS = 16;
const HIT_RADIUS = 22;
const MAX_NODES = 32;
const COOLDOWN_SEC = 5;
const API_KEY = 'graph-mis-demo-2026-qbpp';
// Solver endpoint. Empty = same origin (Lambda-served page, local server.py);
// the docs page (qubo-plus.github.io) sets window.QBPP_DEMO_API to the Lambda URL.
const API_BASE = (window.QBPP_DEMO_API || '').replace(/\/$/, '');
// Generate 32 distinct hex colors via golden-angle HSL
const COLOR_PALETTE = (() => {
    function hslToHex(h, s, l) {
        s /= 100; l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
        return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('');
    }
    const out = [];
    for (let i = 0; i < MAX_NODES; i++) {
        const hue = (i * 137.508) % 360;  // golden angle for max separation
        const sat = 65 + (i % 3) * 12;    // 65%, 77%, 89%
        const lit = 45 + (i % 2) * 10;    // 45%, 55%
        out.push(hslToHex(hue, sat, lit));
    }
    return out;
})();

const state = {
    nodes: [],          // [{x, y}, ...] in canvas coordinates
    edges: [],          // [[i, j], ...]
    selected: null,     // MIS result: Set of selected node indices
    variables: null,    // [1, 0, 1, ...] full variable vector
    conflicts: null,    // [[i, j], ...] conflict edges
    highlightEdges: null, // [[i, j], ...] clique edges to highlight
    path: null,          // [node_at_pos0, node_at_pos1, ...] for hampath
    nodeColors: null,    // [c0, c1, ...] color index per node for coloring
    edgeColors: null,    // [c0, c1, ...] color index per edge for edge coloring
    pathEndpoints: null, // [startNode, endNode] for hampath
    mdsColors: null,     // [colorIndex, ...] per node for MDS
    mdsEdgeColors: null, // [colorIndex, ...] per edge for MDS
    solvedProblem: null,
    energy: null,
    objective: null,
    constraint: null,
    solving: false,
    cooldownUntil: 0,
    activeNode: null,   // Node index selected for edge creation
    drag: null,         // { index } or null
    didDrag: false,
    solveStart: 0,      // timestamp when solve started
    solveTimer: null,    // interval ID for elapsed time display
    lastTTS: null,       // latest TTS from progress
    terminals: new Set(), // Steiner tree terminal node indices (user input)
};

// Problems that take user-specified s/t endpoints
const ST_PROBLEMS = ['shortest_path', 'disjoint_paths', 'mincut'];

function getSelectedProblem() {
    return document.getElementById('problem-select').value;
}

// Fix terminal indices after node `removed` was deleted
function remapTerminals(removed) {
    state.terminals = new Set([...state.terminals]
        .filter(v => v !== removed)
        .map(v => v > removed ? v - 1 : v));
}

// ==================== Coordinate Helpers ====================

function getCanvasXY(e) {
    const canvas = document.getElementById('graph-canvas');
    const rect = canvas.getBoundingClientRect();
    return {
        cx: (e.clientX - rect.left) * (CANVAS_W / rect.width),
        cy: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
}

function hitTestNode(cx, cy) {
    for (let i = state.nodes.length - 1; i >= 0; i--) {
        const dx = state.nodes[i].x - cx, dy = state.nodes[i].y - cy;
        if (dx * dx + dy * dy <= HIT_RADIUS * HIT_RADIUS) return i;
    }
    return -1;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function findEdge(i, j) {
    const a = Math.min(i, j), b = Math.max(i, j);
    return state.edges.findIndex(e => Math.min(e[0], e[1]) === a && Math.max(e[0], e[1]) === b);
}

// ==================== Theme ====================

function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Blend foreground hex color over background hex color at given alpha (0-1), return opaque hex
function blendColor(fg, bg, alpha) {
    const p = (s, o) => parseInt(s.slice(o, o + 2), 16);
    const r = Math.round(p(fg, 1) * alpha + p(bg, 1) * (1 - alpha));
    const g = Math.round(p(fg, 3) * alpha + p(bg, 3) * (1 - alpha));
    const b = Math.round(p(fg, 5) * alpha + p(bg, 5) * (1 - alpha));
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function getThemeColors() {
    return {
        node:             getCSSVar('--node'),
        nodeGlow:         getCSSVar('--node-glow'),
        nodeFill:         getCSSVar('--node-fill'),
        nodeSelected:     getCSSVar('--node-selected'),
        nodeSelectedGlow: getCSSVar('--node-selected-glow'),
        nodeSelectedFill: getCSSVar('--node-selected-fill'),
        nodeActive:       getCSSVar('--node-active'),
        nodeActiveGlow:   getCSSVar('--node-active-glow'),
        edge:             getCSSVar('--edge'),
        edgeConflict:     getCSSVar('--edge-conflict'),
        edgeConflictGlow: getCSSVar('--edge-conflict-glow'),
        edgeHighlight:     getCSSVar('--edge-highlight'),
        edgeHighlightGlow: getCSSVar('--edge-highlight-glow'),
        partitionA:       getCSSVar('--node-partition-a'),
        partitionAGlow:   getCSSVar('--node-partition-a-glow'),
        partitionB:       getCSSVar('--node-partition-b'),
        partitionBGlow:   getCSSVar('--node-partition-b-glow'),
        gridLine:         getCSSVar('--grid-line'),
        gridLabel:        getCSSVar('--grid-label'),
    };
}

// ==================== Rendering ====================

function render() {
    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const colors = getThemeColors();
    drawGrid(ctx, colors);
    drawEdges(ctx, colors);
    drawHighlightEdges(ctx, colors);
    drawConflictEdges(ctx, colors);
    drawNodes(ctx, colors);

    const hint = document.getElementById('canvas-hint');
    if (state.nodes.length > 0) hint.classList.add('hidden');
    else hint.classList.remove('hidden');
}

function drawGrid(ctx, c) {
    ctx.strokeStyle = c.gridLine;
    ctx.lineWidth = 0.5;
    const step = 100;
    for (let x = PADDING; x <= CANVAS_W - PADDING; x += step) {
        ctx.beginPath(); ctx.moveTo(x, PADDING); ctx.lineTo(x, CANVAS_H - PADDING); ctx.stroke();
    }
    for (let y = PADDING; y <= CANVAS_H - PADDING; y += step) {
        ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(CANVAS_W - PADDING, y); ctx.stroke();
    }
    // Grid interval labels
    ctx.fillStyle = c.gridLabel;
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = PADDING; x <= CANVAS_W - PADDING; x += step) {
        ctx.fillText(String(x - PADDING), x, CANVAS_H - PADDING + 4);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = PADDING; y <= CANVAS_H - PADDING; y += step) {
        ctx.fillText(String(y - PADDING), PADDING - 4, y);
    }
}

function drawEdges(ctx, c) {
    const isEdgeColoring = (state.solvedProblem === 'edge_coloring' || state.solvedProblem === 'disjoint_paths') && state.edgeColors != null;
    const isMdsEdge = (state.solvedProblem === 'mds' || state.solvedProblem === 'mvc' || state.solvedProblem === 'mis') && state.mdsEdgeColors != null;
    state.edges.forEach(([i, j], idx) => {
        if (i >= state.nodes.length || j >= state.nodes.length) return;
        const a = state.nodes[i], b = state.nodes[j];
        if (isEdgeColoring && state.edgeColors[idx] >= 0) {
            const ci = state.edgeColors[idx] % COLOR_PALETTE.length;
            ctx.strokeStyle = COLOR_PALETTE[ci];
            ctx.lineWidth = 3;
        } else if (isMdsEdge && state.mdsEdgeColors[idx] >= 0) {
            const ci = state.mdsEdgeColors[idx] % COLOR_PALETTE.length;
            ctx.strokeStyle = COLOR_PALETTE[ci];
            ctx.lineWidth = 2.5;
        } else {
            ctx.strokeStyle = c.edge;
            ctx.lineWidth = 2;
        }
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    });
}

function drawHighlightEdges(ctx, c) {
    if (!state.highlightEdges || state.highlightEdges.length === 0) return;

    // Build set of highlighted edges for quick lookup
    const hlSet = new Set();
    state.highlightEdges.forEach(([i, j]) => {
        hlSet.add(Math.min(i, j) + ',' + Math.max(i, j));
    });

    // Glow layer
    ctx.save();
    ctx.strokeStyle = c.edgeHighlightGlow;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    state.highlightEdges.forEach(([i, j]) => {
        if (i >= state.nodes.length || j >= state.nodes.length) return;
        const a = state.nodes[i], b = state.nodes[j];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    });
    ctx.restore();

    // Redraw non-highlighted edges on top of glow to prevent bleed
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 2;
    state.edges.forEach(([i, j]) => {
        if (i >= state.nodes.length || j >= state.nodes.length) return;
        const key = Math.min(i, j) + ',' + Math.max(i, j);
        if (hlSet.has(key)) return;
        const a = state.nodes[i], b = state.nodes[j];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    });

    // Main line for highlighted edges
    ctx.strokeStyle = c.edgeHighlight;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    state.highlightEdges.forEach(([i, j]) => {
        if (i >= state.nodes.length || j >= state.nodes.length) return;
        const a = state.nodes[i], b = state.nodes[j];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    });

    // Arrows along path for hamcycle / hampath
    const isHam = (state.solvedProblem === 'hamcycle' || state.solvedProblem === 'hampath' || state.solvedProblem === 'tsp') && state.path;
    if (isHam) {
        const isCycle = state.solvedProblem === 'hamcycle' || state.solvedProblem === 'tsp';
        const len = isCycle ? state.path.length : state.path.length - 1;
        ctx.fillStyle = c.edgeHighlight;
        for (let k = 0; k < len; k++) {
            const fi = state.path[k], ti = state.path[(k + 1) % state.path.length];
            if (fi >= state.nodes.length || ti >= state.nodes.length) continue;
            const a = state.nodes[fi], b = state.nodes[ti];
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            ctx.beginPath();
            ctx.moveTo(mx + 7 * Math.cos(angle), my + 7 * Math.sin(angle));
            ctx.lineTo(mx + 7 * Math.cos(angle + 2.5), my + 7 * Math.sin(angle + 2.5));
            ctx.lineTo(mx + 7 * Math.cos(angle - 2.5), my + 7 * Math.sin(angle - 2.5));
            ctx.closePath();
            ctx.fill();
        }
    }
}

function drawConflictEdges(ctx, c) {
    if (!state.conflicts || state.conflicts.length === 0) return;
    // Glow layer
    ctx.save();
    ctx.strokeStyle = c.edgeConflictGlow;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    state.conflicts.forEach(([i, j]) => {
        if (i >= state.nodes.length || j >= state.nodes.length) return;
        const a = state.nodes[i], b = state.nodes[j];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    });
    ctx.restore();
    // Main line
    ctx.strokeStyle = c.edgeConflict;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    state.conflicts.forEach(([i, j]) => {
        if (i >= state.nodes.length || j >= state.nodes.length) return;
        const a = state.nodes[i], b = state.nodes[j];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    });
}

function drawNodes(ctx, c) {
    // Endpoint markers: hampath shows solution endpoints; shortest_path
    // shows the user-specified s/t (also before solving)
    let endpoints = null;
    if (state.solvedProblem === 'hampath' && state.pathEndpoints != null) {
        endpoints = state.pathEndpoints;
    } else if (ST_PROBLEMS.includes(getSelectedProblem())) {
        const s = parseInt(document.getElementById('sp-source').value);
        const t = parseInt(document.getElementById('sp-target').value);
        endpoints = [isNaN(s) ? -1 : s, isNaN(t) ? -1 : t];
    } else if (getSelectedProblem() === 'spt') {
        const r = parseInt(document.getElementById('spt-root').value);
        endpoints = [isNaN(r) ? -1 : r, -1];  // root marker only
    }
    const isSteiner = getSelectedProblem() === 'steiner';
    state.nodes.forEach((node, i) => {
        const isSelected = state.selected && state.selected.has(i);
        const isActive = state.activeNode === i;
        const isMaxcut = (state.solvedProblem === 'maxcut' || state.solvedProblem === 'bisection') && state.selected != null;
        const isColoring = (state.solvedProblem === 'coloring' || state.solvedProblem === 'clique_partition' || state.solvedProblem === 'p_median') && state.nodeColors != null;
        const isMds = (state.solvedProblem === 'mds' || state.solvedProblem === 'mvc' || state.solvedProblem === 'mis') && state.mdsColors != null;
        const isPathEndpoint = endpoints != null;

        let color, glow, fill, noStroke = false;
        if (isActive) {
            color = c.nodeActive;
            glow = c.nodeActiveGlow;
            fill = c.nodeFill;
        } else if (isSteiner && state.terminals.has(i)) {
            color = '#22c55e';       // terminal: green
            glow = 'rgba(34, 197, 94, 0.3)';
            fill = blendColor('#22c55e', c.nodeFill, 0.2);
        } else if (isPathEndpoint && i === endpoints[0]) {
            color = c.partitionA;    // start: blue
            glow = c.partitionAGlow;
            fill = blendColor(c.partitionA, c.nodeFill, 0.2);
        } else if (isPathEndpoint && i === endpoints[1]) {
            color = '#22c55e';       // end: green
            glow = 'rgba(34, 197, 94, 0.3)';
            fill = blendColor('#22c55e', c.nodeFill, 0.2);
        } else if (isColoring && state.nodeColors[i] >= 0) {
            const ci = state.nodeColors[i] % COLOR_PALETTE.length;
            color = COLOR_PALETTE[ci];
            glow = COLOR_PALETTE[ci] + '60';
            // p-median: tint the facility nodes with their cluster color
            fill = (state.facilities && state.facilities.has(i))
                ? blendColor(COLOR_PALETTE[ci], c.nodeFill, 0.45)
                : c.nodeFill;
        } else if (isColoring && state.nodeColors[i] < 0) {
            color = c.node;
            glow = c.nodeGlow;
            fill = c.nodeFill;
        } else if (isMds && state.mdsColors[i] >= 0) {
            const ci = state.mdsColors[i] % COLOR_PALETTE.length;
            const pc = COLOR_PALETTE[ci];
            if (isSelected) {
                color = pc;
                glow = pc + '60';
                fill = blendColor(pc, c.nodeFill, 0.2);
            } else {
                color = pc;
                glow = 'transparent';
                fill = c.nodeFill;
            }
        } else if (isMaxcut && isSelected) {
            color = c.partitionA;
            glow = c.partitionAGlow;
            fill = c.nodeFill;
        } else if (isMaxcut) {
            color = c.partitionB;
            glow = c.partitionBGlow;
            fill = c.nodeFill;
        } else if (isSelected) {
            color = '#ef4444';
            glow = '#ef444460';
            fill = c.nodeFill;
        } else {
            color = c.node;
            glow = c.nodeGlow;
            fill = c.nodeFill;
        }

        // Glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS + 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        if (!noStroke) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Label: show path position for hampath, node index otherwise
        ctx.fillStyle = color;
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let label = i.toString();
        ctx.fillText(label, node.x, node.y);
    });
}

// ==================== Interaction ====================

function clearSolution() {
    state.selected = null;
    state.variables = null;
    state.conflicts = null;
    state.highlightEdges = null;
    state.path = null;
    state.nodeColors = null;
    state.edgeColors = null;
    state.pathEndpoints = null;
    state.mdsColors = null;
    state.mdsEdgeColors = null;
    state.facilities = null;
    state.solvedProblem = null;
    state.energy = null;
    state.objective = null;
    state.constraint = null;
}

function computePaletteColors() {
    // MIS/MVC: assign palette colors to selected vertices and color incident edges
    if ((state.solvedProblem === 'mis' || state.solvedProblem === 'mvc') && state.selected && state.selected.size > 0) {
        const n = state.nodes.length;
        state.mdsColors = new Array(n).fill(-1);
        let ci = 0;
        for (const s of state.selected) {
            state.mdsColors[s] = ci++;
        }
        state.mdsEdgeColors = new Array(state.edges.length).fill(-1);
        for (let ei = 0; ei < state.edges.length; ei++) {
            const [a, b] = state.edges[ei];
            const asel = state.selected.has(a);
            const bsel = state.selected.has(b);
            if (asel && !bsel) {
                state.mdsEdgeColors[ei] = state.mdsColors[a];
            } else if (bsel && !asel) {
                state.mdsEdgeColors[ei] = state.mdsColors[b];
            } else if (asel && bsel) {
                state.mdsEdgeColors[ei] = Math.min(state.mdsColors[a], state.mdsColors[b]);
            }
        }
    }
    // MDS: assign palette colors to dominating set and propagate to dominated nodes
    else if (state.solvedProblem === 'mds' && state.selected && state.selected.size > 0) {
        const n = state.nodes.length;
        state.mdsColors = new Array(n).fill(-1);
        let ci = 0;
        for (const s of state.selected) {
            state.mdsColors[s] = ci++;
        }
        for (let v = 0; v < n; v++) {
            if (state.mdsColors[v] >= 0) continue;
            for (const [a, b] of state.edges) {
                const nb = a === v ? b : (b === v ? a : -1);
                if (nb >= 0 && state.selected.has(nb)) {
                    state.mdsColors[v] = state.mdsColors[nb];
                    break;
                }
            }
        }
        state.mdsEdgeColors = new Array(state.edges.length).fill(-1);
        for (let ei = 0; ei < state.edges.length; ei++) {
            const [a, b] = state.edges[ei];
            if (state.selected.has(a) && !state.selected.has(b) && state.mdsColors[b] === state.mdsColors[a]) {
                state.mdsEdgeColors[ei] = state.mdsColors[a];
            } else if (state.selected.has(b) && !state.selected.has(a) && state.mdsColors[a] === state.mdsColors[b]) {
                state.mdsEdgeColors[ei] = state.mdsColors[b];
            }
        }
    } else {
        state.mdsColors = null;
        state.mdsEdgeColors = null;
    }
}

function onPointerDown(e) {
    if (state.solving) return;
    const { cx, cy } = getCanvasXY(e);
    const hit = hitTestNode(cx, cy);
    if (hit >= 0) {
        state.drag = { index: hit };
        state.didDrag = false;
        document.getElementById('graph-canvas').style.cursor = 'grabbing';
    }
}

function onPointerMove(e) {
    const canvas = document.getElementById('graph-canvas');
    const { cx, cy } = getCanvasXY(e);

    if (state.drag !== null) {
        state.didDrag = true;
        state.nodes[state.drag.index].x = clamp(cx, PADDING, CANVAS_W - PADDING);
        state.nodes[state.drag.index].y = clamp(cy, PADDING, CANVAS_H - PADDING);
        render();
        return;
    }

    // Hover cursor
    const hit = hitTestNode(cx, cy);
    canvas.style.cursor = hit >= 0 ? 'grab' : 'crosshair';
}

function onPointerUp(e) {
    const canvas = document.getElementById('graph-canvas');

    if (state.drag !== null) {
        if (!state.didDrag) {
            // Click on node without drag → handle node selection for edge creation
            handleNodeClick(state.drag.index, e);
        }
        state.drag = null;
        canvas.style.cursor = 'crosshair';
        render();
        return;
    }

    // Click on empty space → add node
    if (state.solving) return;
    const { cx, cy } = getCanvasXY(e);
    if (hitTestNode(cx, cy) >= 0) return;

    if (state.nodes.length >= MAX_NODES) {
        setStatus(`Maximum ${MAX_NODES} nodes reached.`, 'error');
        return;
    }
    const x = clamp(cx, PADDING, CANVAS_W - PADDING);
    const y = clamp(cy, PADDING, CANVAS_H - PADDING);
    state.nodes.push({ x, y });
    state.activeNode = null;
    render();
}

// Ensure s/t inputs are valid distinct node indices (defaults: 0 and N-1)
function clampEndpointInputs() {
    const n = state.nodes.length;
    if (n < 2) return;
    const sEl = document.getElementById('sp-source');
    const tEl = document.getElementById('sp-target');
    let s = parseInt(sEl.value), t = parseInt(tEl.value);
    if (isNaN(s) || s < 0 || s >= n) s = 0;
    if (isNaN(t) || t < 0 || t >= n) t = n - 1;
    if (t === s) t = (s === n - 1) ? 0 : n - 1;
    sEl.value = s;
    tEl.value = t;
}

function handleNodeClick(index, e) {
    if (e && (e.shiftKey || e.ctrlKey || e.metaKey)) {
        const prob = getSelectedProblem();
        // s-t problems: Shift+click sets source s, Ctrl/Cmd+click sets target t
        if (ST_PROBLEMS.includes(prob)) {
            const id = e.shiftKey ? 'sp-source' : 'sp-target';
            document.getElementById(id).value = index;
            state.activeNode = null;
            clearSolution();
            return;
        }
        // Steiner tree: modifier+click toggles terminal membership
        if (prob === 'steiner') {
            if (state.terminals.has(index)) state.terminals.delete(index);
            else state.terminals.add(index);
            state.activeNode = null;
            clearSolution();
            return;
        }
        // Shortest path tree: modifier+click sets the root
        if (prob === 'spt') {
            document.getElementById('spt-root').value = index;
            state.activeNode = null;
            clearSolution();
            return;
        }
    }
    if (state.activeNode === null) {
        // Select this node for edge creation
        state.activeNode = index;
    } else if (state.activeNode === index) {
        // Deselect
        state.activeNode = null;
    } else {
        // Toggle edge between activeNode and clicked node
        const edgeIdx = findEdge(state.activeNode, index);
        if (edgeIdx >= 0) {
            state.edges.splice(edgeIdx, 1);
        } else {
            state.edges.push([state.activeNode, index]);
        }
        state.activeNode = null;
    }
}

function onContextMenu(e) {
    e.preventDefault();
    if (state.solving) return;
    const { cx, cy } = getCanvasXY(e);
    const hit = hitTestNode(cx, cy);
    if (hit < 0) return;

    // Remove node and its edges
    state.nodes.splice(hit, 1);
    state.edges = state.edges
        .filter(([i, j]) => i !== hit && j !== hit)
        .map(([i, j]) => [i > hit ? i - 1 : i, j > hit ? j - 1 : j]);
    remapTerminals(hit);
    if (state.activeNode === hit) state.activeNode = null;
    else if (state.activeNode !== null && state.activeNode > hit) state.activeNode--;
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
        // Update visual state from progress data
        clearSolution();
        state.solvedProblem = getSelectedProblem();
        state.energy = event.energy;
        state.lastTTS = event.tts;
        if (event.selected) state.selected = new Set(event.selected);
        if (event.highlight_edges) state.highlightEdges = event.highlight_edges;
        if (event.path) state.path = event.path;
        if (event.path_endpoints) state.pathEndpoints = event.path_endpoints;
        if (event.node_colors) state.nodeColors = event.node_colors;
        if (event.edge_colors) state.edgeColors = event.edge_colors;
        computePaletteColors();
        if (event.variables || event.matrix) renderVariablePanel(event);
        updateSolvingStatus();
        render();
    } else if (event.type === 'expr') {
        renderExprPanel(event);
    } else if (event.type === 'result') {
        handleSolveResult(event);
    } else if (event.type === 'error') {
        setStatus('Error: ' + event.error, 'error');
    }
}

// ==================== Elapsed Timer ====================

function updateSolvingStatus() {
    const elapsed = ((Date.now() - state.solveStart) / 1000).toFixed(1);
    if (state.energy != null) {
        const tts = state.lastTTS != null ? state.lastTTS.toFixed(2) : '?';
        setStatus(`Solving [${elapsed}s] Energy: ${state.energy} (TTS: ${tts}s)`, '');
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

// ==================== Solver ====================

async function solve() {
    const prob0 = getSelectedProblem();
    if (prob0 === 'tsp' && state.nodes.length < 3) {
        setStatus('Place at least 3 nodes for TSP.', 'error');
        return;
    }
    if (state.nodes.length < 2) {
        setStatus('Place at least 2 nodes.', 'error');
        return;
    }
    if (state.edges.length === 0 && prob0 !== 'tsp' && prob0 !== 'diversity') {
        setStatus('Add at least 1 edge.', 'error');
        return;
    }
    let spS = 0, spT = 0;
    if (ST_PROBLEMS.includes(prob0)) {
        spS = parseInt(document.getElementById('sp-source').value);
        spT = parseInt(document.getElementById('sp-target').value);
        if (isNaN(spS) || isNaN(spT) || spS < 0 || spT < 0 ||
            spS >= state.nodes.length || spT >= state.nodes.length) {
            setStatus('s and t must be valid node indices.', 'error');
            return;
        }
        if (spS === spT) {
            setStatus('s and t must be different nodes.', 'error');
            return;
        }
    }
    let dpK = 2;
    if (prob0 === 'disjoint_paths') {
        dpK = parseInt(document.getElementById('dp-count').value);
        if (isNaN(dpK) || dpK < 2 || dpK > 4) {
            setStatus('Paths must be between 2 and 4.', 'error');
            return;
        }
        const deg = (v) => state.edges.filter(([a, b]) => a === v || b === v).length;
        if (deg(spS) < dpK || deg(spT) < dpK) {
            setStatus(`s and t need degree ≥ ${dpK} for ${dpK} disjoint paths.`, 'error');
            return;
        }
    }
    if (prob0 === 'steiner') {
        state.terminals = new Set([...state.terminals].filter(v => v < state.nodes.length));
        if (state.terminals.size < 2 || state.terminals.size > 8) {
            setStatus('Shift+click nodes to mark 2-8 terminals.', 'error');
            return;
        }
    }
    let dkK = 4;
    if (prob0 === 'densest' || prob0 === 'diversity') {
        dkK = parseInt(document.getElementById('dk-size').value);
        if (isNaN(dkK) || dkK < 2 || dkK > state.nodes.length) {
            setStatus('k must be between 2 and the number of nodes.', 'error');
            return;
        }
    }
    let pmP = 3;
    if (prob0 === 'p_median') {
        pmP = parseInt(document.getElementById('pm-count').value);
        if (isNaN(pmP) || pmP < 1 || pmP > 6 || pmP > state.nodes.length) {
            setStatus('p must be between 1 and 6 (and at most the node count).', 'error');
            return;
        }
    }
    let sptRoot = 0;
    if (prob0 === 'spt') {
        sptRoot = parseInt(document.getElementById('spt-root').value);
        if (isNaN(sptRoot) || sptRoot < 0 || sptRoot >= state.nodes.length) {
            setStatus('Root must be a valid node index.', 'error');
            return;
        }
    }
    if (state.solving) return;

    const now = Date.now();
    if (now < state.cooldownUntil) {
        const sec = Math.ceil((state.cooldownUntil - now) / 1000);
        setStatus(`Please wait ${sec}s.`, 'error');
        return;
    }

    state.solving = true;
    clearSolution();
    state.activeNode = null;
    state.lastTTS = null;
    state.solveStart = Date.now();
    document.getElementById('result-panels').classList.add('hidden');
    const btn = document.getElementById('btn-solve');
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Solving...';
    setStatus('Solving...', '');
    startElapsedTimer();
    render();

    const time = parseInt(document.getElementById('solver-time').value) || 5;
    const payload = {
        nodes: state.nodes.map(n => [Math.round(n.x), Math.round(n.y)]),
        edges: state.edges,
        time: time,
        problem: prob0,
    };
    if (prob0 === 'coloring' || prob0 === 'edge_coloring') {
        payload.colors = parseInt(document.getElementById('color-count').value) || 3;
    }
    if (ST_PROBLEMS.includes(prob0)) {
        payload.source = spS;
        payload.target = spT;
    }
    if (prob0 === 'disjoint_paths') {
        payload.paths = dpK;
    }
    if (prob0 === 'steiner') {
        payload.terminals = [...state.terminals].sort((a, b) => a - b);
    }
    if (prob0 === 'densest' || prob0 === 'diversity') {
        payload.k = dkK;
    }
    if (prob0 === 'spt') {
        payload.source = sptRoot;
    }
    if (prob0 === 'p_median') {
        payload.p = pmP;
    }

    try {
        const resp = await fetch(API_BASE + '/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
            body: JSON.stringify(payload),
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
            // Streaming mode
            await readNdjsonStream(resp);
        } else {
            // JSON mode (fallback)
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
        state.cooldownUntil = Date.now() + COOLDOWN_SEC * 1000;
        startCooldownTimer();
        render();
    }
}

function handleSolveResult(data) {
    if (data.error) {
        setStatus('Error: ' + data.error, 'error');
        return;
    }

    // Reset all solution state before applying new results
    clearSolution();
    if (data.edges) state.edges = data.edges;
    state.selected = new Set(data.selected || []);
    state.variables = data.variables || null;
    state.conflicts = data.conflicts || [];
    state.highlightEdges = data.highlight_edges || null;
    state.path = data.path || null;
    state.nodeColors = data.node_colors || null;
    state.edgeColors = data.edge_colors || null;
    state.pathEndpoints = data.path_endpoints || null;
    state.facilities = data.facilities ? new Set(data.facilities) : null;
    state.solvedProblem = data.problem || getSelectedProblem();
    computePaletteColors();
    state.energy = data.energy;
    state.objective = data.objective;
    state.constraint = data.constraint;

    const tts = data.tts != null ? data.tts.toFixed(2) : null;
    const ttsStr = tts != null ? `  (TTS: ${tts}s)` : '';
    const prob = data.problem || getSelectedProblem();
    const nColors = data.color_count || 0;
    const size = (prob === 'matching' || prob === 'maxcut' || prob === 'mmm' || prob === 'bisection' || prob === 'mincut')
        ? (state.highlightEdges || []).length
        : state.selected.size;
    if (state.constraint === 0) {
        if (prob === 'mis') {
            setStatus(`Independent set size: ${size}${ttsStr}`, 'success');
        } else if (prob === 'mvc') {
            setStatus(`Vertex cover size: ${size}${ttsStr}`, 'success');
        } else if (prob === 'clique') {
            setStatus(`Clique size: ${size}${ttsStr}`, 'success');
        } else if (prob === 'maxcut') {
            setStatus(`Cut size: ${size}${ttsStr}`, 'success');
        } else if (prob === 'mds') {
            setStatus(`Dominating set size: ${size}${ttsStr}`, 'success');
        } else if (prob === 'mmm') {
            setStatus(`Min maximal matching size: ${size}${ttsStr}`, 'success');
        } else if (prob === 'hampath') {
            const pathStr = state.path ? state.path.join('\u2192') : '';
            setStatus(`Hamiltonian path found: ${pathStr}${ttsStr}`, 'success');
        } else if (prob === 'hamcycle') {
            const pathStr = state.path ? state.path.join('\u2192') + '\u2192' + state.path[0] : '';
            setStatus(`Hamiltonian cycle found: ${pathStr}${ttsStr}`, 'success');
        } else if (prob === 'tsp') {
            const dist = data.tour_distance || data.objective || 0;
            const pathStr = state.path ? state.path.join('\u2192') + '\u2192' + state.path[0] : '';
            setStatus(`Tour distance: ${dist}  ${pathStr}${ttsStr}`, 'success');
        } else if (prob === 'shortest_path') {
            const pathStr = state.path ? state.path.join('\u2192') : '';
            setStatus(`Path length: ${data.objective}  ${pathStr}${ttsStr}`, 'success');
        } else if (prob === 'disjoint_paths') {
            const pathsStr = (data.paths || []).map(p => p.join('\u2192')).join('  |  ');
            setStatus(`${nColors} disjoint paths, total length ${data.objective}  ${pathsStr}${ttsStr}`, 'success');
        } else if (prob === 'steiner') {
            const termSet = new Set(data.terminals || []);
            const nSteiner = [...state.selected].filter(v => !termSet.has(v)).length;
            setStatus(`Steiner tree weight: ${data.objective} (${termSet.size} terminals, ${nSteiner} Steiner points)${ttsStr}`, 'success');
        } else if (prob === 'mincut') {
            setStatus(`Min s\u2192t cut: ${size} edges${ttsStr}`, 'success');
        } else if (prob === 'spt') {
            setStatus(`Shortest path tree: total distance ${data.objective}${ttsStr}`, 'success');
        } else if (prob === 'densest') {
            setStatus(`Densest subgraph: ${data.objective} edges among ${state.selected.size} nodes${ttsStr}`, 'success');
        } else if (prob === 'bisection') {
            setStatus(`Bisection cut size: ${size}${ttsStr}`, 'success');
        } else if (prob === 'coloring') {
            setStatus(`Valid ${nColors}-vertex-coloring found${ttsStr}`, 'success');
        } else if (prob === 'edge_coloring') {
            setStatus(`Valid ${nColors}-edge-coloring found${ttsStr}`, 'success');
        } else if (prob === 'clique_partition') {
            setStatus(`Partitioned into ${nColors} cliques (${data.objective} intra-clique edges)${ttsStr}`, 'success');
        } else if (prob === 'p_median') {
            setStatus(`p-median cost: ${data.objective} (${nColors} facilities)${ttsStr}`, 'success');
        } else if (prob === 'diversity') {
            setStatus(`Diversity: ${data.objective} over ${state.selected.size} nodes${ttsStr}`, 'success');
        } else {
            setStatus(`Matching size: ${size}${ttsStr}`, 'success');
        }
    } else {
        if (prob === 'mis') {
            setStatus(`Size: ${size}, Conflicts: ${state.conflicts.length}${ttsStr}`, 'error');
        } else if (prob === 'mvc') {
            setStatus(`Size: ${size}, Uncovered edges: ${state.conflicts.length}${ttsStr}`, 'error');
        } else if (prob === 'clique') {
            setStatus(`Size: ${size}, Missing edges: ${state.conflicts.length}${ttsStr}`, 'error');
        } else if (prob === 'mds') {
            setStatus(`Size: ${size}, Non-dominated: ${state.constraint}${ttsStr}`, 'error');
        } else if (prob === 'mmm') {
            setStatus(`Size: ${size}, Violations: ${state.constraint}${ttsStr}`, 'error');
        } else if (prob === 'hampath') {
            const pathStr = state.path ? state.path.map(n => n >= 0 ? n : '?').join('\u2192') : '';
            setStatus(`${pathStr}  Violations: ${state.constraint}${ttsStr}`, 'error');
        } else if (prob === 'hamcycle') {
            const pathStr = state.path ? state.path.map(n => n >= 0 ? n : '?').join('\u2192') + '\u2192' + (state.path[0] >= 0 ? state.path[0] : '?') : '';
            setStatus(`${pathStr}  Violations: ${state.constraint}${ttsStr}`, 'error');
        } else if (prob === 'tsp') {
            const pathStr = state.path ? state.path.map(n => n >= 0 ? n : '?').join('\u2192') + '\u2192' + (state.path[0] >= 0 ? state.path[0] : '?') : '';
            setStatus(`${pathStr}  Violations: ${state.constraint}${ttsStr}`, 'error');
        } else if (prob === 'shortest_path') {
            setStatus(`No valid s\u2192t path: ${state.constraint} degree violations${ttsStr}`, 'error');
        } else if (prob === 'disjoint_paths') {
            setStatus(`No valid disjoint paths: ${state.constraint} violations${ttsStr}`, 'error');
        } else if (prob === 'steiner') {
            setStatus(`Not a valid Steiner tree: ${state.constraint} violations${ttsStr}`, 'error');
        } else if (prob === 'mincut') {
            setStatus(`Endpoints not separated: ${state.constraint} violations${ttsStr}`, 'error');
        } else if (prob === 'spt') {
            setStatus(`Not a valid shortest path tree: ${state.constraint} violations${ttsStr}`, 'error');
        } else if (prob === 'densest') {
            setStatus(`Subset size off by ${state.constraint}${ttsStr}`, 'error');
        } else if (prob === 'bisection') {
            setStatus(`Cut size: ${size}, Partition imbalance: ${state.constraint}${ttsStr}`, 'error');
        } else if (prob === 'coloring') {
            setStatus(`Color conflicts: ${state.conflicts.length}, Invalid nodes: ${state.constraint}${ttsStr}`, 'error');
        } else if (prob === 'edge_coloring') {
            setStatus(`Color conflicts: ${state.conflicts.length}, Uncolored edges: ${state.constraint}${ttsStr}`, 'error');
        } else if (prob === 'clique_partition') {
            setStatus(`Not a clique partition: ${state.constraint} violations${ttsStr}`, 'error');
        } else if (prob === 'p_median') {
            setStatus(`Invalid facility assignment: ${state.constraint} violations${ttsStr}`, 'error');
        } else if (prob === 'diversity') {
            setStatus(`Subset size off by ${state.constraint}${ttsStr}`, 'error');
        } else {
            setStatus(`Size: ${size}, Adjacent conflicts: ${state.conflicts.length}${ttsStr}`, 'error');
        }
    }
    renderResultPanels(data);
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

function renderVariablePanel(data) {
    const panels = document.getElementById('result-panels');
    panels.classList.remove('hidden');

    const titleEl = document.querySelector('#result-panels .panel:first-child h2');
    const wrap = document.getElementById('vector-wrap');

    if (data.matrix) {
        // 2D matrix display
        const rows = data.matrix.length;
        const cols = data.matrix[0].length;
        const isEdgeColor = data.edge_colors != null;
        const isColoring = data.edge_colors != null || data.node_colors != null;
        titleEl.innerHTML = `Variable Matrix <span class="vector-dim" id="vector-dim"></span>`;
        document.getElementById('vector-dim').textContent = `(${rows} \u00d7 ${cols})`;
        let html = '<table>';
        if (isEdgeColor && data.edges) {
            html += '<tr><th></th>';
            for (let j = 0; j < cols; j++) html += `<th>${data.edges[j][0]}</th>`;
            html += '</tr><tr><th></th>';
            for (let j = 0; j < cols; j++) html += `<th>${data.edges[j][1]}</th>`;
            html += '</tr>';
        } else {
            html += '<tr><th></th>';
            for (let j = 0; j < cols; j++) html += `<th>${j}</th>`;
            html += '</tr>';
        }
        const isHampath = state.solvedProblem === 'hampath' && state.pathEndpoints != null;
        const hamStart = isHampath ? state.pathEndpoints[0] : -1;
        const hamEnd   = isHampath ? state.pathEndpoints[1] : -1;
        for (let i = 0; i < rows; i++) {
            html += `<tr><th>${i}</th>`;
            for (let j = 0; j < cols; j++) {
                const v = data.matrix[i][j];
                if (isColoring && v === 1) {
                    const pc = COLOR_PALETTE[i % COLOR_PALETTE.length];
                    html += `<td style="color:${pc};font-weight:700;background:${pc}20">${v}</td>`;
                } else if (isHampath && v === 1 && j === hamStart) {
                    const pc = '#4d9fff';
                    html += `<td style="color:${pc};font-weight:700;background:${pc}20">${v}</td>`;
                } else if (isHampath && v === 1 && j === hamEnd) {
                    const pc = '#22c55e';
                    html += `<td style="color:${pc};font-weight:700;background:${pc}20">${v}</td>`;
                } else {
                    const cls = v === 1 ? 'one' : '';
                    html += `<td class="${cls}">${v}</td>`;
                }
            }
            html += '</tr>';
        }
        html += '</table>';
        wrap.innerHTML = html;
    } else if (data.variables) {
        const n = data.variables.length;
        const isMatching = data.edge_map != null;
        titleEl.innerHTML = `Variable Vector <span class="vector-dim" id="vector-dim"></span>`;
        document.getElementById('vector-dim').textContent =
            isMatching ? `(${n} edge variables)` : `(${n} variables)`;
        let html = '<table><tr>';
        if (isMatching) {
            for (let i = 0; i < n; i++) {
                const [u, v] = data.edge_map[i];
                html += `<th>${u}-${v}</th>`;
            }
        } else {
            for (let i = 0; i < n; i++) html += `<th>x${i}</th>`;
        }
        const isMdsVec = (state.solvedProblem === 'mds' || state.solvedProblem === 'mvc' || state.solvedProblem === 'mis') && state.mdsColors != null;
        const selectedVal = 1;
        html += '</tr><tr>';
        for (let i = 0; i < n; i++) {
            const v = data.variables[i];
            if (isMdsVec && state.mdsColors[i] >= 0) {
                const pc = COLOR_PALETTE[state.mdsColors[i] % COLOR_PALETTE.length];
                const bold = v === 1 ? 'font-weight:700;' : '';
                html += `<td style="color:${pc};${bold}background:${pc}20">${v}</td>`;
            } else {
                const cls = v === selectedVal ? 'one' : '';
                html += `<td class="${cls}">${v}</td>`;
            }
        }
        html += '</tr></table>';
        wrap.innerHTML = html;
    }
}

function renderExprPanel(data) {
    const panels = document.getElementById('result-panels');
    panels.classList.remove('hidden');

    const vars = data.var_count || 0;
    const maxDeg = data.max_degree || 0;
    const tc = data.term_counts || [];
    const exprLabel = maxDeg >= 3 ? 'HUBO' : 'QUBO';
    const exprTitle = document.getElementById('expr-title');
    exprTitle.childNodes[0].textContent = `${exprLabel} Expression `;
    const degreeNames = ['constant', 'linear', 'quadratic', 'cubic'];
    const parts = [];
    let totalTerms = 0;
    for (let d = 1; d < tc.length; d++) {
        if (tc[d] > 0) {
            const name = d < degreeNames.length ? degreeNames[d] : `deg-${d}`;
            parts.push(`${tc[d]} ${name}`);
            totalTerms += tc[d];
        }
    }
    const termsInfo = parts.length > 0 ? parts.join(', ') : '0 terms';
    document.getElementById('expr-info').textContent =
        `(${vars} variables, degree ${maxDeg}, ${termsInfo})`;
    if (data.expr) {
        const formatted = data.expr.replace(/ ([+-])/g, '\n$1');
        document.getElementById('expr-box').textContent = formatted;
    } else {
        document.getElementById('expr-box').textContent =
            `(Expression omitted for large graphs — ${vars} variables, ${totalTerms} terms)`;
    }
}

function renderResultPanels(data) {
    const panels = document.getElementById('result-panels');
    if (!data.variables && !data.matrix && !data.expr) { panels.classList.add('hidden'); return; }
    if (data.variables || data.matrix) renderVariablePanel(data);
    if (data.var_count != null) renderExprPanel(data);
}

// ==================== Utility ====================

function setStatus(msg, type) {
    const el = document.getElementById('status-bar');
    el.textContent = msg;
    el.className = 'status-bar' + (type ? ' ' + type : '');
}

// ==================== Graph Generation ====================

function addRandomNodes() {
    const count = parseInt(document.getElementById('gen-node-count').value) || 10;
    const toAdd = Math.max(1, Math.min(MAX_NODES - state.nodes.length, count));
    if (state.nodes.length >= MAX_NODES) {
        setStatus(`Maximum ${MAX_NODES} nodes reached.`, 'error');
        return;
    }
    const minDist = 40;
    const xMin = PADDING + NODE_RADIUS;
    const xMax = CANVAS_W - PADDING - NODE_RADIUS;
    const yMin = PADDING + NODE_RADIUS;
    const yMax = CANVAS_H - PADDING - NODE_RADIUS;

    state.activeNode = null;

    let added = 0;
    for (let i = 0; i < toAdd; i++) {
        let placed = false;
        for (let attempt = 0; attempt < 300; attempt++) {
            const x = xMin + Math.random() * (xMax - xMin);
            const y = yMin + Math.random() * (yMax - yMin);
            let ok = true;
            for (const nd of state.nodes) {
                const dx = nd.x - x, dy = nd.y - y;
                if (dx * dx + dy * dy < minDist * minDist) { ok = false; break; }
            }
            if (ok) { state.nodes.push({ x, y }); added++; placed = true; break; }
        }
        if (!placed) break;
    }
    setStatus(`Added ${added} nodes (total ${state.nodes.length}).`, '');
    render();
}

function removeRandomNodes() {
    if (state.nodes.length === 0) {
        setStatus('No nodes to remove.', 'error');
        return;
    }
    const count = parseInt(document.getElementById('gen-node-count').value) || 10;
    const toRemove = Math.min(count, state.nodes.length);
    state.activeNode = null;

    for (let i = 0; i < toRemove; i++) {
        const idx = Math.floor(Math.random() * state.nodes.length);
        state.nodes.splice(idx, 1);
        state.edges = state.edges
            .filter(([a, b]) => a !== idx && b !== idx)
            .map(([a, b]) => [a > idx ? a - 1 : a, b > idx ? b - 1 : b]);
        remapTerminals(idx);
    }
    setStatus(`Removed ${toRemove} nodes (total ${state.nodes.length}).`, '');
    render();
}

function addRandomEdges() {
    if (state.nodes.length < 2) {
        setStatus('Place nodes first.', 'error');
        return;
    }
    const count = parseInt(document.getElementById('gen-edge-count').value) || 15;
    const m = Math.max(1, count);

    let added = 0;
    for (let attempt = 0; attempt < m * 10 && added < m; attempt++) {
        const i = Math.floor(Math.random() * state.nodes.length);
        let j = Math.floor(Math.random() * (state.nodes.length - 1));
        if (j >= i) j++;
        if (findEdge(i, j) < 0) {
            state.edges.push([Math.min(i, j), Math.max(i, j)]);
            added++;
        }
    }
    setStatus(`Added ${added} edges (total ${state.edges.length}).`, '');
    render();
}

function removeRandomEdges() {
    if (state.edges.length === 0) {
        setStatus('No edges to remove.', 'error');
        return;
    }
    const count = parseInt(document.getElementById('gen-edge-count').value) || 15;
    const toRemove = Math.min(count, state.edges.length);

    for (let i = 0; i < toRemove; i++) {
        const idx = Math.floor(Math.random() * state.edges.length);
        state.edges.splice(idx, 1);
    }
    setStatus(`Removed ${toRemove} edges (total ${state.edges.length}).`, '');
    render();
}

function spreadNodes() {
    const n = state.nodes.length;
    if (n < 2) { setStatus('Need at least 2 nodes.', 'error'); return; }
    const xMin = PADDING + NODE_RADIUS, xMax = CANVAS_W - PADDING - NODE_RADIUS;
    const yMin = PADDING + NODE_RADIUS, yMax = CANVAS_H - PADDING - NODE_RADIUS;
    const pts = state.nodes.map(nd => [nd.x, nd.y]);

    // --- Delaunay triangulation (brute-force O(n^4), fine for n<=32) ---
    const adj = Array.from({length: n}, () => new Set());
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          const [ax,ay] = pts[i], [bx,by] = pts[j], [cx,cy] = pts[k];
          const ori = (bx-ax)*(cy-ay) - (by-ay)*(cx-ax);
          if (Math.abs(ori) < 1e-10) continue; // collinear
          // Ensure CCW order for circumcircle test
          let pa = pts[i], pb, pc;
          if (ori > 0) { pb = pts[j]; pc = pts[k]; }
          else         { pb = pts[k]; pc = pts[j]; }
          let empty = true;
          for (let l = 0; l < n && empty; l++) {
            if (l === i || l === j || l === k) continue;
            const adx = pa[0]-pts[l][0], ady = pa[1]-pts[l][1], al = adx*adx+ady*ady;
            const bdx = pb[0]-pts[l][0], bdy = pb[1]-pts[l][1], bl = bdx*bdx+bdy*bdy;
            const cdx = pc[0]-pts[l][0], cdy = pc[1]-pts[l][1], cl = cdx*cdx+cdy*cdy;
            const det = adx*(bdy*cl - cdy*bl) - ady*(bdx*cl - cdx*bl) + al*(bdx*cdy - cdx*bdy);
            if (det > 1e-6) empty = false;
          }
          if (empty) {
            adj[i].add(j); adj[i].add(k);
            adj[j].add(i); adj[j].add(k);
            adj[k].add(i); adj[k].add(j);
          }
        }
      }
    }
    // Fallback: ensure every point has at least one neighbor
    for (let i = 0; i < n; i++) {
      if (adj[i].size > 0) continue;
      let best = -1, bd = Infinity;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const d = Math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1]);
        if (d < bd) { bd = d; best = j; }
      }
      if (best >= 0) { adj[i].add(best); adj[best].add(i); }
    }

    // --- Sutherland-Hodgman: clip polygon by half-plane (p-m)·n <= 0 ---
    function clipPoly(poly, mx, my, nx, ny) {
      if (!poly.length) return poly;
      const out = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i+1) % poly.length];
        const da = (a[0]-mx)*nx + (a[1]-my)*ny;
        const db = (b[0]-mx)*nx + (b[1]-my)*ny;
        if (da <= 0) {
          out.push(a);
          if (db > 0) { const t = da/(da-db); out.push([a[0]+t*(b[0]-a[0]), a[1]+t*(b[1]-a[1])]); }
        } else if (db <= 0) {
          const t = da/(da-db); out.push([a[0]+t*(b[0]-a[0]), a[1]+t*(b[1]-a[1])]);
        }
      }
      return out;
    }

    // --- Pre-compute Voronoi cells on original positions ---
    const cells = [];
    for (let i = 0; i < n; i++) {
      let cell = [[xMin,yMin],[xMax,yMin],[xMax,yMax],[xMin,yMax]];
      for (let j = 0; j < n && cell.length >= 3; j++) {
        if (j === i) continue;
        cell = clipPoly(cell, (pts[i][0]+pts[j][0])/2, (pts[i][1]+pts[j][1])/2,
                               pts[j][0]-pts[i][0], pts[j][1]-pts[i][1]);
      }
      cells.push(cell);
    }

    // --- Point-in-polygon (ray casting) ---
    function pip(px, py, poly) {
      let ins = false;
      for (let i = 0, j = poly.length-1; i < poly.length; j = i++) {
        const [xi,yi] = poly[i], [xj,yj] = poly[j];
        if ((yi > py) !== (yj > py) && px < (xj-xi)*(py-yi)/(yj-yi)+xi) ins = !ins;
      }
      return ins;
    }

    // --- Sequential update: move each node to best position in its Voronoi cell ---
    const G = 30; // grid resolution per axis
    for (let i = 0; i < n; i++) {
      const cell = cells[i];
      if (cell.length < 3) continue;
      const nbrs = [...adj[i]];
      if (!nbrs.length) continue;

      // Bounding box of cell
      let bxMin = Infinity, bxMax = -Infinity, byMin = Infinity, byMax = -Infinity;
      for (const [x,y] of cell) {
        if (x < bxMin) bxMin = x; if (x > bxMax) bxMax = x;
        if (y < byMin) byMin = y; if (y > byMax) byMax = y;
      }

      // Candidate positions: cell vertices, edge midpoints, centroid, grid, current pos
      const cands = [...cell];
      cands.push(pts[i]); // keep current as candidate (never regress)
      for (let ci = 0; ci < cell.length; ci++) {
        const a = cell[ci], b = cell[(ci+1) % cell.length];
        cands.push([(a[0]+b[0])/2, (a[1]+b[1])/2]);
      }
      let sx = 0, sy = 0;
      for (const [x,y] of cell) { sx += x; sy += y; }
      cands.push([sx/cell.length, sy/cell.length]);

      const gx = (bxMax - bxMin) / G || 1, gy = (byMax - byMin) / G || 1;
      for (let gi = 0; gi <= G; gi++) {
        for (let gj = 0; gj <= G; gj++) {
          const px = bxMin + gi*gx, py = byMin + gj*gy;
          if (pip(px, py, cell)) cands.push([px, py]);
        }
      }

      // Pick candidate maximizing min distance to Delaunay neighbors (current positions)
      let bestX = pts[i][0], bestY = pts[i][1], bestMin = -1;
      for (const [px, py] of cands) {
        let minD = Infinity;
        for (const j of nbrs) {
          const d = Math.hypot(px - pts[j][0], py - pts[j][1]);
          if (d < minD) minD = d;
        }
        if (minD > bestMin) { bestMin = minD; bestX = px; bestY = py; }
      }
      // Clamp displacement to MAX_STEP
      const MAX_STEP = 20;
      const dx = bestX - pts[i][0], dy = bestY - pts[i][1];
      const dist = Math.hypot(dx, dy);
      if (dist > MAX_STEP) {
        bestX = pts[i][0] + dx / dist * MAX_STEP;
        bestY = pts[i][1] + dy / dist * MAX_STEP;
      }
      pts[i] = [bestX, bestY];
    }

    for (let i = 0; i < n; i++) {
      state.nodes[i].x = clamp(pts[i][0], xMin, xMax);
      state.nodes[i].y = clamp(pts[i][1], yMin, yMax);
    }
    render();
}

function unitDiskGraph() {
    if (state.nodes.length < 2) {
        setStatus('Place at least 2 nodes.', 'error');
        return;
    }
    const dist = parseFloat(document.getElementById('gen-udg-dist').value) || 150;
    const r2 = dist * dist;
    clearSolution();

    const newEdges = [];
    for (let i = 0; i < state.nodes.length; i++) {
        for (let j = i + 1; j < state.nodes.length; j++) {
            const dx = state.nodes[i].x - state.nodes[j].x;
            const dy = state.nodes[i].y - state.nodes[j].y;
            if (dx * dx + dy * dy <= r2) {
                newEdges.push([i, j]);
            }
        }
    }
    state.edges = newEdges;
    setStatus(`UDG (d=${dist}): ${newEdges.length} edges from ${state.nodes.length} nodes.`, '');
    render();
}

function delaunayTriangulation() {
    if (state.nodes.length < 3) {
        setStatus('Need at least 3 nodes for Delaunay.', 'error');
        return;
    }
    clearSolution();

    const pts = state.nodes.map((n, i) => ({ x: n.x, y: n.y, i }));

    // Bowyer-Watson algorithm
    // Super-triangle encompassing all points
    const margin = 1000;
    const st0 = { x: -margin, y: -margin, i: -1 };
    const st1 = { x: CANVAS_W * 2 + margin, y: -margin, i: -2 };
    const st2 = { x: CANVAS_W / 2, y: CANVAS_H * 2 + margin, i: -3 };

    let triangles = [{ a: st0, b: st1, c: st2 }];

    function circumcircleContains(tri, p) {
        const ax = tri.a.x, ay = tri.a.y;
        const bx = tri.b.x, by = tri.b.y;
        const cx = tri.c.x, cy = tri.c.y;
        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 1e-10) return false;
        const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
        const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
        const dx = ax - ux, dy = ay - uy;
        const r2 = dx * dx + dy * dy;
        const px = p.x - ux, py = p.y - uy;
        return px * px + py * py <= r2;
    }

    function edgeKey(p1, p2) {
        const a = Math.min(p1.i, p2.i), b = Math.max(p1.i, p2.i);
        return `${a},${b}`;
    }

    for (const p of pts) {
        // Find bad triangles
        const bad = [];
        const good = [];
        for (const tri of triangles) {
            if (circumcircleContains(tri, p)) bad.push(tri);
            else good.push(tri);
        }

        // Find boundary polygon (edges that appear in exactly one bad triangle)
        const edgeCount = new Map();
        for (const tri of bad) {
            const edges = [[tri.a, tri.b], [tri.b, tri.c], [tri.c, tri.a]];
            for (const [e0, e1] of edges) {
                const key = edgeKey(e0, e1);
                edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
            }
        }

        const boundary = [];
        for (const tri of bad) {
            const edges = [[tri.a, tri.b], [tri.b, tri.c], [tri.c, tri.a]];
            for (const [e0, e1] of edges) {
                if (edgeCount.get(edgeKey(e0, e1)) === 1) {
                    boundary.push([e0, e1]);
                }
            }
        }

        // Create new triangles
        triangles = good;
        for (const [e0, e1] of boundary) {
            triangles.push({ a: e0, b: e1, c: p });
        }
    }

    // Extract edges from triangles, excluding super-triangle vertices
    const edgeSet = new Set();
    const newEdges = [];
    for (const tri of triangles) {
        if (tri.a.i < 0 || tri.b.i < 0 || tri.c.i < 0) continue;
        const pairs = [[tri.a.i, tri.b.i], [tri.b.i, tri.c.i], [tri.c.i, tri.a.i]];
        for (const [u, v] of pairs) {
            const a = Math.min(u, v), b = Math.max(u, v);
            const key = `${a},${b}`;
            if (!edgeSet.has(key)) {
                edgeSet.add(key);
                newEdges.push([a, b]);
            }
        }
    }

    state.edges = newEdges;
    setStatus(`Delaunay: ${state.edges.length} edges from ${state.nodes.length} nodes.`, '');
    render();
}

function randomRegularGraph() {
    const n = state.nodes.length;
    if (n < 2) {
        setStatus('Place at least 2 nodes.', 'error');
        return;
    }
    const d = parseInt(document.getElementById('gen-reg-degree').value) || 3;
    if (d >= n) {
        setStatus(`Degree ${d} too large for ${n} nodes (max ${n - 1}).`, 'error');
        return;
    }
    if (n * d % 2 !== 0) {
        setStatus(`Cannot create ${d}-regular graph: n*d must be even (${n}*${d}=${n * d}).`, 'error');
        return;
    }
    clearSolution();

    // Step 1: Trivial d-regular graph: node i connects to i+1, i+2, ..., i+d/2 (mod n)
    // (works because n*d is even and d < n)
    const edgeKey = (u, v) => u < v ? `${u},${v}` : `${v},${u}`;
    const edgeSet = new Set();
    const half = d / 2;
    if (d % 2 === 0) {
        // Even degree: connect i to i+1..i+half (mod n)
        for (let i = 0; i < n; i++) {
            for (let k = 1; k <= half; k++) {
                edgeSet.add(edgeKey(i, (i + k) % n));
            }
        }
    } else {
        // Odd degree (n must be even): connect i to i+1..i+floor(d/2) (mod n) + antipodal
        const fh = Math.floor(d / 2);
        for (let i = 0; i < n; i++) {
            for (let k = 1; k <= fh; k++) {
                edgeSet.add(edgeKey(i, (i + k) % n));
            }
        }
        // Add antipodal edges (i -- i+n/2) for the remaining degree
        for (let i = 0; i < n / 2; i++) {
            edgeSet.add(edgeKey(i, i + n / 2));
        }
    }

    // Step 2: Randomize by swapping edges that share no vertex
    // Pick two edges (a-b, c-d) with no shared vertex, replace with (a-c, b-d) or (a-d, b-c)
    const edges = Array.from(edgeSet).map(k => k.split(',').map(Number));
    const numSwaps = edges.length * 10;
    for (let s = 0; s < numSwaps; s++) {
        const i = Math.floor(Math.random() * edges.length);
        const j = Math.floor(Math.random() * edges.length);
        if (i === j) continue;
        const [a, b] = edges[i];
        const [c, d2] = edges[j];
        if (a === c || a === d2 || b === c || b === d2) continue;
        // Try swap: (a-c, b-d2) or (a-d2, b-c), pick one randomly
        let nu, nv, nw, nx;
        if (Math.random() < 0.5) {
            nu = a; nv = c; nw = b; nx = d2;
        } else {
            nu = a; nv = d2; nw = b; nx = c;
        }
        const key1 = edgeKey(nu, nv);
        const key2 = edgeKey(nw, nx);
        if (edgeSet.has(key1) || edgeSet.has(key2)) continue;  // would create multi-edge
        // Perform swap
        const oldKey1 = edgeKey(a, b);
        const oldKey2 = edgeKey(c, d2);
        edgeSet.delete(oldKey1);
        edgeSet.delete(oldKey2);
        edgeSet.add(key1);
        edgeSet.add(key2);
        edges[i] = [nu, nv];
        edges[j] = [nw, nx];
    }

    state.edges = edges.map(([a, b]) => [Math.min(a, b), Math.max(a, b)]);
    setStatus(`${d}-regular graph: ${state.edges.length} edges from ${n} nodes.`, '');
    render();
}

// ==================== Structured Graph Generators ====================

function generateCycleGraph() {
    const count = Math.min(parseInt(document.getElementById('gen-cycle-n').value) || 10, MAX_NODES);
    if (count < 3) {
        setStatus('Need at least 3 nodes for cycle.', 'error');
        return;
    }
    clearSolution();
    state.activeNode = null;

    const cx = CANVAS_W / 2, cy = CANVAS_H / 2;
    const r = Math.min(cx, cy) - PADDING - NODE_RADIUS - 20;
    state.nodes = [];
    state.edges = [];
    for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
        state.nodes.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
    for (let i = 0; i < count; i++) {
        state.edges.push([i, (i + 1) % count]);
    }
    setStatus(`Cycle: ${count} nodes, ${state.edges.length} edges.`, '');
    render();
}

function generateGridGraph() {
    const rows = parseInt(document.getElementById('gen-grid-rows').value) || 4;
    const cols = parseInt(document.getElementById('gen-grid-cols').value) || 4;
    if (rows * cols > MAX_NODES) {
        setStatus(`Grid ${rows}×${cols}=${rows * cols} exceeds ${MAX_NODES} nodes.`, 'error');
        return;
    }
    if (rows < 1 || cols < 1) {
        setStatus('Grid dimensions must be at least 1.', 'error');
        return;
    }
    clearSolution();
    state.activeNode = null;

    const areaW = CANVAS_W - 2 * PADDING - 2 * NODE_RADIUS;
    const areaH = CANVAS_H - 2 * PADDING - 2 * NODE_RADIUS;
    const spacingX = cols > 1 ? areaW / (cols - 1) : 0;
    const spacingY = rows > 1 ? areaH / (rows - 1) : 0;
    const offsetX = PADDING + NODE_RADIUS + (cols === 1 ? areaW / 2 : 0);
    const offsetY = PADDING + NODE_RADIUS + (rows === 1 ? areaH / 2 : 0);

    state.nodes = [];
    state.edges = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            state.nodes.push({ x: offsetX + c * spacingX, y: offsetY + r * spacingY });
            const idx = r * cols + c;
            if (c > 0) state.edges.push([idx - 1, idx]);
            if (r > 0) state.edges.push([idx - cols, idx]);
        }
    }
    setStatus(`Grid ${rows}×${cols}: ${state.nodes.length} nodes, ${state.edges.length} edges.`, '');
    render();
}

function generateHypercubeGraph() {
    const d = parseInt(document.getElementById('gen-hyper-dim').value) || 3;
    const n = 1 << d;  // 2^d
    if (n > MAX_NODES) {
        setStatus(`Hypercube Q${d} has ${n} nodes (max ${MAX_NODES}).`, 'error');
        return;
    }
    if (d < 1) {
        setStatus('Dimension must be at least 1.', 'error');
        return;
    }
    clearSolution();
    state.activeNode = null;

    // Layout: arrange in a circle in Gray code order
    const cx = CANVAS_W / 2, cy = CANVAS_H / 2;
    const r = Math.min(cx, cy) - PADDING - NODE_RADIUS - 20;
    // Gray code position: node i goes to circle position grayPos[i]
    const grayPos = new Array(n);
    for (let k = 0; k < n; k++) {
        grayPos[k ^ (k >> 1)] = k;  // gray(k) -> position k
    }
    state.nodes = [];
    state.edges = [];
    for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + (2 * Math.PI * grayPos[i]) / n;
        state.nodes.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
    // Edges: connect nodes differing in exactly one bit
    for (let i = 0; i < n; i++) {
        for (let b = 0; b < d; b++) {
            const j = i ^ (1 << b);
            if (j > i) state.edges.push([i, j]);
        }
    }
    setStatus(`Hypercube Q${d}: ${n} nodes, ${state.edges.length} edges.`, '');
    render();
}

function generateBinaryTree() {
    const depth = parseInt(document.getElementById('gen-tree-depth').value) || 3;
    const n = (1 << (depth + 1)) - 1;  // 2^(depth+1) - 1
    if (n > MAX_NODES) {
        setStatus(`Binary tree depth ${depth} has ${n} nodes (max ${MAX_NODES}).`, 'error');
        return;
    }
    if (depth < 1) {
        setStatus('Depth must be at least 1.', 'error');
        return;
    }
    clearSolution();
    state.activeNode = null;

    const areaW = CANVAS_W - 2 * PADDING - 2 * NODE_RADIUS;
    const areaH = CANVAS_H - 2 * PADDING - 2 * NODE_RADIUS;
    const levelH = areaH / depth;

    // BFS-order layout
    state.nodes = [];
    state.edges = [];
    for (let level = 0; level <= depth; level++) {
        const count = 1 << level;
        const spacing = areaW / count;
        for (let i = 0; i < count; i++) {
            const x = PADDING + NODE_RADIUS + spacing * (i + 0.5);
            const y = PADDING + NODE_RADIUS + level * levelH;
            state.nodes.push({ x, y });
            const idx = (1 << level) - 1 + i;  // global index
            if (idx > 0) {
                const parent = Math.floor((idx - 1) / 2);
                state.edges.push([parent, idx]);
            }
        }
    }
    setStatus(`Binary tree (depth ${depth}): ${n} nodes, ${state.edges.length} edges.`, '');
    render();
}

function generateCompleteGraph() {
    const n = state.nodes.length;
    if (n < 2) {
        setStatus('Need at least 2 nodes for complete graph.', 'error');
        return;
    }
    clearSolution();
    state.edges = [];
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            state.edges.push([i, j]);
        }
    }
    setStatus(`Complete K${n}: ${n} nodes, ${state.edges.length} edges.`, '');
    render();
}

// ==================== Init ====================

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('btn-theme');
    btn.textContent = theme === 'dark' ? '\u263C' : '\u263E';
    btn.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    localStorage.setItem('graph-mis-theme', theme);
    render();
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('graph-canvas');
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
    canvas.addEventListener('contextmenu', onContextMenu);

    const PROBLEM_DESC = {
        mis:          'Find the largest set of non-adjacent vertices.',
        mvc:          'Find the smallest set of vertices covering all edges.',
        clique:       'Find the largest set of mutually adjacent vertices.',
        mds:          'Find the smallest set of vertices dominating all others.',
        densest:      'Find k vertices with the maximum number of induced edges.',
        diversity:    'Pick k nodes maximizing the sum of pairwise distances (edges not needed).',
        matching:     'Find the maximum number of non-adjacent edges.',
        mmm:          'Find the smallest matching that cannot be extended.',
        steiner:      'Find the lightest edge set connecting all terminals. Shift+click toggles terminals.',
        maxcut:       'Partition vertices to maximize edges between groups.',
        bisection:    'Partition vertices into two equal groups minimizing cut edges.',
        mincut:       'Find the fewest edges whose removal separates s from t. Shift+click sets s, Ctrl+click sets t.',
        clique_partition:'Partition the vertices into cliques, maximizing the edges inside groups.',
        p_median:     'Open p facilities and assign every node to one, minimizing total graph distance.',
        hampath:      'Find a path visiting every vertex exactly once.',
        hamcycle:     'Find a cycle visiting every vertex exactly once.',
        shortest_path:'Select the edges of the shortest path from s to t. Shift+click sets s, Ctrl+click sets t.',
        disjoint_paths:'Find k edge-disjoint paths from s to t of minimum total length.',
        spt:          'Find the tree of shortest paths from the root to every vertex. Shift+click sets the root.',
        tsp:          'Find the shortest cycle visiting every node. Non-edge paths are penalized.',
        coloring:     'Color vertices so no adjacent pair shares a color.',
        edge_coloring:'Color edges so no two sharing a vertex have the same color.',
    };

    document.getElementById('problem-select').addEventListener('change', (e) => {
        document.getElementById('problem-title').textContent =
            e.target.options[e.target.selectedIndex].text;
        document.getElementById('problem-desc').textContent =
            PROBLEM_DESC[e.target.value] || '';
        document.getElementById('color-count-wrap').style.display =
            (e.target.value === 'coloring' || e.target.value === 'edge_coloring') ? '' : 'none';
        const isSt = ST_PROBLEMS.includes(e.target.value);
        document.getElementById('sp-endpoints-wrap').style.display = isSt ? '' : 'none';
        document.getElementById('dp-count-wrap').style.display =
            (e.target.value === 'disjoint_paths') ? '' : 'none';
        document.getElementById('dk-size-wrap').style.display =
            (e.target.value === 'densest' || e.target.value === 'diversity') ? '' : 'none';
        document.getElementById('spt-root-wrap').style.display =
            (e.target.value === 'spt') ? '' : 'none';
        document.getElementById('pm-count-wrap').style.display =
            (e.target.value === 'p_median') ? '' : 'none';
        if (isSt) clampEndpointInputs();
        if (e.target.value === 'spt') {
            const rEl = document.getElementById('spt-root');
            const r = parseInt(rEl.value);
            if (isNaN(r) || r < 0 || r >= state.nodes.length) rEl.value = 0;
        }
        let hint = 'Click to add nodes, click two nodes to toggle edge';
        if (isSt) hint = 'Shift+click: set s (source), Ctrl+click: set t (target)';
        else if (e.target.value === 'steiner') hint = 'Shift+click: toggle terminal (2-8 nodes)';
        else if (e.target.value === 'spt') hint = 'Shift+click: set the root node';
        document.getElementById('canvas-hint').textContent = hint;
        clearSolution();
        render();
    });

    ['sp-source', 'sp-target'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            if (ST_PROBLEMS.includes(getSelectedProblem())) {
                clearSolution();
                render();
            }
        });
    });
    document.getElementById('spt-root').addEventListener('input', () => {
        if (getSelectedProblem() === 'spt') {
            clearSolution();
            render();
        }
    });

    document.getElementById('btn-solve').addEventListener('click', solve);
    document.getElementById('btn-clear').addEventListener('click', () => {
        state.nodes = [];
        state.edges = [];
        state.activeNode = null;
        state.terminals = new Set();
        clearSolution();
        setStatus('');
        document.getElementById('result-panels').classList.add('hidden');
        render();
    });
    document.getElementById('btn-clear-sol').addEventListener('click', () => {
        clearSolution();
        setStatus('');
        document.getElementById('result-panels').classList.add('hidden');
        render();
    });
    document.getElementById('btn-clear-edges').addEventListener('click', () => {
        state.edges = [];
        state.activeNode = null;
        clearSolution();
        setStatus('Edges cleared.');
        document.getElementById('result-panels').classList.add('hidden');
        render();
    });

    document.getElementById('btn-add-nodes').addEventListener('click', addRandomNodes);
    document.getElementById('btn-del-nodes').addEventListener('click', removeRandomNodes);
    document.getElementById('btn-add-edges').addEventListener('click', addRandomEdges);
    document.getElementById('btn-del-edges').addEventListener('click', removeRandomEdges);
    document.getElementById('btn-spread').addEventListener('click', spreadNodes);

    // Graph template: dropdown + generate
    const genSelect = document.getElementById('gen-type');
    function updateGenParams() {
        document.querySelectorAll('.gen-param').forEach(el => {
            el.classList.toggle('active', el.dataset.gen === genSelect.value);
        });
    }
    genSelect.addEventListener('change', updateGenParams);
    updateGenParams();

    const GEN_ACTIONS = {
        delaunay: delaunayTriangulation,
        udg: unitDiskGraph,
        regular: randomRegularGraph,
        cycle: generateCycleGraph,
        grid: generateGridGraph,
        hypercube: generateHypercubeGraph,
        bintree: generateBinaryTree,
        complete: generateCompleteGraph,
    };
    document.getElementById('btn-generate').addEventListener('click', () => {
        const fn = GEN_ACTIONS[genSelect.value];
        if (fn) fn();
    });

    document.getElementById('btn-theme').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    const slider = document.getElementById('solver-time');
    const timeVal = document.getElementById('time-value');
    slider.addEventListener('input', () => { timeVal.textContent = slider.value + 's'; });

    // Restore saved theme
    const saved = localStorage.getItem('graph-mis-theme') || 'light';
    applyTheme(saved);
});
