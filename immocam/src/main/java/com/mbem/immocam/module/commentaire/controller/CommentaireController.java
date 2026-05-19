package com.mbem.immocam.module.commentaire.controller;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.commentaire.dto.request.PublierCommentaireRequest;
import com.mbem.immocam.module.commentaire.dto.response.CommentaireResponse;
import com.mbem.immocam.module.commentaire.service.CommentaireService;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.pagination.PageResponse;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller des commentaires sur les annonces.
 * Lecture publique — écriture/suppression nécessitent une connexion.
 *
 * @author MBEMNOVA
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Commentaires", description = "Commentaires sur les annonces (lecture publique)")
public class CommentaireController {

    private final CommentaireService commentaireService;
    private final UtilisateurRepository utilisateurRepository;

    @Operation(summary = "Liste des commentaires d'une annonce (public)")
    @GetMapping("/annonces/{annonceId}/commentaires")
    public ResponseEntity<ApiResponse<PageResponse<CommentaireResponse>>> lister(
            @PathVariable Long annonceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        PageResponse<CommentaireResponse> result = commentaireService.listerCommentaires(
            annonceId,
            PageRequest.of(page, taille, Sort.by(Sort.Direction.ASC, "dateCreation")));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "Poster un commentaire",
               description = "Connexion obligatoire. Publication immédiate.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/annonces/{annonceId}/commentaires")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentaireResponse>> publier(
            @PathVariable Long annonceId,
            @Valid @RequestBody PublierCommentaireRequest request) {
        CommentaireResponse c = commentaireService.publier(annonceId, getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Commentaire publié.", c));
    }

    @Operation(summary = "Répondre à un commentaire (propriétaire uniquement)",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/commentaires/{commentaireId}/repondre")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentaireResponse>> repondre(
            @PathVariable Long commentaireId,
            @Valid @RequestBody PublierCommentaireRequest request) {
        CommentaireResponse reponse = commentaireService.repondre(commentaireId, getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Réponse publiée.", reponse));
    }

    @Operation(summary = "Supprimer un commentaire",
               description = "Auteur ou propriétaire de l'annonce peuvent supprimer.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/commentaires/{commentaireId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> supprimer(@PathVariable Long commentaireId) {
        commentaireService.supprimer(commentaireId, getId());
        return ResponseEntity.ok(ApiResponse.message("Commentaire supprimé."));
    }

    private Long getId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email).map(u -> u.getId())
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception
                    .custom.RessourceNotFoundException("Utilisateur non trouvé"));
    }
}
