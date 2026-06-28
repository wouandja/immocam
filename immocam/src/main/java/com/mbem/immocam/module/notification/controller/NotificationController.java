package com.mbem.immocam.module.notification.controller;

import com.mbem.immocam.module.notification.dto.response.NotificationResponse;
import com.mbem.immocam.module.notification.service.NotificationService;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import com.mbem.immocam.shared.pagination.PageResponse;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Notifications admin (signalements, nouvelles inscriptions, ...).
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/admin/notifications")
@PreAuthorize("hasAuthority('ADMINISTRATEUR')")
@RequiredArgsConstructor
@Tag(name = "Notifications admin")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "Liste des notifications admin")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> lister(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        int safeTaille = Math.min(Math.max(taille, 1), ImmoCamConstants.ADMIN_PAGE_SIZE_MAX);
        PageResponse<NotificationResponse> result = notificationService.lister(
                PageRequest.of(page, safeTaille, Sort.by(Sort.Direction.DESC, "dateCreation")));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "Nombre de notifications non lues")
    @GetMapping("/non-lues/compte")
    public ResponseEntity<ApiResponse<Long>> compterNonLues() {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.compterNonLues()));
    }

    @Operation(summary = "Marquer une notification comme lue")
    @PatchMapping("/{id}/lue")
    public ResponseEntity<ApiResponse<Void>> marquerCommeLue(@PathVariable Long id) {
        notificationService.marquerCommeLue(id);
        return ResponseEntity.ok(ApiResponse.message("Notification marquee comme lue."));
    }

    @Operation(summary = "Marquer toutes les notifications comme lues")
    @PatchMapping("/lues")
    public ResponseEntity<ApiResponse<Void>> marquerToutesCommeLues() {
        notificationService.marquerToutesCommeLues();
        return ResponseEntity.ok(ApiResponse.message("Toutes les notifications ont ete marquees comme lues."));
    }
}
