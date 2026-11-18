package global.solution.dto;

import global.solution.model.DataSourceType;
import global.solution.model.RiskCategory;
import global.solution.model.RiskEvent;

import java.time.LocalDateTime;

public record RiskEventResponseDTO(
        Long id,
        String title,
        String description,
        RiskCategory category,
        String neighborhood,
        Double latitude,
        Double longitude,
        Integer severity,
        DataSourceType sourceType,
        String sourceName,
        Double confidenceLevel,
        Double priorityScore,
        Boolean active,
        LocalDateTime createdAt
) {
    public static RiskEventResponseDTO fromEntity(RiskEvent event) {
        return new RiskEventResponseDTO(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getCategory(),
                event.getNeighborhood(),
                event.getLatitude(),
                event.getLongitude(),
                event.getSeverity(),
                event.getSourceType(),
                event.getSourceName(),
                event.getConfidenceLevel(),
                event.getPriorityScore(),
                event.getActive(),
                event.getCreatedAt()
        );
    }
}