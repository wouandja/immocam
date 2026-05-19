package com.mbem.immocam.module.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Requête de renvoi du code OTP.
 * Maximum 3 renvois par heure (anti-spam).
 *
 * @author MBEMNOVA
 */
@Data
public class ResendCodeRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    /** EMAIL_VALIDATION ou REINITIALISATION_MDP */
    @NotBlank(message = "Le type de code est obligatoire")
    private String typeCode;
}
