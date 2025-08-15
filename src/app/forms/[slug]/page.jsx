import dbConnect from '@/lib/dbConnect';
import Form from '@/models/Form';
import FormRender from '@/components/forms/runtime/FormRender';

export const dynamic = 'force-dynamic';

export default async function FormPublicPage({ params }) {
  await dbConnect();
  const form = await Form.findOne({ $or: [{ slug: params.slug }, { form_key: params.slug }] }).lean();
  if (!form) return <div className="p-6">Form not found.</div>;
  return <FormRender form={JSON.parse(JSON.stringify(form))} />;
}
