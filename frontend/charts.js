// Configuration
const API_BASE = 'http://localhost:5000/api';
const UPDATE_INTERVAL = 10000; // 10 seconds for charts
let currentTimeRange = '1h';

// Chart instances
let sentimentChart = null;
let entitiesChart = null;
let languageChart = null;
let topicsChart = null;
let activityChart = null;
let alertsChart = null;
let sentimentGauge = null;
let heatmapChart = null;

// Chart.js default config
Chart.defaults.color = '#8b93c9';
Chart.defaults.borderColor = '#2a3354';
Chart.defaults.font.family = 'JetBrains Mono';

// Main App
class ChartsApp {
    constructor() {
        this.init();
    }

    init() {
        console.log('Charts initialized - using REAL MongoDB data');
        this.initCharts();
        this.attachEventListeners();
        this.updateAll();
        setInterval(() => this.updateAll(), UPDATE_INTERVAL);
    }

    attachEventListeners() {
        // Time range buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentTimeRange = e.target.dataset.range;
                this.updateAll();
            });
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.updateAll();
        });
    }

    initCharts() {
        // Sentiment Over Time (Line Chart)
        const sentimentCtx = document.getElementById('sentimentChart').getContext('2d');
        sentimentChart = new Chart(sentimentCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Positive',
                        data: [],
                        borderColor: '#00f5a0',
                        backgroundColor: 'rgba(0, 245, 160, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Neutral',
                        data: [],
                        borderColor: '#6b7cff',
                        backgroundColor: 'rgba(107, 124, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Negative',
                        data: [],
                        borderColor: '#ff4757',
                        backgroundColor: 'rgba(255, 71, 87, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Top Entities (Horizontal Bar)
        const entitiesCtx = document.getElementById('entitiesChart').getContext('2d');
        entitiesChart = new Chart(entitiesCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Mentions',
                    data: [],
                    backgroundColor: '#5b6fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // Language Distribution (Doughnut)
        const languageCtx = document.getElementById('languageChart').getContext('2d');
        languageChart = new Chart(languageCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#5b6fff', '#00f5a0', '#ff4757', 
                        '#ffba08', '#ff5ba8', '#6b7cff'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });

        // Topics Distribution (Polar Area)
        const topicsCtx = document.getElementById('topicsChart').getContext('2d');
        topicsChart = new Chart(topicsCtx, {
            type: 'polarArea',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(91, 111, 255, 0.5)',
                        'rgba(0, 245, 160, 0.5)',
                        'rgba(255, 71, 87, 0.5)',
                        'rgba(255, 186, 8, 0.5)',
                        'rgba(255, 91, 168, 0.5)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // Activity Timeline (Line)
        const activityCtx = document.getElementById('activityChart').getContext('2d');
        activityChart = new Chart(activityCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Posts per Minute',
                    data: [],
                    borderColor: '#00f5a0',
                    backgroundColor: 'rgba(0, 245, 160, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Alerts Breakdown (Pie)
        const alertsCtx = document.getElementById('alertsChart').getContext('2d');
        alertsChart = new Chart(alertsCtx, {
            type: 'pie',
            data: {
                labels: ['Anomaly', 'Toxic', 'Rumor'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#ffba08', '#ff4757', '#ff5ba8']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // Sentiment Gauge (Doughnut)
        const gaugeCtx = document.getElementById('sentimentGauge').getContext('2d');
        sentimentGauge = new Chart(gaugeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Negative'],
                datasets: [{
                    data: [50, 50],
                    backgroundColor: ['#00f5a0', '#ff4757'],
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // Heatmap (Bar - hourly activity)
        const heatmapCtx = document.getElementById('heatmapChart').getContext('2d');
        heatmapChart = new Chart(heatmapCtx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Posts',
                    data: new Array(24).fill(0),
                    backgroundColor: '#5b6fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    async updateAll() {
        console.log('Updating all charts with real MongoDB data...');
        await Promise.all([
            this.updateSentimentChart(),
            this.updateEntitiesChart(),
            this.updateLanguageChart(),
            this.updateTopicsChart(),
            this.updateActivityChart(),
            this.updateAlertsChart(),
            this.updateHeatmap(),
            this.updateMetrics()
        ]);
    }

    // ========================================================================
    // REAL DATA from MongoDB via API endpoints
    // ========================================================================

    async updateSentimentChart() {
        try {
            const res = await fetch(`${API_BASE}/sentiment/timeline?limit=20`);
            const data = await res.json();
            
            sentimentChart.data.labels = data.labels;
            sentimentChart.data.datasets[0].data = data.positive;
            sentimentChart.data.datasets[1].data = data.neutral;
            sentimentChart.data.datasets[2].data = data.negative;
            sentimentChart.update();
            
            console.log('✓ Sentiment chart updated with real data');
        } catch (error) {
            console.error('Error updating sentiment chart:', error);
        }
    }

    async updateEntitiesChart() {
        try {
            const res = await fetch(`${API_BASE}/trends/entities?limit=10`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                entitiesChart.data.labels = data.map(e => this.extractEntityName(e.entity));
                entitiesChart.data.datasets[0].data = data.map(e => e.mentions);
                entitiesChart.update();
                console.log('✓ Entities chart updated with real data');
            }
        } catch (error) {
            console.error('Error updating entities chart:', error);
        }
    }

    async updateLanguageChart() {
        try {
            const res = await fetch(`${API_BASE}/language/distribution`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                languageChart.data.labels = data.slice(0, 6).map(l => l.language.toUpperCase());
                languageChart.data.datasets[0].data = data.slice(0, 6).map(l => l.count);
                languageChart.update();
                console.log('✓ Language chart updated with real data');
            }
        } catch (error) {
            console.error('Error updating language chart:', error);
        }
    }

    async updateTopicsChart() {
        try {
            const res = await fetch(`${API_BASE}/topics/active?limit=5`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                topicsChart.data.labels = data.map(t => t.name);
                topicsChart.data.datasets[0].data = data.map(t => t.count);
                topicsChart.update();
                console.log('✓ Topics chart updated with real data');
            }
        } catch (error) {
            console.error('Error updating topics chart:', error);
        }
    }

    async updateActivityChart() {
        try {
            const res = await fetch(`${API_BASE}/activity/timeline?limit=20`);
            const data = await res.json();
            
            activityChart.data.labels = data.labels;
            activityChart.data.datasets[0].data = data.data;
            activityChart.update();
            
            console.log('✓ Activity chart updated with real data');
        } catch (error) {
            console.error('Error updating activity chart:', error);
        }
    }

    async updateAlertsChart() {
        try {
            const res = await fetch(`${API_BASE}/alerts/breakdown`);
            const data = await res.json();
            
            alertsChart.data.datasets[0].data = [
                data.anomaly,
                data.toxic,
                data.rumor
            ];
            alertsChart.update();
            
            console.log('✓ Alerts chart updated with real data');
        } catch (error) {
            console.error('Error updating alerts chart:', error);
        }
    }

    async updateHeatmap() {
        try {
            const res = await fetch(`${API_BASE}/activity/hourly`);
            const data = await res.json();
            
            heatmapChart.data.labels = data.labels;
            heatmapChart.data.datasets[0].data = data.data;
            heatmapChart.update();
            
            console.log('✓ Heatmap updated with real data');
        } catch (error) {
            console.error('Error updating heatmap:', error);
        }
    }

    async updateMetrics() {
        try {
            const res = await fetch(`${API_BASE}/stats/dashboard`);
            const data = await res.json();
            
            document.getElementById('totalAnalyzed').textContent = this.formatNumber(data.totalPosts);
            document.getElementById('trendingCount').textContent = data.activeTopics;
            document.getElementById('peakActivity').textContent = `${data.postsPerMin}/min`;
            
            const langRes = await fetch(`${API_BASE}/language/distribution`);
            const langData = await langRes.json();
            document.getElementById('langCount').textContent = langData.length;
            
            console.log('✓ Metrics updated with real data');
        } catch (error) {
            console.error('Error updating metrics:', error);
        }
    }

    // Utilities
    extractEntityName(entity) {
        const parts = entity.split(':');
        return parts.length === 2 ? parts[1] : entity;
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChartsApp();
});