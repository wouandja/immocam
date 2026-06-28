package com.mbem.immocam.module.localisation.repository;

import com.mbem.immocam.module.localisation.entity.Quartier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface QuartierRepository extends JpaRepository<Quartier, Long> {

    List<Quartier> findByLocalisationIdOrderByNomAsc(Long localisationId);

    Optional<Quartier> findByLocalisationIdAndNomIgnoreCase(Long localisationId, String nom);

    boolean existsByLocalisationIdAndNomIgnoreCase(Long localisationId, String nom);

    @Query("SELECT DISTINCT q.nom FROM Quartier q ORDER BY q.nom ASC")
    List<String> findNomsDistincts();
}
