'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';

export default function StatusCategoryPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'Guest';
  const canView = hasPerm(role, PERMS.VIEW_STATUS_CATEGORY);
  const canManage = hasPerm(role, PERMS.MANAGE_STATUS_INFORMATION);

  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ _id: null, title: '', description: '', color: '#999999' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  async function load() {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/status/categories', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try { msg = JSON.parse(text)?.message || msg; } catch {}
        throw new Error(msg);
      }
      const j = text ? JSON.parse(text) : { data: [] };
      setRows(Array.isArray(j.data) ? j.data : []);
    } catch (e) {
      console.error('Load categories error:', e);
      setRows([]);
      setErrorMsg(e?.message || 'Unable to load categories');
    }
  }

  useEffect(() => { if (canView) load(); }, [canView]);

  function startCreate() {
    setForm({ _id: null, title: '', description: '', color: '#999999' });
    setOpen(true);
  }
  function startEdit(row) {
    setForm({
      _id: row._id,
      title: row.title || '',
      description: row.description || '',
      color: row.color || '#999999',
    });
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    if (!canManage) return;
    setLoading(true);
    try {
      const payload = { title: form.title, description: form.description, color: form.color };
      const method = form._id ? 'PUT' : 'POST';
      const url = form._id ? `/api/status/categories/${form._id}` : '/api/status/categories';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = `Save failed (${res.status})`;
        try { msg = JSON.parse(text)?.message || msg; } catch {}
        throw new Error(msg);
      }
      setOpen(false);
      await load();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  async function del(id) {
    if (!canManage) return;
    if (!confirm('Delete this category?')) return;
    const res = await fetch(`/api/status/categories/${id}`, { method: 'DELETE' });
    if (res.ok) await load(); else alert('Delete failed');
  }

  if (!canView) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">403 — Not Authorized</div>
        <p className="text-gray-600">You don’t have permission to view Status Categories.</p>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Status Categories</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/status/information" className="rounded-xl border px-3 py-2 hover:bg-gray-50">View Information</Link>
          {canManage && (
            <button onClick={startCreate} className="rounded-xl border px-3 py-2 hover:bg-gray-50">
              Add Category
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rows.map((r) => (
          <div key={r._id} className="border rounded-2xl p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.title}</div>
              <span className="inline-block w-4 h-4 rounded" style={{ background: r.color || '#999' }} />
            </div>
            <p className="text-sm text-gray-600 mt-1">{r.description || '—'}</p>
            {canManage && (
              <div className="mt-3 flex gap-2">
                <button className="rounded-lg border px-3 py-1 hover:bg-gray-50" onClick={() => startEdit(r)}>Edit</button>
                <button className="rounded-lg border px-3 py-1 hover:bg-red-50" onClick={() => del(r._id)}>Delete</button>
              </div>
            )}
          </div>
        ))}
        {!rows.length && !errorMsg && (
          <div className="text-gray-500">No categories.</div>
        )}
      </div>

      {/* Drawer / Modal */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <form onSubmit={save} className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{form._id ? 'Edit Category' : 'New Category'}</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-1">Close</button>
            </div>
            <input className="w-full rounded-xl border px-3 py-2" placeholder="Title" value={form.title} onChange={(e)=>setForm(f=>({...f,title:e.target.value}))} required />
            <textarea className="w-full rounded-xl border px-3 py-2 h-28" placeholder="Description" value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))} />
            <div>
              <label className="block text-sm text-gray-600 mb-1">Color</label>
              <input type="color" value={form.color} onChange={(e)=>setForm(f=>({...f,color:e.target.value}))} />
            </div>
            <button disabled={loading} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
              {form._id ? 'Update' : 'Create'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
