// ===== Konva.js Initialization =====
const width = window.innerWidth * 0.65; // Map container width
const height = window.innerHeight;

const stage = new Konva.Stage({
  container: 'mapContainer',
  width: width,
  height: height
});

const layer = new Konva.Layer();
stage.add(layer);

// ===== Define campus nodes =====
const nodes = {
  library: { x: 150, y: 150 },
  csc: { x: 400, y: 150 },
  ece: { x: 650, y: 150 },
  cse: { x: 300, y: 300 },
  hostel: { x: 500, y: 350 },
  admin: { x: 150, y: 400 },
  auditorium: { x: 650, y: 450 },
  maingate: { x: 50, y: 500 },
};

// ===== Create nodes with labels =====
Object.keys(nodes).forEach(id => {
  const { x, y } = nodes[id];

  const circle = new Konva.Circle({
    x: x,
    y: y,
    radius: 25,
    fill: '#4cafef',
    stroke: '#0077cc',
    strokeWidth: 2,
    id: id,
    draggable: false
  });

  const label = new Konva.Text({
    x: x - 30,
    y: y + 30,
    text: id.charAt(0).toUpperCase() + id.slice(1),
    fontSize: 14,
    fontFamily: 'Arial',
    fill: '#000'
  });

  layer.add(circle);
  layer.add(label);

  // Node click event
  circle.on('click', () => {
    document.getElementById('details').innerHTML =
      `<strong>${id.toUpperCase()}</strong><br>Status: Online`;
    showToast(`${id} is active`);
  });
});

layer.draw();

// ===== Toast Notification =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.opacity = 1;
  setTimeout(() => (toast.style.opacity = 0), 3000);
}

// ===== Theme Toggle =====
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// ===== Unit Conversion =====
function convertSpeed() {
  const mbps = parseFloat(document.getElementById('mbpsInput').value);
  if (!isNaN(mbps)) {
    document.getElementById('conversionResult').textContent =
      `${mbps} Mbps = ${mbpsToMBps(mbps)} MB/s`;
  }
}

// ===== Search Node =====
document.getElementById('searchNode').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  layer.find('Circle').forEach(circle => {
    if (circle.id().includes(query)) {
      circle.fill('#ff5722');
    } else {
      circle.fill('#4cafef');
    }
  });
  layer.draw();
});

// ===== Traffic Monitor (Dummy Data) =====
const canvas = document.getElementById('trafficChart');
const ctx = canvas.getContext('2d');
let traffic = [];

function drawTraffic() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  traffic.forEach((val, i) => {
    ctx.lineTo(i * 10, canvas.height - val);
  });
  ctx.strokeStyle = '#0077cc';
  ctx.stroke();
}

setInterval(() => {
  if (traffic.length > 25) traffic.shift();
  traffic.push(Math.random() * canvas.height);
  drawTraffic();
}, 1000);

// ===== Animated Network Links =====
const connections = [
  ['library', 'csc'],
  ['csc', 'ece'],
  ['cse', 'hostel'],
  ['hostel', 'admin'],
  ['admin', 'auditorium'],
  ['auditorium', 'maingate']
];

connections.forEach(([from, to]) => {
  const fromNode = nodes[from];
  const toNode = nodes[to];

  const line = new Konva.Line({
    points: [fromNode.x, fromNode.y, toNode.x, toNode.y],
    stroke: 'gray',
    strokeWidth: 2,
    lineJoin: 'round',
    lineCap: 'round',
    dash: [10, 5],
    opacity: 0.5,
    id: `${from}-${to}`
  });

  layer.add(line);
  animateLine(line);
});

function animateLine(line) {
  const totalLength = line.getClientRect().width;
  let currentLength = 0;

  const anim = new Konva.Animation(frame => {
    currentLength += 2;
    if (currentLength > totalLength) {
      currentLength = 0;
    }
    line.dashOffset(currentLength);
  }, layer);

  anim.start();
}
