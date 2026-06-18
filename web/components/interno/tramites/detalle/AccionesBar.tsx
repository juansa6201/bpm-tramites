'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { AccionDialog } from './AccionDialog';
import { ACCIONES, type AccionMeta } from '@/lib/acciones';
import { ejecutarAccion } from '@/lib/tramites-api';
import { useNotify } from '@/context/SnackbarContext';
import type { AccionMovimiento, Area } from '@/types/tramite';

interface Props {
  tramiteId: string;
  acciones: AccionMovimiento[];
  areas: Area[];
  /** Se llama tras una acción exitosa para recargar detalle + comentarios. */
  onDone: () => void;
}

export function AccionesBar({ tramiteId, acciones, areas, onDone }: Props) {
  const notify = useNotify();
  const [selected, setSelected] = React.useState<AccionMovimiento | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Solo las acciones que este portal sabe ejecutar (asignar/externas quedan fuera).
  const renderables = acciones.filter((a): a is AccionMovimiento => Boolean(ACCIONES[a]));
  if (renderables.length === 0) return null;

  const meta: AccionMeta | null = selected ? (ACCIONES[selected] ?? null) : null;

  const confirmar = async (payload: { comentario?: string; areaNuevaId?: string }) => {
    if (!meta) return;
    setSubmitting(true);
    try {
      await ejecutarAccion(tramiteId, meta.slug, payload);
      notify(`Acción "${meta.label}" realizada.`, 'success');
      setSelected(null);
      onDone();
    } catch {
      // El api-client ya mostró el snackbar de error; dejamos el dialog abierto.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {renderables.map((a) => {
          const m = ACCIONES[a]!;
          const contained = m.color === 'primary' || m.color === 'success';
          return (
            <Button
              key={a}
              variant={contained ? 'contained' : 'outlined'}
              color={m.color === 'inherit' ? 'inherit' : m.color}
              onClick={() => setSelected(a)}
            >
              {m.label}
            </Button>
          );
        })}
      </Stack>

      <AccionDialog
        meta={meta}
        areas={areas}
        submitting={submitting}
        onClose={() => setSelected(null)}
        onConfirm={confirmar}
      />
    </>
  );
}
