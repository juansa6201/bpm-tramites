'use client';

import * as React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useDashboard } from '@/hooks/useDashboard';
import { useAreas } from '@/hooks/useLookups';
import { MetricCard } from '@/components/interno/dashboard/MetricCard';
import { ConteoBar } from '@/components/interno/dashboard/ConteoBar';
import { Timeline } from '@/components/interno/tramites/detalle/Timeline';
import { estadoLabel, origenLabel } from '@/lib/labels';

export default function DashboardPage() {
  const { data, loading, error, reload } = useDashboard();
  const { areaNombre } = useAreas();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={reload}>
            Reintentar
          </Button>
        }
      >
        No se pudo cargar el dashboard.
      </Alert>
    );
  }

  const promedio =
    data.promedioResolucionHoras !== null ? `${data.promedioResolucionHoras.toFixed(1)} h` : '—';
  const areaLabel = (clave: string) => (clave === 'SIN_AREA' ? 'Sin área' : areaNombre(clave));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        <MetricCard
          label="Vencidos por SLA"
          value={data.vencidosPorSla}
          hint="Trámites activos pasados de fecha"
        />
        <MetricCard
          label="Promedio de resolución"
          value={promedio}
          hint="Desde creación al cierre"
        />
        <MetricCard
          label="Alcance"
          value={data.alcance === 'GLOBAL' ? 'Global' : 'Mi área'}
          hint={data.alcance === 'AREA' ? areaNombre(data.areaId) : 'Todas las áreas'}
        />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
          mb: 2,
        }}
      >
        <Paper variant="outlined" sx={{ p: 2 }}>
          <ConteoBar titulo="Por estado" data={data.porEstado} label={estadoLabel} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Por origen
          </Typography>
          {data.porOrigen.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Sin datos.
            </Typography>
          ) : (
            <PieChart
              height={280}
              series={[
                {
                  data: data.porOrigen.map((d, i) => ({
                    id: i,
                    value: d.cantidad,
                    label: origenLabel(d.clave),
                  })),
                },
              ]}
            />
          )}
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <ConteoBar titulo="Cantidad por área" data={data.cantidadPorArea} label={areaLabel} />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Últimos movimientos
        </Typography>
        <Timeline movimientos={data.ultimosMovimientos} areaNombre={areaNombre} />
      </Paper>
    </Box>
  );
}
