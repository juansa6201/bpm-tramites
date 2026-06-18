import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  replace: vi.fn(),
  status: 'unauthenticated' as 'loading' | 'authenticated' | 'unauthenticated',
  internalToken: null as string | null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: h.replace }),
}));

vi.mock('@/context/ExternalAuthContext', () => ({
  useExternalAuth: () => ({ status: h.status }),
}));

vi.mock('@/lib/auth-storage', () => ({
  loadInternalToken: () => h.internalToken,
}));

import { ExternalAuthGuard } from './ExternalAuthGuard';

describe('Guard de rutas externas', () => {
  beforeEach(() => {
    h.replace.mockReset();
    h.status = 'unauthenticated';
    h.internalToken = null;
  });

  it('sin sesión redirige al login externo', async () => {
    render(
      <ExternalAuthGuard>
        <div>contenido externo</div>
      </ExternalAuthGuard>,
    );
    await waitFor(() => expect(h.replace).toHaveBeenCalledWith('/externo/login'));
    expect(screen.queryByText('contenido externo')).not.toBeInTheDocument();
  });

  it('con sesión interna activa redirige a /interno', async () => {
    h.internalToken = 'tok-interno';
    render(
      <ExternalAuthGuard>
        <div>contenido externo</div>
      </ExternalAuthGuard>,
    );
    await waitFor(() => expect(h.replace).toHaveBeenCalledWith('/interno'));
  });

  it('autenticado renderiza el contenido protegido', () => {
    h.status = 'authenticated';
    render(
      <ExternalAuthGuard>
        <div>contenido externo</div>
      </ExternalAuthGuard>,
    );
    expect(screen.getByText('contenido externo')).toBeInTheDocument();
  });
});
