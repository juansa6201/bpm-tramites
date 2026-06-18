import * as React from 'react';
import { ExternalAuthGuard } from '@/components/externo/ExternalAuthGuard';
import { ExternalShell } from '@/components/externo/ExternalShell';

/**
 * Layout del área protegida del portal externo: gate de sesión + shell visual.
 * Las páginas públicas (login/registro) quedan fuera de este grupo.
 */
export default function ExternoProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExternalAuthGuard>
      <ExternalShell>{children}</ExternalShell>
    </ExternalAuthGuard>
  );
}
