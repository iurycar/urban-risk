package global.solution.controller;

import global.solution.dto.CommunityReportRequestDTO;
import global.solution.dto.PublicBaseIngestionRequestDTO;
import global.solution.dto.RiskEventResponseDTO;
import global.solution.dto.SensorIngestionRequestDTO;
import global.solution.service.EventIngestionService;
import global.solution.service.SensorSimulatorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class IngestionController {

    private final EventIngestionService ingestionService;
    private final SensorSimulatorService simulatorService;

    public IngestionController(
            EventIngestionService ingestionService,
            SensorSimulatorService simulatorService
    ) {
        this.ingestionService = ingestionService;
        this.simulatorService = simulatorService;
    }

    @PostMapping("/sensor")
    public ResponseEntity<RiskEventResponseDTO> receiveSensorData(
            @RequestBody SensorIngestionRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ingestionService.ingestSensorData(request));
    }

    @PostMapping("/public-base")
    public ResponseEntity<RiskEventResponseDTO> receivePublicBaseData(
            @RequestBody PublicBaseIngestionRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ingestionService.ingestPublicBaseData(request));
    }

    @PostMapping("/community")
    public ResponseEntity<RiskEventResponseDTO> receiveCommunityReport(
            @RequestBody CommunityReportRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ingestionService.ingestCommunityReport(request));
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<Void> resolveEvent(@PathVariable Long id) {
        ingestionService.resolveEvent(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/simulate-now")
    public ResponseEntity<RiskEventResponseDTO> simulateNow() {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(simulatorService.triggerSimulatedEvent());
    }

    @PatchMapping("/simulation")
    public ResponseEntity<Map<String, Boolean>> toggleSimulation(@RequestParam boolean enabled) {
        boolean currentState = simulatorService.setSimulationEnabled(enabled);
        return ResponseEntity.ok(Map.of(
                "simulationEnabled", currentState
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleValidationError(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}