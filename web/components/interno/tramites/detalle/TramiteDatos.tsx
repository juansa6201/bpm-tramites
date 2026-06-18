'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { EstadoChip } from '../EstadoChip';
import { PrioridadChip } from '../PrioridadChip';
import { formatDateTime } from '@/lib/format';
import type { TramiteDetalle } from '@/types/tramite';

const ORIGEN_LABEL: Record<string, string> = {
  INTERNO_INTERNO: 'Interno → Interno',
  INTERNO_EXTERNO: 'Interno → Externo',
  EXTERNO_INTERNO: 'Externo → Interno',
};

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}

interface Props {
  tramite: TramiteDetalle;
  /** Resolver id→nombre de área. Si se omite (portal externo) no se muestra el área. */
  areaNombre?: (id: string | null) => string;
}

export function TramiteDatos({ tramite, areaNombre }: Props) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ sm: 'flex-start' }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {tramite.numero}
            </Typography>
            <Typography variant="h5">{tramite.titulo}</Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <EstadoChip estado={tramite.estado} />
            <PrioridadChip prioridad={tramite.prioridad} />
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          <Campo label="Origen">{ORIGEN_LABEL[tramite.origen] ?? tramite.origen}</Campo>
          {areaNombre && <Campo label="Área actual">{areaNombre(tramite.areaActualId)}</Campo>}
          <Campo label="Creado">{formatDateTime(tramite.fechaCreacion)}</Campo>
          <Campo label="Última actualización">{formatDateTime(tramite.fechaActualizacion)}</Campo>
          {tramite.fechaCierre && (
            <Campo label="Cerrado">{formatDateTime(tramite.fechaCierre)}</Campo>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Campo label="Descripción">
          <Box component="span" sx={{ whiteSpace: 'pre-wrap' }}>
            {tramite.descripcion}
          </Box>
        </Campo>
      </CardContent>
    </Card>
  );
}
