import { useCallback, useEffect, useRef, useState } from 'react';

const useAsyncResource = (asyncFn) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const execute = useCallback(async () => {
    if (!isMountedRef.current) return null;

    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      if (isMountedRef.current) {
        setData(result);
      }
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [asyncFn]);

  useEffect(() => {
    isMountedRef.current = true;
    execute();
    return () => {
      isMountedRef.current = false;
    };
  }, [execute]);

  return { data, isLoading, error, refetch: execute };
};

export default useAsyncResource;

