import * as React from 'react';
import { AuthProvider } from '@/context/AuthContext';

/**
 * Layout de TODO el portal interno (incluido /interno/login).
 * Solo provee el AuthContext: el login necesita acceso a él pero NO debe quedar
 * detrás del AuthGuard. El gate + el shell viven en (protected)/layout.tsx.
 */
export default function InternoLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
