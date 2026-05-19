package com.mbem.immocam.module.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Requête de validation du code OTP reçu par email.
 * Code valable 10 minutes, max 3 renvois par heure.
 *
 * @author MBEMNOVA
 */
@Data
public class VerifyEmailRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le code est obligatoire")
    @Size(min = 6, max = 6, message = "Le code doit contenir exactement 6 chiffres")
    private String code;
}
