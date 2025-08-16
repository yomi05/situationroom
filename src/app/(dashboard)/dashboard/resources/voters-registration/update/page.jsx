'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';

function toNum(v) {
  if (typeof v === 'number') return v;
  return Number(String(v ?? '0').replace(/,/g, '')) || 0;
}

export default function ManageVotersRegistration() {
  const { data: session, status } = useSession();
  const role = session?.user?.role || 'Guest';

  const canView = hasPerm(role, PERMS.VIEW_VOTERS_REGISTRATION);
  const canUpdate = hasPerm(role, PERMS.UPDATE_VOTERS_REGISTRATION);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ state: '', male: '', female: '', total: '', year: '' });
  const [query, setQuery] = useState('');
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [selected, setSelected] = useState(new Set());

  async function load() {
    setLoading(true);
    const res = await fetch('/api/voters', { cache: 'no-store' });
    const j = await res.json();
    setRows(Array.isArray(j.data) ? j.data : []);
    setLoading(false);
  }

  useEffect(() => { if (status === 'authenticated' && canView) load(); }, [status, canView]);

  function startCreate() {
    setEditing(null);
    setForm({ state: '', male: '', female: '', total: '', year: '' });
  }
  function startEdit(row) {
    setEditing(row);
    setForm({
      state: row.state || '',
      male: String(row.male ?? ''),
      female: String(row.female ?? ''),
      total: String(row.total ?? ''),
      year: String(row.year ?? ''),
    });
  }

  async function save(e) {
    e.preventDefault();
    if (!canUpdate) return;
    const payload = { ...form };
    const method = editing?._id ? 'PUT' : 'POST';
    const url = editing?._id ? `/api/voters/${editing._id}` : '/api/voters';
    const res = await fetch(url, { method, body: JSON.stringify(payload) });
    if (res.ok) {
      await load();
      startCreate();
    } else {
      const j = await res.json().catch(()=> ({}));
      alert(j?.message || 'Save failed');
    }
  }

  async function del(id) {
    if (!canUpdate) return;
    if (!confirm('Delete this record?')) return;
    const res = await fetch(`/api/voters/${id}`, { method: 'DELETE' });
    if (res.ok) await load();
    else {
      const j = await res.json().catch(()=> ({}));
      alert(j?.message || 'Delete failed');
    }
  }

  async function massDelete() {
    if (!canUpdate) return;
    const ids = Array.from(selected);
    if (!ids.length) return alert('Select at least one row');
    if (!confirm(`Delete ${ids.length} rows?`)) return;
    const res = await fetch('/api/voters/mass-delete', { method: 'DELETE', body: JSON.stringify({ ids }) });
    if (res.ok) { setSelected(new Set()); await load(); }
    else { const j = await res.json().catch(()=> ({})); alert(j?.message || 'Mass delete failed'); }
  }

  async function handleCsvSubmit(e) {
    e.preventDefault();
    if (!csvFile) return;
    const Papa = (await import('papaparse')).default; // lazy load
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const voter_registrations = results.data.map(r => ({
          state:  (r.state ?? r.State ?? '').toString().trim(),
          male:   r.male ?? r.Male,
          female: r.female ?? r.Female,
          total:  r.total ?? r.Total,
          year:   r.year ?? r.Year
        })).filter(r => r.state && r.year);
        const res = await fetch('/api/voters/mass-upload', {
          method: 'POST',
          body: JSON.stringify({ voter_registrations })
        });
        if (res.ok) { setCsvOpen(false); setCsvFile(null); await load(); }
        else { const j = await res.json().catch(()=> ({})); alert(j?.message || 'CSV upload failed'); }
      }
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.state || '').toLowerCase().includes(q) ||
      String(r.year || '').includes(q)
    );
  }, [rows, query]);

  if (status === 'loading') return <div className="p-6">Loading…</div>;
  if (!canView) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">403 — Not Authorized</div>
        <p className="text-gray-600">You don’t have permission to view Voters Registration.</p>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    );
  }
  if (!canUpdate) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">Voters Registration (Read-only)</div>
        <p className="text-gray-600">You don’t have permission to update this data.</p>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard/resources/voters-registration">
          Back to Voters Registration
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Voters Registration</h1>
        <div className="flex gap-2">
          <button onClick={massDelete} className="rounded-xl border px-3 py-2 hover:bg-red-50">Delete Selected</button>
          <button onClick={()=>setCsvOpen(true)} className="rounded-xl border px-3 py-2 hover:bg-gray-50">Upload CSV</button>
          <Link href="/dashboard/resources/voters-registration" className="rounded-xl border px-3 py-2 hover:bg-gray-50">View</Link>
        </div>
      </div>

      {/* Editor */}
      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white border rounded-2xl p-4">
        <input className="rounded-xl border px-3 py-2" placeholder="State"  value={form.state}  onChange={e=>setForm(f=>({...f,state:e.target.value}))} required />
        <input className="rounded-xl border px-3 py-2" placeholder="Male"   value={form.male}   onChange={e=>setForm(f=>({...f,male:e.target.value}))} />
        <input className="rounded-xl border px-3 py-2" placeholder="Female" value={form.female} onChange={e=>setForm(f=>({...f,female:e.target.value}))} />
        <input className="rounded-xl border px-3 py-2" placeholder="Total"  value={form.total}  onChange={e=>setForm(f=>({...f,total:e.target.value}))} />
        <input className="rounded-xl border px-3 py-2" placeholder="Year"   value={form.year}   onChange={e=>setForm(f=>({...f,year:e.target.value}))} required />
        <div className="md:col-span-5 flex gap-3">
          <button className="rounded-xl border px-4 py-2 hover:bg-gray-50">{editing? 'Update' : 'Create'}</button>
          {editing && <button type="button" onClick={startCreate} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Cancel Edit</button>}
        </div>
      </form>

      {/* Search */}
      <div className="flex gap-3">
        <input className="rounded-xl border px-3 py-2 w-full" placeholder="Search by state or year…" value={query} onChange={e=>setQuery(e.target.value)} />
        <button onClick={load} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Refresh</button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={e=>{
                    if (e.target.checked) setSelected(new Set(filtered.map(r=>r._id)));
                    else setSelected(new Set());
                  }}
                />
              </th>
              <th className="p-3">State</th>
              <th className="p-3">Male</th>
              <th className="p-3">Female</th>
              <th className="p-3">Total</th>
              <th className="p-3">Year</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center">Loading…</td></tr>
            ) : filtered.length ? filtered.map(r => (
              <tr key={r._id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(r._id)}
                    onChange={e=>{
                      const s = new Set(selected);
                      if (e.target.checked) s.add(r._id); else s.delete(r._id);
                      setSelected(s);
                    }}
                  />
                </td>
                <td className="p-3 font-medium">{r.state}</td>
                <td className="p-3">{toNum(r.male).toLocaleString()}</td>
                <td className="p-3">{toNum(r.female).toLocaleString()}</td>
                <td className="p-3">{toNum(r.total).toLocaleString()}</td>
                <td className="p-3">{r.year}</td>
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

      {/* CSV drawer */}
      {csvOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setCsvOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upload CSV</h2>
              <button onClick={()=>setCsvOpen(false)} className="rounded-lg border px-3 py-1">Close</button>
            </div>
            <form className="p-4 space-y-4" onSubmit={handleCsvSubmit}>
              <div>
                <a
                  className="inline-block rounded-xl border px-3 py-2 hover:bg-gray-50"
                  href="data:text/csv;charset=utf-8,State,Male,Female,Total,Year%0ALagos,1000000,900000,1900000,2023"
                  download="voters_sample.csv"
                >
                  Download Sample CSV
                </a>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={e=>setCsvFile(e.target.files?.[0] || null)}
                required
                className="w-full rounded-xl border px-3 py-2"
              />
              <div className="flex gap-2">
                <button className="rounded-xl border px-4 py-2 hover:bg-gray-50">Upload</button>
                <button type="button" onClick={()=>setCsvOpen(false)} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
