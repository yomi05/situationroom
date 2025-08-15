'use client';

import { useEffect, useState } from 'react';

export default function PollingUnitsPage() {
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [units, setUnits] = useState([]);

  const [stateValue, setStateValue] = useState('');
  const [lgaValue, setLgaValue] = useState('');
  const [wardValue, setWardValue] = useState('');
  const [loading, setLoading] = useState(false);

  // load states on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/resources/polling-units?distinct=state', { cache: 'no-store' });
        const json = await res.json();
        setStates(json.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onStateChange = async (v) => {
    setStateValue(v);
    setLgas([]); setWards([]); setUnits([]);
    setLgaValue(''); setWardValue('');
    if (!v) return;
    const res = await fetch(`/api/resources/polling-units?by=state&value=${encodeURIComponent(v)}`);
    const json = await res.json();
    setLgas(json.data || []);
  };

  const onLgaChange = async (v) => {
    setLgaValue(v);
    setWards([]); setUnits([]);
    setWardValue('');
    if (!v) return;
    const res = await fetch(`/api/resources/polling-units?by=lga&value=${encodeURIComponent(v)}`);
    const json = await res.json();
    setWards(json.data || []);
  };

  const onWardChange = async (v) => {
    setWardValue(v);
    setUnits([]);
    if (!v) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/resources/polling-units?by=registration_area&value=${encodeURIComponent(v)}`);
      const json = await res.json();
      setUnits(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Polling Units</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={stateValue}
            onChange={(e) => onStateChange(e.target.value)}
          >
            <option value="">Select state</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">LGA</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={lgaValue}
            onChange={(e) => onLgaChange(e.target.value)}
            disabled={!stateValue}
          >
            <option value="">Select LGA</option>
            {lgas.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ward</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={wardValue}
            onChange={(e) => onWardChange(e.target.value)}
            disabled={!lgaValue}
          >
            <option value="">Select Ward</option>
            {wards.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-600">Loading…</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">State</th>
                <th className="text-left px-3 py-2">LGA</th>
                <th className="text-left px-3 py-2">Ward</th>
                <th className="text-left px-3 py-2">Polling Unit</th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">No data</td></tr>
              ) : units.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="px-3 py-2">{u.state}</td>
                  <td className="px-3 py-2">{u.lga}</td>
                  <td className="px-3 py-2">{u.registration_area}</td>
                  <td className="px-3 py-2">{u.polling_unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
