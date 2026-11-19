package global.solution.dto;

import global.solution.model.RiskCategory;

public record PublicBaseIngestionRequestDTO(
        String title,
        String description,
        RiskCategory category,
        String neighborhood,
        Double latitude,
        Double longitude,
        Integer severity,
        String agencyName,
        Double confidenceLevel
) {
}