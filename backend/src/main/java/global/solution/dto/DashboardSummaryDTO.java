package global.solution.dto;

import java.time.LocalDateTime;
import java.util.List;

public record DashboardSummaryDTO(
        int totalActiveEvents,
        long criticalEventsCount,
        double averageConfidence,
        String mostAffectedNeighborhood,
        LocalDateTime serverTimestamp,
        List<RiskEventResponseDTO> prioritizedEvents
) {
}