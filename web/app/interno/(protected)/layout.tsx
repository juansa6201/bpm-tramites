import * as React from 'react';
import { AuthGuard } from '@/components/interno/AuthGuard';
import { InternalShell } from '@/components/interno/InternalShell';

/**
 * Layout de las páginas protegidas del portal interno. El route group
 * (protected) no agrega segmento a la URL: estas páginas siguen en /interno/*.
 */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <InternalShell>{children}</InternalShell>
    </AuthGuard>
  );
}
