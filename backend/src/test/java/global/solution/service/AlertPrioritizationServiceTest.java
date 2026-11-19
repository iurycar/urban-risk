package global.solution.service;

import global.solution.dto.CommunityReportRequestDTO;
import global.solution.dto.RiskEventResponseDTO;
import global.solution.model.DataSourceType;
import global.solution.model.RiskCategory;
import global.solution.model.RiskEvent;
import global.solution.repository.RiskEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertPrioritizationServiceTest {

    @Mock
    private RiskEventRepository repository;

    private AlertPrioritizationService prioritizationService;
    private EventIngestionService ingestionService;

    @BeforeEach
    void setUp() {
        prioritizationService = new AlertPrioritizationService(repository);
        ingestionService = new EventIngestionService(prioritizationService, repository);
    }

    @Test
    void shouldPrioritizeHighConfidenceSensorOverLowConfidenceCommunityReport() {
        when(repository.countByNeighborhoodIgnoreCaseAndActiveTrueAndCreatedAtAfter(any(), any()))
                .thenReturn(0L);

        RiskEvent sensorEvent = new RiskEvent();
        sensorEvent.setSeverity(5);
        sensorEvent.setSourceType(DataSourceType.SENSOR);
        sensorEvent.setConfidenceLevel(0.95);
        sensorEvent.setNeighborhood("Pinheiros");

        RiskEvent communityEvent = new RiskEvent();
        communityEvent.setSeverity(3);
        communityEvent.setSourceType(DataSourceType.REGISTRO_COMUNITARIO);
        communityEvent.setConfidenceLevel(0.65);
        communityEvent.setNeighborhood("Lapa");

        double sensorScore = prioritizationService.calculatePriorityScore(sensorEvent);
        double communityScore = prioritizationService.calculatePriorityScore(communityEvent);

        assertTrue(sensorScore > communityScore,
                "Alerta crítico de sensor deve ter prioridade superior a relato comunitário moderado");
        assertTrue(sensorScore <= 100.0);
    }

    @Test
    void shouldApplySpatialClusterBonusWhenMultipleEventsOccurInSameNeighborhood() {
        RiskEvent event = new RiskEvent();
        event.setSeverity(4);
        event.setSourceType(DataSourceType.BASE_PUBLICA);
        event.setConfidenceLevel(0.90);
        event.setNeighborhood("Mooca");

        when(repository.countByNeighborhoodIgnoreCaseAndActiveTrueAndCreatedAtAfter(eq("Mooca"), any(LocalDateTime.class)))
                .thenReturn(0L);
        double isolatedScore = prioritizationService.calculatePriorityScore(event);

        when(repository.countByNeighborhoodIgnoreCaseAndActiveTrueAndCreatedAtAfter(eq("Mooca"), any(LocalDateTime.class)))
                .thenReturn(2L);
        double clusteredScore = prioritizationService.calculatePriorityScore(event);

        assertTrue(clusteredScore > isolatedScore,
                "Eventos recorrentes no mesmo bairro na última hora devem receber bônus de prioridade");
    }

    @Test
    void shouldHashPersonalDocumentAndNeverExposeItInResponseDto() {
        when(repository.countByNeighborhoodIgnoreCaseAndActiveTrueAndCreatedAtAfter(any(), any()))
                .thenReturn(0L);
        when(repository.save(any(RiskEvent.class))).thenAnswer(invocation -> {
            RiskEvent saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        String rawCpf = "123.456.789-00";
        CommunityReportRequestDTO request = new CommunityReportRequestDTO(
                "Bueiro entupido na esquina",
                "Água começando a subir na guia",
                RiskCategory.ALAGAMENTO,
                "Vila Mariana",
                -23.589,
                -46.634,
                3,
                rawCpf
        );

        RiskEventResponseDTO response = ingestionService.ingestCommunityReport(request);

        ArgumentCaptor<RiskEvent> captor = ArgumentCaptor.forClass(RiskEvent.class);
        verify(repository).save(captor.capture());

        RiskEvent persisted = captor.getValue();
        assertNotNull(persisted.getReporterDocumentHash());
        assertNotEquals(rawCpf, persisted.getReporterDocumentHash(),
                "O documento do morador deve ser armazenado apenas como hash SHA-256");
        assertEquals(64, persisted.getReporterDocumentHash().length());
        assertEquals(99L, response.id());
    }
}