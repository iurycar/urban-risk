import { API_BASE_URL } from './api';
import { RiskCategory, RiskEvent } from '../types/risk';

export interface CommunityReportPayload {
  title: string;
  description: string;
  category: RiskCategory;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  severity: number;
  reporterDocument?: string;
}

const REQUEST_TIMEOUT_MS = 4000;

async function requestWithTimeout<T>(endpoint: string, options: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      let errorMessage = `Erro HTTP ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody?.error) {
          errorMessage = errBody.error;
        }
      } catch {
        // Ignora falha ao ler corpo de erro
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function submitCommunityReport(
  payload: CommunityReportPayload
): Promise<RiskEvent> {
  return requestWithTimeout<RiskEvent>('/events/community', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resolveRiskEvent(eventId: number): Promise<void> {
  return requestWithTimeout<void>(`/events/${eventId}/resolve`, {
    method: 'PATCH',
  });
}

export async function triggerSimulatedSensorEvent(): Promise<RiskEvent> {
  return requestWithTimeout<RiskEvent>('/events/simulate-now', {
    method: 'POST',
  });
}