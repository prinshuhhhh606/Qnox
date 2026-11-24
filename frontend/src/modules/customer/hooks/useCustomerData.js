import { useState, useEffect, useCallback } from 'react';
import customerService from '../services/customerService';

export function useCustomerData() {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [user, userBookings] = await Promise.all([
        customerService.getCurrentProfile(),
        customerService.getBookings(),
      ]);
      setProfile(user);
      setBookings(userBookings || []);
    } catch (err) {
      console.error('[useCustomerData] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { profile, bookings, loading, refreshData: loadData };
}

export default useCustomerData;
