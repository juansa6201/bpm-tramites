'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '@/context/AuthContext';

/**
 * Protección de ruta client-side: el token vive en el cliente, así que el
 * gate es acá (no en middleware SSR). Muestra un spinner mientras hidrata y
 * redirige al login si no hay sesión.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/interno/login');
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
