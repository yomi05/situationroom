import { getServerAuthSession } from '@/lib/auth/getServerAuthSession';
import { hasPerm, PERMS } from '@/lib/rbac';
import Link from 'next/link';

function Card({ href, title, emoji }) {
  return (
    <Link href={href} className="block bg-white border rounded-xl p-4 hover:bg-gray-50">
      <div className="text-2xl">{emoji}</div>
      <div className="font-semibold mt-1">{title}</div>
    </Link>
  );
}

export default async function Overview() {
  const session = await getServerAuthSession();
  const role = session?.user?.role || 'Guest';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm text-gray-500">Open Incidents</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm text-gray-500">Forms</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm text-gray-500">Users</div>
          <div className="text-2xl font-semibold">{role === 'Admin' ? '—' : '—'}</div>
        </div>
        <div className="p-4 bg-white border rounded-xl">
          <div className="text-sm text-gray-500">Assignments</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
      </div>

      {/* Quick actions based on role */}
      <section className="bg-white border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {hasPerm(role, PERMS.SUBMIT_INCIDENT) && <Card href="/dashboard/incident-report" title="Submit Incident" emoji="🚨" />}
          {hasPerm(role, PERMS.VIEW_INCIDENT_SUBMISSIONS) && <Card href="/dashboard/incident-report/submissions" title="Review Submissions" emoji="🗂️" />}
          {hasPerm(role, PERMS.VIEW_FORMS) && <Card href="/dashboard/forms" title="All Forms" emoji="🧾" />}
          {hasPerm(role, PERMS.CREATE_FORMS) && <Card href="/dashboard/forms/create" title="Create Form" emoji="➕" />}
          {hasPerm(role, PERMS.VIEW_REPOSITORY) && <Card href="/dashboard/repository" title="Repository" emoji="🗂️" />}
          {hasPerm(role, PERMS.VIEW_STATUS_INFORMATION) && <Card href="/dashboard/status/information" title="Status Information" emoji="📌" />}
          <Card href="/dashboard/profile" title="My Profile" emoji="👤" />
        </div>
      </section>

      <section className="bg-white border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Recent Activity</h3>
        <ul className="text-sm space-y-2 text-gray-600">
          <li>• Your dashboard is ready. Click any menu item to proceed.</li>
        </ul>
      </section>
    </div>
  );
}
