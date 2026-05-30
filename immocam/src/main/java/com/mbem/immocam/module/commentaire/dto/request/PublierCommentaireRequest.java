package com.mbem.immocam.module.commentaire.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Requête de publication d'un commentaire.
 * Connexion obligatoire. Publication immédiate sans modération.
 *
 * @author MBEMNOVA
 */
@Data
public class PublierCommentaireRequest {

    @NotBlank(message = "Le contenu est obligatoire")
    @Size(min = 1, max = 500,message = "Le commentaire doit contenir entre 1 et 500 caractères")
    private String contenu;
}
