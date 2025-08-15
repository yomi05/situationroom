'use client';

import { useEffect, useState } from 'react';

const emptyForm = {
  _id: null,
  state: '',
  lga: '',
  registration_area: '',
  polling_unit: '',
};

export default function UpdatePollingUnitsPage() {
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({ state: '', lga: '', registration_area: '' });
  const [form, setForm] = useState(emptyForm);
  const [openForm, setOpenForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // load states
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/resources/polling-units?distinct=state', { cache: 'no-store' });
      const j = await res.json();
      setStates(j.data || []);
    })();
  }, []);

  const notify = (type, text) => setMessage({ type, text });
  const clearMsg = () => setMessage({ type: '', text: '' });

  const changeState = async (v) => {
    setFilters({ state: v, lga: '', registration_area: '' });
    setLgas([]); setWards([]); setUnits([]);
    if (!v) return;
    const r = await fetch(`/api/resources/polling-units?by=state&value=${encodeURIComponent(v)}`);
    const j = await r.json();
    setLgas(j.data || []);
  };

  const changeLga = async (v) => {
    setFilters((f) => ({ ...f, lga: v, registration_area: '' }));
    setWards([]); setUnits([]);
    if (!v) return;
    const r = await fetch(`/api/resources/polling-units?by=lga&value=${encodeURIComponent(v)}`);
    const j = await r.json();
    setWards(j.data || []);
  };

  const changeWard = async (v) => {
    setFilters((f) => ({ ...f, registration_area: v }));
    setUnits([]);
    if (!v) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/resources/polling-units?by=registration_area&value=${encodeURIComponent(v)}`);
      const j = await r.json();
      setUnits(j.data || []);
    } finally {
      setLoading(false);
    }
  };

  const editRow = (row) => {
    setForm({
      _id: row._id,
      state: row.state,
      lga: row.lga,
      registration_area: row.registration_area,
      polling_unit: row.polling_unit,
    });
    setOpenForm(true);
    clearMsg();
  };

  const newRow = () => {
    setForm({
      _id: null,
      state: filters.state || '',
      lga: filters.lga || '',
      registration_area: filters.registration_area || '',
      polling_unit: '',
    });
    setOpenForm(true);
    clearMsg();
  };

  const save = async (e) => {
    e.preventDefault();
    clearMsg();
    const payload = {
      state: form.state.trim(),
      lga: form.lga.trim(),
      registration_area: form.registration_area.trim(),
      polling_unit: form.polling_unit.trim(),
    };
    if (!payload.state || !payload.lga || !payload.registration_area || !payload.polling_unit) {
      return notify('error', 'All fields are required');
    }

    setLoading(true);
    try {
      const res = await fetch(
        form._id ? `/api/resources/polling-units/${form._id}` : '/api/resources/polling-units',
        {
          method: form._id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const j = await res.json();
      if (!res.ok) {
        return notify('error', j?.message || 'Save failed');
      }
      notify('success', form._id ? 'Updated' : 'Created');
      setOpenForm(false);
      // refresh list if ward filter is set
      if (filters.registration_area) {
        const r = await fetch(`/api/resources/polling-units?by=registration_area&value=${encodeURIComponent(filters.registration_area)}`);
        const jj = await r.json();
        setUnits(jj.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const del = async (id) => {
    clearMsg();
    if (!confirm('Delete this polling unit?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/resources/polling-units/${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!res.ok) return notify('error', j?.message || 'Delete failed');
      notify('success', 'Deleted');
      setUnits((u) => u.filter((x) => x._id !== id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Manage Polling Units</h1>
        <button
          onClick={newRow}
          className="inline-flex items-center gap-2 bg-[#245B9E] text-white px-4 py-2 rounded-md"
        >
          + Add New
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 rounded-md px-3 py-2 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={filters.state}
            onChange={(e) => changeState(e.target.value)}
          >
            <option value="">Select state</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">LGA</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={filters.lga}
            onChange={(e) => changeLga(e.target.value)}
            disabled={!filters.state}
          >
            <option value="">Select LGA</option>
            {lgas.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ward</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={filters.registration_area}
            onChange={(e) => changeWard(e.target.value)}
            disabled={!filters.lga}
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
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">No data</td></tr>
              ) : units.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="px-3 py-2">{u.state}</td>
                  <td className="px-3 py-2">{u.lga}</td>
                  <td className="px-3 py-2">{u.registration_area}</td>
                  <td className="px-3 py-2">{u.polling_unit}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => editRow(u)}
                        className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => del(u._id)}
                        className="px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer-style form */}
      {openForm && (
        <div className="fixed inset-0 bg-black/30 flex justify-end z-40" onClick={() => setOpenForm(false)}>
          <div className="w-full max-w-md bg-white h-full p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{form._id ? 'Edit Polling Unit' : 'Add Polling Unit'}</h2>
              <button className="text-gray-500" onClick={() => setOpenForm(false)}>✕</button>
            </div>

            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">LGA</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={form.lga}
                  onChange={(e) => setForm((f) => ({ ...f, lga: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ward (Registration Area)</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={form.registration_area}
                  onChange={(e) => setForm((f) => ({ ...f, registration_area: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Polling Unit</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={form.polling_unit}
                  onChange={(e) => setForm((f) => ({ ...f, polling_unit: e.target.value }))}
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded border border-gray-300"
                  onClick={() => setOpenForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#245B9E] text-white"
                >
                  {form._id ? 'Update' : 'Create'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
