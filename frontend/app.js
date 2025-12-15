// Configuration
const API_BASE = 'http://localhost:5000/api';
const UPDATE_INTERVAL = 5000; // 5 seconds

// Main App
class Dashboard {
    constructor() {
        this.init();
    }

    init() {
        console.log('Dashboard initialized');
        this.updateAll();
        setInterval(() => this.updateAll(), UPDATE_INTERVAL);
    }

    async updateAll() {
        await Promise.all([
            this.updateSentiment(),
            this.updateTrending(),
            this.updateLanguages(),
            this.updateTopics(),
            this.updateAlerts(),
            this.updateFeed(),
            this.updateStats()
        ]);
    }

    // Sentiment Distribution
    async updateSentiment() {
        try {
            const res = await fetch(`${API_BASE}/sentiment/distribution`);
            const data = await res.json();
            
            const total = data.total || 1;
            const positive = ((data.positive / total) * 100).toFixed(1);
            const neutral = ((data.neutral / total) * 100).toFixed(1);
            const negative = ((data.negative / total) * 100).toFixed(1);

            const html = `
                <div class="sentiment-bar">
                    <div class="bar-label">
                        <span class="bar-name">Positive</span>
                        <span class="bar-value">${positive}%</span>
                    </div>
                    <div class="bar-fill-wrapper">
                        <div class="bar-fill positive" style="width: ${positive}%"></div>
                    </div>
                </div>
                <div class="sentiment-bar">
                    <div class="bar-label">
                        <span class="bar-name">Neutral</span>
                        <span class="bar-value">${neutral}%</span>
                    </div>
                    <div class="bar-fill-wrapper">
                        <div class="bar-fill neutral" style="width: ${neutral}%"></div>
                    </div>
                </div>
                <div class="sentiment-bar">
                    <div class="bar-label">
                        <span class="bar-name">Negative</span>
                        <span class="bar-value">${negative}%</span>
                    </div>
                    <div class="bar-fill-wrapper">
                        <div class="bar-fill negative" style="width: ${negative}%"></div>
                    </div>
                </div>
            `;
            
            document.getElementById('sentimentBars').innerHTML = html;
        } catch (error) {
            console.error('Error updating sentiment:', error);
        }
    }

    // Trending Entities
    async updateTrending() {
        try {
            const res = await fetch(`${API_BASE}/trends/entities?limit=10`);
            const data = await res.json();
            
            if (!data || data.length === 0) {
                document.getElementById('trendingList').innerHTML = '<div class="loading">No trends yet...</div>';
                return;
            }

            const html = data.map(trend => `
                <div class="trend-item">
                    <span class="trend-name">${this.formatEntity(trend.entity)}</span>
                    <span class="trend-count">${trend.mentions}</span>
                </div>
            `).join('');
            
            document.getElementById('trendingList').innerHTML = html;
        } catch (error) {
            console.error('Error updating trending:', error);
        }
    }

    formatEntity(entity) {
        const parts = entity.split(':');
        if (parts.length === 2) {
            return `${parts[1]} <span style="opacity:0.5;font-size:0.75rem">(${parts[0]})</span>`;
        }
        return entity;
    }

    // Language Distribution
    async updateLanguages() {
        try {
            const res = await fetch(`${API_BASE}/language/distribution`);
            const data = await res.json();
            
            if (!data || data.length === 0) {
                document.getElementById('languageGrid').innerHTML = '<div class="loading">Analyzing...</div>';
                return;
            }

            const html = data.slice(0, 6).map(lang => `
                <div class="lang-item">
                    <span class="lang-code">${lang.language.toUpperCase()}</span>
                    <span class="lang-percent">${lang.percentage.toFixed(1)}%</span>
                </div>
            `).join('');
            
            document.getElementById('languageGrid').innerHTML = html;
        } catch (error) {
            console.error('Error updating languages:', error);
        }
    }

    // Active Topics
    async updateTopics() {
        try {
            const res = await fetch(`${API_BASE}/topics/active?limit=20`);
            const data = await res.json();
            
            if (!data || data.length === 0) {
                document.getElementById('topicsList').innerHTML = '<div class="loading">Identifying topics...</div>';
                return;
            }

            const html = data.map(topic => `
                <span class="topic-tag">${topic.name}</span>
            `).join('');
            
            document.getElementById('topicsList').innerHTML = html;
        } catch (error) {
            console.error('Error updating topics:', error);
        }
    }

    // Alerts
    async updateAlerts() {
        try {
            const res = await fetch(`${API_BASE}/alerts?filter=all&limit=20`);
            const data = await res.json();
            
            if (!data || data.length === 0) {
                document.getElementById('alertsList').innerHTML = '<div class="loading">No alerts...</div>';
                return;
            }

            const html = data.map(alert => {
                const type = this.getAlertType(alert);
                return `
                    <div class="alert-item ${type}">
                        <div class="alert-type">${type}</div>
                        <div class="alert-text">${this.truncate(alert.text, 100)}</div>
                    </div>
                `;
            }).join('');
            
            document.getElementById('alertsList').innerHTML = html;
        } catch (error) {
            console.error('Error updating alerts:', error);
        }
    }

    getAlertType(alert) {
        if (alert.topic_anomaly) return 'anomaly';
        if (alert.toxic) return 'toxic';
        if (alert.is_rumor) return 'rumor';
        return 'info';
    }

    // Live Feed
    async updateFeed() {
        try {
            const res = await fetch(`${API_BASE}/stream/recent?limit=15`);
            const data = await res.json();
            
            if (!data || data.length === 0) {
                document.getElementById('liveFeed').innerHTML = '<div class="loading">Waiting for posts...</div>';
                return;
            }

            const html = data.map(post => `
                <div class="feed-item">
                    <div class="feed-author">@${this.truncate(post.author, 30)}</div>
                    <div class="feed-text">${this.truncate(post.text, 150)}</div>
                </div>
            `).join('');
            
            document.getElementById('liveFeed').innerHTML = html;
        } catch (error) {
            console.error('Error updating feed:', error);
        }
    }

    // Stats
    async updateStats() {
        try {
            const res = await fetch(`${API_BASE}/stats/dashboard`);
            const data = await res.json();
            
            document.getElementById('totalPosts').textContent = this.formatNumber(data.totalPosts || 0);
            document.getElementById('postsPerMin').textContent = this.formatNumber(data.postsPerMin || 0);
            document.getElementById('activeTopics').textContent = data.activeTopics || 0;
            document.getElementById('alertCount').textContent = data.alertCount || 0;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // Utilities
    truncate(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
}

// Start dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});