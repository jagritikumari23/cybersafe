// src/app/signup/page.tsx
'use client';

import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <SignupForm />
    </main>
  );
}
