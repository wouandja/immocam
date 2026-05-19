package com.mbem.immocam.module.annonce.dto.request;

import com.mbem.immocam.shared.validation.TelephoneCameroun;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Requête de publication d'une annonce.
 *
 * L'annonce est publiée immédiatement après soumission (statut ACTIVE).
 * Pas de file d'attente de modération.
 *
 * Limite : 5 annonces actives max par propriétaire (configurable admin).
 *
 * @author MBEMNOVA
 */
@Data
public class PublierAnnonceRequest {

    @NotNull(message = "Le type de bien est obligatoire")
    private Long typeBienId;

    @NotNull(message = "La localisation est obligatoire")
    private Long localisationId;

    @NotBlank(message = "Le quartier est obligatoire")
    @Size(max = 100, message = "Le quartier ne doit pas dépasser 100 caractères")
    private String quartier;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 30, max = 1000,
          message = "La description doit contenir entre 30 et 1000 caractères")
    private String description;

    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "1000", message = "Le prix minimum est de 1 000 FCFA")
    private BigDecimal prix;

    /**
     * Numéro WhatsApp pour le contact.
     * Pré-rempli avec le numéro du compte, modifiable par le propriétaire.
     * JAMAIS exposé en clair dans l'API — intégré uniquement dans le lien wa.me.
     */
    @NotBlank(message = "Le numéro WhatsApp est obligatoire")
    @TelephoneCameroun
    private String numeroWhatsApp;
}
