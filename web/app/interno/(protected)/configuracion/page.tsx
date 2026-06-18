'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '@/context/AuthContext';
import { useAreas } from '@/hooks/useLookups';
import { useTiposTramite } from '@/hooks/useTiposTramite';
import { AreaFormDialog } from '@/components/interno/config/AreaFormDialog';
import { TipoTramiteFormDialog } from '@/components/interno/config/TipoTramiteFormDialog';
import type { Area } from '@/types/tramite';
import type { TipoTramite } from '@/types/config';

function ActivoChip({ activo }: { activo: boolean }) {
  return (
    <Chip
      size="small"
      label={activo ? 'Activa' : 'Inactiva'}
      color={activo ? 'success' : 'default'}
      variant={activo ? 'filled' : 'outlined'}
    />
  );
}

function AreasTab({ isAdmin }: { isAdmin: boolean }) {
  const { areas, reload } = useAreas();
  // undefined = dialog cerrado · null = alta · Area = edición
  const [dialog, setDialog] = React.useState<Area | null | undefined>(undefined);

  return (
    <Box>
      {isAdmin && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog(null)}>
            Nueva área
          </Button>
        </Box>
      )}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
              {isAdmin && (
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Acciones
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {areas.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No hay áreas.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {areas.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell>{a.nombre}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{a.codigo}</TableCell>
                <TableCell>
                  <ActivoChip activo={a.activa} />
                </TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" aria-label="editar" onClick={() => setDialog(a)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AreaFormDialog area={dialog} onClose={() => setDialog(undefined)} onSaved={reload} />
    </Box>
  );
}

function TiposTab({ isAdmin }: { isAdmin: boolean }) {
  const tipos = useTiposTramite();
  const { areas, areaNombre } = useAreas();
  const [dialog, setDialog] = React.useState<TipoTramite | null | undefined>(undefined);

  const cols = isAdmin ? 6 : 5;

  return (
    <Box>
      {isAdmin && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog(null)}>
            Nuevo tipo
          </Button>
        </Box>
      )}
      {tipos.error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={tipos.reload}>
              Reintentar
            </Button>
          }
        >
          No se pudieron cargar los tipos de trámite.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>SLA (h)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Área inicial</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                {isAdmin && (
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Acciones
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {!tipos.loading && tipos.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={cols}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No hay tipos de trámite.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {tipos.data.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{t.codigo}</TableCell>
                  <TableCell>{t.nombre}</TableCell>
                  <TableCell>{t.slaHoras}</TableCell>
                  <TableCell>{areaNombre(t.areaInicialId)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={t.activo ? 'Activo' : 'Inactivo'}
                      color={t.activo ? 'success' : 'default'}
                      variant={t.activo ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <IconButton size="small" aria-label="editar" onClick={() => setDialog(t)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TipoTramiteFormDialog
        tipo={dialog}
        areas={areas}
        onClose={() => setDialog(undefined)}
        onSaved={tipos.reload}
      />
    </Box>
  );
}

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';
  const [tab, setTab] = React.useState(0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configuración
      </Typography>
      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Solo lectura. La edición de configuración está reservada a administradores.
        </Alert>
      )}
      <Tabs value={tab} onChange={(_, v) => setTab(v as number)} sx={{ mb: 2 }}>
        <Tab label="Áreas" />
        <Tab label="Tipos de trámite" />
      </Tabs>
      {tab === 0 ? <AreasTab isAdmin={isAdmin} /> : <TiposTab isAdmin={isAdmin} />}
    </Box>
  );
}
