'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';

export default function StatusInformationPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'Guest';
  const canView = hasPerm(role, PERMS.VIEW_STATUS_INFORMATION);
  const canManage = hasPerm(role, PERMS.MANAGE_STATUS_INFORMATION);

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  async function load() {
    const res = await fetch('/api/status/information', { cache: 'no-store' });
    const j = await res.json();
    setRows(Array.isArray(j.data) ? j.data : []);
  }

  useEffect(() => { if (canView) load(); }, [canView]);

  const categories = useMemo(() => Array.from(new Set(rows.map(r => r.category).filter(Boolean))).sort(), [rows]);
  const states = useMemo(() => Array.from(new Set(rows.map(r => r.state).filter(Boolean))).sort(), [rows]);

  const filtered = useMemo(() => {
    const qq = q.toLowerCase().trim();
    return rows.filter(r =>
      (!category || r.category === category) &&
      (!stateFilter || r.state === stateFilter) &&
      (!qq || (r.title || '').toLowerCase().includes(qq) || (r.information || '').toLowerCase().includes(qq))
    );
  }, [rows, q, category, stateFilter]);

  if (!canView) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">403 — Not Authorized</div>
        <p className="text-gray-600">You don’t have permission to view Status Information.</p>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Status Information</h1>
        {canManage && (
          <Link href="/dashboard/status/information/manage" className="rounded-xl border px-3 py-2 hover:bg-gray-50">Manage Information</Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="rounded-xl border px-3 py-2" placeholder="Search title/info…" value={q} onChange={(e)=>setQ(e.target.value)} />
        <select className="rounded-xl border px-3 py-2" value={category} onChange={(e)=>setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="rounded-xl border px-3 py-2" value={stateFilter} onChange={(e)=>setStateFilter(e.target.value)}>
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="rounded-xl border px-3 py-2" onClick={()=>{ setQ(''); setCategory(''); setStateFilter(''); }}>Clear</button>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Category</th>
              <th className="p-3">Title</th>
              <th className="p-3">State</th>
              <th className="p-3">Color</th>
              <th className="p-3">Image</th>
              <th className="p-3">Information</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map(r => (
              <tr key={r._id} className="border-t align-top">
                <td className="p-3">{r.category}</td>
                <td className="p-3 font-medium">{r.title}</td>
                <td className="p-3">{r.state || '—'}</td>
                <td className="p-3">
                  <span className="inline-block w-4 h-4 rounded" style={{ background: r.color || '#999' }} />
                </td>
                <td className="p-3">
                  {r.image?.url ? <img src={r.image.url} alt={r.title} className="w-16 h-16 object-cover rounded" /> : '—'}
                </td>
                <td className="p-3 max-w-xl">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{r.information || '—'}</div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
