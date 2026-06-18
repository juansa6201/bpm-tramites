'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useExternalAuth } from '@/context/ExternalAuthContext';
import { loadInternalToken } from '@/lib/auth-storage';

/**
 * Gate client-side del portal externo. Si no hay sesión externa redirige al
 * login externo; pero si el visitante ya tiene sesión INTERNA activa, lo manda
 * a /interno en vez de obligarlo a loguearse de nuevo como externo.
 */
export function ExternalAuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useExternalAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(loadInternalToken() ? '/interno' : '/externo/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
