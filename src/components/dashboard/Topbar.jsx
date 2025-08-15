'use client';

import UserDropdown from './UserDropdown';

export default function Topbar({ name = 'User', role = 'Guest' }) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b h-14">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="font-medium">
          Dashboard <span className="text-sm text-gray-500">• {role}</span>
        </div>
        <div className="flex items-center gap-3">
          <input className="hidden md:block border rounded px-3 py-1 text-sm" placeholder="Search…" />
          <UserDropdown name={name} role={role} />
        </div>
      </div>
    </header>
  );
}
