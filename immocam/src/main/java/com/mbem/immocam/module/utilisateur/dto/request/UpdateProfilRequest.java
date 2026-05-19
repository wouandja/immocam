package com.mbem.immocam.module.utilisateur.dto.request;

import com.mbem.immocam.shared.validation.TelephoneCameroun;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Requête de mise à jour du profil utilisateur.
 * Tous les champs sont optionnels — seuls les non-null sont modifiés.
 *
 * @author MBEMNOVA
 */
@Data
public class UpdateProfilRequest {

    @Size(min = 2, max = 50, message = "Le prénom doit contenir entre 2 et 50 caractères")
    private String prenom;

    @Size(min = 2, max = 50, message = "Le nom doit contenir entre 2 et 50 caractères")
    private String nom;

    @TelephoneCameroun
    private String telephone;

    private String ville;
}
