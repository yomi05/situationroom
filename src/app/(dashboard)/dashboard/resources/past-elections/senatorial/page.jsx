'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';
import BarChart from '@/components/charts/BarChart';

function toNum(v){ if(typeof v==='number') return v; return Number(String(v??'0').replace(/,/g,''))||0; }

export default function SenatorialViewPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'Guest';
  const canView = hasPerm(role, PERMS.VIEW_PAST_ELECTIONS);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  useEffect(() => {
    (async () => {
      if (!canView) return;
      setLoading(true);
      const res = await fetch('/api/past-elections/senatorial', { cache: 'no-store' });
      const j = await res.json();
      setRows(Array.isArray(j.data) ? j.data : []);
      setLoading(false);
    })();
  }, [canView]);

  const years = useMemo(() => Array.from(new Set(rows.map(r => Number(r.year)))).filter(Boolean).sort((a,b)=>b-a), [rows]);
  const states = useMemo(() => Array.from(new Set(rows.map(r => String(r.state||'').trim()))).filter(Boolean).sort(), [rows]);

  const districtsForStateYear = useMemo(() => {
    const pool = rows.filter(r =>
      (!yearFilter || String(r.year) === String(yearFilter)) &&
      (!stateFilter || r.state === stateFilter)
    );
    return Array.from(new Set(pool.map(r => String(r.district||'').trim()))).filter(Boolean).sort();
  }, [rows, yearFilter, stateFilter]);

  const filtered = useMemo(() => {
    return rows.filter(r =>
      (!yearFilter || String(r.year) === String(yearFilter)) &&
      (!stateFilter || r.state === stateFilter) &&
      (!districtFilter || r.district === districtFilter)
    );
  }, [rows, yearFilter, stateFilter, districtFilter]);

  const labels = useMemo(() => filtered.map(r => `${r.candidate} (${r.state}, ${r.district})`), [filtered]);
  const values = useMemo(() => filtered.map(r => toNum(r.votes)), [filtered]);

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Past Elections — Senatorial</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select className="rounded-xl border px-3 py-2" value={yearFilter} onChange={e=>{setYearFilter(e.target.value); setDistrictFilter('');}}>
          <option value="">All Years</option>
          {years.map(y => <option key={`year-${y}`} value={String(y)}>{y}</option>)}
        </select>

        <select className="rounded-xl border px-3 py-2" value={stateFilter} onChange={e=>{setStateFilter(e.target.value); setDistrictFilter('');}}>
          <option value="">All States</option>
          {states.map(s => <option key={`state-${s}`} value={s}>{s}</option>)}
        </select>

        <select className="rounded-xl border px-3 py-2" value={districtFilter} onChange={e=>setDistrictFilter(e.target.value)}>
          <option value="">All Districts</option>
          {districtsForStateYear.map(d => <option key={`district-${d}`} value={d}>{d}</option>)}
        </select>

        <button className="rounded-xl border px-3 py-2" onClick={()=>{ setYearFilter(''); setStateFilter(''); setDistrictFilter(''); }}>
          Clear Filters
        </button>
      </div>

      <div className="h-80 w-full rounded-2xl border p-3">
        {labels.length ? (
          <BarChart labels={labels} values={values} title="Votes by Candidate" />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">No data for selected filters</div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Candidate</th>
              <th className="p-3">Votes</th>
              <th className="p-3">Party</th>
              <th className="p-3">Year</th>
              <th className="p-3">District</th>
              <th className="p-3">State</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center">Loading…</td></tr>
            ) : filtered.length ? filtered.map(r => (
              <tr key={r._id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{r.candidate}</td>
                <td className="p-3">{toNum(r.votes).toLocaleString()}</td>
                <td className="p-3">{r.party}</td>
                <td className="p-3">{r.year}</td>
                <td className="p-3">{r.district}</td>
                <td className="p-3">{r.state}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
