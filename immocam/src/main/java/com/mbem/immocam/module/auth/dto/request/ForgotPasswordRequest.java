package com.mbem.immocam.module.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Requête de mot de passe oublié.
 * Envoie un lien de réinitialisation valable 30 minutes.
 *
 * @author MBEMNOVA
 */
@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;
}
