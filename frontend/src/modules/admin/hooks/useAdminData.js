import { useState, useEffect, useCallback } from 'react';
import adminService from '../services/adminService';

export function useAdminData() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getOverview();
      if (res?.success) {
        setOverview(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return { overview, loading, error, refreshOverview: loadOverview };
}

export default useAdminData;
