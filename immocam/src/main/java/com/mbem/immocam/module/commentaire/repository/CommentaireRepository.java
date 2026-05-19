package com.mbem.immocam.module.commentaire.repository;

import com.mbem.immocam.module.commentaire.entity.Commentaire;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository pour les commentaires sur les annonces.
 *
 * @author MBEMNOVA
 */
@Repository
public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {

    /**
     * Commentaires de premier niveau d'une annonce (sans les réponses).
     * Triés du plus ancien au plus récent (ordre chronologique).
     */
    @Query("SELECT c FROM Commentaire c WHERE c.annonce.id = :annonceId " +
           "AND c.reponse IS NULL " +
           "AND c.estSupprime = false " +
           "ORDER BY c.dateCreation ASC")
    Page<Commentaire> findByAnnonceId(@Param("annonceId") Long annonceId, Pageable pageable);

    /** Nombre de commentaires actifs pour une annonce. */
    long countByAnnonceIdAndEstSupprimeFalse(Long annonceId);

    long countByAnnonceId(Long annonceId);

    /** Top 20 commentaires les plus récents d'une annonce (pour le détail). */
    List<Commentaire> findTop20ByAnnonceIdOrderByDateCreationDesc(Long annonceId);

    /** Commentaires publiés depuis une date (stats admin). */
    @Query("SELECT COUNT(c) FROM Commentaire c WHERE c.dateCreation >= :depuis")
    long countDepuis(@Param("depuis") LocalDateTime depuis);
}
