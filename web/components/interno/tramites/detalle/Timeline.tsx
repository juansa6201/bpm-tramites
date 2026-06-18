'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { EstadoChip } from '../EstadoChip';
import { ACCION_LABEL } from '@/lib/acciones';
import { formatDateTime } from '@/lib/format';
import type { MovimientoTramite } from '@/types/tramite';

interface Props {
  movimientos: MovimientoTramite[];
  areaNombre: (id: string | null) => string;
}

function autorTexto(tipo: string, id: string): string {
  const rol = tipo === 'INTERNO' ? 'Interno' : 'Externo';
  return `${rol} · ${id.slice(0, 8)}`;
}

/** Timeline vertical de movimientos (sin @mui/lab). Orden cronológico (más viejo arriba). */
export function Timeline({ movimientos, areaNombre }: Props) {
  if (movimientos.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Sin movimientos.
      </Typography>
    );
  }

  return (
    <Box>
      {movimientos.map((m, i) => {
        const last = i === movimientos.length - 1;
        const cambioArea =
          m.areaNuevaId && m.areaNuevaId !== m.areaAnteriorId
            ? `${areaNombre(m.areaAnteriorId)} → ${areaNombre(m.areaNuevaId)}`
            : null;
        return (
          <Box key={m.id} sx={{ display: 'flex', gap: 2 }}>
            {/* Columna del eje: punto + línea */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  mt: 0.5,
                  flexShrink: 0,
                }}
              />
              {!last && <Box sx={{ width: '2px', flexGrow: 1, bgcolor: 'divider', my: 0.5 }} />}
            </Box>

            {/* Contenido */}
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, flexGrow: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Typography variant="subtitle2">{ACCION_LABEL[m.accion] ?? m.accion}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(m.fecha)}
                </Typography>
              </Box>

              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', my: 0.5 }}
              >
                {m.estadoAnterior && (
                  <>
                    <EstadoChip estado={m.estadoAnterior} />
                    <Typography variant="caption">→</Typography>
                  </>
                )}
                <EstadoChip estado={m.estadoNuevo} />
              </Box>

              {cambioArea && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Área: {cambioArea}
                </Typography>
              )}

              <Typography variant="caption" color="text.secondary" display="block">
                {autorTexto(m.usuarioTipo, m.usuarioId)}
              </Typography>

              {m.comentario && (
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {m.comentario}
                </Typography>
              )}
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
}
