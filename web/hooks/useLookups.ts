'use client';

import * as React from 'react';
import { listAreas } from '@/lib/tramites-api';
import type { Area } from '@/types/tramite';

/** Carga las áreas y ofrece un resolver id → nombre. `reload` re-consulta (config). */
export function useAreas() {
  const [areas, setAreas] = React.useState<Area[]>([]);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    listAreas(controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setAreas(res);
      })
      .catch(() => {
        /* Si falla, el filtro de área queda vacío y la columna muestra el guion. */
      });
    return () => controller.abort();
  }, [reloadKey]);

  const areaNombre = React.useCallback(
    (id: string | null): string => {
      if (!id) return '—';
      return areas.find((a) => a.id === id)?.nombre ?? '—';
    },
    [areas],
  );

  const reload = React.useCallback(() => setReloadKey((k) => k + 1), []);

  return { areas, areaNombre, reload };
}
