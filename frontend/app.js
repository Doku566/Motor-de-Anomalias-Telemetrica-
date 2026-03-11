// Configuration
const CHART_MAX_POINTS = 50;
let chartInstance = null;

// State
const state = {
    processedCount: 0,
    anomaliesCaught: 0,
    labels: [],
    temperatureData: [],
    vibrationData: [],
    anomalyPoints: [] // Indices where anomalies occurred
};

// Initialize Chart
function initChart() {
    const ctx = document.getElementById('telemetryChart').getContext('2d');
    
    Chart.defaults.color = '#8b949e';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: state.labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: state.temperatureData,
                    borderColor: '#3b82f6', // Blue
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    yAxisID: 'y'
                },
                {
                    label: 'Vibration (Hz)',
                    data: state.vibrationData,
                    borderColor: '#10b981', // Emerald
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointRadius: 0,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { usePointStyle: true, boxWidth: 8 }
                },
                tooltip: {
                    backgroundColor: 'rgba(13, 17, 23, 0.9)',
                    titleColor: '#c9d1d9',
                    bodyColor: '#8b949e',
                    borderColor: '#30363d',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Temperature °C' },
                    grid: { color: 'rgba(48, 54, 61, 0.5)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Vibration Hz' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function createAlertElement(data) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const div = document.createElement('div');
    div.className = 'p-3 rounded-lg border border-red-500/30 bg-red-500/5 mb-2 shadow-[0_0_10px_rgba(239,68,68,0.1)] transition-all duration-300 transform origin-top hover:scale-[1.02]';
    
    div.innerHTML = `
        <div class="flex justify-between items-start mb-1">
            <span class="text-xs font-bold text-red-500">THREAT ALERT</span>
            <span class="text-[10px] text-gray-500 font-mono">${time}</span>
        </div>
        <p class="text-sm text-gray-300 font-mono mb-2">IsolationForest Score: <span class="text-red-400 font-bold">${data.score.toFixed(4)}</span></p>
        <div class="flex gap-2">
            <span class="px-2 py-0.5 rounded bg-gray-900 border border-gray-700 text-[10px] text-gray-400">Temp: ${data.temp.toFixed(1)}°C</span>
            <span class="px-2 py-0.5 rounded bg-gray-900 border border-gray-700 text-[10px] text-gray-400">Vib: ${data.vib.toFixed(1)}Hz</span>
        </div>
    `;
    return div;
}

function mockDataStream() {
    setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('en-US', { minute: '2-digit', second:'2-digit' });
        
        // Base normal metrics
        let t = 45 + (Math.random() * 5 - 2.5); // 42.5 - 47.5
        let v = 105 + (Math.random() * 4 - 2);  // 103 - 107
        let isAnomaly = false;
        let score = 0.5 + Math.random() * 0.2; // roughly normal score
        
        // 5% chance of simulating a critical failure anomaly
        if (Math.random() < 0.05) {
            isAnomaly = true;
            t = 80 + Math.random() * 20; // Spike temp
            v = 150 + Math.random() * 30; // Spike vibration
            score = -0.1 - Math.random() * 0.3; // Negative score from IF
        }
        
        // Update Chart Data
        if (state.labels.length >= CHART_MAX_POINTS) {
            state.labels.shift();
            state.temperatureData.shift();
            state.vibrationData.shift();
            
            // Re-map anomaly point coloring
            const ds = chartInstance.data.datasets;
            [ds[0], ds[1]].forEach(dataset => {
                if (dataset.pointBackgroundColor) {
                    dataset.pointBackgroundColor.shift();
                    dataset.pointRadius.shift();
                    dataset.pointBorderWidth.shift();
                }
            });
        }

        state.labels.push(timeStr);
        state.temperatureData.push(t);
        state.vibrationData.push(v);
        
        // Handle visual anomaly highlights on chart
        const ds = chartInstance.data.datasets;
        [ds[0], ds[1]].forEach(dataset => {
            if(!dataset.pointBackgroundColor) {
                dataset.pointBackgroundColor = [];
                dataset.pointRadius = [];
                dataset.pointBorderWidth = [];
            }
            if(isAnomaly) {
                dataset.pointBackgroundColor.push('#ef4444'); // Red point
                dataset.pointRadius.push(6);
                dataset.pointBorderWidth.push(2);
            } else {
                dataset.pointBackgroundColor.push('transparent');
                dataset.pointRadius.push(0);
                dataset.pointBorderWidth.push(0);
            }
        });

        // Update UI Stats
        state.processedCount++;
        document.getElementById('stat-processed').innerText = state.processedCount.toLocaleString();
        document.getElementById('stat-latency').innerText = (10 + Math.random() * 8).toFixed(1);
        
        if (isAnomaly) {
            state.anomaliesCaught++;
            document.getElementById('stat-anomalies').innerText = state.anomaliesCaught;
            
            // Add alert log
            const container = document.getElementById('alerts-container');
            const alertEl = createAlertElement({ temp: t, vib: v, score });
            container.prepend(alertEl);
            
            // keep only last 10 alerts
            if(container.children.length > 10) {
                container.lastElementChild.remove();
            }
        }

        chartInstance.update();
        
    }, 1500); // 1.5 second tick rate
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    
    // Fill initial data so chart isn't empty
    for(let i=0; i<30; i++) {
        state.labels.push("");
        state.temperatureData.push(45 + (Math.random() * 5 - 2.5));
        state.vibrationData.push(105 + (Math.random() * 4 - 2));
    }
    chartInstance.update();
    
    // Start simulation
    setTimeout(mockDataStream, 500);
});
