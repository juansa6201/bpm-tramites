'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTiposIniciables } from '@/hooks/useTiposIniciables';
import { crearTramiteExterno } from '@/lib/tramites-externos';
import { useNotify } from '@/context/SnackbarContext';
import type { PrioridadTramite } from '@/types/tramite';

const PRIORIDADES: PrioridadTramite[] = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];

const schema = Yup.object({
  tipoTramiteId: Yup.string().required('Elegí un tipo de trámite'),
  titulo: Yup.string().trim().required('El título es obligatorio'),
  descripcion: Yup.string().trim().required('La descripción es obligatoria'),
  prioridad: Yup.string().oneOf(PRIORIDADES).required(),
});

export default function NuevoTramiteExternoPage() {
  const router = useRouter();
  const notify = useNotify();
  const tipos = useTiposIniciables();

  const formik = useFormik({
    initialValues: {
      tipoTramiteId: '',
      titulo: '',
      descripcion: '',
      prioridad: 'MEDIA' as PrioridadTramite,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await crearTramiteExterno({
          tipoTramiteId: values.tipoTramiteId,
          titulo: values.titulo.trim(),
          descripcion: values.descripcion.trim(),
          prioridad: values.prioridad,
        });
        notify(`Trámite ${res.numero} creado.`, 'success');
        router.replace(`/externo/tramites/${res.id}`);
      } catch {
        // el api-client ya mostró el error
      } finally {
        setSubmitting(false);
      }
    },
  });

  const sinTipos = !tipos.loading && !tipos.error && tipos.data.length === 0;

  return (
    <Box>
      <Button
        component={Link}
        href="/externo/tramites"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Volver a mis trámites
      </Button>
      <Typography variant="h4" gutterBottom>
        Nuevo trámite
      </Typography>

      <Card variant="outlined" sx={{ maxWidth: 640 }}>
        <CardContent>
          {tipos.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              No se pudieron cargar los tipos de trámite. Recargá la página.
            </Alert>
          )}
          {sinTipos && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No hay tipos disponibles para iniciar en este momento.
            </Alert>
          )}
          <form onSubmit={formik.handleSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                select
                name="tipoTramiteId"
                label="Tipo de trámite"
                value={formik.values.tipoTramiteId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.tipoTramiteId && Boolean(formik.errors.tipoTramiteId)}
                helperText={
                  (formik.touched.tipoTramiteId && formik.errors.tipoTramiteId) ||
                  (tipos.loading ? 'Cargando tipos…' : ' ')
                }
                disabled={tipos.loading || formik.isSubmitting}
                fullWidth
              >
                {tipos.data.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.nombre}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                name="titulo"
                label="Título"
                value={formik.values.titulo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.titulo && Boolean(formik.errors.titulo)}
                helperText={formik.touched.titulo && formik.errors.titulo}
                disabled={formik.isSubmitting}
                fullWidth
              />

              <TextField
                name="descripcion"
                label="Descripción"
                value={formik.values.descripcion}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.descripcion && Boolean(formik.errors.descripcion)}
                helperText={formik.touched.descripcion && formik.errors.descripcion}
                disabled={formik.isSubmitting}
                multiline
                minRows={3}
                fullWidth
              />

              <TextField
                select
                name="prioridad"
                label="Prioridad"
                value={formik.values.prioridad}
                onChange={formik.handleChange}
                disabled={formik.isSubmitting}
                fullWidth
              >
                {PRIORIDADES.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </TextField>

              <Alert severity="info" variant="outlined">
                El trámite se crea como borrador. Después vas a poder ingresarlo desde el detalle
                para que el equipo lo reciba.
              </Alert>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button component={Link} href="/externo/tramites" disabled={formik.isSubmitting}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={formik.isSubmitting}
                  startIcon={
                    formik.isSubmitting ? <CircularProgress size={18} color="inherit" /> : null
                  }
                >
                  Crear trámite
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
