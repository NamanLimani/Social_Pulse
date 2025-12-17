// app/api/stream/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bigdata");
    const now = new Date(Date.now()).toISOString();

    // "toxicity" is the final stage, containing all enriched fields
    const posts = await db.collection("toxicity")
      .find({created_at: {$lte: now }})
      .sort({ created_at: -1 }) // Newest first
      .limit(50)
      .toArray();

    return NextResponse.json(posts);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch stream' }, { status: 500 });
  }
}