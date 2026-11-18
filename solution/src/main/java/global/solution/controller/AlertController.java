package global.solution.controller;

import global.solution.dto.DashboardSummaryDTO;
import global.solution.dto.RiskEventResponseDTO;
import global.solution.model.RiskCategory;
import global.solution.service.AlertPrioritizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {

    private final AlertPrioritizationService prioritizationService;

    public AlertController(AlertPrioritizationService prioritizationService) {
        this.prioritizationService = prioritizationService;
    }

    @GetMapping
    public ResponseEntity<List<RiskEventResponseDTO>> listPrioritizedAlerts(
            @RequestParam(required = false) RiskCategory category
    ) {
        return ResponseEntity.ok(prioritizationService.getPrioritizedAlerts(category));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardSummaryDTO> getDashboard() {
        return ResponseEntity.ok(prioritizationService.getDashboardSummary());
    }

    @GetMapping("/health")
    public ResponseEntity> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}