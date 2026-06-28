package com.mbem.immocam.module.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO annonce pour l'interface admin (avec informations propriétaire).
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnnonceResponse {
    private Long id;
    private String typeBien;
    private String ville;
    private String quartier;
    private BigDecimal prix;
    private String statut;
    private int nombreVues;
    private long nombreContacts;
    private long nombreSignalements;
    private LocalDateTime datePublication;
    private LocalDateTime dateExpiration;
    private String photoPrincipale;
    private String photoPrincipaleThumb;
    /** true si l'annonce a été mise en pause par un admin (le propriétaire ne peut alors pas la réactiver lui-même). */
    private boolean misEnPauseParAdmin;
    // Infos propriétaire
    private Long proprietaireId;
    private String proprietaireNom;
    private String proprietaireEmail;
}
