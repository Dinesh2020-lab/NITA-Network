const $ = (s) => document.querySelector(s);
const rnd = (a, b) => Math.random() * (b - a) + a;
const uuid = () => Math.random().toString(36).slice(2, 9);

// clock
setInterval(() => {
  $("#clock").textContent = new Date().toLocaleTimeString();
}, 1000);

// Konva setup
const stage = new Konva.Stage({
  container: "stage",
  width: window.innerWidth - 600,
  height: window.innerHeight - 60,
});
const gridLayer = new Konva.Layer();
const linkLayer = new Konva.Layer();
const nodeLayer = new Konva.Layer();
stage.add(gridLayer, linkLayer, nodeLayer);

// Zones for NIT Agartala buildings
const zones = [
  {
    name: "Library",
    x: 60,
    y: 60,
    w: 200,
    h: 150,
    color: "rgba(124,58,237,0.1)",
  },
  {
    name: "CSC Building",
    x: 320,
    y: 60,
    w: 200,
    h: 150,
    color: "rgba(34,197,94,0.1)",
  },
  {
    name: "ECE Dept",
    x: 60,
    y: 250,
    w: 200,
    h: 150,
    color: "rgba(59,130,246,0.1)",
  },
  {
    name: "Mechanical Dept",
    x: 320,
    y: 250,
    w: 200,
    h: 150,
    color: "rgba(245,158,11,0.1)",
  },
];
zones.forEach((z) => {
  const g = new Konva.Group({ x: z.x, y: z.y });
  g.add(
    new Konva.Rect({
      width: z.w,
      height: z.h,
      fill: z.color,
      cornerRadius: 10,
      stroke: "#2a3054",
    })
  );
  g.add(new Konva.Text({ text: z.name, x: 5, y: 5, fontSize: 14, fill: "#fff" }));
  gridLayer.add(g);
});
gridLayer.draw();

// data
const state = { nodes: [], links: [], linkMode: false, source: null, alerts: [] };
const devices = [
  { type: "Router", icon: "🛜", color: "#7c3aed" },
  { type: "Switch", icon: "🧮", color: "#06b6d4" },
  { type: "AP", icon: "📡", color: "#22c55e" },
  { type: "Server", icon: "🗄", color: "#f59e0b" },
];

devices.forEach((d) => {
  const btn = document.createElement("button");
  btn.className = "btn";
  btn.textContent = ${d.icon} ${d.type};
  btn.onclick = () =>
    addNode(d.type, stage.width() / 2 + rnd(-100, 100), stage.height() / 2 + rnd(-100, 100));
  $("#palette").appendChild(btn);
});

function addNode(type, x, y) {
  const meta = devices.find((t) => t.type === type);
  const id = uuid();
  const name = ${type}-${state.nodes.filter((n) => n.type === type).length + 1};
  const g = new Konva.Group({ x, y, draggable: true, id });
  g.add(new Konva.Circle({ radius: 20, fill: "#111638", stroke: meta.color, strokeWidth: 2 }));
  g.add(new Konva.Text({ text: meta.icon, fontSize: 20, x: -10, y: -10 }));
  g.add(new Konva.Text({ text: name, y: 25, fontSize: 12, fill: "#fff" }));
  nodeLayer.add(g).draw();
  const node = { id, type, name, group: g };
  state.nodes.push(node);
  updateStats();
  g.on("click", () => handleNodeClick(node));
  g.on("dragmove", () => updateLinks(node));
}

function handleNodeClick(node) {
  $("#selection").textContent = node.name;
  if (!state.linkMode) return;
  if (!state.source) {
    state.source = node;
    // small highlight while selecting source
    node.group.findOne("Circle").strokeWidth(3);
    nodeLayer.draw();
    return;
  }
  if (state.source.id !== node.id) {
    createLink(state.source, node);
  }
  // remove highlight
  state.source.group.findOne("Circle").strokeWidth(2);
  nodeLayer.draw();
  state.source = null;
  state.linkMode = false;
  $("#toggleLinkMode").classList.remove("active");
}

function createLink(a, b) {
  const line = new Konva.Line({
    points: [a.group.x(), a.group.y(), b.group.x(), b.group.y()],
    stroke: "#4f46e5",
    strokeWidth: 2,
  });
  linkLayer.add(line).draw();
  state.links.push({ id: uuid(), a: a.id, b: b.id, line });
  updateStats();
}

function updateLinks(node) {
  state.links.forEach((l) => {
    if (l.a === node.id || l.b === node.id) {
      const n1 = state.nodes.find((n) => n.id === l.a);
      const n2 = state.nodes.find((n) => n.id === l.b);
      l.line.points([n1.group.x(), n1.group.y(), n2.group.x(), n2.group.y()]);
    }
  });
  linkLayer.batchDraw();
}

function updateStats() {
  $("#statDevices").textContent = state.nodes.length;
  $("#statLinks").textContent = state.links.length;
  $("#statAlerts").textContent = state.alerts.length;
}

// ======== LINK MODE UI ========
$("#toggleLinkMode").onclick = (e) => {
  state.linkMode = !state.linkMode;
  if (!state.linkMode && state.source) {
    // clear any highlight if cancel
    state.source.group.findOne("Circle").strokeWidth(2);
    nodeLayer.draw();
    state.source = null;
  }
  e.currentTarget.classList.toggle("active", state.linkMode);
};

// ======== SIMULATION LOGIC (multi-hop path + animation) ========

// Build adjacency list from current links
function getNeighbors(nodeId) {
  const neighbors = [];
  state.links.forEach((l) => {
    if (l.a === nodeId) neighbors.push({ id: l.b, link: l });
    else if (l.b === nodeId) neighbors.push({ id: l.a, link: l });
  });
  return neighbors;
}

// BFS to find path of node ids and the corresponding links
function findPathBFS(srcId, dstId) {
  if (srcId === dstId) return { nodes: [srcId], links: [] };
  const queue = [srcId];
  const visited = new Set([srcId]);
  const parent = new Map(); // childId -> {prevId, link}

  while (queue.length) {
    const cur = queue.shift();
    for (const nb of getNeighbors(cur)) {
      if (visited.has(nb.id)) continue;
      visited.add(nb.id);
      parent.set(nb.id, { prev: cur, link: nb.link });
      if (nb.id === dstId) {
        // reconstruct
        const nodes = [dstId];
        const links = [];
        let u = dstId;
        while (u !== srcId) {
          const p = parent.get(u);
          links.unshift(p.link);
          nodes.unshift(p.prev);
          u = p.prev;
        }
        nodes.push(dstId); // ensure dst repeats at end for convenience
        return { nodes, links };
      }
      queue.push(nb.id);
    }
  }
  return null;
}

// distance helper for dynamic duration
function segDistance(line) {
  const [x1, y1, x2, y2] = line.points();
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// animate a packet along a single link, then call next()
function animateAlongLink(packet, line, speedPxPerSec, next) {
  const [x1, y1, x2, y2] = line.points();
  packet.position({ x: x1, y: y1 });
  linkLayer.add(packet);
  linkLayer.draw();

  const dist = segDistance(line);
  const duration = Math.max(0.2, dist / speedPxPerSec);

  packet.to({
    x: x2,
    y: y2,
    duration,
    easing: Konva.Easings.Linear,
    onFinish: () => {
      if (typeof next === "function") next();
    },
  });
}

// simulate one packet from node A to node B across multi-hop path
function simulateTrafficByIds(srcId, dstId, options = {}) {
  const path = findPathBFS(srcId, dstId);
  if (!path) {
    console.warn("No path found between", srcId, "and", dstId);
    return false;
  }

  const speed = options.speed || 200; // pixels per second
  const radius = options.radius || 5;
  const color = options.color || "red";

  const packet = new Konva.Circle({ x: 0, y: 0, radius, fill: color, opacity: 0.95 });

  let i = 0;
  const step = () => {
    if (i >= path.links.length) {
      // reached destination
      packet.destroy();
      linkLayer.draw();
      return;
    }
    const line = path.links[i++];
    animateAlongLink(packet, line, speed, step);
  };
  step();
  return true;
}

// pick two nodes that have a path between them
function pickConnectedPair(maxTries = 30) {
  if (state.nodes.length < 2 || state.links.length === 0) return null;
  for (let t = 0; t < maxTries; t++) {
    const a = state.nodes[Math.floor(Math.random() * state.nodes.length)];
    let b = a;
    while (b.id === a.id) {
      b = state.nodes[Math.floor(Math.random() * state.nodes.length)];
    }
    if (findPathBFS(a.id, b.id)) return [a, b];
  }
  return null;
}

// Fire a burst of packets to make it lively
function simulateBurst(count = 5) {
  for (let k = 0; k < count; k++) {
    setTimeout(() => {
      const pair = pickConnectedPair();
      if (!pair) {
        alert("No connected pair found. Please add links between devices.");
        return;
      }
      const [a, b] = pair;
      // vary color a bit per burst
      const colors = ["red", "#10b981", "#f59e0b", "#3b82f6", "#ec4899"];
      simulateTrafficByIds(a.id, b.id, {
        speed: 220 + rnd(-40, 40),
        color: colors[k % colors.length],
        radius: 4 + Math.floor(Math.random() * 2),
      });
    }, k * 300);
  }
}

// ======== BUTTON HANDLERS ========

$("#simulateTraffic").onclick = () => {
  if (state.nodes.length < 2) {
    alert("Add at least two devices.");
    return;
  }
  if (state.links.length === 0) {
    alert("Create links between devices first.");
    return;
  }
  simulateBurst(7); // send a nice little burst across random connected paths
};

$("#clear").onclick = () => {
  state.nodes.forEach((n) => n.group.destroy());
  state.links.forEach((l) => l.line.destroy());
  state.nodes = [];
  state.links = [];
  state.source = null;
  state.linkMode = false;
  updateStats();
  nodeLayer.draw();
  linkLayer.draw();
};
