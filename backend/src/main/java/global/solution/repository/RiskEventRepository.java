package global.solution.repository;

import global.solution.model.RiskCategory;
import global.solution.model.RiskEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RiskEventRepository extends JpaRepository<RiskEvent, Long> {

    List<RiskEvent> findByActiveTrueOrderByPriorityScoreDescCreatedAtDesc();

    List<RiskEvent> findByCategoryAndActiveTrueOrderByPriorityScoreDescCreatedAtDesc(RiskCategory category);

    long countByNeighborhoodIgnoreCaseAndActiveTrueAndCreatedAtAfter(String neighborhood, LocalDateTime since);
}