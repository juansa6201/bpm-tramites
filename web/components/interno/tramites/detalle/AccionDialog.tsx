'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { AccionMeta } from '@/lib/acciones';
import type { Area } from '@/types/tramite';

interface Props {
  meta: AccionMeta | null;
  areas: Area[];
  submitting: boolean;
  onClose: () => void;
  onConfirm: (payload: { comentario?: string; areaNuevaId?: string }) => void;
}

export function AccionDialog({ meta, areas, submitting, onClose, onConfirm }: Props) {
  const [comentario, setComentario] = React.useState('');
  const [areaNuevaId, setAreaNuevaId] = React.useState('');

  // Reset al abrir/cambiar de acción.
  React.useEffect(() => {
    setComentario('');
    setAreaNuevaId('');
  }, [meta]);

  if (!meta) return null;

  const comentarioRequerido = meta.comentario === 'requerido';
  const faltaComentario = comentarioRequerido && comentario.trim() === '';
  const faltaArea = Boolean(meta.requiereArea) && areaNuevaId === '';
  const invalido = faltaComentario || faltaArea;

  const confirmar = () => {
    onConfirm({
      comentario: comentario.trim() ? comentario.trim() : undefined,
      areaNuevaId: meta.requiereArea ? areaNuevaId : undefined,
    });
  };

  return (
    <Dialog open onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{meta.label}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {meta.critica && (
            <Alert severity="warning">
              Esta acción cambia el estado del trámite y no se puede deshacer.
            </Alert>
          )}

          {meta.requiereArea && (
            <TextField
              select
              required
              label="Área destino"
              value={areaNuevaId}
              onChange={(e) => setAreaNuevaId(e.target.value)}
              disabled={submitting}
              fullWidth
            >
              {areas.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.nombre}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            label="Comentario"
            required={comentarioRequerido}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            disabled={submitting}
            multiline
            minRows={3}
            fullWidth
            placeholder={comentarioRequerido ? 'Obligatorio para esta acción' : 'Opcional'}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color={meta.color === 'inherit' ? 'primary' : meta.color}
          onClick={confirmar}
          disabled={invalido || submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
