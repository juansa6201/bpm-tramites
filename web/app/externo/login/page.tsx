'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useExternalAuth } from '@/context/ExternalAuthContext';

const schema = Yup.object({
  email: Yup.string().email('Email inválido').required('El email es obligatorio'),
  password: Yup.string().required('La contraseña es obligatoria'),
});

export default function ExternalLoginPage() {
  const { login, status } = useExternalAuth();
  const router = useRouter();

  // Si ya hay sesión externa activa, no tiene sentido quedarse en el login.
  React.useEffect(() => {
    if (status === 'authenticated') router.replace('/externo');
  }, [status, router]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await login(values.email.trim(), values.password);
        // La redirección la hace el effect cuando status pasa a 'authenticated'.
      } catch {
        // El api-client ya mostró el snackbar (credenciales / cuenta no activa).
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Ya autenticado (o todavía hidratando): no mostramos el form, evitamos el flash.
  if (status === 'loading' || status === 'authenticated') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Portal externo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresá con tu email y contraseña.
          </Typography>
          <form onSubmit={formik.handleSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Email"
                name="email"
                type="email"
                fullWidth
                autoFocus
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={formik.isSubmitting}
              />
              <TextField
                label="Contraseña"
                name="password"
                type="password"
                fullWidth
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
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
                Ingresar
              </Button>
            </Stack>
          </form>
          <Typography variant="body2" sx={{ mt: 3 }}>
            ¿No tenés cuenta?{' '}
            <MuiLink component={Link} href="/externo/registro">
              Registrate
            </MuiLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
