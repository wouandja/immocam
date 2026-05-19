package com.mbem.immocam.module.admin.controller;

import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.admin.dto.response.AdminAnnonceResponse;
import com.mbem.immocam.module.admin.dto.response.AdminSignalementResponse;
import com.mbem.immocam.module.admin.dto.response.AdminUtilisateurResponse;
import com.mbem.immocam.module.admin.dto.response.DashboardResponse;
import com.mbem.immocam.module.admin.service.AdminService;
import com.mbem.immocam.module.commentaire.repository.CommentaireRepository;
import com.mbem.immocam.module.config.repository.ConfigSystemeRepository;
import com.mbem.immocam.module.config.entity.ConfigSysteme;
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
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasAuthority('ADMINISTRATEUR')")
@RequiredArgsConstructor
@Tag(name = "Administration", description = "Interface admin — ADMINISTRATEUR requis")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;
    private final CommentaireRepository commentaireRepository;
    private final ConfigSystemeRepository configRepository;
    private final UtilisateurRepository utilisateurRepository;

    // ── Dashboard ─────────────────────────────────────────────────────────

    @Operation(summary = "Dashboard — Statistiques temps reel")
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
        return ResponseEntity.ok(ApiResponse.message("Annonce supprimee. Proprietaire notifie."));
    }

    @Operation(summary = "Mettre en pause une annonce")
    @PatchMapping("/annonces/{id}/pause")
    public ResponseEntity<ApiResponse<Void>> pauseAnnonce(@PathVariable Long id) {
        adminService.mettreEnPauseAnnonce(id, getAdminId());
        return ResponseEntity.ok(ApiResponse.message("Annonce mise en pause."));
    }

    @Operation(summary = "Reactiver une annonce")
    @PatchMapping("/annonces/{id}/reactiver")
    public ResponseEntity<ApiResponse<Void>> reactiverAnnonce(@PathVariable Long id) {
        adminService.reactiverAnnonce(id, getAdminId());
        return ResponseEntity.ok(ApiResponse.message("Annonce reactivee."));
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
        return ResponseEntity.ok(ApiResponse.message("Compte suspendu. Utilisateur notifie."));
    }

    @Operation(summary = "Bannir definitivement un compte")
    @PatchMapping("/utilisateurs/{id}/bannir")
    public ResponseEntity<ApiResponse<Void>> bannir(
            @PathVariable Long id, @RequestParam String motif) {
        adminService.bannirUtilisateur(id, getAdminId(), motif);
        return ResponseEntity.ok(ApiResponse.message("Compte banni definitivement."));
    }

    @Operation(summary = "Reactiver un compte suspendu")
    @PatchMapping("/utilisateurs/{id}/activer")
    public ResponseEntity<ApiResponse<Void>> activer(@PathVariable Long id) {
        adminService.activerUtilisateur(id, getAdminId());
        return ResponseEntity.ok(ApiResponse.message("Compte reactive. Utilisateur notifie."));
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
        return ResponseEntity.ok(ApiResponse.message("Signalement traite."));
    }

    // ── Commentaires ──────────────────────────────────────────────────────

    @Operation(summary = "Supprimer un commentaire (moderation)")
    @DeleteMapping("/commentaires/{id}")
    public ResponseEntity<ApiResponse<Void>> supprimerCommentaire(@PathVariable Long id) {
        commentaireRepository.findById(id).ifPresent(c -> {
            c.setEstSupprime(true);
            c.setSupprimeParAdmin(true);
            c.setContenu("[Supprime par l'administration]");
            commentaireRepository.save(c);
        });
        return ResponseEntity.ok(ApiResponse.message("Commentaire supprime."));
    }

    // ── Configuration ─────────────────────────────────────────────────────

    @Operation(summary = "Liste des parametres de configuration")
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<List<ConfigSysteme>>> getConfig() {
        return ResponseEntity.ok(ApiResponse.ok(configRepository.findAll()));
    }

    @Operation(summary = "Modifier un parametre de configuration")
    @PatchMapping("/config/{cle}")
    public ResponseEntity<ApiResponse<Void>> updateConfig(
            @PathVariable String cle, @RequestParam String valeur) {
        adminService.mettreAJourConfig(cle, valeur, getAdminId());
        return ResponseEntity.ok(ApiResponse.message("Configuration mise a jour."));
    }

    // ── Exports CSV ───────────────────────────────────────────────────────

    @Operation(summary = "Export CSV des annonces")
    @GetMapping("/rapports/export/annonces")
    public void exportAnnonces(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=annonces.csv");
        response.getOutputStream().write(0xEF);
        response.getOutputStream().write(0xBB);
        response.getOutputStream().write(0xBF);
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
        writer.println("ID,Prenom,Nom,Email,Ville,Role,Statut,DateInscription");
        adminService.listerUtilisateurs(null, PageRequest.of(0, Integer.MAX_VALUE))
                .getContenu().forEach(u -> writer.printf("%d,%s,%s,%s,%s,%s,%s,%s%n",
                        u.getId(), u.getPrenom(), u.getNom(), u.getEmail(),
                        u.getVille(), u.getRole(), u.getStatut(), u.getDateInscription()));
    }

    // ── Helper privé ──────────────────────────────────────────────────────

    private Long getAdminId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new RessourceNotFoundException("Administrateur non trouve"));
    }
}