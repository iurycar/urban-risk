package global.solution.service;

import global.solution.dto.RiskEventResponseDTO;
import global.solution.dto.SensorIngestionRequestDTO;
import global.solution.model.RiskCategory;
import global.solution.model.RiskEvent;
import global.solution.repository.RiskEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class SensorSimulatorService {

    private static final Logger log = LoggerFactory.getLogger(SensorSimulatorService.class);
    private static final int MAX_ACTIVE_EVENTS = 14;

    private final EventIngestionService ingestionService;
    private final RiskEventRepository repository;
    private final AtomicBoolean simulationEnabled = new AtomicBoolean(true);
    private final AtomicInteger scenarioIndex = new AtomicInteger(0);

    private static final List<SensorIngestionRequestDTO> SIMULATED_READINGS = List.of(
            new SensorIngestionRequestDTO(
                    "Elevação rápida do nível do córrego",
                    "Sensor ultrassônico detectou subida de 32 cm em 10 minutos.",
                    RiskCategory.ALAGAMENTO,
                    "Pinheiros",
                    -23.5681, -46.7005,
                    5,
                    "PLUV-PIN-09",
                    0.97
            ),
            new SensorIngestionRequestDTO(
                    "Índice térmico crítico em via arterial",
                    "Temperatura ambiente de 38.9°C com baixa dispersão atmosférica.",
                    RiskCategory.ILHA_CALOR,
                    "Brás",
                    -23.5453, -46.6164,
                    4,
                    "TERM-CEN-14",
                    0.94
            ),
            new SensorIngestionRequestDTO(
                    "Falha de telemetria em transformador",
                    "Queda abrupta de tensão detectada em rede de distribuição secundária.",
                    RiskCategory.INTERRUPCAO_SERVICO,
                    "Tatuapé",
                    -23.5401, -46.5762,
                    4,
                    "GRID-LES-03",
                    0.92
            ),
            new SensorIngestionRequestDTO(
                    "Transbordamento iminente de galeria pluvial",
                    "Vazão acima de 92% da capacidade operacional registrada na estação.",
                    RiskCategory.ALAGAMENTO,
                    "Santo Amaro",
                    -23.6542, -46.7098,
                    5,
                    "HIDRO-SUL-07",
                    0.96
            ),
            new SensorIngestionRequestDTO(
                    "Sobrecarga térmica em área industrial",
                    "Sensores de superfície apontam 40.1°C em bolsão sem cobertura vegetal.",
                    RiskCategory.ILHA_CALOR,
                    "Barra Funda",
                    -23.5255, -46.6674,
                    4,
                    "TERM-OES-11",
                    0.93
            )
    );

    public SensorSimulatorService(
            EventIngestionService ingestionService,
            RiskEventRepository repository
    ) {
        this.ingestionService = ingestionService;
        this.repository = repository;
    }

    @Scheduled(initialDelay = 15000, fixedDelay = 20000)
    public void scheduledSensorTick() {
        if (!simulationEnabled.get()) {
            return;
        }
        triggerSimulatedEvent();
    }

    public RiskEventResponseDTO triggerSimulatedEvent() {
        cleanupOldEventsIfNeeded();

        int idx = Math.abs(scenarioIndex.getAndIncrement() % SIMULATED_READINGS.size());
        SensorIngestionRequestDTO nextReading = SIMULATED_READINGS.get(idx);

        RiskEventResponseDTO created = ingestionService.ingestSensorData(nextReading);
        log.info("[Simulador IoT] Novo evento gerado: '{}' (Bairro: {}, Score: {})",
                created.title(), created.neighborhood(), created.priorityScore());
        return created;
    }

    public boolean setSimulationEnabled(boolean enabled) {
        simulationEnabled.set(enabled);
        return simulationEnabled.get();
    }

    public boolean isSimulationEnabled() {
        return simulationEnabled.get();
    }

    private void cleanupOldEventsIfNeeded() {
        List<RiskEvent> activeEvents = repository.findByActiveTrueOrderByPriorityScoreDescCreatedAtDesc();
        if (activeEvents.size() >= MAX_ACTIVE_EVENTS) {
            RiskEvent oldest = activeEvents.get(activeEvents.size() - 1);
            oldest.setActive(false);
            repository.save(oldest);
        }
    }
}