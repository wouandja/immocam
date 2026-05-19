package com.mbem.immocam.module.commentaire.service;

import com.mbem.immocam.module.commentaire.dto.request.PublierCommentaireRequest;
import com.mbem.immocam.module.commentaire.dto.response.CommentaireResponse;
import com.mbem.immocam.shared.pagination.PageResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service de gestion des commentaires sur les annonces.
 *
 * @author MBEMNOVA
 */
public interface CommentaireService {

    PageResponse<CommentaireResponse> listerCommentaires(Long annonceId, Pageable pageable);

    CommentaireResponse publier(Long annonceId, Long auteurId,
                                PublierCommentaireRequest request);

    CommentaireResponse repondre(Long commentaireParentId, Long proprietaireId,
                                 PublierCommentaireRequest request);

    void supprimer(Long commentaireId, Long utilisateurId);
}
