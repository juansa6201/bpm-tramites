'use client';

import * as React from 'react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { useMisTramites } from '@/hooks/useMisTramites';
import { EstadoChip } from '@/components/interno/tramites/EstadoChip';
import { PrioridadChip } from '@/components/interno/tramites/PrioridadChip';
import { SlaBadge } from '@/components/interno/tramites/SlaBadge';
import { formatDate } from '@/lib/format';

export default function MisTramitesPage() {
  const { data, loading, error, reload } = useMisTramites();
  const items = data?.items ?? [];

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 3 }}
      >
        <Typography variant="h4">Mis trámites</Typography>
        <Button
          component={Link}
          href="/externo/tramites/nuevo"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nuevo trámite
        </Button>
      </Stack>

      {loading && (
        <Stack spacing={1.5}>
          <Skeleton variant="rounded" height={96} />
          <Skeleton variant="rounded" height={96} />
          <Skeleton variant="rounded" height={96} />
        </Stack>
      )}

      {error && !loading && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={reload}>
              Reintentar
            </Button>
          }
        >
          No se pudieron cargar tus trámites.
        </Alert>
      )}

      {!loading && !error && items.length === 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body1" gutterBottom>
              Todavía no tenés trámites.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Iniciá uno nuevo para empezar a gestionarlo con la organización.
            </Typography>
            <Button
              component={Link}
              href="/externo/tramites/nuevo"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Nuevo trámite
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && items.length > 0 && (
        <Stack spacing={1.5}>
          {items.map((t) => (
            <Card key={t.id} variant="outlined">
              <CardActionArea component={Link} href={`/externo/tramites/${t.id}`}>
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap={1}
                    flexWrap="wrap"
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {t.numero}
                      </Typography>
                      <Typography variant="subtitle1">{t.titulo}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                      <EstadoChip estado={t.estado} />
                      <PrioridadChip prioridad={t.prioridad} />
                    </Stack>
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 1.5 }}
                    gap={1}
                    flexWrap="wrap"
                  >
                    <Typography variant="caption" color="text.secondary">
                      Creado el {formatDate(t.fechaCreacion)}
                    </Typography>
                    <SlaBadge fechaVencimiento={t.fechaVencimiento} vencido={t.slaVencido} />
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
