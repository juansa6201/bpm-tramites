'use client';

import * as React from 'react';
import { AppSnackbarProvider } from '@/context/SnackbarContext';

/**
 * Providers globales (cliente) montados en el RootLayout.
 * El AuthProvider NO va acá: es específico del portal interno y se monta en
 * app/interno/layout.tsx.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <AppSnackbarProvider>{children}</AppSnackbarProvider>;
}
