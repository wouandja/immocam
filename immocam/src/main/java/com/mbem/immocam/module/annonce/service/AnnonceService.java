package com.mbem.immocam.module.annonce.service;

import com.mbem.immocam.module.annonce.dto.request.ModifierAnnonceRequest;
import com.mbem.immocam.module.annonce.dto.request.PublierAnnonceRequest;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDetailResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDashboardResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceListResponse;
import com.mbem.immocam.module.annonce.dto.response.DashboardStatsResponse;
import com.mbem.immocam.shared.pagination.PageResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service métier pour la gestion des annonces ImmoCam.
 *
 * @author MBEMNOVA
 */
public interface AnnonceService {

    /** Liste publique paginée avec filtres (visiteur et utilisateur connecté). */
    PageResponse<AnnonceListResponse> listerAnnonces(
            String ville, String quartier, Long typeBienId,
            java.math.BigDecimal prixMin, java.math.BigDecimal prixMax,
            Pageable pageable);

    /** Détail d'une annonce — incrémente le compteur de vues. */
    AnnonceDetailResponse obtenirDetail(Long id, Long utilisateurConnecteId);

    /** Publier une annonce (connexion obligatoire). */
    AnnonceDashboardResponse publier(PublierAnnonceRequest request, Long proprietaireId,
                                     String adresseIp);

    /** Modifier une annonce (propriétaire uniquement). */
    AnnonceDashboardResponse modifier(Long id, ModifierAnnonceRequest request, Long proprietaireId);

    /** Mettre en pause (propriétaire uniquement). */
    void mettreEnPause(Long id, Long proprietaireId);

    /** Réactiver depuis EN_PAUSE (propriétaire). */
    void reactiver(Long id, Long proprietaireId);

    /** Renouveler une annonce ACTIVE ou EXPIREE (propriétaire). */
    void renouveler(Long id, Long proprietaireId);

    /** Archiver définitivement (propriétaire). */
    void archiver(Long id, Long proprietaireId);

    /** Supprimer (propriétaire). */
    void supprimer(Long id, Long proprietaireId);

    DashboardStatsResponse getDashboardStats(Long proprietaireId);

    /** Dashboard propriétaire — ses propres annonces. */
    PageResponse<AnnonceDashboardResponse> mesAnnonces(Long proprietaireId, Pageable pageable);
}
