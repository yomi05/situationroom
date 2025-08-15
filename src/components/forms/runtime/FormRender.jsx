'use client';
import { useMemo, useState } from 'react';
import PollingCascader from './PollingCascader';

export default function FormRender({ form }) {
  const [vals, setVals] = useState({});
  const set = (id, value) => setVals(v => ({ ...v, [id]: value }));

  const fields = useMemo(
    () => (form.fields || []).slice().sort((a,b)=> (a.field_order??0)-(b.field_order??0)),
    [form.fields]
  );

  const submit = async (e) => {
    e.preventDefault();

    const field_values = Object.entries(vals).map(([id, v]) => ({
      field_id: id,
      field_value: v
    }));

    const res = await fetch(`/api/submissions/${form.slug || form.form_key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_name: String(field_values[0]?.field_value || ''),
        field_values
      })
    });
    const j = await res.json();
    alert(j.message || 'Submitted');
  };

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">{form.form_name}</h1>
      {form.form_description && <p className="text-gray-600">{form.form_description}</p>}

      {fields.map(f => (
        <div key={f.field_key} className="border rounded-lg p-3">
          <label className="block text-sm font-medium mb-1">
            {f.field_name}{f.required ? ' *' : ''}
          </label>
          <Field
            field={f}
            value={vals[f.field_id]}
            onChange={(v)=>set(f.field_id, v)}
          />
          {f.help_text ? <div className="text-xs text-gray-500 mt-1">{f.help_text}</div> : null}
        </div>
      ))}

      <button className="px-4 py-2 rounded-md text-white" style={{ background: '#245B9E' }}>
        Submit
      </button>
    </form>
  );
}

function Field({ field, value, onChange }) {
  const cls = 'w-full border rounded-md px-3 py-2';

  switch (field.field_type) {
    case 'Text':
      return (
        <input
          className={cls}
          value={value || ''}
          onChange={(e)=>onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          required={!!field.required}
        />
      );

    case 'Password':
      return (
        <input
          type="password"
          className={cls}
          value={value || ''}
          onChange={(e)=>onChange(e.target.value)}
          required={!!field.required}
        />
      );

    case 'Number':
      return (
        <input
          type="number"
          className={cls}
          value={value || ''}
          onChange={(e)=>onChange(e.target.value)}
          min={field.min}
          max={field.max}
          required={!!field.required}
        />
      );

    case 'Date':
      return (
        <input
          type="date"
          className={cls}
          value={value || ''}
          onChange={(e)=>onChange(e.target.value)}
          required={!!field.required}
        />
      );

    case 'Select':
      return (
        <select
          className={cls}
          value={value || (field.multiple ? [] : '')}
          onChange={(e)=>onChange(field.multiple
            ? Array.from(e.target.selectedOptions).map(o=>o.value)
            : e.target.value)}
          multiple={!!field.multiple}
          required={!!field.required}
        >
          {!field.multiple && <option value="">{field.placeholder || 'Select…'}</option>}
          {(field.attributes||[]).map((a,i)=><option key={i} value={a.value}>{a.value}</option>)}
        </select>
      );

    case 'Radio':
      return (
        <div className="flex flex-col gap-1">
          {(field.attributes||[]).map((a,i)=>(
            <label key={i} className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={value===a.value}
                onChange={()=>onChange(a.value)}
                required={!!field.required}
              /> {a.value}
            </label>
          ))}
        </div>
      );

    case 'Checkbox': {
      const arr = Array.isArray(value) ? value : [];
      const toggle = (v) => onChange(arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v]);
      return (
        <div className="flex flex-wrap gap-3">
          {(field.attributes||[]).map((a,i)=>(
            <label key={i} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={arr.includes(a.value)}
                onChange={()=>toggle(a.value)}
              /> {a.value}
            </label>
          ))}
        </div>
      );
    }

    // ✅ Single Polling-Unit field → runtime cascader
    case 'Polling-Unit':
      return (
        <PollingCascader
          initial={value || {}}
          onChange={onChange} // expects object {state,lga,ward,polling_unit}
          required={!!field.required}
          brand="#245B9E"
        />
      );

    case 'FileUpload':
      // For demo we only store file name; your multipart upload logic can replace it with a URL
      return (
        <input
          type="file"
          className="text-sm"
          onChange={(e)=>onChange(e.target.files?.[0]?.name || '')}
          required={!!field.required}
        />
      );

    default:
      return (
        <input
          className={cls}
          value={value || ''}
          onChange={(e)=>onChange(e.target.value)}
          required={!!field.required}
        />
      );
  }
}
