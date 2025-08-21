// Initialize Konva stage
const stage = new Konva.Stage({
    container: 'container',
    width: document.getElementById('container').clientWidth,
    height: document.getElementById('container').clientHeight
});

const layer = new Konva.Layer();
stage.add(layer);

// Device positions (example layout of M90 Agartala)
const devices = [
    { name: 'Router', x: 400, y: 50, color: 'red' },
    { name: 'Switch', x: 400, y: 150, color: 'orange' },
    { name: 'Server', x: 600, y: 300, color: 'green' },
    { name: 'AP1', x: 200, y: 300, color: 'blue' },
    { name: 'AP2', x: 400, y: 400, color: 'blue' },
    { name: 'AP3', x: 600, y: 500, color: 'blue' }
];

// Draw devices
const deviceNodes = {};
devices.forEach(d => {
    const circle = new Konva.Circle({
        x: d.x,
        y: d.y,
        radius: 25,
        fill: d.color,
        stroke: 'white',
        strokeWidth: 3
    });

    const label = new Konva.Text({
        x: d.x - 30,
        y: d.y + 30,
        text: d.name,
        fontSize: 14,
        fill: 'white'
    });

    layer.add(circle);
    layer.add(label);
    deviceNodes[d.name] = circle;
});

// Connect devices with lines (example topology)
function connect(a, b) {
    const line = new Konva.Line({
        points: [a.x(), a.y(), b.x(), b.y()],
        stroke: 'white',
        strokeWidth: 2,
        lineCap: 'round',
        lineJoin: 'round'
    });
    layer.add(line);
}

connect(deviceNodes['Router'], deviceNodes['Switch']);
connect(deviceNodes['Switch'], deviceNodes['Server']);
connect(deviceNodes['Switch'], deviceNodes['AP1']);
connect(deviceNodes['Switch'], deviceNodes['AP2']);
connect(deviceNodes['Switch'], deviceNodes['AP3']);

layer.draw();

// Simulation of network traffic
document.getElementById('simulateBtn').addEventListener('click', () => {
    const packet = new Konva.Circle({
        x: deviceNodes['Router'].x(),
        y: deviceNodes['Router'].y(),
        radius: 8,
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 1
    });
    layer.add(packet);
    layer.draw();

    // Animate packet to server
    const tween = new Konva.Tween({
        node: packet,
        duration: 2,
        x: deviceNodes['Server'].x(),
        y: deviceNodes['Server'].y(),
        easing: Konva.Easings.EaseInOut,
        onFinish: () => packet.destroy()
    });
    tween.play();
});
