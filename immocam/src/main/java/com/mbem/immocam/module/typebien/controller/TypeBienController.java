package com.mbem.immocam.module.typebien.controller;

import com.mbem.immocam.module.typebien.entity.TypeBien;
import com.mbem.immocam.module.typebien.repository.TypeBienRepository;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoints publics pour les types de biens immobiliers.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/types-biens")
@RequiredArgsConstructor
@Tag(name = "Types de biens", description = "Types de biens immobiliers (public)")
public class TypeBienController {

    private final TypeBienRepository typeBienRepository;

    @Operation(summary = "Liste des types de biens actifs",
               description = "Retourne les 8 types initiaux et ceux ajoutés par l'admin.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<TypeBien>>> getTypesBiens() {
        List<TypeBien> types = typeBienRepository.findByEstActifTrueOrderByLibelleAsc();
        return ResponseEntity.ok(ApiResponse.ok(types));
    }
}
