import { useEffect, useState } from 'react';
import { getJson } from './client.js';

type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error' };

export function useApiResource<T>(path: string) {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    getJson<T>(path).then(
      (data) => {
        if (active) setState({ status: 'success', data });
      },
      () => {
        if (active) setState({ status: 'error' });
      },
    );
    return () => {
      active = false;
    };
  }, [path]);

  return state;
}
