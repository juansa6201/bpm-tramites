'use client';

import * as React from 'react';
import { listDocumentosExterno } from '@/lib/tramites-externos';
import type { Documento } from '@/types/tramite';

interface UseDocumentosExternoResult {
  data: Documento[];
  loading: boolean;
  error: boolean;
  reload: () => void;
}

export function useDocumentosExterno(id: string): UseDocumentosExternoResult {
  const [data, setData] = React.useState<Documento[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    listDocumentosExterno(id, controller.signal)
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
  }, [id, reloadKey]);

  const reload = React.useCallback(() => setReloadKey((k) => k + 1), []);
  return { data, loading, error, reload };
}
