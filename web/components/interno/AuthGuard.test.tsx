import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  replace: vi.fn(),
  status: 'unauthenticated' as 'loading' | 'authenticated' | 'unauthenticated',
  externalToken: null as string | null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: h.replace }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ status: h.status }),
}));

vi.mock('@/lib/auth-storage', () => ({
  loadExternalToken: () => h.externalToken,
}));

import { AuthGuard } from './AuthGuard';

describe('Guard de rutas internas', () => {
  beforeEach(() => {
    h.replace.mockReset();
    h.status = 'unauthenticated';
    h.externalToken = null;
  });

  it('sin sesión redirige al login interno', async () => {
    render(
      <AuthGuard>
        <div>contenido interno</div>
      </AuthGuard>,
    );
    await waitFor(() => expect(h.replace).toHaveBeenCalledWith('/interno/login'));
    expect(screen.queryByText('contenido interno')).not.toBeInTheDocument();
  });

  it('con sesión externa activa redirige a /externo', async () => {
    h.externalToken = 'tok-externo';
    render(
      <AuthGuard>
        <div>contenido interno</div>
      </AuthGuard>,
    );
    await waitFor(() => expect(h.replace).toHaveBeenCalledWith('/externo'));
  });

  it('autenticado renderiza el contenido protegido', () => {
    h.status = 'authenticated';
    render(
      <AuthGuard>
        <div>contenido interno</div>
      </AuthGuard>,
    );
    expect(screen.getByText('contenido interno')).toBeInTheDocument();
    expect(h.replace).not.toHaveBeenCalled();
  });
});
