'use client';

import { useEffect, useState } from 'react';

export default function IncidentReportsSubmissionsPage() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [view, setView] = useState(null); // selected report for modal

  const load = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/incident-reports', location.origin);
      if (q) url.searchParams.set('q', q);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const j = await res.json();
      setList(j.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable react-hooks/exhaustive-deps */ }, []);

  const notify = (type, text) => setMsg({ type, text });

  const del = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      const res = await fetch(`/api/incident-reports/${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!res.ok) return notify('error', j?.message || 'Delete failed');
      notify('success', 'Deleted');
      setList((x) => x.filter((r) => r._id !== id));
      if (view?._id === id) setView(null);
    } catch {
      notify('error', 'Network error');
    }
  };

  const onSearch = async (e) => {
    e.preventDefault();
    await load();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Incident Reports</h1>
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <input className="border rounded-md px-3 py-2" placeholder="Search name/email/PU…" value={q} onChange={(e)=>setQ(e.target.value)} />
          <button className="px-3 py-2 rounded-md border">Search</button>
        </form>
      </div>

      {msg.text && (
        <div className={`mb-4 rounded-md px-3 py-2 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-gray-600">Loading…</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Gender</th>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2">Phone</th>
                <th className="text-left px-3 py-2">State</th>
                <th className="text-left px-3 py-2">LGA</th>
                <th className="text-left px-3 py-2">Ward</th>
                <th className="text-left px-3 py-2">Polling Unit</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-500">No reports</td></tr>
              ) : list.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.gender}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.phone}</td>
                  <td className="px-3 py-2">{r.state}</td>
                  <td className="px-3 py-2">{r.lga}</td>
                  <td className="px-3 py-2">{r.ward}</td>
                  <td className="px-3 py-2">{r.pollingunit}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 rounded border" onClick={() => setView(r)}>View</button>
                      <button className="px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50" onClick={() => del(r._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {view && (
        <div className="fixed inset-0 bg-black/40 z-40 flex justify-center items-start p-4" onClick={() => setView(null)}>
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl p-5 mt-10" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{view.name}</h2>
              <button className="text-gray-500" onClick={() => setView(null)}>✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Phone:</span> {view.phone}</div>
              <div><span className="text-gray-500">Email:</span> {view.email}</div>
              <div><span className="text-gray-500">Gender:</span> {view.gender}</div>
              <div><span className="text-gray-500">State:</span> {view.state}</div>
              <div><span className="text-gray-500">LGA:</span> {view.lga}</div>
              <div><span className="text-gray-500">Ward:</span> {view.ward}</div>
              <div className="md:col-span-2"><span className="text-gray-500">Polling Unit:</span> {view.pollingunit}</div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-1">Description</h3>
              {/* If you store HTML, consider sanitizing server-side before rendering */}
              <div className="prose max-w-none whitespace-pre-line text-sm"
                   dangerouslySetInnerHTML={{ __html: view.description }} />
            </div>

            {Array.isArray(view.uploads) && view.uploads.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-1">Uploads</h3>
                <div className="flex flex-wrap gap-3">
                  {view.uploads.map((u, i) => (
                    <a key={i} href={u} target="_blank" className="block border rounded-md overflow-hidden">
                      {/* naive preview for images */}
                      <img src={u} alt={`upload-${i}`} className="h-24 w-32 object-cover" onError={(e)=>{ e.currentTarget.style.display='none'; }} />
                      <div className="px-2 py-1 text-xs text-blue-700 underline">{u.split('/').pop()}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button className="px-4 py-2 rounded border" onClick={()=>setView(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
