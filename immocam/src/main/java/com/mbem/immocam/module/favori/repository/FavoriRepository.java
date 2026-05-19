package com.mbem.immocam.module.favori.repository;

import com.mbem.immocam.module.favori.entity.Favori;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour les favoris des utilisateurs.
 *
 * @author MBEMNOVA
 */
@Repository
public interface FavoriRepository extends JpaRepository<Favori, Long> {

    /** Liste des favoris d'un utilisateur (du plus récent au plus ancien). */
    Page<Favori> findByUtilisateurIdOrderByDateCreationDesc(Long utilisateurId, Pageable pageable);

    Optional<Favori> findByUtilisateurIdAndAnnonceId(Long utilisateurId, Long annonceId);

    boolean existsByUtilisateurIdAndAnnonceId(Long utilisateurId, Long annonceId);

    void deleteByUtilisateurIdAndAnnonceId(Long utilisateurId, Long annonceId);

    // FavoriRepository  
    long countByAnnonceProprietaireId(Long proprietaireId);
}
