package com.mbem.immocam.module.utilisateur.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de réponse pour le profil utilisateur.
 * Le mot de passe et les données sensibles ne sont jamais inclus.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfilResponse {
    private Long id;
    private String prenom;
    private String nom;
    private String email;
    /** Numéro masqué : "+237 *** **** 567" */
    private String telephoneMasque;
    private String telephone;
    private String ville;
    private String role;
    private String statut;
    private LocalDateTime dateInscription;
    private LocalDateTime dernierLogin;
    private long nombreAnnoncesActives;
}
