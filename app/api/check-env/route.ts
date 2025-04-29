import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 10;

export async function GET(request: NextRequest) {
  // Sanitize environment variables to avoid exposing secrets
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? "set" : "not set",
    FIREBASE_CONFIG: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "set" : "not set",
    BUILD_ENV: process.env.VERCEL_ENV || "local",
    TIME: new Date().toISOString()
  };
  
  return NextResponse.json(envStatus);
} 