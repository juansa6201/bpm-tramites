import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const h = vi.hoisted(() => ({
  replace: vi.fn(),
  crear: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: h.replace, push: vi.fn() }),
}));

vi.mock('@/hooks/useTiposIniciables', () => ({
  useTiposIniciables: () => ({
    data: [
      {
        id: 't1',
        codigo: 'ALTA',
        nombre: 'Alta proveedor',
        descripcion: null,
        activo: true,
        requiereExterno: false,
        permiteInicioExterno: true,
        slaHoras: 48,
        areaInicialId: null,
      },
    ],
    loading: false,
    error: false,
  }),
}));

vi.mock('@/lib/tramites-externos', () => ({
  crearTramiteExterno: h.crear,
}));

vi.mock('@/context/SnackbarContext', () => ({
  useNotify: () => vi.fn(),
}));

import NuevoTramiteExternoPage from './page';

describe('Formulario de creación de trámite (externo)', () => {
  beforeEach(() => {
    h.replace.mockReset();
    h.crear.mockReset();
  });

  it('valida los campos requeridos', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    render(<NuevoTramiteExternoPage />);

    await user.click(screen.getByRole('button', { name: 'Crear trámite' }));

    expect(await screen.findByText('El título es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La descripción es obligatoria')).toBeInTheDocument();
    expect(screen.getByText('Elegí un tipo de trámite')).toBeInTheDocument();
    expect(h.crear).not.toHaveBeenCalled();
  });

  it('crea el trámite con los datos cargados', async () => {
    h.crear.mockResolvedValue({ id: 'x1', numero: 'EXT-2026-00010', estado: 'BORRADOR' });
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    render(<NuevoTramiteExternoPage />);

    // Tipo de trámite (MUI Select)
    await user.click(screen.getByRole('combobox', { name: /tipo de trámite/i }));
    await user.click(screen.getByRole('option', { name: 'Alta proveedor' }));

    await user.type(screen.getByLabelText('Título'), 'Quiero darme de alta');
    await user.type(screen.getByLabelText('Descripción'), 'Soy un proveedor nuevo');

    await user.click(screen.getByRole('button', { name: 'Crear trámite' }));

    await waitFor(() =>
      expect(h.crear).toHaveBeenCalledWith({
        tipoTramiteId: 't1',
        titulo: 'Quiero darme de alta',
        descripcion: 'Soy un proveedor nuevo',
        prioridad: 'MEDIA',
      }),
    );
    await waitFor(() => expect(h.replace).toHaveBeenCalledWith('/externo/tramites/x1'));
  }, 15000);
});
