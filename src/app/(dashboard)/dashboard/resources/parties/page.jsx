'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';
import PartyForm from './PartyForm';

function FileThumb({ url, alt }) {
  if (!url) return <div className="h-12 w-12 rounded-md bg-gray-200" />;
  const lower = url.toLowerCase();
  const isImage = /\.(png|jpg|jpeg|webp|gif|svg)$/.test(lower);
  if (isImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt || 'file'} className="h-12 w-12 object-cover rounded-md border" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs hover:bg-gray-50"
      title={alt || 'file'}
    >
      📎 Open
    </a>
  );
}

export default function PartiesPage() {
  const { data: session, status } = useSession();
  const role = session?.user?.role || 'Guest';

  const canView = hasPerm(role, PERMS.VIEW_PARTIES);
  const canUpdate = hasPerm(role, PERMS.UPDATE_PARTIES);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/parties', { cache: 'no-store' });
      const j = await res.json();
      setItems(Array.isArray(j.data) ? j.data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && canView) load();
  }, [status, canView]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i =>
      (i.pp_name || '').toLowerCase().includes(q) ||
      (i.pp_acronym || '').toLowerCase().includes(q) ||
      (i.pp_founded || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  function onCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function onEdit(item) {
    setEditing(item);
    setDrawerOpen(true);
  }

  async function onDelete(id) {
    if (!canUpdate) return;
    if (!confirm('Delete this party?')) return;
    const res = await fetch(`/api/parties/${id}`, { method: 'DELETE' });
    if (res.ok) await load();
    else {
      const j = await res.json().catch(() => ({}));
      alert(j?.message || 'Delete failed');
    }
  }

  if (status === 'loading') {
    return <div className="p-6">Loading session…</div>;
  }
  if (!canView) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">403 — Not Authorized</div>
        <p className="text-gray-600">You don’t have permission to view Political Parties.</p>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Political Parties</h1>
        {canUpdate && (
          <button
            onClick={onCreate}
            className="rounded-xl px-4 py-2 border hover:bg-gray-50"
          >
            + Add Party
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <input
          placeholder="Search by name, acronym, year..."
          className="w-full rounded-xl border px-3 py-2"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button onClick={load} className="rounded-xl px-4 py-2 border hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="w-full flex items-center justify-center py-16">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">Logo / File</th>
                <th className="p-3">Name</th>
                <th className="p-3">Acronym</th>
                <th className="p-3">Founded</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <FileThumb url={it.pp_image} alt={it.pp_name} />
                  </td>
                  <td className="p-3 font-medium">{it.pp_name}</td>
                  <td className="p-3">{it.pp_acronym}</td>
                  <td className="p-3">{it.pp_founded}</td>
                  <td className="p-3 space-x-2">
                    {canUpdate ? (
                      <>
                        <button
                          onClick={() => onEdit(it)}
                          className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(it._id)}
                          className="rounded-lg border px-3 py-1 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">Read-only</span>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">No parties found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {drawerOpen && canUpdate && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Party' : 'Add Party'}</h2>
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg border px-3 py-1">Close</button>
            </div>
            <div className="p-4">
              <PartyForm
                initial={editing}
                onDone={async () => {
                  setDrawerOpen(false);
                  await load();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
