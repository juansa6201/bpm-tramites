import type { Metadata } from 'next';
import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '../theme/theme';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'BPM Trámites',
  description: 'Plataforma BPM de trámites de oficina',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {/* AppRouterCacheProvider: SSR de los estilos de Emotion/MUI sin flash */}
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            {/* CssBaseline: normaliza estilos del navegador segun el theme */}
            <CssBaseline />
            {/* Providers globales de cliente (snackbars) */}
            <Providers>{children}</Providers>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
