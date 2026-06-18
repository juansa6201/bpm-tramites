'use client';

import * as React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '@/context/AuthContext';
import { useTramites } from '@/hooks/useTramites';
import { useAreas } from '@/hooks/useLookups';
import { TramitesFiltros } from '@/components/interno/tramites/TramitesFiltros';
import { TramitesTabla } from '@/components/interno/tramites/TramitesTabla';
import type { TramitesFilters } from '@/types/tramite';

const DEFAULT_FILTROS: TramitesFilters = { page: 1, pageSize: 20 };

export default function TramitesPage() {
  const { user } = useAuth();
  const [filtros, setFiltros] = React.useState<TramitesFilters>(DEFAULT_FILTROS);
  const { data, loading, error, reload } = useTramites(filtros);
  const { areas, areaNombre } = useAreas();

  // El filtro de área solo aplica para quienes ven más de un área.
  const showArea = user?.rol === 'ADMIN' || user?.rol === 'AUDITOR';

  // Cualquier cambio de filtro vuelve a página 1 (el total y el offset cambian).
  const patch = (p: Partial<TramitesFilters>) => setFiltros((f) => ({ ...f, ...p, page: 1 }));
  const reset = () => setFiltros(DEFAULT_FILTROS);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h4">Trámites</Typography>
        <Button
          component={Link}
          href="/interno/tramites/nuevo"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nuevo trámite
        </Button>
      </Box>
      <TramitesFiltros
        filtros={filtros}
        onChange={patch}
        onReset={reset}
        areas={areas}
        showArea={showArea}
      />
      <TramitesTabla
        data={data}
        loading={loading}
        error={error}
        filtros={filtros}
        onPageChange={(page) => setFiltros((f) => ({ ...f, page }))}
        onPageSizeChange={(pageSize) => setFiltros((f) => ({ ...f, pageSize, page: 1 }))}
        onReload={reload}
        areaNombre={areaNombre}
      />
    </Box>
  );
}
