package com.mbem.immocam.module.photo.controller;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.annonce.dto.response.PhotoResponse;
import com.mbem.immocam.module.photo.service.PhotoService;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller de gestion des photos d'annonces.
 *
 * Stockage local VPS — compression automatique Thumbnailator.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/annonces/{annonceId}/photos")
@RequiredArgsConstructor
@Tag(name = "Photos", description = "Upload et suppression des photos d'annonces (stockage VPS)")
public class PhotoController {

    private final PhotoService photoService;
    private final UtilisateurRepository utilisateurRepository;

    @Operation(summary = "Uploader une photo",
               description = "Max 4 photos par annonce. Formats : JPG, PNG, WebP. " +
                             "Taille max : 4 Mo. Compression automatique JPEG 80%.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PhotoResponse>> uploadPhoto(
            @PathVariable Long annonceId,
            @RequestParam("fichier") MultipartFile fichier) {
        Long proprietaireId = obtenirProprietaireId();
        PhotoResponse photo = photoService.uploadPhoto(annonceId, fichier, proprietaireId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Photo uploadée avec succès.", photo));
    }

    @Operation(summary = "Supprimer une photo",
               security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{photoId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> supprimerPhoto(
            @PathVariable Long annonceId,
            @PathVariable Long photoId) {
        Long proprietaireId = obtenirProprietaireId();
        photoService.supprimerPhoto(annonceId, photoId, proprietaireId);
        return ResponseEntity.ok(ApiResponse.message("Photo supprimée."));
    }

    private Long obtenirProprietaireId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception
                    .custom.RessourceNotFoundException("Utilisateur non trouvé"));
    }
}
