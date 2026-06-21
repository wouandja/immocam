package com.mbem.immocam.module.contact.repository;

import com.mbem.immocam.module.contact.entity.ContactWhatsApp;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/**
 * Repository pour les contacts WhatsApp.
 *
 * Règles métier :
 * - Un utilisateur ne peut contacter une annonce qu'une seule fois (déduplication en service).
 * - Le propriétaire n'est jamais compté dans ses propres contacts.
 *
 * @author MBEMNOVA
 */
@Repository
public interface ContactWhatsAppRepository extends JpaRepository<ContactWhatsApp, Long> {

    // ── Lecture par annonce ───────────────────────────────────────────────────

    /** Contacts d'une annonce triés du plus récent (dashboard propriétaire). */
    Page<ContactWhatsApp> findByAnnonceIdOrderByDateContactDesc(Long annonceId, Pageable pageable);

    /** Nombre total de contacts pour une annonce. */
    long countByAnnonceId(Long annonceId);

    // ── Vérifications ─────────────────────────────────────────────────────────

    /** Vérifie si un utilisateur a déjà contacté une annonce. */
    boolean existsByUtilisateurIdAndAnnonceId(Long utilisateurId, Long annonceId);

    /**
     * Vérifie si un utilisateur a déjà contacté une annonce,
     * en s'assurant qu'il n'est pas le propriétaire (double sécurité).
     */
    boolean existsByUtilisateurIdAndAnnonceIdAndAnnonce_Proprietaire_IdNot(
            Long utilisateurId, Long annonceId, Long proprietaireId);

    // ── Dashboard propriétaire ────────────────────────────────────────────────

    /**
     * Nombre de contacts UNIQUES reçus par un propriétaire sur toutes ses annonces.
     * Un même utilisateur ne compte qu'une seule fois par annonce.
     * Le propriétaire est exclu du comptage.
     *
     * Correction du bug de duplication : COUNT(DISTINCT paire utilisateur+annonce)
     * au lieu de COUNT(*) qui comptait chaque ligne brute.
     *
     * Exclut les contacts sur une annonce supprimée (deleted = true), pour
     * rester cohérent avec sumVuesByProprietaireId qui exclut déjà ces annonces.
     */
    @Query("""
        SELECT COUNT(DISTINCT CONCAT(CAST(c.utilisateur.id AS string), '-', CAST(c.annonce.id AS string)))
        FROM ContactWhatsApp c
        WHERE c.annonce.proprietaire.id = :proprietaireId
          AND c.utilisateur.id != :proprietaireId
          AND c.annonce.deleted = false
        """)
    long countContactsUniquesByProprietaireId(@Param("proprietaireId") Long proprietaireId);

    /**
     * Contacts dédupliqués reçus par un propriétaire sur toutes ses annonces.
     * Pour chaque paire (utilisateur, annonce), seule la première entrée est retournée.
     * Le propriétaire est exclu.
     * Utilisé dans mesContacts().
     */
    @Query("""
        SELECT c FROM ContactWhatsApp c
        WHERE c.annonce.proprietaire.id = :proprietaireId
          AND c.utilisateur.id != :proprietaireId
          AND c.id = (
              SELECT MIN(c2.id) FROM ContactWhatsApp c2
              WHERE c2.utilisateur.id = c.utilisateur.id
                AND c2.annonce.id = c.annonce.id
          )
        ORDER BY c.dateContact DESC
        """)
    Page<ContactWhatsApp> findDedupByProprietaire(
            @Param("proprietaireId") Long proprietaireId, Pageable pageable);

    // ── Statistiques admin ────────────────────────────────────────────────────

    /** Nombre de contacts enregistrés depuis une date donnée (stats admin). */
    @Query("SELECT COUNT(c) FROM ContactWhatsApp c WHERE c.dateContact >= :depuis")
    long countDepuis(@Param("depuis") LocalDateTime depuis);
}