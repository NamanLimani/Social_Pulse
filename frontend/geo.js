// Configuration
const API_BASE = 'http://localhost:5000/api';
const UPDATE_INTERVAL = 15000; // 15 seconds for geo
let map = null;
let markers = [];
let currentView = 'posts';

// Chart instances
let regionalChart = null;
let languageRegionChart = null;
let regionalTimelineChart = null;

// Chart.js defaults
Chart.defaults.color = '#8b93c9';
Chart.defaults.borderColor = '#2a3354';
Chart.defaults.font.family = 'JetBrains Mono';

// Simulated geographic data (since Bluesky posts don't have geo coordinates)
// In real implementation, you'd need geocoding service or user location data
const MOCK_LOCATIONS = [
    { country: 'United States', city: 'New York', lat: 40.7128, lon: -74.0060, region: 'Americas' },
    { country: 'United States', city: 'San Francisco', lat: 37.7749, lon: -122.4194, region: 'Americas' },
    { country: 'United Kingdom', city: 'London', lat: 51.5074, lon: -0.1278, region: 'Europe' },
    { country: 'Germany', city: 'Berlin', lat: 52.5200, lon: 13.4050, region: 'Europe' },
    { country: 'Japan', city: 'Tokyo', lat: 35.6762, lon: 139.6503, region: 'Asia' },
    { country: 'Australia', city: 'Sydney', lat: -33.8688, lon: 151.2093, region: 'Oceania' },
    { country: 'Brazil', city: 'São Paulo', lat: -23.5505, lon: -46.6333, region: 'Americas' },
    { country: 'France', city: 'Paris', lat: 48.8566, lon: 2.3522, region: 'Europe' },
    { country: 'India', city: 'Mumbai', lat: 19.0760, lon: 72.8777, region: 'Asia' },
    { country: 'Canada', city: 'Toronto', lat: 43.6532, lon: -79.3832, region: 'Americas' },
];

// Main App
class GeoApp {
    constructor() {
        this.init();
    }

    init() {
        console.log('Geographic visualization initialized');
        this.initMap();
        this.initCharts();
        this.attachEventListeners();
        this.updateAll();
        setInterval(() => this.updateAll(), UPDATE_INTERVAL);
    }

    initMap() {
        // Initialize Leaflet map
        map = L.map('map').setView([20, 0], 2);
        
        // Dark theme tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);
    }

    initCharts() {
        // Regional Sentiment Chart
        const regionalCtx = document.getElementById('regionalChart').getContext('2d');
        regionalChart = new Chart(regionalCtx, {
            type: 'bar',
            data: {
                labels: ['Americas', 'Europe', 'Asia', 'Africa', 'Oceania'],
                datasets: [
                    {
                        label: 'Positive',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: '#00f5a0'
                    },
                    {
                        label: 'Neutral',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: '#6b7cff'
                    },
                    {
                        label: 'Negative',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: '#ff4757'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });

        // Language by Region Chart
        const langRegionCtx = document.getElementById('languageRegionChart').getContext('2d');
        languageRegionChart = new Chart(langRegionCtx, {
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

        // Regional Timeline Chart
        const timelineCtx = document.getElementById('regionalTimelineChart').getContext('2d');
        regionalTimelineChart = new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Americas',
                        data: [],
                        borderColor: '#5b6fff',
                        backgroundColor: 'rgba(91, 111, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Europe',
                        data: [],
                        borderColor: '#00f5a0',
                        backgroundColor: 'rgba(0, 245, 160, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Asia',
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
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    attachEventListeners() {
        // Map view controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentView = e.target.dataset.view;
                this.updateMapView();
            });
        });

        // Time range selector
        document.getElementById('timeRange').addEventListener('change', () => {
            this.updateAll();
        });
    }

    async updateAll() {
        console.log('Updating geographic data...');
        await Promise.all([
            this.updateMapMarkers(),
            this.updateCountryList(),
            this.updateCityList(),
            this.updateRegionalCharts(),
            this.updateRegionalStats()
        ]);
    }

    async updateMapMarkers() {
        try {
            // Clear existing markers
            markers.forEach(marker => map.removeLayer(marker));
            markers = [];

            // Get sentiment data
            const sentRes = await fetch(`${API_BASE}/sentiment/distribution`);
            const sentData = await sentRes.json();

            // Simulate geographic distribution
            // In production, you'd geocode based on user profiles or use location data
            MOCK_LOCATIONS.forEach(loc => {
                const randomSentiment = this.getRandomSentiment(sentData);
                const color = this.getSentimentColor(randomSentiment);
                
                const marker = L.circleMarker([loc.lat, loc.lon], {
                    radius: 8,
                    fillColor: color,
                    color: '#fff',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map);

                marker.bindPopup(`
                    <div style="font-family: JetBrains Mono; padding: 0.5rem;">
                        <strong>${loc.city}, ${loc.country}</strong><br>
                        Sentiment: <span style="color: ${color};">${randomSentiment}</span><br>
                        Posts: ${Math.floor(Math.random() * 100) + 10}
                    </div>
                `);

                markers.push(marker);
            });

            console.log('✓ Map markers updated');
        } catch (error) {
            console.error('Error updating map:', error);
        }
    }

    async updateCountryList() {
        try {
            // Aggregate by country (simulated)
            const countries = {};
            MOCK_LOCATIONS.forEach(loc => {
                if (!countries[loc.country]) {
                    countries[loc.country] = { count: 0, flag: this.getCountryFlag(loc.country) };
                }
                countries[loc.country].count += Math.floor(Math.random() * 50) + 10;
            });

            const sortedCountries = Object.entries(countries)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 10);

            const html = sortedCountries.map(([country, data]) => `
                <div class="location-item">
                    <span class="location-name">
                        <span class="location-flag">${data.flag}</span>
                        ${country}
                    </span>
                    <span class="location-count">${data.count}</span>
                </div>
            `).join('');

            document.getElementById('countryList').innerHTML = html;
            document.getElementById('activeCountries').textContent = sortedCountries.length;
            
            console.log('✓ Country list updated');
        } catch (error) {
            console.error('Error updating country list:', error);
        }
    }

    async updateCityList() {
        try {
            const cities = MOCK_LOCATIONS.map(loc => ({
                ...loc,
                count: Math.floor(Math.random() * 100) + 20
            })).sort((a, b) => b.count - a.count);

            const html = cities.slice(0, 10).map(city => `
                <div class="location-item">
                    <span class="location-name">
                        ${city.city}
                    </span>
                    <span class="location-count">${city.count}</span>
                </div>
            `).join('');

            document.getElementById('cityList').innerHTML = html;
            document.getElementById('activeCities').textContent = cities.length;
            
            console.log('✓ City list updated');
        } catch (error) {
            console.error('Error updating city list:', error);
        }
    }

    async updateRegionalCharts() {
        try {
            // Get language data
            const langRes = await fetch(`${API_BASE}/language/distribution`);
            const langData = await langRes.json();

            if (langData && langData.length > 0) {
                languageRegionChart.data.labels = langData.slice(0, 5).map(l => l.language.toUpperCase());
                languageRegionChart.data.datasets[0].data = langData.slice(0, 5).map(l => l.count);
                languageRegionChart.update();
            }

            // Simulate regional sentiment
            const regions = ['Americas', 'Europe', 'Asia', 'Africa', 'Oceania'];
            regionalChart.data.datasets[0].data = regions.map(() => Math.floor(Math.random() * 100) + 50);
            regionalChart.data.datasets[1].data = regions.map(() => Math.floor(Math.random() * 80) + 30);
            regionalChart.data.datasets[2].data = regions.map(() => Math.floor(Math.random() * 40) + 10);
            regionalChart.update();

            // Simulate regional timeline
            const labels = Array.from({length: 10}, (_, i) => `${i * 2}h ago`);
            regionalTimelineChart.data.labels = labels;
            regionalTimelineChart.data.datasets[0].data = Array.from({length: 10}, () => Math.floor(Math.random() * 50) + 20);
            regionalTimelineChart.data.datasets[1].data = Array.from({length: 10}, () => Math.floor(Math.random() * 50) + 20);
            regionalTimelineChart.data.datasets[2].data = Array.from({length: 10}, () => Math.floor(Math.random() * 50) + 20);
            regionalTimelineChart.update();

            console.log('✓ Regional charts updated');
        } catch (error) {
            console.error('Error updating regional charts:', error);
        }
    }

    async updateRegionalStats() {
        try {
            const regions = {
                americas: Math.floor(Math.random() * 500) + 200,
                europe: Math.floor(Math.random() * 400) + 150,
                asia: Math.floor(Math.random() * 600) + 300,
                africa: Math.floor(Math.random() * 200) + 50,
                oceania: Math.floor(Math.random() * 150) + 40
            };

            document.getElementById('americasCount').textContent = regions.americas;
            document.getElementById('europeCount').textContent = regions.europe;
            document.getElementById('asiaCount').textContent = regions.asia;
            document.getElementById('africaCount').textContent = regions.africa;
            document.getElementById('oceaniaCount').textContent = regions.oceania;

            // Set sentiment badges
            this.setRegionSentiment('americasSentiment', 'positive');
            this.setRegionSentiment('europeSentiment', 'neutral');
            this.setRegionSentiment('asiaSentiment', 'positive');
            this.setRegionSentiment('africaSentiment', 'neutral');
            this.setRegionSentiment('oceaniaSentiment', 'neutral');

            // Update total mapped
            const total = Object.values(regions).reduce((sum, val) => sum + val, 0);
            document.getElementById('totalMapped').textContent = total;

            console.log('✓ Regional stats updated');
        } catch (error) {
            console.error('Error updating regional stats:', error);
        }
    }

    updateMapView() {
        // Different visualizations based on selected view
        console.log(`Switching to ${currentView} view`);
        this.updateMapMarkers();
    }

    // Utility functions
    getRandomSentiment(sentData) {
        const total = sentData.total || 1;
        const posProb = (sentData.positive / total) * 100;
        const neuProb = ((sentData.positive + sentData.neutral) / total) * 100;
        
        const rand = Math.random() * 100;
        if (rand < posProb) return 'positive';
        if (rand < neuProb) return 'neutral';
        return 'negative';
    }

    getSentimentColor(sentiment) {
        switch(sentiment) {
            case 'positive': return '#00f5a0';
            case 'negative': return '#ff4757';
            default: return '#6b7cff';
        }
    }

    getCountryFlag(country) {
        const flags = {
            'United States': '🇺🇸',
            'United Kingdom': '🇬🇧',
            'Germany': '🇩🇪',
            'Japan': '🇯🇵',
            'Australia': '🇦🇺',
            'Brazil': '🇧🇷',
            'France': '🇫🇷',
            'India': '🇮🇳',
            'Canada': '🇨🇦'
        };
        return flags[country] || '🌍';
    }

    setRegionSentiment(elementId, sentiment) {
        const el = document.getElementById(elementId);
        el.textContent = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
        el.className = `region-sentiment ${sentiment}`;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new GeoApp();
});