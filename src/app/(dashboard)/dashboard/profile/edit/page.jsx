'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { NIGERIA_STATES } from '@/lib/constants/nigeriaStates';

const GENDERS = ['Male','Female','Other'];

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', gender: 'Other', disability: false, state: ''
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load profile');
        if (mounted) {
          const u = data.data;
          setForm({
            firstName: u.firstName || '',
            lastName:  u.lastName || '',
            phone:     u.phone || '',
            gender:    u.gender || 'Other',
            disability: !!u.disability,
            state:     u.state || '',
          });
        }
      } catch (e) {
        toast.error(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const set = useCallback((k, v) => setForm(prev => ({ ...prev, [k]: v })), []);
  const markTouched = useCallback((k) => setTouched(t => ({ ...t, [k]: true })), []);

  const validate = useCallback(() => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required';
    if (!form.phone.trim())     e.phone     = 'Phone is required';
    else if (!/^\+?[0-9]{7,15}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number';
    if (form.state && !NIGERIA_STATES.includes(form.state)) e.state = 'Invalid state';
    if (form.gender && !GENDERS.includes(form.gender)) e.gender = 'Invalid gender';
    return e;
  }, [form]);

  const inputClass = (name) =>
    `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#245B9E] ${
      touched[name] && errors[name] ? 'border-red-500' : 'border-gray-300'
    }`;

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    setTouched({ firstName: true, lastName: true, phone: true, gender: true, state: true });
    if (Object.keys(v).length) { toast.error(Object.values(v)[0]); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || 'Update failed');
        setErrors(data?.errors || {});
        return;
      }
      toast.success('Profile updated');
      router.push('/dashboard/profile');
    } catch (e) {
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Edit profile</h1>
        <Link href="/dashboard/profile" className="text-[#245B9E] underline text-sm">Back to profile</Link>
      </div>

      <form onSubmit={submit} className="bg-white border rounded-xl p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="firstName">First name</label>
            <input
              id="firstName" className={inputClass('firstName')}
              value={form.firstName}
              onChange={(e)=>set('firstName', e.target.value)}
              onBlur={()=>markTouched('firstName')}
              required
            />
            {touched.firstName && errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="lastName">Last name</label>
            <input
              id="lastName" className={inputClass('lastName')}
              value={form.lastName}
              onChange={(e)=>set('lastName', e.target.value)}
              onBlur={()=>markTouched('lastName')}
              required
            />
            {touched.lastName && errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone</label>
          <input
            id="phone" className={inputClass('phone')}
            value={form.phone}
            onChange={(e)=>set('phone', e.target.value)}
            onBlur={()=>markTouched('phone')}
            placeholder="+2348012345678"
            required
          />
          {touched.phone && errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="gender">Gender</label>
            <select
              id="gender" className={inputClass('gender')}
              value={form.gender}
              onChange={(e)=>set('gender', e.target.value)}
              onBlur={()=>markTouched('gender')}
            >
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {touched.gender && errors.gender && <p className="text-red-600 text-xs mt-1">{errors.gender}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="state">State</label>
            <select
              id="state" className={inputClass('state')}
              value={form.state}
              onChange={(e)=>set('state', e.target.value)}
              onBlur={()=>markTouched('state')}
            >
              <option value="">Select state</option>
              {NIGERIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {touched.state && errors.state && <p className="text-red-600 text-xs mt-1">{errors.state}</p>}
          </div>
        </div>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-[#245B9E]"
            checked={form.disability}
            onChange={(e)=>set('disability', e.target.checked)}
          />
          <span className="text-sm">Disability</span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#245B9E] text-white rounded disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <Link href="/dashboard/profile" className="px-4 py-2 border rounded">
            Cancel
          </Link>
        </div>
      </form>

      {/* Optional: inline password change */}
      <PasswordCard />
    </div>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState({ cur:false, nw:false, cf:false });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.newPassword || form.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match');

    setSaving(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Update failed');
      toast.success('Password updated');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#245B9E] border-gray-300';

  return (
    <div className="bg-white border rounded-xl p-4 mt-6">
      <h2 className="font-semibold mb-3">Change password</h2>
      <form onSubmit={submit} className="grid gap-3">
        <div className="relative">
          <label className="block text-sm font-medium mb-1" htmlFor="cur">Current password</label>
          <input id="cur" type={show.cur ? 'text':'password'} className={input}
            value={form.currentPassword} onChange={e=>setForm(f=>({...f, currentPassword:e.target.value}))} />
          <button type="button" className="absolute right-3 top-9 text-gray-500" onClick={()=>setShow(s=>({...s, cur:!s.cur}))}>👁</button>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium mb-1" htmlFor="nw">New password</label>
          <input id="nw" type={show.nw ? 'text':'password'} className={input}
            value={form.newPassword} onChange={e=>setForm(f=>({...f, newPassword:e.target.value}))} />
          <button type="button" className="absolute right-3 top-9 text-gray-500" onClick={()=>setShow(s=>({...s, nw:!s.nw}))}>👁</button>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium mb-1" htmlFor="cf">Confirm password</label>
          <input id="cf" type={show.cf ? 'text':'password'} className={input}
            value={form.confirm} onChange={e=>setForm(f=>({...f, confirm:e.target.value}))} />
          <button type="button" className="absolute right-3 top-9 text-gray-500" onClick={()=>setShow(s=>({...s, cf:!s.cf}))}>👁</button>
        </div>
        <div>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-[#245B9E] text-white rounded disabled:opacity-60">
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
}
