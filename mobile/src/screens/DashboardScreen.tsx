import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SourceConfidenceBadge } from '../components/SourceConfidenceBadge';
import { triggerSimulatedSensorEvent } from '../services/eventsApi';
import { DashboardSummary, RiskCategory } from '../types/risk';

interface DashboardScreenProps {
  dashboard: DashboardSummary | null;
  isOffline: boolean;
  onRefresh: () => Promise<void>;
  onNavigateToEvents: (category?: RiskCategory) => void;
}

const CATEGORY_META: Record<
  RiskCategory,
  { label: string; color: string; bg: string }
> = {
  ALAGAMENTO: { label: 'Alagamentos', color: '#1D4ED8', bg: '#DBEAFE' },
  ILHA_CALOR: { label: 'Ilhas de Calor', color: '#C2410C', bg: '#FFEDD5' },
  INTERRUPCAO_SERVICO: {
    label: 'Serviços Essenciais',
    color: '#6D28D9',
    bg: '#EDE9FE',
  },
};

export function DashboardScreen({
  dashboard,
  isOffline,
  onRefresh,
  onNavigateToEvents,
}: DashboardScreenProps) {
  const [simulating, setSimulating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!dashboard) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Aguardando dados do painel...</Text>
        <Text style={styles.emptySubtitle}>
          Verifique se o servidor Spring Boot está ativo na porta 8080.
        </Text>
      </View>
    );
  }

  const events = dashboard.prioritizedEvents;
  const topPriorityEvents = events.slice(0, 3);

  const countByCategory = (category: RiskCategory) =>
    events.filter((e) => e.category === category).length;

  const handleSimulateSensor = async () => {
    setSimulating(true);
    setFeedbackMessage(null);
    try {
      const created = await triggerSimulatedSensorEvent();
      await onRefresh();
      setFeedbackMessage(
        `Leitura IoT recebida: "${created.title}" (${created.neighborhood})`
      );
    } catch {
      setFeedbackMessage(
        'Não foi possível simular leitura enquanto o servidor estiver offline.'
      );
    } finally {
      setSimulating(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Indicadores Principais */}
      <Text style={styles.sectionTitle}>Indicadores em Tempo Real</Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{dashboard.totalActiveEvents}</Text>
          <Text style={styles.kpiLabel}>Ocorrências Ativas</Text>
        </View>

        <View style={[styles.kpiCard, styles.kpiCardDanger]}>
          <Text style={[styles.kpiValue, { color: '#DC2626' }]}>
            {dashboard.criticalEventsCount}
          </Text>
          <Text style={styles.kpiLabel}>Alertas Críticos</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: '#15803D' }]}>
            {Math.round(dashboard.averageConfidence * 100)}%
          </Text>
          <Text style={styles.kpiLabel}>Confiança Média</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { fontSize: 16 }]} numberOfLines={1}>
            {dashboard.mostAffectedNeighborhood}
          </Text>
          <Text style={styles.kpiLabel}>Bairro Mais Afetado</Text>
        </View>
      </View>

      {/* Distribuição por Categoria */}
      <Text style={styles.sectionTitle}>Monitoramento por Risco Urbano</Text>
      <View style={styles.categoryRow}>
        {(Object.keys(CATEGORY_META) as RiskCategory[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const count = countByCategory(cat);
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryCard, { backgroundColor: meta.bg }]}
              onPress={() => onNavigateToEvents(cat)}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar ${meta.label}: ${count} ocorrências`}
            >
              <Text style={[styles.categoryCount, { color: meta.color }]}>
                {count}
              </Text>
              <Text style={[styles.categoryLabel, { color: meta.color }]}>
                {meta.label}
              </Text>
              <Text style={styles.categoryAction}>Ver lista →</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ação rápida para demonstração de telemetria */}
      <View style={styles.actionBox}>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>Simulação de Sensor IoT</Text>
          <Text style={styles.actionDesc}>
            Dispara uma nova leitura automática de estação urbana para testar a
            priorização ao vivo.
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.simulateButton,
            (simulating || isOffline) && styles.buttonDisabled,
          ]}
          onPress={handleSimulateSensor}
          disabled={simulating || isOffline}
          accessibilityRole="button"
        >
          <Text style={styles.simulateButtonText}>
            {simulating ? 'Enviando...' : '+ Simular'}
          </Text>
        </TouchableOpacity>
      </View>

      {feedbackMessage && (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      )}

      {/* Top 3 Alertas Prioritários */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Top 3 Alertas Prioritários</Text>
        <TouchableOpacity onPress={() => onNavigateToEvents(undefined)}>
          <Text style={styles.seeAllLink}>Ver todos ({events.length})</Text>
        </TouchableOpacity>
      </View>

      {topPriorityEvents.map((item, index) => {
        const isCritical = item.priorityScore >= 75;
        return (
          <View
            key={item.id}
            style={[styles.priorityCard, isCritical && styles.priorityCardCritical]}
          >
            <View style={styles.priorityHeader}>
              <Text style={styles.rankBadge}>#{index + 1} PRIORIDADE</Text>
              <Text
                style={[
                  styles.scoreBadge,
                  isCritical && { color: '#DC2626', fontWeight: '800' },
                ]}
              >
                Score: {item.priorityScore.toFixed(1)} / 100
              </Text>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardNeighborhood}>
              Bairro: {item.neighborhood} • Severidade {item.severity}/5
            </Text>
            <Text style={styles.cardDescription}>{item.description}</Text>

            <SourceConfidenceBadge
              sourceType={item.sourceType}
              sourceName={item.sourceName}
              confidenceLevel={item.confidenceLevel}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 14, paddingBottom: 28 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  seeAllLink: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiCardDanger: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  kpiValue: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  kpiLabel: { fontSize: 12, color: '#475569', marginTop: 4, fontWeight: '600' },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  categoryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  categoryCount: { fontSize: 22, fontWeight: '800' },
  categoryLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  categoryAction: {
    fontSize: 11,
    color: '#334155',
    marginTop: 8,
    fontWeight: '600',
  },
  actionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
  },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  actionDesc: { fontSize: 12, color: '#475569', marginTop: 2 },
  simulateButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonDisabled: { opacity: 0.45 },
  simulateButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  feedbackBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  feedbackText: { color: '#1E3A8A', fontSize: 12, fontWeight: '600' },
  priorityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#2563EB',
  },
  priorityCardCritical: { borderLeftColor: '#DC2626' },
  priorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rankBadge: { fontSize: 11, fontWeight: '800', color: '#1E40AF' },
  scoreBadge: { fontSize: 12, fontWeight: '700', color: '#334155' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardNeighborhood: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  cardDescription: { fontSize: 13, color: '#334155', marginTop: 6 },
});