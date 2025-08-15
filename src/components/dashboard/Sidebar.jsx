'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getMenuForRole } from '@/lib/rbac';
import { signOut } from 'next-auth/react';
import { useMemo, useState } from 'react';

function Item({ item, level = 0, openMap, setOpenMap, collapsed }) {
  const pathname = usePathname();
  const isActive = item.href && (pathname === item.href || pathname.startsWith(item.href + '/'));

  if (item.children) {
    const key = item.label;
    const isOpen = !!openMap[key];
    return (
      <div>
        <button
          onClick={() => setOpenMap(m => ({ ...m, [key]: !m[key] }))}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
            isActive ? 'bg-gray-100 text-[#245B9E] font-medium' : 'text-gray-700'
          }`}
          style={{ paddingLeft: 12 + level * 12 }}
        >
          <span className="w-6 text-center">{item.icon || '▸'}</span>
          {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
          {!collapsed && <span className="text-xs opacity-60">{isOpen ? '–' : '+'}</span>}
        </button>
        {isOpen && !collapsed && (
          <div className="ml-2">
            {item.children.map((c) => (
              <Item
                key={(c.href || c.label)}
                item={c}
                level={level + 1}
                openMap={openMap}
                setOpenMap={setOpenMap}
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
        isActive ? 'bg-gray-100 text-[#245B9E] font-medium' : 'text-gray-700'
      }`}
      style={{ paddingLeft: 12 + level * 12 }}
    >
      <span className="w-6 text-center">{item.icon || '•'}</span>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function Sidebar({ role = 'Guest' }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openMap, setOpenMap] = useState({ Resources: true, Status: true, 'Election Repository': true });
  const menu = useMemo(() => getMenuForRole(role), [role]);

  return (
    <aside className={`border-r bg-white ${collapsed ? 'w-16' : 'w-72'} transition-all duration-200 h-screen sticky top-0`}>
      {/* Brand row */}
      <div className="flex items-center justify-between p-3">
        <Link href="/dashboard" className="flex items-center">
          {!collapsed ? (
            // Bigger logo only (no text). Adjust h-10 to h-12 if you want even larger.
            <Image
              src="/logo.png"         // swap to /logo.svg if you have an SVG
              alt="SituationRoom"
              width={160}
              height={48}
              className="h-10 w-auto"
              priority
            />
          ) : (
            <span className="font-bold tracking-wide text-[#245B9E]" aria-label="SituationRoom">
              SR
            </span>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(s => !s)}
          className="text-sm opacity-70 hover:opacity-100"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '⟩⟩' : '⟨⟨'}
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-2">
        {menu.map((it) => (
          <Item
            key={(it.href || it.label)}
            item={it}
            level={0}
            openMap={openMap}
            setOpenMap={setOpenMap}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Footer actions */}
      <div className="mt-auto p-3">
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="w-full text-left text-sm px-3 py-2 hover:bg-gray-100 rounded"
        >
          {collapsed ? '🔓' : '🔓 Logout'}
        </button>
      </div>
    </aside>
  );
}
