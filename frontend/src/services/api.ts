import { Platform } from 'react-native';
import { DashboardSummary, RiskCategory, RiskEvent } from '../types/risk';

const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const API_BASE_URL = `${DEFAULT_HOST}/api`;

const REQUEST_TIMEOUT_MS = 3000;

async function fetchWithTimeout<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return fetchWithTimeout<DashboardSummary>('/alerts/dashboard');
}

export async function fetchPrioritizedAlerts(category?: RiskCategory): Promise<RiskEvent[]> {
  const query = category ? `?category=${category}` : '';
  return fetchWithTimeout<RiskEvent[]>(`/alerts${query}`);
}