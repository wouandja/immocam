package com.mbem.immocam.infrastructure.audit;

import com.mbem.immocam.shared.enums.TypeAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/**
 * Repository pour les logs d'activité.
 *
 * Conservation 12 mois (politique de confidentialité).
 * Un job de nettoyage peut appeler deleteLogsAnciens().
 *
 * @author MBEMNOVA
 */
@Repository
public interface LogActiviteRepository extends JpaRepository<LogActivite, Long> {

    Page<LogActivite> findByUtilisateurIdOrderByDateCreationDesc(
            Long utilisateurId, Pageable pageable);

    Page<LogActivite> findByTypeActionOrderByDateCreationDesc(
            TypeAction typeAction, Pageable pageable);

    /** Supprimer les logs plus anciens que 12 mois (RGPD). */
    @Modifying
    @Query("DELETE FROM LogActivite l WHERE l.dateCreation < :limite")
    int deleteLogsAnciens(@Param("limite") LocalDateTime limite);
}
