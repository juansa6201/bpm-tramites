'use client';

import { BarChart } from '@mui/x-charts/BarChart';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Conteo } from '@/types/dashboard';

interface Props {
  titulo: string;
  data: Conteo[];
  /** Traduce la clave (estado/areaId) a una etiqueta legible. */
  label?: (clave: string) => string;
}

/** Gráfico de barras de un conteo {clave, cantidad}, con fallback de vacío. */
export function ConteoBar({ titulo, data, label }: Props) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {titulo}
      </Typography>
      {data.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Sin datos.
        </Typography>
      ) : (
        <BarChart
          height={280}
          xAxis={[{ scaleType: 'band', data: data.map((d) => (label ? label(d.clave) : d.clave)) }]}
          series={[{ data: data.map((d) => d.cantidad), color: '#1565c0' }]}
          margin={{ left: 40, right: 16, top: 16, bottom: 60 }}
        />
      )}
    </Box>
  );
}
