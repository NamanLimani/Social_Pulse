import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Configuration
const WINDOW_MINUTES = 360;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'hashtags' or 'entities'
  
  try {
    const client = await clientPromise;
    const db = client.db("bigdata");

    // 1. Common Setup (Run for BOTH types)
    const thirtyMinsAgo = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
    
    // Determine target collection and field
    const collectionName = type === 'entities' ? 'entities' : 'hashtags';
    const arrayField = type === 'entities' ? '$entities' : '$hashtags';
    
    // 2. Build Pipeline
    const pipeline: any[] = [
      // Filter by Time
      {
        $match: {
          created_at: { $gte: thirtyMinsAgo },
        }
      },
      // Unwind the array
      { $unwind: arrayField },
    ];

    // 3. Conditional Logic
    if (type === 'entities') {
      // Entities logic
      pipeline.push({
         $match: {
            "entities.label": { $in: ["PERSON", "ORG", "GPE", "EVENT", "PRODUCT", "WORK_OF_ART"] }
         }
      });
      pipeline.push({
        $group: { _id: "$entities.text", count: { $sum: 1 } }
      });
    } else {
      // Hashtags logic
      pipeline.push({
        $group: { _id: arrayField, count: { $sum: 1 } }
      });
    }

    // 4. Sort & Limit (Common)
    pipeline.push({ $sort: { count: -1 } });
    pipeline.push({ $limit: 10 });

    // 5. Execute & Return
    const results = await db.collection(collectionName).aggregate(pipeline).toArray();

    const leaderboard = results.map(r => ({
      entity: r._id,
      mentions: r.count
    }));

    return NextResponse.json(leaderboard);

  } catch (e) {
    console.error("Aggregation Error:", e);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}