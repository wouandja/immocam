package com.mbem.immocam.module.contact.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Réponse au clic WhatsApp — contient le lien wa.me.
 * Le numéro du propriétaire est intégré dans le lien, jamais exposé en clair.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {
    /**
     * Lien wa.me avec numéro et message pré-rempli.
     * Ex : "https://wa.me/237691234567?text=Bonjour..."
     * Le numéro propriétaire n'est pas lisible par l'utilisateur.
     */
    private String lienWhatsApp;
}
