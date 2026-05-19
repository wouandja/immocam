package com.mbem.immocam.module.auth.dto.request;

import com.mbem.immocam.shared.validation.TelephoneCameroun;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Requête d'inscription.
 *
 * La politique de confidentialité DOIT être acceptée (politiqueAcceptee = true)
 * sinon le bouton "Créer mon compte" reste désactivé côté Angular.
 * Validation aussi côté backend pour la sécurité.
 *
 * @author MBEMNOVA
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(min = 2, max = 50, message = "Le prénom doit contenir entre 2 et 50 caractères")
    private String prenom;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(min = 2, max = 50, message = "Le nom doit contenir entre 2 et 50 caractères")
    private String nom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le téléphone est obligatoire")
    @TelephoneCameroun
    private String telephone;

    @NotBlank(message = "La ville est obligatoire")
    private String ville;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String motDePasse;

    @NotBlank(message = "La confirmation du mot de passe est obligatoire")
    private String confirmationMotDePasse;

    /**
     * Doit être true pour que le compte soit créé.
     * Correspond au checkbox "J'accepte la politique de confidentialité".
     */
    @NotNull(message = "Vous devez accepter la politique de confidentialité")
    private Boolean politiqueAcceptee;
}
