'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { formatDateTime } from '@/lib/format';
import type { Comentario, Visibilidad } from '@/types/tramite';

const VIS_LABEL: Record<Visibilidad, string> = {
  TODOS: 'Todos',
  INTERNA: 'Solo internos',
  EXTERNA: 'Solo externos',
};

interface Props {
  comentarios: Comentario[];
  loading: boolean;
  error: boolean;
  onReload: () => void;
  /** Resuelve al persistir; rechaza si falló (el api-client ya avisó). */
  onSubmit: (mensaje: string, visibilidad: Visibilidad) => Promise<void>;
}

export function Comentarios({ comentarios, loading, error, onReload, onSubmit }: Props) {
  const [mensaje, setMensaje] = React.useState('');
  const [visibilidad, setVisibilidad] = React.useState<Visibilidad>('TODOS');
  const [submitting, setSubmitting] = React.useState(false);

  const enviar = async () => {
    if (mensaje.trim() === '') return;
    setSubmitting(true);
    try {
      await onSubmit(mensaje.trim(), visibilidad);
      setMensaje(''); // limpiamos solo si salió bien
    } catch {
      // el error ya se mostró por snackbar; conservamos el texto para reintentar
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          label="Nuevo comentario"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          disabled={submitting}
          multiline
          minRows={2}
          fullWidth
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            select
            size="small"
            label="Visibilidad"
            value={visibilidad}
            onChange={(e) => setVisibilidad(e.target.value as Visibilidad)}
            disabled={submitting}
            sx={{ minWidth: 180 }}
          >
            {(Object.keys(VIS_LABEL) as Visibilidad[]).map((v) => (
              <MenuItem key={v} value={v}>
                {VIS_LABEL[v]}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            onClick={enviar}
            disabled={submitting || mensaje.trim() === ''}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            Comentar
          </Button>
        </Stack>
      </Stack>

      {loading && (
        <Stack spacing={1}>
          <Skeleton variant="rounded" height={64} />
          <Skeleton variant="rounded" height={64} />
        </Stack>
      )}

      {error && !loading && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onReload}>
              Reintentar
            </Button>
          }
        >
          No se pudieron cargar los comentarios.
        </Alert>
      )}

      {!loading && !error && comentarios.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Todavía no hay comentarios.
        </Typography>
      )}

      {!loading && !error && (
        <Stack spacing={1.5}>
          {comentarios.map((c) => (
            <Paper key={c.id} variant="outlined" sx={{ p: 1.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.5,
                  flexWrap: 'wrap',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {c.autorTipo === 'INTERNO' ? 'Interno' : 'Externo'} · {c.autorId.slice(0, 8)}
                  </Typography>
                  <Chip label={VIS_LABEL[c.visibilidad]} size="small" variant="outlined" />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(c.fecha)}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {c.mensaje}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
