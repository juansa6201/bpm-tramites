import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const h = vi.hoisted(() => ({ ejecutar: vi.fn() }));

vi.mock('@/lib/tramites-api', () => ({
  ejecutarAccion: h.ejecutar,
}));

vi.mock('@/context/SnackbarContext', () => ({
  useNotify: () => vi.fn(),
}));

import { AccionesBar } from './AccionesBar';

describe('Acciones de workflow (interno)', () => {
  beforeEach(() => h.ejecutar.mockReset());

  it('dibuja solo las acciones que el portal sabe ejecutar', () => {
    render(
      <AccionesBar
        tramiteId="t1"
        acciones={['TOMAR', 'RESPONDER_OBSERVACION']}
        areas={[]}
        onDone={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Tomar' })).toBeInTheDocument();
    // RESPONDER_OBSERVACION no está en el mapa interno → no se dibuja.
    expect(screen.queryByRole('button', { name: /responder/i })).not.toBeInTheDocument();
  });

  it('ejecuta la acción al confirmar el dialog', async () => {
    h.ejecutar.mockResolvedValue({
      id: 't1',
      numero: 'INT-1',
      estadoAnterior: 'INGRESADO',
      estadoNuevo: 'EN_REVISION',
    });
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<AccionesBar tramiteId="t1" acciones={['TOMAR']} areas={[]} onDone={onDone} />);

    await user.click(screen.getByRole('button', { name: 'Tomar' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(h.ejecutar).toHaveBeenCalledWith('t1', 'tomar', expect.anything()));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
