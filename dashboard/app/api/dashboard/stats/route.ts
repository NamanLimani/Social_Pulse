import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bigdata");

    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const [
      totalPosts,
      topicsCountLast24h,
      alertCount,
      recentPostCount
    ] = await Promise.all([
      db.collection("language").estimatedDocumentCount(),

      db.collection("topics").countDocuments({
        created_at: { $gte: oneDayAgo, $lte: now }
      }),

      db.collection("toxicity").countDocuments({
        created_at: { $gte: tenMinsAgo, $lte: now },
        $or: [
          { toxic: true },
          { is_rumor: true },
          { topic_anomaly: true }
        ]
      }),

      db.collection("language").countDocuments({
        created_at: { $gte: tenMinsAgo, $lte: now }
      })
    ]);

    const [
      rumorPosts,
      toxicPosts,
      anomalyCount,
      topicCount,
      entityCount,
      summaryCount
    ] = await Promise.all([
      db.collection("rumor").countDocuments({ rumor_score: { $gt: 0.5 } }),
      db.collection("toxicity").countDocuments({ toxicity_score: { $gt: 0.5 } }),
      db.collection("anomalies").estimatedDocumentCount(),
      db.collection("topics").estimatedDocumentCount(),
      db.collection("entities").estimatedDocumentCount(),
      db.collection("summaries").estimatedDocumentCount()
    ]);

    return NextResponse.json({
      totalPosts,
      postsPerMin: Math.round(recentPostCount / 10),
      activeTopics: topicsCountLast24h,
      alertCount,
      rumorPosts,
      toxicPosts,
      anomalyCount,
      topicCount,
      entityCount,
      summaryCount
    });

  } catch (e) {
    console.error("Stats API Error:", e);
    return NextResponse.json({ error: 'Stats failed' }, { status: 500 });
  }
}
