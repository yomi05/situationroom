'use client';

import { useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import { NIGERIA_STATES } from '@/lib/constants/nigeriaStates';

const genders = ['Male', 'Female', 'Other'];

/** Stable, memoized field wrapper so children don't remount */
const Field = memo(function Field({ name, label, required, error, touched, children }) {
  const hasErr = touched && error;
  return (
    <div className="mb-3">
      <label htmlFor={name} className="block text-sm font-medium text-gray-800 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hasErr && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
});

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirm: '', gender: 'Other', disability: false, state: ''
  });

  const set = useCallback((k, v) => {
    setForm(prev => (prev[k] === v ? prev : { ...prev, [k]: v }));
  }, []);

  const markTouched = useCallback((k) => {
    setTouched(t => (t[k] ? t : { ...t, [k]: true }));
  }, []);

  const inputClass = useCallback((name) =>
    `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#245B9E] ` +
    (touched[name] && errors[name] ? 'border-red-500' : 'border-gray-300')
  , [touched, errors]);

  const validate = useCallback(() => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required';

    const email = form.email.trim().toLowerCase();
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';

    const phone = form.phone.trim();
    if (!phone) e.phone = 'Phone is required';
    else if (!/^\+?[0-9]{7,15}$/.test(phone)) e.phone = 'Enter a valid phone number';

    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';

    if (!form.confirm) e.confirm = 'Confirm your password';
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match';

    if (!form.state) e.state = 'Select a state';
    if (!genders.includes(form.gender)) e.gender = 'Invalid gender';
    return e;
  }, [form]);

  const submit = useCallback(async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    setTouched({
      firstName: true, lastName: true, email: true, phone: true,
      password: true, confirm: true, gender: true, state: true
    });
    if (Object.keys(v).length) {
      toast.error(Object.values(v)[0]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          gender: form.gender,
          disability: !!form.disability,
          state: form.state
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message || 'Registration failed';
        setErrors(prev => ({ ...prev, ...(data?.errors || {}) }));
        toast.error(msg);
        return;
      }

      toast.success('Account created! Signing you in…');

      const login = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false
      });

      if (login?.ok) router.push('/dashboard');
      else router.push('/auth/login');
    } catch (err) {
      console.error(err);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [form, router, validate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-xl bg-white border rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-gray-500 mb-4">
          Already have an account? <Link href="/auth/login" className="text-blue-600">Sign in</Link>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            name="firstName"
            label="First name"
            required
            error={errors.firstName}
            touched={touched.firstName}
          >
            <input
              id="firstName"
              type="text"
              value={form.firstName}
              onChange={(e)=>set('firstName', e.target.value)}
              onBlur={()=>markTouched('firstName')}
              className={inputClass('firstName')}
              placeholder="e.g., Ada"
              autoComplete="given-name"
              required
            />
          </Field>

          <Field
            name="lastName"
            label="Last name"
            required
            error={errors.lastName}
            touched={touched.lastName}
          >
            <input
              id="lastName"
              type="text"
              value={form.lastName}
              onChange={(e)=>set('lastName', e.target.value)}
              onBlur={()=>markTouched('lastName')}
              className={inputClass('lastName')}
              placeholder="e.g., Okafor"
              autoComplete="family-name"
              required
            />
          </Field>
        </div>

        <Field name="email" label="Email" required error={errors.email} touched={touched.email}>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e)=>set('email', e.target.value)}
            onBlur={()=>markTouched('email')}
            className={inputClass('email')}
            placeholder="name@example.com"
            autoComplete="email"
            required
          />
        </Field>

        <Field name="phone" label="Phone" required error={errors.phone} touched={touched.phone}>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e)=>set('phone', e.target.value)}
            onBlur={()=>markTouched('phone')}
            className={inputClass('phone')}
            placeholder="+2348012345678"
            autoComplete="tel"
            required
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field name="password" label="Password" required error={errors.password} touched={touched.password}>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={(e)=>set('password', e.target.value)}
                onBlur={()=>markTouched('password')}
                className={inputClass('password')}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-500 text-sm"
                onClick={()=>setShowPwd(s=>!s)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </Field>

          <Field name="confirm" label="Confirm password" required error={errors.confirm} touched={touched.confirm}>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                value={form.confirm}
                onChange={(e)=>set('confirm', e.target.value)}
                onBlur={()=>markTouched('confirm')}
                className={inputClass('confirm')}
                placeholder="Type it again"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-500 text-sm"
                onClick={()=>setShowConfirm(s=>!s)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field name="gender" label="Gender" error={errors.gender} touched={touched.gender}>
            <select
              id="gender"
              value={form.gender}
              onChange={(e)=>set('gender', e.target.value)}
              onBlur={()=>markTouched('gender')}
              className={inputClass('gender')}
            >
              {genders.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>

          <Field name="state" label="State of Residence" required error={errors.state} touched={touched.state}>
            <select
              id="state"
              value={form.state}
              onChange={(e)=>set('state', e.target.value)}
              onBlur={()=>markTouched('state')}
              className={inputClass('state')}
              required
            >
              <option value="">Select state</option>
              {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <label htmlFor="disability" className="flex items-center gap-2 mt-2 text-sm">
          <input
            id="disability"
            type="checkbox"
            checked={form.disability}
            onChange={(e)=>set('disability', e.target.checked)}
            className="accent-[#245B9E]"
          />
          Disability
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-[#245B9E] text-white py-2 rounded font-semibold disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
