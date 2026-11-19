package global.solution.service;

import global.solution.dto.CommunityReportRequestDTO;
import global.solution.dto.PublicBaseIngestionRequestDTO;
import global.solution.dto.RiskEventResponseDTO;
import global.solution.dto.SensorIngestionRequestDTO;
import global.solution.model.DataSourceType;
import global.solution.model.RiskEvent;
import global.solution.repository.RiskEventRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
public class EventIngestionService {

    private final AlertPrioritizationService prioritizationService;
    private final RiskEventRepository repository;

    public EventIngestionService(
            AlertPrioritizationService prioritizationService,
            RiskEventRepository repository
    ) {
        this.prioritizationService = prioritizationService;
        this.repository = repository;
    }

    public RiskEventResponseDTO ingestSensorData(SensorIngestionRequestDTO dto) {
        validateCommonFields(dto.title(), dto.category(), dto.neighborhood(), dto.severity());

        double confidence = (dto.confidenceLevel() != null)
                ? clamp(dto.confidenceLevel(), 0.70, 1.0)
                : 0.95;

        String sourceName = (dto.sensorCode() != null && !dto.sensorCode().isBlank())
                ? "Sensor IoT " + dto.sensorCode().trim()
                : "Estação de Monitoramento IoT";

        RiskEvent event = new RiskEvent();
        event.setTitle(dto.title().trim());
        event.setDescription(dto.description());
        event.setCategory(dto.category());
        event.setNeighborhood(dto.neighborhood().trim());
        event.setLatitude(dto.latitude());
        event.setLongitude(dto.longitude());
        event.setSeverity(clampSeverity(dto.severity()));
        event.setSourceType(DataSourceType.SENSOR);
        event.setSourceName(sourceName);
        event.setConfidenceLevel(confidence);
        event.setActive(true);

        RiskEvent saved = prioritizationService.evaluateAndSave(event);
        return RiskEventResponseDTO.fromEntity(saved);
    }

    public RiskEventResponseDTO ingestPublicBaseData(PublicBaseIngestionRequestDTO dto) {
        validateCommonFields(dto.title(), dto.category(), dto.neighborhood(), dto.severity());

        double confidence = (dto.confidenceLevel() != null)
                ? clamp(dto.confidenceLevel(), 0.70, 1.0)
                : 0.90;

        String sourceName = (dto.agencyName() != null && !dto.agencyName().isBlank())
                ? dto.agencyName().trim()
                : "Base Pública Oficial";

        RiskEvent event = new RiskEvent();
        event.setTitle(dto.title().trim());
        event.setDescription(dto.description());
        event.setCategory(dto.category());
        event.setNeighborhood(dto.neighborhood().trim());
        event.setLatitude(dto.latitude());
        event.setLongitude(dto.longitude());
        event.setSeverity(clampSeverity(dto.severity()));
        event.setSourceType(DataSourceType.BASE_PUBLICA);
        event.setSourceName(sourceName);
        event.setConfidenceLevel(confidence);
        event.setActive(true);

        RiskEvent saved = prioritizationService.evaluateAndSave(event);
        return RiskEventResponseDTO.fromEntity(saved);
    }

    public RiskEventResponseDTO ingestCommunityReport(CommunityReportRequestDTO dto) {
        validateCommonFields(dto.title(), dto.category(), dto.neighborhood(), dto.severity());

        // Se já houver ocorrências recentes no mesmo bairro, a confiança do relato comunitário sobe
        long recentCorroborations = repository.countByNeighborhoodIgnoreCaseAndActiveTrueAndCreatedAtAfter(
                dto.neighborhood().trim(),
                LocalDateTime.now().minusHours(1)
        );
        double calculatedConfidence = recentCorroborations > 0 ? 0.78 : 0.65;

        RiskEvent event = new RiskEvent();
        event.setTitle(dto.title().trim());
        event.setDescription(dto.description());
        event.setCategory(dto.category());
        event.setNeighborhood(dto.neighborhood().trim());
        event.setLatitude(dto.latitude());
        event.setLongitude(dto.longitude());
        event.setSeverity(clampSeverity(dto.severity()));
        event.setSourceType(DataSourceType.REGISTRO_COMUNITARIO);
        event.setSourceName("Relato Comunitário (App Morador)");
        event.setConfidenceLevel(calculatedConfidence);
        event.setReporterDocumentHash(hashSensitiveDocument(dto.reporterDocument()));
        event.setActive(true);

        RiskEvent saved = prioritizationService.evaluateAndSave(event);
        return RiskEventResponseDTO.fromEntity(saved);
    }

    public void resolveEvent(Long id) {
        RiskEvent event = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Evento não encontrado com ID: " + id));
        event.setActive(false);
        repository.save(event);
    }

    public String hashSensitiveDocument(String rawDocument) {
        if (rawDocument == null || rawDocument.isBlank()) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawDocument.trim().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algoritmo SHA-256 indisponível", e);
        }
    }

    private void validateCommonFields(String title, Object category, String neighborhood, Integer severity) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("O título do evento é obrigatório.");
        }
        if (category == null) {
            throw new IllegalArgumentException("A categoria do risco é obrigatória.");
        }
        if (neighborhood == null || neighborhood.isBlank()) {
            throw new IllegalArgumentException("O bairro é obrigatório.");
        }
        if (severity == null || severity < 1 || severity > 5) {
            throw new IllegalArgumentException("A severidade deve estar entre 1 e 5.");
        }
    }

    private int clampSeverity(int severity) {
        return Math.max(1, Math.min(5, severity));
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}