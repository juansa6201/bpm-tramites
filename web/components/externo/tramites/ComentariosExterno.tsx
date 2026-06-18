'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { formatDateTime } from '@/lib/format';
import type { Comentario } from '@/types/tramite';

interface Props {
  comentarios: Comentario[];
  loading: boolean;
  error: boolean;
  onReload: () => void;
  /** Resuelve al persistir; rechaza si falló (el api-client ya avisó). */
  onSubmit: (mensaje: string) => Promise<void>;
}

/**
 * Comentarios del portal externo. Sin selector de visibilidad: el externo solo
 * puede comentar para TODOS (lo fuerza el backend) y solo ve los no-internos.
 */
export function ComentariosExterno({ comentarios, loading, error, onReload, onSubmit }: Props) {
  const [mensaje, setMensaje] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const enviar = async () => {
    if (mensaje.trim() === '') return;
    setSubmitting(true);
    try {
      await onSubmit(mensaje.trim());
      setMensaje('');
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={enviar}
            disabled={submitting || mensaje.trim() === ''}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            Comentar
          </Button>
        </Box>
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
                <Typography variant="caption" color="text.secondary">
                  {c.autorTipo === 'INTERNO' ? 'Equipo interno' : 'Vos'}
                </Typography>
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
