package com.mbem.immocam.module.utilisateur.service;

import com.mbem.immocam.module.utilisateur.dto.request.UpdateProfilRequest;
import com.mbem.immocam.module.utilisateur.dto.response.ProfilResponse;

/**
 * Service de gestion du profil utilisateur.
 *
 * @author MBEMNOVA
 */
public interface UtilisateurService {

    ProfilResponse obtenirProfil(Long utilisateurId);

    ProfilResponse mettreAJourProfil(Long utilisateurId, UpdateProfilRequest request);

    /**
     * Suppression du compte avec anonymisation des données (RGPD).
     * - Annonces actives désactivées immédiatement
     * - Commentaires conservés avec auteur "Utilisateur supprimé"
     * - Données personnelles anonymisées sous 30 jours
     */
    void supprimerCompte(Long utilisateurId);
}
