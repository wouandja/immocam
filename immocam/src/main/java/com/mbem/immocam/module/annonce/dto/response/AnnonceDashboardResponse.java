package com.mbem.immocam.module.annonce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO pour le tableau de bord du propriétaire.
 * Inclut les statistiques contacts et le statut détaillé.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceDashboardResponse {
    private Long id;
    private String typeBien;
    private String ville;
    private String quartier;
    private BigDecimal prix;
    private String statut;
    private int nombreVues;
    private long nombreContacts;
    private long nombreCommentaires;
    private String photoUrl;
    private LocalDateTime datePublication;
    private LocalDateTime dateExpiration;
    private String dateExpirationFormatee;
    private String prixFormate;
}
