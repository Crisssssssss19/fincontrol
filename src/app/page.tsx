'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border p-3 flex items-center justify-center shadow-md border-[var(--primary)]/10">
          <img src="/logo.png" alt="FinControl Logo" className="w-full h-full object-contain" />
        </div>
        <div className="text-[var(--primary)] font-black text-lg tracking-tight">FinControl</div>
      </div>
    </div>
  );
}
