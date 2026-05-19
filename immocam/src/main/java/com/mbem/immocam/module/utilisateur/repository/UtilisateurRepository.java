package com.mbem.immocam.module.utilisateur.repository;

import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.enums.StatutCompte;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour les opérations sur les utilisateurs.
 *
 * @author MBEMNOVA
 */
@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByTelephone(String telephone);

    /** Recherche admin : par email, nom ou prénom */
    @Query("SELECT u FROM Utilisateur u WHERE " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :terme, '%')) OR " +
           "LOWER(u.nom) LIKE LOWER(CONCAT('%', :terme, '%')) OR " +
           "LOWER(u.prenom) LIKE LOWER(CONCAT('%', :terme, '%')) OR " +
           "u.telephone LIKE CONCAT('%', :terme, '%')")
    Page<Utilisateur> rechercherAdmin(@Param("terme") String terme, Pageable pageable);

    /** Compter par statut (dashboard admin). */
    long countByStatut(StatutCompte statut);

    /** Compter les nouveaux inscrits depuis une date (statistiques). */
    @Query("SELECT COUNT(u) FROM Utilisateur u WHERE u.dateCreation >= :depuis")
    long countNouveauxDepuis(@Param("depuis") java.time.LocalDateTime depuis);
}
