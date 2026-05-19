package com.mbem.immocam.module.favori.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO de réponse pour un favori.
 * Affiche le statut actuel de l'annonce pour le badge dans la liste.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriResponse {
    private Long favoriId;
    private Long annonceId;
    private String typeBien;
    private String ville;
    private String quartier;
    private BigDecimal prix;
    /** ACTIVE, EN_PAUSE, EXPIREE, SUPPRIMEE… */
    private String statutAnnonce;
    private String photoUrl;
    private LocalDateTime dateAjout;
}
