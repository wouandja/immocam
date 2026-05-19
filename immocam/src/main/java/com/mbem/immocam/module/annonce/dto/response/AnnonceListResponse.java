package com.mbem.immocam.module.annonce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO de réponse pour la liste des annonces (cartes page d'accueil).
 * Contient uniquement les informations affichées sur les cartes.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceListResponse {
    private Long id;
    private String typeBien;
    private String ville;
    private String quartier;
    private BigDecimal prix;
    private String prixFormate;          // ✅ AJOUTÉ  ex: "150 000 FCFA"
    private String statut;
    private String photoPrincipale;      // ✅ RENOMMÉ — était "photoUrl"
    private String photoPrincipaleThumb; // ✅ AJOUTÉ
    private boolean hasPhotos;           // ✅ AJOUTÉ
    private int nombreVues;
    private int nombreCommentaires;      // ✅ AJOUTÉ
    private LocalDateTime datePublication;
    private LocalDateTime dateExpiration;// ✅ AJOUTÉ
    private Boolean isFavori;            // ✅ AJOUTÉ — null si non connecté
}
