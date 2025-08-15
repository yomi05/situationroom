'use client';

import { useEffect, useState } from 'react';

export default function FormEntriesPage({ params }) {
  const key = params.key;
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${key}`, { cache: 'no-store' });
      const j = await res.json();
      setList(Array.isArray(j) ? j : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Entries</h1>
      {loading ? (
        <div className="py-10 text-center text-gray-600">Loading…</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">IP</th>
                <th className="text-left px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-500">No entries</td></tr>
              ) : list.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="px-3 py-2">{s.submission_name || '-'}</td>
                  <td className="px-3 py-2">{s.ip || '-'}</td>
                  <td className="px-3 py-2">{new Date(s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
