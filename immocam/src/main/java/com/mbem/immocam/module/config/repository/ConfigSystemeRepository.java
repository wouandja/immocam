package com.mbem.immocam.module.config.repository;

import com.mbem.immocam.module.config.entity.ConfigSysteme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour la configuration système.
 *
 * Permet à l'admin de modifier les paramètres sans redéploiement.
 *
 * @author MBEMNOVA
 */
@Repository
public interface ConfigSystemeRepository extends JpaRepository<ConfigSysteme, Long> {

    Optional<ConfigSysteme> findByCle(String cle);

    boolean existsByCle(String cle);
}
