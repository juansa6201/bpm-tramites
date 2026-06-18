'use client';

import * as React from 'react';
import { listTramites } from '@/lib/tramites-api';
import type { Paginated, TramiteListItem, TramitesFilters } from '@/types/tramite';

interface UseTramitesResult {
  data: Paginated<TramiteListItem> | null;
  loading: boolean;
  error: boolean;
  reload: () => void;
}

/**
 * Trae la bandeja según los filtros y expone loading/error.
 * Cada cambio de filtro dispara un nuevo fetch y aborta el anterior (evita que
 * una respuesta vieja pise a una nueva si llegan desordenadas).
 */
export function useTramites(filtros: TramitesFilters): UseTramitesResult {
  const [data, setData] = React.useState<Paginated<TramiteListItem> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    listTramites(filtros, controller.signal)
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
    // Dependemos de los campos, no del objeto, para no refetchear por identidad.
  }, [
    filtros.estado,
    filtros.prioridad,
    filtros.origen,
    filtros.areaActualId,
    filtros.creadoDesde,
    filtros.creadoHasta,
    filtros.page,
    filtros.pageSize,
    reloadKey,
  ]);

  const reload = React.useCallback(() => setReloadKey((k) => k + 1), []);
  return { data, loading, error, reload };
}
