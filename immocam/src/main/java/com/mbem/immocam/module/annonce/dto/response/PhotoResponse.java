package com.mbem.immocam.module.annonce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de réponse pour une photo d'annonce.
 * Le chemin de stockage interne n'est JAMAIS exposé — seulement l'URL publique.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoResponse {
    private Long id;
    private String url;
    private String urlThumb;   // ✅ AJOUTÉ — était absent
    private int ordre;
    private boolean principale; // ✅ RENOMMÉ — était "estPrincipale"
}
