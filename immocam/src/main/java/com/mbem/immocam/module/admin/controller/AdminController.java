package com.mbem.immocam.module.admin.controller;

import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.admin.dto.request.AdminCreateTypeBienRequest;
import com.mbem.immocam.module.admin.dto.request.AdminCreateUtilisateurRequest;
import com.mbem.immocam.module.admin.dto.request.AdminCreateVilleRequest;
import com.mbem.immocam.module.admin.dto.request.AdminUpdateRoleRequest;
import com.mbem.immocam.module.admin.dto.response.AdminAnnonceResponse;
import com.mbem.immocam.module.admin.dto.response.AdminSignalementResponse;
import com.mbem.immocam.module.admin.dto.response.AdminUtilisateurResponse;
import com.mbem.immocam.module.admin.dto.response.DashboardResponse;
import com.mbem.immocam.module.admin.service.AdminService;
import com.mbem.immocam.module.commentaire.repository.CommentaireRepository;
import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.typebien.entity.TypeBien;
import com.mbem.immocam.shared.enums.StatutSignalement;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import com.mbem.immocam.shared.enums.StatutSignalement;
import com.mbem.immocam.shared.pagination.PageResponse;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
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
            @RequestParam(required = false) String quartier,
            @RequestParam(required = false) String recherche,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        int safeTaille = normaliserTaille(taille, 20, ImmoCamConstants.ADMIN_PAGE_SIZE_MAX);
        PageResponse<AdminAnnonceResponse> result = adminService.listerAnnonces(
                ville, typeBienId, proprietaireId, statut, quartier, recherche,
                PageRequest.of(page, safeTaille, Sort.by(Sort.Direction.DESC, "dateCreation")));
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
        int safeTaille = normaliserTaille(taille, 20, ImmoCamConstants.ADMIN_PAGE_SIZE_MAX);
        PageResponse<AdminUtilisateurResponse> result = adminService.listerUtilisateurs(
                terme, PageRequest.of(page, safeTaille, Sort.by(Sort.Direction.DESC, "dateCreation")));
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

   // Remplacer la méthode signalements() et traiterSignalement() :

@Operation(summary = "Liste des signalements — statut optionnel")
@GetMapping("/signalements")
public ResponseEntity<ApiResponse<PageResponse<AdminSignalementResponse>>> signalements(
        @RequestParam(required = false) String statut,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int taille) {
    int safeTaille = normaliserTaille(taille, 20, ImmoCamConstants.ADMIN_PAGE_SIZE_MAX);
    // Si statut null ou vide → retourner EN_ATTENTE par défaut
    StatutSignalement statutEnum = (statut != null && !statut.isBlank())
            ? StatutSignalement.valueOf(statut)
            : StatutSignalement.EN_ATTENTE;
    PageResponse<AdminSignalementResponse> result = adminService.listerSignalements(
            statutEnum,
            PageRequest.of(page, safeTaille, Sort.by(Sort.Direction.DESC, "dateCreation")));
    return ResponseEntity.ok(ApiResponse.ok(result));
}

@Operation(summary = "Traiter un signalement")
@PatchMapping("/signalements/{id}/traiter")
public ResponseEntity<ApiResponse<Void>> traiterSignalement(
        @PathVariable Long id,
        @RequestParam String decision) {
    // decision doit être une valeur valide de StatutSignalement
    StatutSignalement statut;
    try {
        statut = StatutSignalement.valueOf(decision);
    } catch (IllegalArgumentException e) {
        throw new IllegalArgumentException(
            "Décision invalide : '" + decision + "'. Valeurs acceptées : " +
            "IGNORE, TRAITE_INFO, TRAITE_PAUSE, TRAITE_SUPPRESSION, TRAITE_SUSPENSION, TRAITE_BANNISSEMENT");
    }
    adminService.traiterSignalement(id, getAdminId(), statut);
    return ResponseEntity.ok(ApiResponse.message("Signalement traité."));
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

    @Operation(summary = "Parametres de configuration (vue a plat)")
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<com.mbem.immocam.module.admin.dto.response.ConfigSystemeResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getConfigSysteme()));
    }

    @Operation(summary = "Modifier un parametre de configuration")
    @PatchMapping("/config/{cle}")
    public ResponseEntity<ApiResponse<Void>> updateConfig(
            @PathVariable String cle, @RequestParam String valeur) {
        adminService.mettreAJourConfig(cle, valeur, getAdminId());
        return ResponseEntity.ok(ApiResponse.message("Configuration mise a jour."));
    }

    @Operation(summary = "Creer une ville")
    @PostMapping("/villes")
    public ResponseEntity<ApiResponse<Localisation>> creerVille(
            @Valid @RequestBody AdminCreateVilleRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.creerVille(request, getAdminId())));
    }

    @Operation(summary = "Modifier une ville")
    @PutMapping("/villes/{id}")
    public ResponseEntity<ApiResponse<Localisation>> modifierVille(
            @PathVariable Long id, @Valid @RequestBody AdminCreateVilleRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.modifierVille(id, request, getAdminId())));
    }

    @Operation(summary = "Activer/desactiver une ville")
    @PatchMapping("/villes/{id}/active")
    public ResponseEntity<ApiResponse<Void>> basculerVille(
            @PathVariable Long id, @RequestParam boolean active) {
        adminService.basculerVilleActive(id, active, getAdminId());
        return ResponseEntity.ok(ApiResponse.message("Ville mise a jour."));
    }

    @Operation(summary = "Creer un type de bien")
    @PostMapping("/types-biens")
    public ResponseEntity<ApiResponse<TypeBien>> creerTypeBien(
            @Valid @RequestBody AdminCreateTypeBienRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.creerTypeBien(request, getAdminId())));
    }

    @Operation(summary = "Modifier un type de bien")
    @PutMapping("/types-biens/{id}")
    public ResponseEntity<ApiResponse<TypeBien>> modifierTypeBien(
            @PathVariable Long id, @Valid @RequestBody AdminCreateTypeBienRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.modifierTypeBien(id, request, getAdminId())));
    }

    @Operation(summary = "Admin - Modifier le quartier d'une annonce")
@PatchMapping("/annonces/{id}/quartier")
public ResponseEntity<ApiResponse<Void>> modifierQuartierAnnonce(
        @PathVariable Long id,
        @RequestParam String quartier) {
    adminService.modifierQuartierAnnonce(id, quartier, getAdminId());
    return ResponseEntity.ok(ApiResponse.message("Quartier modifié avec succès"));
}

    @Operation(summary = "Activer/desactiver un type de bien")
    @PatchMapping("/types-biens/{id}/actif")
    public ResponseEntity<ApiResponse<Void>> basculerTypeBien(
            @PathVariable Long id, @RequestParam boolean actif) {
        adminService.basculerTypeBienActif(id, actif, getAdminId());
        return ResponseEntity.ok(ApiResponse.message("Type de bien mis a jour."));
    }

    @Operation(summary = "Creer un utilisateur avec role")
    @PostMapping("/utilisateurs")
    public ResponseEntity<ApiResponse<AdminUtilisateurResponse>> creerUtilisateur(
            @Valid @RequestBody AdminCreateUtilisateurRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.creerUtilisateur(request, getAdminId())));
    }

    @Operation(summary = "Modifier le role d'un utilisateur")
    @PatchMapping("/utilisateurs/{id}/role")
    public ResponseEntity<ApiResponse<Void>> modifierRole(
            @PathVariable Long id, @Valid @RequestBody AdminUpdateRoleRequest request) {
        adminService.modifierRoleUtilisateur(id, request.getRole(), getAdminId());
        return ResponseEntity.ok(ApiResponse.message("Role utilisateur modifie."));
    }

    // ── Exports PDF ───────────────────────────────────────────────────────

    @Operation(summary = "Export PDF des annonces")
    @GetMapping("/rapports/export/annonces/pdf")
    public void exportAnnoncesPdf(HttpServletResponse response) throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=annonces.pdf");

        List<AdminAnnonceResponse> annonces = adminService
                .listerAnnonces(null, null, null, null, null, null, PageRequest.of(0, Integer.MAX_VALUE))
                .getContenu();

        String[] entetes = {"ID", "Type", "Ville", "Quartier", "Prix (FCFA)", "Statut", "Vues",
                "Contacts", "Signalements", "Publication", "Proprietaire"};
        java.util.List<String[]> lignes = new java.util.ArrayList<>();
        for (AdminAnnonceResponse a : annonces) {
            lignes.add(new String[]{
                    String.valueOf(a.getId()), a.getTypeBien(), a.getVille(),
                    a.getQuartier() != null ? a.getQuartier() : "",
                    String.format("%.0f", a.getPrix()), a.getStatut(),
                    String.valueOf(a.getNombreVues()), String.valueOf(a.getNombreContacts()),
                    String.valueOf(a.getNombreSignalements()),
                    a.getDatePublication() != null ? a.getDatePublication().toLocalDate().toString() : "",
                    a.getProprietaireNom() + " (" + a.getProprietaireEmail() + ")"
            });
        }
        genererPdf(response.getOutputStream(), "Export des annonces — ImmoCam", entetes, lignes);
    }

    @Operation(summary = "Export PDF des utilisateurs")
    @GetMapping("/rapports/export/utilisateurs/pdf")
    public void exportUtilisateursPdf(HttpServletResponse response) throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=utilisateurs.pdf");

        List<AdminUtilisateurResponse> utilisateurs = adminService
                .listerUtilisateurs(null, PageRequest.of(0, Integer.MAX_VALUE))
                .getContenu();

        String[] entetes = {"ID", "Prenom", "Nom", "Email", "Ville", "Role", "Statut",
                "Inscription", "Annonces actives", "Annonces total"};
        java.util.List<String[]> lignes = new java.util.ArrayList<>();
        for (AdminUtilisateurResponse u : utilisateurs) {
            lignes.add(new String[]{
                    String.valueOf(u.getId()), u.getPrenom(), u.getNom(), u.getEmail(),
                    u.getVille(), u.getRole(), u.getStatut(),
                    u.getDateInscription() != null ? u.getDateInscription().toLocalDate().toString() : "",
                    String.valueOf(u.getNombreAnnoncesActives()), String.valueOf(u.getNombreAnnoncesTotal())
            });
        }
        genererPdf(response.getOutputStream(), "Export des utilisateurs — ImmoCam", entetes, lignes);
    }

    private void genererPdf(java.io.OutputStream out, String titre, String[] entetes, java.util.List<String[]> lignes) {
        com.lowagie.text.Document document = new com.lowagie.text.Document(com.lowagie.text.PageSize.A4.rotate());
        try {
            com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
            document.open();
            com.lowagie.text.Font titreFont = com.lowagie.text.FontFactory.getFont(
                    com.lowagie.text.FontFactory.HELVETICA_BOLD, 16);
            document.add(new com.lowagie.text.Paragraph(titre, titreFont));
            document.add(new com.lowagie.text.Paragraph(" "));

            com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(entetes.length);
            table.setWidthPercentage(100);
            com.lowagie.text.Font enteteFont = com.lowagie.text.FontFactory.getFont(
                    com.lowagie.text.FontFactory.HELVETICA_BOLD, 9, java.awt.Color.WHITE);
            for (String entete : entetes) {
                com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(
                        new com.lowagie.text.Paragraph(entete, enteteFont));
                cell.setBackgroundColor(new java.awt.Color(30, 80, 150));
                cell.setPadding(5);
                table.addCell(cell);
            }
            com.lowagie.text.Font ligneFont = com.lowagie.text.FontFactory.getFont(
                    com.lowagie.text.FontFactory.HELVETICA, 8);
            for (String[] ligne : lignes) {
                for (String valeur : ligne) {
                    com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(
                            new com.lowagie.text.Paragraph(valeur != null ? valeur : "", ligneFont));
                    cell.setPadding(4);
                    table.addCell(cell);
                }
            }
            document.add(table);
        } catch (com.lowagie.text.DocumentException e) {
            throw new RuntimeException("Erreur lors de la generation du PDF", e);
        } finally {
            document.close();
        }
    }

    // ── Helper privé ──────────────────────────────────────────────────────

    private Long getAdminId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new RessourceNotFoundException("Administrateur non trouve"));
    }

    private int normaliserTaille(int taille, int valeurParDefaut, int max) {
        if (taille <= 0) return valeurParDefaut;
        return Math.min(taille, max);
    }
}
