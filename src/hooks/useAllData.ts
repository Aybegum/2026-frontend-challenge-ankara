import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { AllData, FetchState } from '../types';

const EMPTY: AllData = {
  checkins: [],
  messages: [],
  sightings: [],
  personalNotes: [],
  anonymousTips: [],
};

export interface UseAllDataReturn {
  data: AllData;
  status: FetchState<AllData>['status'];
  error: string | null;
  refetch: () => void;
}

export function useAllData(): UseAllDataReturn {
  const [data, setData] = useState<AllData>(EMPTY);
  const [status, setStatus] = useState<FetchState<AllData>['status']>('idle');
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const [checkins, messages, sightings, personalNotes, anonymousTips] =
        await Promise.all([
          api.getCheckins(),
          api.getMessages(),
          api.getSightings(),
          api.getPersonalNotes(),
          api.getAnonymousTips(),
        ]);

      setData({ checkins, messages, sightings, personalNotes, anonymousTips });
      setStatus('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return { data, status, error, refetch: fetchAll };
}
