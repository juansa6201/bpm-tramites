'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import type {
  Area,
  EstadoTramite,
  OrigenTramite,
  PrioridadTramite,
  TramitesFilters,
} from '@/types/tramite';

const ESTADOS: { value: EstadoTramite; label: string }[] = [
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'INGRESADO', label: 'Ingresado' },
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'OBSERVADO', label: 'Observado' },
  { value: 'ESPERANDO_EXTERNO', label: 'Esperando externo' },
  { value: 'ESPERANDO_INTERNO', label: 'Esperando interno' },
  { value: 'APROBADO', label: 'Aprobado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'CERRADO', label: 'Cerrado' },
];

const PRIORIDADES: { value: PrioridadTramite; label: string }[] = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

const ORIGENES: { value: OrigenTramite; label: string }[] = [
  { value: 'INTERNO_INTERNO', label: 'Interno → Interno' },
  { value: 'INTERNO_EXTERNO', label: 'Interno → Externo' },
  { value: 'EXTERNO_INTERNO', label: 'Externo → Interno' },
];

interface Props {
  filtros: TramitesFilters;
  /** Aplica un cambio parcial de filtros (el padre resetea la página). */
  onChange: (patch: Partial<TramitesFilters>) => void;
  onReset: () => void;
  areas: Area[];
  /** El filtro de área solo tiene sentido para ADMIN/AUDITOR (el resto ve su área). */
  showArea: boolean;
}

const TODOS = '__TODOS__';

export function TramitesFiltros({ filtros, onChange, onReset, areas, showArea }: Props) {
  const fieldSx = { minWidth: 180, flex: '1 1 180px' } as const;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'flex-end',
        mb: 2,
      }}
    >
      <TextField
        select
        size="small"
        label="Estado"
        sx={fieldSx}
        value={filtros.estado ?? TODOS}
        onChange={(e) =>
          onChange({
            estado: e.target.value === TODOS ? undefined : (e.target.value as EstadoTramite),
          })
        }
      >
        <MenuItem value={TODOS}>Todos</MenuItem>
        {ESTADOS.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Prioridad"
        sx={fieldSx}
        value={filtros.prioridad ?? TODOS}
        onChange={(e) =>
          onChange({
            prioridad: e.target.value === TODOS ? undefined : (e.target.value as PrioridadTramite),
          })
        }
      >
        <MenuItem value={TODOS}>Todas</MenuItem>
        {PRIORIDADES.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Origen"
        sx={fieldSx}
        value={filtros.origen ?? TODOS}
        onChange={(e) =>
          onChange({
            origen: e.target.value === TODOS ? undefined : (e.target.value as OrigenTramite),
          })
        }
      >
        <MenuItem value={TODOS}>Todos</MenuItem>
        {ORIGENES.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>

      {showArea && (
        <TextField
          select
          size="small"
          label="Área"
          sx={fieldSx}
          value={filtros.areaActualId ?? TODOS}
          onChange={(e) =>
            onChange({ areaActualId: e.target.value === TODOS ? undefined : e.target.value })
          }
        >
          <MenuItem value={TODOS}>Todas</MenuItem>
          {areas.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.nombre}
            </MenuItem>
          ))}
        </TextField>
      )}

      <TextField
        type="date"
        size="small"
        label="Creado desde"
        sx={fieldSx}
        InputLabelProps={{ shrink: true }}
        value={filtros.creadoDesde ?? ''}
        onChange={(e) => onChange({ creadoDesde: e.target.value || undefined })}
      />

      <TextField
        type="date"
        size="small"
        label="Creado hasta"
        sx={fieldSx}
        InputLabelProps={{ shrink: true }}
        value={filtros.creadoHasta ?? ''}
        onChange={(e) => onChange({ creadoHasta: e.target.value || undefined })}
      />

      <Button variant="text" onClick={onReset} sx={{ flex: '0 0 auto' }}>
        Limpiar
      </Button>
    </Box>
  );
}
