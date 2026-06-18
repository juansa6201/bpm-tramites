'use client';

import * as React from 'react';
import { getTramiteExterno } from '@/lib/tramites-externos';
import { ApiError } from '@/lib/api-client';
import type { TramiteDetalle } from '@/types/tramite';

interface UseTramiteExternoResult {
  data: TramiteDetalle | null;
  loading: boolean;
  /** status HTTP del error (404, 403, 0=red…) o null si no hubo. */
  errorStatus: number | null;
  reload: () => void;
}

export function useTramiteExterno(id: string): UseTramiteExternoResult {
  const [data, setData] = React.useState<TramiteDetalle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorStatus, setErrorStatus] = React.useState<number | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setErrorStatus(null);
    getTramiteExterno(id, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setData(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setErrorStatus(err instanceof ApiError ? err.status : 0);
        setLoading(false);
      });
    return () => controller.abort();
  }, [id, reloadKey]);

  const reload = React.useCallback(() => setReloadKey((k) => k + 1), []);
  return { data, loading, errorStatus, reload };
}
