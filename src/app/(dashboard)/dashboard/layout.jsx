import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth/getServerAuthSession';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';

export const metadata = { title: 'Dashboard' };

export default async function DashboardLayout({ children }) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect('/auth/login');

  const role = session.user.role || 'Guest';
  const name = session.user.name || 'User';

  return (
    <div className="min-h-screen grid grid-cols-[auto_1fr]">
      <Sidebar role={role} />
      <div className="flex flex-col">
        <Topbar name={name} role={role} />
        <main className="p-4 bg-gray-50 flex-1">{children}</main>
      </div>
    </div>
  );
}
