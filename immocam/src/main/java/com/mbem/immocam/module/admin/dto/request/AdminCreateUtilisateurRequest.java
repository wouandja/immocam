package com.mbem.immocam.module.admin.dto.request;

import com.mbem.immocam.shared.enums.RoleUtilisateur;
import com.mbem.immocam.shared.validation.TelephoneCameroun;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCreateUtilisateurRequest {

    @NotBlank(message = "Le prenom est obligatoire")
    @Size(min = 2, max = 50, message = "Le prenom doit contenir entre 2 et 50 caracteres")
    private String prenom;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(min = 2, max = 50, message = "Le nom doit contenir entre 2 et 50 caracteres")
    private String nom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le telephone est obligatoire")
    @TelephoneCameroun
    private String telephone;

    @NotBlank(message = "La ville est obligatoire")
    private String ville;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caracteres")
    private String motDePasse;

    @NotNull(message = "Le role est obligatoire")
    private RoleUtilisateur role;
}
