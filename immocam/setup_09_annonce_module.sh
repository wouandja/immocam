#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — SCRIPT 09 : MODULE ANNONCE + PHOTO
# =============================================================================
# Rôle     : Génère le module annonce complet (le plus important) :
#            - DTOs annonce (request/response)
#            - AnnonceMapper (MapStruct)
#            - AnnonceService + AnnonceServiceImpl
#            - AnnonceController
#            - DTOs photo + PhotoService + PhotoController
#
# Endpoints annonces :
#   GET    /annonces              — Liste paginée publique (scroll infini)
#   GET    /annonces/{id}         — Détail annonce (incrémente vues)
#   POST   /annonces              — Publier annonce (auth)
#   PUT    /annonces/{id}         — Modifier (propriétaire)
#   PATCH  /annonces/{id}/pause   — Mettre en pause
#   PATCH  /annonces/{id}/reactiver
#   PATCH  /annonces/{id}/renouveler
#   PATCH  /annonces/{id}/archiver
#   DELETE /annonces/{id}         — Supprimer (propriétaire)
#   GET    /annonces/mes-annonces — Dashboard propriétaire
#
# Endpoints photos :
#   POST   /annonces/{id}/photos            — Upload photo(s)
#   DELETE /annonces/{id}/photos/{photoId}  — Supprimer une photo
#
# Exécuter : Depuis la RACINE du projet
#            bash setup_09_annonce_module.sh
# Prérequis: Scripts 01 à 08 exécutés
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

SECTION "SCRIPT 09 — MODULE ANNONCE + PHOTO"
INFO "Répertoire courant : $(pwd)"

BASE="src/main/java/com/mbem/immocam"
ANN="$BASE/module/annonce"
PHO="$BASE/module/photo"

[[ -d "$ANN" ]] || ERROR "Dossier $ANN introuvable. Lancez d'abord le script 01."

# =============================================================================
# 1. DTOs Annonce Request
# =============================================================================
SECTION "1/7 — DTOs Annonce Request"

mkdir -p "$ANN/dto/request" "$ANN/dto/response" "$ANN/mapper"

cat > "$ANN/dto/request/PublierAnnonceRequest.java" << 'EOF'
package com.mbem.immocam.module.annonce.dto.request;

import com.mbem.immocam.shared.validation.TelephoneCameroun;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Requête de publication d'une annonce.
 *
 * L'annonce est publiée immédiatement après soumission (statut ACTIVE).
 * Pas de file d'attente de modération.
 *
 * Limite : 5 annonces actives max par propriétaire (configurable admin).
 *
 * @author MBEMNOVA
 */
@Data
public class PublierAnnonceRequest {

    @NotNull(message = "Le type de bien est obligatoire")
    private Long typeBienId;

    @NotNull(message = "La localisation est obligatoire")
    private Long localisationId;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 30, max = 1000,
          message = "La description doit contenir entre 30 et 1000 caractères")
    private String description;

    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "1000", message = "Le prix minimum est de 1 000 FCFA")
    private BigDecimal prix;

    /**
     * Numéro WhatsApp pour le contact.
     * Pré-rempli avec le numéro du compte, modifiable par le propriétaire.
     * JAMAIS exposé en clair dans l'API — intégré uniquement dans le lien wa.me.
     */
    @NotBlank(message = "Le numéro WhatsApp est obligatoire")
    @TelephoneCameroun
    private String numeroWhatsApp;
}
EOF

cat > "$ANN/dto/request/ModifierAnnonceRequest.java" << 'EOF'
package com.mbem.immocam.module.annonce.dto.request;

import com.mbem.immocam.shared.validation.TelephoneCameroun;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Requête de modification d'une annonce existante.
 * Tous les champs sont optionnels — seuls les champs non-null sont mis à jour.
 *
 * @author MBEMNOVA
 */
@Data
public class ModifierAnnonceRequest {

    private Long typeBienId;
    private Long localisationId;

    @Size(min = 30, max = 1000,
          message = "La description doit contenir entre 30 et 1000 caractères")
    private String description;

    @DecimalMin(value = "1000", message = "Le prix minimum est de 1 000 FCFA")
    private BigDecimal prix;

    @TelephoneCameroun
    private String numeroWhatsApp;
}
EOF

OK "DTOs request annonce générés"

# =============================================================================
# 2. DTOs Annonce Response
# =============================================================================
SECTION "2/7 — DTOs Annonce Response"

cat > "$ANN/dto/response/PhotoResponse.java" << 'EOF'
package com.mbem.immocam.module.annonce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de réponse pour une photo d'annonce.
 * Le chemin de stockage interne n'est JAMAIS exposé — seulement l'URL publique.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoResponse {
    private Long id;
    /** URL publique complète (ex: https://immocam.cm/uploads/annonces/2026/04/uuid.jpg) */
    private String url;
    private int ordre;
    private boolean estPrincipale;
}
EOF

cat > "$ANN/dto/response/AnnonceListResponse.java" << 'EOF'
package com.mbem.immocam.module.annonce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO de réponse pour la liste des annonces (cartes page d'accueil).
 * Contient uniquement les informations affichées sur les cartes.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceListResponse {
    private Long id;
    private String typeBien;
    private String ville;
    private String quartier;
    private BigDecimal prix;
    private String statut;
    private int nombreVues;
    private LocalDateTime datePublication;
    /** URL de la photo principale — null si aucune photo (affichage image neutre). */
    private String photoUrl;
}
EOF

cat > "$ANN/dto/response/AnnonceDetailResponse.java" << 'EOF'
package com.mbem.immocam.module.annonce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de réponse pour le détail d'une annonce (page de détail).
 *
 * SÉCURITÉ : Le numéro WhatsApp n'est JAMAIS inclus dans cette réponse.
 * Le lienWhatsApp contient le numéro intégré dans wa.me (invisible).
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceDetailResponse {
    private Long id;
    private String typeBien;
    private String ville;
    private String quartier;
    private String description;
    private BigDecimal prix;
    private String statut;
    private int nombreVues;
    private int nombreCommentaires;
    private int nombreContacts;

    /** Lien wa.me avec numéro intégré — affiché uniquement si l'utilisateur est connecté. */
    private String lienWhatsApp;

    private LocalDateTime datePublication;
    private LocalDateTime dateExpiration;

    /** Format : "Cette annonce est disponible jusqu'au JJ/MM/AAAA" */
    private String dateExpirationFormatee;

    private String prenomProprietaire;
    private boolean estMienne;

    private List<PhotoResponse> photos;
}
EOF

cat > "$ANN/dto/response/AnnonceDashboardResponse.java" << 'EOF'
package com.mbem.immocam.module.annonce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO pour le tableau de bord du propriétaire.
 * Inclut les statistiques contacts et le statut détaillé.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceDashboardResponse {
    private Long id;
    private String typeBien;
    private String ville;
    private String quartier;
    private BigDecimal prix;
    private String statut;
    private int nombreVues;
    private long nombreContacts;
    private long nombreCommentaires;
    private String photoUrl;
    private LocalDateTime datePublication;
    private LocalDateTime dateExpiration;
    private String dateExpirationFormatee;
}
EOF

OK "DTOs response annonce générés"

# =============================================================================
# 3. AnnonceMapper (MapStruct)
# =============================================================================
SECTION "3/7 — AnnonceMapper"

cat > "$ANN/mapper/AnnonceMapper.java" << 'EOF'
package com.mbem.immocam.module.annonce.mapper;

import com.mbem.immocam.module.annonce.dto.response.AnnonceDetailResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceListResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDashboardResponse;
import com.mbem.immocam.module.annonce.dto.response.PhotoResponse;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.entity.Photo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * Mapper MapStruct Annonce <-> DTO.
 * Généré automatiquement à la compilation (zero reflection).
 *
 * @author MBEMNOVA
 */
@Mapper(componentModel = "spring")
public interface AnnonceMapper {

    @Mapping(source = "typeBien.libelle",      target = "typeBien")
    @Mapping(source = "localisation.ville",    target = "ville")
    @Mapping(source = "localisation.quartier", target = "quartier")
    AnnonceListResponse toListResponse(Annonce annonce);

    List<AnnonceListResponse> toListResponse(List<Annonce> annonces);

    @Mapping(source = "typeBien.libelle",           target = "typeBien")
    @Mapping(source = "localisation.ville",         target = "ville")
    @Mapping(source = "localisation.quartier",      target = "quartier")
    @Mapping(source = "proprietaire.prenom",        target = "prenomProprietaire")
    @Mapping(target = "lienWhatsApp",               ignore = true) // construit par le service
    @Mapping(target = "dateExpirationFormatee",     ignore = true) // construit par le service
    @Mapping(target = "estMienne",                  ignore = true) // déterminé par le service
    @Mapping(target = "nombreCommentaires",         ignore = true)
    @Mapping(target = "nombreContacts",             ignore = true)
    AnnonceDetailResponse toDetailResponse(Annonce annonce);

    @Mapping(source = "typeBien.libelle",      target = "typeBien")
    @Mapping(source = "localisation.ville",    target = "ville")
    @Mapping(source = "localisation.quartier", target = "quartier")
    @Mapping(target = "dateExpirationFormatee", ignore = true)
    @Mapping(target = "nombreContacts",         ignore = true)
    @Mapping(target = "nombreCommentaires",     ignore = true)
    @Mapping(target = "photoUrl",               ignore = true)
    AnnonceDashboardResponse toDashboardResponse(Annonce annonce);

    @Mapping(target = "url", ignore = true) // construit par StorageService.construireUrl()
    PhotoResponse toPhotoResponse(Photo photo);
}
EOF
OK "AnnonceMapper.java généré"

# =============================================================================
# 4. AnnonceService (interface + implémentation)
# =============================================================================
SECTION "4/7 — AnnonceService"

mkdir -p "$ANN/service"

cat > "$ANN/service/AnnonceService.java" << 'EOF'
package com.mbem.immocam.module.annonce.service;

import com.mbem.immocam.module.annonce.dto.request.ModifierAnnonceRequest;
import com.mbem.immocam.module.annonce.dto.request.PublierAnnonceRequest;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDetailResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDashboardResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceListResponse;
import com.mbem.immocam.shared.pagination.PageResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service métier pour la gestion des annonces ImmoCam.
 *
 * @author MBEMNOVA
 */
public interface AnnonceService {

    /** Liste publique paginée avec filtres (visiteur et utilisateur connecté). */
    PageResponse<AnnonceListResponse> listerAnnonces(
            String ville, Long typeBienId,
            java.math.BigDecimal prixMin, java.math.BigDecimal prixMax,
            Pageable pageable);

    /** Détail d'une annonce — incrémente le compteur de vues. */
    AnnonceDetailResponse obtenirDetail(Long id, Long utilisateurConnecteId);

    /** Publier une annonce (connexion obligatoire). */
    AnnonceDashboardResponse publier(PublierAnnonceRequest request, Long proprietaireId,
                                     String adresseIp);

    /** Modifier une annonce (propriétaire uniquement). */
    AnnonceDashboardResponse modifier(Long id, ModifierAnnonceRequest request, Long proprietaireId);

    /** Mettre en pause (propriétaire uniquement). */
    void mettreEnPause(Long id, Long proprietaireId);

    /** Réactiver depuis EN_PAUSE (propriétaire). */
    void reactiver(Long id, Long proprietaireId);

    /** Renouveler une annonce ACTIVE ou EXPIREE (propriétaire). */
    void renouveler(Long id, Long proprietaireId);

    /** Archiver définitivement (propriétaire). */
    void archiver(Long id, Long proprietaireId);

    /** Supprimer (propriétaire). */
    void supprimer(Long id, Long proprietaireId);

    /** Dashboard propriétaire — ses propres annonces. */
    PageResponse<AnnonceDashboardResponse> mesAnnonces(Long proprietaireId, Pageable pageable);
}
EOF

cat > "$ANN/service/AnnonceServiceImpl.java" << 'EOF'
package com.mbem.immocam.module.annonce.service;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.email.service.EmailService;
import com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException;
import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.infrastructure.exception.custom.LimiteAtteintException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.annonce.dto.request.ModifierAnnonceRequest;
import com.mbem.immocam.module.annonce.dto.request.PublierAnnonceRequest;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDetailResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDashboardResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceListResponse;
import com.mbem.immocam.module.annonce.dto.response.PhotoResponse;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.mapper.AnnonceMapper;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.annonce.specification.AnnonceSpecification;
import com.mbem.immocam.module.commentaire.repository.CommentaireRepository;
import com.mbem.immocam.module.contact.repository.ContactWhatsAppRepository;
import com.mbem.immocam.module.config.repository.ConfigSystemeRepository;
import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
import com.mbem.immocam.module.photo.repository.PhotoRepository;
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
 *   - Publication directe sans modération (statut ACTIVE immédiatement)
 *   - Limite 5 annonces actives par propriétaire (configurable admin)
 *   - Détection de doublon avant publication
 *   - Numéro WhatsApp jamais exposé dans les réponses API
 *   - Compteur de vues incrémenté à chaque consultation du détail
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
    private final PhotoRepository photoRepository;
    private final CommentaireRepository commentaireRepository;
    private final ContactWhatsAppRepository contactRepository;
    private final ConfigSystemeRepository configRepository;
    private final AnnonceMapper annonceMapper;
    private final EmailService emailService;
    private final LogActiviteService logActiviteService;

    // ── Lecture publique ──────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AnnonceListResponse> listerAnnonces(
            String ville, Long typeBienId,
            BigDecimal prixMin, BigDecimal prixMax, Pageable pageable) {

        Specification<Annonce> spec = AnnonceSpecification.filtrer(
            ville, typeBienId, prixMin, prixMax);
        Page<Annonce> page = annonceRepository.findAll(spec, pageable);

        Page<AnnonceListResponse> dtoPage = page.map(annonce -> {
            AnnonceListResponse dto = annonceMapper.toListResponse(annonce);
            // Photo principale — null si aucune photo (Angular affiche image neutre)
            photoRepository.findFirstByAnnonceIdAndEstPrincipaleTrue(annonce.getId())
                    .ifPresent(p -> dto.setPhotoUrl(
                        construireUrl(p.getCheminStockage())));
            return dto;
        });
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional
    public AnnonceDetailResponse obtenirDetail(Long id, Long utilisateurConnecteId) {
        Annonce annonce = annonceRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", id));

        // Incrémenter les vues (sans charger l'entité en mémoire)
        annonceRepository.incrementerVues(id);

        AnnonceDetailResponse dto = annonceMapper.toDetailResponse(annonce);

        // Date d'expiration formatée
        dto.setDateExpirationFormatee("Cette annonce est disponible jusqu'au "
            + DateUtils.formatEmail(annonce.getDateExpiration()));

        // Lien WhatsApp — uniquement si l'utilisateur est connecté
        if (utilisateurConnecteId != null) {
            String msgTemplate = obtenirConfigValeur(
                ImmoCamConstants.CONFIG_MSG_WHATSAPP,
                "Bonjour, je vous contacte depuis ImmoCam concernant votre annonce.");
            String msgFinal = msgTemplate
                .replace("{type}", annonce.getTypeBien().getLibelle())
                .replace("{quartier}", annonce.getLocalisation().getQuartier() != null
                    ? annonce.getLocalisation().getQuartier() : "")
                .replace("{ville}", annonce.getLocalisation().getVille())
                .replace("{prix}", annonce.getPrix().toPlainString());
            dto.setLienWhatsApp(PhoneUtils.construireLienWhatsApp(
                annonce.getNumeroWhatsApp(), msgFinal));
        }

        // Statistiques
        dto.setNombreCommentaires(
            (int) commentaireRepository.countByAnnonceIdAndEstSupprimeFalse(id));
        dto.setNombreContacts((int) contactRepository.countByAnnonceId(id));
        dto.setEstMienne(utilisateurConnecteId != null
            && utilisateurConnecteId.equals(annonce.getProprietaire().getId()));

        // Photos avec URLs publiques
        List<PhotoResponse> photos = photoRepository.findByAnnonceIdOrderByOrdreAsc(id)
                .stream()
                .map(p -> PhotoResponse.builder()
                    .id(p.getId())
                    .url(construireUrl(p.getCheminStockage()))
                    .ordre(p.getOrdre())
                    .estPrincipale(p.isEstPrincipale())
                    .build())
                .collect(Collectors.toList());
        dto.setPhotos(photos);

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
                .orElseThrow(() -> new RessourceNotFoundException("Type de bien",
                    request.getTypeBienId()));

        Localisation localisation = localisationRepository.findById(request.getLocalisationId())
                .orElseThrow(() -> new RessourceNotFoundException("Localisation",
                    request.getLocalisationId()));

        // Vérifier la limite d'annonces actives
        int maxAnnonces = Integer.parseInt(
            obtenirConfigValeur(ImmoCamConstants.CONFIG_MAX_ANNONCES, "5"));
        long nbActives = annonceRepository.countByProprietaireIdAndStatutAndDeletedFalse(
            proprietaireId, StatutAnnonce.ACTIVE);
        if (nbActives >= maxAnnonces) {
            throw new LimiteAtteintException(
                "Vous avez atteint votre limite de " + maxAnnonces +
                " annonces actives. Archivez ou supprimez une annonce existante.");
        }

        // Détection de doublon (avertissement, pas un blocage)
        String telephone = PhoneUtils.normaliser(request.getNumeroWhatsApp());
        boolean doublon = annonceRepository.existsDoublon(
            proprietaireId, request.getTypeBienId(),
            request.getLocalisationId(), request.getPrix(), telephone);
        if (doublon) {
            throw new DoublonException(
                "Une annonce similaire existe déjà dans votre dashboard.");
        }

        // Durée de vie depuis la config
        int dureeJours = Integer.parseInt(
            obtenirConfigValeur(ImmoCamConstants.CONFIG_DUREE_VIE_ANNONCE, "30"));
        LocalDateTime maintenant = LocalDateTime.now();

        Annonce annonce = Annonce.builder()
                .description(request.getDescription())
                .prix(request.getPrix())
                .numeroWhatsApp(telephone)
                .statut(StatutAnnonce.ACTIVE) // Publication directe, sans modération
                .proprietaire(proprietaire)
                .typeBien(typeBien)
                .localisation(localisation)
                .dateExpiration(DateUtils.calculerExpiration(maintenant, dureeJours))
                .build();

        annonceRepository.save(annonce);

        // Email de confirmation
        emailService.envoyerConfirmationPublication(
            proprietaire.getEmail(), proprietaire.getPrenom(),
            typeBien.getLibelle(), localisation.getVille(),
            localisation.getQuartier() != null ? localisation.getQuartier() : "");

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

        if (request.getTypeBienId() != null) {
            annonce.setTypeBien(typeBienRepository.findById(request.getTypeBienId())
                .orElseThrow(() -> new RessourceNotFoundException("Type de bien",
                    request.getTypeBienId())));
        }
        if (request.getLocalisationId() != null) {
            annonce.setLocalisation(localisationRepository.findById(request.getLocalisationId())
                .orElseThrow(() -> new RessourceNotFoundException("Localisation",
                    request.getLocalisationId())));
        }
        if (request.getDescription() != null) annonce.setDescription(request.getDescription());
        if (request.getPrix() != null) annonce.setPrix(request.getPrix());
        if (request.getNumeroWhatsApp() != null)
            annonce.setNumeroWhatsApp(PhoneUtils.normaliser(request.getNumeroWhatsApp()));

        logActiviteService.log(proprietaireId, TypeAction.MODIFICATION_ANNONCE,
            "Annonce", id, null, null);
        return construireDashboardResponse(annonce);
    }

    // ── Actions sur le cycle de vie ──────────────────────────────────────────

    @Override
    @Transactional
    public void mettreEnPause(Long id, Long proprietaireId) {
        Annonce annonce = obtenirAnnonceProprietaire(id, proprietaireId);
        if (!StatutAnnonce.ACTIVE.equals(annonce.getStatut())) {
            throw new IllegalArgumentException(
                "Seules les annonces actives peuvent être mises en pause.");
        }
        annonce.setStatut(StatutAnnonce.EN_PAUSE);
        logActiviteService.log(proprietaireId, TypeAction.PAUSE_ANNONCE,
            "Annonce", id, null, null);
    }

    @Override
    @Transactional
    public void reactiver(Long id, Long proprietaireId) {
        Annonce annonce = obtenirAnnonceProprietaire(id, proprietaireId);
        if (!StatutAnnonce.EN_PAUSE.equals(annonce.getStatut())) {
            throw new IllegalArgumentException(
                "Seules les annonces en pause peuvent être réactivées.");
        }
        annonce.setStatut(StatutAnnonce.ACTIVE);
        logActiviteService.log(proprietaireId, TypeAction.REACTIVATION_ANNONCE,
            "Annonce", id, null, null);
    }

    @Override
    @Transactional
    public void renouveler(Long id, Long proprietaireId) {
        Annonce annonce = obtenirAnnonceProprietaire(id, proprietaireId);
        if (!StatutAnnonce.ACTIVE.equals(annonce.getStatut())
                && !StatutAnnonce.EXPIREE.equals(annonce.getStatut())) {
            throw new IllegalArgumentException(
                "Seules les annonces actives ou expirées peuvent être renouvelées.");
        }
        int dureeJours = Integer.parseInt(
            obtenirConfigValeur(ImmoCamConstants.CONFIG_DUREE_VIE_ANNONCE, "30"));
        annonce.setDateExpiration(
            DateUtils.calculerExpiration(LocalDateTime.now(), dureeJours));
        annonce.setStatut(StatutAnnonce.ACTIVE);
        annonce.setRappelJ5Envoye(false);
        annonce.setRappelJ1Envoye(false);
        logActiviteService.log(proprietaireId, TypeAction.RENOUVELLEMENT_ANNONCE,
            "Annonce", id, null, null);
    }

    @Override
    @Transactional
    public void archiver(Long id, Long proprietaireId) {
        Annonce annonce = obtenirAnnonceProprietaire(id, proprietaireId);
        annonce.setStatut(StatutAnnonce.ARCHIVEE);
        logActiviteService.log(proprietaireId, TypeAction.ARCHIVAGE_ANNONCE,
            "Annonce", id, null, null);
    }

    @Override
    @Transactional
    public void supprimer(Long id, Long proprietaireId) {
        Annonce annonce = obtenirAnnonceProprietaire(id, proprietaireId);
        annonce.setStatut(StatutAnnonce.SUPPRIMEE);
        annonce.setDeleted(true);
        annonce.setDateSuppression(LocalDateTime.now());
        logActiviteService.log(proprietaireId, TypeAction.SUPPRESSION_ANNONCE,
            "Annonce", id, null, null);
    }

    // ── Dashboard propriétaire ────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AnnonceDashboardResponse> mesAnnonces(
            Long proprietaireId, Pageable pageable) {
        Page<Annonce> page = annonceRepository.findByProprietaireIdAndDeletedFalse(
            proprietaireId, pageable);
        Page<AnnonceDashboardResponse> dtoPage = page.map(this::construireDashboardResponse);
        return PageResponse.from(dtoPage);
    }

    // ── Helpers privés ─────────────────────────────────────────────────────────

    private Annonce obtenirAnnonceProprietaire(Long annonceId, Long proprietaireId) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));
        if (!annonce.getProprietaire().getId().equals(proprietaireId)) {
            throw new AccesRefuseException(
                "Vous n'êtes pas autorisé à modifier cette annonce.");
        }
        return annonce;
    }

    private AnnonceDashboardResponse construireDashboardResponse(Annonce annonce) {
        AnnonceDashboardResponse dto = annonceMapper.toDashboardResponse(annonce);
        dto.setDateExpirationFormatee(DateUtils.formatEmail(annonce.getDateExpiration()));
        dto.setNombreContacts(contactRepository.countByAnnonceId(annonce.getId()));
        dto.setNombreCommentaires(
            commentaireRepository.countByAnnonceIdAndEstSupprimeFalse(annonce.getId()));
        photoRepository.findFirstByAnnonceIdAndEstPrincipaleTrue(annonce.getId())
                .ifPresent(p -> dto.setPhotoUrl(construireUrl(p.getCheminStockage())));
        return dto;
    }

    private String obtenirConfigValeur(String cle, String defaut) {
        return configRepository.findByCle(cle)
                .map(c -> c.getValeur())
                .orElse(defaut);
    }

    private String construireUrl(String chemin) {
        // La base URL est injectée via le service de stockage
        // Ici on retourne le chemin relatif — AnnonceController peut appeler
        // storageService.construireUrl() si nécessaire
        return chemin;
    }
}
EOF
OK "AnnonceService.java généré"
OK "AnnonceServiceImpl.java généré"

# =============================================================================
# 5. AnnonceController
# =============================================================================
SECTION "5/7 — AnnonceController"

mkdir -p "$ANN/controller"

cat > "$ANN/controller/AnnonceController.java" << 'EOF'
package com.mbem.immocam.module.annonce.controller;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.annonce.dto.request.ModifierAnnonceRequest;
import com.mbem.immocam.module.annonce.dto.request.PublierAnnonceRequest;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDetailResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDashboardResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceListResponse;
import com.mbem.immocam.module.annonce.service.AnnonceService;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

/**
 * Controller des annonces immobilières ImmoCam.
 *
 * Règles d'accès :
 *   GET /annonces et GET /annonces/{id}  → PUBLIC (visiteur non connecté)
 *   Toutes les autres actions            → AUTHENTIFIÉ
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/annonces")
@RequiredArgsConstructor
@Tag(name = "Annonces", description = "Gestion des annonces immobilières")
public class AnnonceController {

    private final AnnonceService annonceService;
    private final UtilisateurRepository utilisateurRepository;

    @Operation(summary = "Liste des annonces",
               description = "Retourne les annonces actives paginées. " +
                             "Scroll infini 12 annonces par page. Tous filtres optionnels.")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AnnonceListResponse>>> lister(
            @RequestParam(required = false) String ville,
            @RequestParam(required = false) Long typeBienId,
            @RequestParam(required = false) BigDecimal prixMin,
            @RequestParam(required = false) BigDecimal prixMax,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int taille) {

        Pageable pageable = PageRequest.of(page, taille,
            Sort.by(Sort.Direction.DESC, "dateCreation"));
        PageResponse<AnnonceListResponse> result =
            annonceService.listerAnnonces(ville, typeBienId, prixMin, prixMax, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "Détail d'une annonce",
               description = "Retourne le détail complet. Incrémente le compteur de vues. " +
                             "Le lien WhatsApp est inclus uniquement si l'utilisateur est connecté.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnonceDetailResponse>> detail(@PathVariable Long id) {
        Long utilisateurId = null;
        if (SecurityUtils.estAuthentifie()) {
            try {
                String email = SecurityUtils.getEmailUtilisateurCourant();
                utilisateurId = utilisateurRepository.findByEmail(email)
                    .map(u -> u.getId()).orElse(null);
            } catch (Exception ignored) {}
        }
        AnnonceDetailResponse detail = annonceService.obtenirDetail(id, utilisateurId);
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    @Operation(summary = "Publier une annonce",
               description = "Publication directe sans modération. " +
                             "Limite : 5 annonces actives par propriétaire.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AnnonceDashboardResponse>> publier(
            @Valid @RequestBody PublierAnnonceRequest request,
            HttpServletRequest httpRequest) {
        Long proprietaireId = obtenirUtilisateurCourantId();
        AnnonceDashboardResponse result =
            annonceService.publier(request, proprietaireId, httpRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Annonce publiée avec succès.", result));
    }

    @Operation(summary = "Modifier une annonce",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AnnonceDashboardResponse>> modifier(
            @PathVariable Long id,
            @Valid @RequestBody ModifierAnnonceRequest request) {
        Long proprietaireId = obtenirUtilisateurCourantId();
        AnnonceDashboardResponse result = annonceService.modifier(id, request, proprietaireId);
        return ResponseEntity.ok(ApiResponse.ok("Annonce modifiée.", result));
    }

    @Operation(summary = "Mettre en pause",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{id}/pause")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> mettreEnPause(@PathVariable Long id) {
        annonceService.mettreEnPause(id, obtenirUtilisateurCourantId());
        return ResponseEntity.ok(ApiResponse.message("Annonce mise en pause."));
    }

    @Operation(summary = "Réactiver une annonce en pause",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{id}/reactiver")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> reactiver(@PathVariable Long id) {
        annonceService.reactiver(id, obtenirUtilisateurCourantId());
        return ResponseEntity.ok(ApiResponse.message("Annonce réactivée."));
    }

    @Operation(summary = "Renouveler une annonce (ACTIVE ou EXPIRÉE)",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{id}/renouveler")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> renouveler(@PathVariable Long id) {
        annonceService.renouveler(id, obtenirUtilisateurCourantId());
        return ResponseEntity.ok(ApiResponse.message(
            "Annonce renouvelée pour 30 jours supplémentaires."));
    }

    @Operation(summary = "Archiver une annonce",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{id}/archiver")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> archiver(@PathVariable Long id) {
        annonceService.archiver(id, obtenirUtilisateurCourantId());
        return ResponseEntity.ok(ApiResponse.message("Annonce archivée définitivement."));
    }

    @Operation(summary = "Supprimer une annonce",
               security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> supprimer(@PathVariable Long id) {
        annonceService.supprimer(id, obtenirUtilisateurCourantId());
        return ResponseEntity.ok(ApiResponse.message("Annonce supprimée."));
    }

    @Operation(summary = "Mes annonces (dashboard propriétaire)",
               description = "Retourne toutes les annonces du propriétaire connecté.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/mes-annonces")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<AnnonceDashboardResponse>>> mesAnnonces(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int taille) {
        Long proprietaireId = obtenirUtilisateurCourantId();
        Pageable pageable = PageRequest.of(page, taille,
            Sort.by(Sort.Direction.DESC, "dateCreation"));
        PageResponse<AnnonceDashboardResponse> result =
            annonceService.mesAnnonces(proprietaireId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** Récupère l'ID de l'utilisateur courant depuis le SecurityContext. */
    private Long obtenirUtilisateurCourantId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception
                    .custom.RessourceNotFoundException("Utilisateur non trouvé"));
    }
}
EOF
OK "AnnonceController.java généré"

# =============================================================================
# 6. PhotoService + PhotoController
# =============================================================================
SECTION "6/7 — PhotoService + PhotoController"

mkdir -p "$PHO/service" "$PHO/controller"

cat > "$PHO/service/PhotoService.java" << 'EOF'
package com.mbem.immocam.module.photo.service;

import com.mbem.immocam.module.annonce.dto.response.PhotoResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service de gestion des photos d'annonces.
 *
 * @author MBEMNOVA
 */
public interface PhotoService {

    /**
     * Upload et compression d'une photo pour une annonce.
     * Maximum 4 photos par annonce (configurable admin).
     *
     * @param annonceId ID de l'annonce
     * @param fichier   Fichier à uploader
     * @param proprietaireId ID du propriétaire (vérification autorisation)
     * @return DTO de la photo créée
     */
    PhotoResponse uploadPhoto(Long annonceId, MultipartFile fichier, Long proprietaireId);

    /**
     * Supprime une photo d'une annonce (disque + base de données).
     *
     * @param annonceId      ID de l'annonce
     * @param photoId        ID de la photo à supprimer
     * @param proprietaireId ID du propriétaire
     */
    void supprimerPhoto(Long annonceId, Long photoId, Long proprietaireId);
}
EOF

cat > "$PHO/service/PhotoServiceImpl.java" << 'EOF'
package com.mbem.immocam.module.photo.service;

import com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException;
import com.mbem.immocam.infrastructure.exception.custom.LimiteAtteintException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.infrastructure.storage.service.StorageService;
import com.mbem.immocam.module.annonce.dto.response.PhotoResponse;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.entity.Photo;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.config.repository.ConfigSystemeRepository;
import com.mbem.immocam.module.photo.repository.PhotoRepository;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Implémentation du service photos.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoServiceImpl implements PhotoService {

    private final AnnonceRepository annonceRepository;
    private final PhotoRepository photoRepository;
    private final ConfigSystemeRepository configRepository;
    private final StorageService storageService;

    @Override
    @Transactional
    public PhotoResponse uploadPhoto(Long annonceId, MultipartFile fichier, Long proprietaireId) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));

        if (!annonce.getProprietaire().getId().equals(proprietaireId)) {
            throw new AccesRefuseException("Vous n'êtes pas autorisé à modifier cette annonce.");
        }

        // Vérifier la limite de photos
        int maxPhotos = Integer.parseInt(
            configRepository.findByCle(ImmoCamConstants.CONFIG_MAX_PHOTOS)
                .map(c -> c.getValeur()).orElse("4"));
        long nbPhotos = photoRepository.countByAnnonceId(annonceId);
        if (nbPhotos >= maxPhotos) {
            throw new LimiteAtteintException(
                "Cette annonce a déjà " + maxPhotos + " photos (maximum autorisé).");
        }

        // Stocker et compresser la photo
        String cheminStockage = storageService.stocker(fichier, annonceId);

        int prochainOrdre = photoRepository.findMaxOrdreByAnnonceId(annonceId) + 1;
        boolean estPremiere = (nbPhotos == 0);

        Photo photo = Photo.builder()
                .cheminStockage(cheminStockage)
                .nomOriginal(fichier.getOriginalFilename())
                .ordre(prochainOrdre)
                .estPrincipale(estPremiere)
                .tailleOctets(fichier.getSize())
                .annonce(annonce)
                .build();

        photoRepository.save(photo);
        log.info("Photo uploadée pour annonce {} : {}", annonceId, cheminStockage);

        return PhotoResponse.builder()
                .id(photo.getId())
                .url(storageService.construireUrl(cheminStockage))
                .ordre(photo.getOrdre())
                .estPrincipale(photo.isEstPrincipale())
                .build();
    }

    @Override
    @Transactional
    public void supprimerPhoto(Long annonceId, Long photoId, Long proprietaireId) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));

        if (!annonce.getProprietaire().getId().equals(proprietaireId)) {
            throw new AccesRefuseException("Vous n'êtes pas autorisé à modifier cette annonce.");
        }

        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new RessourceNotFoundException("Photo", photoId));

        storageService.supprimer(photo.getCheminStockage());
        photoRepository.delete(photo);

        // Si on supprime la photo principale, promouvoir la suivante
        if (photo.isEstPrincipale()) {
            photoRepository.findByAnnonceIdOrderByOrdreAsc(annonceId).stream()
                    .findFirst()
                    .ifPresent(p -> { p.setEstPrincipale(true); photoRepository.save(p); });
        }
        log.info("Photo {} supprimée de l'annonce {}", photoId, annonceId);
    }
}
EOF

cat > "$PHO/controller/PhotoController.java" << 'EOF'
package com.mbem.immocam.module.photo.controller;

import com.mbem.immocam.infrastructure.security.config.SecurityUtils;
import com.mbem.immocam.module.annonce.dto.response.PhotoResponse;
import com.mbem.immocam.module.photo.service.PhotoService;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller de gestion des photos d'annonces.
 *
 * Stockage local VPS — compression automatique Thumbnailator.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/annonces/{annonceId}/photos")
@RequiredArgsConstructor
@Tag(name = "Photos", description = "Upload et suppression des photos d'annonces (stockage VPS)")
public class PhotoController {

    private final PhotoService photoService;
    private final UtilisateurRepository utilisateurRepository;

    @Operation(summary = "Uploader une photo",
               description = "Max 4 photos par annonce. Formats : JPG, PNG, WebP. " +
                             "Taille max : 4 Mo. Compression automatique JPEG 80%.",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PhotoResponse>> uploadPhoto(
            @PathVariable Long annonceId,
            @RequestParam("fichier") MultipartFile fichier) {
        Long proprietaireId = obtenirProprietaireId();
        PhotoResponse photo = photoService.uploadPhoto(annonceId, fichier, proprietaireId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Photo uploadée avec succès.", photo));
    }

    @Operation(summary = "Supprimer une photo",
               security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{photoId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> supprimerPhoto(
            @PathVariable Long annonceId,
            @PathVariable Long photoId) {
        Long proprietaireId = obtenirProprietaireId();
        photoService.supprimerPhoto(annonceId, photoId, proprietaireId);
        return ResponseEntity.ok(ApiResponse.message("Photo supprimée."));
    }

    private Long obtenirProprietaireId() {
        String email = SecurityUtils.getEmailUtilisateurCourant();
        return utilisateurRepository.findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new com.mbem.immocam.infrastructure.exception
                    .custom.RessourceNotFoundException("Utilisateur non trouvé"));
    }
}
EOF
OK "PhotoService.java généré"
OK "PhotoServiceImpl.java généré"
OK "PhotoController.java généré"

# =============================================================================
# 7. Localisation et TypeBien Controllers (endpoints publics)
# =============================================================================
SECTION "7/7 — LocalisationController + TypeBienController"

cat > "$BASE/module/localisation/controller/LocalisationController.java" << 'EOF'
package com.mbem.immocam.module.localisation.controller;

import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoints publics pour les villes et quartiers du Cameroun.
 * Utilisés dans les formulaires de publication et de recherche.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/localisations")
@RequiredArgsConstructor
@Tag(name = "Localisation", description = "Villes et quartiers du Cameroun (public)")
public class LocalisationController {

    private final LocalisationRepository localisationRepository;

    @Operation(summary = "Liste des villes actives",
               description = "Retourne les 20 villes camerounaises pré-chargées " +
                             "plus celles ajoutées par l'admin.")
    @GetMapping("/villes")
    public ResponseEntity<ApiResponse<List<String>>> getVilles() {
        List<String> villes = localisationRepository.findVillesActives();
        return ResponseEntity.ok(ApiResponse.ok(villes));
    }

    @Operation(summary = "Quartiers d'une ville",
               description = "Chargement dynamique lors de la sélection d'une ville.")
    @GetMapping("/quartiers/{ville}")
    public ResponseEntity<ApiResponse<List<Localisation>>> getQuartiers(
            @PathVariable String ville) {
        List<Localisation> quartiers =
            localisationRepository.findByVilleAndEstActiveTrueOrderByQuartierAsc(ville);
        return ResponseEntity.ok(ApiResponse.ok(quartiers));
    }
}
EOF

cat > "$BASE/module/typebien/controller/TypeBienController.java" << 'EOF'
package com.mbem.immocam.module.typebien.controller;

import com.mbem.immocam.module.typebien.entity.TypeBien;
import com.mbem.immocam.module.typebien.repository.TypeBienRepository;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoints publics pour les types de biens immobiliers.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/types-biens")
@RequiredArgsConstructor
@Tag(name = "Types de biens", description = "Types de biens immobiliers (public)")
public class TypeBienController {

    private final TypeBienRepository typeBienRepository;

    @Operation(summary = "Liste des types de biens actifs",
               description = "Retourne les 8 types initiaux et ceux ajoutés par l'admin.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<TypeBien>>> getTypesBiens() {
        List<TypeBien> types = typeBienRepository.findByEstActifTrueOrderByLibelleAsc();
        return ResponseEntity.ok(ApiResponse.ok(types));
    }
}
EOF

OK "LocalisationController.java généré"
OK "TypeBienController.java généré"

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
JAVA_COUNT=$(find src/main/java -name "*.java" | wc -l)
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SCRIPT 09 TERMINÉ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Fichiers Java total : $JAVA_COUNT"
INFO ""
INFO "Générés dans ce script :"
INFO "  module/annonce/dto/request/  (PublierAnnonceRequest, ModifierAnnonceRequest)"
INFO "  module/annonce/dto/response/ (List, Detail, Dashboard, Photo)"
INFO "  module/annonce/mapper/AnnonceMapper.java (MapStruct)"
INFO "  module/annonce/service/AnnonceService.java + Impl"
INFO "  module/annonce/controller/AnnonceController.java"
INFO "  module/photo/service/PhotoService.java + Impl"
INFO "  module/photo/controller/PhotoController.java"
INFO "  module/localisation/controller/LocalisationController.java"
INFO "  module/typebien/controller/TypeBienController.java"
echo ""
INFO "Endpoints annonces :"
INFO "  GET    /api/annonces"
INFO "  GET    /api/annonces/{id}"
INFO "  POST   /api/annonces"
INFO "  PUT    /api/annonces/{id}"
INFO "  PATCH  /api/annonces/{id}/pause|reactiver|renouveler|archiver"
INFO "  DELETE /api/annonces/{id}"
INFO "  GET    /api/annonces/mes-annonces"
INFO "  POST   /api/annonces/{id}/photos"
INFO "  DELETE /api/annonces/{id}/photos/{photoId}"
INFO "  GET    /api/localisations/villes"
INFO "  GET    /api/localisations/quartiers/{ville}"
INFO "  GET    /api/types-biens"
echo ""
WARN "Scripts restants : 10 (Commentaires/Favoris/Contact/Signalement)"
WARN "                   11 (Admin) → 12 (Tests & Deploy)"
echo ""
INFO "Prochaine étape : bash setup_10_user_modules.sh"