import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TramitesFiltros } from './TramitesFiltros';
import type { TramitesFilters } from '@/types/tramite';

const filtros: TramitesFilters = { page: 1, pageSize: 20 };

describe('Filtros de la bandeja', () => {
  it('cambiar el estado dispara onChange con el valor', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TramitesFiltros
        filtros={filtros}
        onChange={onChange}
        onReset={vi.fn()}
        areas={[]}
        showArea={false}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Estado' }));
    await user.click(screen.getByRole('option', { name: 'Ingresado' }));

    expect(onChange).toHaveBeenCalledWith({ estado: 'INGRESADO' });
  });

  it('el botón Limpiar dispara onReset', async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(
      <TramitesFiltros
        filtros={filtros}
        onChange={vi.fn()}
        onReset={onReset}
        areas={[]}
        showArea={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(onReset).toHaveBeenCalled();
  });
});
