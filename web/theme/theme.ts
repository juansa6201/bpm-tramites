'use client';

import { createTheme } from '@mui/material/styles';

// Theme base de la aplicación. Más adelante podemos derivar variantes
// para los portales interno y externo (ej: distinto color primario).
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0' },
    secondary: { main: '#6a1b9a' },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'var(--font-roboto), Roboto, Helvetica, Arial, sans-serif',
  },
});
