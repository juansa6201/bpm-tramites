'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Autocomplete from '@mui/material/Autocomplete';
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
import { useAreas } from '@/hooks/useLookups';
import { useTiposTramite } from '@/hooks/useTiposTramite';
import { crearTramite, listUsuariosExternos } from '@/lib/tramites-api';
import { useNotify } from '@/context/SnackbarContext';
import type { CrearTramiteBody, OrigenTramite, PrioridadTramite } from '@/types/tramite';
import type { UsuarioExterno } from '@/types/config';

const ORIGENES: { value: OrigenTramite; label: string }[] = [
  { value: 'INTERNO_INTERNO', label: 'Interno → Interno' },
  { value: 'INTERNO_EXTERNO', label: 'Interno → Externo' },
];

const PRIORIDADES: PrioridadTramite[] = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];

const schema = Yup.object({
  origen: Yup.string().oneOf(['INTERNO_INTERNO', 'INTERNO_EXTERNO']).required(),
  tipoTramiteId: Yup.string().required('Elegí un tipo de trámite'),
  titulo: Yup.string().trim().required('El título es obligatorio'),
  descripcion: Yup.string().trim().required('La descripción es obligatoria'),
  prioridad: Yup.string().oneOf(PRIORIDADES).required(),
  areaActualId: Yup.string(),
  usuarioExternoId: Yup.string().when('origen', {
    is: 'INTERNO_EXTERNO',
    then: (s) => s.required('Elegí el usuario externo'),
    otherwise: (s) => s.optional(),
  }),
});

export default function NuevoTramitePage() {
  const router = useRouter();
  const notify = useNotify();
  const { areas } = useAreas();
  const tipos = useTiposTramite();
  const [externos, setExternos] = React.useState<UsuarioExterno[]>([]);

  React.useEffect(() => {
    const controller = new AbortController();
    listUsuariosExternos(controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setExternos(res);
      })
      .catch(() => {
        /* el picker queda vacío; el form valida igual al enviar */
      });
    return () => controller.abort();
  }, []);

  const formik = useFormik({
    initialValues: {
      origen: 'INTERNO_INTERNO' as OrigenTramite,
      tipoTramiteId: '',
      titulo: '',
      descripcion: '',
      prioridad: 'MEDIA' as PrioridadTramite,
      areaActualId: '',
      usuarioExternoId: '',
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      const body: CrearTramiteBody = {
        tipoTramiteId: values.tipoTramiteId,
        titulo: values.titulo.trim(),
        descripcion: values.descripcion.trim(),
        origen: values.origen,
        prioridad: values.prioridad,
        ...(values.areaActualId ? { areaActualId: values.areaActualId } : {}),
        ...(values.origen === 'INTERNO_EXTERNO' && values.usuarioExternoId
          ? { usuarioExternoId: values.usuarioExternoId }
          : {}),
      };
      try {
        const res = await crearTramite(body);
        notify(`Trámite ${res.numero} creado.`, 'success');
        router.replace(`/interno/tramites/${res.id}`);
      } catch {
        // el api-client ya mostró el error
      } finally {
        setSubmitting(false);
      }
    },
  });

  const tiposActivos = tipos.data.filter((t) => t.activo);
  const esExterno = formik.values.origen === 'INTERNO_EXTERNO';

  return (
    <Box>
      <Button
        component={Link}
        href="/interno/tramites"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Volver a la bandeja
      </Button>
      <Typography variant="h4" gutterBottom>
        Nuevo trámite
      </Typography>

      <Card variant="outlined" sx={{ maxWidth: 640 }}>
        <CardContent>
          <form onSubmit={formik.handleSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                select
                name="origen"
                label="Circuito"
                value={formik.values.origen}
                onChange={formik.handleChange}
                fullWidth
              >
                {ORIGENES.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>

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
                disabled={tipos.loading}
                fullWidth
              >
                {tiposActivos.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.codigo} — {t.nombre}
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
                multiline
                minRows={3}
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  name="prioridad"
                  label="Prioridad"
                  value={formik.values.prioridad}
                  onChange={formik.handleChange}
                  fullWidth
                >
                  {PRIORIDADES.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  name="areaActualId"
                  label="Área (opcional)"
                  value={formik.values.areaActualId}
                  onChange={formik.handleChange}
                  helperText="Si se deja vacío, usa el área inicial del tipo"
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Área inicial del tipo</em>
                  </MenuItem>
                  {areas.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              {esExterno && (
                <Autocomplete
                  options={externos}
                  getOptionLabel={(o) => `${o.nombre} (${o.email})`}
                  value={externos.find((e) => e.id === formik.values.usuarioExternoId) ?? null}
                  onChange={(_, val) => formik.setFieldValue('usuarioExternoId', val?.id ?? '')}
                  onBlur={() => formik.setFieldTouched('usuarioExternoId', true)}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Usuario externo"
                      required
                      error={
                        formik.touched.usuarioExternoId && Boolean(formik.errors.usuarioExternoId)
                      }
                      helperText={formik.touched.usuarioExternoId && formik.errors.usuarioExternoId}
                    />
                  )}
                />
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button component={Link} href="/interno/tramites" disabled={formik.isSubmitting}>
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
