'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';

// Next occurrence: strictly AFTER today (<= today goes to next year)
function nextOccurrenceTs(dMon) {
  if (!dMon || typeof dMon !== 'string' || !dMon.includes('-')) {
    return Number.POSITIVE_INFINITY;
  }
  const [dStr, monAbbr] = dMon.split('-');
  const day = Number(dStr);
  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  const mIdx = monthMap[monAbbr];
  if (!Number.isFinite(day) || mIdx === undefined) {
    return Number.POSITIVE_INFINITY;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 00:00 today
  let target = new Date(now.getFullYear(), mIdx, day);                      // this year @ 00:00

  // IMPORTANT CHANGE: if target is today or in the past, move to next year
  if (target <= today) {
    target = new Date(now.getFullYear() + 1, mIdx, day);
  }
  return target.getTime();
}

export default function NotableDatesListPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'Guest';

  const canView = hasPerm(role, PERMS.VIEW_NOTABLE_DATES);
  const canManage = hasPerm(role, PERMS.MANAGE_NOTABLE_DATES);

  const [rows, setRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/notable-dates', {
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try { msg = JSON.parse(text)?.message || msg; } catch {}
        throw new Error(msg);
      }
      const j = text ? JSON.parse(text) : { data: [] };
      setRows(Array.isArray(j.data) ? j.data : []);
    } catch (e) {
      setErrorMsg(e?.message || 'Unable to load notable dates');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (canView) load(); }, [canView]);

  // Sort by strict-next occurrence (wraps to the same date next year)
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ta = nextOccurrenceTs(a?.date);
      const tb = nextOccurrenceTs(b?.date);
      if (ta !== tb) return ta - tb;
      return String(a?.observation || '').localeCompare(String(b?.observation || ''));
    });
  }, [rows]);

  if (!canView) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">403 — Not Authorized</div>
        <p className="text-gray-600">You don’t have permission to view Notable Dates.</p>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notable Dates</h1>
        {canManage && (
          <Link href="/dashboard/notable-dates/manage" className="rounded-xl border px-3 py-2 hover:bg-gray-50">
            Manage Dates
          </Link>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Observation</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={2} className="p-6 text-center">Loading…</td></tr>
            ) : sortedRows.length ? sortedRows.map((r) => (
              <tr key={r._id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{r.date}</td>
                <td className="p-3">{r.observation}</td>
              </tr>
            )) : (
              <tr><td colSpan={2} className="p-6 text-center text-gray-500">No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
