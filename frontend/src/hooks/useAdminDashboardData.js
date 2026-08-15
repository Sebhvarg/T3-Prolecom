import { useState, useEffect } from 'react';
import { getAdminDashboardData } from '../api/dashboardService';

export const useAdminDashboardData = () => {
  const [data, setData] = useState({ stats: [], logs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getAdminDashboardData()
      .then((result) => {
        if (isMounted) setData(result);
      })
      .catch((error) => {
        console.error('Error cargando métricas de administración/soporte:', error);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading };
};
