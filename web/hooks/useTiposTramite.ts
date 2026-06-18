'use client';

import * as React from 'react';
import { listTiposTramite } from '@/lib/config-api';
import type { TipoTramite } from '@/types/config';

interface UseTiposTramiteResult {
  data: TipoTramite[];
  loading: boolean;
  error: boolean;
  reload: () => void;
}

export function useTiposTramite(): UseTiposTramiteResult {
  const [data, setData] = React.useState<TipoTramite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    listTiposTramite(controller.signal)
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
  }, [reloadKey]);

  const reload = React.useCallback(() => setReloadKey((k) => k + 1), []);
  return { data, loading, error, reload };
}
