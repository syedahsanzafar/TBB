const defaultData = [
    { name: "H6", target: 5000, printed: 5000, sold: 7835 },
    { name: "H7", target: 5000, printed: 5000, sold: 5915 },
    { name: "H8", target: 5000, printed: 5000, sold: 8130 },
    { name: "U3", target: 40000, printed: 25000, sold: 20605 },
    { name: "U4", target: 40000, printed: 30000, sold: 27110 },
    { name: "U5", target: 40000, printed: 35000, sold: 30670 },
    { name: "E3", target: 40000, printed: 25000, sold: 20995 },
    { name: "E4", target: 40000, printed: 30000, sold: 25370 },
    { name: "E5", target: 40000, printed: 35000, sold: 29710 }
];

let appData = JSON.parse(localStorage.getItem('dashboardData')) || JSON.parse(JSON.stringify(defaultData));

// Chart instances
let salesTargetChart = null;
let inventoryChart = null;
let fulfillmentChart = null;
let stockLevelChart = null;
let utilizationChart = null;
let itemChartInstances = []; // Array to track dynamic mini charts

// Colors
const colors = {
    primary: '#4f46e5',
    lightPrimary: '#818cf8',
    bgPrimary: '#e0e7ff',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    text: '#374151',
    gray: '#d1d5db'
};

document.addEventListener('DOMContentLoaded', () => {
    // Initial Render
    renderTable();
    updateDashboard(); // KPIs and Charts

    // Listeners
    document.getElementById('addRowBtn').addEventListener('click', addRow);
    document.getElementById('resetBtn').addEventListener('click', resetData);

    // Admin Code Listener
    document.getElementById('adminCode').addEventListener('input', (e) => {
        const btn = document.getElementById('dataTabBtn');
        if (e.target.value.toLowerCase() === 'action') {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
            // If we're currently on the data tab and it gets hidden, switch back
            if (document.getElementById('data').classList.contains('active')) {
                switchTab('dashboard');
            }
        }
    });
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`button[onclick="switchTab('${tabId}')"]`).classList.add('active');

    if (tabId === 'dashboard') {
        updateCharts();
    }
}

function calculateStock(item) {
    return item.printed - item.sold;
}

// --- Data Management Functions ---

function renderTable() {
    const tbody = document.querySelector('#dataTable tbody');
    tbody.innerHTML = '';

    appData.forEach((item, index) => {
        const tr = document.createElement('tr');
        const stock = calculateStock(item);

        tr.innerHTML = `
            <td><input type="text" value="${item.name}" onchange="updateData(${index}, 'name', this.value)"></td>
            <td><input type="number" value="${item.target}" onchange="updateData(${index}, 'target', this.value)"></td>
            <td><input type="number" value="${item.printed}" onchange="updateData(${index}, 'printed', this.value)"></td>
            <td><input type="number" value="${item.sold}" onchange="updateData(${index}, 'sold', this.value)"></td>
            <td class="stock-cell">${stock}</td>
            <td><button class="delete-btn" onclick="deleteRow(${index})">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function updateData(index, field, value) {
    if (field === 'name') {
        appData[index][field] = value;
    } else {
        appData[index][field] = Number(value);
    }
    saveData();
    renderTable(); // Update calculated fields
}

function addRow() {
    appData.push({ name: "New", target: 0, printed: 0, sold: 0 });
    renderTable();
    saveData();
}

function deleteRow(index) {
    appData.splice(index, 1);
    renderTable();
    saveData();
}

function resetData() {
    if (confirm('Are you sure you want to reset all data to default?')) {
        appData = JSON.parse(JSON.stringify(defaultData));
        renderTable();
        saveData();
        updateDashboard();
    }
}

function saveData() {
    localStorage.setItem('dashboardData', JSON.stringify(appData));
}

// --- Dashboard Logic ---

function updateDashboard() {
    updateKPIs();
    updateCharts();
}

function updateKPIs() {
    const totalTarget = appData.reduce((sum, item) => sum + item.target, 0);
    const totalSold = appData.reduce((sum, item) => sum + item.sold, 0);
    const totalPrinted = appData.reduce((sum, item) => sum + item.printed, 0);
    const totalStock = totalPrinted - totalSold;

    // Safe division
    const achievementRate = totalTarget > 0 ? ((totalSold / totalTarget) * 100).toFixed(1) : 0;

    document.getElementById('kpiTarget').textContent = totalTarget.toLocaleString();
    document.getElementById('kpiSold').textContent = totalSold.toLocaleString();
    document.getElementById('kpiRate').textContent = achievementRate + '%';
    document.getElementById('kpiStock').textContent = totalStock.toLocaleString();
}

function initChartIfNeeded(id, type, data, options) {
    const ctx = document.getElementById(id).getContext('2d');
    Chart.defaults.font.family = "'Inter', sans-serif";

    let chartInstance;

    if (id === 'salesVsTargetChart') chartInstance = salesTargetChart;
    if (id === 'inventoryChart') chartInstance = inventoryChart;
    if (id === 'fulfillmentChart') chartInstance = fulfillmentChart;
    if (id === 'stockLevelChart') chartInstance = stockLevelChart;
    if (id === 'utilizationChart') chartInstance = utilizationChart;

    if (chartInstance) {
        chartInstance.destroy();
    }

    const newChart = new Chart(ctx, { type, data, options });

    if (id === 'salesVsTargetChart') salesTargetChart = newChart;
    if (id === 'inventoryChart') inventoryChart = newChart;
    if (id === 'fulfillmentChart') fulfillmentChart = newChart;
    if (id === 'stockLevelChart') stockLevelChart = newChart;
    if (id === 'utilizationChart') utilizationChart = newChart;
}

function renderItemCharts() {
    const container = document.getElementById('itemChartsGrid');

    // Clear existing charts
    itemChartInstances.forEach(chart => chart.destroy());
    itemChartInstances = [];
    container.innerHTML = '';

    appData.forEach((item, index) => {
        // Create elements
        const wrapper = document.createElement('div');
        wrapper.className = 'mini-chart-wrapper';

        const title = document.createElement('h5');
        title.innerHTML = `<strong>${item.name}</strong><br><span style="font-size:0.8em; font-weight:400">Printed: ${item.printed}</span>`;

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'mini-canvas-container';

        const canvas = document.createElement('canvas');
        canvas.id = `itemChart-${index}`;

        canvasContainer.appendChild(canvas);
        wrapper.appendChild(title);
        wrapper.appendChild(canvasContainer);
        container.appendChild(wrapper);

        // Chart logic
        const stock = calculateStock(item);
        const sold = item.sold;

        // Handle negative stock visually (if sold > printed)
        // If stock is negative, it means we sold more than printed (overselling?)
        // For chart visualization, we'll clamp negative stock to 0 but show sold as full
        const chartStock = stock < 0 ? 0 : stock;

        const ctx = canvas.getContext('2d');
        const newChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sold', 'Stock'],
                datasets: [{
                    data: [sold, chartStock],
                    backgroundColor: [colors.primary, colors.gray],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.chart._metasets[context.datasetIndex].total;
                                const percentage = Math.round((value / total) * 100) + '%';
                                return label + ': ' + value + ' (' + percentage + ')';
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });

        itemChartInstances.push(newChart);
    });
}

function updateCharts() {
    const labels = appData.map(d => d.name);
    // 1. Sales vs Target (Grouped Bar)
    initChartIfNeeded('salesVsTargetChart', 'bar', {
        labels: labels,
        datasets: [
            { label: 'Target', data: appData.map(d => d.target), backgroundColor: colors.bgPrimary },
            { label: 'Actual Sales', data: appData.map(d => d.sold), backgroundColor: colors.primary }
        ]
    }, {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } },
        maintainAspectRatio: false
    });

    // 6. Render Item Charts
    renderItemCharts();
}
