'use client';

import * as React from 'react';
import { listComentariosExterno } from '@/lib/tramites-externos';
import type { Comentario } from '@/types/tramite';

interface UseComentariosExternoResult {
  data: Comentario[];
  loading: boolean;
  error: boolean;
  reload: () => void;
}

export function useComentariosExterno(id: string): UseComentariosExternoResult {
  const [data, setData] = React.useState<Comentario[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    listComentariosExterno(id, controller.signal)
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
