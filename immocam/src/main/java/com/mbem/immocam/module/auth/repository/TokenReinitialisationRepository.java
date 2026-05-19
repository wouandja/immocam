package com.mbem.immocam.module.auth.repository;

import com.mbem.immocam.module.auth.entity.TokenReinitialisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour les tokens de réinitialisation de mot de passe.
 *
 * @author MBEMNOVA
 */
@Repository
public interface TokenReinitialisationRepository extends JpaRepository<TokenReinitialisation, Long> {

    Optional<TokenReinitialisation> findByTokenAndEstUtiliseFalse(String token);

    /** Invalider tous les anciens tokens d'un utilisateur avant d'en créer un nouveau. */
    @Modifying
    @Query("UPDATE TokenReinitialisation t SET t.estUtilise = true " +
           "WHERE t.utilisateur.id = :userId")
    void invaliderTokensExistants(@Param("userId") Long utilisateurId);
}
