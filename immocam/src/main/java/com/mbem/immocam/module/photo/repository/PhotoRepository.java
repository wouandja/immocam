package com.mbem.immocam.module.photo.repository;

import com.mbem.immocam.module.annonce.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour les photos d'annonces.
 *
 * @author MBEMNOVA
 */
@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {

    List<Photo> findByAnnonceIdOrderByOrdreAsc(Long annonceId);

    long countByAnnonceId(Long annonceId);

    Optional<Photo> findFirstByAnnonceIdAndPrincipaleTrue(Long annonceId);

    void deleteByAnnonceId(Long annonceId);

    /** Trouver le prochain ordre disponible pour une annonce. */
    @Query("SELECT COALESCE(MAX(p.ordre), 0) FROM Photo p WHERE p.annonce.id = :annonceId")
    int findMaxOrdreByAnnonceId(@Param("annonceId") Long annonceId);
}
