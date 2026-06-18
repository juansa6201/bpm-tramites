'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/Inbox';
import { alpha } from '@mui/material/styles';
import { EstadoChip } from './EstadoChip';
import { PrioridadChip } from './PrioridadChip';
import { SlaBadge } from './SlaBadge';
import { formatDate } from '@/lib/format';
import type { Paginated, TramiteListItem, TramitesFilters } from '@/types/tramite';

const ORIGEN_LABEL: Record<string, string> = {
  INTERNO_INTERNO: 'Interno → Interno',
  INTERNO_EXTERNO: 'Interno → Externo',
  EXTERNO_INTERNO: 'Externo → Interno',
};

const COLUMNS = [
  'Número',
  'Título',
  'Estado',
  'Prioridad',
  'Área',
  'Origen',
  'Creado',
  'Vencimiento',
];
const COL_COUNT = COLUMNS.length;

interface Props {
  data: Paginated<TramiteListItem> | null;
  loading: boolean;
  error: boolean;
  filtros: TramitesFilters;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onReload: () => void;
  areaNombre: (id: string | null) => string;
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: COL_COUNT }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton variant="text" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function StateRow({ children }: { children: React.ReactNode }) {
  return (
    <TableRow>
      <TableCell colSpan={COL_COUNT} sx={{ border: 0 }}>
        <Box
          sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}
        >
          {children}
        </Box>
      </TableCell>
    </TableRow>
  );
}

export function TramitesTabla({
  data,
  loading,
  error,
  filtros,
  onPageChange,
  onPageSizeChange,
  onReload,
  areaNombre,
}: Props) {
  const router = useRouter();
  const items = data?.items ?? [];
  const isEmpty = !loading && !error && items.length === 0;

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small" aria-label="Bandeja de trámites">
          <TableHead>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableCell key={c} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {c}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {error && (
              <StateRow>
                <Alert
                  severity="error"
                  action={
                    <Button color="inherit" size="small" onClick={onReload}>
                      Reintentar
                    </Button>
                  }
                  sx={{ width: '100%', maxWidth: 480 }}
                >
                  No se pudieron cargar los trámites.
                </Alert>
              </StateRow>
            )}

            {loading && !error && <SkeletonRows rows={Math.min(filtros.pageSize, 8)} />}

            {isEmpty && (
              <StateRow>
                <InboxIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography color="text.secondary">No hay trámites para estos filtros.</Typography>
              </StateRow>
            )}

            {!loading &&
              !error &&
              items.map((t) => (
                <TableRow
                  key={t.id}
                  hover
                  onClick={() => router.push(`/interno/tramites/${t.id}`)}
                  sx={{
                    cursor: 'pointer',
                    ...(t.slaVencido
                      ? { backgroundColor: (theme) => alpha(theme.palette.error.main, 0.08) }
                      : {}),
                  }}
                >
                  <TableCell sx={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                    {t.numero}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography variant="body2" noWrap title={t.titulo}>
                      {t.titulo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <EstadoChip estado={t.estado} />
                  </TableCell>
                  <TableCell>
                    <PrioridadChip prioridad={t.prioridad} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{areaNombre(t.areaActualId)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {ORIGEN_LABEL[t.origen] ?? t.origen}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(t.fechaCreacion)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <SlaBadge fechaVencimiento={t.fechaVencimiento} vencido={t.slaVencido} />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* En estado de error no mostramos el footer: el `data` viejo quedaría
          retenido y mostraría conteos contradictorios bajo el mensaje de error. */}
      {!error && (
        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={data ? data.page - 1 : 0}
          onPageChange={(_, page) => onPageChange(page + 1)}
          rowsPerPage={filtros.pageSize}
          onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      )}
    </Paper>
  );
}
