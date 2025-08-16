import { okJson, noContent } from '@/lib/cors';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signAccessToken } from '@/lib/jwt';

export async function OPTIONS() { return noContent(); }

export async function POST(req) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, password, gender, disability, state } = body || {};
    if (!firstName || !lastName || !email || !phone || !password) {
      return okJson({ message: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    const exists = await User.findOne({ email: email.toLowerCase() }).lean();
    if (exists) return okJson({ message: 'User already exists' }, { status: 409 });

    const user = await User.create({ firstName, lastName, email: email.toLowerCase(), phone, password, gender, disability, state, role: 'Reporters' });
    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role, email: user.email });
    return okJson({ accessToken, user: user.toJSON() }, { status: 201 });
  } catch {
    return okJson({ message: 'Registration failed' }, { status: 500 });
  }
}
