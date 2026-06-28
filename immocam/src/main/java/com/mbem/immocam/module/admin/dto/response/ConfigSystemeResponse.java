package com.mbem.immocam.module.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Vue à plat des paramètres système, pour l'interface admin "Configuration".
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfigSystemeResponse {
    private int dureeVieAnnonce;
    private int joursRappelExpiration;
    private int joursSuppressionDefinitive;
    private int maxPhotosParAnnonce;
    private int maxAnnoncesParProprietaire;
    private String messageWhatsappDefaut;
}
