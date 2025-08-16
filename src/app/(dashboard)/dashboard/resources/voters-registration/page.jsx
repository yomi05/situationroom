'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';
import BarChart from '@/components/charts/BarChart';

const NATIONWIDE = '__NATIONWIDE__';

// Tailwind-inspired palette
const COLOR_MALE   = '#3b82f6'; // blue-500
const COLOR_FEMALE = '#ec4899'; // pink-500
const COLOR_TOTAL  = '#22c55e'; // green-500

function toNum(v) {
  if (typeof v === 'number') return v;
  return Number(String(v ?? '0').replace(/,/g, '')) || 0;
}

export default function VotersRegistrationPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'Guest';

  const canView = hasPerm(role, PERMS.VIEW_VOTERS_REGISTRATION);
  const canUpdate = hasPerm(role, PERMS.UPDATE_VOTERS_REGISTRATION);

  const [rows, setRows] = useState([]);
  const [stateFilter, setStateFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('total'); // 'total' | 'male' | 'female' | 'compare'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!canView) return;
      setLoading(true);
      const res = await fetch('/api/voters', { cache: 'no-store' });
      const j = await res.json();
      setRows(Array.isArray(j.data) ? j.data : []);
      setLoading(false);
    })();
  }, [canView]);

  const states = useMemo(() => {
    const uniq = new Set();
    rows.forEach(r => {
      const s = (r.state ?? '').toString().trim();
      if (s) uniq.add(s);
    });
    return Array.from(uniq).sort();
  }, [rows]);

  const years = useMemo(() => {
    const uniq = new Set();
    rows.forEach(r => {
      const y = Number(r.year);
      if (Number.isFinite(y)) uniq.add(y);
    });
    return Array.from(uniq).sort((a, b) => b - a);
  }, [rows]);

  // Filter base rows first (by state/year)
  const filtered = useMemo(() => {
    if (stateFilter && stateFilter !== NATIONWIDE) {
      return rows.filter(r =>
        r.state === stateFilter &&
        (!yearFilter || String(r.year) === String(yearFilter))
      );
    }
    // all states (no aggregation) OR nationwide (we’ll aggregate later)
    return rows.filter(r =>
      (!yearFilter || String(r.year) === String(yearFilter))
    );
  }, [rows, stateFilter, yearFilter]);

  // Build labels + datasets (with colors)
  const { chartLabels, datasets, titleOverride } = useMemo(() => {
    const ds = (maleArr, femaleArr, totalArr) => {
      // Always color the bars explicitly
      const out = [];
      if (genderFilter === 'compare') {
        out.push(
          { label: 'Male',   data: maleArr,   backgroundColor: COLOR_MALE },
          { label: 'Female', data: femaleArr, backgroundColor: COLOR_FEMALE },
          { label: 'Total',  data: totalArr,  backgroundColor: COLOR_TOTAL },
        );
      } else if (genderFilter === 'male') {
        out.push({ label: 'Male', data: maleArr, backgroundColor: COLOR_MALE });
      } else if (genderFilter === 'female') {
        out.push({ label: 'Female', data: femaleArr, backgroundColor: COLOR_FEMALE });
      } else {
        out.push({ label: 'Total', data: totalArr, backgroundColor: COLOR_TOTAL });
      }
      return out;
    };

    // NATIONWIDE (aggregate)
    if (stateFilter === NATIONWIDE) {
      if (yearFilter) {
        // single bar (or triple side-by-side) for selected year
        let maleSum = 0, femaleSum = 0, totalSum = 0;
        filtered.forEach(r => {
          maleSum += toNum(r.male);
          femaleSum += toNum(r.female);
          totalSum += toNum(r.total);
        });
        return {
          chartLabels: [`Nationwide ${yearFilter}`],
          datasets: ds([maleSum], [femaleSum], [totalSum]),
          titleOverride: genderFilter === 'compare' ? 'Male vs Female vs Total' :
            genderFilter === 'male' ? 'Male Voters' :
            genderFilter === 'female' ? 'Female Voters' : 'Total Voters',
        };
      }

      // No year selected → aggregate by year (one group per year)
      const byYear = new Map(); // year -> { male,female,total }
      filtered.forEach(r => {
        const y = Number(r.year);
        if (!Number.isFinite(y)) return;
        const cur = byYear.get(y) || { male: 0, female: 0, total: 0 };
        cur.male += toNum(r.male);
        cur.female += toNum(r.female);
        cur.total += toNum(r.total);
        byYear.set(y, cur);
      });

      const yrs = Array.from(byYear.keys()).sort((a, b) => a - b);
      const labels = yrs.map(y => `Nationwide ${y}`);
      const maleArr   = yrs.map(y => byYear.get(y).male);
      const femaleArr = yrs.map(y => byYear.get(y).female);
      const totalArr  = yrs.map(y => byYear.get(y).total);

      return {
        chartLabels: labels,
        datasets: ds(maleArr, femaleArr, totalArr),
        titleOverride: genderFilter === 'compare' ? 'Male vs Female vs Total' :
          genderFilter === 'male' ? 'Male Voters' :
          genderFilter === 'female' ? 'Female Voters' : 'Total Voters',
      };
    }

    // Non-nationwide (per-row bars)
    const labels = filtered.map(r => `${r.state} (${r.year})`);
    const maleArr   = filtered.map(r => toNum(r.male));
    const femaleArr = filtered.map(r => toNum(r.female));
    const totalArr  = filtered.map(r => toNum(r.total));

    return {
      chartLabels: labels,
      datasets: ds(maleArr, femaleArr, totalArr),
      titleOverride: genderFilter === 'compare' ? 'Male vs Female vs Total' :
        genderFilter === 'male' ? 'Male Voters' :
        genderFilter === 'female' ? 'Female Voters' : 'Total Voters',
    };
  }, [filtered, stateFilter, yearFilter, genderFilter]);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Voters Registration</h1>
        {canUpdate && (
          <Link
            href="/dashboard/resources/voters-registration/update"
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            Manage Data
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          className="rounded-xl border px-3 py-2"
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
        >
          <option key="__all_states" value="">All States (no aggregation)</option>
          <option key="__nationwide" value={NATIONWIDE}>Nationwide (aggregate)</option>
          {states.map(s => (
            <option key={`state-${s}`} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="rounded-xl border px-3 py-2"
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
        >
          <option key="__all_years" value="">All Years</option>
          {years.map(y => (
            <option key={`year-${y}`} value={String(y)}>{y}</option>
          ))}
        </select>

        <select
          className="rounded-xl border px-3 py-2"
          value={genderFilter}
          onChange={e => setGenderFilter(e.target.value)}
        >
          <option key="gender-total" value="total">Total</option>
          <option key="gender-male" value="male">Male</option>
          <option key="gender-female" value="female">Female</option>
          <option key="gender-compare" value="compare">Male vs Female (side-by-side + Total)</option>
        </select>

        <button
          className="rounded-xl border px-3 py-2"
          onClick={() => { setStateFilter(''); setYearFilter(''); setGenderFilter('total'); }}
        >
          Clear Filters
        </button>
      </div>

      <div className="h-80 w-full rounded-2xl border p-3">
        {chartLabels.length ? (
          <BarChart labels={chartLabels} datasets={datasets} title={titleOverride} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No data for selected filters
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">State</th>
              <th className="p-3">Male</th>
              <th className="p-3">Female</th>
              <th className="p-3">Total</th>
              <th className="p-3">Year</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center">Loading…</td></tr>
            ) : filtered.length ? filtered.map(r => (
              <tr key={r._id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{r.state}</td>
                <td className="p-3">{toNum(r.male).toLocaleString()}</td>
                <td className="p-3">{toNum(r.female).toLocaleString()}</td>
                <td className="p-3">{toNum(r.total).toLocaleString()}</td>
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
