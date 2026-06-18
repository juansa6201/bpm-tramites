'use client';

import Chip, { type ChipProps } from '@mui/material/Chip';
import type { PrioridadTramite } from '@/types/tramite';

const META: Record<PrioridadTramite, { label: string; color: ChipProps['color'] }> = {
  BAJA: { label: 'Baja', color: 'default' },
  MEDIA: { label: 'Media', color: 'info' },
  ALTA: { label: 'Alta', color: 'warning' },
  URGENTE: { label: 'Urgente', color: 'error' },
};

export function PrioridadChip({ prioridad }: { prioridad: PrioridadTramite }) {
  const meta = META[prioridad] ?? { label: prioridad, color: 'default' as const };
  return <Chip label={meta.label} color={meta.color} size="small" variant="outlined" />;
}
