'use client';

import { useEffect, useMemo, useState } from 'react';

export default function Reports({ formKey, form }) {
  const [rows, setRows] = useState([]);
  const [pct, setPct] = useState(false);      // show percentages
  const [chart, setChart] = useState('bar');  // bar | column (simple toggle look)

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/submissions/${formKey}`, { cache: 'no-store' });
      const j = await res.json();
      setRows(Array.isArray(j) ? j : []);
    })();
  }, [formKey]);

  const dataByField = useMemo(() => {
    const map = {};
    const fields = (form.fields || []).filter((f) =>
      ['Radio','Select','Checkbox','State','Lga','Ward','Polling-Unit','Text'].includes(f.field_type)
    );

    for (const f of fields) {
      map[f.field_id] = { field: f, counts: new Map(), total: 0 };
    }
    for (const r of rows) {
      for (const it of (r.submission_value || [])) {
        const bucket = map[it.field_id];
        if (!bucket) continue;
        const raw = it.field_value;
        const vals = Array.isArray(raw) ? raw : String(raw ?? '').split(',').map(s=>s.trim()).filter(Boolean);
        if (vals.length === 0) continue;
        for (const v of vals) {
          bucket.counts.set(v, (bucket.counts.get(v) || 0) + 1);
          bucket.total += 1;
        }
      }
    }
    return map;
  }, [rows, form.fields]);

  const cards = Object.values(dataByField);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button className="px-3 py-2 rounded-md border" onClick={()=>setChart((c)=> c==='bar' ? 'column' : 'bar')}>
          Change Chart Type
        </button>
        <button className="px-3 py-2 rounded-md border" onClick={()=>setPct(p=>!p)}>
          {pct ? 'Show Counts' : 'Show Percentages'}
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="text-gray-500">No chartable fields.</div>
      ) : (
        <div className="space-y-8">
          {cards.map(({ field, counts, total }) => (
            <div key={field.field_id}>
              <h3 className="font-medium mb-2">{field.field_name}</h3>
              <Chart counts={counts} total={total} pct={pct} mode={chart} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chart({ counts, total, pct, mode }) {
  const entries = Array.from(counts.entries());
  const max = Math.max(1, ...entries.map(([,v]) => v));
  return (
    <div className={`w-full overflow-x-auto ${mode==='bar' ? 'h-56' : ''} border rounded-lg p-3`}>
      <div className={`flex ${mode==='bar' ? 'items-end h-full gap-3' : 'flex-col gap-2'}`}>
        {entries.map(([label, value]) => {
          const perc = Math.round((value / Math.max(1,total)) * 100);
          const h = Math.max(6, Math.round((value / max) * 180)); // px
          return (
            <div key={label} className={`${mode==='bar' ? 'flex flex-col items-center w-12' : ''}`}>
              {mode==='bar' ? (
                <>
                  <div className="w-full bg-gray-200 rounded-sm" style={{ height: `${h}px` }} title={`${label}: ${value}`}>
                    <div className="h-full w-full" />
                  </div>
                  <div className="text-xs mt-1 rotate-45 origin-top-left whitespace-nowrap">{label}</div>
                  <div className="text-xs text-gray-600">{pct ? `${perc}%` : value}</div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-40 truncate">{label}</div>
                  <div className="flex-1 bg-gray-200 rounded-sm h-3">
                    <div className="h-3 rounded-sm" style={{ width: `${pct ? perc : (value/max*100)}%` }} />
                  </div>
                  <div className="text-xs w-12 text-right">{pct ? `${perc}%` : value}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
