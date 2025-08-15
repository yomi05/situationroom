import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { redirect } from 'next/navigation';

export async function requireRoles(roles = []) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  const role = session.user.role || 'Guest';
  if (roles.length && !roles.includes(role)) redirect('/dashboard'); // or a 403 page
  return session;
}
