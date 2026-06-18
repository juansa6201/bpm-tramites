import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timeline } from './Timeline';
import type { MovimientoTramite } from '@/types/tramite';

function mov(over: Partial<MovimientoTramite> = {}): MovimientoTramite {
  return {
    id: 'm1',
    estadoAnterior: 'INGRESADO',
    estadoNuevo: 'EN_REVISION',
    areaAnteriorId: null,
    areaNuevaId: null,
    usuarioTipo: 'INTERNO',
    usuarioId: 'abcdef12-0000',
    accion: 'TOMAR',
    comentario: 'Tomo el trámite',
    fecha: '2026-05-01T10:00:00.000Z',
    ...over,
  };
}

describe('Timeline de movimientos', () => {
  it('muestra el estado vacío sin movimientos', () => {
    render(<Timeline movimientos={[]} />);
    expect(screen.getByText('Sin movimientos.')).toBeInTheDocument();
  });

  it('renderiza la acción y el comentario de un movimiento', () => {
    render(<Timeline movimientos={[mov()]} />);
    expect(screen.getByText('Tomado')).toBeInTheDocument();
    expect(screen.getByText('Tomo el trámite')).toBeInTheDocument();
  });

  it('sin areaNombre no muestra cambios de área', () => {
    render(
      <Timeline
        movimientos={[mov({ areaAnteriorId: 'a1', areaNuevaId: 'a2', accion: 'DERIVAR' })]}
      />,
    );
    expect(screen.queryByText(/Área:/)).not.toBeInTheDocument();
  });
});
