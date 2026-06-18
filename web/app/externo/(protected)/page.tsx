'use client';

import * as React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { useExternalAuth } from '@/context/ExternalAuthContext';

export default function ExternalHomePage() {
  const { user } = useExternalAuth();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Hola{user?.nombre ? `, ${user.nombre}` : ''}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Este es tu portal para gestionar trámites con la organización.
        </Typography>
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tus datos
          </Typography>
          <Typography variant="body2">
            <strong>Email:</strong> {user?.email}
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Mis trámites
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Iniciá un nuevo trámite o seguí el estado de los que ya tenés.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={Link} href="/externo/tramites" variant="outlined">
              Ver mis trámites
            </Button>
            <Button
              component={Link}
              href="/externo/tramites/nuevo"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Nuevo trámite
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
