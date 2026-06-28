package com.mbem.immocam.module.signalement.repository;

import com.mbem.immocam.module.signalement.entity.Signalement;
import com.mbem.immocam.shared.enums.StatutSignalement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {

    Page<Signalement> findByStatutOrderByDateCreationDesc(
            StatutSignalement statut, Pageable pageable);

    // ✅ SUPPRIMÉ : existsByAuteurIdAndAnnonceId — doublon inutile

    /** Utilisé dans SignalementServiceImpl pour éviter les doublons EN_ATTENTE */
    boolean existsByAuteurIdAndAnnonceIdAndStatut(
            Long auteurId, Long annonceId, StatutSignalement statut);

    /** Anti-abus : limite le nombre de signalements qu'un même utilisateur peut soumettre par jour. */
    long countByAuteurIdAndDateCreationAfter(Long auteurId, LocalDateTime depuis);

    long countByAnnonceId(Long annonceId);

    long countByStatut(StatutSignalement statut);

    /** Autres signalements en attente sur la même annonce (résolus automatiquement avec elle). */
    List<Signalement> findByAnnonceIdAndStatutAndIdNot(Long annonceId, StatutSignalement statut, Long excluId);

    /** Autres signalements en attente contre le même propriétaire, toutes annonces confondues. */
    List<Signalement> findByAnnonce_Proprietaire_IdAndStatutAndIdNot(
            Long proprietaireId, StatutSignalement statut, Long excluId);
}