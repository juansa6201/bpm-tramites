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
import { useTramiteExterno } from '@/hooks/useTramiteExterno';
import { useComentariosExterno } from '@/hooks/useComentariosExterno';
import { useDocumentosExterno } from '@/hooks/useDocumentosExterno';
import {
  addComentarioExterno,
  descargarDocumentoExterno,
  subirDocumentoExterno,
} from '@/lib/tramites-externos';
import { ACCIONES_EXTERNO } from '@/lib/acciones-externo';
import { useNotify } from '@/context/SnackbarContext';
import { TramiteDatos } from '@/components/interno/tramites/detalle/TramiteDatos';
import { Timeline } from '@/components/interno/tramites/detalle/Timeline';
import { ComentariosExterno } from '@/components/externo/tramites/ComentariosExterno';
import { DocumentosExterno } from '@/components/externo/tramites/DocumentosExterno';
import { AccionesBarExterno } from '@/components/externo/tramites/AccionesBarExterno';
import type { Documento } from '@/types/tramite';

export default function TramiteExternoDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const notify = useNotify();
  const { data, loading, errorStatus, reload } = useTramiteExterno(id);
  const comentarios = useComentariosExterno(id);
  const documentos = useDocumentosExterno(id);

  const onAccionDone = () => {
    reload();
    comentarios.reload();
    documentos.reload();
  };

  const onComentar = async (mensaje: string) => {
    await addComentarioExterno(id, mensaje);
    notify('Comentario agregado.', 'success');
    comentarios.reload();
  };

  const onUpload = async (file: File) => {
    await subirDocumentoExterno(id, file);
    notify('Documento adjuntado.', 'success');
    documentos.reload();
  };

  const onDownload = (doc: Documento) => {
    void descargarDocumentoExterno(id, doc.id, doc.nombreArchivo);
  };

  const back = (
    <Button component={Link} href="/externo/tramites" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
      Volver a mis trámites
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

  const accionables = data.accionesPermitidas.filter((a) => ACCIONES_EXTERNO[a]);

  return (
    <Box>
      {back}
      <Stack spacing={3}>
        {/* Sin areaNombre: el área es un detalle interno que el externo no necesita. */}
        <TramiteDatos tramite={data} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Acciones
          </Typography>
          {accionables.length > 0 ? (
            <AccionesBarExterno
              tramiteId={id}
              acciones={data.accionesPermitidas}
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
            Documentos
          </Typography>
          <DocumentosExterno
            documentos={documentos.data}
            loading={documentos.loading}
            error={documentos.error}
            onReload={documentos.reload}
            onUpload={onUpload}
            onDownload={onDownload}
          />
        </Box>

        <Divider />

        <Box>
          <Typography variant="h6" gutterBottom>
            Historial
          </Typography>
          <Timeline movimientos={data.movimientos} />
        </Box>

        <Divider />

        <Box>
          <Typography variant="h6" gutterBottom>
            Comentarios
          </Typography>
          <ComentariosExterno
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
