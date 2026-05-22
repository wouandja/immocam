package com.mbem.immocam.module.auth.repository;

import com.mbem.immocam.module.auth.entity.CodeValidation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository pour les codes OTP de validation email.
 *
 * @author MBEMNOVA
 */
@Repository
public interface CodeValidationRepository extends JpaRepository<CodeValidation, Long> {

    /** Trouver le code valide le plus récent d'un utilisateur. */
    Optional<CodeValidation> findTopByUtilisateurIdAndTypeCodeAndEstUtiliseFalse(
            Long utilisateurId, String typeCode);

    /** Vérifier le code saisi par l'utilisateur. */
    Optional<CodeValidation> findByUtilisateurIdAndCodeAndTypeCodeAndEstUtiliseFalse(
            Long utilisateurId, String code, String typeCode);

    /** Compter les renvois de la dernière heure (anti-spam : max 3). */
    @Query("SELECT COUNT(c) FROM CodeValidation c " +
           "WHERE c.utilisateur.id = :userId " +
           "AND c.typeCode = :typeCode " +
           "AND c.dateCreation >= :depuis")
    int countRenvoisRecents(
            @Param("userId") Long utilisateurId,
            @Param("typeCode") String typeCode,
            @Param("depuis") LocalDateTime depuis);

    /**
     * Invalider tous les anciens codes d'un utilisateur.
     *
     * clearAutomatically = true  → vide le cache L1 Hibernate après le UPDATE bulk,
     *                              évite que les entités en mémoire restent stale.
     * flushAutomatically = true  → force le flush des changements pending avant
     *                              d'exécuter le UPDATE, garantit la cohérence.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE CodeValidation c SET c.estUtilise = true " +
           "WHERE c.utilisateur.id = :userId AND c.typeCode = :typeCode")
    void invaliderCodesExistants(
            @Param("userId") Long utilisateurId,
            @Param("typeCode") String typeCode);
}