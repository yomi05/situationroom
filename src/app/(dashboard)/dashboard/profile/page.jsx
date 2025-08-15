import Link from 'next/link';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerAuthSession } from '@/lib/auth/getServerAuthSession';
import { redirect } from 'next/navigation';

export const metadata = { title: 'My Profile' };

export default async function ProfilePage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect('/auth/login');

  await dbConnect();
  const user = await User.findById(session.user.id)
    .select('_id firstName lastName email phone gender disability state role emailVerified createdAt updatedAt')
    .lean();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Profile</h1>
        <Link href="/dashboard/profile/edit" className="px-3 py-2 text-sm bg-[#245B9E] text-white rounded">
          Edit profile
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Name</div>
          <div className="font-medium">{user.firstName} {user.lastName}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Email</div>
          <div className="font-medium">{user.email}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Phone</div>
          <div className="font-medium">{user.phone}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Gender</div>
          <div className="font-medium">{user.gender || '—'}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">State</div>
          <div className="font-medium">{user.state || '—'}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Disability</div>
          <div className="font-medium">{user.disability ? 'Yes' : 'No'}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Role</div>
          <div className="font-medium">{user.role}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Email Verified</div>
          <div className="font-medium">{user.emailVerified ? new Date(user.emailVerified).toLocaleString() : 'Not verified'}</div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <div className="text-sm text-gray-500">Security</div>
        <div className="mt-2">
          <Link href="/auth/forgot-password" className="text-[#245B9E] underline">
            Reset password
          </Link>
        </div>
      </div>
    </div>
  );
}
