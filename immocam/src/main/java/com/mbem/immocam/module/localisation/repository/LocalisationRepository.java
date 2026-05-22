package com.mbem.immocam.module.localisation.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.mbem.immocam.module.localisation.dto.request.VilleDto;
import com.mbem.immocam.module.localisation.entity.Localisation;

/**
 * Repository pour les villes du Cameroun.
 *
 * @author MBEMNOVA
 */
@Repository
public interface LocalisationRepository extends JpaRepository<Localisation, Long> {

    public interface VilleProjection {
    Long getId();
    String getVille();
}

    /** Liste des villes actives (sans doublons) — pour le filtre de recherche. */
    @Query("SELECT DISTINCT l.ville FROM Localisation l WHERE l.estActive = true ORDER BY l.ville ASC")
    List<String> findVillesActives();

    /** Liste des localisations actives pour une ville. */
    List<Localisation> findByVilleAndEstActiveTrue(String ville);


   // Remplacer la query par celle-ci
@Query("SELECT l.id AS id, l.ville AS ville FROM Localisation l WHERE l.estActive = true ORDER BY l.ville ASC")
List<VilleProjection> findVillesActivesAvecId();

boolean existsByVilleIgnoreCase(String ville);
}
