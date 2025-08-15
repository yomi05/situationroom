'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Email is required');

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Request failed');
      toast.success('If that account exists, we sent an email.');
      // In dev, show the link to help testing
      if (data?.devResetLink) {
        toast((t) => (
          <div className="text-xs break-all">
            Dev reset link:<br />
            <a className="underline" href={data.devResetLink}>Open</a>
          </div>
        ), { duration: 10000 });
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-md bg-white border rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Forgot password</h1>
        <p className="text-sm text-gray-500 mb-4">Enter the email for your account.</p>

        <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#245B9E]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-4 bg-[#245B9E] text-white py-2 rounded font-semibold disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>

        <div className="text-sm mt-4">
          <Link href="/auth/login" className="text-[#245B9E]">Back to login</Link>
        </div>
      </form>
    </div>
  );
}
