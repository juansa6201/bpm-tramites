'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAuth } from '@/context/AuthContext';

export default function InternoHomePage() {
  const { user } = useAuth();
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Inicio
      </Typography>
      <Typography color="text.secondary">
        Bienvenido{user?.nombre ? `, ${user.nombre}` : ''}. Usá el menú lateral para navegar por los
        trámites, el dashboard y la configuración.
      </Typography>
    </Box>
  );
}
