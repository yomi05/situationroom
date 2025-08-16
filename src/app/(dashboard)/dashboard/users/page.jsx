'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS, ROLE_PERMISSIONS } from '@/lib/rbac';

const emptyForm = {
  _id: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: 'Other',
  disability: false,
  state: '',
  role: 'Guest',
  password: '',
};

export default function UsersAdminPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'Guest';

  const canView = hasPerm(role, PERMS.VIEW_USERS);
  const isAdmin = role === 'Admin';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    setMsg(null); setErr(null);
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || 'Failed to load users');
      setRows(Array.isArray(j.data) ? j.data : []);
    } catch (e) {
      setErr(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (canView) load(); }, [canView]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      [r.firstName, r.lastName, r.email, r.phone, r.role, r.state]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  function startCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }
  function startEdit(u) {
    setForm({
      _id: u._id,
      firstName: u.firstName || '',
      lastName:  u.lastName  || '',
      email:     u.email     || '',
      phone:     u.phone     || '',
      gender:    u.gender    || 'Other',
      disability:Boolean(u.disability),
      state:     u.state     || '',
      role:      u.role      || 'Guest',
      password:  '',
    });
    setModalOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setMsg(null); setErr(null);

    try {
      const payload = { ...form };

      if (!isAdmin) {
        // Non-admin cannot create users or change roles; only PATCH self
        delete payload.role;
        if (!payload._id) throw new Error('Forbidden');
      }

      const method = form._id ? 'PATCH' : 'POST';
      const url = form._id ? `/api/users/${form._id}` : '/api/users';

      // Password rules
      if (!form._id && !payload.password) {
        throw new Error('Password is required for new users');
      }
      if (form._id && !payload.password) delete payload.password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || 'Save failed');

      setMsg(form._id ? 'User updated' : 'User created');
      setModalOpen(false);
      await load();
    } catch (e) {
      setErr(e?.message || 'Save failed');
    }
  }

  async function del(id) {
    if (!isAdmin) return;
    if (!confirm('Delete this user?')) return;
    setMsg(null); setErr(null);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || 'Delete failed');
      setMsg('User deleted');
      await load();
    } catch (e) {
      setErr(e?.message || 'Delete failed');
    }
  }

  if (!canView) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">403 — Not Authorized</div>
        <p className="text-gray-600">You don’t have permission to view Users.</p>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const roleOptions = Object.keys(ROLE_PERMISSIONS);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <div className="flex gap-2">
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="Search name, email, role…"
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          {isAdmin && (
            <button onClick={startCreate} className="rounded-xl border px-3 py-2 hover:bg-gray-50">
              Add User
            </button>
          )}
        </div>
      </div>

      {msg && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{msg}</div>}
      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Role</th>
              <th className="p-3">State</th>
              <th className="p-3">Gender</th>
              <th className="p-3">Disability</th>
              <th className="p-3 w-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-6 text-center">Loading…</td></tr>
            ) : filtered.length ? filtered.map(u => (
              <tr key={u._id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{u.firstName} {u.lastName}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.phone}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.state || '—'}</td>
                <td className="p-3">{u.gender || '—'}</td>
                <td className="p-3">{u.disability ? 'Yes' : 'No'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="rounded-lg border px-3 py-1 hover:bg-gray-50" onClick={() => startEdit(u)}>Edit</button>
                    {isAdmin && (
                      <button className="rounded-lg border px-3 py-1 hover:bg-red-50" onClick={() => del(u._id)}>Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8} className="p-6 text-center text-gray-500">No users.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModalOpen(false)} />
          <form onSubmit={save} className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{form._id ? 'Edit User' : 'Add User'}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border px-3 py-1">Close</button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="First name"
                value={form.firstName}
                onChange={e=>setForm(f=>({...f,firstName:e.target.value}))}
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Last name"
                value={form.lastName}
                onChange={e=>setForm(f=>({...f,lastName:e.target.value}))}
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Phone"
                value={form.phone}
                onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  className="rounded-xl border px-3 py-2"
                  value={form.gender}
                  onChange={e=>setForm(f=>({...f,gender:e.target.value}))}
                >
                  <option value="Other">Gender: Other</option>
                  <option value="Male">Gender: Male</option>
                  <option value="Female">Gender: Female</option>
                </select>

                <select
                  className="rounded-xl border px-3 py-2"
                  value={String(form.disability)}
                  onChange={e=>setForm(f=>({...f,disability:e.target.value === 'true'}))}
                >
                  <option value="false">Disability: No</option>
                  <option value="true">Disability: Yes</option>
                </select>
              </div>

              <input
                className="rounded-xl border px-3 py-2"
                placeholder="State"
                value={form.state}
                onChange={e=>setForm(f=>({...f,state:e.target.value}))}
              />

              {/* Role (Admin only) */}
              <select
                className="rounded-xl border px-3 py-2 disabled:opacity-60"
                value={form.role}
                onChange={e=>setForm(f=>({...f,role:e.target.value}))}
                disabled={!isAdmin}
              >
                {Object.keys(ROLE_PERMISSIONS).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Password: required when creating; optional when editing */}
              <input
                className="rounded-xl border px-3 py-2"
                placeholder={form._id ? 'New Password (optional)' : 'Password'}
                type="password"
                value={form.password}
                onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                {...(form._id ? {} : { required: true })}
              />
            </div>

            <button className="rounded-xl border px-4 py-2 hover:bg-gray-50">
              {form._id ? 'Save Changes' : 'Create User'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
