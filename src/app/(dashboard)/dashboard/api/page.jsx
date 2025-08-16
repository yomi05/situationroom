'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPerm, PERMS } from '@/lib/rbac';

function Code({ children }) {
  return (
    <pre className="rounded-xl border bg-white p-3 text-sm overflow-x-auto">
      <code>{children}</code>
    </pre>
  );
}

function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={`rounded-lg border px-2 py-1 text-xs hover:bg-gray-50 ${className}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {}
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function EndpointCard({
  method = 'GET',
  path,
  title,
  description,
  qs = [],
  sampleResponse = {},
  fields = [],
  baseUrl,
}) {
  const url = `${baseUrl}${path}`;
  const curl = `curl -s "${url}"`;
  const fetchJs =
    `const res = await fetch('${url}', { headers: { Accept: 'application/json' } });\n` +
    `const data = await res.json();\n` +
    `console.log(data);`;

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-mono">{method}</span>
          <div className="font-semibold">{title}</div>
        </div>
        <span className="text-xs text-gray-600 font-mono">{path}</span>
      </div>

      {description && <p className="text-sm text-gray-700">{description}</p>}

      {qs.length > 0 && (
        <div className="text-sm">
          <div className="font-medium mb-1">Query Parameters</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {qs.map((q) => (
              <li key={q.name}>
                <span className="font-mono">{q.name}</span>
                {q.required ? <span className="text-red-500 ml-1">*</span> : null}
                {q.type ? <span className="text-gray-500"> — {q.type}</span> : null}
                {q.desc ? <span className="text-gray-600"> — {q.desc}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between">
          <div className="text-sm font-medium">cURL</div>
          <CopyButton text={curl} />
        </div>
        <Code>{curl}</Code>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <div className="text-sm font-medium">JavaScript (fetch)</div>
          <CopyButton text={fetchJs} />
        </div>
        <Code>{fetchJs}</Code>
      </div>

      <div>
        <div className="mb-1 text-sm font-medium">Sample Response</div>
        <Code>{JSON.stringify(sampleResponse, null, 2)}</Code>
      </div>

      {fields.length > 0 && (
        <div className="text-sm">
          <div className="font-medium mb-1">Fields</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {fields.map((f) => (
              <li key={f.name}>
                <span className="font-mono">{f.name}</span>
                {f.type ? <span className="text-gray-500"> — {f.type}</span> : null}
                {f.desc ? <span className="text-gray-600"> — {f.desc}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ApiDocsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'Guest';
  const canView = hasPerm(role, PERMS.VIEW_API);

  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  if (!canView) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">403 — Not Authorized</div>
        <p className="text-gray-600">You don’t have permission to view API documentation.</p>
        <Link className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50" href="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Shared sample rows (keep aligned with your actual responses)
  const sampleVoters = {
    data: [
      { _id: '...', state: 'Abia', male: 950000, female: 1020000, total: 1970000, year: 2023 },
    ],
  };

  const samplePres = {
    data: [
      { _id: '...', position: 'President', year: 2023, party: 'ABC', candidate: 'Jane Doe', votes: 8123456, percentage: 41.2 },
    ],
  };

  const sampleGov = {
    data: [
      { _id: '...', state: 'Lagos', year: 2023, party: 'XYZ', candidate: 'John Doe', deputy: 'Mary Roe', votes: 912345 },
    ],
  };

  const sampleSen = {
    data: [
      { _id: '...', state: 'Kano', district: 'Kano Central', year: 2023, party: 'PQR', candidate: 'Ali Musa', votes: 223456 },
    ],
  };

  const sampleHor = {
    data: [
      { _id: '...', state: 'Abia', constituency: 'Bende', year: 2023, party: 'LMN', candidate: 'Ada Obi', votes: 73456 },
    ],
  };

  const sampleStatusCategories = {
    data: [
      { _id: '...', title: 'Security', description: 'Updates on security incidents', color: '#FF9900' },
    ],
  };

  const sampleStatusInfo = {
    data: [
      {
        _id: '...',
        title: 'Curfew Lifted',
        category: 'Security',
        state: 'Borno',
        information: 'State government lifts curfew...',
        color: '#FF9900',
        image: { url: 'https://cdn.example.com/statusinfo/abc.jpg' },
      },
    ],
  };

  const sampleDates = {
    data: [
      { _id: '...', date: '13-Aug', observation: 'International Left-Handers Day' },
    ],
  };

  const sections = useMemo(
    () => [
      {
        group: 'Voters Registration',
        items: [
          {
            path: '/api/voters',
            title: 'List voters registration',
            description:
              'Aggregated voter registration per state and year.',
            sample: sampleVoters,
            fields: [
              { name: '_id', type: 'string' },
              { name: 'state', type: 'string' },
              { name: 'male', type: 'number|string', desc: 'May be numeric string with commas' },
              { name: 'female', type: 'number|string' },
              { name: 'total', type: 'number|string' },
              { name: 'year', type: 'number' },
            ],
            qs: [
              { name: 'state', type: 'string', desc: '(optional) filter by state name' },
              { name: 'year', type: 'number|string', desc: '(optional) filter by year' },
            ],
          },
        ],
      },
      {
        group: 'Past Elections — Presidential',
        items: [
          {
            path: '/api/past-elections/presidential',
            title: 'List presidential results',
            description:
              'Nationwide presidential results by party/candidate & year.',
            sample: samplePres,
            fields: [
              { name: '_id', type: 'string' },
              { name: 'position', type: 'string', desc: '"President"' },
              { name: 'year', type: 'number' },
              { name: 'party', type: 'string' },
              { name: 'candidate', type: 'string' },
              { name: 'votes', type: 'number|string' },
              { name: 'percentage', type: 'number' },
            ],
            qs: [
              { name: 'year', type: 'number|string', desc: '(optional)' },
              { name: 'party', type: 'string', desc: '(optional)' },
              { name: 'candidate', type: 'string', desc: '(optional, partial match recommended client-side)' },
            ],
          },
        ],
      },
      {
        group: 'Past Elections — Governorship',
        items: [
          {
            path: '/api/past-elections/governorship',
            title: 'List governorship results',
            description:
              'State-level governorship results by year.',
            sample: sampleGov,
            fields: [
              { name: '_id', type: 'string' },
              { name: 'state', type: 'string' },
              { name: 'year', type: 'number|string' },
              { name: 'party', type: 'string' },
              { name: 'candidate', type: 'string' },
              { name: 'deputy', type: 'string' },
              { name: 'votes', type: 'number|string' },
            ],
            qs: [
              { name: 'state', type: 'string', desc: '(optional)' },
              { name: 'year', type: 'number|string', desc: '(optional)' },
            ],
          },
        ],
      },
      {
        group: 'Past Elections — Senatorial',
        items: [
          {
            path: '/api/past-elections/senatorial',
            title: 'List senatorial results',
            description:
              'Senate district results by state & year.',
            sample: sampleSen,
            fields: [
              { name: '_id', type: 'string' },
              { name: 'state', type: 'string' },
              { name: 'district', type: 'string' },
              { name: 'year', type: 'number' },
              { name: 'party', type: 'string' },
              { name: 'candidate', type: 'string' },
              { name: 'votes', type: 'number|string' },
            ],
            qs: [
              { name: 'state', type: 'string', desc: '(optional)' },
              { name: 'district', type: 'string', desc: '(optional)' },
              { name: 'year', type: 'number|string', desc: '(optional)' },
            ],
          },
        ],
      },
      {
        group: 'Past Elections — House of Representatives',
        items: [
          {
            path: '/api/past-elections/hor',
            title: 'List HoR results',
            description:
              'House of Representatives results by constituency & year.',
            sample: sampleHor,
            fields: [
              { name: '_id', type: 'string' },
              { name: 'state', type: 'string' },
              { name: 'constituency', type: 'string' },
              { name: 'year', type: 'number' },
              { name: 'party', type: 'string' },
              { name: 'candidate', type: 'string' },
              { name: 'votes', type: 'number|string' },
            ],
            qs: [
              { name: 'state', type: 'string', desc: '(optional)' },
              { name: 'constituency', type: 'string', desc: '(optional)' },
              { name: 'year', type: 'number|string', desc: '(optional)' },
            ],
          },
        ],
      },
      {
        group: 'Status',
        items: [
          {
            path: '/api/status/categories',
            title: 'List status categories',
            description: 'Categories used to tag status/information cards.',
            sample: sampleStatusCategories,
            fields: [
              { name: '_id', type: 'string' },
              { name: 'title', type: 'string' },
              { name: 'description', type: 'string' },
              { name: 'color', type: 'string', desc: 'Hex color' },
            ],
          },
          {
            path: '/api/status/information',
            title: 'List status information',
            description: 'Status/information items by category and state.',
            sample: sampleStatusInfo,
            fields: [
              { name: '_id', type: 'string' },
              { name: 'title', type: 'string' },
              { name: 'category', type: 'string' },
              { name: 'state', type: 'string' },
              { name: 'information', type: 'string' },
              { name: 'color', type: 'string' },
              { name: 'image.url', type: 'string', desc: '(optional)' },
            ],
            qs: [
              { name: 'category', type: 'string', desc: '(optional)' },
              { name: 'state', type: 'string', desc: '(optional)' },
            ],
          },
        ],
      },
      {
        group: 'Notable Dates',
        items: [
          {
            path: '/api/notable-dates',
            title: 'List notable dates',
            description:
              'Calendar of notable (international) days as "d-MMM" (e.g. "13-Aug").',
            sample: sampleDates,
            fields: [
              { name: '_id', type: 'string' },
              { name: 'date', type: 'string', desc: 'Formatted "d-MMM"' },
              { name: 'observation', type: 'string' },
            ],
            qs: [
              { name: 'after', type: 'string', desc: '(optional) ISO date to filter upcoming client-side' },
            ],
          },
        ],
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseUrl]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Public API — Read Endpoints</h1>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <div className="text-sm text-gray-600">Base URL</div>
            <div className="font-mono text-sm">{baseUrl}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Content Type</div>
            <div className="font-mono text-sm">application/json</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-700">
          These endpoints are read-only and (unless otherwise configured) do not require authentication.
          Results are returned as JSON with a top-level <span className="font-mono">{'{ data: [...] }'}</span>.
        </div>
      </div>

      {sections.map((sec) => (
        <div key={sec.group} className="space-y-3">
          <h2 className="text-lg font-semibold">{sec.group}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {sec.items.map((it) => (
              <EndpointCard
                key={it.path}
                method="GET"
                path={it.path}
                title={it.title}
                description={it.description}
                qs={it.qs || []}
                sampleResponse={it.sample}
                fields={it.fields}
                baseUrl={baseUrl}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-2xl border bg-white p-4 space-y-2">
        <h3 className="font-semibold">Expo / React Native Notes</h3>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Use standard <span className="font-mono">fetch</span> (works in Expo). No special client required.</li>
          <li>If you deploy API and app on different domains, enable CORS on API routes.</li>
          <li>Numeric fields may arrive as strings (e.g., votes <span className="font-mono">"1,234"</span>). Normalize on the client.</li>
          <li>Pagination/filters are minimal for now — fetch and filter client-side, or we can extend endpoints.</li>
        </ul>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-2">
        <h3 className="font-semibold">Error Format</h3>
        <Code>{`{ "message": "Human-readable error" }`}</Code>
        <p className="text-sm text-gray-700">
          Non-2xx responses include a short <span className="font-mono">message</span>. Some routes may return field-level
          errors if you later add validation.
        </p>
      </div>
    </div>
  );
}
