import { useState, useEffect, useCallback } from 'react';
import trainerService from '../services/trainerService';

export function useTrainerData() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await trainerService.getStats();
      if (res?.success) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, error, refreshStats: loadStats };
}

export default useTrainerData;
