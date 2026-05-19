package com.mbem.immocam.module.contact.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Requête d'enregistrement d'un clic sur le bouton WhatsApp.
 *
 * @author MBEMNOVA
 */
@Data
public class ContactRequest {

    @NotNull(message = "L'ID de l'annonce est obligatoire")
    private Long annonceId;
}
