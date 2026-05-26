package com.mbem.immocam.module.utilisateur.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ModifierMotDePasseRequest {

    @NotBlank(message = "Le mot de passe actuel est requis.")
    private String ancienMotDePasse;

    @NotBlank(message = "Le nouveau mot de passe est requis.")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères.")
    private String nouveauMotDePasse;

    @NotBlank(message = "La confirmation est requise.")
    private String confirmationMotDePasse;
}