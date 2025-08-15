'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FormBuilder from '@/components/forms/FormBuilder';
import EntriesTable from '@/components/forms/EntriesTable';
import Reports from '@/components/forms/Reports';

const TABS = ['Design Form', 'Entries', 'Settings', 'Reports'];
const BRAND = '#245B9E';

export default function FormStudioPage() {
  const sp = useSearchParams();
  const formKey = sp.get('key');
  const [active, setActive] = useState('Design Form');

  const [loading, setLoading] = useState(!!formKey);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [form, setForm] = useState({
    form_name: '',
    form_description: '',
    status: 'Active',
    is_editable: 0,
    is_pollingform: 0,        // NEW
    is_template: 0,
    is_loggedin: false,
    fields: [],
    form_key: formKey || null,
  });

  useEffect(() => {
    if (!formKey) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/forms/${formKey}`, { cache: 'no-store' });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.message || 'Failed to load form');
        setForm({
          form_name: j.form_name || '',
          form_description: j.form_description || '',
          status: j.status || 'Active',
          is_editable: j.is_editable ?? 0,
          is_pollingform: j.is_pollingform ?? 0,  // NEW
          is_template: j.is_template ?? 0,
          is_loggedin: !!j.is_loggedin,
          fields: Array.isArray(j.fields)
            ? j.fields.sort((a,b)=>(a.field_order??0)-(b.field_order??0))
            : [],
          form_key: j.form_key,
          _id: j._id,
        });
      } catch (e) {
        setMsg({ kind: 'error', text: e.message });
      } finally {
        setLoading(false);
      }
    })();
  }, [formKey]);

  const onChange = (patch) => setForm((x) => ({ ...x, ...patch }));

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      if (!form.form_key) {
        // create
        const res = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            form_name: form.form_name.trim(),
            form_description: form.form_description,
            is_pollingform: form.is_pollingform, // NEW
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.message || 'Create failed');
        const newKey = j?.data?.form_key;

        // patch after create
        const res2 = await fetch(`/api/forms/${newKey}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: form.status,
            is_editable: form.is_editable,
            is_pollingform: form.is_pollingform, // NEW
            is_template: form.is_template,
            is_loggedin: !!form.is_loggedin,
            fields: form.fields.map((f,i)=>({ ...f, field_order: i })),
          }),
        });
        const j2 = await res2.json();
        if (!res2.ok) throw new Error(j2?.message || 'Save failed');
        setForm((x) => ({ ...x, form_key: newKey, _id: j2?.data?._id }));
        setMsg({ kind: 'success', text: 'Created' });
      } else {
        // update
        const res = await fetch(`/api/forms/${form.form_key}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            form_name: form.form_name.trim(),
            form_description: form.form_description,
            status: form.status,
            is_editable: form.is_editable,
            is_pollingform: form.is_pollingform, // NEW
            is_template: form.is_template,
            is_loggedin: !!form.is_loggedin,
            fields: form.fields.map((f,i)=>({ ...f, field_order: i })),
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.message || 'Save failed');
        setMsg({ kind: 'success', text: 'Updated' });
      }
    } catch (e) {
      setMsg({ kind: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Name + description */}
      <form onSubmit={save} className="mb-4">
        <input
          className="w-full text-2xl font-semibold outline-none border-b pb-1"
          style={{ borderColor: BRAND }}
          placeholder="Untitled form"
          value={form.form_name}
          onChange={(e)=>onChange({ form_name: e.target.value })}
          required
        />
        <textarea
          rows={2}
          className="mt-2 w-full text-sm text-gray-700 outline-none border-b pb-1"
          style={{ borderColor: BRAND }}
          placeholder="Short description (optional)"
          value={form.form_description}
          onChange={(e)=>onChange({ form_description: e.target.value })}
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500">
            {form.form_key
              ? <>Key: <span className="font-mono">{form.form_key}</span></>
              : 'Not saved yet'}
          </p>
          <button
            className="px-4 py-2 rounded-md text-white"
            style={{ background: BRAND }}
            disabled={saving || !form.form_name.trim()}
          >
            {saving ? 'Saving…' : 'Update'}
          </button>
        </div>
      </form>

      {/* Tabs */}
      <div className="border-b mb-4 flex gap-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className="pb-2 -mb-[1px]"
            style={active===t
              ? { borderBottom: `2px solid ${BRAND}`, color: BRAND }
              : { color: '#6b7280' }}
          >
            {t}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mb-4 rounded-md px-3 py-2 text-sm ${
          msg.kind==='error'
            ? 'bg-red-50 text-red-700'
            : 'bg-green-50 text-green-700'
        }`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-gray-600">Loading…</div>
      ) : (
        <>
          {active === 'Design Form' && (
            <FormBuilder
              form={form}
              onChange={(patch)=>setForm((x)=>({ ...x, ...patch }))}
              onSave={save}
              brand={BRAND}
            />
          )}
          {active === 'Entries' && form.form_key && (
            <EntriesTable formKey={form.form_key} form={form} />
          )}
          {active === 'Settings' && (
            <div className="bg-white border rounded-xl p-5 shadow-sm max-w-3xl space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={form.status}
                  onChange={(e)=>setForm({...form, status: e.target.value})}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.is_loggedin}
                    onChange={(e)=>setForm({...form, is_loggedin: e.target.checked})}
                  />
                  Require Login to Submit
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.is_template}
                    onChange={(e)=>setForm({...form, is_template: e.target.checked?1:0})}
                  />
                  Is Template
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.is_editable}
                    onChange={(e)=>setForm({...form, is_editable: e.target.checked?1:0})}
                  />
                  Allow Edit After Submit
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.is_pollingform}
                    onChange={(e)=>setForm({...form, is_pollingform: e.target.checked?1:0})}
                  />
                  Is Polling Form
                </label>
              </div>
              <button
                className="px-4 py-2 rounded-md text-white"
                style={{ background: BRAND }}
                onClick={save}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Update'}
              </button>
            </div>
          )}
          {active === 'Reports' && form.form_key && (
            <Reports formKey={form.form_key} form={form} />
          )}
        </>
      )}
    </div>
  );
}
