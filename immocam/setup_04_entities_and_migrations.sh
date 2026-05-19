#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — SCRIPT 04 : ENTITÉS JPA + MIGRATIONS FLYWAY
# =============================================================================
# Rôle     : Génère toutes les entités JPA et les 4 migrations Flyway SQL :
#            Entités : Utilisateur, Annonce, Photo, Localisation, TypeBien,
#                      ContactWhatsApp, Favori, Commentaire, Signalement,
#                      ConfigSysteme, LogActivite, CodeValidation,
#                      TokenReinitialisation
#            Flyway  : V1 schéma complet, V2 types biens, V3 villes, V4 config
#
# Exécuter : Depuis la RACINE du projet
#            bash setup_04_entities_and_migrations.sh
# Prérequis: Scripts 01, 02, 03 exécutés
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

SECTION "SCRIPT 04 — ENTITÉS JPA + MIGRATIONS FLYWAY"
INFO "Répertoire courant : $(pwd)"

BASE="src/main/java/com/mbem/immocam"
MOD="$BASE/module"
INFRA="$BASE/infrastructure"
MIGRATIONS="src/main/resources/db/migration"

[[ -d "$MOD" ]]        || ERROR "Dossier $MOD introuvable. Lancez d'abord le script 01."
[[ -d "$MIGRATIONS" ]] || ERROR "Dossier $MIGRATIONS introuvable. Lancez d'abord le script 01."

# =============================================================================
# 1. Utilisateur.java
# =============================================================================
SECTION "1/13 — Utilisateur.java"

mkdir -p "$MOD/utilisateur/entity"

cat > "$MOD/utilisateur/entity/Utilisateur.java" << 'EOF'
package com.mbem.immocam.module.utilisateur.entity;

import com.mbem.immocam.shared.entity.BaseEntity;
import com.mbem.immocam.shared.enums.RoleUtilisateur;
import com.mbem.immocam.shared.enums.StatutCompte;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entite centrale du systeme ImmoCam.
 *
 * Un seul compte pour tout : locataire, proprietaire, admin.
 * Un utilisateur devient proprietaire des sa premiere publication.
 *
 * Securite connexion :
 *   - Apres 5 tentatives echouees en 15 min -> compte bloque 30 min
 *   - Email valide par OTP 6 chiffres valable 10 min
 *
 * Politique de confidentialite :
 *   - Obligatoirement acceptee a l'inscription (bouton desactive sinon)
 *   - Date d'acceptation enregistree pour audit
 *
 * @author MBEMNOVA
 */
@Entity
@Table(
    name = "utilisateurs",
    uniqueConstraints = @UniqueConstraint(columnNames = "email")
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Utilisateur extends BaseEntity {

    @Column(nullable = false, length = 50)
    private String prenom;

    @Column(nullable = false, length = 50)
    private String nom;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /** Stocke au format normalise +237XXXXXXXXX */
    @Column(nullable = false, length = 20)
    private String telephone;

    /** Hash BCrypt — jamais expose dans les reponses API. */
    @Column(name = "mot_de_passe_hash", nullable = false)
    private String motDePasseHash;

    @Column(nullable = false, length = 100)
    private String ville;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RoleUtilisateur role = RoleUtilisateur.UTILISATEUR;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutCompte statut = StatutCompte.NON_VERIFIE;

    // ── Politique de confidentialite ──────────────────────────────────────
    @Column(name = "politique_acceptee", nullable = false)
    @Builder.Default
    private boolean politiqueAcceptee = false;

    @Column(name = "date_acceptation_politique")
    private LocalDateTime dateAcceptationPolitique;

    // ── Securite — gestion des tentatives de connexion ─────────────────────
    @Column(name = "tentatives_connexion_echouees", nullable = false)
    @Builder.Default
    private int tentativesConnexionEchouees = 0;

    /** Date jusqu'a laquelle le compte est bloque (null = non bloque). */
    @Column(name = "compte_bloque_jusqu_a")
    private LocalDateTime compteBloqueJusqua;

    // ── Suspension admin ──────────────────────────────────────────────────
    @Column(name = "motif_suspension")
    private String motifSuspension;

    @Column(name = "date_suspension")
    private LocalDateTime dateSuspension;

    // ── Activite ──────────────────────────────────────────────────────────
    @Column(name = "dernier_login")
    private LocalDateTime dernierLogin;

    // ── Methodes utilitaires ──────────────────────────────────────────────

    /**
     * Verifie si le compte est actuellement bloque par le mecanisme
     * anti-brute-force (5 tentatives echouees -> 30 min de blocage).
     */
    public boolean estBloque() {
        return compteBloqueJusqua != null
                && LocalDateTime.now().isBefore(compteBloqueJusqua);
    }

    /** Retourne le nom complet (prenom + nom). */
    public String getNomComplet() {
        return prenom + " " + nom;
    }
}
EOF
OK "Utilisateur.java généré"

# =============================================================================
# 2. Annonce.java
# =============================================================================
SECTION "2/13 — Annonce.java"

mkdir -p "$MOD/annonce/entity"

cat > "$MOD/annonce/entity/Annonce.java" << 'EOF'
package com.mbem.immocam.module.annonce.entity;

import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.typebien.entity.TypeBien;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.entity.BaseEntity;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entite centrale metier d'ImmoCam.
 *
 * Publication directe : statut ACTIVE immediatement a la soumission.
 * Pas de file d'attente de moderation.
 *
 * Cycle de vie automatique gere par AnnonceExpirationScheduler (cron 3h00) :
 *   J-5 : rappel email au proprietaire
 *   J-1 : rappel email final
 *   J0  : statut EXPIREE (invisible du public)
 *   J+7 : statut SUPPRIMEE_SYSTEME (suppression definitive)
 *
 * Securite WhatsApp : le numero n'est jamais expose dans l'API.
 * Utilise uniquement pour generer le lien wa.me cote service.
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "annonces")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Annonce extends BaseEntity {

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    /** Prix en FCFA — minimum 1 000 FCFA. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal prix;

    /**
     * Numero WhatsApp du proprietaire.
     * JAMAIS expose en clair dans l'API — utilise uniquement pour generer wa.me.
     */
    @Column(name = "numero_whatsapp", nullable = false, length = 20)
    private String numeroWhatsApp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    @Builder.Default
    private StatutAnnonce statut = StatutAnnonce.ACTIVE;

    @Column(name = "nombre_vues", nullable = false)
    @Builder.Default
    private int nombreVues = 0;

    // ── Relations ─────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proprietaire_id", nullable = false)
    private Utilisateur proprietaire;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "type_bien_id", nullable = false)
    private TypeBien typeBien;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "localisation_id", nullable = false)
    private Localisation localisation;

    @OneToMany(mappedBy = "annonce", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<Photo> photos = new ArrayList<>();

    // ── Cycle de vie ──────────────────────────────────────────────────────

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Column(name = "rappel_j5_envoye", nullable = false)
    @Builder.Default
    private boolean rappelJ5Envoye = false;

    @Column(name = "rappel_j1_envoye", nullable = false)
    @Builder.Default
    private boolean rappelJ1Envoye = false;

    // ── Suppression admin ─────────────────────────────────────────────────

    @Column(name = "motif_suppression")
    private String motifSuppression;

    @Column(name = "supprime_par_id")
    private Long supprimeParId;

    @Column(name = "date_suppression")
    private LocalDateTime dateSuppression;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean deleted = false;

    // ── Methodes utilitaires ──────────────────────────────────────────────

    /** Incremente le compteur de vues a chaque consultation du detail. */
    public void incrementerVues() { this.nombreVues++; }

    /** Verifie si l'annonce est expiree. */
    public boolean estExpiree() {
        return dateExpiration != null && LocalDateTime.now().isAfter(dateExpiration);
    }

    /** Verifie si l'annonce est visible publiquement. */
    public boolean estVisible() {
        return StatutAnnonce.ACTIVE.equals(this.statut) && !this.deleted;
    }
}
EOF
OK "Annonce.java généré"

# =============================================================================
# 3. Photo.java
# =============================================================================
SECTION "3/13 — Photo.java"

cat > "$MOD/annonce/entity/Photo.java" << 'EOF'
package com.mbem.immocam.module.annonce.entity;

import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Photo d'une annonce immobiliere.
 *
 * Stockage : local VPS dans uploads/annonces/YYYY/MM/
 * Compression : Thumbnailator, JPEG 80%, max 1280px
 * Limite : 0 minimum (annonce sans photo autorisee) — 4 maximum
 * Formats acceptes : JPG, PNG, WebP — Taille max : 4 Mo
 *
 * La photo avec ordre = 1 est la photo principale du carrousel.
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "photos")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Photo extends BaseEntity {

    /**
     * Chemin relatif depuis le dossier uploads/.
     * Exemple : "annonces/2026/04/uuid_12345.jpg"
     */
    @Column(name = "chemin_stockage", nullable = false, length = 500)
    private String cheminStockage;

    @Column(name = "nom_original", length = 255)
    private String nomOriginal;

    /** Ordre dans le carrousel. ordre = 1 => photo principale. */
    @Column(nullable = false)
    private int ordre;

    @Column(name = "est_principale", nullable = false)
    @Builder.Default
    private boolean estPrincipale = false;

    /** Taille en octets apres compression Thumbnailator. */
    @Column(name = "taille_octets")
    private long tailleOctets;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annonce_id", nullable = false)
    private Annonce annonce;
}
EOF
OK "Photo.java généré"

# =============================================================================
# 4. Localisation.java
# =============================================================================
SECTION "4/13 — Localisation.java"

mkdir -p "$MOD/localisation/entity"

cat > "$MOD/localisation/entity/Localisation.java" << 'EOF'
package com.mbem.immocam.module.localisation.entity;

import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Localisation geographique — couple ville/quartier.
 *
 * Les 20 villes camerounaises sont pre-chargees via la migration Flyway V3.
 * L'admin peut ajouter, modifier ou desactiver des villes depuis son interface.
 * Les quartiers sont charges dynamiquement selon la ville selectionnee.
 *
 * 20 villes initiales :
 *   Yaounde, Douala, Maroua, Garoua, Ngaoundere, Bertoua, Mbalmayo, Bafia,
 *   Nkongsamba, Edea, Bafoussam, Dschang, Foumban, Bamenda, Buea, Kumba,
 *   Limbe, Ebolowa, Kribi, Sangmelima
 *
 * @author MBEMNOVA
 */
@Entity
@Table(
    name = "localisations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"ville", "quartier"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Localisation extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String ville;

    /** Peut etre null pour les entrees de type "ville generique". */
    @Column(length = 100)
    private String quartier;

    @Column(name = "est_active", nullable = false)
    @Builder.Default
    private boolean estActive = true;

    /** true = pre-chargee via migration Flyway. */
    @Column(name = "est_pre_chargee", nullable = false)
    @Builder.Default
    private boolean estPreChargee = false;
}
EOF
OK "Localisation.java généré"

# =============================================================================
# 5. TypeBien.java
# =============================================================================
SECTION "5/13 — TypeBien.java"

mkdir -p "$MOD/typebien/entity"

cat > "$MOD/typebien/entity/TypeBien.java" << 'EOF'
package com.mbem.immocam.module.typebien.entity;

import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Type de bien immobilier.
 *
 * 8 types initiaux charges via migration Flyway V2 :
 * Chambre, Studio, Appartement, Bureau, Magasin, Maison, Boutique, Espace
 *
 * L'admin peut ajouter, modifier ou desactiver des types.
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "types_biens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypeBien extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String libelle;

    @Column(name = "est_actif", nullable = false)
    @Builder.Default
    private boolean estActif = true;
}
EOF
OK "TypeBien.java généré"

# =============================================================================
# 6. ContactWhatsApp.java
# =============================================================================
SECTION "6/13 — ContactWhatsApp.java"

mkdir -p "$MOD/contact/entity"

cat > "$MOD/contact/entity/ContactWhatsApp.java" << 'EOF'
package com.mbem.immocam.module.contact.entity;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Enregistrement d'un clic sur le bouton "Contacter via WhatsApp".
 *
 * Connexion obligatoire pour contacter un proprietaire.
 * Le proprietaire consulte ces donnees dans son dashboard (par annonce).
 *
 * SECURITE : Le numero WhatsApp du proprietaire n'est jamais stocke ici.
 * Seul le telephone de l'utilisateur qui a clique est enregistre.
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "contacts_whatsapp")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactWhatsApp extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annonce_id", nullable = false)
    private Annonce annonce;

    /** Telephone de l'utilisateur qui a clique (son propre numero). */
    @Column(name = "telephone_contact", length = 20)
    private String telephoneContact;

    /** Adresse IP pour audit de securite. */
    @Column(name = "adresse_ip", length = 45)
    private String adresseIp;

    @Column(name = "date_contact", nullable = false)
    private LocalDateTime dateContact;
}
EOF
OK "ContactWhatsApp.java généré"

# =============================================================================
# 7. Favori.java
# =============================================================================
SECTION "7/13 — Favori.java"

mkdir -p "$MOD/favori/entity"

cat > "$MOD/favori/entity/Favori.java" << 'EOF'
package com.mbem.immocam.module.favori.entity;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Annonce mise en favori par un utilisateur.
 *
 * La liste des favoris affiche le statut actuel de chaque annonce :
 *   ACTIVE          : affichage normal
 *   EN_PAUSE        : badge "Temporairement indisponible"
 *   EXPIREE         : badge "Cette annonce a expire"
 *   SUPPRIMEE/autre : "Cette annonce n'est plus disponible" + bouton Supprimer
 *
 * @author MBEMNOVA
 */
@Entity
@Table(
    name = "favoris",
    uniqueConstraints = @UniqueConstraint(columnNames = {"utilisateur_id", "annonce_id"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Favori extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annonce_id", nullable = false)
    private Annonce annonce;
}
EOF
OK "Favori.java généré"

# =============================================================================
# 8. Commentaire.java
# =============================================================================
SECTION "8/13 — Commentaire.java"

mkdir -p "$MOD/commentaire/entity"

cat > "$MOD/commentaire/entity/Commentaire.java" << 'EOF'
package com.mbem.immocam.module.commentaire.entity;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Commentaire poste sur une annonce immobiliere.
 *
 * Regles :
 *   - Connexion obligatoire pour commenter
 *   - Visiteurs non connectes : lecture seule
 *   - Publication immediate sans moderation
 *   - Non modifiable apres publication (seulement supprimable)
 *   - Un seul niveau de reponse (reponse du proprietaire)
 *
 * Affichage :
 *   - Tries du plus ancien au plus recent (chronologique)
 *   - Prenom de l'auteur visible, telephone et email JAMAIS affiches
 *
 * Suppression (soft delete) :
 *   - Contenu remplace par "[Commentaire supprime]"
 *   - Auteur, proprietaire de l'annonce et admin peuvent supprimer
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "commentaires")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Commentaire extends BaseEntity {

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annonce_id", nullable = false)
    private Annonce annonce;

    /**
     * Commentaire parent pour les reponses du proprietaire.
     * Un seul niveau — pas de fils imbriques.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commentaire_parent_id")
    private Commentaire commentaireParent;

    @OneToMany(mappedBy = "commentaireParent")
    @Builder.Default
    private List<Commentaire> reponses = new ArrayList<>();

    @Column(name = "est_supprime", nullable = false)
    @Builder.Default
    private boolean estSupprime = false;

    @Column(name = "supprime_par_admin", nullable = false)
    @Builder.Default
    private boolean supprimeParAdmin = false;

    @Column(name = "motif_suppression_admin")
    private String motifSuppressionAdmin;
}
EOF
OK "Commentaire.java généré"

# =============================================================================
# 9. Signalement.java
# =============================================================================
SECTION "9/13 — Signalement.java"

mkdir -p "$MOD/signalement/entity"

cat > "$MOD/signalement/entity/Signalement.java" << 'EOF'
package com.mbem.immocam.module.signalement.entity;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.entity.BaseEntity;
import com.mbem.immocam.shared.enums.MotifSignalement;
import com.mbem.immocam.shared.enums.StatutSignalement;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Signalement d'une annonce par un utilisateur connecte.
 *
 * Regles :
 *   - Connexion obligatoire pour signaler
 *   - Le motif est obligatoire
 *   - Si motif = AUTRE : champ texte libre obligatoire
 *
 * Traitement admin (4 decisions) :
 *   IGNORE      -> Annonce reste active
 *   SUPPRESSION -> Annonce supprimee + proprietaire notifie
 *   SUSPENSION  -> Compte proprietaire suspendu
 *   BANNISSEMENT -> Via action separee sur le compte
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "signalements")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Signalement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annonce_id", nullable = false)
    private Annonce annonce;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MotifSignalement motif;

    /** Obligatoire si motif = AUTRE. Optionnel sinon pour precisions. */
    @Column(columnDefinition = "TEXT")
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatutSignalement statut = StatutSignalement.EN_ATTENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par_id")
    private Utilisateur traiteParAdmin;

    @Column(name = "date_traitement")
    private LocalDateTime dateTraitement;
}
EOF
OK "Signalement.java généré"

# =============================================================================
# 10. ConfigSysteme.java
# =============================================================================
SECTION "10/13 — ConfigSysteme.java"

mkdir -p "$MOD/config/entity"

cat > "$MOD/config/entity/ConfigSysteme.java" << 'EOF'
package com.mbem.immocam.module.config.entity;

import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Parametres configurables par l'admin sans toucher au code ni redeployer.
 *
 * Cles disponibles (ImmoCamConstants.CONFIG_*) :
 *   DUREE_VIE_ANNONCE_JOURS  -> 30 jours (defaut)
 *   DELAI_RAPPEL_JOURS       -> 5 jours (J-5)
 *   DELAI_SUPPRESSION_JOURS  -> 7 jours apres expiration (J+7)
 *   MAX_PHOTOS_PAR_ANNONCE   -> 4 photos (defaut)
 *   MAX_TAILLE_PHOTO_MO      -> 4 Mo (defaut)
 *   MAX_ANNONCES_PAR_PROPRIO -> 5 annonces actives (defaut)
 *   MSG_WHATSAPP             -> Template message pre-rempli
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "config_systeme")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfigSysteme extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String cle;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String valeur;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Admin qui a effectue la derniere modification. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modifie_par_id")
    private Utilisateur modifiePar;
}
EOF
OK "ConfigSysteme.java généré"

# =============================================================================
# 11. LogActivite.java
# =============================================================================
SECTION "11/13 — LogActivite.java"

mkdir -p "$INFRA/audit"

cat > "$INFRA/audit/LogActivite.java" << 'EOF'
package com.mbem.immocam.infrastructure.audit;

import com.mbem.immocam.shared.entity.BaseEntity;
import com.mbem.immocam.shared.enums.TypeAction;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Log d'activite pour l'audit complet de la plateforme.
 *
 * Enregistre toutes les actions significatives : authentification,
 * publications, modifications, contacts WhatsApp, signalements,
 * actions administratives.
 *
 * Utilise dans le dashboard admin pour l'historique.
 * Conservation : 12 mois (politique de confidentialite).
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "logs_activite")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogActivite extends BaseEntity {

    /** ID de l'utilisateur concerne (null si action systeme). */
    @Column(name = "utilisateur_id")
    private Long utilisateurId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_action", nullable = false, length = 40)
    private TypeAction typeAction;

    /** Nom de l'entite concernee (ex : "Annonce", "Utilisateur"). */
    @Column(name = "entite_concernee", length = 50)
    private String entiteConcernee;

    /** ID de l'entite concernee. */
    @Column(name = "entite_id")
    private Long entiteId;

    /** Adresse IP de la requete (audit de securite). */
    @Column(name = "adresse_ip", length = 45)
    private String adresseIp;

    /** Details complementaires (JSON ou texte libre). */
    @Column(name = "details", columnDefinition = "TEXT")
    private String details;
}
EOF
OK "LogActivite.java généré"

# =============================================================================
# 12. CodeValidation.java et TokenReinitialisation.java
# =============================================================================
SECTION "12/13 — CodeValidation.java et TokenReinitialisation.java"

mkdir -p "$MOD/auth/entity"

cat > "$MOD/auth/entity/CodeValidation.java" << 'EOF'
package com.mbem.immocam.module.auth.entity;

import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Code OTP a 6 chiffres pour validation email et reinitialisation mot de passe.
 *
 * Regles :
 *   - Valable 10 minutes apres generation
 *   - Maximum 3 renvois par heure (anti-spam)
 *   - Usage unique (estUtilise = true apres utilisation)
 *   - Types : EMAIL_VALIDATION ou REINITIALISATION_MDP
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "codes_validation")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeValidation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    /** Code OTP a 6 chiffres. */
    @Column(nullable = false, length = 10)
    private String code;

    /** EMAIL_VALIDATION ou REINITIALISATION_MDP */
    @Column(name = "type_code", nullable = false, length = 30)
    private String typeCode;

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Column(name = "est_utilise", nullable = false)
    @Builder.Default
    private boolean estUtilise = false;

    /** Compteur de renvois — max 3 par heure. */
    @Column(name = "nombre_renvois", nullable = false)
    @Builder.Default
    private int nombreRenvois = 0;

    /** Verifie si le code est encore valide (non expire et non utilise). */
    public boolean estValide() {
        return !estUtilise && LocalDateTime.now().isBefore(dateExpiration);
    }
}
EOF

cat > "$MOD/auth/entity/TokenReinitialisation.java" << 'EOF'
package com.mbem.immocam.module.auth.entity;

import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Token UUID unique envoye par email pour reinitialiser le mot de passe.
 *
 * Regles :
 *   - Lien valable 30 minutes
 *   - Usage unique (estUtilise = true apres utilisation)
 *   - Un seul token actif par utilisateur a la fois
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "tokens_reinitialisation")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenReinitialisation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Column(name = "est_utilise", nullable = false)
    @Builder.Default
    private boolean estUtilise = false;

    /** Verifie si le token est encore valide (non expire et non utilise). */
    public boolean estValide() {
        return !estUtilise && LocalDateTime.now().isBefore(dateExpiration);
    }
}
EOF
OK "CodeValidation.java et TokenReinitialisation.java générés"

# =============================================================================
# 13. Migrations Flyway SQL
# =============================================================================
SECTION "13/13 — Migrations Flyway (V1 à V4)"

# ── V1 : Schéma complet ──────────────────────────────────────────────────────
cat > "$MIGRATIONS/V1__creation_schema.sql" << 'EOF'
-- =============================================================================
-- IMMOCAM — V1 : Creation du schema complet
-- Execute automatiquement par Flyway au premier demarrage
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Utilisateurs
CREATE TABLE utilisateurs (
    id                              BIGSERIAL    PRIMARY KEY,
    prenom                          VARCHAR(50)  NOT NULL,
    nom                             VARCHAR(50)  NOT NULL,
    email                           VARCHAR(150) NOT NULL UNIQUE,
    telephone                       VARCHAR(20)  NOT NULL,
    mot_de_passe_hash               TEXT         NOT NULL,
    ville                           VARCHAR(100) NOT NULL,
    role                            VARCHAR(20)  NOT NULL DEFAULT 'UTILISATEUR',
    statut                          VARCHAR(20)  NOT NULL DEFAULT 'NON_VERIFIE',
    politique_acceptee              BOOLEAN      NOT NULL DEFAULT FALSE,
    date_acceptation_politique      TIMESTAMP,
    tentatives_connexion_echouees   INTEGER      NOT NULL DEFAULT 0,
    compte_bloque_jusqu_a           TIMESTAMP,
    motif_suspension                TEXT,
    date_suspension                 TIMESTAMP,
    dernier_login                   TIMESTAMP,
    date_creation                   TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification               TIMESTAMP
);
CREATE INDEX idx_utilisateurs_email  ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_statut ON utilisateurs(statut);

-- Codes OTP
CREATE TABLE codes_validation (
    id                BIGSERIAL    PRIMARY KEY,
    utilisateur_id    BIGINT       NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    code              VARCHAR(10)  NOT NULL,
    type_code         VARCHAR(30)  NOT NULL,
    date_expiration   TIMESTAMP    NOT NULL,
    est_utilise       BOOLEAN      NOT NULL DEFAULT FALSE,
    nombre_renvois    INTEGER      NOT NULL DEFAULT 0,
    date_creation     TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);
CREATE INDEX idx_codes_validation_user ON codes_validation(utilisateur_id);

-- Tokens reinitialisation mot de passe
CREATE TABLE tokens_reinitialisation (
    id                BIGSERIAL    PRIMARY KEY,
    utilisateur_id    BIGINT       NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    token             VARCHAR(255) NOT NULL UNIQUE,
    date_expiration   TIMESTAMP    NOT NULL,
    est_utilise       BOOLEAN      NOT NULL DEFAULT FALSE,
    date_creation     TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);

-- Types de biens
CREATE TABLE types_biens (
    id                BIGSERIAL   PRIMARY KEY,
    libelle           VARCHAR(50) NOT NULL UNIQUE,
    est_actif         BOOLEAN     NOT NULL DEFAULT TRUE,
    date_creation     TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);

-- Localisations (villes + quartiers)
CREATE TABLE localisations (
    id                BIGSERIAL    PRIMARY KEY,
    ville             VARCHAR(100) NOT NULL,
    quartier          VARCHAR(100),
    est_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    est_pre_chargee   BOOLEAN      NOT NULL DEFAULT FALSE,
    date_creation     TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP,
    UNIQUE(ville, quartier)
);
CREATE INDEX idx_localisations_ville  ON localisations(ville);
CREATE INDEX idx_localisations_active ON localisations(est_active);

-- Annonces
CREATE TABLE annonces (
    id                  BIGSERIAL       PRIMARY KEY,
    description         TEXT            NOT NULL,
    prix                NUMERIC(12,2)   NOT NULL,
    numero_whatsapp     VARCHAR(20)     NOT NULL,
    statut              VARCHAR(25)     NOT NULL DEFAULT 'ACTIVE',
    nombre_vues         INTEGER         NOT NULL DEFAULT 0,
    proprietaire_id     BIGINT          NOT NULL REFERENCES utilisateurs(id),
    type_bien_id        BIGINT          NOT NULL REFERENCES types_biens(id),
    localisation_id     BIGINT          NOT NULL REFERENCES localisations(id),
    date_expiration     TIMESTAMP       NOT NULL,
    rappel_j5_envoye    BOOLEAN         NOT NULL DEFAULT FALSE,
    rappel_j1_envoye    BOOLEAN         NOT NULL DEFAULT FALSE,
    motif_suppression   TEXT,
    supprime_par_id     BIGINT,
    date_suppression    TIMESTAMP,
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    date_creation       TIMESTAMP       NOT NULL DEFAULT NOW(),
    date_modification   TIMESTAMP
);
CREATE INDEX idx_annonces_statut       ON annonces(statut);
CREATE INDEX idx_annonces_proprietaire ON annonces(proprietaire_id);
CREATE INDEX idx_annonces_expiration   ON annonces(date_expiration);
CREATE INDEX idx_annonces_deleted      ON annonces(is_deleted);
CREATE INDEX idx_annonces_publiques    ON annonces(statut, is_deleted)
    WHERE statut = 'ACTIVE' AND is_deleted = FALSE;

-- Photos
CREATE TABLE photos (
    id                BIGSERIAL    PRIMARY KEY,
    chemin_stockage   VARCHAR(500) NOT NULL,
    nom_original      VARCHAR(255),
    ordre             INTEGER      NOT NULL DEFAULT 1,
    est_principale    BOOLEAN      NOT NULL DEFAULT FALSE,
    taille_octets     BIGINT,
    annonce_id        BIGINT       NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
    date_creation     TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);
CREATE INDEX idx_photos_annonce ON photos(annonce_id);

-- Contacts WhatsApp
CREATE TABLE contacts_whatsapp (
    id                 BIGSERIAL   PRIMARY KEY,
    utilisateur_id     BIGINT      NOT NULL REFERENCES utilisateurs(id),
    annonce_id         BIGINT      NOT NULL REFERENCES annonces(id),
    telephone_contact  VARCHAR(20),
    adresse_ip         VARCHAR(45),
    date_contact       TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_creation      TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_modification  TIMESTAMP
);
CREATE INDEX idx_contacts_annonce     ON contacts_whatsapp(annonce_id);
CREATE INDEX idx_contacts_utilisateur ON contacts_whatsapp(utilisateur_id);

-- Favoris
CREATE TABLE favoris (
    id                BIGSERIAL   PRIMARY KEY,
    utilisateur_id    BIGINT      NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    annonce_id        BIGINT      NOT NULL REFERENCES annonces(id),
    date_creation     TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP,
    UNIQUE(utilisateur_id, annonce_id)
);
CREATE INDEX idx_favoris_utilisateur ON favoris(utilisateur_id);

-- Commentaires
CREATE TABLE commentaires (
    id                       BIGSERIAL   PRIMARY KEY,
    contenu                  TEXT        NOT NULL,
    auteur_id                BIGINT      NOT NULL REFERENCES utilisateurs(id),
    annonce_id               BIGINT      NOT NULL REFERENCES annonces(id),
    commentaire_parent_id    BIGINT      REFERENCES commentaires(id),
    est_supprime             BOOLEAN     NOT NULL DEFAULT FALSE,
    supprime_par_admin       BOOLEAN     NOT NULL DEFAULT FALSE,
    motif_suppression_admin  TEXT,
    date_creation            TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_modification        TIMESTAMP
);
CREATE INDEX idx_commentaires_annonce ON commentaires(annonce_id);
CREATE INDEX idx_commentaires_auteur  ON commentaires(auteur_id);

-- Signalements
CREATE TABLE signalements (
    id                BIGSERIAL   PRIMARY KEY,
    auteur_id         BIGINT      NOT NULL REFERENCES utilisateurs(id),
    annonce_id        BIGINT      NOT NULL REFERENCES annonces(id),
    motif             VARCHAR(30) NOT NULL,
    details           TEXT,
    statut            VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
    traite_par_id     BIGINT      REFERENCES utilisateurs(id),
    date_traitement   TIMESTAMP,
    date_creation     TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);
CREATE INDEX idx_signalements_statut  ON signalements(statut);
CREATE INDEX idx_signalements_annonce ON signalements(annonce_id);

-- Configuration systeme
CREATE TABLE config_systeme (
    id                BIGSERIAL    PRIMARY KEY,
    cle               VARCHAR(100) NOT NULL UNIQUE,
    valeur            TEXT         NOT NULL,
    description       TEXT,
    modifie_par_id    BIGINT       REFERENCES utilisateurs(id),
    date_creation     TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);

-- Logs d'activite
CREATE TABLE logs_activite (
    id                BIGSERIAL   PRIMARY KEY,
    utilisateur_id    BIGINT,
    type_action       VARCHAR(40) NOT NULL,
    entite_concernee  VARCHAR(50),
    entite_id         BIGINT,
    adresse_ip        VARCHAR(45),
    details           TEXT,
    date_creation     TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);
CREATE INDEX idx_logs_utilisateur ON logs_activite(utilisateur_id);
CREATE INDEX idx_logs_type_action  ON logs_activite(type_action);
CREATE INDEX idx_logs_date         ON logs_activite(date_creation);
EOF
OK "V1__creation_schema.sql généré"

# ── V2 : Types de biens ──────────────────────────────────────────────────────
cat > "$MIGRATIONS/V2__seed_types_biens.sql" << 'EOF'
-- IMMOCAM — V2 : 8 types de biens immobiliers initiaux
INSERT INTO types_biens (libelle, est_actif, date_creation) VALUES
    ('Chambre',     TRUE, NOW()),
    ('Studio',      TRUE, NOW()),
    ('Appartement', TRUE, NOW()),
    ('Bureau',      TRUE, NOW()),
    ('Magasin',     TRUE, NOW()),
    ('Maison',      TRUE, NOW()),
    ('Boutique',    TRUE, NOW()),
    ('Espace',      TRUE, NOW());
EOF
OK "V2__seed_types_biens.sql généré"

# ── V3 : 20 villes camerounaises ─────────────────────────────────────────────
cat > "$MIGRATIONS/V3__seed_villes.sql" << 'EOF'
-- IMMOCAM — V3 : 20 villes camerounaises
-- Disponibles immediatement dans tous les filtres et formulaires
INSERT INTO localisations (ville, quartier, est_active, est_pre_chargee, date_creation) VALUES
    ('Yaounde',    NULL, TRUE, TRUE, NOW()),
    ('Douala',     NULL, TRUE, TRUE, NOW()),
    ('Maroua',     NULL, TRUE, TRUE, NOW()),
    ('Garoua',     NULL, TRUE, TRUE, NOW()),
    ('Ngaoundere', NULL, TRUE, TRUE, NOW()),
    ('Bertoua',    NULL, TRUE, TRUE, NOW()),
    ('Mbalmayo',   NULL, TRUE, TRUE, NOW()),
    ('Bafia',      NULL, TRUE, TRUE, NOW()),
    ('Nkongsamba', NULL, TRUE, TRUE, NOW()),
    ('Edea',       NULL, TRUE, TRUE, NOW()),
    ('Bafoussam',  NULL, TRUE, TRUE, NOW()),
    ('Dschang',    NULL, TRUE, TRUE, NOW()),
    ('Foumban',    NULL, TRUE, TRUE, NOW()),
    ('Bamenda',    NULL, TRUE, TRUE, NOW()),
    ('Buea',       NULL, TRUE, TRUE, NOW()),
    ('Kumba',      NULL, TRUE, TRUE, NOW()),
    ('Limbe',      NULL, TRUE, TRUE, NOW()),
    ('Ebolowa',    NULL, TRUE, TRUE, NOW()),
    ('Kribi',      NULL, TRUE, TRUE, NOW()),
    ('Sangmelima', NULL, TRUE, TRUE, NOW());
EOF
OK "V3__seed_villes.sql généré"

# ── V4 : Configuration système par défaut ────────────────────────────────────
cat > "$MIGRATIONS/V4__seed_config_systeme.sql" << 'EOF'
-- IMMOCAM — V4 : Configuration systeme par defaut
-- Modifiable par l'admin via son interface sans redeploiement
INSERT INTO config_systeme (cle, valeur, description, date_creation) VALUES
    ('DUREE_VIE_ANNONCE_JOURS', '30',
     'Duree de vie d''une annonce en jours avant expiration automatique', NOW()),
    ('DELAI_RAPPEL_JOURS', '5',
     'Jours avant expiration pour le premier rappel (J-5)', NOW()),
    ('DELAI_RAPPEL_FINAL_JOURS', '1',
     'Jours avant expiration pour le rappel final (J-1)', NOW()),
    ('DELAI_SUPPRESSION_JOURS', '7',
     'Jours apres expiration avant suppression definitive (J+7)', NOW()),
    ('MAX_PHOTOS_PAR_ANNONCE', '4',
     'Nombre maximum de photos par annonce', NOW()),
    ('MAX_TAILLE_PHOTO_MO', '4',
     'Taille maximale d''une photo en megaoctets', NOW()),
    ('MAX_ANNONCES_PAR_PROPRIO', '5',
     'Annonces actives simultanees max par proprietaire (V2: lie a l''abonnement)', NOW()),
    ('MSG_WHATSAPP',
     'Bonjour, je vous contacte depuis ImmoCam concernant votre annonce : {type} a {quartier}, {ville} — {prix} FCFA. Est-il toujours disponible ?',
     'Message pre-rempli WhatsApp (placeholders: {type}, {quartier}, {ville}, {prix})', NOW()),
    ('MAX_CONNEXIONS_ECHOUEES', '5',
     'Tentatives de connexion echouees avant blocage du compte', NOW()),
    ('DUREE_BLOCAGE_MINUTES', '30',
     'Duree du blocage en minutes apres tentatives echouees', NOW());
EOF
OK "V4__seed_config_systeme.sql généré"

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
JAVA_COUNT=$(find src/main/java -name "*.java" | wc -l)
SQL_COUNT=$(find src/main/resources/db -name "*.sql" | wc -l)
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SCRIPT 04 TERMINÉ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Fichiers Java total    : $JAVA_COUNT"
INFO "Migrations SQL total   : $SQL_COUNT"
INFO ""
INFO "Entites generees :"
INFO "  Utilisateur, Annonce, Photo, Localisation, TypeBien"
INFO "  ContactWhatsApp, Favori, Commentaire, Signalement"
INFO "  ConfigSysteme, LogActivite, CodeValidation, TokenReinitialisation"
INFO ""
INFO "Migrations Flyway :"
INFO "  V1 — Schema complet + index optimises"
INFO "  V2 — 8 types de biens"
INFO "  V3 — 20 villes camerounaises"
INFO "  V4 — Configuration systeme par defaut"
echo ""
INFO "Prochaine etape : bash setup_05_repositories.sh"