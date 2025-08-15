'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');

export default function LoginPage() {
  const router = useRouter();
  const qs = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Map NextAuth error codes (if you ever redirect to /auth/error?error=...)
  const authError = useMemo(() => {
    const e = qs.get('error');
    if (!e) return '';
    if (e === 'CredentialsSignin') return 'Invalid email or password';
    return 'Authentication error';
  }, [qs]);

  useEffect(() => {
    if (authError) toast.error(authError);
  }, [authError]);

  const validate = () => {
    const e = {};
    const email = form.email.trim().toLowerCase();
    if (!email) e.email = 'Email is required';
    else if (!emailOk(email)) e.email = 'Enter a valid email';

    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const inputClass = (name) =>
    `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#245B9E] ${
      touched[name] && errors[name] ? 'border-red-500' : 'border-gray-300'
    }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    setTouched({ email: true, password: true });
    if (Object.keys(v).length) {
      toast.error(Object.values(v)[0]);
      return;
    }

    setSubmitting(true);
    try {
      const res = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (res?.ok) {
        router.push('/dashboard');
      } else {
        // res.error is usually "CredentialsSignin" for bad creds
        const msg = res?.error === 'CredentialsSignin'
          ? 'Invalid email or password'
          : res?.error || 'Could not sign in';
        setErrors({ form: msg });
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      setErrors({ form: 'Network error. Please try again.' });
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="bg-[#245B9E] text-white flex flex-col justify-center items-center p-8">
        <h1 className="text-4xl font-bold mb-6 text-center">Hi, Welcome Back!</h1>
        <Link
          href="/incident-report"
          className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full font-medium"
        >
          📢 Report an Incident
        </Link>
      </div>

      <div className="flex flex-col justify-center items-center p-8 bg-white relative">
        <div className="absolute top-6 right-6">
          <Image src="/logo.png" alt="SituationRoom Logo" width={180} height={40} />
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm mt-12 md:mt-0">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign In</h2>
          <p className="text-sm text-gray-500 mb-6">
            New user?{' '}
            <Link href="/auth/register" className="text-[#245B9E] font-medium">
              Create an Account
            </Link>
          </p>

          {errors.form && <p className="text-red-600 text-sm mb-2">{errors.form}</p>}

          <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            className={inputClass('email')}
            required
            autoComplete="email"
          />
          {touched.email && errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}

          <label className="block text-sm font-medium mb-1 mt-4" htmlFor="password">Password</label>
          <div className="relative mb-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              className={inputClass('password')}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              👁
            </button>
          </div>
          {touched.password && errors.password && <p className="text-red-600 text-xs">{errors.password}</p>}

          <div className="flex justify-between text-sm my-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-[#245B9E]" /> Remember me
            </label>
            <Link href="/auth/forgot-password" className="text-pink-500 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#245B9E] hover:bg-[#1a3e70] text-white py-2 rounded-md font-semibold disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
