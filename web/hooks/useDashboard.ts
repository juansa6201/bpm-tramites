'use client';

import * as React from 'react';
import { getDashboard } from '@/lib/dashboard-api';
import type { Dashboard } from '@/types/dashboard';

interface UseDashboardResult {
  data: Dashboard | null;
  loading: boolean;
  error: boolean;
  reload: () => void;
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] = React.useState<Dashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    getDashboard(controller.signal)
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
