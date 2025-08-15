export const runtime = 'nodejs';

import dbConnect from '@/lib/dbConnect';
import Submission from '@/models/Submission';
import Form from '@/models/Form';

function csvEscape(s){ const v=String(s??''); return /[,"\r\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v; }

export async function GET(_req, { params }) {
  await dbConnect();
  const [form, entries] = await Promise.all([
    Form.findOne({ form_key: params.form_id }).lean(),
    Submission.find({ form_id: params.form_id }).sort({ createdAt: -1 }).lean(),
  ]);
  const fields = (form?.fields || []).filter(f => f.field_name !== 'PollingForm');
  const header = ['_created', ...fields.map(f=>f.field_name)].map(csvEscape).join(',');

  const rows = entries.map((e) => {
    const map = {};
    for (const it of (e.submission_value || [])) map[it.field_id] = it.field_value;
    const line = [e.createdAt ? new Date(e.createdAt).toISOString() : '', ...fields.map(f=>{
      const v = map[f.field_id];
      return Array.isArray(v) ? v.join(';') : (v ?? '');
    })].map(csvEscape).join(',');
    return line;
  });

  const csv = [header, ...rows].join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${(form?.form_name||'form').replace(/\s+/g,'_')}_entries.csv"`,
    }
  });
}
