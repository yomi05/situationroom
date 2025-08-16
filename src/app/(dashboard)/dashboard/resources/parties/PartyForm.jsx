'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';

// Client-side soft validation (server does final validation)
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf',
]);
const BLOCKED_EXT = new Set([
  'exe','msi','bat','sh','ps1','apk','dmg','pkg','deb','rpm','bin','com',
  'cmd','scr','jar','msix','msixbundle','appimage'
]);

function getExt(name = '') {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export default function PartyForm({ initial = null, onDone }) {
  const { data: session } = useSession();
  const role = session?.user?.role || 'Guest';
  const canUpdate = hasPerm(role, PERMS.UPDATE_PARTIES);

  const [pp_name, setName] = useState(initial?.pp_name || '');
  const [pp_acronym, setAcronym] = useState(initial?.pp_acronym || '');
  const [pp_founded, setFounded] = useState(initial?.pp_founded || '');
  const [pp_description, setDescription] = useState(initial?.pp_description || '');
  const [preview, setPreview] = useState(initial?.pp_image || null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileRef = useRef(null);

  useEffect(() => {
    setPreview(initial?.pp_image || null);
  }, [initial]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canUpdate) return;

    setLoading(true);
    setErrorMsg('');

    const fd = new FormData();
    fd.append('pp_name', pp_name);
    fd.append('pp_acronym', pp_acronym);
    fd.append('pp_founded', pp_founded);
    fd.append('pp_description', pp_description);

    const file = fileRef.current?.files?.[0];
    if (file) {
      const ext = getExt(file.name);
      if (BLOCKED_EXT.has(ext)) {
        setLoading(false);
        setErrorMsg('This file type is not allowed.');
        return;
      }
      if (!ALLOWED_MIME.has(file.type)) {
        // Browser may omit type; server will enforce validation.
      }
      fd.append('pp_image', file);
    }

    const method = initial?._id ? 'PUT' : 'POST';
    const url = initial?._id ? `/api/parties/${initial._id}` : '/api/parties';

    const res = await fetch(url, { method, body: fd });
    setLoading(false);

    if (res.ok) {
      onDone?.();
    } else {
      const err = await res.json().catch(() => ({}));
      setErrorMsg(err?.message || 'Failed to save party.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!canUpdate && (
        <div className="rounded-lg border p-3 text-sm text-gray-600 bg-gray-50">
          You have read-only access. Contact an administrator if you need update permissions.
        </div>
      )}

      <label className="block">
        <div className="mb-1 text-sm">Party Name</div>
        <input
          className="w-full rounded-xl border px-3 py-2"
          value={pp_name}
          onChange={e => setName(e.target.value)}
          required
          disabled={!canUpdate}
        />
      </label>

      <label className="block">
        <div className="mb-1 text-sm">Acronym</div>
        <input
          className="w-full rounded-xl border px-3 py-2"
          value={pp_acronym}
          onChange={e => setAcronym(e.target.value)}
          required
          disabled={!canUpdate}
        />
      </label>

      <label className="block">
        <div className="mb-1 text-sm">Year Founded</div>
        <input
          className="w-full rounded-xl border px-3 py-2"
          value={pp_founded}
          onChange={e => setFounded(e.target.value)}
          placeholder="e.g., 1998"
          disabled={!canUpdate}
        />
      </label>

      <label className="block">
        <div className="mb-1 text-sm">Logo / File (image, video, or pdf)</div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,application/pdf"
          className="w-full rounded-xl border px-3 py-2"
          onChange={e => {
            const f = e.target.files?.[0];
            if (!f) { setPreview(initial?.pp_image || null); return; }
            const lower = (f.name || '').toLowerCase();
            if (/\.(png|jpg|jpeg|webp|gif|svg)$/.test(lower)) {
              setPreview(URL.createObjectURL(f)); // preview images only
            } else {
              setPreview(null);
            }
          }}
          disabled={!canUpdate}
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="mt-3 h-16 w-16 object-cover rounded-md border" />
        )}
      </label>

      <label className="block">
        <div className="mb-1 text-sm">Description</div>
        <textarea
          rows={4}
          className="w-full rounded-xl border px-3 py-2"
          value={pp_description}
          onChange={e => setDescription(e.target.value)}
          disabled={!canUpdate}
        />
      </label>

      {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}

      <div className="pt-2">
        {canUpdate ? (
          <button
            disabled={loading}
            className="rounded-xl px-4 py-2 border hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Saving…' : (initial?._id ? 'Update Party' : 'Create Party')}
          </button>
        ) : (
          <button
            type="button"
            className="rounded-xl px-4 py-2 border opacity-60 cursor-not-allowed"
            title="You don't have permission to update parties"
          >
            Read-only
          </button>
        )}
      </div>
    </form>
  );
}
