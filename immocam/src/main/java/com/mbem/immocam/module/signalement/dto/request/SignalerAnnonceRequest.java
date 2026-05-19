package com.mbem.immocam.module.signalement.dto.request;

import com.mbem.immocam.shared.enums.MotifSignalement;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Requête de signalement d'une annonce.
 * Si motif = AUTRE, le champ details est obligatoire.
 * Connexion obligatoire pour signaler.
 *
 * @author MBEMNOVA
 */
@Data
public class SignalerAnnonceRequest {

    @NotNull(message = "Le motif est obligatoire")
    private MotifSignalement motif;

    /** Obligatoire si motif = AUTRE. */
    private String details;
}
