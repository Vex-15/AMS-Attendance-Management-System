'use client';

import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        closeButton
        theme="dark"
        offset={16}
        toastOptions={{
          style: {
            background: 'rgba(11, 15, 26, 0.94)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#e2e8f0',
            borderRadius: '14px',
            boxShadow: '0 24px 48px -28px rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(16px)',
            fontSize: '12.5px',
            letterSpacing: '-0.01em',
          },
          classNames: {
            title: 'font-semibold',
            description: 'text-slate-400',
            actionButton:
              'bg-white/10 text-white border border-white/10 hover:bg-white/20',
            cancelButton: 'bg-transparent text-slate-400 hover:text-white',
            closeButton: 'bg-[#0b0f1a] border-white/10 text-slate-400 hover:text-white',
          },
        }}
      />
    </AuthProvider>
  );
}
