'use client';

import { v4 as uuidv4 } from 'uuid';
import { useMemo, useState } from 'react';

/* ------------------- Grouped library (with icons + hints) ------------------- */
const GROUPS = [
  {
    name: 'Basics',
    items: [
      { type: 'Text',       icon: '🅣', hint: 'Single line text' },
      { type: 'Number',     icon: '①',  hint: 'Numeric input' },
      { type: 'Password',   icon: '🔒', hint: 'Hidden input' },
      { type: 'Date',       icon: '📅', hint: 'Date picker' },
      { type: 'FileUpload', icon: '⬆',  hint: 'Attach files' },
    ],
  },
  {
    name: 'Choices',
    items: [
      { type: 'Select',   icon: '▾', hint: 'Dropdown' },
      { type: 'Radio',    icon: '◉', hint: 'Single choice' },
      { type: 'Checkbox', icon: '☑', hint: 'Multiple choice' },
    ],
  },
  {
    name: 'Location',
    items: [
      { type: 'Polling-Unit', icon: '📍', hint: 'State → LGA → Ward → PU' },
    ],
  },
];

export default function FormBuilder({ form, onChange, onSave, brand = '#245B9E' }) {
  const [selected, setSelected]   = useState(null);           // field_key
  const [leftTab, setLeftTab]     = useState('Add Fields');   // Add Fields | Field Options
  const [query, setQuery]         = useState('');             // search filter for library

  const fields = useMemo(
    () =>
      (Array.isArray(form.fields)
        ? [...form.fields].sort((a, b) => (a.field_order ?? 0) - (b.field_order ?? 0))
        : []),
    [form.fields]
  );

  /* -------------------------------- helpers -------------------------------- */

  const addSingleField = (type, index = fields.length) => {
    const id = uuidv4();
    const key = uuidv4();
    const newField = {
      field_id: id,
      field_key: key,
      field_name: defaultLabel(type),
      field_type: type,
      field_order: index,
      default_value: '',
      placeholder: '',
      help_text: '',
      required: false,
      attributes: defaultAttributes(type),
      multiple: false,
      accept: '',       // FileUpload
      maxSizeMB: 5,     // FileUpload
      min: '', max: '', // Number
    };
    const next = [...fields];
    next.splice(index, 0, newField);
    normalize(next);
    onChange({ fields: next });
    setSelected(key);
    setLeftTab('Field Options');
  };

  // ✅ Always add a single field (no more 4-item group)
  const addFromType = (type, index) => addSingleField(type, index);

  const removeField = (field_key) => {
    const next = fields.filter((f) => f.field_key !== field_key);
    normalize(next);
    onChange({ fields: next });
    if (selected && !next.find((f) => f.field_key === selected)) setSelected(null);
  };

  const updateField = (field_key, patch) => {
    const next = fields.map((f) => (f.field_key === field_key ? { ...f, ...patch } : f));
    onChange({ fields: next });
  };

  // normalize field_order
  const normalize = (arr) => arr.forEach((f, i) => (f.field_order = i));

  /* ---------------------- DnD: lib→canvas & reorder canvas ------------------ */

  const libDragStart = (e, type) => {
    e.dataTransfer.setData('application/x-lib-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const itemDragStart = (e, index) => {
    e.dataTransfer.setData('application/x-canvas-index', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDropOnCard = (e, index) => {
    e.preventDefault();
    const libType = e.dataTransfer.getData('application/x-lib-type');
    const fromStr = e.dataTransfer.getData('application/x-canvas-index');

    if (libType) {
      addFromType(libType, index);
      return;
    }
    if (fromStr !== '') {
      const from = parseInt(fromStr, 10);
      if (Number.isNaN(from) || from === index) return;
      const next = [...fields];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      normalize(next);
      onChange({ fields: next });
    }
  };

  const onDropCanvasEnd = (e) => {
    e.preventDefault();
    const libType = e.dataTransfer.getData('application/x-lib-type');
    const fromStr = e.dataTransfer.getData('application/x-canvas-index');

    if (libType) {
      addFromType(libType, fields.length);
      return;
    }
    if (fromStr !== '') {
      const from = parseInt(fromStr, 10);
      if (Number.isNaN(from) || from === fields.length - 1) return;
      const next = [...fields];
      const [moved] = next.splice(from, 1);
      next.push(moved);
      normalize(next);
      onChange({ fields: next });
    }
  };

  /* ---------------------------------- UI ----------------------------------- */

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT RAIL */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex gap-4 border-b mb-3">
          {['Add Fields', 'Field Options'].map((tab) => (
            <button
              key={tab}
              onClick={() => setLeftTab(tab)}
              className="pb-2 -mb-[1px]"
              style={leftTab === tab ? { borderBottom: `2px solid ${brand}`, color: brand } : { color: '#6b7280' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {leftTab === 'Add Fields' ? (
          <>
            <input
              className="w-full border rounded-md px-3 py-2 mb-3"
              placeholder="Search fields…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="space-y-4">
              {GROUPS.map((g) => {
                const items = g.items.filter((i) =>
                  (i.type + (i.hint || '')).toLowerCase().includes(query.toLowerCase())
                );
                if (items.length === 0) return null;
                return (
                  <div key={g.name}>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{g.name}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((b) => (
                        <button
                          key={b.type}
                          draggable
                          onDragStart={(e) => libDragStart(e, b.type)}
                          onClick={() => addFromType(b.type)}
                          className="text-left border rounded-lg p-3 hover:bg-gray-50"
                          title={b.hint}
                        >
                          <div className="text-xl">{b.icon}</div>
                          <div className="font-medium">{b.type}</div>
                          <div className="text-xs text-gray-500">{b.hint}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {selected ? (
              <FieldOptions
                field={fields.find((f) => f.field_key === selected)}
                onChange={(patch) => updateField(selected, patch)}
                onDelete={() => removeField(selected)}
                brand={brand}
              />
            ) : (
              <p className="text-sm text-gray-500">Select a field on the canvas to edit its options.</p>
            )}
          </>
        )}
      </div>

      {/* CANVAS */}
      <div
        className="lg:col-span-2 bg-white border rounded-xl p-4 shadow-sm"
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Form Canvas</div>
          <button
            className="px-3 py-1 rounded-md text-white"
            style={{ background: brand }}
            onClick={onSave}
            type="button"
          >
            Save
          </button>
        </div>

        <div className="space-y-3">
          {fields.length === 0 && (
            <div className="border border-dashed rounded-md p-6 text-center text-gray-500">
              Drag from the left (or click) to add fields here.
            </div>
          )}

          {fields.map((f, index) => (
            <div
              key={f.field_key}
              draggable
              onDragStart={(e) => itemDragStart(e, index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropOnCard(e, index)}
              className={`border rounded-lg p-3 cursor-move ${selected === f.field_key ? 'ring-2' : ''}`}
              style={ selected === f.field_key ? { ringColor: brand, boxShadow: `0 0 0 2px ${brand}` } : {} }
              onClick={() => {
                setSelected(f.field_key);
                setLeftTab('Field Options');
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium truncate">
                  {f.field_name}{' '}
                  <span className="text-gray-400">({f.field_type})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-gray-500" title="Drag to reorder" type="button">≡</button>
                  <button
                    className="text-red-500"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeField(f.field_key);
                    }}
                    type="button"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-2">
                <FieldPreview field={f} brand={brand} />
                {f.help_text ? (
                  <div className="text-xs text-gray-500 mt-1">{f.help_text}</div>
                ) : null}
              </div>
            </div>
          ))}

          {/* drop at end */}
          <div
            className="border border-dashed rounded-md p-3 text-center text-gray-400"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDropCanvasEnd}
          >
            Drop here to add at the end
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- field utilities ----------------------------- */

function defaultLabel(type) {
  switch (type) {
    case 'Text':         return 'Text';
    case 'Number':       return 'Number';
    case 'Password':     return 'Password';
    case 'Select':       return 'Select';
    case 'Checkbox':     return 'Checkbox';
    case 'Radio':        return 'Radio';
    case 'Date':         return 'Date';
    case 'FileUpload':   return 'File Upload';
    case 'Polling-Unit': return 'Polling Unit';
    default:             return 'Field';
  }
}

function defaultAttributes(type) {
  if (['Select', 'Checkbox', 'Radio'].includes(type)) {
    return [{ value: 'Option 1' }, { value: 'Option 2' }];
  }
  return [];
}

/* ---------------------------------- preview -------------------------------- */

function FieldPreview({ field, brand }) {
  const cls = 'w-full border rounded-md px-3 py-2';
  switch (field.field_type) {
    case 'Text':
    case 'Password':
      return (
        <input
          type={field.field_type === 'Password' ? 'password' : 'text'}
          className={cls}
          placeholder={field.placeholder || ''}
          readOnly
        />
      );
    case 'Number':
      return <input type="number" className={cls} placeholder={field.placeholder || ''} readOnly />;
    case 'Date':
      return <input type="date" className={cls} readOnly />;
    case 'Select':
      return (
        <select className={cls} readOnly>
          <option value="">{field.placeholder || 'Select…'}</option>
          {(field.attributes || []).map((a, i) => (
            <option key={i} value={a.value}>
              {a.value}
            </option>
          ))}
        </select>
      );
    case 'Checkbox':
      return (
        <div className="flex flex-wrap gap-4">
          {(field.attributes || []).map((a, i) => (
            <label key={i} className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" disabled /> {a.value}
            </label>
          ))}
        </div>
      );
    case 'Radio':
      return (
        <div className="flex flex-col gap-1">
          {(field.attributes || []).map((a, i) => (
            <label key={i} className="inline-flex items-center gap-2 text-sm">
              <input type="radio" disabled /> {a.value}
            </label>
          ))}
        </div>
      );
    case 'FileUpload':
      return <input type="file" disabled className="text-sm" />;
    // ✅ Show a disabled cascader preview for Polling-Unit
    case 'Polling-Unit':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select className={cls} style={{ borderColor: brand }} disabled>
            <option>State…</option>
          </select>
          <select className={cls} style={{ borderColor: brand }} disabled>
            <option>LGA…</option>
          </select>
          <select className={cls} style={{ borderColor: brand }} disabled>
            <option>Ward…</option>
          </select>
          <select className={cls} style={{ borderColor: brand }} disabled>
            <option>Polling Unit…</option>
          </select>
        </div>
      );
    default:
      return <input className={cls} readOnly />;
  }
}

/* --------------------------------- options --------------------------------- */

function FieldOptions({ field, onChange, onDelete, brand }) {
  if (!field) return null;
  const setAttr = (arr) => onChange({ attributes: arr });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Label</label>
        <input
          className="w-full border rounded-md px-3 py-2"
          value={field.field_name}
          onChange={(e) => onChange({ field_name: e.target.value })}
        />
      </div>

      {/* Common options */}
      {['Text', 'Number', 'Password', 'Select', 'Radio', 'Checkbox', 'Date', 'Polling-Unit'].includes(field.field_type) && (
        <>
          {field.field_type !== 'Polling-Unit' && (
            <div>
              <label className="block text-sm font-medium mb-1">Placeholder</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={field.placeholder || ''}
                onChange={(e) => onChange({ placeholder: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Help text</label>
            <textarea
              rows={2}
              className="w-full border rounded-md px-3 py-2"
              value={field.help_text || ''}
              onChange={(e) => onChange({ help_text: e.target.value })}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!field.required}
              onChange={(e) => onChange({ required: e.target.checked })}
            />
            Required
          </label>
        </>
      )}

      {/* Number */}
      {field.field_type === 'Number' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm mb-1">Min</label>
            <input
              type="number"
              className="w-full border rounded-md px-3 py-2"
              value={field.min ?? ''}
              onChange={(e) => onChange({ min: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Max</label>
            <input
              type="number"
              className="w-full border rounded-md px-3 py-2"
              value={field.max ?? ''}
              onChange={(e) => onChange({ max: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Select / Radio / Checkbox */}
      {['Select', 'Radio', 'Checkbox'].includes(field.field_type) && (
        <>
          {field.field_type === 'Select' && (
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!field.multiple}
                onChange={(e) => onChange({ multiple: e.target.checked })}
              />
              Allow multiple selection
            </label>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Choices</label>
            <ChoiceEditor attributes={field.attributes || []} setAttributes={setAttr} />
          </div>
        </>
      )}

      {/* FileUpload */}
      {field.field_type === 'FileUpload' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm mb-1">Max size (MB)</label>
            <input
              type="number"
              className="w-full border rounded-md px-3 py-2"
              value={field.maxSizeMB ?? 5}
              onChange={(e) => onChange({ maxSizeMB: Number(e.target.value || 5) })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Allowed types (comma)</label>
            <input
              className="W-full border rounded-md px-3 py-2"
              placeholder="image/*, application/pdf"
              value={field.accept || ''}
              onChange={(e) => onChange({ accept: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="pt-1">
        <button
          className="px-3 py-1 rounded-md text-white"
          style={{ background: brand }}
          onClick={(e) => e.preventDefault()}
          type="button"
        >
          Done
        </button>
        <button
          className="ml-2 px-3 py-1 border border-red-300 text-red-700 rounded-md"
          onClick={onDelete}
          type="button"
        >
          Delete Field
        </button>
      </div>
    </div>
  );
}

function ChoiceEditor({ attributes, setAttributes }) {
  const update = (i, v) => {
    const next = [...attributes];
    next[i] = { value: v };
    setAttributes(next);
  };
  const add = () => setAttributes([...(attributes || []), { value: 'New option' }]);
  const del = (i) => setAttributes(attributes.filter((_, idx) => idx !== i));
  const up = (i) => {
    if (i === 0) return;
    const next = [...attributes];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setAttributes(next);
  };
  const down = (i) => {
    if (i === attributes.length - 1) return;
    const next = [...attributes];
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    setAttributes(next);
  };

  return (
    <div className="space-y-2">
      {(attributes || []).map((a, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className="flex-1 border rounded-md px-3 py-1"
            value={a.value}
            onChange={(e) => update(i, e.target.value)}
          />
          <button className="text-sm" onClick={() => up(i)} type="button">↑</button>
          <button className="text-sm" onClick={() => down(i)} type="button">↓</button>
          <button className="text-red-600 text-sm" onClick={() => del(i)} type="button">✕</button>
        </div>
      ))}
      <button className="px-2 py-1 border rounded-md text-sm" onClick={add} type="button">
        + Add option
      </button>
    </div>
  );
}
