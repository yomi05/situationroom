import { okJson, noContent } from '@/lib/cors';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { verifyAccessToken } from '@/lib/jwt';

export async function OPTIONS() { return noContent(); }

export async function GET(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const parsed = token ? verifyAccessToken(token) : null;
  if (!parsed) return okJson({ message: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const user = await User.findById(parsed.sub).lean();
  if (!user) return okJson({ message: 'Unauthorized' }, { status: 401 });

  return okJson({ user });
}
