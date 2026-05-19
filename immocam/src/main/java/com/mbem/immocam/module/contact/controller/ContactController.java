package com.mbem.immocam.module.contact.controller;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.contact.dto.request.ContactRequest;
import com.mbem.immocam.module.contact.dto.response.ContactListResponse;
import com.mbem.immocam.module.contact.dto.response.ContactResponse;
import com.mbem.immocam.module.contact.service.ContactService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller pour les contacts WhatsApp.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/contacts")
@RequiredArgsConstructor
@Tag(name = "Contact WhatsApp", description = "Tracking des contacts (auth requis)")
public class ContactController {

    private final ContactService contactService;
    private final UtilisateurRepository utilisateurRepository;

    @Operation(summary = "Contacter un propriétaire via WhatsApp", description = "Enregistre le clic et retourne le lien wa.me. "
            +
            "Le numéro du propriétaire n'est jamais exposé en clair.", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ContactResponse>> contacter(
            @Valid @RequestBody ContactRequest request,
            HttpServletRequest httpRequest) {
        ContactResponse response = contactService.contacter(
                getId(), request.getAnnonceId(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @Operation(summary = "Contacts reçus pour une annonce (dashboard propriétaire)", description = "Triés du plus récent. Numéros masqués.", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/annonces/{annonceId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<ContactListResponse>>> listeContacts(
            @PathVariable Long annonceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        PageResponse<ContactListResponse> result = contactService.listeContacts(
                annonceId, getId(), PageRequest.of(page, taille));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Long getId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email).map(u -> u.getId())
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException(
                        "Utilisateur non trouvé"));
    }

    @Operation(summary = "Tous mes contacts reçus", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/mes-contacts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<ContactListResponse>>> mesContacts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        PageResponse<ContactListResponse> result = contactService.mesContacts(
                getId(), PageRequest.of(page, taille));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
