// app/api/trends/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bigdata");

    // Fetch the single most recent trend snapshot
    const trend = await db.collection("trend_aggregates")
      .find({})
      .sort({ bucket_ts: -1 }) // Sort by timestamp descending
      .limit(1)
      .toArray();

    // Return the leaderboard array directly, or empty list
    return NextResponse.json(trend[0]?.leaderboard || []);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}