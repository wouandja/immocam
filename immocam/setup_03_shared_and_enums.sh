#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — SCRIPT 03 : SHARED — ENUMS, CONSTANTES, RÉPONSES, UTILITAIRES
# =============================================================================
# Rôle     : Génère tout le code partagé entre tous les modules :
#            - BaseEntity (classe abstraite JPA avec audit)
#            - Toutes les énumérations métier
#            - ApiResponse<T> et PageResponse<T>
#            - ImmoCamConstants (constantes globales)
#            - Utilitaires : PhoneUtils, DateUtils
#            - Annotation de validation @TelephoneCameroun
#            - AppConfig (JPA Auditing, Async, Scheduling)
#            - ImmocamApplication.java mis à jour
#
# Exécuter : Depuis la RACINE du projet
#            bash setup_03_shared_and_enums.sh
#
# Prérequis: Scripts 01 et 02 exécutés
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

[[ -f "pom.xml" ]] || ERROR "Lancez ce script depuis la racine du projet."

SECTION "SCRIPT 03 — SHARED & ENUMS"
INFO "Répertoire : $(pwd)"

BASE="src/main/java/com/mbem/immocam"
SHARED="$BASE/shared"

[[ -d "$SHARED" ]] || ERROR "Dossier $SHARED introuvable. Lancez d'abord le script 01."

# =============================================================================
# 1. BaseEntity — Classe abstraite avec audit JPA
# =============================================================================
SECTION "1/7 — BaseEntity"

mkdir -p "$SHARED/entity"

cat > "$SHARED/entity/BaseEntity.java" << 'EOF'
package com.mbem.immocam.shared.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Classe de base pour toutes les entites JPA d'ImmoCam.
 *
 * <p>Fournit automatiquement un id BIGSERIAL, dateCreation et dateModification
 * remplis par JPA Auditing (@EnableJpaAuditing dans ImmocamApplication).
 *
 * @author MBEMNOVA
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class BaseEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Remplie automatiquement a la creation. Non modifiable (updatable = false).
     */
    @CreatedDate
    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    /**
     * Mise a jour automatiquement a chaque save().
     */
    @LastModifiedDate
    @Column(name = "date_modification")
    private LocalDateTime dateModification;
}
EOF
OK "BaseEntity.java généré"

# =============================================================================
# 2. Énumérations métier
# =============================================================================
SECTION "2/7 — Énumérations métier"

ENUM_DIR="$SHARED/enums"
mkdir -p "$ENUM_DIR"

cat > "$ENUM_DIR/RoleUtilisateur.java" << 'EOF'
package com.mbem.immocam.shared.enums;

/**
 * Roles des utilisateurs ImmoCam.
 * Un seul compte pour tout. L'utilisateur devient PROPRIETAIRE
 * automatiquement des la premiere publication d'annonce.
 */
public enum RoleUtilisateur {
    UTILISATEUR,
    ADMINISTRATEUR
}
EOF

cat > "$ENUM_DIR/StatutCompte.java" << 'EOF'
package com.mbem.immocam.shared.enums;

/**
 * Statuts possibles d'un compte utilisateur.
 */
public enum StatutCompte {
    /** Email non encore valide apres inscription. */
    NON_VERIFIE,
    /** Compte actif et operationnel. */
    ACTIF,
    /** Suspendu temporairement par l'admin. Annonces masquees. Reversible. */
    SUSPENDU,
    /** Banni definitivement. Annonces supprimees. Irreversible via l'API. */
    BANNI
}
EOF

cat > "$ENUM_DIR/StatutAnnonce.java" << 'EOF'
package com.mbem.immocam.shared.enums;

/**
 * Cycle de vie d'une annonce immobiliere ImmoCam.
 *
 * Seul le statut ACTIVE est visible du public.
 *
 * Transitions :
 *   [Formulaire] -> ACTIVE  (publication directe, sans moderation)
 *   ACTIVE       -> EN_PAUSE | EXPIREE(J0) | ARCHIVEE | SUPPRIMEE | SUPPRIMEE_ADMIN
 *   EN_PAUSE     -> ACTIVE (reactivation) | ARCHIVEE
 *   EXPIREE      -> ACTIVE (renouvellement) | SUPPRIMEE_SYSTEME(J+7)
 */
public enum StatutAnnonce {
    ACTIVE,
    EN_PAUSE,
    EXPIREE,
    ARCHIVEE,
    SUPPRIMEE,
    SUPPRIMEE_ADMIN,
    SUPPRIMEE_SYSTEME
}
EOF

cat > "$ENUM_DIR/StatutSignalement.java" << 'EOF'
package com.mbem.immocam.shared.enums;

/**
 * Statuts du traitement d'un signalement par l'administrateur.
 */
public enum StatutSignalement {
    EN_ATTENTE,
    TRAITE_IGNORE,
    TRAITE_SUPPRESSION,
    TRAITE_SUSPENSION
}
EOF

cat > "$ENUM_DIR/MotifSignalement.java" << 'EOF'
package com.mbem.immocam.shared.enums;

/**
 * Motifs disponibles lors du signalement d'une annonce.
 * Connexion obligatoire pour signaler.
 */
public enum MotifSignalement {
    ANNONCE_FRAUDULEUSE,
    PHOTOS_NON_CONFORMES,
    PRIX_INCORRECT,
    BIEN_DEJA_LOUE_VENDU,
    CONTENU_INAPPROPRIE,
    /** Autre motif : champ texte libre obligatoire. */
    AUTRE
}
EOF

cat > "$ENUM_DIR/TypeAction.java" << 'EOF'
package com.mbem.immocam.shared.enums;

/**
 * Types d'actions enregistrees dans les logs d'activite.
 */
public enum TypeAction {
    // Auth
    CONNEXION, DECONNEXION, INSCRIPTION, VALIDATION_EMAIL,
    REINITIALISATION_MDP, TENTATIVE_CONNEXION_ECHOUEE, COMPTE_BLOQUE,
    // Annonces
    PUBLICATION_ANNONCE, MODIFICATION_ANNONCE, PAUSE_ANNONCE,
    REACTIVATION_ANNONCE, RENOUVELLEMENT_ANNONCE, ARCHIVAGE_ANNONCE,
    SUPPRESSION_ANNONCE, EXPIRATION_ANNONCE, SUPPRESSION_SYSTEME_ANNONCE,
    // Photos
    UPLOAD_PHOTO, SUPPRESSION_PHOTO,
    // Contact
    CONTACT_WHATSAPP,
    // Favoris
    AJOUT_FAVORI, SUPPRESSION_FAVORI,
    // Commentaires
    COMMENTAIRE_PUBLIE, REPONSE_COMMENTAIRE, SUPPRESSION_COMMENTAIRE,
    // Signalements
    SIGNALEMENT_SOUMIS, SIGNALEMENT_TRAITE,
    // Admin
    SUSPENSION_UTILISATEUR, BANNISSEMENT_UTILISATEUR, REACTIVATION_UTILISATEUR,
    SUPPRESSION_ANNONCE_ADMIN, MODIFICATION_CONFIG_SYSTEME,
    AJOUT_VILLE, AJOUT_TYPE_BIEN, SAUVEGARDE_BASE
}
EOF

OK "6 énumérations générées"

# =============================================================================
# 3. ApiResponse<T> et PageResponse<T>
# =============================================================================
SECTION "3/7 — ApiResponse et PageResponse"

mkdir -p "$SHARED/response" "$SHARED/pagination"

cat > "$SHARED/response/ApiResponse.java" << 'EOF'
package com.mbem.immocam.shared.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Enveloppe standard pour toutes les reponses API ImmoCam.
 *
 * Format JSON :
 *   { "success": true, "message": "...", "data": {...}, "timestamp": "..." }
 *
 * Les champs null sont exclus (JsonInclude.NON_NULL).
 *
 * Usage :
 *   return ResponseEntity.ok(ApiResponse.ok("Annonce publiee", dto));
 *   return ResponseEntity.badRequest().body(ApiResponse.erreur("Invalide"));
 *
 * @param <T> Type de la donnee encapsulee
 * @author MBEMNOVA
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true).message(message).data(data)
                .timestamp(LocalDateTime.now()).build();
    }

    public static <T> ApiResponse<T> ok(T data) {
        return ok(null, data);
    }

    /** Reponse succes sans data (ex : suppression reussie). */
    public static <T> ApiResponse<T> message(String message) {
        return ApiResponse.<T>builder()
                .success(true).message(message)
                .timestamp(LocalDateTime.now()).build();
    }

    public static <T> ApiResponse<T> erreur(String message) {
        return ApiResponse.<T>builder()
                .success(false).message(message)
                .timestamp(LocalDateTime.now()).build();
    }
}
EOF

cat > "$SHARED/pagination/PageResponse.java" << 'EOF'
package com.mbem.immocam.shared.pagination;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Reponse paginee standard pour toutes les listes ImmoCam.
 *
 * Usage :
 *   Page<AnnonceResponse> page = service.lister(pageable);
 *   return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(page)));
 *
 * Le champ dernierePage = true signifie au frontend d'arreter le scroll infini.
 *
 * @param <T> Type des elements
 * @author MBEMNOVA
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> contenu;
    private int     pageActuelle;
    private int     taillePage;
    private long    totalElements;
    private int     totalPages;
    private boolean dernierePage;
    private boolean premierePage;

    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
                .contenu(page.getContent())
                .pageActuelle(page.getNumber())
                .taillePage(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .dernierePage(page.isLast())
                .premierePage(page.isFirst())
                .build();
    }
}
EOF
OK "ApiResponse.java et PageResponse.java générés"

# =============================================================================
# 4. ImmoCamConstants
# =============================================================================
SECTION "4/7 — ImmoCamConstants"

mkdir -p "$SHARED/constants"

cat > "$SHARED/constants/ImmoCamConstants.java" << 'EOF'
package com.mbem.immocam.shared.constants;

/**
 * Constantes globales de la plateforme ImmoCam.
 * Centralise toutes les constantes pour eviter magic strings et magic numbers.
 *
 * @author MBEMNOVA
 */
public final class ImmoCamConstants {

    private ImmoCamConstants() {
        throw new UnsupportedOperationException("Classe utilitaire non instanciable");
    }

    // ── JWT ────────────────────────────────────────────────────────────────
    public static final String BEARER_PREFIX        = "Bearer ";
    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String JWT_CLAIM_USER_ID    = "userId";
    public static final String JWT_CLAIM_ROLE       = "role";
    public static final String JWT_CLAIM_TYPE       = "type";
    public static final String JWT_TYPE_ACCESS      = "ACCESS";
    public static final String JWT_TYPE_REFRESH     = "REFRESH";

    // ── OTP ────────────────────────────────────────────────────────────────
    public static final String OTP_TYPE_EMAIL_VALIDATION = "EMAIL_VALIDATION";
    public static final String OTP_TYPE_REINITIALISATION  = "REINITIALISATION_MDP";

    // ── ANNONCES ───────────────────────────────────────────────────────────
    public static final int  SCROLL_PAGE_SIZE  = 12;
    public static final int  DESCRIPTION_MIN   = 30;
    public static final int  DESCRIPTION_MAX   = 1000;
    public static final long PRIX_MINIMUM_FCFA = 1_000L;

    // ── PHOTOS ─────────────────────────────────────────────────────────────
    public static final String[] FORMATS_PHOTO_ACCEPTES   = {"image/jpeg", "image/png", "image/webp"};
    public static final int      PHOTO_LARGEUR_MAX         = 1280;
    public static final int      PHOTO_HAUTEUR_MAX         = 1280;
    public static final double   PHOTO_QUALITE_COMPRESSION = 0.80;

    // ── COMMENTAIRES ───────────────────────────────────────────────────────
    public static final int    COMMENTAIRE_MIN            = 5;
    public static final int    COMMENTAIRE_MAX            = 500;
    public static final String COMMENTAIRE_SUPPRIME_TEXT  = "[Commentaire supprime]";
    public static final String UTILISATEUR_SUPPRIME_LABEL = "Utilisateur supprime";

    // ── TELEPHONE CAMEROUN ─────────────────────────────────────────────────
    public static final String PREFIXE_CAMEROUN         = "+237";
    public static final String REGEX_TELEPHONE_CAMEROUN = "^\\+237[26][0-9]{8}$";

    // ── CLES CONFIG SYSTEME ────────────────────────────────────────────────
    public static final String CONFIG_DUREE_VIE_ANNONCE = "DUREE_VIE_ANNONCE_JOURS";
    public static final String CONFIG_DELAI_RAPPEL      = "DELAI_RAPPEL_JOURS";
    public static final String CONFIG_DELAI_SUPPRESSION = "DELAI_SUPPRESSION_JOURS";
    public static final String CONFIG_MAX_PHOTOS        = "MAX_PHOTOS_PAR_ANNONCE";
    public static final String CONFIG_MAX_TAILLE_PHOTO  = "MAX_TAILLE_PHOTO_MO";
    public static final String CONFIG_MAX_ANNONCES      = "MAX_ANNONCES_PAR_PROPRIO";
    public static final String CONFIG_MSG_WHATSAPP      = "MSG_WHATSAPP";

    // ── ROLES SPRING SECURITY ──────────────────────────────────────────────
    public static final String ROLE_UTILISATEUR = "ROLE_UTILISATEUR";
    public static final String ROLE_ADMIN       = "ROLE_ADMINISTRATEUR";
}
EOF
OK "ImmoCamConstants.java généré"

# =============================================================================
# 5. PhoneUtils et DateUtils
# =============================================================================
SECTION "5/7 — Utilitaires"

mkdir -p "$SHARED/utils"

cat > "$SHARED/utils/PhoneUtils.java" << 'EOF'
package com.mbem.immocam.shared.utils;

/**
 * Utilitaires pour les numeros de telephone camerounais.
 *
 * Normalise tout numero au format international +237XXXXXXXXX
 * avant stockage en base de donnees.
 *
 * @author MBEMNOVA
 */
public final class PhoneUtils {

    private PhoneUtils() {}

    /**
     * Normalise un numero camerounais au format international.
     *
     * Exemples :
     *   "691234567"     -> "+237691234567"
     *   "0691234567"    -> "+237691234567"
     *   "+237691234567" -> "+237691234567" (inchange)
     *
     * @param telephone Numero brut saisi
     * @return Numero normalise +237XXXXXXXXX
     * @throws IllegalArgumentException si format non reconnu
     */
    public static String normaliser(String telephone) {
        if (telephone == null || telephone.isBlank()) {
            throw new IllegalArgumentException("Numero de telephone vide");
        }
        String n = telephone.replaceAll("[\\s\\-().]+", "");
        if (n.startsWith("+237")) return n;
        if (n.startsWith("0") && n.length() == 10) return "+237" + n.substring(1);
        if (n.length() == 9) return "+237" + n;
        throw new IllegalArgumentException(
            "Format non reconnu : " + telephone + ". Utilisez +237 6XX XXX XXX");
    }

    /**
     * Construit un lien WhatsApp click-to-chat.
     *
     * SECURITE : Le numero n'est JAMAIS expose dans l'API.
     * Il est integre uniquement dans ce lien wa.me (protection contre le scraping).
     *
     * @param telephone        Numero proprietaire (+237XXXXXXXXX)
     * @param messagePreRempli Message a pre-remplir
     * @return Lien wa.me complet avec message encode
     */
    public static String construireLienWhatsApp(String telephone, String messagePreRempli) {
        String num = telephone.replace("+", "");
        String msg = messagePreRempli
            .replace(" ", "%20")
            .replace("\n", "%0A")
            .replace(":", "%3A");
        return "https://wa.me/" + num + "?text=" + msg;
    }

    /**
     * Masque un numero pour l'affichage (dashboard proprietaire).
     * Exemple : "+237691234567" -> "+237 *** **** 567"
     *
     * @param telephone Numero complet
     * @return Numero partiellement masque
     */
    public static String masquer(String telephone) {
        if (telephone == null || telephone.length() < 4) return "***";
        return "+237 *** **** " + telephone.substring(telephone.length() - 3);
    }
}
EOF

cat > "$SHARED/utils/DateUtils.java" << 'EOF'
package com.mbem.immocam.shared.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * Utilitaires de dates pour ImmoCam.
 * Fuseau horaire : Africa/Douala (UTC+1).
 *
 * @author MBEMNOVA
 */
public final class DateUtils {

    public static final DateTimeFormatter FORMAT_AFFICHAGE =
        DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public static final DateTimeFormatter FORMAT_AFFICHAGE_HEURE =
        DateTimeFormatter.ofPattern("dd/MM/yyyy 'a' HH'h'mm");

    private DateUtils() {}

    /**
     * Calcule la date d'expiration d'une annonce.
     *
     * @param datePublication Date de publication
     * @param dureeJours      Duree de vie (issue de ConfigSysteme)
     * @return Date d'expiration
     */
    public static LocalDateTime calculerExpiration(LocalDateTime datePublication, int dureeJours) {
        return datePublication.plusDays(dureeJours);
    }

    /**
     * Verifie si une date est passee.
     *
     * @param date Date a verifier
     * @return true si dans le passe
     */
    public static boolean estExpiree(LocalDateTime date) {
        return date != null && LocalDateTime.now().isAfter(date);
    }

    /**
     * Calcule le nombre de jours restants avant une date.
     *
     * @param dateExpiration Date limite
     * @return Jours restants (negatif si deja expire)
     */
    public static long joursRestants(LocalDateTime dateExpiration) {
        return ChronoUnit.DAYS.between(LocalDateTime.now(), dateExpiration);
    }

    /**
     * Formate une date en texte relatif lisible par l'utilisateur.
     * Exemples : "A l'instant", "Il y a 2 heures", "Le 05/04/2026"
     *
     * @param date Date a formater
     * @return Texte relatif
     */
    public static String formatRelatif(LocalDateTime date) {
        if (date == null) return "";
        long min  = ChronoUnit.MINUTES.between(date, LocalDateTime.now());
        long h    = ChronoUnit.HOURS.between(date, LocalDateTime.now());
        long j    = ChronoUnit.DAYS.between(date, LocalDateTime.now());
        if (min < 1)  return "A l'instant";
        if (min < 60) return "Il y a " + min + " minute"  + (min > 1 ? "s" : "");
        if (h   < 24) return "Il y a " + h   + " heure"   + (h   > 1 ? "s" : "");
        if (j   < 7)  return "Il y a " + j   + " jour"    + (j   > 1 ? "s" : "");
        return "Le " + date.format(FORMAT_AFFICHAGE);
    }

    /**
     * Formate une date pour les templates email.
     *
     * @param date Date a formater
     * @return Ex : "05/04/2026 a 14h30"
     */
    public static String formatEmail(LocalDateTime date) {
        return date == null ? "" : date.format(FORMAT_AFFICHAGE_HEURE);
    }
}
EOF
OK "PhoneUtils.java et DateUtils.java générés"

# =============================================================================
# 6. Annotation @TelephoneCameroun
# =============================================================================
SECTION "6/7 — @TelephoneCameroun"

mkdir -p "$SHARED/validation"

cat > "$SHARED/validation/TelephoneCameroun.java" << 'EOF'
package com.mbem.immocam.shared.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation Bean Validation pour les numeros de telephone camerounais.
 * Valide le format : +237[26]XXXXXXXX
 *
 * Usage dans les DTOs :
 *   @TelephoneCameroun
 *   private String telephone;
 *
 * @author MBEMNOVA
 */
@Documented
@Constraint(validatedBy = TelephoneCamerounValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface TelephoneCameroun {
    String message() default "Numero camerounais invalide. Format : +237 6XX XXX XXX";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
EOF

cat > "$SHARED/validation/TelephoneCamerounValidator.java" << 'EOF'
package com.mbem.immocam.shared.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validateur pour @TelephoneCameroun.
 * Accepte null (combiner avec @NotBlank si champ obligatoire).
 *
 * @author MBEMNOVA
 */
public class TelephoneCamerounValidator
        implements ConstraintValidator<TelephoneCameroun, String> {

    private static final String REGEX = "^\\+237[26][0-9]{8}$";

    @Override
    public void initialize(TelephoneCameroun constraintAnnotation) {}

    @Override
    public boolean isValid(String telephone, ConstraintValidatorContext context) {
        if (telephone == null || telephone.isBlank()) return true;
        return telephone.replaceAll("[\\s\\-().]+", "").matches(REGEX);
    }
}
EOF
OK "@TelephoneCameroun et TelephoneCamerounValidator générés"

# =============================================================================
# 7. AppConfig + ImmocamApplication mis à jour
# =============================================================================
SECTION "7/7 — AppConfig + ImmocamApplication"

mkdir -p "$BASE/config"

cat > "$BASE/config/AppConfig.java" << 'EOF'
package com.mbem.immocam.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * Configuration principale Spring Boot d'ImmoCam.
 *
 * Active par ImmocamApplication :
 *   @EnableJpaAuditing  -> remplissage auto dateCreation/dateModification
 *   @EnableCaching      -> cache Caffeine (OTP, listes villes/types)
 *   @EnableAsync        -> envoi email non bloquant
 *   @EnableScheduling   -> cron nocturne expiration annonces
 *
 * @author MBEMNOVA
 */
@Configuration
public class AppConfig {

    /**
     * Fournit l'identite de l'auteur pour JPA Auditing.
     * Utilisateur connecte -> son email. Systeme -> "system".
     *
     * @return AuditorAware<String>
     */
    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null
                    || !auth.isAuthenticated()
                    || "anonymousUser".equals(auth.getPrincipal())) {
                return Optional.of("system");
            }
            return Optional.of(auth.getName());
        };
    }
}
EOF

cat > "$BASE/ImmocamApplication.java" << 'EOF'
package com.mbem.immocam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Point d'entree de l'application ImmoCam.
 * Plateforme immobiliere camerounaise — MBEMNOVA.
 *
 * @EnableJpaAuditing  : dateCreation/dateModification auto sur BaseEntity
 * @EnableCaching      : cache Caffeine (OTP rate-limit, listes)
 * @EnableAsync        : envoi emails asynchrone (ne bloque pas la requete HTTP)
 * @EnableScheduling   : cron 3h00 d'expiration automatique des annonces
 *
 * @author MBEMNOVA
 */
@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
@EnableCaching
@EnableAsync
@EnableScheduling
public class ImmocamApplication {

    public static void main(String[] args) {
        SpringApplication.run(ImmocamApplication.class, args);
    }
}
EOF
OK "AppConfig.java généré"
OK "ImmocamApplication.java mis à jour"

# =============================================================================
# Résumé
# =============================================================================
echo ""
JAVA_COUNT=$(find src/main/java -name "*.java" | wc -l)
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SCRIPT 03 TERMINÉ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Fichiers Java total : $JAVA_COUNT"
INFO "Generes dans ce script :"
INFO "  shared/entity/BaseEntity.java"
INFO "  shared/enums/  (6 enums)"
INFO "  shared/response/ApiResponse.java"
INFO "  shared/pagination/PageResponse.java"
INFO "  shared/constants/ImmoCamConstants.java"
INFO "  shared/utils/PhoneUtils.java + DateUtils.java"
INFO "  shared/validation/TelephoneCameroun.java + Validator"
INFO "  config/AppConfig.java"
INFO "  ImmocamApplication.java (mis a jour)"
echo ""
INFO "Prochaine etape : bash setup_04_entities_and_migrations.sh"