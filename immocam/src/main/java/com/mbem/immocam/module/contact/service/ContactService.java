package com.mbem.immocam.module.contact.service;

import com.mbem.immocam.module.contact.dto.response.ContactListResponse;
import com.mbem.immocam.module.contact.dto.response.ContactResponse;
import com.mbem.immocam.shared.pagination.PageResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service de gestion des contacts WhatsApp.
 *
 * @author MBEMNOVA
 */
public interface ContactService {

    /**
     * Enregistre le clic et retourne le lien wa.me.
     * Le numéro du propriétaire n'est JAMAIS retourné en clair.
     */
    ContactResponse contacter(Long utilisateurId, Long annonceId, String adresseIp);

    /** Liste des contacts d'une annonce (dashboard propriétaire). */
    PageResponse<ContactListResponse> listeContacts(Long annonceId, Long proprietaireId,
                                                     Pageable pageable);

    /** Nombre de contacts pour une annonce. */
    long compterContacts(Long annonceId);

    PageResponse<ContactListResponse> mesContacts(Long utilisateurId, Pageable pageable);
}
