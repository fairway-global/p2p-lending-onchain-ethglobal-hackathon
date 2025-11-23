import { getFarcasterManifest } from "@/lib/warpcast";
import { NextResponse } from "next/server";

// Mark as dynamic to prevent static generation issues
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const manifest = await getFarcasterManifest();
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error("Error generating manifest:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
