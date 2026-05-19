package com.mbem.immocam.module.favori.service;

import com.mbem.immocam.module.favori.dto.response.FavoriResponse;
import com.mbem.immocam.shared.pagination.PageResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service de gestion des favoris.
 *
 * @author MBEMNOVA
 */
public interface FavoriService {

    PageResponse<FavoriResponse> mesFavoris(Long utilisateurId, Pageable pageable);

    FavoriResponse ajouter(Long utilisateurId, Long annonceId);

    void retirer(Long utilisateurId, Long annonceId);

    boolean estEnFavori(Long utilisateurId, Long annonceId);
}
