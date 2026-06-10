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
    <div className="relative flex h-screen items-center justify-center bg-[#09090b] overflow-hidden select-none">
      {/* Decorative ambient glowing background circles */}
      <div 
        className="absolute top-1/4 left-1/4 w-80 h-80 bg-[var(--primary)]/15 rounded-full filter blur-[80px] animate-pulse pointer-events-none" 
        style={{ animationDuration: '4s' }} 
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full filter blur-[100px] animate-pulse pointer-events-none" 
        style={{ animationDuration: '6s' }} 
      />

      {/* Main glassmorphic wrapper */}
      <div className="relative flex flex-col items-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl z-10 max-w-[260px] w-full text-center">
        {/* Glowing ring animation around the logo */}
        <div className="relative flex items-center justify-center w-20 h-20 mb-5">
          <div 
            className="absolute inset-0 rounded-2xl border-2 border-dashed border-[var(--primary)]/30 animate-spin" 
            style={{ animationDuration: '12s' }} 
          />
          <div className="absolute inset-1.5 rounded-xl border border-white/10 bg-[#09090b] p-3.5 flex items-center justify-center shadow-inner">
            <img 
              src="/logo.png" 
              alt="FinControl Logo" 
              className="w-full h-full object-contain animate-pulse" 
              style={{ animationDuration: '2s' }} 
            />
          </div>
        </div>

        {/* Text and premium label */}
        <h1 className="text-xl font-black text-white tracking-tight leading-none mb-1">
          FinControl
        </h1>
        <p className="text-[9px] uppercase tracking-[0.25em] text-[var(--primary)] font-black animate-pulse">
          Gestión Inteligente
        </p>

        {/* Modern thin loading line at the bottom */}
        <div className="w-16 h-0.5 bg-white/10 rounded-full mt-6 overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-[var(--primary)] to-purple-500 rounded-full animate-progress" />
        </div>
      </div>

      <style>{`
        @keyframes loading-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-progress {
          animation: loading-progress 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
