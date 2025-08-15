import { Suspense } from 'react';
import FormStudioClient from './FormStudioClient';

export const metadata = { title: 'Form Studio — SituationRoom' };

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
      <FormStudioClient />
    </Suspense>
  );
}
