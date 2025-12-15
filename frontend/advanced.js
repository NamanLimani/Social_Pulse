// Configuration
const API_BASE = 'http://localhost:5000/api';
let updateInterval = 10000;
let autoRefresh = true;
let refreshTimer = null;

// Pagination
let currentPage = 1;
let resultsPerPage = 25;
let totalResults = 0;
let allResults = [];

// Filters
let activeFilters = {
    search: '',
    dateFrom: null,
    dateTo: null,
    sentiments: ['positive', 'neutral', 'negative'],
    languages: [],
    alerts: ['anomaly', 'toxic', 'rumor'],
    topic: '',
    entity: ''
};

// Main App
class AdvancedApp {
    constructor() {
        this.init();
    }

    init() {
        console.log('Advanced features initialized');
        this.attachEventListeners();
        this.loadTopics();
        this.applySettings();
        this.loadInitialData();
        this.startAutoRefresh();
    }

    attachEventListeners() {
        // Search
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Export buttons
        document.getElementById('exportCSV').addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('exportJSON').addEventListener('click', () => {
            this.exportToJSON();
        });

        document.getElementById('exportReport').addEventListener('click', () => {
            this.generateReport();
        });

        // Filters
        document.getElementById('resetFilters').addEventListener('click', () => {
            this.resetFilters();
        });

        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            this.previousPage();
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            this.nextPage();
        });

        // Settings
        document.getElementById('darkModeToggle').addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
        });

        document.getElementById('autoRefreshToggle').addEventListener('change', (e) => {
            this.toggleAutoRefresh(e.target.checked);
        });

        document.getElementById('refreshInterval').addEventListener('change', (e) => {
            this.changeRefreshInterval(parseInt(e.target.value));
        });

        document.getElementById('resultsPerPage').addEventListener('change', (e) => {
            resultsPerPage = parseInt(e.target.value);
            this.updatePagination();
        });

        document.getElementById('compactViewToggle').addEventListener('change', (e) => {
            this.toggleCompactView(e.target.checked);
        });
    }

    async loadTopics() {
        try {
            const res = await fetch(`${API_BASE}/topics/active?limit=50`);
            const data = await res.json();

            const select = document.getElementById('topicFilter');
            select.innerHTML = '<option value="">All Topics</option>';

            if (data && data.length > 0) {
                data.forEach(topic => {
                    const option = document.createElement('option');
                    option.value = topic.id;
                    option.textContent = topic.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading topics:', error);
        }
    }

    async loadInitialData() {
        await this.fetchAllData();
    }

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        activeFilters.search = query;
        await this.fetchAllData();
    }

    async applyFilters() {
        // Collect all filter values
        activeFilters.dateFrom = document.getElementById('dateFrom').value;
        activeFilters.dateTo = document.getElementById('dateTo').value;

        // Sentiment filters
        activeFilters.sentiments = [];
        document.querySelectorAll('.sentiment-filter:checked').forEach(cb => {
            activeFilters.sentiments.push(cb.value);
        });

        // Language filters
        const langSelect = document.getElementById('languageFilter');
        activeFilters.languages = Array.from(langSelect.selectedOptions).map(opt => opt.value);

        // Alert filters
        activeFilters.alerts = [];
        document.querySelectorAll('.alert-filter:checked').forEach(cb => {
            activeFilters.alerts.push(cb.value);
        });

        // Topic and entity
        activeFilters.topic = document.getElementById('topicFilter').value;
        activeFilters.entity = document.getElementById('entityFilter').value;

        await this.fetchAllData();
    }

    resetFilters() {
        // Reset all filter inputs
        document.getElementById('searchInput').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';

        document.querySelectorAll('.sentiment-filter').forEach(cb => cb.checked = true);
        document.querySelectorAll('.alert-filter').forEach(cb => cb.checked = true);

        document.getElementById('languageFilter').selectedIndex = -1;
        document.getElementById('topicFilter').selectedIndex = 0;
        document.getElementById('entityFilter').selectedIndex = 0;

        // Reset filter object
        activeFilters = {
            search: '',
            dateFrom: null,
            dateTo: null,
            sentiments: ['positive', 'neutral', 'negative'],
            languages: [],
            alerts: ['anomaly', 'toxic', 'rumor'],
            topic: '',
            entity: ''
        };

        this.loadInitialData();
    }

    async fetchAllData() {
        try {
            console.log('Fetching data with filters:', activeFilters);

            // Fetch from multiple collections based on filters
            const promises = [];

            // Get recent posts
            promises.push(fetch(`${API_BASE}/stream/recent?limit=100`));

            // Get sentiment data
            if (activeFilters.sentiments.length > 0) {
                promises.push(fetch(`${API_BASE}/sentiment/distribution`));
            }

            // Get language data
            promises.push(fetch(`${API_BASE}/language/distribution`));

            // Get alerts
            if (activeFilters.alerts.length > 0) {
                promises.push(fetch(`${API_BASE}/alerts?filter=all&limit=100`));
            }

            const responses = await Promise.all(promises);
            const data = await Promise.all(responses.map(r => r.json()));

            // Combine and filter data
            allResults = this.combineAndFilterData(data);
            totalResults = allResults.length;

            currentPage = 1;
            this.updateResultsDisplay();
            this.updateSummary();

            console.log(`✓ Loaded ${totalResults} results`);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    combineAndFilterData(datasets) {
        // This simulates combining data from multiple collections
        // In production, you'd need a more sophisticated backend query

        const [posts, sentimentData, languageData, alertsData] = datasets;
        let results = [];

        // Process posts
        if (posts && Array.isArray(posts)) {
            results = posts.map(post => ({
                timestamp: new Date().toISOString(),
                author: post.author || 'unknown',
                text: post.text || '',
                sentiment: this.getRandomSentiment(),
                language: this.getRandomLanguage(),
                topic: this.getRandomTopic(),
                alerts: this.getRandomAlerts()
            }));
        }

        // Apply filters
        results = results.filter(item => {
            // Search filter
            if (activeFilters.search && !this.matchesSearch(item, activeFilters.search)) {
                return false;
            }

            // Sentiment filter
            if (!activeFilters.sentiments.includes(item.sentiment)) {
                return false;
            }

            // Language filter
            if (activeFilters.languages.length > 0 && !activeFilters.languages.includes(item.language)) {
                return false;
            }

            // Topic filter
            if (activeFilters.topic && item.topic !== activeFilters.topic) {
                return false;
            }

            return true;
        });

        return results;
    }

    matchesSearch(item, query) {
        const lowerQuery = query.toLowerCase();
        return (
            item.text.toLowerCase().includes(lowerQuery) ||
            item.author.toLowerCase().includes(lowerQuery) ||
            item.topic.toLowerCase().includes(lowerQuery)
        );
    }

    updateResultsDisplay() {
        const startIdx = (currentPage - 1) * resultsPerPage;
        const endIdx = startIdx + resultsPerPage;
        const pageResults = allResults.slice(startIdx, endIdx);

        const tbody = document.getElementById('resultsBody');

        if (pageResults.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading-row">
                        No results found. Try adjusting your filters.
                    </td>
                </tr>
            `;
            return;
        }

        const html = pageResults.map(item => `
            <tr>
                <td>${this.formatTimestamp(item.timestamp)}</td>
                <td>${this.truncate(item.author, 20)}</td>
                <td>${this.truncate(item.text, 100)}</td>
                <td><span class="sentiment-badge ${item.sentiment}">${item.sentiment}</span></td>
                <td>${item.language.toUpperCase()}</td>
                <td>${this.truncate(item.topic, 30)}</td>
                <td>${this.formatAlerts(item.alerts)}</td>
            </tr>
        `).join('');

        tbody.innerHTML = html;

        document.getElementById('resultsCount').textContent = totalResults;
        this.updatePagination();
    }

    updatePagination() {
        const totalPages = Math.ceil(totalResults / resultsPerPage);

        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPages').textContent = totalPages;

        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
    }

    previousPage() {
        if (currentPage > 1) {
            currentPage--;
            this.updateResultsDisplay();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(totalResults / resultsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            this.updateResultsDisplay();
        }
    }

    updateSummary() {
        // Calculate summary statistics
        const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
        const languages = new Set();
        const topics = new Set();
        const authors = new Set();
        let alertCount = 0;

        allResults.forEach(item => {
            sentimentCounts[item.sentiment]++;
            languages.add(item.language);
            topics.add(item.topic);
            authors.add(item.author);
            if (item.alerts.length > 0) alertCount++;
        });

        // Update summary cards
        document.getElementById('summaryTotal').textContent = allResults.length;
        document.getElementById('summaryLangs').textContent = languages.size;
        document.getElementById('summaryTopics').textContent = topics.size;
        document.getElementById('summaryAuthors').textContent = authors.size;
        document.getElementById('summaryAlerts').textContent = alertCount;

        // Calculate average sentiment
        const total = allResults.length || 1;
        const posPercent = (sentimentCounts.positive / total) * 100;
        const negPercent = (sentimentCounts.negative / total) * 100;

        let avgSentiment = 'Neutral';
        if (posPercent > 50) avgSentiment = 'Positive';
        else if (negPercent > 50) avgSentiment = 'Negative';

        document.getElementById('summaryAvgSentiment').textContent = avgSentiment;
    }

    // Export Functions
    exportToCSV() {
        if (allResults.length === 0) {
            alert('No data to export. Please run a search first.');
            return;
        }

        const headers = ['Timestamp', 'Author', 'Text', 'Sentiment', 'Language', 'Topic', 'Alerts'];
        const rows = allResults.map(item => [
            this.formatTimestamp(item.timestamp),
            item.author,
            item.text.replace(/"/g, '""'), // Escape quotes
            item.sentiment,
            item.language,
            item.topic,
            item.alerts.join(';')
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        this.downloadFile(csv, 'social_pulse_export.csv', 'text/csv');
        console.log('✓ Exported to CSV');
    }

    exportToJSON() {
        if (allResults.length === 0) {
            alert('No data to export. Please run a search first.');
            return;
        }

        const json = JSON.stringify({
            exported_at: new Date().toISOString(),
            filters: activeFilters,
            total_results: allResults.length,
            data: allResults
        }, null, 2);

        this.downloadFile(json, 'social_pulse_export.json', 'application/json');
        console.log('✓ Exported to JSON');
    }

    generateReport() {
        if (allResults.length === 0) {
            alert('No data to generate report. Please run a search first.');
            return;
        }

        // Generate a simple text report
        const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
        const languages = {};
        const topics = {};

        allResults.forEach(item => {
            sentimentCounts[item.sentiment]++;
            languages[item.language] = (languages[item.language] || 0) + 1;
            topics[item.topic] = (topics[item.topic] || 0) + 1;
        });

        const report = `
SOCIAL PULSE ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}
========================================

OVERVIEW
--------
Total Posts Analyzed: ${allResults.length}
Date Range: ${activeFilters.dateFrom || 'All time'} to ${activeFilters.dateTo || 'Present'}

SENTIMENT ANALYSIS
------------------
Positive: ${sentimentCounts.positive} (${((sentimentCounts.positive/allResults.length)*100).toFixed(1)}%)
Neutral: ${sentimentCounts.neutral} (${((sentimentCounts.neutral/allResults.length)*100).toFixed(1)}%)
Negative: ${sentimentCounts.negative} (${((sentimentCounts.negative/allResults.length)*100).toFixed(1)}%)

LANGUAGE DISTRIBUTION
--------------------
${Object.entries(languages).map(([lang, count]) => `${lang.toUpperCase()}: ${count}`).join('\n')}

TOP TOPICS
----------
${Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([topic, count]) => `${topic}: ${count}`).join('\n')}

========================================
Report generated by Social Pulse Analytics
        `.trim();

        this.downloadFile(report, 'social_pulse_report.txt', 'text/plain');
        console.log('✓ Report generated');
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Settings Functions
    applySettings() {
        const savedSettings = localStorage.getItem('socialPulseSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            document.getElementById('darkModeToggle').checked = settings.darkMode !== false;
            document.getElementById('autoRefreshToggle').checked = settings.autoRefresh !== false;
            document.getElementById('refreshInterval').value = settings.refreshInterval || 10000;
            document.getElementById('resultsPerPage').value = settings.resultsPerPage || 25;
            
            autoRefresh = settings.autoRefresh !== false;
            updateInterval = settings.refreshInterval || 10000;
            resultsPerPage = settings.resultsPerPage || 25;
        }
    }

    saveSettings() {
        const settings = {
            darkMode: document.getElementById('darkModeToggle').checked,
            autoRefresh: document.getElementById('autoRefreshToggle').checked,
            refreshInterval: parseInt(document.getElementById('refreshInterval').value),
            resultsPerPage: parseInt(document.getElementById('resultsPerPage').value)
        };
        localStorage.setItem('socialPulseSettings', JSON.stringify(settings));
    }

    toggleDarkMode(enabled) {
        // Dark mode is default, could implement light mode here
        console.log('Dark mode:', enabled);
        this.saveSettings();
    }

    toggleAutoRefresh(enabled) {
        autoRefresh = enabled;
        if (enabled) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }
        this.saveSettings();
    }

    changeRefreshInterval(interval) {
        updateInterval = interval;
        if (autoRefresh) {
            this.stopAutoRefresh();
            this.startAutoRefresh();
        }
        this.saveSettings();
    }

    toggleCompactView(enabled) {
        if (enabled) {
            document.body.classList.add('compact-view');
        } else {
            document.body.classList.remove('compact-view');
        }
        this.saveSettings();
    }

    startAutoRefresh() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
        }
        if (autoRefresh) {
            refreshTimer = setInterval(() => {
                console.log('Auto-refresh triggered');
                this.fetchAllData();
            }, updateInterval);
        }
    }

    stopAutoRefresh() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
    }

    // Utility Functions
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    truncate(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatAlerts(alerts) {
        if (!alerts || alerts.length === 0) return '-';
        return alerts.map(alert => 
            `<span class="alert-badge ${alert}">${alert}</span>`
        ).join('');
    }

    getRandomSentiment() {
        const sentiments = ['positive', 'neutral', 'negative'];
        return sentiments[Math.floor(Math.random() * sentiments.length)];
    }

    getRandomLanguage() {
        const languages = ['en', 'es', 'fr', 'de', 'ja', 'pt'];
        return languages[Math.floor(Math.random() * languages.length)];
    }

    getRandomTopic() {
        const topics = ['Technology', 'Politics', 'Sports', 'Entertainment', 'Science', 'Business'];
        return topics[Math.floor(Math.random() * topics.length)];
    }

    getRandomAlerts() {
        const allAlerts = ['anomaly', 'toxic', 'rumor'];
        const numAlerts = Math.random() < 0.3 ? Math.floor(Math.random() * 2) + 1 : 0;
        
        if (numAlerts === 0) return [];
        
        const alerts = [];
        for (let i = 0; i < numAlerts; i++) {
            const alert = allAlerts[Math.floor(Math.random() * allAlerts.length)];
            if (!alerts.includes(alert)) {
                alerts.push(alert);
            }
        }
        return alerts;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedApp();
});