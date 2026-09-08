import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

/** GET `path` on mount; returns { data, error, loading, reload }. */
export function useFetch(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    api(path)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(reload, [reload]);
  return { ...state, reload };
}
