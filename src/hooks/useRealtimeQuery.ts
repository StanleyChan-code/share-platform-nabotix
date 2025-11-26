import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeQuery(table: string, options?: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      let query = (supabase as any).from(table).select(options?.select || '*');
      
      if (options?.eq) {
        query = query.eq(options.eq[0], options.eq[1]);
      }
      if (options?.order) {
        query = query.order(options.order[0], options.order[1]);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error } = await query;
      if (error) throw error;
      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);

  return { data, loading, error, refresh: fetchData };
}

export function useRealtimeStats() {
  const [stats, setStats] = useState({ datasets: 0, users: 0, applications: 0, outputs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_public_stats');
        
        if (error) throw error;
        
        setStats({
          datasets: (data as any)?.datasets_count || 0,
          users: (data as any)?.users_count || 0,
          applications: (data as any)?.applications_count || 0,
          outputs: (data as any)?.outputs_count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}