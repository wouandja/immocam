package com.mbem.immocam.module.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Réponse de connexion/inscription réussie.
 * Contient les tokens JWT et les informations de base de l'utilisateur.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;

    /** Type de token — toujours "Bearer" */
    @Builder.Default
    private String tokenType = "Bearer";

    private Long userId;
    private String email;
    private String prenom;
    private String nom;

    /** UTILISATEUR ou ADMINISTRATEUR */
    private String role;
}
