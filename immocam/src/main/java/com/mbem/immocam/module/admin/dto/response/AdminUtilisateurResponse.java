package com.mbem.immocam.module.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO utilisateur pour l'interface admin.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUtilisateurResponse {
    private Long id;
    private String prenom;
    private String nom;
    private String email;
    private String telephoneMasque;
    private String ville;
    private String role;
    private String statut;
    private LocalDateTime dateInscription;
    private LocalDateTime dernierLogin;
    private long nombreAnnoncesActives;
    private long nombreAnnoncesTotal;
}
