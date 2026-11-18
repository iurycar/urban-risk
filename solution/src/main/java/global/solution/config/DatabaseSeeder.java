package global.solution.config;

import global.solution.model.DataSourceType;
import global.solution.model.RiskCategory;
import global.solution.model.RiskEvent;
import global.solution.repository.RiskEventRepository;
import global.solution.service.AlertPrioritizationService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final RiskEventRepository repository;
    private final AlertPrioritizationService prioritizationService;

    public DatabaseSeeder(RiskEventRepository repository, AlertPrioritizationService prioritizationService) {
        this.repository = repository;
        this.prioritizationService = prioritizationService;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            return;
        }

        List<RiskEvent> initialEvents = List.of(
                createEvent(
                        "Alagamento severo na Marginal Pinheiros",
                        "Nível da lâmina d'água atingiu 45 cm próximo à Ponte Eusébio Matoso. Trânsito bloqueado.",
                        RiskCategory.ALAGAMENTO,
                        "Pinheiros",
                        -23.5674, -46.7019,
                        5,
                        DataSourceType.SENSOR,
                        "Sensor Hidrológico CGE-04",
                        0.96,
                        LocalDateTime.now().minusMinutes(12)
                ),
                createEvent(
                        "Acúmulo de água em via local",
                        "Moradores relatam bueiros entupidos e água cobrindo a calçada na Rua Teodoro Sampaio.",
                        RiskCategory.ALAGAMENTO,
                        "Pinheiros",
                        -23.5615, -46.6892,
                        3,
                        DataSourceType.REGISTRO_COMUNITARIO,
                        "Relato Comunitário Verificado",
                        0.72,
                        LocalDateTime.now().minusMinutes(25)
                ),
                createEvent(
                        "Ilha de calor extrema na região central",
                        "Temperatura de superfície atingiu 39.4°C com umidade relativa abaixo de 22%.",
                        RiskCategory.ILHA_CALOR,
                        "Sé",
                        -23.5505, -46.6333,
                        4,
                        DataSourceType.BASE_PUBLICA,
                        "INMET / Defesa Civil Municipal",
                        0.93,
                        LocalDateTime.now().minusMinutes(30)
                ),
                createEvent(
                        "Queda de energia em subestação",
                        "Interrupção no fornecimento elétrico afetando semáforos e unidades básicas de saúde.",
                        RiskCategory.INTERRUPCAO_SERVICO,
                        "Mooca",
                        -23.5587, -46.5971,
                        5,
                        DataSourceType.BASE_PUBLICA,
                        "Boletim Concessionária / Defesa Civil",
                        0.91,
                        LocalDateTime.now().minusMinutes(18)
                ),
                createEvent(
                        "Pico térmico em corredor comercial",
                        "Sensor urbano indica sensação térmica de 37.8°C sem cobertura arbórea próxima.",
                        RiskCategory.ILHA_CALOR,
                        "Itaquera",
                        -23.5422, -46.4561,
                        4,
                        DataSourceType.SENSOR,
                        "Estação Microclimática Leste-02",
                        0.95,
                        LocalDateTime.now().minusMinutes(40)
                ),
                createEvent(
                        "Interrupção no abastecimento de água",
                        "Manutenção emergencial na rede adutora deixa residências sem água desde o início da manhã.",
                        RiskCategory.INTERRUPCAO_SERVICO,
                        "Santana",
                        -23.5019, -46.6249,
                        3,
                        DataSourceType.BASE_PUBLICA,
                        "Portal de Ocorrências Saneamento",
                        0.89,
                        LocalDateTime.now().minusHours(2)
                ),
                createEvent(
                        "Ponto de alagamento próximo ao metrô",
                        "Enxurrada dificultando travessia de pedestres na saída da estação.",
                        RiskCategory.ALAGAMENTO,
                        "Vila Mariana",
                        -23.5895, -46.6347,
                        4,
                        DataSourceType.REGISTRO_COMUNITARIO,
                        "Relato Comunitário",
                        0.68,
                        LocalDateTime.now().minusMinutes(15)
                ),
                createEvent(
                        "Oscilação na rede elétrica residencial",
                        "Quedas intermitentes de fase reportadas por comerciantes da região.",
                        RiskCategory.INTERRUPCAO_SERVICO,
                        "Lapa",
                        -23.5280, -46.7042,
                        2,
                        DataSourceType.REGISTRO_COMUNITARIO,
                        "Relato Comunitário",
                        0.64,
                        LocalDateTime.now().minusHours(1)
                )
        );

        for (RiskEvent event : initialEvents) {
            prioritizationService.evaluateAndSave(event);
        }
    }

    private RiskEvent createEvent(
            String title,
            String description,
            RiskCategory category,
            String neighborhood,
            Double lat,
            Double lon,
            int severity,
            DataSourceType sourceType,
            String sourceName,
            double confidence,
            LocalDateTime createdAt
    ) {
        RiskEvent event = new RiskEvent();
        event.setTitle(title);
        event.setDescription(description);
        event.setCategory(category);
        event.setNeighborhood(neighborhood);
        event.setLatitude(lat);
        event.setLongitude(lon);
        event.setSeverity(severity);
        event.setSourceType(sourceType);
        event.setSourceName(sourceName);
        event.setConfidenceLevel(confidence);
        event.setCreatedAt(createdAt);
        event.setActive(true);
        return event;
    }
}