package com.mbem.immocam.module.favori.repository;

import com.mbem.immocam.module.favori.entity.Favori;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour les favoris des utilisateurs.
 *
 * @author MBEMNOVA
 */
@Repository
public interface FavoriRepository extends JpaRepository<Favori, Long> {

    // ── Lecture ───────────────────────────────────────────────────────────────

    /** Liste des favoris d'un utilisateur, du plus récent au plus ancien. */
    Page<Favori> findByUtilisateurIdOrderByDateCreationDesc(Long utilisateurId, Pageable pageable);

    Optional<Favori> findByUtilisateurIdAndAnnonceId(Long utilisateurId, Long annonceId);

    // ── Vérifications ─────────────────────────────────────────────────────────

    boolean existsByUtilisateurIdAndAnnonceId(Long utilisateurId, Long annonceId);

    // ── Suppressions ──────────────────────────────────────────────────────────

    void deleteByUtilisateurIdAndAnnonceId(Long utilisateurId, Long annonceId);

    // ── Dashboard propriétaire ────────────────────────────────────────────────

    /**
     * Nombre de fois que les annonces d'un propriétaire ont été mises en favori.
     * Query explicite pour éviter toute ambiguité sur le champ compté.
     *
     * Corrige le bug : l'ancienne méthode dérivée countByAnnonceProprietaireId
     * pouvait compter les entités Favori liées indirectement et donner
     * un résultat incorrect selon le mapping JPA.
     */
    @Query("SELECT COUNT(f) FROM Favori f WHERE f.annonce.proprietaire.id = :proprietaireId")
    long countFavorisRealsByProprietaireId(@Param("proprietaireId") Long proprietaireId);
}