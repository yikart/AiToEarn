import { useMemo, useRef, useState } from 'react';
import lodash from 'lodash';

export default function useDebounceFetcher<T>(
  fetchOptions: (_: string) => Promise<any>,
  debounceTimeout = 300,
) {
  const fetchRef = useRef(0);
  const [options, setOptions] = useState<T[]>([]);
  const [fetching, setFetching] = useState(false);

  const debounceFetcher = useMemo(() => {
    const loadOptions = (value: string) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      setFetching(true);

      fetchOptions(value).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
          return;
        }

        setOptions(newOptions);
        setFetching(false);
      });
    };

    return lodash.debounce(loadOptions, debounceTimeout);
  }, [fetchOptions, debounceTimeout]);

  return {
    options,
    fetching,
    debounceFetcher,
    setOptions,
  };
}
