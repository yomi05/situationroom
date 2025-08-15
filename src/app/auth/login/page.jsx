import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const metadata = { title: 'Login — SituationRoom' };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-gray-500">Loading…</div>}>
      <LoginClient />
    </Suspense>
  );
}
