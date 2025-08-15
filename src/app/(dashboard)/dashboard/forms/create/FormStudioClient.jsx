'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FormBuilder from '@/components/forms/FormBuilder';
import EntriesTable from '@/components/forms/EntriesTable';
import Reports from '@/components/forms/Reports';

const TABS = ['Design Form', 'Entries', 'Settings', 'Reports'];
const BRAND = '#245B9E';

export default function FormStudioClient() {
  const sp = useSearchParams();
  const formKeyFromQs = sp.get('key') || null;     // read inside Suspense-enabled client

  const [active, setActive] = useState('Design Form');
  const [loading, setLoading] = useState(!!formKeyFromQs);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [form, setForm] = useState({
    form_name: '',
    form_description: '',
    status: 'Active',
    is_editable: 0,
    is_pollingform: 0,
    is_template: 0,
    is_loggedin: false,
    fields: [],
    form_key: formKeyFromQs,   // initialize from QS
  });

  // keep latest state ref to avoid stale closures in async
  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  // If the URL key changes, update local state + refetch
  useEffect(() => {
    if (formKeyFromQs && form.form_key !== formKeyFromQs) {
      setForm((x) => ({ ...x, form_key: formKeyFromQs }));
    }
  }, [formKeyFromQs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch when we have a key
  useEffect(() => {
    if (!formKeyFromQs) return;
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setMsg(null);
      try {
        const res = await fetch(`/api/forms/${formKeyFromQs}`, {
          cache: 'no-store',
          signal: ac.signal,
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.message || 'Failed to load form');

        const fields = Array.isArray(j.fields)
          ? [...j.fields].sort((a, b) => (a.field_order ?? 0) - (b.field_order ?? 0))
          : [];

        setForm({
          form_name: j.form_name || '',
          form_description: j.form_description || '',
          status: j.status || 'Active',
          is_editable: j.is_editable ?? 0,
          is_pollingform: j.is_pollingform ?? 0,
          is_template: j.is_template ?? 0,
          is_loggedin: !!j.is_loggedin,
          fields,
          form_key: j.form_key,
          _id: j._id,
        });
      } catch (e) {
        if (e.name !== 'AbortError') {
          setMsg({ kind: 'error', text: e.message || 'Failed to load form' });
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [formKeyFromQs]);

  const onChange = (patch) => setForm((x) => ({ ...x, ...patch }));

  const payloadFromState = (state) => ({
    form_name: state.form_name.trim(),
    form_description: state.form_description,
    status: state.status,
    is_editable: state.is_editable,
    is_pollingform: state.is_pollingform,
    is_template: state.is_template,
    is_loggedin: !!state.is_loggedin,
    fields: (state.fields || []).map((f, i) => ({ ...f, field_order: i })),
  });

  const save = async (e) => {
    e?.preventDefault();
    const s = formRef.current;

    const trimmedName = s.form_name.trim();
    if (!trimmedName) {
      setMsg({ kind: 'error', text: 'Form name is required.' });
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      if (!s.form_key) {
        // create
        const res = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            form_name: trimmedName,
            form_description: s.form_description,
            is_pollingform: s.is_pollingform,
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.message || 'Create failed');

        const newKey = j?.data?.form_key;
        if (!newKey) throw new Error('Create succeeded but no form_key returned');

        // patch after create with full payload
        const res2 = await fetch(`/api/forms/${newKey}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadFromState({ ...s, form_key: newKey })),
        });
        const j2 = await res2.json();
        if (!res2.ok) throw new Error(j2?.message || 'Save failed');

        setForm((x) => ({ ...x, form_key: newKey, _id: j2?.data?._id }));
        setMsg({ kind: 'success', text: 'Created' });
      } else {
        // update
        const res = await fetch(`/api/forms/${s.form_key}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadFromState(s)),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.message || 'Save failed');
        setMsg({ kind: 'success', text: 'Updated' });
      }
    } catch (e) {
      setMsg({ kind: 'error', text: e.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  // Disable tabs that need a saved key
  const entriesDisabled = !form.form_key;
  const reportsDisabled = !form.form_key;

  // If user clicks a disabled tab, keep active and show info
  const onTabClick = (t) => {
    if ((t === 'Entries' || t === 'Reports') && !form.form_key) {
      setMsg({ kind: 'error', text: 'Please save the form first.' });
      return;
    }
    setActive(t);
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
          onChange={(e) => onChange({ form_name: e.target.value })}
          required
        />
        <textarea
          rows={2}
          className="mt-2 w-full text-sm text-gray-700 outline-none border-b pb-1"
          style={{ borderColor: BRAND }}
          placeholder="Short description (optional)"
          value={form.form_description}
          onChange={(e) => onChange({ form_description: e.target.value })}
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
            {saving ? 'Saving…' : (form.form_key ? 'Update' : 'Create')}
          </button>
        </div>
      </form>

      {/* Tabs */}
      <div className="border-b mb-4 flex gap-6">
        {TABS.map((t) => {
          const isDisabled =
            (t === 'Entries' && entriesDisabled) ||
            (t === 'Reports' && reportsDisabled);
          const isActive = active === t;
          return (
            <button
              key={t}
              onClick={() => onTabClick(t)}
              className={`pb-2 -mb-[1px] ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={
                isActive
                  ? { borderBottom: `2px solid ${BRAND}`, color: BRAND }
                  : { color: '#6b7280' }
              }
              type="button"
            >
              {t}
            </button>
          );
        })}
      </div>

      {msg && (
        <div
          className={`mb-4 rounded-md px-3 py-2 text-sm ${
            msg.kind === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}
          role="status"
          aria-live="polite"
        >
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
              onChange={(patch) => setForm((x) => ({ ...x, ...patch }))}
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
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, is_loggedin: e.target.checked })}
                  />
                  Require Login to Submit
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.is_template}
                    onChange={(e) => setForm({ ...form, is_template: e.target.checked ? 1 : 0 })}
                  />
                  Is Template
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.is_editable}
                    onChange={(e) => setForm({ ...form, is_editable: e.target.checked ? 1 : 0 })}
                  />
                  Allow Edit After Submit
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.is_pollingform}
                    onChange={(e) => setForm({ ...form, is_pollingform: e.target.checked ? 1 : 0 })}
                  />
                  Is Polling Form
                </label>
              </div>
              <button
                className="px-4 py-2 rounded-md text-white"
                style={{ background: BRAND }}
                onClick={save}
                disabled={saving}
                type="button"
              >
                {saving ? 'Saving…' : (form.form_key ? 'Update' : 'Create')}
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
