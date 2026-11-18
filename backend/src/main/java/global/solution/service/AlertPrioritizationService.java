package global.solution.service;

import global.solution.dto.DashboardSummaryDTO;
import global.solution.dto.RiskEventResponseDTO;
import global.solution.model.DataSourceType;
import global.solution.model.RiskCategory;
import global.solution.model.RiskEvent;
import global.solution.repository.RiskEventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AlertPrioritizationService {

    private final RiskEventRepository repository;

    public AlertPrioritizationService(RiskEventRepository repository) {
        this.repository = repository;
    }

    /*
     * Calcula o score de prioridade (0 a 100) combinando:
     * 1. Severidade base (1..5)
     * 2. Nível de confiança + peso institucional da origem
     * 3. Recorrência espacial-temporal no mesmo bairro na última 1 hora
     */
    public double calculatePriorityScore(RiskEvent event) {
        int clampedSeverity = Math.max(1, Math.min(5, event.getSeverity() != null ? event.getSeverity() : 1));
        double clampedConfidence = Math.max(0.0, Math.min(1.0, event.getConfidenceLevel() != null ? event.getConfidenceLevel() : 0.5));

        double baseScore = clampedSeverity * 16.0; // Máximo: 80 pontos

        double sourceWeight = switch (event.getSourceType()) {
            case SENSOR -> 1.12;
            case BASE_PUBLICA -> 1.08;
            case REGISTRO_COMUNITARIO -> 0.95;
        };

        double weightedScore = baseScore * (0.5 + (0.5 * clampedConfidence)) * sourceWeight;

        long recentInSameArea = 0;
        if (event.getNeighborhood() != null && !event.getNeighborhood().isBlank()) {
            recentInSameArea = repository.countByNeighborhoodIgnoreCaseAndActiveTrueAndCreatedAtAfter(
                    event.getNeighborhood(),
                    LocalDateTime.now().minusHours(1)
            );
        }

        double clusterBonus = Math.min(15.0, recentInSameArea * 5.0);
        double finalScore = Math.min(100.0, weightedScore + clusterBonus);

        return Math.round(finalScore * 10.0) / 10.0;
    }

    public RiskEvent evaluateAndSave(RiskEvent event) {
        if (event.getCreatedAt() == null) {
            event.setCreatedAt(LocalDateTime.now());
        }
        event.setPriorityScore(calculatePriorityScore(event));
        return repository.save(event);
    }

    public List<RiskEventResponseDTO> getPrioritizedAlerts(RiskCategory category) {
        List<RiskEvent> events = (category == null)
                ? repository.findByActiveTrueOrderByPriorityScoreDescCreatedAtDesc()
                : repository.findByCategoryAndActiveTrueOrderByPriorityScoreDescCreatedAtDesc(category);

        return events.stream()
                .map(RiskEventResponseDTO::fromEntity)
                .toList();
    }

    public DashboardSummaryDTO getDashboardSummary() {
        List<RiskEventResponseDTO> events = getPrioritizedAlerts(null);

        long criticalCount = events.stream()
                .filter(e -> e.priorityScore() >= 75.0)
                .count();

        double avgConfidence = events.stream()
                .mapToDouble(RiskEventResponseDTO::confidenceLevel)
                .average()
                .orElse(0.0);

        String topNeighborhood = events.stream()
                .collect(Collectors.groupingBy(RiskEventResponseDTO::neighborhood, Collectors.counting()))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Sem ocorrências");

        return new DashboardSummaryDTO(
                events.size(),
                criticalCount,
                Math.round(avgConfidence * 100.0) / 100.0,
                topNeighborhood,
                LocalDateTime.now(),
                events
        );
    }
}