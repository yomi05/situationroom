'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';

function toISOInput(dDashMon) {
  // "1-Jan" -> "YYYY-01-01" (current year)
  if (!dDashMon) return '';
  const [day, mon] = String(dDashMon).split('-');
  const map = { Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06', Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12' };
  const month = map[mon] || '01';
  const year = new Date().getFullYear();
  const dd = String(day).padStart(2, '0');
  return `${year}-${month}-${dd}`;
}

export default function NotableDatesManagePage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'Guest';

  const canView = hasPerm(role, PERMS.VIEW_NOTABLE_DATES);
  const canManage = hasPerm(role, PERMS.MANAGE_NOTABLE_DATES);

  const [rows, setRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ _id: null, observation: '', dateISO: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/notable-dates', { cache: 'no-store', headers: { Accept: 'application/json' } });
      const text = await res.text();
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try { msg = JSON.parse(text)?.message || msg; } catch {}
        throw new Error(msg);
      }
      const j = text ? JSON.parse(text) : { data: [] };
      setRows(Array.isArray(j.data) ? j.data : []);
    } catch (e) {
      setErrorMsg(e?.message || 'Unable to load notable dates');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (canView) load(); }, [canView]);

  function startCreate() {
    setForm({ _id: null, observation: '', dateISO: '' });
    setOpen(true);
  }
  function startEdit(r) {
    setForm({ _id: r._id, observation: r.observation || '', dateISO: toISOInput(r.date || '') });
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    if (!canManage) return;
    setSaving(true);
    try {
      const payload = { observation: form.observation, date: form.dateISO }; // API converts ISO -> "d-MMM"
      const method = form._id ? 'PUT' : 'POST';
      const url = form._id ? `/api/notable-dates/${form._id}` : '/api/notable-dates';
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
      setSaving(false);
    }
  }

  async function del(id) {
    if (!canManage) return;
    if (!confirm('Delete this date?')) return;
    const res = await fetch(`/api/notable-dates/${id}`, { method: 'DELETE' });
    if (res.ok) await load(); else alert('Delete failed');
  }

  if (!canManage) {
    // If they can view but not manage, redirect them to the list page UX
    if (canView) {
      return (
        <div className="p-6 space-y-4">
          <div className="text-2xl font-semibold">403 — Not Authorized</div>
          <p className="text-gray-600">You don’t have permission to manage Notable Dates.</p>
          <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard/notable-dates">
            View Notable Dates
          </Link>
        </div>
      );
    }
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">403 — Not Authorized</div>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Notable Dates</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/notable-dates" className="rounded-xl border px-3 py-2 hover:bg-gray-50">View All</Link>
          <button onClick={startCreate} className="rounded-xl border px-3 py-2 hover:bg-gray-50">Add New</button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Observation</th>
              <th className="p-3 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="p-6 text-center">Loading…</td></tr>
            ) : rows.length ? rows.map((r) => (
              <tr key={r._id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{r.date}</td>
                <td className="p-3">{r.observation}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="rounded-lg border px-3 py-1 hover:bg-gray-50" onClick={() => startEdit(r)}>Edit</button>
                    <button className="rounded-lg border px-3 py-1 hover:bg-red-50" onClick={() => del(r._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={3} className="p-6 text-center text-gray-500">No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer / Modal */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <form onSubmit={save} className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{form._id ? 'Edit Date' : 'New Date'}</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-1">Close</button>
            </div>

            <label className="block text-sm text-gray-600">Date</label>
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2"
              value={form.dateISO}
              onChange={(e)=>setForm(f=>({...f, dateISO: e.target.value}))}
              required
            />

            <label className="block text-sm text-gray-600">Observation</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.observation}
              onChange={(e)=>setForm(f=>({...f, observation: e.target.value}))}
              placeholder="e.g., International Women’s Day"
              required
            />

            <button disabled={saving} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
              {form._id ? 'Update' : 'Create'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
