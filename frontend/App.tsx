import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRealtimeAlerts } from './src/hooks/useRealtimeAlerts';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { EventListScreen } from './src/screens/EventListScreen';
import { ReportFormScreen } from './src/screens/ReportFormScreen';
import { RiskCategory } from './src/types/risk';

type ActiveTab = 'DASHBOARD' | 'EVENTS' | 'REPORT';

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

  const [activeTab, setActiveTab] = useState<ActiveTab>('DASHBOARD');
  const [categoryFilter, setCategoryFilter] = useState<
    RiskCategory | undefined
  >(undefined);

  const handleNavigateToEvents = (category?: RiskCategory) => {
    setCategoryFilter(category);
    setActiveTab('EVENTS');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Cabeçalho com Indicador de Conexão */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Urban Risk Intelligence</Text>
          <Text style={styles.headerSubtitle}>
            {lastSyncAt
              ? `Sincronizado às ${lastSyncAt.toLocaleTimeString()}`
              : 'Conectando à central...'}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            isOffline ? styles.statusOffline : styles.statusOnline,
          ]}
        >
          <Text style={styles.statusPillText}>
            {isOffline ? 'OFFLINE' : 'ONLINE'}
          </Text>
        </View>
      </View>

      {/* Banner de Resiliência Offline (requisito da apresentação) */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Servidor desconectado — operando em modo contingência com últimos
            dados salvos. Reconectando...
          </Text>
          <TouchableOpacity onPress={refreshNow} style={styles.retryButton}>
            <Text style={styles.retryText}>Tentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Banner de Notificação de Alerta Crítico */}
      {criticalAlertBanner && !isOffline && (
        <View style={styles.alertBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>
              ALERTA PRIORITÁRIO • {criticalAlertBanner.neighborhood}
            </Text>
            <Text style={styles.alertBody}>{criticalAlertBanner.title}</Text>
          </View>
          <TouchableOpacity
            onPress={dismissCriticalBanner}
            style={styles.dismissBtn}
          >
            <Text style={styles.dismissText}>Ciente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Conteúdo da Aba Ativa */}
      <View style={styles.body}>
        {isLoading && !dashboard ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>
              Carregando monitoramento urbano...
            </Text>
          </View>
        ) : (
          <>
            {activeTab === 'DASHBOARD' && (
              <DashboardScreen
                dashboard={dashboard}
                isOffline={isOffline}
                onRefresh={refreshNow}
                onNavigateToEvents={handleNavigateToEvents}
              />
            )}

            {activeTab === 'EVENTS' && (
              <EventListScreen
                events={dashboard?.prioritizedEvents ?? []}
                selectedCategory={categoryFilter}
                isOffline={isOffline}
                onSelectCategory={setCategoryFilter}
                onRefresh={refreshNow}
              />
            )}

            {activeTab === 'REPORT' && (
              <ReportFormScreen
                isOffline={isOffline}
                onReportCreated={async () => {
                  await refreshNow();
                  setActiveTab('EVENTS');
                }}
              />
            )}
          </>
        )}
      </View>

      {/* Barra de Navegação Inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'DASHBOARD' && styles.tabActive]}
          onPress={() => setActiveTab('DASHBOARD')}
          accessibilityRole="tab"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'DASHBOARD' && styles.tabTextActive,
            ]}
          >
            Painel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'EVENTS' && styles.tabActive]}
          onPress={() => setActiveTab('EVENTS')}
          accessibilityRole="tab"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'EVENTS' && styles.tabTextActive,
            ]}
          >
            Eventos & Mapa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'REPORT' && styles.tabActive]}
          onPress={() => setActiveTab('REPORT')}
          accessibilityRole="tab"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'REPORT' && styles.tabTextActive,
            ]}
          >
            + Reportar Risco
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  headerSubtitle: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusOnline: { backgroundColor: '#15803D' },
  statusOffline: { backgroundColor: '#DC2626' },
  statusPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  offlineBanner: {
    backgroundColor: '#B91C1C',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  offlineText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', flex: 1 },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: { color: '#B91C1C', fontWeight: '800', fontSize: 12 },
  alertBanner: {
    backgroundColor: '#D97706',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  alertTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  alertBody: { color: '#FFFBEB', fontSize: 13, fontWeight: '600', marginTop: 2 },
  dismissBtn: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dismissText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  body: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#475569' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 6,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#0F172A' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  tabTextActive: { color: '#FFFFFF' },
});