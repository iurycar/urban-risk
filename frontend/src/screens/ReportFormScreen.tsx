import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { submitCommunityReport } from '../services/eventsApi';
import { RiskCategory } from '../types/risk';

interface ReportFormScreenProps {
  isOffline: boolean;
  onReportCreated: () => Promise<void>;
}

const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lon: number }> = {
  Pinheiros: { lat: -23.5674, lon: -46.7019 },
  Sé: { lat: -23.5505, lon: -46.6333 },
  Mooca: { lat: -23.5587, lon: -46.5971 },
  Itaquera: { lat: -23.5422, lon: -46.4561 },
  'Vila Mariana': { lat: -23.5895, lon: -46.6347 },
  Santana: { lat: -23.5019, lon: -46.6249 },
  Lapa: { lat: -23.528, lon: -46.7042 },
};

const CATEGORIES: { label: string; value: RiskCategory }[] = [
  { label: 'Alagamento', value: 'ALAGAMENTO' },
  { label: 'Ilha de Calor', value: 'ILHA_CALOR' },
  { label: 'Serviço Interrompido', value: 'INTERRUPCAO_SERVICO' },
];

export function ReportFormScreen({
  isOffline,
  onReportCreated,
}: ReportFormScreenProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RiskCategory>('ALAGAMENTO');
  const [neighborhood, setNeighborhood] = useState('Pinheiros');
  const [severity, setSeverity] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [reporterDocument, setReporterDocument] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async () => {
    setFeedback(null);

    if (!title.trim() || !neighborhood.trim()) {
      setFeedback({
        type: 'error',
        message: 'Preencha o título da ocorrência e o bairro.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const coords = NEIGHBORHOOD_COORDS[neighborhood.trim()] ?? {
        lat: -23.5505,
        lon: -46.6333,
      };

      const created = await submitCommunityReport({
        title: title.trim(),
        description:
          description.trim() ||
          'Ocorrência registrada via aplicativo comunitário.',
        category,
        neighborhood: neighborhood.trim(),
        latitude: coords.lat,
        longitude: coords.lon,
        severity,
        reporterDocument: reporterDocument.trim() || undefined,
      });

      setTitle('');
      setDescription('');
      setReporterDocument('');

      await onReportCreated();

      setFeedback({
        type: 'success',
        message: `Relato enviado com sucesso! Prioridade calculada: ${created.priorityScore.toFixed(
          1
        )}/100 (Confiança: ${Math.round(created.confidenceLevel * 100)}%).`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Erro ao enviar relato. Verifique se o servidor está online.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Registrar Ocorrência Urbana</Text>
      <Text style={styles.subheading}>
        Envie relatos de alagamentos, calor extremo ou falta de água/energia na
        sua região.
      </Text>

      {feedback && (
        <View
          style={[
            styles.feedbackBanner,
            feedback.type === 'success'
              ? styles.feedbackSuccess
              : styles.feedbackError,
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              feedback.type === 'success'
                ? { color: '#166534' }
                : { color: '#991B1B' },
            ]}
          >
            {feedback.message}
          </Text>
        </View>
      )}

      <Text style={styles.label}>Tipo de Risco *</Text>
      <View style={styles.optionsRow}>
        {CATEGORIES.map((item) => {
          const active = category === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.optionBtn, active && styles.optionBtnActive]}
              onPress={() => setCategory(item.value)}
              accessibilityRole="button"
            >
              <Text
                style={[styles.optionText, active && styles.optionTextActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Título da Ocorrência *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Rua alagada próximo ao ponto de ônibus"
        placeholderTextColor="#94A3B8"
        value={title}
        onChangeText={setTitle}
        accessibilityLabel="Título da ocorrência"
      />

      <Text style={styles.label}>Bairro *</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickChipsRow}
      >
        {Object.keys(NEIGHBORHOOD_COORDS).map((b) => (
          <TouchableOpacity
            key={b}
            style={[
              styles.neighborhoodChip,
              neighborhood === b && styles.neighborhoodChipActive,
            ]}
            onPress={() => setNeighborhood(b)}
          >
            <Text
              style={[
                styles.neighborhoodChipText,
                neighborhood === b && { color: '#FFFFFF' },
              ]}
            >
              {b}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TextInput
        style={styles.input}
        placeholder="Digite ou selecione um bairro acima"
        placeholderTextColor="#94A3B8"
        value={neighborhood}
        onChangeText={setNeighborhood}
        accessibilityLabel="Nome do bairro"
      />

      <Text style={styles.label}>Nível de Gravidade (1 = Baixo, 5 = Crítico)</Text>
      <View style={styles.severityRow}>
        {[1, 2, 3, 4, 5].map((level) => {
          const active = severity === level;
          return (
            <TouchableOpacity
              key={level}
              style={[styles.severityBtn, active && styles.severityBtnActive]}
              onPress={() => setSeverity(level)}
              accessibilityRole="button"
              accessibilityLabel={`Gravidade nível ${level}`}
            >
              <Text
                style={[
                  styles.severityText,
                  active && styles.severityTextActive,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Detalhes do Local</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descreva pontos de referência, bloqueios ou impacto no local..."
        placeholderTextColor="#94A3B8"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        accessibilityLabel="Detalhes do local"
      />

      <Text style={styles.label}>Identificador Opcional (CPF ou Telefone)</Text>
      <TextInput
        style={styles.input}
        placeholder="Opcional — usado apenas para validação antifraude"
        placeholderTextColor="#94A3B8"
        value={reporterDocument}
        onChangeText={setReporterDocument}
        accessibilityLabel="Identificador opcional do morador"
      />
      <Text style={styles.lgpdNote}>
        Proteção de Dados (LGPD): seu identificador é convertido em hash
        SHA-256 irreversível no servidor e nunca é exibido publicamente.
      </Text>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (submitting || isOffline) && styles.submitDisabled,
        ]}
        onPress={handleSubmit}
        disabled={submitting || isOffline}
        accessibilityRole="button"
      >
        <Text style={styles.submitButtonText}>
          {isOffline
            ? 'Servidor Offline — Aguardando Reconexão'
            : submitting
            ? 'Enviando Relato...'
            : 'Enviar Alerta Comunitário'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 19, fontWeight: '800', color: '#0F172A' },
  subheading: { fontSize: 13, color: '#475569', marginTop: 4, marginBottom: 14 },
  feedbackBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  feedbackSuccess: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  feedbackError: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  feedbackText: { fontSize: 13, fontWeight: '700' },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    marginTop: 10,
  },
  optionsRow: { flexDirection: 'row', gap: 6 },
  optionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  optionBtnActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  optionText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  optionTextActive: { color: '#FFFFFF' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: { minHeight: 76, textAlignVertical: 'top' },
  quickChipsRow: { gap: 6, marginBottom: 8 },
  neighborhoodChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  neighborhoodChipActive: { backgroundColor: '#2563EB' },
  neighborhoodChipText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  severityRow: { flexDirection: 'row', gap: 8 },
  severityBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityBtnActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  severityText: { fontSize: 15, fontWeight: '800', color: '#334155' },
  severityTextActive: { color: '#FFFFFF' },
  lgpdNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  submitDisabled: { backgroundColor: '#94A3B8' },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});