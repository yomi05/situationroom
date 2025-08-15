'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PollingFormsPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // panel state for "my submissions"
  const [openFor, setOpenFor] = useState(null); // form_key/slug currently expanded
  const [subs, setSubs] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsErr, setSubsErr] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch('/api/forms/polling', { cache: 'no-store' });
        const j = await res.json();
        setForms(Array.isArray(j) ? j : []);
      } catch (e) {
        setErr(e?.message || 'Failed to load forms');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const viewMine = async (form) => {
    const id = form.slug || form.form_key;
    if (!id) return;

    if (openFor === id) {
      // collapse if already open
      setOpenFor(null);
      return;
    }

    setOpenFor(id);
    setSubs([]);
    setSubsErr(null);
    setSubsLoading(true);

    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(id)}?mine=1`, { cache: 'no-store' });
      if (res.status === 401) {
        setSubsErr('Please sign in to view your submissions.');
        setSubs([]);
      } else {
        const j = await res.json();
        setSubs(Array.isArray(j) ? j : []);
      }
    } catch (e) {
      setSubsErr(e?.message || 'Failed to load submissions');
      setSubs([]);
    } finally {
      setSubsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Polling Forms</h1>

      {loading && <div className="text-gray-600 mb-4">Loading…</div>}
      {err && <div className="mb-4 rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}

      {!loading && !err && forms.length === 0 && (
        <div className="text-primary-600">No Active Polling Form</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {forms.map((f) => {
          const id = f.slug || f.form_key;
          const expanded = openFor === id;

          return (
            <div key={f._id || id} className="bg-white border rounded-xl shadow-sm">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-gray-500">Form</div>
                    <div className="text-lg font-semibold">{f.form_name}</div>
                  </div>
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 ${
                      f.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>

                {f.form_description && (
                  <p className="text-sm text-gray-600 mt-2">{f.form_description}</p>
                )}

                <div className="mt-4 flex items-center gap-2">
                  {/* Submit a form (public page) */}
                  <Link
                    href={`/forms/${encodeURIComponent(id)}`}
                    className="inline-flex items-center justify-center rounded-md bg-[#245B9E] text-white px-3 py-1.5 text-sm"
                  >
                    Submit a Form
                  </Link>

                  {/* View my submissions */}
                  <button
                    type="button"
                    onClick={() => viewMine(f)}
                    className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm"
                  >
                    {expanded ? 'Hide My Submissions' : 'View My Submissions'}
                  </button>
                </div>
              </div>

              {/* Expandable area */}
              {expanded && (
                <div className="border-t px-4 py-3 bg-gray-50">
                  {subsLoading && <div className="text-gray-600">Loading…</div>}
                  {subsErr && (
                    <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{subsErr}</div>
                  )}
                  {!subsLoading && !subsErr && subs.length === 0 && (
                    <div className="text-gray-600 text-sm">You have not submitted this form yet.</div>
                  )}
                  {!subsLoading && !subsErr && subs.length > 0 && (
                    <div className="space-y-3">
                      {subs.map((s) => (
                        <div key={s._id} className="bg-white border rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              {new Date(s.createdAt).toLocaleString()}
                            </div>
                            {s.ip && (
                              <div className="text-xs text-gray-400">IP: {s.ip}</div>
                            )}
                          </div>

                          <div className="mt-2 text-sm">
                            {(s.submission_value || []).map((fv) => (
                              <div key={fv.field_id} className="border-t first:border-t-0 py-1">
                                <div className="text-xs text-gray-500">Field: {fv.field_id}</div>
                                <div className="break-words">
                                  {typeof fv.field_value === 'object'
                                    ? <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(fv.field_value, null, 2)}</pre>
                                    : String(fv.field_value ?? '')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
