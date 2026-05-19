package com.mbem.immocam.module.signalement.repository;

import com.mbem.immocam.module.signalement.entity.Signalement;
import com.mbem.immocam.shared.enums.StatutSignalement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {

    Page<Signalement> findByStatutOrderByDateCreationDesc(
            StatutSignalement statut, Pageable pageable);

    // ✅ SUPPRIMÉ : existsByAuteurIdAndAnnonceId — doublon inutile

    /** Utilisé dans SignalementServiceImpl pour éviter les doublons EN_ATTENTE */
    boolean existsByAuteurIdAndAnnonceIdAndStatut(
            Long auteurId, Long annonceId, StatutSignalement statut);


    long countByAnnonceId(Long annonceId);

    long countByStatut(StatutSignalement statut);
}