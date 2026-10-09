import { useEffect, useState } from 'react';

type JsonQueryResult<T> = [T | undefined, boolean, Error | null];

export const useJsonQuery = <T>(url: string): JsonQueryResult<T> => {
  const [data, setData] = useState<T>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchJson = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = (await response.json()) as T;
        if (!ignore) setData(json);
      } catch (err) {
        if (!ignore) setError(err as Error);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchJson();
    return () => {
      ignore = true;
    };
  }, [url]);

  return [data, isLoading, error];
};
