'use client';

import * as React from 'react';
import { SnackbarProvider, useSnackbar, type VariantType } from 'notistack';
import { registerNotifier } from '@/lib/notifier';

/**
 * Conecta notistack con el puente `notifier`: el api-client puede llamar a
 * notify() aunque no sea un componente React.
 */
function NotifierBridge() {
  const { enqueueSnackbar } = useSnackbar();
  React.useEffect(() => {
    registerNotifier((message: string, variant: VariantType) => {
      enqueueSnackbar(message, { variant });
    });
  }, [enqueueSnackbar]);
  return null;
}

export function AppSnackbarProvider({ children }: { children: React.ReactNode }) {
  return (
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={5000}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <NotifierBridge />
      {children}
    </SnackbarProvider>
  );
}

/** Para disparar snackbars desde componentes (éxito, info, etc.). */
export function useNotify() {
  const { enqueueSnackbar } = useSnackbar();
  return React.useCallback(
    (message: string, variant: VariantType = 'info') => enqueueSnackbar(message, { variant }),
    [enqueueSnackbar],
  );
}
