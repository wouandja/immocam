package com.mbem.immocam.module.signalement.controller;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.signalement.dto.request.SignalerAnnonceRequest;
import com.mbem.immocam.module.signalement.dto.response.SignalementResponse;
import com.mbem.immocam.module.signalement.service.SignalementService;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller des signalements d'annonces.
 * Connexion obligatoire pour signaler.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/annonces")
@RequiredArgsConstructor
@Tag(name = "Signalement", description = "Signalement d'annonces (auth requis)")
public class SignalementController {

    private final SignalementService signalementService;
    private final UtilisateurRepository utilisateurRepository;

    @Operation(summary = "Signaler une annonce",
               description = "Connexion obligatoire. Motif obligatoire. " +
                             "Si motif = AUTRE, préciser dans le champ details.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/{annonceId}/signaler")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SignalementResponse>> signaler(
            @PathVariable Long annonceId,
            @Valid @RequestBody SignalerAnnonceRequest request) {
        SignalementResponse response = signalementService.signaler(annonceId, getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                    "Votre signalement a été transmis à l'administration. Merci.", response));
    }

    private Long getId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email).map(u -> u.getId())
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception
                    .custom.RessourceNotFoundException("Utilisateur non trouvé"));
    }
}
