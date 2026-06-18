'use client';

import * as React from 'react';
import { misTramites } from '@/lib/tramites-externos';
import type { Paginated, TramiteListItem } from '@/types/tramite';

interface UseMisTramitesResult {
  data: Paginated<TramiteListItem> | null;
  loading: boolean;
  error: boolean;
  reload: () => void;
}

/** Trae los trámites propios del externo (el backend ya filtra a los suyos). */
export function useMisTramites(): UseMisTramitesResult {
  const [data, setData] = React.useState<Paginated<TramiteListItem> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    misTramites(controller.signal)
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
