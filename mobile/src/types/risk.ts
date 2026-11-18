export type RiskCategory = 'ALAGAMENTO' | 'ILHA_CALOR' | 'INTERRUPCAO_SERVICO';

export type DataSourceType = 'SENSOR' | 'BASE_PUBLICA' | 'REGISTRO_COMUNITARIO';

export interface RiskEvent {
  id: number;
  title: string;
  description: string;
  category: RiskCategory;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  severity: number;
  sourceType: DataSourceType;
  sourceName: string;
  confidenceLevel: number;
  priorityScore: number;
  active: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  totalActiveEvents: number;
  criticalEventsCount: number;
  averageConfidence: number;
  mostAffectedNeighborhood: string;
  serverTimestamp: string;
  prioritizedEvents: RiskEvent[];
}