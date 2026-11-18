package global.solution.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_events")
public class RiskEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskCategory category;

    @Column(nullable = false)
    private String neighborhood;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false)
    private Integer severity; // Escala de 1 (baixo) a 5 (crítico)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DataSourceType sourceType;

    @Column(nullable = false)
    private String sourceName; // Ex: "Estação Pluviométrica Pinheiros", "Defesa Civil"

    @Column(nullable = false)
    private Double confidenceLevel; // 0.0 a 1.0

    @Column(nullable = false)
    private Double priorityScore; // 0.0 a 100.0 (calculado pelo motor de priorização)

    @Column(nullable = false)
    private Boolean active = true;

    // Dado sensível interno (LGPD): nunca é retornado nos DTOs públicos
    @Column(name = "reporter_document_hash")
    private String reporterDocumentHash;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public RiskEvent() {
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.active == null) {
            this.active = true;
        }
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public RiskCategory getCategory() {
        return category;
    }

    public void setCategory(RiskCategory category) {
        this.category = category;
    }

    public String getNeighborhood() {
        return neighborhood;
    }

    public void setNeighborhood(String neighborhood) {
        this.neighborhood = neighborhood;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Integer getSeverity() {
        return severity;
    }

    public void setSeverity(Integer severity) {
        this.severity = severity;
    }

    public DataSourceType getSourceType() {
        return sourceType;
    }

    public void setSourceType(DataSourceType sourceType) {
        this.sourceType = sourceType;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public Double getConfidenceLevel() {
        return confidenceLevel;
    }

    public void setConfidenceLevel(Double confidenceLevel) {
        this.confidenceLevel = confidenceLevel;
    }

    public Double getPriorityScore() {
        return priorityScore;
    }

    public void setPriorityScore(Double priorityScore) {
        this.priorityScore = priorityScore;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getReporterDocumentHash() {
        return reporterDocumentHash;
    }

    public void setReporterDocumentHash(String reporterDocumentHash) {
        this.reporterDocumentHash = reporterDocumentHash;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}