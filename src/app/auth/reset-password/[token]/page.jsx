'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const { token } = useParams(); // raw token from URL
  const router = useRouter();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ token, password: form.password, confirm: form.confirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Reset failed');

      toast.success('Password updated. Please sign in.');
      router.push('/auth/login');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-md bg-white border rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Create a new password</h1>
        <p className="text-sm text-gray-500 mb-4">Use at least 8 characters.</p>

        <label className="block text-sm font-medium mb-1" htmlFor="password">New password</label>
        <div className="relative">
          <input
            id="password"
            type={showPwd ? 'text' : 'password'}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#245B9E]"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button type="button" className="absolute right-3 top-2.5 text-gray-500" onClick={() => setShowPwd(s => !s)}>
            👁
          </button>
        </div>

        <label className="block text-sm font-medium mb-1 mt-4" htmlFor="confirm">Confirm password</label>
        <div className="relative">
          <input
            id="confirm"
            type={showConfirm ? 'text' : 'password'}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#245B9E]"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            required
          />
          <button type="button" className="absolute right-3 top-2.5 text-gray-500" onClick={() => setShowConfirm(s => !s)}>
            👁
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-4 bg-[#245B9E] text-white py-2 rounded font-semibold disabled:opacity-60"
        >
          {submitting ? 'Updating…' : 'Update password'}
        </button>

        <div className="text-sm mt-4">
          <Link href="/auth/login" className="text-[#245B9E]">Back to login</Link>
        </div>
      </form>
    </div>
  );
}
