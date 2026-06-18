import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TramitesTabla } from './TramitesTabla';
import type { Paginated, TramiteListItem, TramitesFilters } from '@/types/tramite';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const filtros: TramitesFilters = { page: 1, pageSize: 20 };

function item(over: Partial<TramiteListItem> = {}): TramiteListItem {
  return {
    id: 't1',
    numero: 'INT-2026-00001',
    titulo: 'Compra de notebooks',
    descripcion: 'desc',
    origen: 'INTERNO_INTERNO',
    estado: 'INGRESADO',
    prioridad: 'MEDIA',
    tipoTramiteId: 'tt1',
    areaActualId: 'a1',
    usuarioAsignadoId: null,
    usuarioExternoId: null,
    version: 1,
    fechaCreacion: '2026-05-01T09:00:00.000Z',
    fechaActualizacion: '2026-05-01T09:00:00.000Z',
    fechaCierre: null,
    fechaVencimiento: '2026-05-04T09:00:00.000Z',
    slaVencido: false,
    ...over,
  };
}

function paginated(items: TramiteListItem[]): Paginated<TramiteListItem> {
  return { items, total: items.length, page: 1, pageSize: 20 };
}

const baseProps = {
  filtros,
  loading: false,
  error: false,
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
  onReload: vi.fn(),
  areaNombre: () => 'Legal',
};

describe('Bandeja de trámites', () => {
  it('renderiza las filas con número y título', () => {
    render(<TramitesTabla {...baseProps} data={paginated([item()])} />);
    expect(screen.getByText('INT-2026-00001')).toBeInTheDocument();
    expect(screen.getByText('Compra de notebooks')).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando no hay trámites', () => {
    render(<TramitesTabla {...baseProps} data={paginated([])} />);
    expect(screen.getByText('No hay trámites para estos filtros.')).toBeInTheDocument();
  });

  it('marca visualmente el SLA vencido', () => {
    const { rerender } = render(
      <TramitesTabla {...baseProps} data={paginated([item({ slaVencido: false })])} />,
    );
    expect(screen.queryByTestId('WarningAmberIcon')).not.toBeInTheDocument();

    rerender(<TramitesTabla {...baseProps} data={paginated([item({ slaVencido: true })])} />);
    expect(screen.getByTestId('WarningAmberIcon')).toBeInTheDocument();
  });
});
