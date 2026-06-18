'use client';

import Chip, { type ChipProps } from '@mui/material/Chip';
import type { EstadoTramite } from '@/types/tramite';

const META: Record<EstadoTramite, { label: string; color: ChipProps['color'] }> = {
  BORRADOR: { label: 'Borrador', color: 'default' },
  INGRESADO: { label: 'Ingresado', color: 'info' },
  EN_REVISION: { label: 'En revisión', color: 'primary' },
  OBSERVADO: { label: 'Observado', color: 'warning' },
  ESPERANDO_EXTERNO: { label: 'Esperando externo', color: 'warning' },
  ESPERANDO_INTERNO: { label: 'Esperando interno', color: 'info' },
  APROBADO: { label: 'Aprobado', color: 'success' },
  RECHAZADO: { label: 'Rechazado', color: 'error' },
  CANCELADO: { label: 'Cancelado', color: 'default' },
  CERRADO: { label: 'Cerrado', color: 'default' },
};

export function EstadoChip({ estado }: { estado: EstadoTramite }) {
  const meta = META[estado] ?? { label: estado, color: 'default' as const };
  return <Chip label={meta.label} color={meta.color} size="small" />;
}
