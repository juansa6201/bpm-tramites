'use client';

import { createTheme } from '@mui/material/styles';

// Theme del PORTAL EXTERNO. Paleta deliberadamente distinta del interno
// (teal/ámbar vs azul/púrpura del interno) para que el usuario sepa siempre en
// qué portal está. Comparte tipografía y borderRadius: mismo producto, otra piel.
export const externalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#00695c' },
    secondary: { main: '#ff8f00' },
    background: { default: '#f1f5f4' },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'var(--font-roboto), Roboto, Helvetica, Arial, sans-serif',
  },
});
