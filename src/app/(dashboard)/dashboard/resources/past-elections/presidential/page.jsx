'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';
import BarChart from '@/components/charts/BarChart';

function toNum(v) {
  if (typeof v === 'number') return v;
  return Number(String(v ?? '0').replace(/,/g, '')) || 0;
}

export default function PresidentialElectionsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'Guest';

  const canView = hasPerm(role, PERMS.VIEW_PAST_ELECTIONS);
  const canUpdate = hasPerm(role, PERMS.UPDATE_PAST_ELECTIONS);

  const [rows, setRows] = useState([]);
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/past-elections/presidential', { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || 'Failed to load');
      const data = Array.isArray(j.data) ? j.data : [];
      setRows(data);
      // default year = latest available
      const years = Array.from(new Set(data.map(d => Number(d.year)))).filter(Boolean).sort((a,b)=>b-a);
      if (years.length && !year) setYear(String(years[0]));
    } catch (e) {
      setErr(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (canView) load(); }, [canView]);

  const years = useMemo(() => {
    const ys = new Set();
    rows.forEach(r => Number.isFinite(Number(r.year)) && ys.add(Number(r.year)));
    return Array.from(ys).sort((a,b)=>b-a);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => !year || String(r.year) === String(year));
  }, [rows, year]);

  // Chart (labels=candidates, values=votes)
  const labels = useMemo(() => filtered.map(d => `${d.candidate} (${d.party})`), [filtered]);
  const values = useMemo(() => filtered.map(d => toNum(d.votes)), [filtered]);

  if (!canView) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">403 — Not Authorized</div>
        <p className="text-gray-600">You don’t have permission to view Past Elections.</p>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Presidential Elections</h1>
        {canUpdate && (
          <Link href="/dashboard/resources/update-election/presidential" className="rounded-xl border px-4 py-2 hover:bg-gray-50">
            Manage Data
          </Link>
        )}
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select className="rounded-xl border px-3 py-2" value={year} onChange={e=>setYear(e.target.value)}>
          {years.length ? years.map(y => (
            <option key={`year-${y}`} value={String(y)}>{y}</option>
          )) : <option value="">No Years</option>}
        </select>
        <button className="rounded-xl border px-3 py-2" onClick={()=>load()}>Refresh</button>
        <div />
      </div>

      <div className="h-80 w-full rounded-2xl border p-3">
        {labels.length ? (
          <BarChart
            labels={labels}
            values={values}
            title={year ? `Votes — ${year}` : 'Votes'}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            {loading ? 'Loading…' : 'No data.'}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Candidate</th>
              <th className="p-3">Party</th>
              <th className="p-3">Votes</th>
              <th className="p-3">%</th>
              <th className="p-3">Year</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center">Loading…</td></tr>
            ) : filtered.length ? filtered.map(r => (
              <tr key={r._id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{r.candidate}</td>
                <td className="p-3">{r.party}</td>
                <td className="p-3">{toNum(r.votes).toLocaleString()}</td>
                <td className="p-3">{Number(r.percentage).toFixed(2)}%</td>
                <td className="p-3">{r.year}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
