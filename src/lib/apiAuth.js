// situationroom/src/lib/apiAuth.js
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

// tiny helper
const looksLikeObjectId = (s) => /^[0-9a-fA-F]{24}$/.test(String(s || ''));

export async function requireApiUser() {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }

  // Try to resolve DB user by id (if present) or email
  let dbUser = null;

  if (session.user.id && looksLikeObjectId(session.user.id)) {
    dbUser = await User.findById(session.user.id).select('_id role email').lean();
  }
  if (!dbUser && session.user.email) {
    dbUser = await User.findOne({ email: session.user.email }).select('_id role email').lean();
  }

  if (!dbUser) {
    const err = new Error('User record not found');
    err.statusCode = 401;
    throw err;
  }

  // Return a normalized object (what your API needs)
  return { _id: dbUser._id, role: dbUser.role, email: dbUser.email };
}
