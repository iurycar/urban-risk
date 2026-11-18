import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRealtimeAlerts } from './src/hooks/useRealtimeAlerts';
import { RiskEvent } from './src/types/risk';

export default function App() {
  const {
    dashboard,
    isOffline,
    isLoading,
    lastSyncAt,
    criticalAlertBanner,
    dismissCriticalBanner,
    refreshNow,
  } = useRealtimeAlerts(5000);

  const renderEventItem = ({ item }: { item: RiskEvent }) => {
    const isCritical = item.priorityScore >= 75;
    return (
      <View style={[styles.card, isCritical && styles.cardCritical]}>
        <View style={styles.cardHeader}>
          <Text style={styles.categoryBadge}>{item.category.replace('_', ' ')}</Text>
          <Text style={[styles.scoreBadge, isCritical && styles.scoreCritical]}>
            Prioridade: {item.priorityScore.toFixed(0)}/100
          </Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardNeighborhood}>Bairro: {item.neighborhood}</Text>
        <Text style={styles.cardDesc}>{item.description}</Text>
        <Text style={styles.cardMeta}>
          Origem: {item.sourceName} ({item.sourceType}) • Confiança: {Math.round(item.confidenceLevel * 100)}%
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Urban Risk Intelligence</Text>
        <Text style={styles.headerSubtitle}>
          {lastSyncAt
            ? `Última sincronização: ${lastSyncAt.toLocaleTimeString()}`
            : 'Conectando ao servidor...'}
        </Text>
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Servidor desconectado — exibindo últimos dados salvos e tentando reconectar...
          </Text>
          <TouchableOpacity onPress={refreshNow} style={styles.retryButton}>
            <Text style={styles.retryText}>Tentar agora</Text>
          </TouchableOpacity>
        </View>
      )}

      {criticalAlertBanner && !isOffline && (
        <View style={styles.alertBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>ALERTA CRÍTICO • {criticalAlertBanner.neighborhood}</Text>
            <Text style={styles.alertBody}>{criticalAlertBanner.title}</Text>
          </View>
          <TouchableOpacity onPress={dismissCriticalBanner}>
            <Text style={styles.dismissText}>OK</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && !dashboard ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Carregando monitoramento urbano...</Text>
        </View>
      ) : (
        <>
          {dashboard && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryValue}>{dashboard.totalActiveEvents}</Text>
                <Text style={styles.summaryLabel}>Ativos</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
                  {dashboard.criticalEventsCount}
                </Text>
                <Text style={styles.summaryLabel}>Críticos</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryValue}>
                  {Math.round(dashboard.averageConfidence * 100)}%
                </Text>
                <Text style={styles.summaryLabel}>Confiança Média</Text>
              </View>
            </View>
          )}

          <FlatList
            data={dashboard?.prioritizedEvents ?? []}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderEventItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum evento de risco ativo no momento.</Text>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { backgroundColor: '#0F172A', padding: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  offlineBanner: {
    backgroundColor: '#B91C1C',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  offlineText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', flex: 1 },
  retryButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  retryText: { color: '#B91C1C', fontWeight: '700', fontSize: 12 },
  alertBanner: {
    backgroundColor: '#D97706',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  alertBody: { color: '#FFFBEB', fontSize: 13, marginTop: 2 },
  dismissText: { color: '#FFFFFF', fontWeight: '700', paddingLeft: 12 },
  summaryRow: { flexDirection: 'row', padding: 12, gap: 8 },
  summaryBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
  },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  summaryLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  cardCritical: { borderLeftColor: '#DC2626' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  categoryBadge: { fontSize: 11, fontWeight: '700', color: '#1E40AF' },
  scoreBadge: { fontSize: 11, fontWeight: '700', color: '#334155' },
  scoreCritical: { color: '#DC2626' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardNeighborhood: { fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 2 },
  cardDesc: { fontSize: 13, color: '#334155', marginTop: 6 },
  cardMeta: { fontSize: 11, color: '#64748B', marginTop: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#475569' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 32 },
});