package com.mbem.immocam.module.utilisateur.controller;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.utilisateur.dto.request.ModifierMotDePasseRequest;
import com.mbem.immocam.module.utilisateur.dto.request.UpdateProfilRequest;
import com.mbem.immocam.module.utilisateur.dto.response.ProfilResponse;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.module.utilisateur.service.UtilisateurService;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller pour la gestion du profil utilisateur.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/utilisateurs")
@RequiredArgsConstructor
@Tag(name = "Utilisateur", description = "Gestion du profil et du compte")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;
    private final UtilisateurRepository utilisateurRepository;

    @Operation(summary = "Mon profil",
               security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/profil")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProfilResponse>> monProfil() {
        ProfilResponse profil = utilisateurService.obtenirProfil(getId());
        return ResponseEntity.ok(ApiResponse.ok(profil));
    }

    @Operation(summary = "Mettre à jour mon profil",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/profil")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProfilResponse>> mettreAJour(
            @Valid @RequestBody UpdateProfilRequest request) {
        ProfilResponse profil = utilisateurService.mettreAJourProfil(getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Profil mis à jour.", profil));
    }

    @Operation(summary = "Supprimer mon compte",
               description = "Anonymise les données et désactive toutes les annonces actives.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/compte")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> supprimerCompte() {
        utilisateurService.supprimerCompte(getId());
        return ResponseEntity.ok(ApiResponse.message(
            "Votre compte a été supprimé. Vos données seront anonymisées sous 30 jours."));
    }

    private Long getId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception
                    .custom.RessourceNotFoundException("Utilisateur non trouvé"));
    }




 

// Ajouter dans la classe
@Operation(summary = "Changer mon mot de passe",
           security = @SecurityRequirement(name = "bearerAuth"))
@PutMapping("/profil/password")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ApiResponse<Void>> modifierMotDePasse(
        @Valid @RequestBody ModifierMotDePasseRequest request) {
    utilisateurService.modifierMotDePasse(getId(), request);
    return ResponseEntity.ok(ApiResponse.message("Mot de passe modifié avec succès."));
}
}
