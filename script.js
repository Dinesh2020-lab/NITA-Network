const nodes = document.querySelectorAll(".node");
const details = document.getElementById("details");
const toast = document.getElementById("toast");

nodes.forEach((node) => {
  node.addEventListener("click", () => {
    details.innerHTML = `<strong>${node.id.toUpperCase()}</strong><br>Status: Online`;
    showToast(`${node.id} is active`);
  });
});

function showToast(msg) {
  toast.textContent = msg;
  toast.style.opacity = 1;
  setTimeout(() => (toast.style.opacity = 0), 3000);
}

// Search functionality
document.getElementById("searchNode").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  nodes.forEach((node) => {
    if (node.id.includes(query)) {
      node.setAttribute("fill", "#ff5722");
    } else {
      node.setAttribute("fill", "#4cafef");
    }
  });
});

// Conversion
function convertSpeed() {
  const mbps = parseFloat(document.getElementById("mbpsInput").value);
  if (!isNaN(mbps)) {
    document.getElementById("conversionResult").textContent =
      `${mbps} Mbps = ${mbpsToMBps(mbps)} MB/s`;
  }
}

// Traffic Monitor
const canvas = document.getElementById("trafficChart");
const ctx = canvas.getContext("2d");
let traffic = [];

function drawTraffic() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  traffic.forEach((val, i) => {
    ctx.lineTo(i * 10, canvas.height - val);
  });
  ctx.strokeStyle = "#0077cc";
  ctx.stroke();
}

setInterval(() => {
  if (traffic.length > 25) traffic.shift();
  traffic.push(Math.random() * canvas.height);
  drawTraffic();
}, 1000);

// Theme toggle
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});
