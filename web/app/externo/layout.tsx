import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { externalTheme } from '@/theme/external-theme';
import { ExternalAuthProvider } from '@/context/ExternalAuthContext';

/**
 * Layout de TODO el portal externo (incluidos login y registro).
 * Aplica el theme externo (piel teal) por encima del theme interno del root y
 * provee el ExternalAuthContext. El gate + el shell viven en (protected)/layout.
 */
export default function ExternoLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={externalTheme}>
      <ExternalAuthProvider>{children}</ExternalAuthProvider>
    </ThemeProvider>
  );
}
