'use client';

import * as React from 'react';
import { tiposIniciables } from '@/lib/tramites-externos';
import type { TipoTramite } from '@/types/config';

interface UseTiposIniciablesResult {
  data: TipoTramite[];
  loading: boolean;
  error: boolean;
}

/** Tipos que el externo puede iniciar (para el form de nuevo trámite). */
export function useTiposIniciables(): UseTiposIniciablesResult {
  const [data, setData] = React.useState<TipoTramite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();
    tiposIniciables(controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setData(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { data, loading, error };
}
