'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FormsListPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [copiedId, setCopiedId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/forms', { cache: 'no-store' });
      const j = await res.json();
      setForms(Array.isArray(j) ? j : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const notify = (type, text) => setMsg({ type, text });

  const delForm = async (idOrKey, name) => {
    if (!confirm(`Delete form "${name}"?`)) return;
    const res = await fetch(`/api/forms/${idOrKey}`, { method: 'DELETE' });
    const j = await res.json();
    if (!res.ok) return notify('error', j?.message || 'Delete failed');
    notify('success', j.message || 'Deleted');
    setForms((x) => x.filter((f) => f._id !== idOrKey && f.form_key !== idOrKey && f.slug !== idOrKey));
  };

  const buildFormUrl = (form) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/forms/${form.slug ?? form.form_key}`;
  };

  const copyLink = async (form) => {
    const url = buildFormUrl(form);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(form._id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Forms</h1>
        <Link href="/dashboard/forms/create" className="bg-[#245B9E] text-white px-4 py-2 rounded-md">New Form</Link>
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
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Slug</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">No forms</td></tr>
              ) : forms.map((f) => {
                  const idForLinks = f.slug ?? f.form_key; // slug-first
                  return (
                    <tr key={f._id} className="border-t">
                      <td className="px-3 py-2">{f.form_name}</td>
                      <td className="px-3 py-2">{f.status}</td>
                      <td className="px-3 py-2 font-mono">{idForLinks}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          {/* Edit uses the builder; it already accepts slug or key via ?key= */}
                          <Link
                            href={`/dashboard/forms/create?key=${encodeURIComponent(idForLinks)}`}
                            className="px-2 py-1 rounded border"
                          >
                            Edit
                          </Link>

                          {/* Open public form with slug-first */}
                          <Link
                            href={`/forms/${encodeURIComponent(idForLinks)}`}
                            target="_blank"
                            className="px-2 py-1 rounded border"
                          >
                            Open
                          </Link>

                          {/* Copy link (slug-first) */}
                          <button
                            type="button"
                            className="px-2 py-1 rounded border"
                            onClick={() => copyLink(f)}
                            title={buildFormUrl(f)}
                          >
                            {copiedId === f._id ? 'Copied!' : 'Copy Link'}
                          </button>

                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => delForm(f._id, f.form_name)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
