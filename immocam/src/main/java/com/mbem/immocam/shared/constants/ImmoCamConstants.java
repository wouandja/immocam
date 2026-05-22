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
    public static final int  SCROLL_PAGE_SIZE  = 8;
    public static final int  SCROLL_PAGE_SIZE_MAX = 20;
    public static final int  DASHBOARD_PAGE_SIZE_MAX = 20;
    public static final int  ADMIN_PAGE_SIZE_MAX = 50;
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
    public static final String CONFIG_DELAI_RAPPEL_FINAL = "DELAI_RAPPEL_FINAL_JOURS";
    public static final String CONFIG_MAX_CONNEXIONS_ECHOUEES = "MAX_CONNEXIONS_ECHOUEES";
    public static final String CONFIG_DUREE_BLOCAGE_MINUTES = "DUREE_BLOCAGE_MINUTES";

    // ── ROLES SPRING SECURITY ──────────────────────────────────────────────
    public static final String ROLE_UTILISATEUR = "ROLE_UTILISATEUR";
    public static final String ROLE_ADMIN       = "ROLE_ADMINISTRATEUR";
}
