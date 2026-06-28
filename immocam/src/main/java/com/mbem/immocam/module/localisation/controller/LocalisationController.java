package com.mbem.immocam.module.localisation.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.localisation.dto.request.AjouterQuartierRequest;
import com.mbem.immocam.module.localisation.dto.request.RenommerQuartierRequest;
import com.mbem.immocam.module.localisation.dto.request.VilleDto;
import com.mbem.immocam.module.localisation.entity.Quartier;
import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
import com.mbem.immocam.module.localisation.service.QuartierService;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.response.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints pour les villes et quartiers.
 * Les quartiers sont gérés dans un référentiel dédié (table quartiers),
 * synchronisé automatiquement à chaque publication/modification d'annonce.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/localisations")
@RequiredArgsConstructor
@Tag(name = "Localisation", description = "Villes et quartiers du Cameroun")
public class LocalisationController {

    private final LocalisationRepository localisationRepository;
    private final QuartierService        quartierService;
    private final UtilisateurRepository  utilisateurRepository;

    // ── Villes ────────────────────────────────────────────────────────────────

    @Operation(
        summary = "Liste des villes actives",
        description = "Retourne les villes camerounaises pré-chargées."
    )
    @GetMapping("/villes")
    public ResponseEntity<ApiResponse<List<String>>> getVilles() {
        return ResponseEntity.ok(
            ApiResponse.ok(localisationRepository.findVillesActives())
        );
    }

    // ── Quartiers (référentiel dédié) ───────────────────────────────────────

    @Operation(
        summary = "Quartiers du référentiel",
        description = """
            Retourne les quartiers connus, issus du référentiel (table quartiers).
            - Sans paramètre  → tous les quartiers, toutes villes confondues
            - ?ville=Douala   → quartiers de cette ville uniquement
            """
    )
    @GetMapping("/quartiers")
    public ResponseEntity<ApiResponse<List<String>>> getQuartiers(
            @RequestParam(required = false) String ville) {
        return ResponseEntity.ok(ApiResponse.ok(quartierService.lister(ville)));
    }

    @Operation(
        summary = "Ajouter un quartier au référentiel",
        description = "Authentifié — utilisé lorsqu'un utilisateur saisit un quartier inconnu " +
                       "en publiant une annonce, ou par un admin pour pré-charger une ville.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
    )
    @PostMapping("/quartiers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<com.mbem.immocam.module.localisation.dto.response.QuartierResponse>> ajouterQuartier(
            @Valid @RequestBody AjouterQuartierRequest request) {
        Quartier quartier = quartierService.ajouter(request.getVille(), request.getQuartier());
        var reponse = com.mbem.immocam.module.localisation.dto.response.QuartierResponse.builder()
                .id(quartier.getId()).nom(quartier.getNom()).ville(request.getVille()).build();
        return ResponseEntity.ok(ApiResponse.ok("Quartier ajouté.", reponse));
    }

    @Operation(
        summary = "Tous les quartiers du référentiel (gestion admin)",
        description = "ADMIN uniquement — liste complète avec id et ville, pour la page de configuration.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
    )
    @GetMapping("/quartiers/admin")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    public ResponseEntity<ApiResponse<List<com.mbem.immocam.module.localisation.dto.response.QuartierResponse>>> listerQuartiersAdmin() {
        return ResponseEntity.ok(ApiResponse.ok(quartierService.listerTousAvecVille()));
    }

    @Operation(
        summary = "Renommer un quartier (corrige l'orthographe partout)",
        description = "ADMIN uniquement — répercute le changement sur toutes les annonces concernées.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
    )
    @PatchMapping("/quartiers/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    public ResponseEntity<ApiResponse<Void>> renommerQuartier(
            @PathVariable Long id, @Valid @RequestBody RenommerQuartierRequest request) {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        Long adminId = utilisateurRepository.findByEmail(email).map(u -> u.getId())
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException(
                        "Administrateur non trouvé"));
        quartierService.renommer(id, request.getNom(), adminId);
        return ResponseEntity.ok(ApiResponse.message("Quartier renommé."));
    }


    @Operation(
    summary = "Liste des villes avec leurs IDs",
    description = "Retourne les villes actives avec leur ID — utilisé pour la création d'annonce."
)
@GetMapping("/villes-avec-id")
public ResponseEntity<ApiResponse<List<LocalisationRepository.VilleProjection>>> getVillesAvecId() {
    return ResponseEntity.ok(
        ApiResponse.ok(localisationRepository.findVillesActivesAvecId())
    );
}
}