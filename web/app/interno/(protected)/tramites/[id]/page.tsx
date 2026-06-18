'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTramiteDetalle } from '@/hooks/useTramiteDetalle';
import { useComentarios } from '@/hooks/useComentarios';
import { useAreas } from '@/hooks/useLookups';
import { addComentario } from '@/lib/tramites-api';
import { ACCIONES } from '@/lib/acciones';
import { useNotify } from '@/context/SnackbarContext';
import { TramiteDatos } from '@/components/interno/tramites/detalle/TramiteDatos';
import { Timeline } from '@/components/interno/tramites/detalle/Timeline';
import { Comentarios } from '@/components/interno/tramites/detalle/Comentarios';
import { AccionesBar } from '@/components/interno/tramites/detalle/AccionesBar';
import type { Visibilidad } from '@/types/tramite';

export default function TramiteDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const notify = useNotify();
  const { data, loading, errorStatus, reload } = useTramiteDetalle(id);
  const comentarios = useComentarios(id);
  const { areas, areaNombre } = useAreas();

  const onAccionDone = () => {
    reload();
    comentarios.reload();
  };

  const onComentar = async (mensaje: string, visibilidad: Visibilidad) => {
    await addComentario(id, mensaje, visibilidad);
    notify('Comentario agregado.', 'success');
    comentarios.reload();
  };

  const back = (
    <Button component={Link} href="/interno/tramites" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
      Volver a la bandeja
    </Button>
  );

  if (loading) {
    return (
      <Box>
        {back}
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (errorStatus !== null || !data) {
    const recuperable = errorStatus !== 404 && errorStatus !== 403;
    const msg =
      errorStatus === 404
        ? 'El trámite no existe.'
        : errorStatus === 403
          ? 'No tenés permiso para ver este trámite.'
          : 'No se pudo cargar el trámite.';
    return (
      <Box>
        {back}
        <Alert
          severity={errorStatus === 403 ? 'warning' : 'error'}
          action={
            recuperable ? (
              <Button color="inherit" size="small" onClick={reload}>
                Reintentar
              </Button>
            ) : undefined
          }
        >
          {msg}
        </Alert>
      </Box>
    );
  }

  const accionables = data.accionesPermitidas.filter((a) => ACCIONES[a]);

  return (
    <Box>
      {back}
      <Stack spacing={3}>
        <TramiteDatos tramite={data} areaNombre={areaNombre} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Acciones
          </Typography>
          {accionables.length > 0 ? (
            <AccionesBar
              tramiteId={id}
              acciones={data.accionesPermitidas}
              areas={areas}
              onDone={onAccionDone}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay acciones disponibles en el estado actual.
            </Typography>
          )}
        </Box>

        <Divider />

        <Box>
          <Typography variant="h6" gutterBottom>
            Historial
          </Typography>
          <Timeline movimientos={data.movimientos} areaNombre={areaNombre} />
        </Box>

        <Divider />

        <Box>
          <Typography variant="h6" gutterBottom>
            Comentarios
          </Typography>
          <Comentarios
            comentarios={comentarios.data}
            loading={comentarios.loading}
            error={comentarios.error}
            onReload={comentarios.reload}
            onSubmit={onComentar}
          />
        </Box>
      </Stack>
    </Box>
  );
}
