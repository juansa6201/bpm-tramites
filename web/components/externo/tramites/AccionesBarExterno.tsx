'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { AccionDialog } from '@/components/interno/tramites/detalle/AccionDialog';
import { ACCIONES_EXTERNO } from '@/lib/acciones-externo';
import type { AccionMeta } from '@/lib/acciones';
import { ejecutarAccionExterna } from '@/lib/tramites-externos';
import { useNotify } from '@/context/SnackbarContext';
import type { AccionMovimiento } from '@/types/tramite';

interface Props {
  tramiteId: string;
  acciones: AccionMovimiento[];
  /** Se llama tras una acción exitosa para recargar detalle + comentarios + documentos. */
  onDone: () => void;
}

/**
 * Barra de acciones del portal externo. Reusa AccionDialog (presentacional); las
 * acciones del externo no requieren área, así que pasa una lista de áreas vacía.
 */
export function AccionesBarExterno({ tramiteId, acciones, onDone }: Props) {
  const notify = useNotify();
  const [selected, setSelected] = React.useState<AccionMovimiento | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const renderables = acciones.filter((a): a is AccionMovimiento => Boolean(ACCIONES_EXTERNO[a]));
  if (renderables.length === 0) return null;

  const meta: AccionMeta | null = selected ? (ACCIONES_EXTERNO[selected] ?? null) : null;

  const confirmar = async (payload: { comentario?: string }) => {
    if (!meta) return;
    setSubmitting(true);
    try {
      await ejecutarAccionExterna(tramiteId, meta.slug, payload);
      notify(`Acción "${meta.label}" realizada.`, 'success');
      setSelected(null);
      onDone();
    } catch {
      // el api-client ya mostró el snackbar; dejamos el dialog abierto
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {renderables.map((a) => {
          const m = ACCIONES_EXTERNO[a]!;
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
        areas={[]}
        submitting={submitting}
        onClose={() => setSelected(null)}
        onConfirm={confirmar}
      />
    </>
  );
}
