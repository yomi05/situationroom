'use client';

import { useEffect, useRef, useState } from 'react';

export default function IncidentReportPage() {
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [pollingUnits, setPollingUnits] = useState([]);

  const [form, setForm] = useState({
    name: '', gender: 'Male', email: '', phone: '',
    description: '',
    state: '', lga: '', ward: '', pollingunit: '',
    uploads: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const fileInput = useRef(null);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const notify = (type, text) => setMsg({ type, text });

  // Load states on mount
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/resources/polling-units?distinct=state', { cache: 'no-store' });
      const j = await res.json();
      setStates(j.data || []);
    })();
  }, []);

  const onState = async (v) => {
    setField('state', v);
    setLgas([]); setWards([]); setPollingUnits([]);
    setField('lga',''); setField('ward',''); setField('pollingunit','');
    if (!v) return;
    const r = await fetch(`/api/resources/polling-units?by=state&value=${encodeURIComponent(v)}`);
    const j = await r.json();
    setLgas(j.data || []);
  };

  const onLga = async (v) => {
    setField('lga', v);
    setWards([]); setPollingUnits([]);
    setField('ward',''); setField('pollingunit','');
    if (!v) return;
    const r = await fetch(`/api/resources/polling-units?by=lga&value=${encodeURIComponent(v)}`);
    const j = await r.json();
    setWards(j.data || []);
  };

  const onWard = async (v) => {
    setField('ward', v);
    setPollingUnits([]);
    setField('pollingunit','');
    if (!v) return;
    const r = await fetch(`/api/resources/polling-units?by=registration_area&value=${encodeURIComponent(v)}`);
    const j = await r.json();
    setPollingUnits((j.data || []).map((u) => u.polling_unit).filter(Boolean));
  };

  const onFiles = (files) => {
    const arr = Array.from(files || []);
    const ok = arr.filter(f => f.size <= 5 * 1024 * 1024); // 5MB each
    if (ok.length !== arr.length) notify('error', 'Some files exceeded 5MB and were skipped.');
    setField('uploads', ok);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    // minimal client validation
    const required = ['name','gender','email','phone','description','state','lga','ward','pollingunit'];
    for (const k of required) if (!form[k]) {
      notify('error', `Please fill ${k}.`);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('gender', form.gender);
      fd.append('email', form.email.toLowerCase().trim());
      fd.append('phone', form.phone.trim());
      fd.append('description', form.description); // plain text or HTML
      fd.append('state', form.state);
      fd.append('lga', form.lga);
      fd.append('ward', form.ward);
      fd.append('pollingunit', form.pollingunit);
      for (const f of form.uploads) fd.append('uploads', f, f.name);

      const res = await fetch('/api/incident-reports', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) {
        notify('error', j?.message || 'Failed to submit');
        return;
      }
      notify('success', 'Report submitted successfully');
      setForm({
        name: '', gender: 'Male', email: '', phone: '',
        description: '',
        state: '', lga: '', ward: '', pollingunit: '',
        uploads: [],
      });
      if (fileInput.current) fileInput.current.value = '';
    } catch (e2) {
      notify('error', 'Network error, try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Incident Report</h1>

      {msg.text && (
        <div className={`mb-4 rounded-md px-3 py-2 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={submit} className="bg-white border rounded-xl p-5 shadow-sm space-y-4 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input className="w-full border rounded-md px-3 py-2"
                   value={form.name} onChange={(e)=>setField('name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select className="w-full border rounded-md px-3 py-2"
                    value={form.gender} onChange={(e)=>setField('gender', e.target.value)} required>
              {['Male','Female','Other'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="w-full border rounded-md px-3 py-2"
                   value={form.email} onChange={(e)=>setField('email', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input type="tel" className="w-full border rounded-md px-3 py-2"
                   value={form.phone} onChange={(e)=>setField('phone', e.target.value)} required placeholder="+2348012345678" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">State</label>
            <select className="w-full border rounded-md px-3 py-2" value={form.state} onChange={(e)=>onState(e.target.value)} required>
              <option value="">Select state</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">LGA</label>
            <select className="w-full border rounded-md px-3 py-2" value={form.lga}
                    onChange={(e)=>onLga(e.target.value)} disabled={!form.state} required>
              <option value="">Select LGA</option>
              {lgas.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Ward</label>
            <select className="w-full border rounded-md px-3 py-2" value={form.ward}
                    onChange={(e)=>onWard(e.target.value)} disabled={!form.lga} required>
              <option value="">Select Ward</option>
              {wards.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Polling Unit</label>
            <select className="w-full border rounded-md px-3 py-2" value={form.pollingunit}
                    onChange={(e)=>setField('pollingunit', e.target.value)} disabled={!form.ward} required>
              <option value="">Select Polling Unit</option>
              {pollingUnits.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description <span className="text-gray-500">(include exact location / PU)</span>
          </label>
          <textarea rows={6} className="w-full border rounded-md px-3 py-2"
                    value={form.description} onChange={(e)=>setField('description', e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">File Uploads (max 5MB each)</label>
          <input ref={fileInput} type="file" multiple accept="image/*,application/pdf"
                 onChange={(e)=>onFiles(e.target.files)} />
          {form.uploads?.length > 0 && (
            <p className="text-xs text-gray-600 mt-1">{form.uploads.length} file(s) selected</p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#245B9E] text-white px-5 py-2 rounded-md disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
