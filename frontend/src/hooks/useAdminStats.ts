import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  totalUsers: number;
  totalActive7D: number;
  retained7D: { count: number; percentage: number };
  retained14D: { count: number; percentage: number };
  abTest: {
    mlGroup: { size: number; retention7dRate: number };
    heuristicGroup: { size: number; retention7dRate: number };
  };
  interventions: {
    case: string;
    totalTriggered: number;
    acceptanceRate: number;
    avgXpChange: number;
  }[];
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profiles for Global Cohorts (excluding admins)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, retained_after_7_days, retained_after_14_days, first_active_date, last_active_date')
        .neq('role', 'admin');

      if (!profiles) return;

      const totalUsers = profiles.length;
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const active7D = profiles.filter(p => p.last_active_date && new Date(p.last_active_date) >= sevenDaysAgo);

      // Need eligible users for retention calculations (users registered >7 days ago)
      const eligible7D = profiles.filter(p => p.first_active_date && new Date(p.first_active_date) <= sevenDaysAgo);
      const FourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const eligible14D = profiles.filter(p => p.first_active_date && new Date(p.first_active_date) <= FourteenDaysAgo);

      const retained7DCount = eligible7D.filter(p => p.retained_after_7_days).length;
      const retained14DCount = eligible14D.filter(p => p.retained_after_14_days).length;

      // 2. Fetch Decision Logs for A/B testing
      const { data: logs } = await supabase
        .from('decision_logs')
        .select('user_id, metadata');
        
      // Group users by their experiment group
      const mlUsers = new Set<string>();
      const heuristicUsers = new Set<string>();
      
      (logs || []).forEach(log => {
        const meta = log.metadata as any;
        if (meta?.experiment_group === 'treatment') mlUsers.add(log.user_id);
        if (meta?.experiment_group === 'control') heuristicUsers.add(log.user_id);
      });

      // Calculate Retention for A/B groups
      // Note: Group users might be a subset of eligible7D
      const calcRetentionForSet = (userIds: Set<string>) => {
        const groupProfiles = eligible7D.filter(p => userIds.has(p.id));
        if (groupProfiles.length === 0) return 0;
        const retained = groupProfiles.filter(p => p.retained_after_7_days).length;
        return (retained / groupProfiles.length) * 100;
      };

      // 3. Fetch Intervention Outcomes
      const { data: outcomes } = await supabase
        .from('intervention_outcomes')
        .select('*');

      const outcomeStatsMap = new Map<string, { total: number; accepted: number; totalXpChange: number; xpChangeCount: number }>();
      
      (outcomes || []).forEach(out => {
        const existing = outcomeStatsMap.get(out.intervention_case) || { total: 0, accepted: 0, totalXpChange: 0, xpChangeCount: 0 };
        existing.total += 1;
        if (out.accepted) existing.accepted += 1;
        if (out.xp_change !== null && out.xp_change !== undefined) {
          existing.totalXpChange += out.xp_change;
          existing.xpChangeCount += 1;
        }
        outcomeStatsMap.set(out.intervention_case, existing);
      });

      const interventions = Array.from(outcomeStatsMap.entries()).map(([caseName, data]) => ({
        case: caseName,
        totalTriggered: data.total,
        acceptanceRate: data.total > 0 ? (data.accepted / data.total) * 100 : 0,
        avgXpChange: data.xpChangeCount > 0 ? data.totalXpChange / data.xpChangeCount : 0
      }));

      setStats({
        totalUsers,
        totalActive7D: active7D.length,
        retained7D: {
          count: retained7DCount,
          percentage: eligible7D.length > 0 ? (retained7DCount / eligible7D.length) * 100 : 0
        },
        retained14D: {
          count: retained14DCount,
          percentage: eligible14D.length > 0 ? (retained14DCount / eligible14D.length) * 100 : 0
        },
        abTest: {
          mlGroup: { size: mlUsers.size, retention7dRate: calcRetentionForSet(mlUsers) },
          heuristicGroup: { size: heuristicUsers.size, retention7dRate: calcRetentionForSet(heuristicUsers) }
        },
        interventions
      });
    } catch (err) {
      console.error("Failed to load admin stats", err);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchStats };
};
