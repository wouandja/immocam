package com.mbem.immocam.module.localisation.service;

import com.mbem.immocam.module.localisation.dto.response.QuartierResponse;
import com.mbem.immocam.module.localisation.entity.Quartier;

import java.util.List;

public interface QuartierService {

    /** Quartiers d'une ville (triés), ou tous les quartiers distincts si ville vide/nulle. */
    List<String> lister(String ville);

    /** Tous les quartiers du référentiel, avec id et ville — pour la gestion admin. */
    List<QuartierResponse> listerTousAvecVille();

    /** Crée le quartier s'il n'existe pas déjà (insensible à la casse) ; idempotent. */
    Quartier ajouter(String ville, String nom);

    /** Garantit l'existence du quartier au catalogue — appelé à chaque publication/modification d'annonce. */
    void assurerExistance(Long localisationId, String nom);

    /** Renomme un quartier et répercute le changement sur toutes les annonces concernées. ADMIN uniquement. */
    void renommer(Long quartierId, String nouveauNom, Long adminId);
}
