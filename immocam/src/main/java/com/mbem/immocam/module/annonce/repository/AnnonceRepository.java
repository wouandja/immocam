package com.mbem.immocam.module.annonce.repository;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository pour les opérations sur les annonces.
 *
 * @author MBEMNOVA
 */
@Repository
public interface AnnonceRepository
        extends JpaRepository<Annonce, Long>, JpaSpecificationExecutor<Annonce> {

    // ── Lecture publique ───────────────────────────────────────────────────

    /** Liste paginée des annonces actives pour la page d'accueil. */
    Page<Annonce> findByStatutAndDeletedFalse(StatutAnnonce statut, Pageable pageable);

    // ── Dashboard propriétaire ─────────────────────────────────────────────

    /** Toutes les annonces d'un propriétaire (dashboard). */
    Page<Annonce> findByProprietaireIdAndDeletedFalse(Long proprietaireId, Pageable pageable);

    /** Compter toutes les annonces non supprimées d'un propriétaire. */
    long countByProprietaireIdAndDeletedFalse(Long proprietaireId);

    /** Compter les annonces d'un propriétaire par statut (hors supprimées). */
    long countByProprietaireIdAndStatutAndDeletedFalse(Long proprietaireId, StatutAnnonce statut);

    /** Annonces expirant bientôt pour un propriétaire. */
    List<Annonce> findByProprietaireIdAndStatutAndDateExpirationBeforeAndDeletedFalse(
            Long proprietaireId, StatutAnnonce statut, LocalDateTime date);

    // ── Scheduler ─────────────────────────────────────────────────────────

    /** J-5 : annonces à notifier 5 jours avant expiration. */
    @Query("SELECT a FROM Annonce a WHERE a.statut = 'ACTIVE' " +
            "AND a.dateExpiration BETWEEN :debut AND :fin " +
            "AND a.rappelJ5Envoye = false AND a.deleted = false")
    List<Annonce> findAnnoncesRappelJ5(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin);

    /** J-1 : annonces à notifier 1 jour avant expiration. */
    @Query("SELECT a FROM Annonce a WHERE a.statut = 'ACTIVE' " +
            "AND a.dateExpiration BETWEEN :debut AND :fin " +
            "AND a.rappelJ1Envoye = false AND a.deleted = false")
    List<Annonce> findAnnoncesRappelJ1(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin);

    /** J0 : annonces expirées à passer en statut EXPIREE. */
    @Query("SELECT a FROM Annonce a WHERE a.statut = 'ACTIVE' " +
            "AND a.dateExpiration <= :maintenant AND a.deleted = false")
    List<Annonce> findAnnoncesExpirees(@Param("maintenant") LocalDateTime maintenant);

    /** J+7 : annonces expirées à supprimer définitivement. */
    @Query("SELECT a FROM Annonce a WHERE a.statut = 'EXPIREE' " +
            "AND a.dateExpiration <= :limite AND a.deleted = false")
    List<Annonce> findAnnoncesASupprimer(@Param("limite") LocalDateTime limite);

    // ── Détection de doublon ───────────────────────────────────────────────

    @Query("SELECT COUNT(a) > 0 FROM Annonce a " +
            "WHERE a.proprietaire.id = :propId " +
            "AND a.typeBien.id = :typeBienId " +
            "AND a.localisation.id = :locId " +
            "AND a.quartier = :quartier " +
            "AND a.prix = :prix " +
            "AND a.numeroWhatsApp = :whatsapp " +
            "AND a.statut = 'ACTIVE' AND a.deleted = false")
    boolean existsDoublon(
            @Param("propId") Long proprietaireId,
            @Param("typeBienId") Long typeBienId,
            @Param("locId") Long localisationId,
            @Param("quartier") String quartier,
            @Param("prix") BigDecimal prix,
            @Param("whatsapp") String numeroWhatsApp);

    // ── Vues ───────────────────────────────────────────────────────────────

    /**
     * Incrémenter les vues pour un visiteur connecté,
     * en excluant le propriétaire de l'annonce.
     */
    @Modifying
    @Query("UPDATE Annonce a SET a.nombreVues = a.nombreVues + 1 " +
            "WHERE a.id = :id AND a.proprietaire.id != :utilisateurId")
    void incrementerVues(@Param("id") Long id, @Param("utilisateurId") Long utilisateurId);

    /**
     * Incrémenter les vues pour un visiteur anonyme (non connecté).
     */
    @Modifying
    @Query("UPDATE Annonce a SET a.nombreVues = a.nombreVues + 1 WHERE a.id = :id")
    void incrementerVuesSansRestriction(@Param("id") Long id);

    /** Somme des vues de toutes les annonces d'un propriétaire. */
    @Query("SELECT COALESCE(SUM(a.nombreVues), 0) FROM Annonce a " +
            "WHERE a.proprietaire.id = :id AND a.deleted = false")
    long sumVuesByProprietaireId(@Param("id") Long proprietaireId);

    // ── Statistiques ───────────────────────────────────────────────────────

    /** Compter les annonces publiées depuis une date (stats admin). */
    @Query("SELECT COUNT(a) FROM Annonce a WHERE a.dateCreation >= :depuis")
    long countPublieesDepuis(@Param("depuis") LocalDateTime depuis);

    /** Annonces similaires : même type + même ville, hors annonce courante. */
    @Query("SELECT a FROM Annonce a WHERE a.typeBien.id = :typeBienId " +
            "AND a.localisation.ville = :ville " +
            "AND a.statut = 'ACTIVE' AND a.deleted = false " +
            "AND a.id != :annonceId " +
            "ORDER BY a.dateCreation DESC")
    List<Annonce> findAnnoncesSimiliaires(
            @Param("annonceId") Long annonceId,
            @Param("typeBienId") Long typeBienId,
            @Param("ville") String ville,
            Pageable pageable);

    /** Classement des villes les plus actives. */
    @Query("SELECT a.localisation.ville, COUNT(a) FROM Annonce a " +
            "WHERE a.statut = 'ACTIVE' AND a.deleted = false " +
            "GROUP BY a.localisation.ville ORDER BY COUNT(a) DESC")
    List<Object[]> findVillesLesPlusActives(Pageable pageable);

    /** Classement des types de biens les plus publiés. */
    @Query("SELECT a.typeBien.libelle, COUNT(a) FROM Annonce a " +
            "WHERE a.deleted = false " +
            "GROUP BY a.typeBien.libelle ORDER BY COUNT(a) DESC")
    List<Object[]> findTypesBiensLesPlusPublies(Pageable pageable);

    // ── Filtres géographiques ──────────────────────────────────────────────

    /** Tous les quartiers distincts non nuls des annonces actives. */
    @Query("SELECT DISTINCT a.quartier FROM Annonce a " +
            "WHERE a.statut = 'ACTIVE' AND a.deleted = false " +
            "AND a.quartier IS NOT NULL AND a.quartier <> '' " +
            "ORDER BY a.quartier ASC")
    List<String> findQuartiersDistincts();


/** Compter toutes les annonces par statut (usage admin global, sans filtre propriétaire). */
long countByStatutAndDeletedFalse(StatutAnnonce statut);

    /** Quartiers distincts des annonces actives pour une ville donnée. */
    @Query("SELECT DISTINCT a.quartier FROM Annonce a " +
            "WHERE a.statut = 'ACTIVE' AND a.deleted = false " +
            "AND a.localisation.ville = :ville " +
            "AND a.quartier IS NOT NULL AND a.quartier <> '' " +
            "ORDER BY a.quartier ASC")
    List<String> findQuartiersByVille(@Param("ville") String ville);
}