package com.mbem.immocam.module.commentaire.service;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.commentaire.dto.request.PublierCommentaireRequest;
import com.mbem.immocam.module.commentaire.dto.response.CommentaireResponse;
import com.mbem.immocam.module.commentaire.entity.Commentaire;
import com.mbem.immocam.module.commentaire.repository.CommentaireRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.enums.TypeAction;
import com.mbem.immocam.shared.pagination.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implémentation du service commentaires.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CommentaireServiceImpl implements CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final LogActiviteService logActiviteService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommentaireResponse> listerCommentaires(Long annonceId, Pageable pageable) {
        Page<Commentaire> page = commentaireRepository.findByAnnonceId(annonceId, pageable);
        Page<CommentaireResponse> dtoPage = page.map(this::toResponse);
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional
    public CommentaireResponse publier(Long annonceId, Long auteurId,
                                       PublierCommentaireRequest request) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .filter(a -> !a.isDeleted() && StatutAnnonce.ACTIVE.equals(a.getStatut()))
                .orElseThrow(() -> new RessourceNotFoundException(
                    "Annonce introuvable ou inactive."));
        Utilisateur auteur = utilisateurRepository.findById(auteurId)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", auteurId));

        Commentaire c = Commentaire.builder()
                .contenu(request.getContenu())
                .auteur(auteur)
                .annonce(annonce)
                .build();
        commentaireRepository.save(c);
        logActiviteService.log(auteurId, TypeAction.COMMENTAIRE_PUBLIE, "Annonce", annonceId, null, null);
        return toResponse(c);
    }

    @Override
    @Transactional
    public CommentaireResponse repondre(Long parentId, Long proprietaireId,
                                        PublierCommentaireRequest request) {
        Commentaire parent = commentaireRepository.findById(parentId)
                .orElseThrow(() -> new RessourceNotFoundException("Commentaire", parentId));
        // Seul le propriétaire de l'annonce peut répondre
        if (!parent.getAnnonce().getProprietaire().getId().equals(proprietaireId)) {
            throw new AccesRefuseException(
                "Seul le propriétaire de l'annonce peut répondre aux commentaires.");
        }
        Utilisateur proprio = utilisateurRepository.findById(proprietaireId)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", proprietaireId));

        Commentaire reponse = Commentaire.builder()
                .contenu(request.getContenu())
                .auteur(proprio)
                .annonce(parent.getAnnonce())
                .reponse(parent)
                .build();
        commentaireRepository.save(reponse);
        logActiviteService.log(proprietaireId, TypeAction.REPONSE_COMMENTAIRE, "Commentaire", parentId, null, null);
        return toResponse(reponse);
    }

    @Override
    @Transactional
    public void supprimer(Long commentaireId, Long utilisateurId) {
        Commentaire c = commentaireRepository.findById(commentaireId)
                .orElseThrow(() -> new RessourceNotFoundException("Commentaire", commentaireId));
        boolean estAuteur   = c.getAuteur().getId().equals(utilisateurId);
        boolean estProprio  = c.getAnnonce().getProprietaire().getId().equals(utilisateurId);
        if (!estAuteur && !estProprio) {
            throw new AccesRefuseException("Vous n'êtes pas autorisé à supprimer ce commentaire.");
        }
        c.setEstSupprime(true);
        c.setContenu(ImmoCamConstants.COMMENTAIRE_SUPPRIME_TEXT);
        logActiviteService.log(utilisateurId, TypeAction.SUPPRESSION_COMMENTAIRE, "Commentaire", commentaireId, null, null);
    }

    private CommentaireResponse toResponse(Commentaire c) {

        CommentaireResponse.ReponseCommentaireResponse reponseDto = null;

        if (c.getReponses() != null && !c.getReponses().isEmpty()) {

            Commentaire rep = c.getReponses().get(0);

            if (!rep.isEstSupprime()) {
                reponseDto = CommentaireResponse.ReponseCommentaireResponse.builder()
                        .id(rep.getId())
                        .contenu(rep.getContenu())
                        .dateCreation(rep.getDateCreation())
                        .build();
            }
        }

        return CommentaireResponse.builder()
                .id(c.getId())
                .auteurPrenom(c.getAuteur().getPrenom())
                .contenu(
                        c.isEstSupprime()
                                ? ImmoCamConstants.COMMENTAIRE_SUPPRIME_TEXT
                                : c.getContenu()
                )
                .dateCreation(c.getDateCreation())
                .estProprietaire(
                        c.getAnnonce().getProprietaire().getId()
                                .equals(c.getAuteur().getId())
                )
                .estMien(false)
                .reponse(reponseDto)
                .build();
    }

}
