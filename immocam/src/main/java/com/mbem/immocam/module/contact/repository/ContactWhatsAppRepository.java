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
 * @author MBEMNOVA
 */
@Repository
public interface ContactWhatsAppRepository extends JpaRepository<ContactWhatsApp, Long> {

    /** Contacts d'une annonce triés du plus récent (dashboard propriétaire). */
    Page<ContactWhatsApp> findByAnnonceIdOrderByDateContactDesc(Long annonceId, Pageable pageable);

    /** Nombre de contacts pour une annonce (affiché dans le tableau). */
    long countByAnnonceId(Long annonceId);

    /** Contacts depuis une date (statistiques admin). */
    @Query("SELECT COUNT(c) FROM ContactWhatsApp c WHERE c.dateContact >= :depuis")
    long countDepuis(@Param("depuis") LocalDateTime depuis);

    long count();

    /** Vérifier si un utilisateur a déjà contacté une annonce. */
    boolean existsByUtilisateurIdAndAnnonceId(Long utilisateurId, Long annonceId);


    // ContactWhatsAppRepository
    long countByAnnonceProprietaireId(Long proprietaireId);


    Page<ContactWhatsApp> findByAnnonce_Proprietaire_IdOrderByDateContactDesc(
    Long proprietaireId, Pageable pageable);


 




    /** Vérifier si un utilisateur a déjà contacté une annonce (hors proprio). */
boolean existsByUtilisateurIdAndAnnonceIdAndAnnonce_Proprietaire_IdNot(
    Long utilisateurId, Long annonceId, Long proprietaireId);

/** Contacts dédupliqués d'un proprio, en excluant ses propres contacts. */
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

/** Nombre de contacts pour une annonce (hors proprio). */
long countByAnnonceIdAndUtilisateur_IdNot(Long annonceId, Long utilisateurId);

/** Nombre total de contacts reçus par un proprio (hors lui-même). */
long countByAnnonce_Proprietaire_IdAndUtilisateur_IdNot(
    Long proprietaireId, Long utilisateurId);
 
}
