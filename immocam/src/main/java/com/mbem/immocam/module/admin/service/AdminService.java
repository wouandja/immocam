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
