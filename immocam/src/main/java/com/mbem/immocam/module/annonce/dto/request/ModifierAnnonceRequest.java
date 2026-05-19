package com.mbem.immocam.module.annonce.dto.request;

import com.mbem.immocam.shared.validation.TelephoneCameroun;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Requête de modification d'une annonce existante.
 * Tous les champs sont optionnels — seuls les champs non-null sont mis à jour.
 *
 * @author MBEMNOVA
 */
@Data
public class ModifierAnnonceRequest {

    private Long typeBienId;
    private Long localisationId;
    @Size(max = 100, message = "Le quartier ne doit pas dépasser 100 caractères")
    private String quartier;

    @Size(min = 30, max = 1000,
          message = "La description doit contenir entre 30 et 1000 caractères")
    private String description;

    @DecimalMin(value = "1000", message = "Le prix minimum est de 1 000 FCFA")
    private BigDecimal prix;

    @TelephoneCameroun
    private String numeroWhatsApp;
}
