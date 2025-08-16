import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signAccessToken } from '@/lib/jwt';
import { withCors, okJson, noContent } from '@/lib/cors';

export async function OPTIONS() { return noContent(); }

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password) return okJson({ message: 'email and password required' }, { status: 400 });

    await dbConnect();
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password role email firstName lastName');
    if (!user || !(await user.matchPassword(password))) {
      return okJson({ message: 'Invalid credentials' }, { status: 401 });
    }

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role, email: user.email });
    return okJson({ accessToken, user: user.toJSON() });
  } catch {
    return okJson({ message: 'Login failed' }, { status: 500 });
  }
}
