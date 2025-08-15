'use client';

import { useEffect, useMemo, useState } from 'react';

export default function EntriesTable({ formKey, form, brand = '#245B9E' }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters per column (keyed by field_id)
  const [filters, setFilters] = useState({});

  // slug-first id (fallback to legacy formKey prop)
  const id = useMemo(
    () => (form?.slug ?? form?.form_key ?? formKey) || '',
    [form?.slug, form?.form_key, formKey]
  );

  const columns = useMemo(
    () =>
      Array.isArray(form?.fields)
        ? form.fields.filter((f) => f.field_name !== 'PollingForm')
        : [],
    [form?.fields]
  );

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/submissions/${encodeURIComponent(id)}`, { cache: 'no-store' });
        const j = await res.json();
        setRows(Array.isArray(j) ? j : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // build display rows as { field_id: value, ..., __meta }
  const display = useMemo(() => {
    const out = rows.map((r) => {
      const map = {};
      for (const it of r.submission_value || []) {
        map[it.field_id] = it.field_value;
      }
      map.__meta = r;
      return map;
    });

    // simple contains filter per column
    return out.filter((row) =>
      columns.every((c) => {
        const needle = (filters[c.field_id] || '').trim().toLowerCase();
        if (!needle) return true;
        const v = (row[c.field_id] ?? '').toString().toLowerCase();
        return v.includes(needle);
      })
    );
  }, [rows, columns, filters]);

  const exportCSV = () => {
    const header = ['_created', ...columns.map((c) => c.field_name)];
    const lines = [header];

    for (const row of display) {
      const created = row.__meta?.createdAt ? new Date(row.__meta.createdAt).toISOString() : '';
      lines.push([created, ...columns.map((c) => safeCSV(row[c.field_id]))]);
    }

    const csv = lines.map((cols) => cols.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(form?.form_name || 'form').replace(/\s+/g, '_')}_entries.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">{form?.form_name} — Entries</div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-md text-white"
          style={{ background: brand }}
          type="button"
        >
          Export to CSV
        </button>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-[800px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left whitespace-nowrap">Created</th>
              {columns.map((c) => (
                <th key={c.field_id} className="px-3 py-2 text-left max-w-[260px]">
                  <div className="whitespace-pre-wrap">{c.field_name}</div>
                </th>
              ))}
            </tr>
            <tr>
              <th className="px-3 py-2"></th>
              {columns.map((c) => (
                <th key={c.field_id} className="px-3 py-2">
                  <div className="relative">
                    <input
                      className="w-full border rounded-md px-3 py-2 bg-gray-100"
                      placeholder=""
                      value={filters[c.field_id] || ''}
                      onChange={(e) => setFilters((x) => ({ ...x, [c.field_id]: e.target.value }))}
                    />
                    <span className="absolute right-2 top-2.5 text-gray-400">🔍</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : display.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-gray-500">
                  No entries
                </td>
              </tr>
            ) : (
              display.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                    {row.__meta?.createdAt ? new Date(row.__meta.createdAt).toLocaleString() : ''}
                  </td>
                  {columns.map((c) => (
                    <td key={c.field_id} className="px-3 py-2 align-top">
                      <Cell value={row[c.field_id]} type={c.field_type} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ value, type }) {
  if (Array.isArray(value)) return <div className="whitespace-pre-wrap">{value.join(', ')}</div>;

  if (type === 'FileUpload' && value && /^https?:\/\//.test(value)) {
    const name = decodeURIComponent(String(value).split('/').pop() || '');
    return (
      <a className="text-blue-600 underline break-all" href={value} target="_blank" rel="noreferrer">
        {name || value}
      </a>
    );
  }

  if (typeof value === 'boolean') return <div>{value ? 'Yes' : 'No'}</div>;

  return <div className="whitespace-pre-wrap break-words">{String(value ?? '')}</div>;
}

function safeCSV(v) {
  if (Array.isArray(v)) return v.join(';');
  return v ?? '';
}
function csvEscape(s) {
  const v = String(s ?? '');
  if (/[,"\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
