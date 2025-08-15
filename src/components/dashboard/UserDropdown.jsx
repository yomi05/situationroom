'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function UserDropdown({ name = 'User', role = 'Guest' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const initials = (name || 'U').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 border rounded-full pl-2 pr-3 py-1"
      >
        <div className="w-7 h-7 rounded-full bg-[#245B9E] text-white flex items-center justify-center text-xs">
          {initials}
        </div>
        <span className="hidden md:block text-sm">{name}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-lg text-sm">
          <div className="px-3 py-2 border-b">
            <div className="font-medium">{name}</div>
            <div className="text-gray-500">{role}</div>
          </div>
          <Link href="/dashboard/profile" className="block px-3 py-2 hover:bg-gray-50">Profile</Link>
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-50"
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
