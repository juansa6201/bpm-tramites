import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComentariosExterno } from './ComentariosExterno';

describe('Render de errores (comentarios externos)', () => {
  it('muestra el error con opción de reintentar', async () => {
    const onReload = vi.fn();
    const user = userEvent.setup();
    render(
      <ComentariosExterno
        comentarios={[]}
        loading={false}
        error
        onReload={onReload}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText('No se pudieron cargar los comentarios.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onReload).toHaveBeenCalled();
  });

  it('muestra el estado vacío cuando no hay comentarios', () => {
    render(
      <ComentariosExterno
        comentarios={[]}
        loading={false}
        error={false}
        onReload={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText('Todavía no hay comentarios.')).toBeInTheDocument();
  });
});
