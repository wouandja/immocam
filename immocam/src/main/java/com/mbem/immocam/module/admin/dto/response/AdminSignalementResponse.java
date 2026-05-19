package com.mbem.immocam.module.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private Long id;
    private Long annonceId;
    private String typeBienAnnonce;
    private String villeAnnonce;
    private String motif;
    private String details;
    private String statut;
    private String auteurEmail;
    private LocalDateTime dateSignalement;
}
