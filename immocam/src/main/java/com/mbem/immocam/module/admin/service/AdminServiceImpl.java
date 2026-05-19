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

    // ── Dashboard ─────────────────────────────────────────────────────────────

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
                // ✅ méthode dédiée sans filtre proprietaireId (usage admin global)
                .annoncesActives(annonceRepository.countByStatutAndDeletedFalse(StatutAnnonce.ACTIVE))
                .signalementsEnAttente(signalementRepository.countByStatut(StatutSignalement.EN_ATTENTE))
                .utilisateursActifs(utilisateurRepository.countByStatut(StatutCompte.ACTIF))
                .utilisateursSuspendus(utilisateurRepository.countByStatut(StatutCompte.SUSPENDU))
                .build();
    }

    // ── Annonces ──────────────────────────────────────────────────────────────

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
                .quartier(a.getQuartier())
                .prix(a.getPrix())
                .statut(a.getStatut().name())
                .nombreVues(a.getNombreVues())
                // ✅ countByAnnonceId filtre déjà le proprio en base
                .nombreContacts(contactRepository.countByAnnonceId(a.getId()))
                .datePublication(a.getDateCreation())
                .dateExpiration(a.getDateExpiration())
                .proprietaireId(a.getProprietaire().getId())
                .proprietaireNom(a.getProprietaire().getNomComplet())
                .proprietaireEmail(a.getProprietaire().getEmail())
                .nombreSignalements(signalementRepository.countByAnnonceId(a.getId()))
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

    // ── Utilisateurs ──────────────────────────────────────────────────────────

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
                // ✅ countByProprietaireId supprimée → remplacée par countByProprietaireIdAndDeletedFalse
                .nombreAnnoncesTotal(annonceRepository.countByProprietaireIdAndDeletedFalse(u.getId()))
                .build()));
    }

    @Override
    @Transactional
    public void suspendreUtilisateur(Long utilisateurId, Long adminId, String motif) {
        Utilisateur u = obtenirUtilisateur(utilisateurId);
        u.setStatut(StatutCompte.SUSPENDU);
        u.setMotifSuspension(motif);
        u.setDateSuspension(LocalDateTime.now());
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
        annonceRepository.findByProprietaireIdAndDeletedFalse(utilisateurId, Pageable.unpaged())
                .getContent().forEach(a -> {
                    a.setStatut(StatutAnnonce.SUPPRIMEE_ADMIN);
                    a.setDeleted(true);
                });

        logActiviteService.log(adminId, TypeAction.BANNISSEMENT_UTILISATEUR,
                "Utilisateur", utilisateurId, null, "Motif: " + motif);
    }

    @Override
    @Transactional
    public void activerUtilisateur(Long utilisateurId, Long adminId) {
        Utilisateur u = obtenirUtilisateur(utilisateurId);
        u.setStatut(StatutCompte.ACTIF);
        u.setMotifSuspension(null);
        annonceRepository.findByProprietaireIdAndDeletedFalse(utilisateurId, Pageable.unpaged())
                .getContent().stream()
                .filter(a -> StatutAnnonce.EN_PAUSE.equals(a.getStatut()))
                .forEach(a -> a.setStatut(StatutAnnonce.ACTIVE));

        emailService.envoyerCompteReactive(u.getEmail(), u.getPrenom());
        logActiviteService.log(adminId, TypeAction.REACTIVATION_UTILISATEUR,
                "Utilisateur", utilisateurId, null, null);
    }

    // ── Signalements ──────────────────────────────────────────────────────────

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
                .motif(s.getMotif())
                .details(s.getDescription())
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

    // ── Configuration ─────────────────────────────────────────────────────────

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

    // ── Helpers privés ────────────────────────────────────────────────────────

    private Utilisateur obtenirUtilisateur(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", id));
    }
}