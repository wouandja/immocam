package com.mbem.immocam.module.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO signalement pour l'interface admin.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSignalementResponse {
    private Long   id;
    private Long   annonceId;

    // Annonce
    private String     typeBienAnnonce;
    private String     villeAnnonce;
    private String     quartierAnnonce;
    private BigDecimal prixAnnonce;
    private String     statutAnnonce;
    private String     photoUrlAnnonce;
    private Long       proprietaireId;
    private String     proprietaireNom;
    private String     proprietaireEmail;
    private String     proprietaireTelephone; // masqué

    // Signalement
    private String        motif;
    private String        details;
    private String        statut;

    // Auteur du signalement
    private Long   auteurId;
    private String auteurEmail;
    private String auteurPrenom;
    private String auteurNom;
    private String auteurVille;
    private String auteurTelephone; // masqué

    private LocalDateTime dateSignalement;
}