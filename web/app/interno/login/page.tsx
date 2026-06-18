'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAuth } from '@/context/AuthContext';

const schema = Yup.object({
  email: Yup.string().email('Email inválido').required('El email es obligatorio'),
});

export default function LoginPage() {
  const { login, status } = useAuth();
  const router = useRouter();

  // Si ya hay sesión activa, no tiene sentido quedarse en el login.
  React.useEffect(() => {
    if (status === 'authenticated') router.replace('/interno');
  }, [status, router]);

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await login(values.email);
        // No redirigimos a mano: el effect de arriba lo hace cuando status pasa
        // a 'authenticated' (única fuente de la redirección).
      } catch {
        // El api-client ya mostró el snackbar de error.
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
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Portal interno
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresá con tu email corporativo.
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
        </CardContent>
      </Card>
    </Box>
  );
}
