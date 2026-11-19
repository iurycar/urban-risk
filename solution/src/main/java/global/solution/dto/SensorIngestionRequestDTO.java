package global.solution.dto;

import global.solution.model.RiskCategory;

public record SensorIngestionRequestDTO(
        String title,
        String description,
        RiskCategory category,
        String neighborhood,
        Double latitude,
        Double longitude,
        Integer severity,
        String sensorCode,
        Double confidenceLevel
) {
}