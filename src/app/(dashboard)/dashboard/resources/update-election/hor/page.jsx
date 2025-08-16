'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';

const emptyForm = {
  _id: null,
  state: '',
  constituency: '',
  year: '',
  party: '',
  candidate: '',
  votes: '',
};

export default function ManageHorPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'Guest';
  const canManage = hasPerm(role, PERMS.UPDATE_PAST_ELECTIONS);

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setMsg(null); setErr(null);
    try {
      const res = await fetch('/api/past-elections/hor', { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || 'Failed to load');
      setRows(Array.isArray(j.data) ? j.data : []);
    } catch (e) {
      setErr(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (canManage) load(); }, [canManage]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r =>
      [r.candidate, r.party, r.state, r.constituency, r.year]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  function startCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }
  function startEdit(r) {
    setForm({
      _id: r._id,
      state: r.state || '',
      constituency: r.constituency || '',
      year: String(r.year || ''),
      party: r.party || '',
      candidate: r.candidate || '',
      votes: String(r.votes ?? ''),
    });
    setModalOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setMsg(null); setErr(null);
    try {
      const payload = {
        state: form.state,
        constituency: form.constituency,
        year: Number(form.year),
        party: form.party,
        candidate: form.candidate,
        votes: form.votes,
      };
      const method = form._id ? 'PUT' : 'POST';
      const url = form._id
        ? `/api/past-elections/hor/${form._id}`
        : '/api/past-elections/hor';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(j?.message || 'Save failed');

      setMsg(form._id ? 'Updated' : 'Created');
      setModalOpen(false);
      await load();
    } catch (e) {
      setErr(e?.message || 'Save failed');
    }
  }

  async function del(id) {
    if (!confirm('Delete this record?')) return;
    setMsg(null); setErr(null);
    try {
      const res = await fetch(`/api/past-elections/hor/${id}`, { method: 'DELETE' });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(j?.message || 'Delete failed');
      setMsg('Deleted');
      await load();
    } catch (e) {
      setErr(e?.message || 'Delete failed');
    }
  }

  async function onCsvPicked(file) {
    if (!file) return;
    try {
      const { parse } = await import('papaparse');
      const text = await file.text();
      const { data } = parse(text, { header: true, skipEmptyLines: true });

      const docs = data
        .map(r => ({
          state: r.state,
          constituency: r.constituency,
          year: Number(r.year),
          party: r.party,
          candidate: r.candidate,
          votes: r.votes,
        }))
        .filter(d => d.state && d.constituency && d.year && d.party && d.candidate);

      if (!docs.length) throw new Error('CSV has no valid rows');

      const res = await fetch('/api/past-elections/hor/mass-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: docs }),
      });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(j?.message || 'Upload failed');

      setMsg(`Uploaded ${docs.length} rows`);
      await load();
    } catch (e) {
      setErr(e?.message || 'CSV parse/upload failed');
    }
  }

  if (!canManage) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">403 — Not Authorized</div>
        <p className="text-gray-600">You don’t have permission to manage Past Elections.</p>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage — House of Representatives</h1>
        <div className="flex gap-2">
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="Search candidate, party, state, constituency, year…"
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          <button onClick={startCreate} className="rounded-xl border px-3 py-2 hover:bg-gray-50">Add</button>
          <label className="rounded-xl border px-3 py-2 hover:bg-gray-50 cursor-pointer">
            Upload CSV
            <input type="file" accept=".csv" className="hidden" onChange={e=>onCsvPicked(e.target.files?.[0])} />
          </label>
        </div>
      </div>

      {msg && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{msg}</div>}
      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Candidate</th>
              <th className="p-3">Votes</th>
              <th className="p-3">Party</th>
              <th className="p-3">Year</th>
              <th className="p-3">Constituency</th>
              <th className="p-3">State</th>
              <th className="p-3 w-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center">Loading…</td></tr>
            ) : filtered.length ? filtered.map(r => (
              <tr key={r._id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{r.candidate}</td>
                <td className="p-3">{String(r.votes ?? '').toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}</td>
                <td className="p-3">{r.party}</td>
                <td className="p-3">{r.year}</td>
                <td className="p-3">{r.constituency}</td>
                <td className="p-3">{r.state}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="rounded-lg border px-3 py-1 hover:bg-gray-50" onClick={() => startEdit(r)}>Edit</button>
                    <button className="rounded-lg border px-3 py-1 hover:bg-red-50" onClick={() => del(r._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setModalOpen(false)} />
          <form onSubmit={save} className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{form._id ? 'Edit Record' : 'New Record'}</h2>
              <button type="button" onClick={()=>setModalOpen(false)} className="rounded-lg border px-3 py-1">Close</button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <input className="rounded-xl border px-3 py-2" placeholder="State" value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))} required />
              <input className="rounded-xl border px-3 py-2" placeholder="Constituency" value={form.constituency} onChange={e=>setForm(f=>({...f,constituency:e.target.value}))} required />
              <input className="rounded-xl border px-3 py-2" placeholder="Year" type="number" value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} required />
              <input className="rounded-xl border px-3 py-2" placeholder="Party" value={form.party} onChange={e=>setForm(f=>({...f,party:e.target.value}))} required />
              <input className="rounded-xl border px-3 py-2" placeholder="Candidate" value={form.candidate} onChange={e=>setForm(f=>({...f,candidate:e.target.value}))} required />
              <input className="rounded-xl border px-3 py-2" placeholder="Votes (e.g. 1,234,567)" value={form.votes} onChange={e=>setForm(f=>({...f,votes:e.target.value}))} />
            </div>

            <button className="rounded-xl border px-4 py-2 hover:bg-gray-50">{form._id ? 'Update' : 'Create'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
