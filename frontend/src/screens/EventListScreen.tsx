import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SourceConfidenceBadge } from '../components/SourceConfidenceBadge';
import { resolveRiskEvent } from '../services/eventsApi';
import { RiskCategory, RiskEvent } from '../types/risk';

interface EventListScreenProps {
  events: RiskEvent[];
  selectedCategory?: RiskCategory;
  isOffline: boolean;
  onSelectCategory: (category?: RiskCategory) => void;
  onRefresh: () => Promise<void>;
}

const FILTERS: { label: string; value?: RiskCategory }[] = [
  { label: 'Todos', value: undefined },
  { label: 'Alagamento', value: 'ALAGAMENTO' },
  { label: 'Ilha de Calor', value: 'ILHA_CALOR' },
  { label: 'Serviços', value: 'INTERRUPCAO_SERVICO' },
];

const CATEGORY_COLORS: Record<RiskCategory, string> = {
  ALAGAMENTO: '#2563EB',
  ILHA_CALOR: '#EA580C',
  INTERRUPCAO_SERVICO: '#7C3AED',
};

export function EventListScreen({
  events,
  selectedCategory,
  isOffline,
  onSelectCategory,
  onRefresh,
}: EventListScreenProps) {
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [selectedMapEvent, setSelectedMapEvent] = useState<RiskEvent | null>(
    null
  );
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    if (!selectedCategory) return events;
    return events.filter((ev) => ev.category === selectedCategory);
  }, [events, selectedCategory]);

  // Normaliza coordenadas da RMSP (lat -23.70 a -23.45, lon -46.80 a -46.40) para plotar no radar urbano
  const projectCoordinates = (lat: number | null, lon: number | null) => {
    const safeLat = lat ?? -23.5505;
    const safeLon = lon ?? -46.6333;

    const minLat = -23.68;
    const maxLat = -23.47;
    const minLon = -46.76;
    const maxLon = -46.42;

    const normX = (safeLon - minLon) / (maxLon - minLon);
    const normY = 1 - (safeLat - minLat) / (maxLat - minLat);

    const leftPercent = Math.min(88, Math.max(8, normX * 100));
    const topPercent = Math.min(85, Math.max(10, normY * 100));

    return { left: `${leftPercent}%` as const, top: `${topPercent}%` as const };
  };

  const handleResolve = async (id: number) => {
    setResolvingId(id);
    setStatusMessage(null);
    try {
      await resolveRiskEvent(id);
      if (selectedMapEvent?.id === id) {
        setSelectedMapEvent(null);
      }
      await onRefresh();
      setStatusMessage('Ocorrência encerrada pelo agente local.');
    } catch {
      setStatusMessage('Falha ao encerrar ocorrência (verifique a conexão).');
    } finally {
      setResolvingId(null);
    }
  };

  const renderEventCard = ({ item }: { item: RiskEvent }) => {
    const isCritical = item.priorityScore >= 75;
    const accentColor = CATEGORY_COLORS[item.category] ?? '#2563EB';

    return (
      <View
        style={[
          styles.card,
          { borderLeftColor: isCritical ? '#DC2626' : accentColor },
        ]}
      >
        <View style={styles.cardTopRow}>
          <Text style={[styles.categoryTag, { color: accentColor }]}>
            {item.category.replace('_', ' ')}
          </Text>
          <Text style={[styles.scoreText, isCritical && styles.scoreCritical]}>
            Prioridade {item.priorityScore.toFixed(0)}/100
          </Text>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSub}>
          Bairro: {item.neighborhood} • Severidade: {item.severity}/5
        </Text>
        <Text style={styles.cardDesc}>{item.description}</Text>

        <SourceConfidenceBadge
          sourceType={item.sourceType}
          sourceName={item.sourceName}
          confidenceLevel={item.confidenceLevel}
        />

        <View style={styles.cardFooter}>
          <Text style={styles.timestampText}>
            Registrado às {new Date(item.createdAt).toLocaleTimeString()}
          </Text>

          <TouchableOpacity
            style={[styles.resolveBtn, isOffline && styles.btnDisabled]}
            disabled={isOffline || resolvingId === item.id}
            onPress={() => handleResolve(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Marcar ocorrência ${item.title} como resolvida`}
          >
            <Text style={styles.resolveBtnText}>
              {resolvingId === item.id ? 'Encerrando...' : '✓ Marcar Resolvido'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Alternador Lista / Mapa + Filtros */}
      <View style={styles.controlsHeader}>
        <View style={styles.modeSwitchRow}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              viewMode === 'LIST' && styles.modeBtnActive,
            ]}
            onPress={() => setViewMode('LIST')}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.modeBtnText,
                viewMode === 'LIST' && styles.modeBtnTextActive,
              ]}
            >
              Lista ({filteredEvents.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'MAP' && styles.modeBtnActive]}
            onPress={() => setViewMode('MAP')}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.modeBtnText,
                viewMode === 'MAP' && styles.modeBtnTextActive,
              ]}
            >
              Mapa Urbano
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const active = selectedCategory === f.value;
            return (
              <TouchableOpacity
                key={f.label}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => onSelectCategory(f.value)}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {statusMessage && (
        <View style={styles.statusToast}>
          <Text style={styles.statusToastText}>{statusMessage}</Text>
        </View>
      )}

      {viewMode === 'LIST' ? (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderEventCard}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Nenhuma ocorrência encontrada para o filtro selecionado.
            </Text>
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.mapContainer}>
          <Text style={styles.mapHint}>
            Toque em um marcador no mapa setorial para inspecionar origem e
            confiança:
          </Text>

          {/* Quadro Georreferenciado dos Bairros */}
          <View style={styles.mapBoard}>
            <Text style={[styles.quadrantLabel, { top: 8, left: 10 }]}>
              ZONA NORTE (Santana)
            </Text>
            <Text style={[styles.quadrantLabel, { top: 8, right: 10 }]}>
              ZONA LESTE (Mooca / Itaquera)
            </Text>
            <Text style={[styles.quadrantLabel, { bottom: 8, left: 10 }]}>
              ZONA OESTE / SUL (Pinheiros / Sto Amaro)
            </Text>
            <Text style={[styles.quadrantLabel, { bottom: 8, right: 10 }]}>
              CENTRO / V. MARIANA
            </Text>

            <View style={styles.crosshairHorizontal} />
            <View style={styles.crosshairVertical} />

            {filteredEvents.map((ev) => {
              const pos = projectCoordinates(ev.latitude, ev.longitude);
              const isSelected = selectedMapEvent?.id === ev.id;
              const pinColor =
                ev.priorityScore >= 75
                  ? '#DC2626'
                  : CATEGORY_COLORS[ev.category];

              return (
                <TouchableOpacity
                  key={ev.id}
                  style={[
                    styles.mapPin,
                    {
                      left: pos.left,
                      top: pos.top,
                      backgroundColor: pinColor,
                      transform: [{ scale: isSelected ? 1.25 : 1 }],
                    },
                  ]}
                  onPress={() => setSelectedMapEvent(ev)}
                  accessibilityRole="button"
                  accessibilityLabel={`Marcador ${ev.neighborhood}: ${ev.title}`}
                >
                  <Text style={styles.mapPinScore}>
                    {ev.priorityScore.toFixed(0)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedMapEvent ? (
            renderEventCard({ item: selectedMapEvent })
          ) : (
            <View style={styles.mapPlaceholderCard}>
              <Text style={styles.mapPlaceholderText}>
                Selecione um ponto numerado no mapa acima para ver detalhes do
                alerta.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  controlsHeader: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#0F172A' },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: '#334155' },
  modeBtnTextActive: { color: '#FFFFFF' },
  filterRow: { gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  filterChipTextActive: { color: '#FFFFFF' },
  statusToast: {
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#86EFAC',
  },
  statusToastText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  listPadding: { padding: 12, paddingBottom: 28 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 5,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryTag: { fontSize: 11, fontWeight: '800' },
  scoreText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  scoreCritical: { color: '#DC2626' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardSub: { fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 2 },
  cardDesc: { fontSize: 13, color: '#334155', marginTop: 6 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timestampText: { fontSize: 11, color: '#64748B' },
  resolveBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnDisabled: { opacity: 0.45 },
  resolveBtnText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 32 },
  mapContainer: { padding: 12, paddingBottom: 28 },
  mapHint: { fontSize: 12, color: '#475569', marginBottom: 8 },
  mapBoard: {
    height: 290,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#334155',
  },
  quadrantLabel: {
    position: 'absolute',
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  crosshairHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1E293B',
  },
  crosshairVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#1E293B',
  },
  mapPin: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mapPinScore: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  mapPlaceholderCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  mapPlaceholderText: { color: '#64748B', fontSize: 13, textAlign: 'center' },
});