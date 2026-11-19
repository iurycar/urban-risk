package global.solution.dto;

import global.solution.model.RiskCategory;

public record CommunityReportRequestDTO(
        String title,
        String description,
        RiskCategory category,
        String neighborhood,
        Double latitude,
        Double longitude,
        Integer severity,
        String reporterDocument
) {
}