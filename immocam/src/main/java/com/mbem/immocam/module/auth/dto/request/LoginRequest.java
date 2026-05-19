package com.mbem.immocam.module.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Requête de connexion.
 *
 * Après 5 tentatives échouées en 15 min : compte bloqué 30 min.
 *
 * @author MBEMNOVA
 */
@Data
public class LoginRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String motDePasse;
}
