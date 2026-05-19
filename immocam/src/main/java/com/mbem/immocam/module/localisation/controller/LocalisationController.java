package com.mbem.immocam.module.localisation.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.localisation.dto.request.VilleDto;
import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
import com.mbem.immocam.shared.response.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints publics pour les villes et quartiers.
 * Les quartiers sont extraits directement des annonces publiées.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/localisations")
@RequiredArgsConstructor
@Tag(name = "Localisation", description = "Villes et quartiers du Cameroun (public)")
public class LocalisationController {

    private final LocalisationRepository localisationRepository;
    private final AnnonceRepository      annonceRepository;

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

    // ── Quartiers (issus des annonces) ────────────────────────────────────────

    @Operation(
        summary = "Quartiers distincts depuis les annonces",
        description = """
            Retourne les quartiers uniques présents dans les annonces actives.
            - Sans paramètre  → tous les quartiers toutes villes confondues
            - ?ville=Douala   → quartiers des annonces de cette ville uniquement
            """
    )
    @GetMapping("/quartiers")
    public ResponseEntity<ApiResponse<List<String>>> getQuartiers(
            @RequestParam(required = false) String ville) {

        List<String> quartiers = (ville != null && !ville.isBlank())
            ? annonceRepository.findQuartiersByVille(ville)
            : annonceRepository.findQuartiersDistincts();

        return ResponseEntity.ok(ApiResponse.ok(quartiers));
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