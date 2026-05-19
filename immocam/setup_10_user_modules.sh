#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — SCRIPT 10 : MODULES UTILISATEUR, COMMENTAIRE, FAVORI,
#                       CONTACT WHATSAPP, SIGNALEMENT
# =============================================================================
# Rôle     : Génère les modules des interactions utilisateurs :
#            - UtilisateurController (profil, compte)
#            - CommentaireService + CommentaireController
#            - FavoriService + FavoriController
#            - ContactService + ContactController
#            - SignalementService + SignalementController
#
# Endpoints générés :
#   GET/PUT  /utilisateurs/profil          — Mon profil
#   DELETE   /utilisateurs/compte          — Supprimer mon compte
#   GET/POST /annonces/{id}/commentaires   — Lire/poster commentaires
#   POST     /commentaires/{id}/repondre   — Répondre (propriétaire)
#   DELETE   /commentaires/{id}            — Supprimer
#   GET      /favoris                      — Mes favoris
#   POST     /favoris/{annonceId}          — Ajouter favori
#   DELETE   /favoris/{annonceId}          — Retirer favori
#   POST     /contacts                     — Enregistrer clic WhatsApp
#   GET      /annonces/{id}/contacts       — Mes contacts (proprio)
#   POST     /annonces/{id}/signaler       — Signaler une annonce
#
# Exécuter : Depuis la RACINE du projet
#            bash setup_10_user_modules.sh
# Prérequis: Scripts 01 à 09 exécutés
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
WARN()    { echo -e "${YELLOW}[!]${NC} $1"; }
ERROR()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; \
            echo -e "${CYAN}  $1${NC}"; \
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

[[ -f "pom.xml" ]] || ERROR "pom.xml introuvable. Lancez depuis la racine du projet."

SECTION "SCRIPT 10 — MODULES UTILISATEUR, COMMENTAIRE, FAVORI, CONTACT, SIGNALEMENT"
INFO "Répertoire courant : $(pwd)"

BASE="src/main/java/com/mbem/immocam"
MOD="$BASE/module"

[[ -d "$MOD" ]] || ERROR "Dossier $MOD introuvable. Lancez d'abord le script 01."

# =============================================================================
# 1. MODULE UTILISATEUR — Profil + Compte
# =============================================================================
SECTION "1/5 — Module Utilisateur"

mkdir -p "$MOD/utilisateur/dto/request" \
         "$MOD/utilisateur/dto/response" \
         "$MOD/utilisateur/service" \
         "$MOD/utilisateur/controller"

cat > "$MOD/utilisateur/dto/request/UpdateProfilRequest.java" << 'EOF'
package com.mbem.immocam.module.utilisateur.dto.request;

import com.mbem.immocam.shared.validation.TelephoneCameroun;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Requête de mise à jour du profil utilisateur.
 * Tous les champs sont optionnels — seuls les non-null sont modifiés.
 *
 * @author MBEMNOVA
 */
@Data
public class UpdateProfilRequest {

    @Size(min = 2, max = 50, message = "Le prénom doit contenir entre 2 et 50 caractères")
    private String prenom;

    @Size(min = 2, max = 50, message = "Le nom doit contenir entre 2 et 50 caractères")
    private String nom;

    @TelephoneCameroun
    private String telephone;

    private String ville;
}
EOF

cat > "$MOD/utilisateur/dto/response/ProfilResponse.java" << 'EOF'
package com.mbem.immocam.module.utilisateur.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de réponse pour le profil utilisateur.
 * Le mot de passe et les données sensibles ne sont jamais inclus.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfilResponse {
    private Long id;
    private String prenom;
    private String nom;
    private String email;
    /** Numéro masqué : "+237 *** **** 567" */
    private String telephoneMasque;
    private String ville;
    private String role;
    private String statut;
    private LocalDateTime dateInscription;
    private LocalDateTime dernierLogin;
    private long nombreAnnoncesActives;
}
EOF

cat > "$MOD/utilisateur/service/UtilisateurService.java" << 'EOF'
package com.mbem.immocam.module.utilisateur.service;

import com.mbem.immocam.module.utilisateur.dto.request.UpdateProfilRequest;
import com.mbem.immocam.module.utilisateur.dto.response.ProfilResponse;

/**
 * Service de gestion du profil utilisateur.
 *
 * @author MBEMNOVA
 */
public interface UtilisateurService {

    ProfilResponse obtenirProfil(Long utilisateurId);

    ProfilResponse mettreAJourProfil(Long utilisateurId, UpdateProfilRequest request);

    /**
     * Suppression du compte avec anonymisation des données (RGPD).
     * - Annonces actives désactivées immédiatement
     * - Commentaires conservés avec auteur "Utilisateur supprimé"
     * - Données personnelles anonymisées sous 30 jours
     */
    void supprimerCompte(Long utilisateurId);
}
EOF

cat > "$MOD/utilisateur/service/UtilisateurServiceImpl.java" << 'EOF'
package com.mbem.immocam.module.utilisateur.service;

import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.utilisateur.dto.request.UpdateProfilRequest;
import com.mbem.immocam.module.utilisateur.dto.response.ProfilResponse;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.enums.StatutCompte;
import com.mbem.immocam.shared.utils.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation du service utilisateur.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UtilisateurServiceImpl implements UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final AnnonceRepository annonceRepository;

    @Override
    @Transactional(readOnly = true)
    public ProfilResponse obtenirProfil(Long utilisateurId) {
        Utilisateur u = obtenirOuErreur(utilisateurId);
        long nbActives = annonceRepository
            .countByProprietaireIdAndStatutAndDeletedFalse(utilisateurId, StatutAnnonce.ACTIVE);
        return ProfilResponse.builder()
                .id(u.getId())
                .prenom(u.getPrenom())
                .nom(u.getNom())
                .email(u.getEmail())
                .telephoneMasque(PhoneUtils.masquer(u.getTelephone()))
                .ville(u.getVille())
                .role(u.getRole().name())
                .statut(u.getStatut().name())
                .dateInscription(u.getDateCreation())
                .dernierLogin(u.getDernierLogin())
                .nombreAnnoncesActives(nbActives)
                .build();
    }

    @Override
    @Transactional
    public ProfilResponse mettreAJourProfil(Long utilisateurId, UpdateProfilRequest request) {
        Utilisateur u = obtenirOuErreur(utilisateurId);
        if (request.getPrenom()    != null) u.setPrenom(request.getPrenom().trim());
        if (request.getNom()       != null) u.setNom(request.getNom().trim());
        if (request.getVille()     != null) u.setVille(request.getVille());
        if (request.getTelephone() != null)
            u.setTelephone(PhoneUtils.normaliser(request.getTelephone()));
        return obtenirProfil(utilisateurId);
    }

    @Override
    @Transactional
    public void supprimerCompte(Long utilisateurId) {
        Utilisateur u = obtenirOuErreur(utilisateurId);
        // Désactiver toutes les annonces actives immédiatement
        List<Annonce> annonces = annonceRepository
            .findByProprietaireIdAndDeletedFalse(utilisateurId, Pageable.unpaged())
            .getContent();
        annonces.forEach(a -> {
            a.setStatut(StatutAnnonce.SUPPRIMEE);
            a.setDeleted(true);
        });
        // Marquer le compte comme banni (les commentaires restent avec "Utilisateur supprimé")
        u.setStatut(StatutCompte.BANNI);
        u.setEmail("deleted_" + utilisateurId + "@immocam.deleted");
        u.setPrenom("Utilisateur");
        u.setNom("supprime");
        u.setTelephone("+237000000000");
        log.info("Compte {} anonymisé et supprimé", utilisateurId);
    }

    private Utilisateur obtenirOuErreur(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", id));
    }
}
EOF

cat > "$MOD/utilisateur/controller/UtilisateurController.java" << 'EOF'
package com.mbem.immocam.module.utilisateur.controller;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
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
}
EOF
OK "Module Utilisateur généré"

# =============================================================================
# 2. MODULE COMMENTAIRE
# =============================================================================
SECTION "2/5 — Module Commentaire"

mkdir -p "$MOD/commentaire/dto/request" \
         "$MOD/commentaire/dto/response" \
         "$MOD/commentaire/service" \
         "$MOD/commentaire/controller"

cat > "$MOD/commentaire/dto/request/PublierCommentaireRequest.java" << 'EOF'
package com.mbem.immocam.module.commentaire.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Requête de publication d'un commentaire.
 * Connexion obligatoire. Publication immédiate sans modération.
 *
 * @author MBEMNOVA
 */
@Data
public class PublierCommentaireRequest {

    @NotBlank(message = "Le contenu est obligatoire")
    @Size(min = 5, max = 500,
          message = "Le commentaire doit contenir entre 5 et 500 caractères")
    private String contenu;
}
EOF

cat > "$MOD/commentaire/dto/response/CommentaireResponse.java" << 'EOF'
package com.mbem.immocam.module.commentaire.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de réponse pour un commentaire.
 * Le téléphone et l'email de l'auteur ne sont JAMAIS exposés.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentaireResponse {
    private Long id;
    /** Prénom uniquement — email et téléphone jamais exposés. */
    private String prenomAuteur;
    private String contenu;
    private LocalDateTime datePublication;
    private boolean estSupprime;
    /** Réponses du propriétaire (un seul niveau). */
    private List<CommentaireResponse> reponses;
}
EOF

cat > "$MOD/commentaire/service/CommentaireService.java" << 'EOF'
package com.mbem.immocam.module.commentaire.service;

import com.mbem.immocam.module.commentaire.dto.request.PublierCommentaireRequest;
import com.mbem.immocam.module.commentaire.dto.response.CommentaireResponse;
import com.mbem.immocam.shared.pagination.PageResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service de gestion des commentaires sur les annonces.
 *
 * @author MBEMNOVA
 */
public interface CommentaireService {

    PageResponse<CommentaireResponse> listerCommentaires(Long annonceId, Pageable pageable);

    CommentaireResponse publier(Long annonceId, Long auteurId,
                                PublierCommentaireRequest request);

    CommentaireResponse repondre(Long commentaireParentId, Long proprietaireId,
                                 PublierCommentaireRequest request);

    void supprimer(Long commentaireId, Long utilisateurId);
}
EOF

cat > "$MOD/commentaire/service/CommentaireServiceImpl.java" << 'EOF'
package com.mbem.immocam.module.commentaire.service;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.commentaire.dto.request.PublierCommentaireRequest;
import com.mbem.immocam.module.commentaire.dto.response.CommentaireResponse;
import com.mbem.immocam.module.commentaire.entity.Commentaire;
import com.mbem.immocam.module.commentaire.repository.CommentaireRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.enums.TypeAction;
import com.mbem.immocam.shared.pagination.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implémentation du service commentaires.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CommentaireServiceImpl implements CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final LogActiviteService logActiviteService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommentaireResponse> listerCommentaires(Long annonceId, Pageable pageable) {
        Page<Commentaire> page = commentaireRepository.findByAnnonceId(annonceId, pageable);
        Page<CommentaireResponse> dtoPage = page.map(this::toResponse);
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional
    public CommentaireResponse publier(Long annonceId, Long auteurId,
                                       PublierCommentaireRequest request) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .filter(a -> !a.isDeleted() && StatutAnnonce.ACTIVE.equals(a.getStatut()))
                .orElseThrow(() -> new RessourceNotFoundException(
                    "Annonce introuvable ou inactive."));
        Utilisateur auteur = utilisateurRepository.findById(auteurId)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", auteurId));

        Commentaire c = Commentaire.builder()
                .contenu(request.getContenu())
                .auteur(auteur)
                .annonce(annonce)
                .build();
        commentaireRepository.save(c);
        logActiviteService.log(auteurId, TypeAction.COMMENTAIRE_PUBLIE, "Annonce", annonceId, null, null);
        return toResponse(c);
    }

    @Override
    @Transactional
    public CommentaireResponse repondre(Long parentId, Long proprietaireId,
                                        PublierCommentaireRequest request) {
        Commentaire parent = commentaireRepository.findById(parentId)
                .orElseThrow(() -> new RessourceNotFoundException("Commentaire", parentId));
        // Seul le propriétaire de l'annonce peut répondre
        if (!parent.getAnnonce().getProprietaire().getId().equals(proprietaireId)) {
            throw new AccesRefuseException(
                "Seul le propriétaire de l'annonce peut répondre aux commentaires.");
        }
        Utilisateur proprio = utilisateurRepository.findById(proprietaireId)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", proprietaireId));

        Commentaire reponse = Commentaire.builder()
                .contenu(request.getContenu())
                .auteur(proprio)
                .annonce(parent.getAnnonce())
                .commentaireParent(parent)
                .build();
        commentaireRepository.save(reponse);
        logActiviteService.log(proprietaireId, TypeAction.REPONSE_COMMENTAIRE, "Commentaire", parentId, null, null);
        return toResponse(reponse);
    }

    @Override
    @Transactional
    public void supprimer(Long commentaireId, Long utilisateurId) {
        Commentaire c = commentaireRepository.findById(commentaireId)
                .orElseThrow(() -> new RessourceNotFoundException("Commentaire", commentaireId));
        boolean estAuteur   = c.getAuteur().getId().equals(utilisateurId);
        boolean estProprio  = c.getAnnonce().getProprietaire().getId().equals(utilisateurId);
        if (!estAuteur && !estProprio) {
            throw new AccesRefuseException("Vous n'êtes pas autorisé à supprimer ce commentaire.");
        }
        c.setEstSupprime(true);
        c.setContenu(ImmoCamConstants.COMMENTAIRE_SUPPRIME_TEXT);
        logActiviteService.log(utilisateurId, TypeAction.SUPPRESSION_COMMENTAIRE, "Commentaire", commentaireId, null, null);
    }

    private CommentaireResponse toResponse(Commentaire c) {
        List<CommentaireResponse> reponses = c.getReponses() == null ? List.of()
                : c.getReponses().stream()
                    .filter(r -> !r.isEstSupprime())
                    .map(r -> CommentaireResponse.builder()
                        .id(r.getId())
                        .prenomAuteur(r.getAuteur().getPrenom())
                        .contenu(r.getContenu())
                        .datePublication(r.getDateCreation())
                        .estSupprime(r.isEstSupprime())
                        .reponses(List.of())
                        .build())
                    .collect(Collectors.toList());
        return CommentaireResponse.builder()
                .id(c.getId())
                .prenomAuteur(c.getAuteur().getPrenom())
                .contenu(c.isEstSupprime() ? ImmoCamConstants.COMMENTAIRE_SUPPRIME_TEXT : c.getContenu())
                .datePublication(c.getDateCreation())
                .estSupprime(c.isEstSupprime())
                .reponses(reponses)
                .build();
    }
}
EOF

cat > "$MOD/commentaire/controller/CommentaireController.java" << 'EOF'
package com.mbem.immocam.module.commentaire.controller;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.commentaire.dto.request.PublierCommentaireRequest;
import com.mbem.immocam.module.commentaire.dto.response.CommentaireResponse;
import com.mbem.immocam.module.commentaire.service.CommentaireService;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.pagination.PageResponse;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller des commentaires sur les annonces.
 * Lecture publique — écriture/suppression nécessitent une connexion.
 *
 * @author MBEMNOVA
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Commentaires", description = "Commentaires sur les annonces (lecture publique)")
public class CommentaireController {

    private final CommentaireService commentaireService;
    private final UtilisateurRepository utilisateurRepository;

    @Operation(summary = "Liste des commentaires d'une annonce (public)")
    @GetMapping("/annonces/{annonceId}/commentaires")
    public ResponseEntity<ApiResponse<PageResponse<CommentaireResponse>>> lister(
            @PathVariable Long annonceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        PageResponse<CommentaireResponse> result = commentaireService.listerCommentaires(
            annonceId,
            PageRequest.of(page, taille, Sort.by(Sort.Direction.ASC, "dateCreation")));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "Poster un commentaire",
               description = "Connexion obligatoire. Publication immédiate.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/annonces/{annonceId}/commentaires")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentaireResponse>> publier(
            @PathVariable Long annonceId,
            @Valid @RequestBody PublierCommentaireRequest request) {
        CommentaireResponse c = commentaireService.publier(annonceId, getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Commentaire publié.", c));
    }

    @Operation(summary = "Répondre à un commentaire (propriétaire uniquement)",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/commentaires/{commentaireId}/repondre")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentaireResponse>> repondre(
            @PathVariable Long commentaireId,
            @Valid @RequestBody PublierCommentaireRequest request) {
        CommentaireResponse reponse = commentaireService.repondre(commentaireId, getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Réponse publiée.", reponse));
    }

    @Operation(summary = "Supprimer un commentaire",
               description = "Auteur ou propriétaire de l'annonce peuvent supprimer.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/commentaires/{commentaireId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> supprimer(@PathVariable Long commentaireId) {
        commentaireService.supprimer(commentaireId, getId());
        return ResponseEntity.ok(ApiResponse.message("Commentaire supprimé."));
    }

    private Long getId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email).map(u -> u.getId())
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception
                    .custom.RessourceNotFoundException("Utilisateur non trouvé"));
    }
}
EOF
OK "Module Commentaire généré"

# =============================================================================
# 3. MODULE FAVORI
# =============================================================================
SECTION "3/5 — Module Favori"

mkdir -p "$MOD/favori/dto/response" \
         "$MOD/favori/service" \
         "$MOD/favori/controller"

cat > "$MOD/favori/dto/response/FavoriResponse.java" << 'EOF'
package com.mbem.immocam.module.favori.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO de réponse pour un favori.
 * Affiche le statut actuel de l'annonce pour le badge dans la liste.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriResponse {
    private Long favoriId;
    private Long annonceId;
    private String typeBien;
    private String ville;
    private String quartier;
    private BigDecimal prix;
    /** ACTIVE, EN_PAUSE, EXPIREE, SUPPRIMEE… */
    private String statutAnnonce;
    private String photoUrl;
    private LocalDateTime dateAjout;
}
EOF

cat > "$MOD/favori/service/FavoriService.java" << 'EOF'
package com.mbem.immocam.module.favori.service;

import com.mbem.immocam.module.favori.dto.response.FavoriResponse;
import com.mbem.immocam.shared.pagination.PageResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service de gestion des favoris.
 *
 * @author MBEMNOVA
 */
public interface FavoriService {

    PageResponse<FavoriResponse> mesFavoris(Long utilisateurId, Pageable pageable);

    FavoriResponse ajouter(Long utilisateurId, Long annonceId);

    void retirer(Long utilisateurId, Long annonceId);

    boolean estEnFavori(Long utilisateurId, Long annonceId);
}
EOF

cat > "$MOD/favori/service/FavoriServiceImpl.java" << 'EOF'
package com.mbem.immocam.module.favori.service;

import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.favori.dto.response.FavoriResponse;
import com.mbem.immocam.module.favori.entity.Favori;
import com.mbem.immocam.module.favori.repository.FavoriRepository;
import com.mbem.immocam.module.photo.repository.PhotoRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.pagination.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implémentation du service favoris.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
public class FavoriServiceImpl implements FavoriService {

    private final FavoriRepository favoriRepository;
    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PhotoRepository photoRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FavoriResponse> mesFavoris(Long utilisateurId, Pageable pageable) {
        Page<Favori> page = favoriRepository
            .findByUtilisateurIdOrderByDateCreationDesc(utilisateurId, pageable);
        Page<FavoriResponse> dtoPage = page.map(f -> {
            Annonce a = f.getAnnonce();
            FavoriResponse dto = FavoriResponse.builder()
                    .favoriId(f.getId())
                    .annonceId(a.getId())
                    .typeBien(a.getTypeBien().getLibelle())
                    .ville(a.getLocalisation().getVille())
                    .quartier(a.getLocalisation().getQuartier())
                    .prix(a.getPrix())
                    .statutAnnonce(a.getStatut().name())
                    .dateAjout(f.getDateCreation())
                    .build();
            photoRepository.findFirstByAnnonceIdAndEstPrincipaleTrue(a.getId())
                    .ifPresent(p -> dto.setPhotoUrl(p.getCheminStockage()));
            return dto;
        });
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional
    public FavoriResponse ajouter(Long utilisateurId, Long annonceId) {
        if (favoriRepository.existsByUtilisateurIdAndAnnonceId(utilisateurId, annonceId)) {
            throw new DoublonException("Cette annonce est déjà dans vos favoris.");
        }
        Utilisateur u = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", utilisateurId));
        Annonce a = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));

        Favori favori = Favori.builder().utilisateur(u).annonce(a).build();
        favoriRepository.save(favori);

        return FavoriResponse.builder()
                .favoriId(favori.getId())
                .annonceId(annonceId)
                .typeBien(a.getTypeBien().getLibelle())
                .ville(a.getLocalisation().getVille())
                .statutAnnonce(a.getStatut().name())
                .build();
    }

    @Override
    @Transactional
    public void retirer(Long utilisateurId, Long annonceId) {
        favoriRepository.deleteByUtilisateurIdAndAnnonceId(utilisateurId, annonceId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean estEnFavori(Long utilisateurId, Long annonceId) {
        return favoriRepository.existsByUtilisateurIdAndAnnonceId(utilisateurId, annonceId);
    }
}
EOF

cat > "$MOD/favori/controller/FavoriController.java" << 'EOF'
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
EOF
OK "Module Favori généré"

# =============================================================================
# 4. MODULE CONTACT WHATSAPP
# =============================================================================
SECTION "4/5 — Module Contact WhatsApp"

mkdir -p "$MOD/contact/dto/request" \
         "$MOD/contact/dto/response" \
         "$MOD/contact/service" \
         "$MOD/contact/controller"

cat > "$MOD/contact/dto/request/ContactRequest.java" << 'EOF'
package com.mbem.immocam.module.contact.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Requête d'enregistrement d'un clic sur le bouton WhatsApp.
 *
 * @author MBEMNOVA
 */
@Data
public class ContactRequest {

    @NotNull(message = "L'ID de l'annonce est obligatoire")
    private Long annonceId;
}
EOF

cat > "$MOD/contact/dto/response/ContactResponse.java" << 'EOF'
package com.mbem.immocam.module.contact.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Réponse au clic WhatsApp — contient le lien wa.me.
 * Le numéro du propriétaire est intégré dans le lien, jamais exposé en clair.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {
    /**
     * Lien wa.me avec numéro et message pré-rempli.
     * Ex : "https://wa.me/237691234567?text=Bonjour..."
     * Le numéro propriétaire n'est pas lisible par l'utilisateur.
     */
    private String lienWhatsApp;
}
EOF

cat > "$MOD/contact/dto/response/ContactListResponse.java" << 'EOF'
package com.mbem.immocam.module.contact.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour la liste des contacts d'une annonce (dashboard propriétaire).
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactListResponse {
    /** Numéro masqué : "+237 *** **** 567" */
    private String telephoneMasque;
    private LocalDateTime dateContact;
}
EOF

cat > "$MOD/contact/service/ContactService.java" << 'EOF'
package com.mbem.immocam.module.contact.service;

import com.mbem.immocam.module.contact.dto.response.ContactListResponse;
import com.mbem.immocam.module.contact.dto.response.ContactResponse;
import com.mbem.immocam.shared.pagination.PageResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service de gestion des contacts WhatsApp.
 *
 * @author MBEMNOVA
 */
public interface ContactService {

    /**
     * Enregistre le clic et retourne le lien wa.me.
     * Le numéro du propriétaire n'est JAMAIS retourné en clair.
     */
    ContactResponse contacter(Long utilisateurId, Long annonceId, String adresseIp);

    /** Liste des contacts d'une annonce (dashboard propriétaire). */
    PageResponse<ContactListResponse> listeContacts(Long annonceId, Long proprietaireId,
                                                     Pageable pageable);

    /** Nombre de contacts pour une annonce. */
    long compterContacts(Long annonceId);
}
EOF

cat > "$MOD/contact/service/ContactServiceImpl.java" << 'EOF'
package com.mbem.immocam.module.contact.service;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.config.repository.ConfigSystemeRepository;
import com.mbem.immocam.module.contact.dto.response.ContactListResponse;
import com.mbem.immocam.module.contact.dto.response.ContactResponse;
import com.mbem.immocam.module.contact.entity.ContactWhatsApp;
import com.mbem.immocam.module.contact.repository.ContactWhatsAppRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.enums.TypeAction;
import com.mbem.immocam.shared.pagination.PageResponse;
import com.mbem.immocam.shared.utils.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Implémentation du service contact WhatsApp.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContactServiceImpl implements ContactService {

    private final ContactWhatsAppRepository contactRepository;
    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ConfigSystemeRepository configRepository;
    private final LogActiviteService logActiviteService;

    @Override
    @Transactional
    public ContactResponse contacter(Long utilisateurId, Long annonceId, String adresseIp) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .filter(a -> !a.isDeleted() && StatutAnnonce.ACTIVE.equals(a.getStatut()))
                .orElseThrow(() -> new RessourceNotFoundException(
                    "Annonce introuvable ou inactive."));
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", utilisateurId));

        // Enregistrer le contact
        ContactWhatsApp contact = ContactWhatsApp.builder()
                .utilisateur(utilisateur)
                .annonce(annonce)
                .telephoneContact(utilisateur.getTelephone())
                .adresseIp(adresseIp)
                .dateContact(LocalDateTime.now())
                .build();
        contactRepository.save(contact);
        logActiviteService.log(utilisateurId, TypeAction.CONTACT_WHATSAPP, "Annonce", annonceId, adresseIp, null);

        // Construire le message pré-rempli
        String template = configRepository.findByCle(ImmoCamConstants.CONFIG_MSG_WHATSAPP)
                .map(c -> c.getValeur())
                .orElse("Bonjour, je vous contacte depuis ImmoCam.");
        String msg = template
            .replace("{type}",    annonce.getTypeBien().getLibelle())
            .replace("{quartier}", annonce.getLocalisation().getQuartier() != null
                ? annonce.getLocalisation().getQuartier() : "")
            .replace("{ville}",   annonce.getLocalisation().getVille())
            .replace("{prix}",    annonce.getPrix().toPlainString());

        // Le numéro du propriétaire intégré dans wa.me — jamais exposé en clair
        String lien = PhoneUtils.construireLienWhatsApp(annonce.getNumeroWhatsApp(), msg);
        return ContactResponse.builder().lienWhatsApp(lien).build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ContactListResponse> listeContacts(Long annonceId, Long proprietaireId,
                                                            Pageable pageable) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));
        if (!annonce.getProprietaire().getId().equals(proprietaireId)) {
            throw new AccesRefuseException("Accès non autorisé à ces contacts.");
        }
        Page<ContactWhatsApp> page = contactRepository
            .findByAnnonceIdOrderByDateContactDesc(annonceId, pageable);
        Page<ContactListResponse> dto = page.map(c -> ContactListResponse.builder()
                .telephoneMasque(PhoneUtils.masquer(c.getTelephoneContact()))
                .dateContact(c.getDateContact())
                .build());
        return PageResponse.from(dto);
    }

    @Override
    public long compterContacts(Long annonceId) {
        return contactRepository.countByAnnonceId(annonceId);
    }
}
EOF

cat > "$MOD/contact/controller/ContactController.java" << 'EOF'
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

    @Operation(summary = "Contacter un propriétaire via WhatsApp",
               description = "Enregistre le clic et retourne le lien wa.me. " +
                             "Le numéro du propriétaire n'est jamais exposé en clair.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ContactResponse>> contacter(
            @Valid @RequestBody ContactRequest request,
            HttpServletRequest httpRequest) {
        ContactResponse response = contactService.contacter(
            getId(), request.getAnnonceId(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @Operation(summary = "Contacts reçus pour une annonce (dashboard propriétaire)",
               description = "Triés du plus récent. Numéros masqués.",
               security = @SecurityRequirement(name = "bearerAuth"))
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
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception
                    .custom.RessourceNotFoundException("Utilisateur non trouvé"));
    }
}
EOF
OK "Module Contact WhatsApp généré"

# =============================================================================
# 5. MODULE SIGNALEMENT
# =============================================================================
SECTION "5/5 — Module Signalement"

mkdir -p "$MOD/signalement/dto/request" \
         "$MOD/signalement/dto/response" \
         "$MOD/signalement/service" \
         "$MOD/signalement/controller"

cat > "$MOD/signalement/dto/request/SignalerAnnonceRequest.java" << 'EOF'
package com.mbem.immocam.module.signalement.dto.request;

import com.mbem.immocam.shared.enums.MotifSignalement;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Requête de signalement d'une annonce.
 * Si motif = AUTRE, le champ details est obligatoire.
 * Connexion obligatoire pour signaler.
 *
 * @author MBEMNOVA
 */
@Data
public class SignalerAnnonceRequest {

    @NotNull(message = "Le motif est obligatoire")
    private MotifSignalement motif;

    /** Obligatoire si motif = AUTRE. */
    private String details;
}
EOF

cat > "$MOD/signalement/dto/response/SignalementResponse.java" << 'EOF'
package com.mbem.immocam.module.signalement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de réponse après soumission d'un signalement.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalementResponse {
    private Long id;
    private String motif;
    private String statut;
    private LocalDateTime dateSignalement;
}
EOF

cat > "$MOD/signalement/service/SignalementService.java" << 'EOF'
package com.mbem.immocam.module.signalement.service;

import com.mbem.immocam.module.signalement.dto.request.SignalerAnnonceRequest;
import com.mbem.immocam.module.signalement.dto.response.SignalementResponse;

/**
 * Service de gestion des signalements.
 *
 * @author MBEMNOVA
 */
public interface SignalementService {

    /** Signaler une annonce (connexion obligatoire). */
    SignalementResponse signaler(Long annonceId, Long auteurId,
                                 SignalerAnnonceRequest request);
}
EOF

cat > "$MOD/signalement/service/SignalementServiceImpl.java" << 'EOF'
package com.mbem.immocam.module.signalement.service;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.signalement.dto.request.SignalerAnnonceRequest;
import com.mbem.immocam.module.signalement.dto.response.SignalementResponse;
import com.mbem.immocam.module.signalement.entity.Signalement;
import com.mbem.immocam.module.signalement.repository.SignalementRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.MotifSignalement;
import com.mbem.immocam.shared.enums.StatutSignalement;
import com.mbem.immocam.shared.enums.TypeAction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implémentation du service signalement.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SignalementServiceImpl implements SignalementService {

    private final SignalementRepository signalementRepository;
    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final LogActiviteService logActiviteService;

    @Override
    @Transactional
    public SignalementResponse signaler(Long annonceId, Long auteurId,
                                        SignalerAnnonceRequest request) {
        // Empêcher les signalements en double EN_ATTENTE
        if (signalementRepository.existsByAuteurIdAndAnnonceIdAndStatut(
                auteurId, annonceId, StatutSignalement.EN_ATTENTE)) {
            throw new DoublonException(
                "Vous avez déjà signalé cette annonce. Votre signalement est en cours d'examen.");
        }
        // Motif AUTRE = details obligatoire
        if (MotifSignalement.AUTRE.equals(request.getMotif())
                && (request.getDetails() == null || request.getDetails().isBlank())) {
            throw new IllegalArgumentException(
                "Veuillez préciser le motif dans le champ 'Autre'.");
        }

        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));
        Utilisateur auteur = utilisateurRepository.findById(auteurId)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", auteurId));

        Signalement s = Signalement.builder()
                .auteur(auteur)
                .annonce(annonce)
                .motif(request.getMotif())
                .details(request.getDetails())
                .statut(StatutSignalement.EN_ATTENTE)
                .build();
        signalementRepository.save(s);

        logActiviteService.log(auteurId, TypeAction.SIGNALEMENT_SOUMIS, "Annonce", annonceId, null, null);
        log.info("Annonce {} signalée par utilisateur {}", annonceId, auteurId);

        return SignalementResponse.builder()
                .id(s.getId())
                .motif(s.getMotif().name())
                .statut(s.getStatut().name())
                .dateSignalement(s.getDateCreation())
                .build();
    }
}
EOF

cat > "$MOD/signalement/controller/SignalementController.java" << 'EOF'
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
EOF
OK "Module Signalement généré"

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
JAVA_COUNT=$(find src/main/java -name "*.java" | wc -l)
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SCRIPT 10 TERMINÉ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Fichiers Java total : $JAVA_COUNT"
INFO ""
INFO "Modules générés :"
INFO "  Utilisateur  — profil, mise à jour, suppression compte"
INFO "  Commentaire  — liste publique, poster, répondre, supprimer"
INFO "  Favori       — mes favoris, ajouter, retirer"
INFO "  Contact      — clic WhatsApp, liste contacts (proprio)"
INFO "  Signalement  — signaler une annonce"
echo ""
INFO "Prochaine étape : bash setup_11_admin_module.sh"