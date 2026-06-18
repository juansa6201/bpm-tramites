import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const h = vi.hoisted(() => ({
  login: vi.fn(),
  replace: vi.fn(),
  status: 'unauthenticated' as 'loading' | 'authenticated' | 'unauthenticated',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: h.replace, push: vi.fn() }),
}));

vi.mock('@/context/ExternalAuthContext', () => ({
  useExternalAuth: () => ({
    login: h.login,
    status: h.status,
    logout: vi.fn(),
    user: null,
    token: null,
  }),
}));

import LoginExternoPage from './page';

describe('Formulario de login externo', () => {
  beforeEach(() => {
    h.login.mockReset();
    h.replace.mockReset();
    h.status = 'unauthenticated';
  });

  it('muestra errores de validación al enviar vacío', async () => {
    const user = userEvent.setup();
    render(<LoginExternoPage />);

    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('El email es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    expect(h.login).not.toHaveBeenCalled();
  });

  it('envía las credenciales a login() cuando son válidas', async () => {
    h.login.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginExternoPage />);

    await user.type(screen.getByLabelText('Email'), 'carlos@proveedor.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Externo123!');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() =>
      expect(h.login).toHaveBeenCalledWith('carlos@proveedor.com', 'Externo123!'),
    );
  });
});
