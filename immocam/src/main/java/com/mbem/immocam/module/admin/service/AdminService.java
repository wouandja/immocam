package com.mbem.immocam.module.admin.service;

import com.mbem.immocam.module.admin.dto.request.AdminCreateTypeBienRequest;
import com.mbem.immocam.module.admin.dto.request.AdminCreateUtilisateurRequest;
import com.mbem.immocam.module.admin.dto.request.AdminCreateVilleRequest;
import com.mbem.immocam.module.admin.dto.response.AdminAnnonceResponse;
import com.mbem.immocam.module.admin.dto.response.AdminSignalementResponse;
import com.mbem.immocam.module.admin.dto.response.AdminUtilisateurResponse;
import com.mbem.immocam.module.admin.dto.response.DashboardResponse;
import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.typebien.entity.TypeBien;
import com.mbem.immocam.shared.enums.RoleUtilisateur;
import com.mbem.immocam.shared.enums.StatutSignalement;
import com.mbem.immocam.shared.pagination.PageResponse;
import org.springframework.data.domain.Pageable;

public interface AdminService {

    DashboardResponse getDashboard();

    PageResponse<AdminAnnonceResponse> listerAnnonces(String ville, Long typeBienId,
                                                       Long proprietaireId, String statut,
                                                       Pageable pageable);

    void supprimerAnnonce(Long annonceId, Long adminId, String motif);

    void mettreEnPauseAnnonce(Long annonceId, Long adminId);

    void reactiverAnnonce(Long annonceId, Long adminId);

    PageResponse<AdminUtilisateurResponse> listerUtilisateurs(String terme, Pageable pageable);

    void suspendreUtilisateur(Long utilisateurId, Long adminId, String motif);

    void bannirUtilisateur(Long utilisateurId, Long adminId, String motif);

    void activerUtilisateur(Long utilisateurId, Long adminId);

    PageResponse<AdminSignalementResponse> listerSignalements(
            StatutSignalement statut, Pageable pageable);

    void traiterSignalement(Long signalementId, Long adminId, StatutSignalement decision);

    void mettreAJourConfig(String cle, String valeur, Long adminId);

    Localisation creerVille(AdminCreateVilleRequest request, Long adminId);

    Localisation modifierVille(Long id, AdminCreateVilleRequest request, Long adminId);

    void basculerVilleActive(Long id, boolean active, Long adminId);

    TypeBien creerTypeBien(AdminCreateTypeBienRequest request, Long adminId);

    TypeBien modifierTypeBien(Long id, AdminCreateTypeBienRequest request, Long adminId);

    void basculerTypeBienActif(Long id, boolean actif, Long adminId);

    AdminUtilisateurResponse creerUtilisateur(AdminCreateUtilisateurRequest request, Long adminId);

    void modifierRoleUtilisateur(Long utilisateurId, RoleUtilisateur role, Long adminId);

    // À ajouter dans AdminService.java
   void modifierQuartierAnnonce(Long annonceId, String quartier, Long adminId);
}
