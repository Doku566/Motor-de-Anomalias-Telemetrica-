// Configuration
const MAX_POINTS = 60; // Keep more history for industrial look
let chartInst = null;

// State
let processed = 1024592;
let anomalies = 0;
const dataQueue = {
    labels: [],
    tmp: [],
    vib: [],
    anomalyMarkers: []
};

// Initialize Grafa-style Chart
function initGrafanaChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    // Global defaults for raw look
    Chart.defaults.color = '#858585';
    Chart.defaults.font.family = "'Consolas', monospace";
    Chart.defaults.font.size = 11;
    
    chartInst = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataQueue.labels,
            datasets: [
                {
                    label: 'TMP_C',
                    data: dataQueue.tmp,
                    borderColor: '#ff9800', // Warning Orange
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    borderWidth: 1.5,
                    pointRadius: 0,
                    tension: 0, // Sharp lines, no smoothing in SCADA
                    yAxisID: 'y'
                },
                {
                    label: 'VIB_HZ',
                    data: dataQueue.vib,
                    borderColor: '#007acc', // Tech Blue
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderDash: [2, 2], // Grid dash
                    pointRadius: 0,
                    tension: 0,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            animation: false, // Turn off animations for raw feel
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', align: 'end', labels: { boxWidth: 10, usePointStyle: false } },
                tooltip: {
                    backgroundColor: '#1e1e1e',
                    titleColor: '#d4d4d4',
                    bodyColor: '#d4d4d4',
                    borderColor: '#3e3e42',
                    borderWidth: 1,
                    cornerRadius: 0 // Square tooltips
                }
            },
            scales: {
                x: {
                    grid: { color: '#333', drawBorder: true },
                    ticks: { maxRotation: 0, autoSkipPadding: 20 }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'TMP_C', font: {size: 10} },
                    grid: { color: '#333' },
                    min: 20, max: 120 // Fixed bounds typical of industrial monitors
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'VIB_HZ', font: {size: 10} },
                    grid: { drawOnChartArea: false },
                    min: 80, max: 200
                }
            }
        },
        plugins: [{
            id: 'anomalyHighlight',
            beforeDraw: (chart) => {
                const { ctx, chartArea, scales: { x } } = chart;
                if (!chartArea) return;
                const { top, bottom } = chartArea;
                
                ctx.save();
                for (let i = 0; i < dataQueue.anomalyMarkers.length; i++) {
                    if (dataQueue.anomalyMarkers[i]) {
                        const xPos = x.getPixelForValue(i);
                        // Draw a vertical red warning band
                        ctx.fillStyle = 'rgba(244, 67, 54, 0.2)';
                        ctx.fillRect(xPos - 5, top, 10, bottom - top);
                        // Draw a sharp red tick
                        ctx.beginPath();
                        ctx.strokeStyle = '#f44336';
                        ctx.lineWidth = 2;
                        ctx.moveTo(xPos, bottom);
                        ctx.lineTo(xPos, top);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }
        }]
    });
}

function appendLog(level, msg) {
    const term = document.getElementById('terminal-out');
    const time = new Date().toISOString().split('T')[1].slice(0,-1);
    
    let lvlClass = 'log-level-info';
    let lvlText = '[INFO]';
    if(level === 'WARN') { lvlClass = 'log-level-warn'; lvlText = '[WARN]'; }
    if(level === 'CRIT') { lvlClass = 'log-level-crit'; lvlText = '[CRIT]'; }

    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `<span class="log-time">${time}</span> <span class="${lvlClass}">${lvlText}</span> ${msg}`;
    
    term.appendChild(div);
    if(term.childNodes.length > 50) term.removeChild(term.firstChild); // Keep terminal pruned
    term.scrollTop = term.scrollHeight; // Auto-scroll
}

function dataTick() {
    const nowStr = new Date().toISOString().split('T')[1].substring(0,8);
    
    // Normal sensor variance (baseline)
    let tempVal = 42 + (Math.random() * 8); // 42-50
    let vibVal = 100 + (Math.random() * 10); // 100-110
    let isSpike = false;
    let score = (0.5 + Math.random() * 0.3).toFixed(4);
    
    // 4% probability to trigger IF Model anomaly scenario
    if (Math.random() < 0.04) {
        isSpike = true;
        tempVal = 85 + (Math.random() * 30); // Danger temp
        vibVal = 150 + (Math.random() * 40); // Danger vib
        score = (-0.2 - Math.random() * 0.5).toFixed(4); // IF outputs negative for anomalies
    }

    // Queue management
    if (dataQueue.labels.length >= MAX_POINTS) {
        dataQueue.labels.shift();
        dataQueue.tmp.shift();
        dataQueue.vib.shift();
        dataQueue.anomalyMarkers.shift();
    }

    dataQueue.labels.push(nowStr);
    dataQueue.tmp.push(tempVal);
    dataQueue.vib.push(vibVal);
    dataQueue.anomalyMarkers.push(isSpike);

    chartInst.update();

    // Stats UI Update
    processed++;
    document.getElementById('disp-processed').innerText = processed.toLocaleString();
    document.getElementById('disp-latency').innerText = (8 + (Math.random() * 15)).toFixed(1) + 'ms';
    
    // Raw JSON Dump Update
    const rawData = {
        machine_id: "MACH-01",
        timestamp: new Date().toISOString(),
        metrics: { tmp_c: tempVal.toFixed(2), vib_hz: vibVal.toFixed(2) },
        ml_eval: { if_score: parseFloat(score), is_anomaly: isSpike }
    };
    document.getElementById('raw-json-dump').innerText = JSON.stringify(rawData, null, 2);

    // Logging
    if (isSpike) {
        anomalies++;
        document.getElementById('disp-anomalies').innerText = anomalies;
        
        // Blink LED
        const led = document.getElementById('worker-led');
        led.className = 'led-red';
        setTimeout(() => led.className = 'led-green', 1500);

        appendLog('CRIT', `IsolationForest::Anomaly detected! Score: ${score} | TMP: ${tempVal.toFixed(1)} | VIB: ${vibVal.toFixed(1)}`);
        
        // Sometimes append a sub-action to look real
        setTimeout(() => {
            appendLog('WARN', `Brokering task to PagerDuty... (simulated)`);
        }, 300);
    } else {
        // Occasional heartbeat log
        if (Math.random() < 0.1) {
            appendLog('INFO', `Heartbeat OK. Score: ${score}`);
        }
    }
}

// Boot Sequence
document.addEventListener('DOMContentLoaded', () => {
    initGrafanaChart();
    
    // Pre-fill graph for instant view
    for(let i=0; i<MAX_POINTS; i++) {
        dataQueue.labels.push("");
        dataQueue.tmp.push(42 + (Math.random() * 8));
        dataQueue.vib.push(100 + (Math.random() * 10));
        dataQueue.anomalyMarkers.push(false);
    }
    chartInst.update();
    
    // Begin stream
    setInterval(dataTick, 1500);
});
