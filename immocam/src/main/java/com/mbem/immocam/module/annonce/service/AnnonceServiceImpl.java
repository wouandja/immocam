package com.mbem.immocam.module.annonce.service;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.email.service.EmailService;
import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException;
import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.infrastructure.exception.custom.LimiteAtteintException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.annonce.dto.request.ModifierAnnonceRequest;
import com.mbem.immocam.module.annonce.dto.request.PublierAnnonceRequest;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDetailResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDashboardResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceListResponse;
import com.mbem.immocam.module.annonce.dto.response.DashboardStatsResponse;
import com.mbem.immocam.module.annonce.dto.response.PhotoResponse;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.mapper.AnnonceMapper;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.annonce.specification.AnnonceSpecification;
import com.mbem.immocam.module.commentaire.dto.response.CommentaireResponse;
import com.mbem.immocam.module.commentaire.repository.CommentaireRepository;
import com.mbem.immocam.module.contact.repository.ContactWhatsAppRepository;
import com.mbem.immocam.module.config.repository.ConfigSystemeRepository;
import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
import com.mbem.immocam.module.photo.repository.PhotoRepository;
import com.mbem.immocam.module.favori.repository.FavoriRepository;
import com.mbem.immocam.module.typebien.entity.TypeBien;
import com.mbem.immocam.module.typebien.repository.TypeBienRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.enums.TypeAction;
import com.mbem.immocam.shared.pagination.PageResponse;
import com.mbem.immocam.shared.utils.DateUtils;
import com.mbem.immocam.shared.utils.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implémentation du service annonces ImmoCam.
 *
 * Règles métier respectées :
 * - Publication directe sans modération (statut ACTIVE immédiatement)
 * - Limite 5 annonces actives par propriétaire (configurable admin)
 * - Détection de doublon avant publication
 * - Numéro WhatsApp jamais exposé dans les réponses API
 * - Vues et contacts ne comptent jamais les actions du propriétaire sur ses propres annonces
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnnonceServiceImpl implements AnnonceService {

    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final TypeBienRepository typeBienRepository;
    private final LocalisationRepository localisationRepository;
    private final com.mbem.immocam.module.localisation.service.QuartierService quartierService;
    private final PhotoRepository photoRepository;
    private final CommentaireRepository commentaireRepository;
    private final ContactWhatsAppRepository contactRepository;
    private final FavoriRepository favoriRepository;
    private final com.mbem.immocam.module.signalement.repository.SignalementRepository signalementRepository;
    private final AnnonceMapper annonceMapper;
    private final EmailService emailService;
    private final LogActiviteService logActiviteService;
    private final ConfigSystemeRepository configRepository;

    @Value("${immocam.storage.base-url:http://localhost:1010/api/uploads/annonces/}")
    private String storageBaseUrl;

    // ── Lecture publique ──────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AnnonceListResponse> listerAnnonces(
            String ville, String quartier, Long typeBienId,
            BigDecimal prixMin, BigDecimal prixMax, Pageable pageable) {

        Specification<Annonce> spec = AnnonceSpecification.filtrer(
                ville, quartier, typeBienId, prixMin, prixMax);
        Page<Annonce> page = annonceRepository.findAll(spec, pageable);

        Page<AnnonceListResponse> dtoPage = page.map(annonce -> {
            AnnonceListResponse dto = annonceMapper.toListResponse(annonce);
            dto.setPrixFormate(formatterPrix(annonce.getPrix()));
            photoRepository.findFirstByAnnonceIdAndPrincipaleTrue(annonce.getId())
                    .ifPresentOrElse(p -> {
                        dto.setPhotoPrincipale(construireUrl(p.getCheminStockage()));
                        dto.setPhotoPrincipaleThumb(construireUrl(p.getCheminStockage()) + "?thumb");
                        dto.setHasPhotos(true);
                    }, () -> dto.setHasPhotos(false));
            dto.setNombreCommentaires(
                    (int) commentaireRepository.countByAnnonceIdAndEstSupprimeFalse(annonce.getId()));
            return dto;
        });
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional
    public AnnonceDetailResponse obtenirDetail(Long id, Long utilisateurConnecteId) {
        // Un admin doit pouvoir consulter le détail de n'importe quelle annonce
        // (en pause, expirée, supprimée...) depuis l'interface de modération.
        boolean estAdmin = SecurityUtils.estAdmin();
        Annonce annonce = annonceRepository.findById(id)
                .filter(a -> !a.isDeleted() || estAdmin)
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", id));

        boolean estProprietaire = utilisateurConnecteId != null
                && utilisateurConnecteId.equals(annonce.getProprietaire().getId());
        // Une annonce non supprimée reste consultable même si elle n'est plus active
        // (en pause, expirée, archivée) — notamment pour revoir un favori plus tard.
        // Le filtre ci-dessus exclut déjà les annonces réellement supprimées pour les tiers.

        // ✅ Incrémenter les vues en excluant le propriétaire
        if (utilisateurConnecteId != null) {
            annonceRepository.incrementerVues(id, utilisateurConnecteId);
        } else {
            annonceRepository.incrementerVuesSansRestriction(id);
        }

        AnnonceDetailResponse dto = annonceMapper.toDetailResponse(annonce);
        dto.setPrixFormate(formatterPrix(annonce.getPrix()));
        dto.setDateExpirationFormatee(
                "Disponible jusqu'au " + annonce.getDateExpiration()
                        .format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        // Lien WhatsApp — uniquement si connecté et pas le proprio
        if (utilisateurConnecteId != null && !estProprietaire) {
            String msgTemplate = obtenirConfigValeur(
                    ImmoCamConstants.CONFIG_MSG_WHATSAPP,
                    "Bonjour, je vous contacte depuis ImmoCam concernant votre annonce.");
            String msgFinal = msgTemplate
                    .replace("{type}", annonce.getTypeBien().getLibelle())
                    .replace("{quartier}", annonce.getQuartier() != null ? annonce.getQuartier() : "")
                    .replace("{ville}", annonce.getLocalisation().getVille())
                    .replace("{prix}", formatterPrix(annonce.getPrix()))
                    .replace("{proprietaire}", annonce.getProprietaire().getPrenom());
            dto.setLienWhatsApp(PhoneUtils.construireLienWhatsApp(annonce.getNumeroWhatsApp(), msgFinal));
        }

        // ✅ Contacts : exclure le proprio (countByAnnonceId filtre déjà en base)
        dto.setNombreCommentaires(
                (int) commentaireRepository.countByAnnonceIdAndEstSupprimeFalse(id));
        dto.setNombreContacts((int) contactRepository.countByAnnonceId(id));

        dto.setEstMienne(estProprietaire);
        dto.setIsFavori(utilisateurConnecteId == null
                ? null
                : favoriRepository.existsByUtilisateurIdAndAnnonceId(utilisateurConnecteId, id));
        dto.setDejaSignalee(utilisateurConnecteId != null
                && signalementRepository.existsByAuteurIdAndAnnonceIdAndStatut(
                        utilisateurConnecteId, id, com.mbem.immocam.shared.enums.StatutSignalement.EN_ATTENTE));

        // Photos
        List<PhotoResponse> photos = photoRepository.findByAnnonceIdOrderByOrdreAsc(id)
                .stream()
                .map(p -> PhotoResponse.builder()
                        .id(p.getId())
                        .url(p.getUrl() != null ? p.getUrl() : construireUrl(p.getCheminStockage()))
                        .urlThumb(p.getUrlThumb() != null ? p.getUrlThumb()
                                : construireUrl(p.getCheminStockage()) + "?thumb")
                        .ordre(p.getOrdre())
                        .principale(p.isPrincipale())
                        .build())
                .collect(Collectors.toList());
        dto.setPhotos(photos);
        dto.setHasPhotos(!photos.isEmpty());

        photoRepository.findFirstByAnnonceIdAndPrincipaleTrue(id)
                .ifPresent(p -> {
                    dto.setPhotoPrincipale(p.getUrl() != null ? p.getUrl()
                            : construireUrl(p.getCheminStockage()));
                    dto.setPhotoPrincipaleThumb(p.getUrlThumb() != null ? p.getUrlThumb()
                            : construireUrl(p.getCheminStockage()) + "?thumb");
                });

        // Commentaires (top 20)
        List<CommentaireResponse> commentaireResponses = commentaireRepository
                .findTop20ByAnnonceIdOrderByDateCreationDesc(id)
                .stream()
                .map(c -> CommentaireResponse.builder()
                        .id(c.getId())
                        .auteurPrenom(c.getAuteur().getPrenom())
                        .contenu(c.getContenu())
                        .dateCreation(c.getDateCreation())
                        .estProprietaire(c.getAuteur().getId().equals(annonce.getProprietaire().getId()))
                        .estMien(utilisateurConnecteId != null
                                && utilisateurConnecteId.equals(c.getAuteur().getId()))
                        .build())
                .collect(Collectors.toList());
        dto.setCommentaires(commentaireResponses);

        // Annonces similaires (limit 4)
        Pageable limit4 = org.springframework.data.domain.PageRequest.of(0, 4);
        dto.setAnnoncesSimiliaires(
                annonceRepository.findAnnoncesSimiliaires(
                        id, annonce.getTypeBien().getId(),
                        annonce.getLocalisation().getVille(), limit4)
                        .stream()
                        .map(annonceMapper::toListResponse)
                        .collect(Collectors.toList()));

        return dto;
    }

    // ── Publication ───────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AnnonceDashboardResponse publier(PublierAnnonceRequest request,
            Long proprietaireId, String adresseIp) {
        Utilisateur proprietaire = utilisateurRepository.findById(proprietaireId)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", proprietaireId));
        TypeBien typeBien = typeBienRepository.findById(request.getTypeBienId())
                .orElseThrow(() -> new RessourceNotFoundException("Type de bien", request.getTypeBienId()));
        Localisation localisation = localisationRepository.findById(request.getLocalisationId())
                .orElseThrow(() -> new RessourceNotFoundException("Localisation", request.getLocalisationId()));

        int maxAnnonces = Integer.parseInt(obtenirConfigValeur(ImmoCamConstants.CONFIG_MAX_ANNONCES, "5"));
        long nbActives = annonceRepository.countActivesVisiblesByProprietaireId(
                proprietaireId, LocalDateTime.now());
        if (nbActives >= maxAnnonces) {
            throw new LimiteAtteintException(
                    "Vous avez atteint votre limite de " + maxAnnonces +
                            " annonces actives. Archivez ou supprimez une annonce existante.");
        }

        String telephone = (request.getNumeroWhatsApp() == null || request.getNumeroWhatsApp().isBlank())
                ? proprietaire.getTelephone()
                : PhoneUtils.normaliser(request.getNumeroWhatsApp());
        if (annonceRepository.existsDoublon(proprietaireId, request.getTypeBienId(),
                request.getLocalisationId(), request.getQuartier(), request.getPrix(), telephone)) {
            throw new DoublonException("Une annonce similaire existe déjà dans votre dashboard.");
        }

        int dureeJours = Integer.parseInt(
                obtenirConfigValeur(ImmoCamConstants.CONFIG_DUREE_VIE_ANNONCE, "30"));
        LocalDateTime maintenant = LocalDateTime.now();

        Annonce annonce = Annonce.builder()
                .description(request.getDescription())
                .prix(request.getPrix())
                .numeroWhatsApp(telephone)
                .statut(StatutAnnonce.ACTIVE)
                .proprietaire(proprietaire)
                .typeBien(typeBien)
                .localisation(localisation)
                .quartier(request.getQuartier())
                .dateExpiration(DateUtils.calculerExpiration(maintenant, dureeJours))
                .build();
        annonceRepository.save(annonce);
        quartierService.assurerExistance(localisation.getId(), request.getQuartier());

        emailService.envoyerConfirmationPublication(
                proprietaire.getEmail(), proprietaire.getPrenom(),
                typeBien.getLibelle(), localisation.getVille(),
                annonce.getQuartier() != null ? annonce.getQuartier() : "");
        logActiviteService.log(proprietaireId, TypeAction.PUBLICATION_ANNONCE,
                "Annonce", annonce.getId(), adresseIp, null);
        log.info("Annonce publiée id={} par userId={}", annonce.getId(), proprietaireId);

        return construireDashboardResponse(annonce);
    }

    // ── Modification ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AnnonceDashboardResponse modifier(Long id, ModifierAnnonceRequest request,
            Long proprietaireId) {
        Annonce annonce = obtenirAnnonceProprietaire(id, proprietaireId);

        if (request.getTypeBienId() != null)
            annonce.setTypeBien(typeBienRepository.findById(request.getTypeBienId())
                    .orElseThrow(() -> new RessourceNotFoundException("Type de bien", request.getTypeBienId())));
        if (request.getLocalisationId() != null)
            annonce.setLocalisation(localisationRepository.findById(request.getLocalisationId())
                    .orElseThrow(() -> new RessourceNotFoundException("Localisation", request.getLocalisationId())));
        if (request.getQuartier() != null) {
            annonce.setQuartier(request.getQuartier());
            quartierService.assurerExistance(annonce.getLocalisation().getId(), request.getQuartier());
        }
        if (request.getDescription() != null)
            annonce.setDescription(request.getDescription());
        if (request.getPrix() != null)
            annonce.setPrix(request.getPrix());
        if (request.getNumeroWhatsApp() != null && !request.getNumeroWhatsApp().isBlank())
            annonce.setNumeroWhatsApp(PhoneUtils.normaliser(request.getNumeroWhatsApp()));
 
        logActiviteService.log(proprietaireId, TypeAction.MODIFICATION_ANNONCE, "Annonce", id, null, null);
        return construireDashboardResponse(annonce);
    }

    // ── Cycle de vie ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void mettreEnPause(Long id, Long proprietaireId) {
        Annonce annonce = obtenirAnnonceProprietaire(id, proprietaireId);
        if (!StatutAnnonce.ACTIVE.equals(annonce.getStatut()))
            throw new IllegalArgumentException("Seules les annonces actives peuvent être mises en pause.");
        annonce.setStatut(StatutAnnonce.EN_PAUSE);
        logActiviteService.log(proprietaireId, TypeAction.PAUSE_ANNONCE, "Annonce", id, null, null);
    }

    @Override
    @Transactional
    public void reactiver(Long id, Long proprietaireId) {
        Annonce annonce = obtenirAnnonceProprietaire(id, proprietaireId);
        if (!StatutAnnonce.EN_PAUSE.equals(annonce.getStatut()))
            throw new IllegalArgumentException("Seules les annonces en pause peuvent être réactivées.");
        if (annonce.getMisEnPauseParId() != null)
            throw new AccesRefuseException(
                    "Cette annonce a été mise en pause par un administrateur. "
                    + "Seul un administrateur peut la réactiver. Contactez le support si besoin.");
        // Une annonce restée en pause longtemps peut avoir une date d'expiration
        // déjà dépassée : on la prolonge pour éviter de réactiver une annonce
        // "fantôme" (statut ACTIVE mais invisible car expirée).
        if (annonce.estExpiree()) {
            prolongerExpiration(annonce);
            envoyerEmailRenouvellement(annonce);
        }
        annonce.setStatut(StatutAnnonce.ACTIVE);
        logActiviteService.log(proprietaireId, TypeAction.REACTIVATION_ANNONCE, "Annonce", id, null, null);
    }

    @Override
    @Transactional
    public void renouveler(Long id, Long proprietaireId) {
        Annonce annonce = obtenirAnnonceProprietaire(id, proprietaireId);
        if (!StatutAnnonce.ACTIVE.equals(annonce.getStatut())
                && !StatutAnnonce.EXPIREE.equals(annonce.getStatut()))
            throw new IllegalArgumentException(
                    "Seules les annonces actives ou expirées peuvent être renouvelées.");
        prolongerExpiration(annonce);
        annonce.setStatut(StatutAnnonce.ACTIVE);
        logActiviteService.log(proprietaireId, TypeAction.RENOUVELLEMENT_ANNONCE, "Annonce", id, null, null);
        envoyerEmailRenouvellement(annonce);
    }

    @Override
    @Transactional
    public void archiver(Long id, Long proprietaireId) {
        Annonce annonce = obtenirAnnonceProprietaire(id, proprietaireId);
        if (StatutAnnonce.ARCHIVEE.equals(annonce.getStatut()))
            throw new IllegalArgumentException("Cette annonce est déjà archivée.");
        annonce.setStatut(StatutAnnonce.ARCHIVEE);
        logActiviteService.log(proprietaireId, TypeAction.ARCHIVAGE_ANNONCE, "Annonce", id, null, null);
    }

    @Override
    @Transactional
    public void supprimer(Long id, Long proprietaireId) {
        Annonce annonce = obtenirAnnonceProprietaire(id, proprietaireId);
        annonce.setStatut(StatutAnnonce.SUPPRIMEE);
        annonce.setDeleted(true);
        annonce.setDateSuppression(LocalDateTime.now());
        logActiviteService.log(proprietaireId, TypeAction.SUPPRESSION_ANNONCE, "Annonce", id, null, null);
    }

    // ── Dashboard propriétaire ────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AnnonceDashboardResponse> mesAnnonces(Long proprietaireId, Pageable pageable) {
        Page<Annonce> page = annonceRepository.findByProprietaireIdAndDeletedFalse(proprietaireId, pageable);
        return PageResponse.from(page.map(this::construireDashboardResponse));
    }



    @Override
@Transactional
public void desarchiver(Long id, Long proprietaireId) {
    Annonce annonce = obtenirAnnonceProprietaire(id, proprietaireId);
    if (!StatutAnnonce.ARCHIVEE.equals(annonce.getStatut()))
        throw new IllegalArgumentException("Seules les annonces archivées peuvent être désarchivées.");
    annonce.setStatut(StatutAnnonce.EN_PAUSE); // remet en pause, pas active direct
    logActiviteService.log(proprietaireId, TypeAction.REACTIVATION_ANNONCE, "Annonce", id, null, null);
}

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(Long proprietaireId) {
        long actives = annonceRepository.countActivesVisiblesByProprietaireId(
                proprietaireId, LocalDateTime.now());
        long total = annonceRepository.countByProprietaireIdAndDeletedFalse(proprietaireId);

        // ✅ Contacts et vues : le proprio est exclu directement en base
        long contacts = contactRepository.countContactsUniquesByProprietaireId(proprietaireId);
        long vues = annonceRepository.sumVuesByProprietaireId(proprietaireId);
   long favoris  = favoriRepository.countFavorisRealsByProprietaireId(proprietaireId);

        LocalDateTime dans7Jours = LocalDateTime.now().plusDays(7);
        List<AnnonceListResponse> expirantDtos = annonceRepository
                .findByProprietaireIdAndStatutAndDateExpirationBeforeAndDeletedFalse(
                        proprietaireId, StatutAnnonce.ACTIVE, dans7Jours)
                .stream()
                .map(annonceMapper::toListResponse)
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .nombreAnnoncesActives((int) actives)
                .nombreAnnoncesTotal((int) total)
                .nombreContactsTotal((int) contacts)
                .nombreFavorisTotal((int) favoris)
                .nombreVuesTotal((int) vues)
                .annoncesExpirantBientot(expirantDtos)
                .build();
    }

    // ── Helpers privés ────────────────────────────────────────────────────────

    private Annonce obtenirAnnonceProprietaire(Long annonceId, Long proprietaireId) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));
        if (!annonce.getProprietaire().getId().equals(proprietaireId))
            throw new AccesRefuseException("Vous n'êtes pas autorisé à modifier cette annonce.");
        return annonce;
    }

    private AnnonceDashboardResponse construireDashboardResponse(Annonce annonce) {
        AnnonceDashboardResponse dto = annonceMapper.toDashboardResponse(annonce);
        dto.setDateExpirationFormatee(DateUtils.formatEmail(annonce.getDateExpiration()));
        dto.setPrixFormate(formatterPrix(annonce.getPrix()));
        dto.setMisEnPauseParAdmin(annonce.getMisEnPauseParId() != null);
        // ✅ countByAnnonceId filtre déjà le proprio en base
        dto.setNombreContacts(contactRepository.countByAnnonceId(annonce.getId()));
        dto.setNombreCommentaires(
                commentaireRepository.countByAnnonceIdAndEstSupprimeFalse(annonce.getId()));
        photoRepository.findFirstByAnnonceIdAndPrincipaleTrue(annonce.getId())
                .ifPresent(p -> dto.setPhotoUrl(construireUrl(p.getCheminStockage())));
        return dto;
    }

    private String obtenirConfigValeur(String cle, String defaut) {
        return configRepository.findByCle(cle).map(c -> c.getValeur()).orElse(defaut);
    }

    /** Repousse la date d'expiration à partir de maintenant et réarme les rappels. */
    private void prolongerExpiration(Annonce annonce) {
        int dureeJours = Integer.parseInt(
                obtenirConfigValeur(ImmoCamConstants.CONFIG_DUREE_VIE_ANNONCE, "30"));
        annonce.setDateExpiration(DateUtils.calculerExpiration(LocalDateTime.now(), dureeJours));
        annonce.setRappelJ5Envoye(false);
        annonce.setRappelJ1Envoye(false);
    }

    private void envoyerEmailRenouvellement(Annonce annonce) {
        emailService.envoyerConfirmationRenouvellement(
                annonce.getProprietaire().getEmail(),
                annonce.getProprietaire().getPrenom(),
                annonce.getTypeBien().getLibelle(),
                annonce.getLocalisation().getVille(),
                DateUtils.formatEmail(annonce.getDateExpiration()));
    }

    private String construireUrl(String chemin) {
        if (chemin == null) return null;
        if (chemin.startsWith("http")) return chemin;
        String base = storageBaseUrl.endsWith("/") ? storageBaseUrl : storageBaseUrl + "/";
        return base + chemin;
    }

    private String formatterPrix(BigDecimal prix) {
        if (prix == null) return "0 FCFA";
        java.text.DecimalFormat df = new java.text.DecimalFormat("#,##0");
        df.setDecimalFormatSymbols(new java.text.DecimalFormatSymbols(java.util.Locale.FRENCH));
        return df.format(prix) + " FCFA";
    }
}
