package com.mbem.immocam.module.annonce.controller;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.annonce.dto.request.ModifierAnnonceRequest;
import com.mbem.immocam.module.annonce.dto.request.PublierAnnonceRequest;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDetailResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDashboardResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceListResponse;
import com.mbem.immocam.module.annonce.dto.response.DashboardStatsResponse;
import com.mbem.immocam.module.annonce.service.AnnonceService;
import com.mbem.immocam.module.photo.service.PhotoService;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.pagination.PageResponse;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

/**
 * Controller des annonces immobilières ImmoCam.
 *
 * Règles d'accès :
 *   GET /annonces et GET /annonces/{id}  → PUBLIC (visiteur non connecté)
 *   Toutes les autres actions            → AUTHENTIFIÉ
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/annonces")
@RequiredArgsConstructor
@Tag(name = "Annonces", description = "Gestion des annonces immobilières")
public class AnnonceController {

    private final AnnonceService annonceService;
    private final PhotoService photoService;
    private final UtilisateurRepository utilisateurRepository;

    @Operation(summary = "Liste des annonces",
               description = "Retourne les annonces actives paginées. " +
                             "Scroll infini 12 annonces par page. Tous filtres optionnels.")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AnnonceListResponse>>> lister(
            @RequestParam(required = false) String ville,
            @RequestParam(required = false) String quartier,
            @RequestParam(required = false) Long typeBienId,
            @RequestParam(required = false) BigDecimal prixMin,
            @RequestParam(required = false) BigDecimal prixMax,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int taille) {

        Pageable pageable = PageRequest.of(page, taille,
            Sort.by(Sort.Direction.DESC, "dateCreation"));
        PageResponse<AnnonceListResponse> result =
            annonceService.listerAnnonces(ville, quartier, typeBienId, prixMin, prixMax, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "Détail d'une annonce",
               description = "Retourne le détail complet. Incrémente le compteur de vues. " +
                             "Le lien WhatsApp est inclus uniquement si l'utilisateur est connecté.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnonceDetailResponse>> detail(@PathVariable Long id) {
        Long utilisateurId = null;
        if (SecurityUtils.estAuthentifie()) {
            try {
                String email = SecurityUtils.getEmailUtilisateurCourant();
                utilisateurId = utilisateurRepository.findByEmail(email)
                    .map(u -> u.getId()).orElse(null);
            } catch (Exception ignored) {}
        }
        AnnonceDetailResponse detail = annonceService.obtenirDetail(id, utilisateurId);
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    @Operation(summary = "Publier une annonce",
               description = "Publication directe sans modération. " +
                             "Limite : 5 annonces actives par propriétaire.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AnnonceDashboardResponse>> publier(
            @Valid @RequestBody PublierAnnonceRequest request,
            HttpServletRequest httpRequest) {
        Long proprietaireId = obtenirUtilisateurCourantId();
        AnnonceDashboardResponse result =
            annonceService.publier(request, proprietaireId, httpRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Annonce publiée avec succès.", result));
    }

    @Operation(summary = "Publier une annonce avec photos",
               description = "Permet de créer une annonce et d'uploader jusqu'à 4 photos dans le même appel.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping(path = "/avec-photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AnnonceDashboardResponse>> publierAvecPhotos(
            @Valid @ModelAttribute PublierAnnonceRequest request,
            @RequestParam(name = "photos", required = false) MultipartFile[] photos,
            HttpServletRequest httpRequest) {
        Long proprietaireId = obtenirUtilisateurCourantId();
        AnnonceDashboardResponse result =
            annonceService.publier(request, proprietaireId, httpRequest.getRemoteAddr());

        if (photos != null) {
            for (MultipartFile photo : photos) {
                if (photo != null && !photo.isEmpty()) {
                    photoService.uploadPhoto(result.getId(), photo, proprietaireId);
                }
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Annonce publiée avec photos.", result));
    }

    @Operation(summary = "Modifier une annonce",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AnnonceDashboardResponse>> modifier(
            @PathVariable Long id,
            @Valid @RequestBody ModifierAnnonceRequest request) {
        Long proprietaireId = obtenirUtilisateurCourantId();
        AnnonceDashboardResponse result = annonceService.modifier(id, request, proprietaireId);
        return ResponseEntity.ok(ApiResponse.ok("Annonce modifiée.", result));
    }

    @Operation(summary = "Mettre en pause",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{id}/pause")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> mettreEnPause(@PathVariable Long id) {
        annonceService.mettreEnPause(id, obtenirUtilisateurCourantId());
        return ResponseEntity.ok(ApiResponse.message("Annonce mise en pause."));
    }

    @Operation(summary = "Réactiver une annonce en pause",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{id}/reactiver")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> reactiver(@PathVariable Long id) {
        annonceService.reactiver(id, obtenirUtilisateurCourantId());
        return ResponseEntity.ok(ApiResponse.message("Annonce réactivée."));
    }

    @Operation(summary = "Renouveler une annonce (ACTIVE ou EXPIRÉE)",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{id}/renouveler")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> renouveler(@PathVariable Long id) {
        annonceService.renouveler(id, obtenirUtilisateurCourantId());
        return ResponseEntity.ok(ApiResponse.message(
            "Annonce renouvelée pour 30 jours supplémentaires."));
    }

    @Operation(summary = "Archiver une annonce",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{id}/archiver")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> archiver(@PathVariable Long id) {
        annonceService.archiver(id, obtenirUtilisateurCourantId());
        return ResponseEntity.ok(ApiResponse.message("Annonce archivée définitivement."));
    }

    @Operation(summary = "Supprimer une annonce",
               security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> supprimer(@PathVariable Long id) {
        annonceService.supprimer(id, obtenirUtilisateurCourantId());
        return ResponseEntity.ok(ApiResponse.message("Annonce supprimée."));
    }

    @Operation(summary = "Mes annonces (dashboard propriétaire)",
               description = "Retourne toutes les annonces du propriétaire connecté.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/mes-annonces")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<AnnonceDashboardResponse>>> mesAnnonces(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int taille) {
        Long proprietaireId = obtenirUtilisateurCourantId();
        Pageable pageable = PageRequest.of(page, taille,
            Sort.by(Sort.Direction.DESC, "dateCreation"));
        PageResponse<AnnonceDashboardResponse> result =
            annonceService.mesAnnonces(proprietaireId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** Récupère l'ID de l'utilisateur courant depuis le SecurityContext. */
    private Long obtenirUtilisateurCourantId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception
                    .custom.RessourceNotFoundException("Utilisateur non trouvé"));
    }



    @Operation(summary = "Statistiques du dashboard", 
           security = @SecurityRequirement(name = "bearerAuth"))
@GetMapping("/dashboard-stats")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
    Long proprietaireId = obtenirUtilisateurCourantId();
    DashboardStatsResponse stats = annonceService.getDashboardStats(proprietaireId);
    return ResponseEntity.ok(ApiResponse.ok(stats));
}
}
