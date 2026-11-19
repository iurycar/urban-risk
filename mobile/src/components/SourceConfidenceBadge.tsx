import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DataSourceType } from '../types/risk';

interface SourceConfidenceBadgeProps {
  sourceType: DataSourceType;
  sourceName: string;
  confidenceLevel: number;
}

const SOURCE_CONFIG: Record<
  DataSourceType,
  { label: string; bg: string; text: string; tag: string }
> = {
  SENSOR: {
    label: 'Sensor IoT',
    bg: '#DBEAFE',
    text: '#1E40AF',
    tag: 'IOT',
  },
  BASE_PUBLICA: {
    label: 'Base Pública',
    bg: '#E0E7FF',
    text: '#3730A3',
    tag: 'OFICIAL',
  },
  REGISTRO_COMUNITARIO: {
    label: 'Relato Comunitário',
    bg: '#FEF3C7',
    text: '#92400E',
    tag: 'COMUNIDADE',
  },
};

export function SourceConfidenceBadge({
  sourceType,
  sourceName,
  confidenceLevel,
}: SourceConfidenceBadgeProps) {
  const config = SOURCE_CONFIG[sourceType] ?? SOURCE_CONFIG.REGISTRO_COMUNITARIO;
  const confidencePercent = Math.round(confidenceLevel * 100);

  const confidenceColor =
    confidencePercent >= 85
      ? '#15803D'
      : confidencePercent >= 70
      ? '#B45309'
      : '#B91C1C';

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`Origem: ${config.label}, ${sourceName}. Nível de confiança: ${confidencePercent} por cento.`}
    >
      <View style={styles.topRow}>
        <View style={[styles.typePill, { backgroundColor: config.bg }]}>
          <Text style={[styles.typeTag, { color: config.text }]}>
            {config.tag} • {config.label}
          </Text>
        </View>

        <Text style={[styles.confidenceText, { color: confidenceColor }]}>
          Confiança: {confidencePercent}%
        </Text>
      </View>

      <Text style={styles.sourceNameText} numberOfLines={1}>
        Fonte: {sourceName}
      </Text>

      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(100, Math.max(5, confidencePercent))}%`,
              backgroundColor: confidenceColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeTag: {
    fontSize: 11,
    fontWeight: '800',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sourceNameText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 5,
  },
  barBackground: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});