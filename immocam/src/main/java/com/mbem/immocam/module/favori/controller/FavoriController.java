package com.mbem.immocam.module.favori.controller;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.favori.dto.response.FavoriResponse;
import com.mbem.immocam.module.favori.service.FavoriService;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.pagination.PageResponse;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller des favoris utilisateur.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/favoris")
@RequiredArgsConstructor
@Tag(name = "Favoris", description = "Gestion des annonces favorites (auth requis)")
public class FavoriController {

    private final FavoriService favoriService;
    private final UtilisateurRepository utilisateurRepository;

    @Operation(summary = "Mes favoris (du plus récent au plus ancien)",
               security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<FavoriResponse>>> mesFavoris(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        PageResponse<FavoriResponse> result =
            favoriService.mesFavoris(getId(), PageRequest.of(page, taille));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "Ajouter aux favoris",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/{annonceId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FavoriResponse>> ajouter(@PathVariable Long annonceId) {
        FavoriResponse favori = favoriService.ajouter(getId(), annonceId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Annonce ajoutée aux favoris.", favori));
    }

    @Operation(summary = "Retirer des favoris",
               security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{annonceId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> retirer(@PathVariable Long annonceId) {
        favoriService.retirer(getId(), annonceId);
        return ResponseEntity.ok(ApiResponse.message("Annonce retirée des favoris."));
    }

    private Long getId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email).map(u -> u.getId())
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception
                    .custom.RessourceNotFoundException("Utilisateur non trouvé"));
    }
}
