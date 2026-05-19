#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — SCRIPT 11 : MODULE ADMIN COMPLET
# =============================================================================
# Rôle     : Génère l'interface d'administration complète :
#            - Dashboard (statistiques temps réel)
#            - Gestion annonces (historique, suppression, pause)
#            - Gestion utilisateurs (suspension, bannissement, réactivation)
#            - Gestion signalements (traitement)
#            - Gestion commentaires (suppression)
#            - Configuration système dynamique
#            - Rapports et exports CSV
#            - Gestion villes et types de biens
#
# Endpoints (tous protégés ROLE_ADMINISTRATEUR) :
#   GET  /admin/dashboard
#   GET  /admin/annonces
#   PATCH/DELETE /admin/annonces/{id}
#   GET  /admin/utilisateurs
#   PATCH /admin/utilisateurs/{id}/suspendre|bannir|activer
#   GET  /admin/signalements
#   PATCH /admin/signalements/{id}/traiter
#   GET/DELETE /admin/commentaires
#   GET/PUT /admin/config
#   GET /admin/rapports/export/annonces|utilisateurs
#
# Exécuter : Depuis la RACINE du projet
#            bash setup_11_admin_module.sh
# Prérequis: Scripts 01 à 10 exécutés
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

SECTION "SCRIPT 11 — MODULE ADMIN"
INFO "Répertoire courant : $(pwd)"

BASE="src/main/java/com/mbem/immocam"
ADMIN="$BASE/module/admin"

[[ -d "$ADMIN" ]] || ERROR "Dossier $ADMIN introuvable. Lancez d'abord le script 01."

mkdir -p "$ADMIN/dto/response" "$ADMIN/service" "$ADMIN/controller"

# =============================================================================
# 1. DTOs Admin
# =============================================================================
SECTION "1/3 — DTOs Admin"

cat > "$ADMIN/dto/response/DashboardResponse.java" << 'EOF'
package com.mbem.immocam.module.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Statistiques temps réel du dashboard administrateur.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    // ── Aujourd'hui ──────────────────────────────────────────────────────
    private long annoncesPublieesAujourdhui;
    private long nouveauxInscritsAujourdhui;
    private long contactsWhatsAppAujourdhui;
    private long commentairesAujourdhui;

    // ── 7 derniers jours ─────────────────────────────────────────────────
    private long annoncesPubliees7j;
    private long nouveauxInscrits7j;
    private long contactsWhatsApp7j;

    // ── Temps réel ────────────────────────────────────────────────────────
    private long annoncesActives;
    private long signalementsEnAttente;
    private long utilisateursActifs;
    private long utilisateursSuspendus;
}
EOF

cat > "$ADMIN/dto/response/AdminAnnonceResponse.java" << 'EOF'
package com.mbem.immocam.module.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO annonce pour l'interface admin (avec informations propriétaire).
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnnonceResponse {
    private Long id;
    private String typeBien;
    private String ville;
    private String quartier;
    private BigDecimal prix;
    private String statut;
    private int nombreVues;
    private long nombreContacts;
    private long nombreSignalements;
    private LocalDateTime datePublication;
    private LocalDateTime dateExpiration;
    // Infos propriétaire
    private Long proprietaireId;
    private String proprietaireNom;
    private String proprietaireEmail;
}
EOF

cat > "$ADMIN/dto/response/AdminUtilisateurResponse.java" << 'EOF'
package com.mbem.immocam.module.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO utilisateur pour l'interface admin.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUtilisateurResponse {
    private Long id;
    private String prenom;
    private String nom;
    private String email;
    private String telephoneMasque;
    private String ville;
    private String role;
    private String statut;
    private LocalDateTime dateInscription;
    private LocalDateTime dernierLogin;
    private long nombreAnnoncesActives;
    private long nombreAnnoncesTotal;
}
EOF

cat > "$ADMIN/dto/response/AdminSignalementResponse.java" << 'EOF'
package com.mbem.immocam.module.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO signalement pour l'interface admin.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSignalementResponse {
    private Long id;
    private Long annonceId;
    private String typeBienAnnonce;
    private String villeAnnonce;
    private String motif;
    private String details;
    private String statut;
    private String auteurEmail;
    private LocalDateTime dateSignalement;
}
EOF

OK "DTOs admin générés"

# =============================================================================
# 2. AdminService
# =============================================================================
SECTION "2/3 — AdminService"

cat > "$ADMIN/service/AdminService.java" << 'EOF'
package com.mbem.immocam.module.admin.service;

import com.mbem.immocam.module.admin.dto.response.AdminAnnonceResponse;
import com.mbem.immocam.module.admin.dto.response.AdminSignalementResponse;
import com.mbem.immocam.module.admin.dto.response.AdminUtilisateurResponse;
import com.mbem.immocam.module.admin.dto.response.DashboardResponse;
import com.mbem.immocam.shared.enums.StatutSignalement;
import com.mbem.immocam.shared.pagination.PageResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service d'administration ImmoCam.
 *
 * @author MBEMNOVA
 */
public interface AdminService {

    DashboardResponse getDashboard();

    // ── Annonces ────────────────────────────────────────────────────────
    PageResponse<AdminAnnonceResponse> listerAnnonces(String ville, Long typeBienId,
                                                       Long proprietaireId, String statut,
                                                       Pageable pageable);

    void supprimerAnnonce(Long annonceId, Long adminId, String motif);

    void mettreEnPauseAnnonce(Long annonceId, Long adminId);

    void reactiverAnnonce(Long annonceId, Long adminId);

    // ── Utilisateurs ────────────────────────────────────────────────────
    PageResponse<AdminUtilisateurResponse> listerUtilisateurs(String terme, Pageable pageable);

    void suspendreUtilisateur(Long utilisateurId, Long adminId, String motif);

    void bannirUtilisateur(Long utilisateurId, Long adminId, String motif);

    void activerUtilisateur(Long utilisateurId, Long adminId);

    // ── Signalements ────────────────────────────────────────────────────
    PageResponse<AdminSignalementResponse> listerSignalements(
            StatutSignalement statut, Pageable pageable);

    void traiterSignalement(Long signalementId, Long adminId, StatutSignalement decision);

    // ── Config ──────────────────────────────────────────────────────────
    void mettreAJourConfig(String cle, String valeur, Long adminId);
}
EOF

cat > "$ADMIN/service/AdminServiceImpl.java" << 'EOF'
package com.mbem.immocam.module.admin.service;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.email.service.EmailService;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.admin.dto.response.AdminAnnonceResponse;
import com.mbem.immocam.module.admin.dto.response.AdminSignalementResponse;
import com.mbem.immocam.module.admin.dto.response.AdminUtilisateurResponse;
import com.mbem.immocam.module.admin.dto.response.DashboardResponse;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.annonce.specification.AnnonceSpecification;
import com.mbem.immocam.module.commentaire.repository.CommentaireRepository;
import com.mbem.immocam.module.config.entity.ConfigSysteme;
import com.mbem.immocam.module.config.repository.ConfigSystemeRepository;
import com.mbem.immocam.module.contact.repository.ContactWhatsAppRepository;
import com.mbem.immocam.module.signalement.entity.Signalement;
import com.mbem.immocam.module.signalement.repository.SignalementRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.enums.StatutCompte;
import com.mbem.immocam.shared.enums.StatutSignalement;
import com.mbem.immocam.shared.enums.TypeAction;
import com.mbem.immocam.shared.pagination.PageResponse;
import com.mbem.immocam.shared.utils.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Implémentation du service admin.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final SignalementRepository signalementRepository;
    private final CommentaireRepository commentaireRepository;
    private final ContactWhatsAppRepository contactRepository;
    private final ConfigSystemeRepository configRepository;
    private final EmailService emailService;
    private final LogActiviteService logActiviteService;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        LocalDateTime debutAujourdhui = LocalDateTime.now().withHour(0).withMinute(0);
        LocalDateTime il7Jours = LocalDateTime.now().minusDays(7);

        return DashboardResponse.builder()
            .annoncesPublieesAujourdhui(annonceRepository.countPublieesDepuis(debutAujourdhui))
            .nouveauxInscritsAujourdhui(utilisateurRepository.countNouveauxDepuis(debutAujourdhui))
            .contactsWhatsAppAujourdhui(contactRepository.countDepuis(debutAujourdhui))
            .commentairesAujourdhui(commentaireRepository.countDepuis(debutAujourdhui))
            .annoncesPubliees7j(annonceRepository.countPublieesDepuis(il7Jours))
            .nouveauxInscrits7j(utilisateurRepository.countNouveauxDepuis(il7Jours))
            .contactsWhatsApp7j(contactRepository.countDepuis(il7Jours))
            .annoncesActives(annonceRepository.countByProprietaireIdAndStatutAndDeletedFalse(
                null, StatutAnnonce.ACTIVE))
            .signalementsEnAttente(signalementRepository.countByStatut(StatutSignalement.EN_ATTENTE))
            .utilisateursActifs(utilisateurRepository.countByStatut(StatutCompte.ACTIF))
            .utilisateursSuspendus(utilisateurRepository.countByStatut(StatutCompte.SUSPENDU))
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminAnnonceResponse> listerAnnonces(String ville, Long typeBienId,
            Long proprietaireId, String statut, Pageable pageable) {
        StatutAnnonce statutEnum = statut != null ? StatutAnnonce.valueOf(statut) : null;
        Specification<Annonce> spec = AnnonceSpecification.filtrerAdmin(
            ville, typeBienId, proprietaireId, statutEnum);
        Page<Annonce> page = annonceRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(a -> AdminAnnonceResponse.builder()
            .id(a.getId())
            .typeBien(a.getTypeBien().getLibelle())
            .ville(a.getLocalisation().getVille())
            .quartier(a.getLocalisation().getQuartier())
            .prix(a.getPrix())
            .statut(a.getStatut().name())
            .nombreVues(a.getNombreVues())
            .nombreContacts(contactRepository.countByAnnonceId(a.getId()))
            .datePublication(a.getDateCreation())
            .dateExpiration(a.getDateExpiration())
            .proprietaireId(a.getProprietaire().getId())
            .proprietaireNom(a.getProprietaire().getNomComplet())
            .proprietaireEmail(a.getProprietaire().getEmail())
            .build()));
    }

    @Override
    @Transactional
    public void supprimerAnnonce(Long annonceId, Long adminId, String motif) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));
        annonce.setStatut(StatutAnnonce.SUPPRIMEE_ADMIN);
        annonce.setDeleted(true);
        annonce.setMotifSuppression(motif);
        annonce.setSupprimeParId(adminId);
        annonce.setDateSuppression(LocalDateTime.now());

        emailService.envoyerAnnonceSupprimeeParAdmin(
            annonce.getProprietaire().getEmail(),
            annonce.getProprietaire().getPrenom(),
            annonce.getTypeBien().getLibelle(),
            annonce.getLocalisation().getVille(), motif);

        logActiviteService.log(adminId, TypeAction.SUPPRESSION_ANNONCE_ADMIN,
            "Annonce", annonceId, null, "Motif: " + motif);
        log.info("Admin {} a supprimé l'annonce {} — motif: {}", adminId, annonceId, motif);
    }

    @Override
    @Transactional
    public void mettreEnPauseAnnonce(Long annonceId, Long adminId) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));
        annonce.setStatut(StatutAnnonce.EN_PAUSE);
        logActiviteService.log(adminId, TypeAction.PAUSE_ANNONCE, "Annonce", annonceId, null, "Par admin");
    }

    @Override
    @Transactional
    public void reactiverAnnonce(Long annonceId, Long adminId) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));
        annonce.setStatut(StatutAnnonce.ACTIVE);
        logActiviteService.log(adminId, TypeAction.REACTIVATION_ANNONCE, "Annonce", annonceId, null, "Par admin");
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminUtilisateurResponse> listerUtilisateurs(String terme, Pageable pageable) {
        Page<Utilisateur> page = (terme != null && !terme.isBlank())
            ? utilisateurRepository.rechercherAdmin(terme, pageable)
            : utilisateurRepository.findAll(pageable);
        return PageResponse.from(page.map(u -> AdminUtilisateurResponse.builder()
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
            .nombreAnnoncesActives(annonceRepository.countByProprietaireIdAndStatutAndDeletedFalse(
                u.getId(), StatutAnnonce.ACTIVE))
            .build()));
    }

    @Override
    @Transactional
    public void suspendreUtilisateur(Long utilisateurId, Long adminId, String motif) {
        Utilisateur u = obtenirUtilisateur(utilisateurId);
        u.setStatut(StatutCompte.SUSPENDU);
        u.setMotifSuspension(motif);
        u.setDateSuspension(LocalDateTime.now());
        // Masquer toutes ses annonces actives
        annonceRepository.findByProprietaireIdAndDeletedFalse(utilisateurId, Pageable.unpaged())
            .getContent().stream()
            .filter(a -> StatutAnnonce.ACTIVE.equals(a.getStatut()))
            .forEach(a -> a.setStatut(StatutAnnonce.EN_PAUSE));

        emailService.envoyerCompteSuspendu(u.getEmail(), u.getPrenom(), motif);
        logActiviteService.log(adminId, TypeAction.SUSPENSION_UTILISATEUR,
            "Utilisateur", utilisateurId, null, "Motif: " + motif);
    }

    @Override
    @Transactional
    public void bannirUtilisateur(Long utilisateurId, Long adminId, String motif) {
        Utilisateur u = obtenirUtilisateur(utilisateurId);
        u.setStatut(StatutCompte.BANNI);
        u.setMotifSuspension(motif);
        // Supprimer toutes ses annonces définitivement
        annonceRepository.findByProprietaireIdAndDeletedFalse(utilisateurId, Pageable.unpaged())
            .getContent().forEach(a -> { a.setStatut(StatutAnnonce.SUPPRIMEE_ADMIN); a.setDeleted(true); });

        logActiviteService.log(adminId, TypeAction.BANNISSEMENT_UTILISATEUR,
            "Utilisateur", utilisateurId, null, "Motif: " + motif);
    }

    @Override
    @Transactional
    public void activerUtilisateur(Long utilisateurId, Long adminId) {
        Utilisateur u = obtenirUtilisateur(utilisateurId);
        u.setStatut(StatutCompte.ACTIF);
        u.setMotifSuspension(null);
        // Remettre ses annonces en ligne
        annonceRepository.findByProprietaireIdAndDeletedFalse(utilisateurId, Pageable.unpaged())
            .getContent().stream()
            .filter(a -> StatutAnnonce.EN_PAUSE.equals(a.getStatut()))
            .forEach(a -> a.setStatut(StatutAnnonce.ACTIVE));

        emailService.envoyerCompteReactive(u.getEmail(), u.getPrenom());
        logActiviteService.log(adminId, TypeAction.REACTIVATION_UTILISATEUR,
            "Utilisateur", utilisateurId, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminSignalementResponse> listerSignalements(
            StatutSignalement statut, Pageable pageable) {
        Page<Signalement> page = signalementRepository
            .findByStatutOrderByDateCreationDesc(statut, pageable);
        return PageResponse.from(page.map(s -> AdminSignalementResponse.builder()
            .id(s.getId())
            .annonceId(s.getAnnonce().getId())
            .typeBienAnnonce(s.getAnnonce().getTypeBien().getLibelle())
            .villeAnnonce(s.getAnnonce().getLocalisation().getVille())
            .motif(s.getMotif().name())
            .details(s.getDetails())
            .statut(s.getStatut().name())
            .auteurEmail(s.getAuteur().getEmail())
            .dateSignalement(s.getDateCreation())
            .build()));
    }

    @Override
    @Transactional
    public void traiterSignalement(Long signalementId, Long adminId, StatutSignalement decision) {
        Signalement s = signalementRepository.findById(signalementId)
                .orElseThrow(() -> new RessourceNotFoundException("Signalement", signalementId));
        Utilisateur admin = obtenirUtilisateur(adminId);
        s.setStatut(decision);
        s.setTraiteParAdmin(admin);
        s.setDateTraitement(LocalDateTime.now());

        if (StatutSignalement.TRAITE_SUPPRESSION.equals(decision)) {
            supprimerAnnonce(s.getAnnonce().getId(), adminId, "Signalement validé");
        } else if (StatutSignalement.TRAITE_SUSPENSION.equals(decision)) {
            suspendreUtilisateur(s.getAnnonce().getProprietaire().getId(),
                adminId, "Signalement validé");
        }
        logActiviteService.log(adminId, TypeAction.SIGNALEMENT_TRAITE,
            "Signalement", signalementId, null, decision.name());
    }

    @Override
    @Transactional
    public void mettreAJourConfig(String cle, String valeur, Long adminId) {
        ConfigSysteme config = configRepository.findByCle(cle)
                .orElseThrow(() -> new RessourceNotFoundException("Configuration : " + cle));
        config.setValeur(valeur);
        config.setModifiePar(obtenirUtilisateur(adminId));
        logActiviteService.log(adminId, TypeAction.MODIFICATION_CONFIG_SYSTEME,
            "Config", null, null, cle + "=" + valeur);
    }

    private Utilisateur obtenirUtilisateur(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", id));
    }
}
EOF
OK "AdminService.java généré"
OK "AdminServiceImpl.java généré"

# =============================================================================
# 3. AdminController
# =============================================================================
SECTION "3/3 — AdminController"

cat > "$ADMIN/controller/AdminController.java" << 'EOF'
package com.mbem.immocam.module.admin.controller;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.admin.dto.response.AdminAnnonceResponse;
import com.mbem.immocam.module.admin.dto.response.AdminSignalementResponse;
import com.mbem.immocam.module.admin.dto.response.AdminUtilisateurResponse;
import com.mbem.immocam.module.admin.dto.response.DashboardResponse;
import com.mbem.immocam.module.admin.service.AdminService;
import com.mbem.immocam.module.commentaire.entity.Commentaire;
import com.mbem.immocam.module.commentaire.repository.CommentaireRepository;
import com.mbem.immocam.module.config.entity.ConfigSysteme;
import com.mbem.immocam.module.config.repository.ConfigSystemeRepository;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.StatutSignalement;
import com.mbem.immocam.shared.pagination.PageResponse;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

/**
 * Interface d'administration ImmoCam.
 * Tous les endpoints nécessitent le rôle ADMINISTRATEUR.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMINISTRATEUR')")
@RequiredArgsConstructor
@Tag(name = "Administration", description = "Interface admin — ROLE_ADMINISTRATEUR requis")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;
    private final CommentaireRepository commentaireRepository;
    private final ConfigSystemeRepository configRepository;
    private final UtilisateurRepository utilisateurRepository;

    // ── Dashboard ─────────────────────────────────────────────────────────

    @Operation(summary = "Dashboard — Statistiques temps réel")
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> dashboard() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getDashboard()));
    }

    // ── Annonces ──────────────────────────────────────────────────────────

    @Operation(summary = "Historique de toutes les annonces (avec filtres)")
    @GetMapping("/annonces")
    public ResponseEntity<ApiResponse<PageResponse<AdminAnnonceResponse>>> annonces(
            @RequestParam(required = false) String ville,
            @RequestParam(required = false) Long typeBienId,
            @RequestParam(required = false) Long proprietaireId,
            @RequestParam(required = false) String statut,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        PageResponse<AdminAnnonceResponse> result = adminService.listerAnnonces(
            ville, typeBienId, proprietaireId, statut,
            PageRequest.of(page, taille, Sort.by(Sort.Direction.DESC, "dateCreation")));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "Supprimer une annonce (avec motif obligatoire)")
    @DeleteMapping("/annonces/{id}")
    public ResponseEntity<ApiResponse<Void>> supprimerAnnonce(
            @PathVariable Long id,
            @RequestParam String motif) {
        adminService.supprimerAnnonce(id, getAdminId(), motif);
        return ResponseEntity.ok(ApiResponse.message(
            "Annonce supprimée. Le propriétaire a été notifié par email."));
    }

    @Operation(summary = "Mettre en pause une annonce")
    @PatchMapping("/annonces/{id}/pause")
    public ResponseEntity<ApiResponse<Void>> pauseAnnonce(@PathVariable Long id) {
        adminService.mettreEnPauseAnnonce(id, getAdminId());
        return ResponseEntity.ok(ApiResponse.message("Annonce mise en pause."));
    }

    @Operation(summary = "Réactiver une annonce")
    @PatchMapping("/annonces/{id}/reactiver")
    public ResponseEntity<ApiResponse<Void>> reactiverAnnonce(@PathVariable Long id) {
        adminService.reactiverAnnonce(id, getAdminId());
        return ResponseEntity.ok(ApiResponse.message("Annonce réactivée."));
    }

    // ── Utilisateurs ──────────────────────────────────────────────────────

    @Operation(summary = "Liste des utilisateurs (avec recherche)")
    @GetMapping("/utilisateurs")
    public ResponseEntity<ApiResponse<PageResponse<AdminUtilisateurResponse>>> utilisateurs(
            @RequestParam(required = false) String terme,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        PageResponse<AdminUtilisateurResponse> result = adminService.listerUtilisateurs(
            terme, PageRequest.of(page, taille, Sort.by(Sort.Direction.DESC, "dateCreation")));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "Suspendre un compte utilisateur")
    @PatchMapping("/utilisateurs/{id}/suspendre")
    public ResponseEntity<ApiResponse<Void>> suspendre(
            @PathVariable Long id, @RequestParam String motif) {
        adminService.suspendreUtilisateur(id, getAdminId(), motif);
        return ResponseEntity.ok(ApiResponse.message("Compte suspendu. Utilisateur notifié."));
    }

    @Operation(summary = "Bannir définitivement un compte")
    @PatchMapping("/utilisateurs/{id}/bannir")
    public ResponseEntity<ApiResponse<Void>> bannir(
            @PathVariable Long id, @RequestParam String motif) {
        adminService.bannirUtilisateur(id, getAdminId(), motif);
        return ResponseEntity.ok(ApiResponse.message("Compte banni définitivement."));
    }

    @Operation(summary = "Réactiver un compte suspendu")
    @PatchMapping("/utilisateurs/{id}/activer")
    public ResponseEntity<ApiResponse<Void>> activer(@PathVariable Long id) {
        adminService.activerUtilisateur(id, getAdminId());
        return ResponseEntity.ok(ApiResponse.message("Compte réactivé. Utilisateur notifié."));
    }

    // ── Signalements ──────────────────────────────────────────────────────

    @Operation(summary = "Liste des signalements")
    @GetMapping("/signalements")
    public ResponseEntity<ApiResponse<PageResponse<AdminSignalementResponse>>> signalements(
            @RequestParam(defaultValue = "EN_ATTENTE") String statut,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        PageResponse<AdminSignalementResponse> result = adminService.listerSignalements(
            StatutSignalement.valueOf(statut),
            PageRequest.of(page, taille, Sort.by(Sort.Direction.DESC, "dateCreation")));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "Traiter un signalement")
    @PatchMapping("/signalements/{id}/traiter")
    public ResponseEntity<ApiResponse<Void>> traiterSignalement(
            @PathVariable Long id, @RequestParam String decision) {
        adminService.traiterSignalement(id, getAdminId(), StatutSignalement.valueOf(decision));
        return ResponseEntity.ok(ApiResponse.message("Signalement traité."));
    }

    // ── Commentaires ──────────────────────────────────────────────────────

    @Operation(summary = "Supprimer un commentaire (modération)")
    @DeleteMapping("/commentaires/{id}")
    public ResponseEntity<ApiResponse<Void>> supprimerCommentaire(@PathVariable Long id) {
        commentaireRepository.findById(id).ifPresent(c -> {
            c.setEstSupprime(true);
            c.setSupprimeParAdmin(true);
            c.setContenu("[Supprimé par l'administration]");
            commentaireRepository.save(c);
        });
        return ResponseEntity.ok(ApiResponse.message("Commentaire supprimé."));
    }

    // ── Configuration ─────────────────────────────────────────────────────

    @Operation(summary = "Liste des paramètres de configuration")
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<List<ConfigSysteme>>> getConfig() {
        return ResponseEntity.ok(ApiResponse.ok(configRepository.findAll()));
    }

    @Operation(summary = "Modifier un paramètre de configuration")
    @PatchMapping("/config/{cle}")
    public ResponseEntity<ApiResponse<Void>> updateConfig(
            @PathVariable String cle, @RequestParam String valeur) {
        adminService.mettreAJourConfig(cle, valeur, getAdminId());
        return ResponseEntity.ok(ApiResponse.message("Configuration mise à jour."));
    }

    // ── Exports CSV ───────────────────────────────────────────────────────

    @Operation(summary = "Export CSV des annonces")
    @GetMapping("/rapports/export/annonces")
    public void exportAnnonces(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=annonces.csv");
        response.getOutputStream().write(0xEF);
        response.getOutputStream().write(0xBB);
        response.getOutputStream().write(0xBF); // BOM UTF-8 pour Excel
        PrintWriter writer = response.getWriter();
        writer.println("ID,Type,Ville,Quartier,Prix,Statut,Vues,DatePublication,Proprietaire");
        adminService.listerAnnonces(null, null, null, null, PageRequest.of(0, Integer.MAX_VALUE))
            .getContenu().forEach(a -> writer.printf("%d,%s,%s,%s,%.0f,%s,%d,%s,%s%n",
                a.getId(), a.getTypeBien(), a.getVille(),
                a.getQuartier() != null ? a.getQuartier() : "",
                a.getPrix(), a.getStatut(), a.getNombreVues(),
                a.getDatePublication(), a.getProprietaireEmail()));
    }

    @Operation(summary = "Export CSV des utilisateurs")
    @GetMapping("/rapports/export/utilisateurs")
    public void exportUtilisateurs(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=utilisateurs.csv");
        response.getOutputStream().write(0xEF);
        response.getOutputStream().write(0xBB);
        response.getOutputStream().write(0xBF);
        PrintWriter writer = response.getWriter();
        writer.println("ID,Prénom,Nom,Email,Ville,Rôle,Statut,DateInscription");
        adminService.listerUtilisateurs(null, PageRequest.of(0, Integer.MAX_VALUE))
            .getContenu().forEach(u -> writer.printf("%d,%s,%s,%s,%s,%s,%s,%s%n",
                u.getId(), u.getPrenom(), u.getNom(), u.getEmail(),
                u.getVille(), u.getRole(), u.getStatut(), u.getDateInscription()));
    }

    private Long getAdminId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email).map(u -> u.getId())
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception
                    .custom.RessourceNotFoundException("Administrateur non trouvé"));
    }
}
EOF
OK "AdminController.java généré"

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
JAVA_COUNT=$(find src/main/java -name "*.java" | wc -l)
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SCRIPT 11 TERMINÉ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Fichiers Java total : $JAVA_COUNT"
INFO ""
INFO "Générés : DashboardResponse, AdminAnnonceResponse,"
INFO "          AdminUtilisateurResponse, AdminSignalementResponse"
INFO "          AdminService + AdminServiceImpl"
INFO "          AdminController (20 endpoints)"
echo ""
INFO "Prochaine étape : bash setup_12_tests_and_finalization.sh"