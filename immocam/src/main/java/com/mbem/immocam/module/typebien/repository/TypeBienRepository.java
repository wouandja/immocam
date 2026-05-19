package com.mbem.immocam.module.typebien.repository;

import com.mbem.immocam.module.typebien.entity.TypeBien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour les types de biens immobiliers.
 *
 * @author MBEMNOVA
 */
@Repository
public interface TypeBienRepository extends JpaRepository<TypeBien, Long> {

    /** Types actifs pour les formulaires et filtres. */
    List<TypeBien> findByEstActifTrueOrderByLibelleAsc();

    boolean existsByLibelle(String libelle);
}
