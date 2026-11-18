import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDashboardSummary } from '../services/api';
import { DashboardSummary, RiskEvent } from '../types/risk';

interface UseRealtimeAlertsResult {
  dashboard: DashboardSummary | null;
  isOffline: boolean;
  isLoading: boolean;
  lastSyncAt: Date | null;
  criticalAlertBanner: RiskEvent | null;
  dismissCriticalBanner: () => void;
  refreshNow: () => Promise<void>;
}

export function useRealtimeAlerts(pollingIntervalMs = 5000): UseRealtimeAlertsResult {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [criticalAlertBanner, setCriticalAlertBanner] = useState<RiskEvent | null>(null);

  const knownCriticalIdsRef = useRef<Set<number>>(new Set());

  const syncData = useCallback(async () => {
    try {
      const data = await fetchDashboardSummary();
      setDashboard(data);
      setIsOffline(false);
      setLastSyncAt(new Date());

      const newestCritical = data.prioritizedEvents.find(
        (ev) => ev.priorityScore >= 80 && !knownCriticalIdsRef.current.has(ev.id)
      );

      data.prioritizedEvents.forEach((ev) => {
        if (ev.priorityScore >= 80) {
          knownCriticalIdsRef.current.add(ev.id);
        }
      });

      if (newestCritical) {
        setCriticalAlertBanner(newestCritical);
      }
    } catch {
      // Mantém os últimos dados em tela e sinaliza desconexão sem travar o app
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncData();
    const intervalId = setInterval(syncData, pollingIntervalMs);
    return () => clearInterval(intervalId);
  }, [syncData, pollingIntervalMs]);

  const dismissCriticalBanner = useCallback(() => {
    setCriticalAlertBanner(null);
  }, []);

  return {
    dashboard,
    isOffline,
    isLoading,
    lastSyncAt,
    criticalAlertBanner,
    dismissCriticalBanner,
    refreshNow: syncData,
  };
}