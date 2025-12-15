"""
Flask API Server - Connects MongoDB to Frontend
Bridges backend pipeline (MongoDB) with frontend dashboard
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timedelta
from collections import defaultdict

app = Flask(__name__)
CORS(app)

# MongoDB Connection
mongo = MongoClient('mongodb://localhost:27017/')
db = mongo['bigdata']

# Collections
raw_posts = db['raw_posts']
language = db['language']
sentiment = db['sentiment']
entities = db['entities']
topics = db['topics']
anomalies = db['anomalies']
rumor = db['rumor']
toxicity = db['toxicity']
trend_aggregates = db['trend_aggregates']


# ============================================================================
# ORIGINAL ENDPOINTS (Phase 1)
# ============================================================================

@app.route('/api/sentiment/distribution', methods=['GET'])
def get_sentiment():
    """Get current sentiment distribution"""
    try:
        pipeline = [
            {'$group': {
                '_id': '$sentiment',
                'count': {'$sum': 1}
            }}
        ]
        
        results = list(sentiment.aggregate(pipeline))
        
        dist = {
            'positive': 0,
            'neutral': 0,
            'negative': 0,
            'unknown': 0,
            'total': 0
        }
        
        for r in results:
            s = r['_id']
            c = r['count']
            if s in dist:
                dist[s] = c
            dist['total'] += c
        
        return jsonify(dist)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/trends/entities', methods=['GET'])
def get_trending():
    """Get trending entities from trend_aggregates collection"""
    try:
        limit = int(request.args.get('limit', 10))
        
        # Get latest aggregate snapshot
        latest = trend_aggregates.find_one(sort=[('bucket_ts', -1)])
        
        if not latest or 'leaderboard' not in latest:
            return jsonify([])
        
        trends = latest['leaderboard'][:limit]
        
        result = []
        for t in trends:
            result.append({
                'entity': t['entity'],
                'mentions': t['mentions'],
                'positive': t.get('positive', 0),
                'total': t.get('total', 0)
            })
        
        return jsonify(result)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify([])


@app.route('/api/language/distribution', methods=['GET'])
def get_languages():
    """Get language distribution from language collection"""
    try:
        pipeline = [
            {'$group': {
                '_id': '$lang',
                'count': {'$sum': 1}
            }},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]
        
        results = list(language.aggregate(pipeline))
        total = sum(r['count'] for r in results)
        
        dist = []
        for r in results:
            dist.append({
                'language': r['_id'],
                'count': r['count'],
                'percentage': (r['count'] / total * 100) if total > 0 else 0
            })
        
        return jsonify(dist)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify([])


@app.route('/api/topics/active', methods=['GET'])
def get_topics():
    """Get active topics from topics collection"""
    try:
        limit = int(request.args.get('limit', 20))
        
        pipeline = [
            {'$group': {
                '_id': '$topic',
                'count': {'$sum': 1},
                'keywords': {'$first': '$topic_keywords'}
            }},
            {'$sort': {'count': -1}},
            {'$limit': limit}
        ]
        
        results = list(topics.aggregate(pipeline))
        
        topic_list = []
        for r in results:
            topic_id = r['_id']
            keywords = r.get('keywords', [])
            
            if keywords and len(keywords) > 0:
                name = ', '.join(keywords[:3])
            else:
                name = f"Topic {topic_id}"
            
            topic_list.append({
                'id': topic_id,
                'name': name,
                'count': r['count'],
                'keywords': keywords
            })
        
        return jsonify(topic_list)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify([])


@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get alerts (anomaly, toxic, rumor) from respective collections"""
    try:
        filter_type = request.args.get('filter', 'all')
        limit = int(request.args.get('limit', 50))
        
        alerts = []
        
        if filter_type in ['all', 'anomaly']:
            anomaly_docs = anomalies.find(
                {'topic_anomaly': True}
            ).sort('_id', -1).limit(limit)
            
            for doc in anomaly_docs:
                alerts.append({
                    'type': 'anomaly',
                    'text': doc.get('text', ''),
                    'topic': doc.get('topic'),
                    'topic_anomaly': True
                })
        
        if filter_type in ['all', 'toxic']:
            toxic_docs = toxicity.find(
                {'toxic': True}
            ).sort('_id', -1).limit(limit)
            
            for doc in toxic_docs:
                alerts.append({
                    'type': 'toxic',
                    'text': doc.get('text', ''),
                    'toxic': True,
                    'toxicity_score': doc.get('toxicity_score', 0)
                })
        
        if filter_type in ['all', 'rumor']:
            rumor_docs = rumor.find(
                {'is_rumor': True}
            ).sort('_id', -1).limit(limit)
            
            for doc in rumor_docs:
                alerts.append({
                    'type': 'rumor',
                    'text': doc.get('text', ''),
                    'is_rumor': True,
                    'rumor_score': doc.get('rumor_score', 0)
                })
        
        alerts = alerts[:limit]
        return jsonify(alerts)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify([])


@app.route('/api/stream/recent', methods=['GET'])
def get_stream():
    """Get recent posts from language collection"""
    try:
        limit = int(request.args.get('limit', 20))
        
        posts = language.find().sort('_id', -1).limit(limit)
        
        stream = []
        for post in posts:
            stream.append({
                'author': post.get('author', 'unknown'),
                'text': post.get('text', ''),
                'created_at': post.get('created_at', '')
            })
        
        return jsonify(stream)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify([])


@app.route('/api/stats/dashboard', methods=['GET'])
def get_stats():
    """Get overall dashboard statistics"""
    try:
        total_posts = raw_posts.count_documents({})
        active_topics = len(topics.distinct('topic'))
        
        anomaly_count = anomalies.count_documents({'topic_anomaly': True})
        toxic_count = toxicity.count_documents({'toxic': True})
        rumor_count = rumor.count_documents({'is_rumor': True})
        alert_count = anomaly_count + toxic_count + rumor_count
        
        posts_per_min = 0
        
        return jsonify({
            'totalPosts': total_posts,
            'postsPerMin': posts_per_min,
            'activeTopics': active_topics,
            'alertCount': alert_count
        })
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            'totalPosts': 0,
            'postsPerMin': 0,
            'activeTopics': 0,
            'alertCount': 0
        })


# ============================================================================
# NEW ENDPOINTS (Phase 2 - Real-time Charts)
# ============================================================================

@app.route('/api/sentiment/timeline', methods=['GET'])
def get_sentiment_timeline():
    """
    Get sentiment over time from trend_aggregates collection
    Returns time-series data for sentiment trends
    """
    try:
        limit = int(request.args.get('limit', 20))
        
        # Get last N aggregate snapshots (each snapshot is a time point)
        aggregates = list(trend_aggregates.find().sort('bucket_ts', -1).limit(limit))
        
        if not aggregates:
            return jsonify({
                'labels': [],
                'positive': [],
                'neutral': [],
                'negative': []
            })
        
        # Reverse to get chronological order
        aggregates.reverse()
        
        # For each time bucket, get sentiment counts
        labels = []
        positive_data = []
        neutral_data = []
        negative_data = []
        
        for agg in aggregates:
            # Create timestamp label
            bucket_ts = agg.get('bucket_ts', 0)
            time_label = datetime.fromtimestamp(bucket_ts).strftime('%H:%M')
            labels.append(time_label)
            
            # Get sentiment for entities in this bucket
            leaderboard = agg.get('leaderboard', [])
            pos_count = sum(item.get('positive', 0) for item in leaderboard)
            total_count = sum(item.get('total', 0) for item in leaderboard)
            neg_count = total_count - pos_count
            neutral_count = max(0, total_count - pos_count - neg_count)
            
            positive_data.append(pos_count)
            neutral_data.append(neutral_count)
            negative_data.append(neg_count)
        
        return jsonify({
            'labels': labels,
            'positive': positive_data,
            'neutral': neutral_data,
            'negative': negative_data
        })
    except Exception as e:
        print(f"Error in sentiment timeline: {e}")
        return jsonify({
            'labels': [],
            'positive': [],
            'neutral': [],
            'negative': []
        })


@app.route('/api/activity/timeline', methods=['GET'])
def get_activity_timeline():
    """
    Get post activity over time
    Returns posts per time bucket
    """
    try:
        limit = int(request.args.get('limit', 20))
        
        # Get trend aggregates as time markers
        aggregates = list(trend_aggregates.find().sort('bucket_ts', -1).limit(limit))
        
        if not aggregates:
            return jsonify({
                'labels': [],
                'data': []
            })
        
        aggregates.reverse()
        
        labels = []
        data = []
        
        for agg in aggregates:
            bucket_ts = agg.get('bucket_ts', 0)
            time_label = datetime.fromtimestamp(bucket_ts).strftime('%H:%M')
            labels.append(time_label)
            
            # Count total mentions in this bucket
            leaderboard = agg.get('leaderboard', [])
            total_mentions = sum(item.get('mentions', 0) for item in leaderboard)
            data.append(total_mentions)
        
        return jsonify({
            'labels': labels,
            'data': data
        })
    except Exception as e:
        print(f"Error in activity timeline: {e}")
        return jsonify({
            'labels': [],
            'data': []
        })


@app.route('/api/alerts/breakdown', methods=['GET'])
def get_alerts_breakdown():
    """
    Get real count of each alert type
    Returns breakdown of anomaly, toxic, and rumor alerts
    """
    try:
        anomaly_count = anomalies.count_documents({'topic_anomaly': True})
        toxic_count = toxicity.count_documents({'toxic': True})
        rumor_count = rumor.count_documents({'is_rumor': True})
        
        return jsonify({
            'anomaly': anomaly_count,
            'toxic': toxic_count,
            'rumor': rumor_count
        })
    except Exception as e:
        print(f"Error in alerts breakdown: {e}")
        return jsonify({
            'anomaly': 0,
            'toxic': 0,
            'rumor': 0
        })


@app.route('/api/activity/hourly', methods=['GET'])
def get_hourly_activity():
    """
    Get post activity by hour of day (0-23)
    Returns array of 24 values for heatmap
    """
    try:
        # Get all posts from language collection
        posts = language.find({'created_at': {'$exists': True}})
        
        # Count by hour
        hourly_counts = defaultdict(int)
        
        for post in posts:
            created_at = post.get('created_at', '')
            if created_at:
                try:
                    # Parse ISO datetime and extract hour
                    dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    hour = dt.hour
                    hourly_counts[hour] += 1
                except:
                    pass
        
        # Create array for all 24 hours
        data = [hourly_counts.get(i, 0) for i in range(24)]
        
        return jsonify({
            'labels': [f"{i}:00" for i in range(24)],
            'data': data
        })
    except Exception as e:
        print(f"Error in hourly activity: {e}")
        return jsonify({
            'labels': [f"{i}:00" for i in range(24)],
            'data': [0] * 24
        })


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        db.command('ping')
        return jsonify({
            'status': 'healthy',
            'mongodb': 'connected',
            'collections': {
                'raw_posts': raw_posts.count_documents({}),
                'sentiment': sentiment.count_documents({}),
                'language': language.count_documents({}),
                'entities': entities.count_documents({}),
                'topics': topics.count_documents({}),
                'trend_aggregates': trend_aggregates.count_documents({})
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@app.route('/api/search', methods=['POST'])
def search_posts():
    """
    Advanced search endpoint
    Supports filtering by multiple criteria
    """
    try:
        filters = request.json
        
        # Build MongoDB query based on filters
        query = {}
        
        # Text search
        if filters.get('search'):
            query['text'] = {'$regex': filters['search'], '$options': 'i'}
        
        # Date range
        if filters.get('dateFrom') or filters.get('dateTo'):
            query['created_at'] = {}
            if filters.get('dateFrom'):
                query['created_at']['$gte'] = filters['dateFrom']
            if filters.get('dateTo'):
                query['created_at']['$lte'] = filters['dateTo']
        
        # Get posts from language collection
        posts = list(language.find(query).limit(1000))
        
        # Get sentiment for each post
        results = []
        for post in posts:
            post_id = post.get('_id')
            
            # Get sentiment
            sent = sentiment.find_one({'_id': post_id})
            sent_value = sent.get('sentiment', 'unknown') if sent else 'unknown'
            
            # Get topic
            topic_doc = topics.find_one({'_id': post_id})
            topic_value = topic_doc.get('topic', 'General') if topic_doc else 'General'
            
            # Check alerts
            alerts = []
            if anomalies.find_one({'_id': post_id, 'topic_anomaly': True}):
                alerts.append('anomaly')
            if toxicity.find_one({'_id': post_id, 'toxic': True}):
                alerts.append('toxic')
            if rumor.find_one({'_id': post_id, 'is_rumor': True}):
                alerts.append('rumor')
            
            results.append({
                'timestamp': post.get('created_at', ''),
                'author': post.get('author', 'unknown'),
                'text': post.get('text', ''),
                'sentiment': sent_value,
                'language': post.get('lang', 'unknown'),
                'topic': topic_value,
                'alerts': alerts
            })
        
        # Apply sentiment filter
        if filters.get('sentiments'):
            results = [r for r in results if r['sentiment'] in filters['sentiments']]
        
        # Apply language filter
        if filters.get('languages'):
            results = [r for r in results if r['language'] in filters['languages']]
        
        return jsonify(results)
    except Exception as e:
        print(f"Error in search: {e}")
        return jsonify([])


if __name__ == '__main__':
    print("=" * 60)
    print("Starting Flask API Server (Frontend-Backend Bridge)")
    print("=" * 60)
    print("MongoDB: mongodb://localhost:27017/")
    print("Database: bigdata")
    print("API: http://localhost:5000")
    print("=" * 60)
    print("\nAvailable Endpoints:")
    print("  Phase 1 (Basic Dashboard):")
    print("    GET /api/sentiment/distribution")
    print("    GET /api/trends/entities")
    print("    GET /api/language/distribution")
    print("    GET /api/topics/active")
    print("    GET /api/alerts")
    print("    GET /api/stream/recent")
    print("    GET /api/stats/dashboard")
    print("\n  Phase 2 (Charts & Analytics):")
    print("    GET /api/sentiment/timeline")
    print("    GET /api/activity/timeline")
    print("    GET /api/alerts/breakdown")
    print("    GET /api/activity/hourly")
    print("\n  Health:")
    print("    GET /api/health")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)