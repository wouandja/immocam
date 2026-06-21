package com.mbem.immocam.module.admin.service;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.email.service.EmailService;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.module.admin.dto.request.AdminCreateTypeBienRequest;
import com.mbem.immocam.module.admin.dto.request.AdminCreateUtilisateurRequest;
import com.mbem.immocam.module.admin.dto.request.AdminCreateVilleRequest;
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
import com.mbem.immocam.module.config.service.ConfigSystemeService;
import com.mbem.immocam.module.contact.repository.ContactWhatsAppRepository;
import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
import com.mbem.immocam.module.signalement.entity.Signalement;
import com.mbem.immocam.module.signalement.repository.SignalementRepository;
import com.mbem.immocam.module.typebien.entity.TypeBien;
import com.mbem.immocam.module.typebien.repository.TypeBienRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.RoleUtilisateur;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.enums.StatutCompte;
import com.mbem.immocam.shared.enums.StatutSignalement;
import com.mbem.immocam.shared.enums.TypeAction;
import com.mbem.immocam.shared.pagination.PageResponse;
import com.mbem.immocam.shared.utils.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final LocalisationRepository localisationRepository;
    private final TypeBienRepository typeBienRepository;
    private final EmailService emailService;
    private final LogActiviteService logActiviteService;
    private final PasswordEncoder passwordEncoder;
    private final ConfigSystemeService configSystemeService;

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
                .utilisateursTotal(utilisateurRepository.count())
                .contactsWhatsAppTotal(contactRepository.count())
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
    return PageResponse.from(page.map(s -> {
        Annonce a = s.getAnnonce();
        Utilisateur auteur = s.getAuteur();
        return AdminSignalementResponse.builder()
                .id(s.getId())
                .annonceId(a.getId())
                // Annonce
                .typeBienAnnonce(a.getTypeBien().getLibelle())
                .villeAnnonce(a.getLocalisation().getVille())
                .quartierAnnonce(a.getQuartier())
                .prixAnnonce(a.getPrix())
                .statutAnnonce(a.getStatut().name())
                .proprietaireId(a.getProprietaire().getId())
                .proprietaireNom(a.getProprietaire().getNomComplet())
                .proprietaireEmail(a.getProprietaire().getEmail())
                .proprietaireTelephone(PhoneUtils.masquer(a.getProprietaire().getTelephone()))
                // Signalement
                .motif(s.getMotif())
                .details(s.getDescription())
                .statut(s.getStatut().name())
                // Auteur du signalement
                .auteurId(auteur.getId())
                .auteurEmail(auteur.getEmail())
                .auteurPrenom(auteur.getPrenom())
                .auteurNom(auteur.getNom())
                .auteurVille(auteur.getVille())
                .auteurTelephone(PhoneUtils.masquer(auteur.getTelephone()))
                .dateSignalement(s.getDateCreation())
                .build();
    }));
}

// traiterSignalement — gérer TRAITE_PAUSE en plus
@Override
@Transactional
public void traiterSignalement(Long signalementId, Long adminId, StatutSignalement decision) {
    Signalement s = signalementRepository.findById(signalementId)
            .orElseThrow(() -> new RessourceNotFoundException("Signalement", signalementId));
    Utilisateur admin = obtenirUtilisateur(adminId);
    s.setStatut(decision);
    s.setTraiteParAdmin(admin);
    s.setDateTraitement(LocalDateTime.now());

    switch (decision) {
        case TRAITE_SUPPRESSION ->
            supprimerAnnonce(s.getAnnonce().getId(), adminId, "Signalement validé — suppression");
        case TRAITE_PAUSE ->
            mettreEnPauseAnnonce(s.getAnnonce().getId(), adminId);
        case TRAITE_SUSPENSION ->
            suspendreUtilisateur(s.getAnnonce().getProprietaire().getId(),
                    adminId, "Signalement validé — suspension");
        case TRAITE_BANNISSEMENT ->
            bannirUtilisateur(s.getAnnonce().getProprietaire().getId(),
                    adminId, "Signalement validé — bannissement");
        case TRAITE_INFO, IGNORE -> { /* note ou ignoré, aucune action */ }
        default -> { }
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
        validerConfig(cle, valeur);
        config.setValeur(valeur);
        config.setModifiePar(obtenirUtilisateur(adminId));
        configSystemeService.evictAll();
        logActiviteService.log(adminId, TypeAction.MODIFICATION_CONFIG_SYSTEME,
                "Config", null, null, cle + "=" + valeur);
    }

    @Override
    @Transactional
    public Localisation creerVille(AdminCreateVilleRequest request, Long adminId) {
        String ville = request.getVille().trim();
        if (localisationRepository.existsByVilleIgnoreCase(ville)) {
            throw new DoublonException("Cette ville existe deja");
        }
        Localisation localisation = Localisation.builder()
                .ville(ville)
                .estActive(true)
                .estPreChargee(false)
                .build();
        Localisation saved = localisationRepository.save(localisation);
        logActiviteService.log(adminId, TypeAction.AJOUT_VILLE, "Localisation", saved.getId(), null, ville);
        return saved;
    }

    @Override
    @Transactional
    public Localisation modifierVille(Long id, AdminCreateVilleRequest request, Long adminId) {
        Localisation ville = localisationRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Ville", id));
        String newValue = request.getVille().trim();
        if (!ville.getVille().equalsIgnoreCase(newValue)
                && localisationRepository.existsByVilleIgnoreCase(newValue)) {
            throw new DoublonException("Cette ville existe deja");
        }
        ville.setVille(newValue);
        logActiviteService.log(adminId, TypeAction.MODIFICATION_CONFIG_SYSTEME, "Localisation", id, null, newValue);
        return ville;
    }

    @Override
    @Transactional
    public void basculerVilleActive(Long id, boolean active, Long adminId) {
        Localisation ville = localisationRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Ville", id));
        ville.setEstActive(active);
        logActiviteService.log(adminId, TypeAction.MODIFICATION_CONFIG_SYSTEME, "Localisation", id, null, "active=" + active);
    }

    @Override
    @Transactional
    public TypeBien creerTypeBien(AdminCreateTypeBienRequest request, Long adminId) {
        String libelle = request.getLibelle().trim();
        if (typeBienRepository.existsByLibelleIgnoreCase(libelle)) {
            throw new DoublonException("Ce type de bien existe deja");
        }
        TypeBien typeBien = TypeBien.builder().libelle(libelle).estActif(true).build();
        TypeBien saved = typeBienRepository.save(typeBien);
        logActiviteService.log(adminId, TypeAction.AJOUT_TYPE_BIEN, "TypeBien", saved.getId(), null, libelle);
        return saved;
    }

    @Override
    @Transactional
    public TypeBien modifierTypeBien(Long id, AdminCreateTypeBienRequest request, Long adminId) {
        TypeBien typeBien = typeBienRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Type de bien", id));
        String libelle = request.getLibelle().trim();
        if (!typeBien.getLibelle().equalsIgnoreCase(libelle)
                && typeBienRepository.existsByLibelleIgnoreCase(libelle)) {
            throw new DoublonException("Ce type de bien existe deja");
        }
        typeBien.setLibelle(libelle);
        logActiviteService.log(adminId, TypeAction.MODIFICATION_CONFIG_SYSTEME, "TypeBien", id, null, libelle);
        return typeBien;
    }

    @Override
    @Transactional
    public void basculerTypeBienActif(Long id, boolean actif, Long adminId) {
        TypeBien typeBien = typeBienRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Type de bien", id));
        typeBien.setEstActif(actif);
        logActiviteService.log(adminId, TypeAction.MODIFICATION_CONFIG_SYSTEME, "TypeBien", id, null, "actif=" + actif);
    }

    @Override
    @Transactional
    public AdminUtilisateurResponse creerUtilisateur(AdminCreateUtilisateurRequest request, Long adminId) {
        String email = request.getEmail().trim().toLowerCase();
        String telephone = PhoneUtils.normaliser(request.getTelephone());
        if (utilisateurRepository.existsByEmail(email)) {
            throw new DoublonException("Email deja utilise");
        }
        if (utilisateurRepository.existsByTelephone(telephone)) {
            throw new DoublonException("Telephone deja utilise");
        }
        Utilisateur user = Utilisateur.builder()
                .prenom(request.getPrenom().trim())
                .nom(request.getNom().trim())
                .email(email)
                .telephone(telephone)
                .ville(request.getVille().trim())
                .motDePasseHash(passwordEncoder.encode(request.getMotDePasse()))
                .role(request.getRole())
                .statut(StatutCompte.ACTIF)
                .politiqueAcceptee(true)
                .dateAcceptationPolitique(LocalDateTime.now())
                .build();
        Utilisateur saved = utilisateurRepository.save(user);
        logActiviteService.log(adminId, TypeAction.INSCRIPTION, "Utilisateur", saved.getId(), null, "creation admin");
        return AdminUtilisateurResponse.builder()
                .id(saved.getId())
                .prenom(saved.getPrenom())
                .nom(saved.getNom())
                .email(saved.getEmail())
                .telephoneMasque(PhoneUtils.masquer(saved.getTelephone()))
                .ville(saved.getVille())
                .role(saved.getRole().name())
                .statut(saved.getStatut().name())
                .dateInscription(saved.getDateCreation())
                .nombreAnnoncesActives(0)
                .nombreAnnoncesTotal(0)
                .build();
    }

    @Override
    @Transactional
    public void modifierRoleUtilisateur(Long utilisateurId, RoleUtilisateur role, Long adminId) {
        Utilisateur utilisateur = obtenirUtilisateur(utilisateurId);
        utilisateur.setRole(role);
        logActiviteService.log(adminId, TypeAction.MODIFICATION_CONFIG_SYSTEME, "Utilisateur", utilisateurId, null, "role=" + role.name());
    }

    // ── Helpers privés ────────────────────────────────────────────────────────

    private Utilisateur obtenirUtilisateur(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", id));
    }

    private void validerConfig(String cle, String valeur) {
        try {
            switch (cle) {
                case "DUREE_VIE_ANNONCE_JOURS", "DELAI_RAPPEL_JOURS", "DELAI_RAPPEL_FINAL_JOURS",
                     "DELAI_SUPPRESSION_JOURS", "MAX_PHOTOS_PAR_ANNONCE", "MAX_TAILLE_PHOTO_MO",
                     "MAX_ANNONCES_PAR_PROPRIO", "MAX_CONNEXIONS_ECHOUEES", "DUREE_BLOCAGE_MINUTES" -> {
                    int i = Integer.parseInt(valeur);
                    if (i <= 0) throw new IllegalArgumentException("La valeur doit etre > 0");
                }
                case "MSG_WHATSAPP" -> {
                    if (valeur == null || valeur.isBlank()) {
                        throw new IllegalArgumentException("Le message WhatsApp ne peut pas etre vide");
                    }
                }
                default -> {
                }
            }
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Valeur numerique invalide pour " + cle);
        }
    }

     @Override    
     @Transactional
    public void modifierQuartierAnnonce(Long annonceId, String quartier, Long adminId) {
    Annonce annonce = annonceRepository.findById(annonceId)
            .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));
    
    if (quartier == null || quartier.isBlank()) {
        throw new IllegalArgumentException("Le quartier ne peut pas être vide");
    }
    
    annonce.setQuartier(quartier);
    logActiviteService.log(adminId, TypeAction.MODIFICATION_ANNONCE, 
            "Admin - Modification quartier annonce", annonceId, null, null);
}
}
