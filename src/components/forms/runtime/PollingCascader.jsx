'use client';
import { useEffect, useState } from 'react';

const baseCls = 'w-full border rounded-md px-3 py-2';

export default function PollingCascader({
  onChange,
  initial = {},
  required = false,
  brand = '#245B9E',
}) {
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [units, setUnits] = useState([]);

  const [stateV, setStateV] = useState(initial.state || '');
  const [lgaV, setLgaV] = useState(initial.lga || '');
  const [wardV, setWardV] = useState(initial.ward || '');
  const [unitV, setUnitV] = useState(initial.polling_unit || '');

  // Sync when parent changes initial (e.g., editing a submission)
  useEffect(() => {
    setStateV(initial.state || '');
    setLgaV(initial.lga || '');
    setWardV(initial.ward || '');
    setUnitV(initial.polling_unit || '');
  }, [initial.state, initial.lga, initial.ward, initial.polling_unit]);

  // Load States
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/resources/polling-units?distinct=state', { cache: 'no-store' });
      const j = await r.json();
      const list = Array.isArray(j?.data) ? j.data.slice().sort((a,b)=>String(a).localeCompare(String(b))) : [];
      setStates(list);
    })();
  }, []);

  const changeState = async (s) => {
    setStateV(s);
    setLgaV(''); setWardV(''); setUnitV('');
    setLgas([]); setWards([]); setUnits([]);

    onChange?.({ state: s, lga: '', ward: '', polling_unit: '' });
    if (!s) return;

    const r = await fetch(`/api/resources/polling-units?by=state&value=${encodeURIComponent(s)}`, { cache:'no-store' });
    const j = await r.json();
    const list = Array.isArray(j?.data) ? j.data.slice().sort((a,b)=>String(a).localeCompare(String(b))) : [];
    setLgas(list);
  };

  const changeLga = async (l) => {
    setLgaV(l);
    setWardV(''); setUnitV('');
    setWards([]); setUnits([]);

    onChange?.({ state: stateV, lga: l, ward: '', polling_unit: '' });
    if (!l) return;

    const r = await fetch(`/api/resources/polling-units?by=lga&value=${encodeURIComponent(l)}`, { cache:'no-store' });
    const j = await r.json();
    const list = Array.isArray(j?.data) ? j.data.slice().sort((a,b)=>String(a).localeCompare(String(b))) : [];
    setWards(list);
  };

  const changeWard = async (w) => {
    setWardV(w);
    setUnitV('');
    setUnits([]);

    onChange?.({ state: stateV, lga: lgaV, ward: w, polling_unit: '' });
    if (!w) return;

    const r = await fetch(`/api/resources/polling-units?by=ward&value=${encodeURIComponent(w)}`, { cache:'no-store' });
    const j = await r.json();
    // when by=ward returns full docs, map to unique polling units
    const list = Array.isArray(j?.data)
      ? Array.from(new Set(j.data.map(x => x?.polling_unit).filter(Boolean)))
          .sort((a,b)=>String(a).localeCompare(String(b)))
      : [];
    setUnits(list);
  };

  const changeUnit = (u) => {
    setUnitV(u);
    onChange?.({ state: stateV, lga: lgaV, ward: wardV, polling_unit: u });
  };

  const cls = (disabled) =>
    `${baseCls} ${disabled ? 'opacity-75' : ''}`;

  const req = !!required;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <select
        className={cls(false)}
        value={stateV}
        onChange={(e)=>changeState(e.target.value)}
        required={req}
        style={{ borderColor: brand }}
      >
        <option value="">{req ? 'State *' : 'State'}</option>
        {states.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <select
        className={cls(!stateV)}
        value={lgaV}
        onChange={(e)=>changeLga(e.target.value)}
        disabled={!stateV}
        required={req}
        style={{ borderColor: brand }}
      >
        <option value="">{stateV ? (req ? 'LGA *' : 'LGA') : 'Choose state first'}</option>
        {lgas.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>

      <select
        className={cls(!lgaV)}
        value={wardV}
        onChange={(e)=>changeWard(e.target.value)}
        disabled={!lgaV}
        required={req}
        style={{ borderColor: brand }}
      >
        <option value="">{lgaV ? (req ? 'Ward *' : 'Ward') : 'Choose LGA first'}</option>
        {wards.map((w) => <option key={w} value={w}>{w}</option>)}
      </select>

      <select
        className={cls(!wardV)}
        value={unitV}
        onChange={(e)=>changeUnit(e.target.value)}
        disabled={!wardV}
        required={req}
        style={{ borderColor: brand }}
      >
        <option value="">{wardV ? (req ? 'Polling Unit *' : 'Polling Unit') : 'Choose ward first'}</option>
        {units.map((u) => <option key={u} value={u}>{u}</option>)}
      </select>
    </div>
  );
}
