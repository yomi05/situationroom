'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';

export default function ManageStatusInformation() {
  const { data: session, status } = useSession();
  const role = session?.user?.role || 'Guest';
  const canView = hasPerm(role, PERMS.VIEW_STATUS_INFORMATION);
  const canManage = hasPerm(role, PERMS.MANAGE_STATUS_INFORMATION);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [drawer, setDrawer] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    _id: null,
    title: '',
    category: '',
    state: '',
    information: '',
    color: '#999999'
  });

  async function load() {
    setLoading(true);
    const res = await fetch('/api/status/information', { cache: 'no-store' });
    const j = await res.json();
    setRows(Array.isArray(j.data) ? j.data : []);
    setLoading(false);
  }

  useEffect(() => { if (status === 'authenticated' && canView) load(); }, [status, canView]);

  const categories = useMemo(() => Array.from(new Set(rows.map(r => r.category).filter(Boolean))).sort(), [rows]);

  function startCreate() {
    setForm({ _id: null, title: '', category: '', state: '', information: '', color: '#999999' });
    setFile(null);
    setDrawer(true);
  }
  function startEdit(r) {
    setForm({
      _id: r._id,
      title: r.title || '',
      category: r.category || '',
      state: r.state || '',
      information: r.information || '',
      color: r.color || '#999999'
    });
    setFile(null);
    setDrawer(true);
  }

  async function save(e) {
    e.preventDefault();
    if (!canManage) return;
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('category', form.category);
    fd.append('state', form.state);
    fd.append('information', form.information);
    fd.append('color', form.color);
    if (file) fd.append('image', file);

    const method = form._id ? 'PUT' : 'POST';
    const url = form._id ? `/api/status/information/${form._id}` : '/api/status/information';

    const res = await fetch(url, { method, body: fd });
    if (res.ok) { setDrawer(false); await load(); }
    else { const j = await res.json().catch(()=>({})); alert(j?.message || 'Save failed'); }
  }

  async function del(id) {
    if (!canManage) return;
    if (!confirm('Delete this info?')) return;
    const res = await fetch(`/api/status/information/${id}`, { method: 'DELETE' });
    if (res.ok) await load(); else alert('Delete failed');
  }

  if (status === 'loading') return <div className="p-6">Loading…</div>;

  if (!canView) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">403 — Not Authorized</div>
        <p className="text-gray-600">You don’t have permission to view Status Information.</p>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">Status Information (Read-only)</div>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard/status/information">Back</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Status Information</h1>
        <div className="flex gap-2">
          <button onClick={startCreate} className="rounded-xl border px-3 py-2 hover:bg-gray-50">Add New</button>
          <Link href="/dashboard/status/information" className="rounded-xl border px-3 py-2 hover:bg-gray-50">View</Link>
        </div>
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
              <th className="p-3">Updated</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center">Loading…</td></tr>
            ) : rows.length ? rows.map(r => (
              <tr key={r._id} className="border-t">
                <td className="p-3">{r.category}</td>
                <td className="p-3 font-medium">{r.title}</td>
                <td className="p-3">{r.state || '—'}</td>
                <td className="p-3"><span className="inline-block w-4 h-4 rounded" style={{ background: r.color || '#999' }} /></td>
                <td className="p-3">{r.image?.url ? <img src={r.image.url} alt={r.title} className="w-16 h-16 object-cover rounded" /> : '—'}</td>
                <td className="p-3 text-sm text-gray-600">{new Date(r.updatedAt || r.createdAt).toLocaleString()}</td>
                <td className="p-3 space-x-2">
                  <button className="rounded-lg border px-3 py-1 hover:bg-gray-50" onClick={()=>startEdit(r)}>Edit</button>
                  <button className="rounded-lg border px-3 py-1 hover:bg-red-50" onClick={()=>del(r._id)}>Delete</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDrawer(false)} />
          <form onSubmit={save} className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{form._id ? 'Edit Info' : 'New Info'}</h2>
              <button type="button" onClick={()=>setDrawer(false)} className="rounded-lg border px-3 py-1">Close</button>
            </div>

            <input className="w-full rounded-xl border px-3 py-2" placeholder="Title" value={form.title} onChange={(e)=>setForm(f=>({...f,title:e.target.value}))} required />
            <input className="w-full rounded-xl border px-3 py-2" placeholder="Category" list="category-list" value={form.category} onChange={(e)=>setForm(f=>({...f,category:e.target.value}))} required />
            <datalist id="category-list">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
            <input className="w-full rounded-xl border px-3 py-2" placeholder="State (optional)" value={form.state} onChange={(e)=>setForm(f=>({...f,state:e.target.value}))} />
            <textarea className="w-full rounded-xl border px-3 py-2 h-40" placeholder="Information" value={form.information} onChange={(e)=>setForm(f=>({...f,information:e.target.value}))} />
            <div>
              <label className="block text-sm text-gray-600 mb-1">Color</label>
              <input type="color" value={form.color} onChange={(e)=>setForm(f=>({...f,color:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Image (optional)</label>
              <input type="file" accept="image/*,application/pdf,video/*" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
            </div>
            <button className="rounded-xl border px-4 py-2 hover:bg-gray-50">{form._id ? 'Update' : 'Create'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
