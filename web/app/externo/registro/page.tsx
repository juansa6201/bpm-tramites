'use client';

import * as React from 'react';
import Link from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { registerExternal } from '@/lib/auth-externos';
import { useNotify } from '@/context/SnackbarContext';

const schema = Yup.object({
  nombre: Yup.string().trim().required('El nombre es obligatorio'),
  email: Yup.string().email('Email inválido').required('El email es obligatorio'),
  documento: Yup.string().trim().required('El documento es obligatorio'),
  organizacion: Yup.string(),
  password: Yup.string().min(8, 'Mínimo 8 caracteres').required('La contraseña es obligatoria'),
  confirmar: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Repetí la contraseña'),
});

export default function ExternalRegisterPage() {
  const notify = useNotify();
  const [registrado, setRegistrado] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      nombre: '',
      email: '',
      documento: '',
      organizacion: '',
      password: '',
      confirmar: '',
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await registerExternal({
          nombre: values.nombre.trim(),
          email: values.email.trim(),
          documento: values.documento.trim(),
          organizacion: values.organizacion.trim() || undefined,
          password: values.password,
        });
        notify('Registro creado.', 'success');
        setRegistrado(true);
      } catch {
        // El api-client ya mostró el error (ej: email o documento en uso).
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 480 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Crear cuenta externa
          </Typography>

          {registrado ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="success">
                Tu cuenta fue creada y queda <strong>pendiente de verificación</strong>. Un
                administrador la activará antes de que puedas ingresar.
              </Alert>
              <Button component={Link} href="/externo/login" variant="contained">
                Ir al login
              </Button>
            </Stack>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Completá tus datos. La cuenta quedará pendiente de verificación.
              </Typography>
              <form onSubmit={formik.handleSubmit} noValidate>
                <Stack spacing={2}>
                  <TextField
                    name="nombre"
                    label="Nombre"
                    fullWidth
                    autoFocus
                    value={formik.values.nombre}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                    helperText={formik.touched.nombre && formik.errors.nombre}
                    disabled={formik.isSubmitting}
                  />
                  <TextField
                    name="email"
                    label="Email"
                    type="email"
                    fullWidth
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    disabled={formik.isSubmitting}
                  />
                  <TextField
                    name="documento"
                    label="Documento"
                    fullWidth
                    value={formik.values.documento}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.documento && Boolean(formik.errors.documento)}
                    helperText={formik.touched.documento && formik.errors.documento}
                    disabled={formik.isSubmitting}
                  />
                  <TextField
                    name="organizacion"
                    label="Organización (opcional)"
                    fullWidth
                    value={formik.values.organizacion}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={formik.isSubmitting}
                  />
                  <TextField
                    name="password"
                    label="Contraseña"
                    type="password"
                    fullWidth
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    disabled={formik.isSubmitting}
                  />
                  <TextField
                    name="confirmar"
                    label="Repetir contraseña"
                    type="password"
                    fullWidth
                    value={formik.values.confirmar}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirmar && Boolean(formik.errors.confirmar)}
                    helperText={formik.touched.confirmar && formik.errors.confirmar}
                    disabled={formik.isSubmitting}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={formik.isSubmitting}
                    startIcon={
                      formik.isSubmitting ? <CircularProgress size={18} color="inherit" /> : null
                    }
                  >
                    Crear cuenta
                  </Button>
                </Stack>
              </form>
              <Typography variant="body2" sx={{ mt: 3 }}>
                ¿Ya tenés cuenta?{' '}
                <MuiLink component={Link} href="/externo/login">
                  Ingresá
                </MuiLink>
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
