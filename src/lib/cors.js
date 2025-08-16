import { NextResponse } from 'next/server';

const ALLOW_ORIGIN = process.env.MOBILE_CORS_ORIGIN || '*';
// ^ in prod, set to your Expo dev tunnel or your deployed app’s origin

export function withCors(res) {
  res.headers.set('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  return res;
}

export function okJson(body, init = {}) {
  return withCors(new NextResponse(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) }
  }));
}

export function noContent() {
  return withCors(new NextResponse(null, { status: 204 }));
}
