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
    return;
  }
  if (state.source.id !== node.id) {
    createLink(state.source, node);
  }
  state.source = null;
  state.linkMode = false;
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

$("#toggleLinkMode").onclick = () => {
  state.linkMode = !state.linkMode;
};
$("#simulateTraffic").onclick = () => alert("Traffic simulation placeholder");
$("#clear").onclick = () => {
  state.nodes.forEach((n) => n.group.destroy());
  state.links.forEach((l) => l.line.destroy());
  state.nodes = [];
  state.links = [];
  updateStats();
};
