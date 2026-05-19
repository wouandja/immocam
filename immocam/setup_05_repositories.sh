#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — SCRIPT 05 : REPOSITORIES SPRING DATA JPA
# =============================================================================
# Rôle     : Génère tous les repositories avec requêtes JPQL optimisées :
#            - UtilisateurRepository
#            - AnnonceRepository (+ AnnonceSpecification)
#            - PhotoRepository
#            - LocalisationRepository
#            - TypeBienRepository
#            - ContactWhatsAppRepository
#            - FavoriRepository
#            - CommentaireRepository
#            - SignalementRepository
#            - ConfigSystemeRepository
#            - LogActiviteRepository
#            - CodeValidationRepository
#            - TokenReinitialisationRepository
#
# Exécuter : Depuis la RACINE du projet
#            bash setup_05_repositories.sh
# Prérequis: Scripts 01 à 04 exécutés
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

SECTION "SCRIPT 05 — REPOSITORIES"
INFO "Répertoire courant : $(pwd)"

BASE="src/main/java/com/mbem/immocam"
MOD="$BASE/module"
INFRA="$BASE/infrastructure"

[[ -d "$MOD" ]] || ERROR "Dossier $MOD introuvable. Lancez d'abord le script 01."


# =============================================================================
# 1. UtilisateurRepository
# =============================================================================
SECTION "1/13 — UtilisateurRepository"

mkdir -p "$MOD/utilisateur/repository"

cat > "$MOD/utilisateur/repository/UtilisateurRepository.java" << 'EOF'
package com.mbem.immocam.module.utilisateur.repository;

import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.enums.StatutCompte;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour les opérations sur les utilisateurs.
 *
 * @author MBEMNOVA
 */
@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByTelephone(String telephone);

    /** Recherche admin : par email, nom ou prénom */
    @Query("SELECT u FROM Utilisateur u WHERE " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :terme, '%')) OR " +
           "LOWER(u.nom) LIKE LOWER(CONCAT('%', :terme, '%')) OR " +
           "LOWER(u.prenom) LIKE LOWER(CONCAT('%', :terme, '%')) OR " +
           "u.telephone LIKE CONCAT('%', :terme, '%')")
    Page<Utilisateur> rechercherAdmin(@Param("terme") String terme, Pageable pageable);

    /** Compter par statut (dashboard admin). */
    long countByStatut(StatutCompte statut);

    /** Compter les nouveaux inscrits depuis une date (statistiques). */
    @Query("SELECT COUNT(u) FROM Utilisateur u WHERE u.dateCreation >= :depuis")
    long countNouveauxDepuis(@Param("depuis") java.time.LocalDateTime depuis);
}
EOF
OK "UtilisateurRepository généré"

# =============================================================================
# 2. AnnonceRepository
# =============================================================================
SECTION "2/13 — AnnonceRepository"

mkdir -p "$MOD/annonce/repository"

cat > "$MOD/annonce/repository/AnnonceRepository.java" << 'EOF'
package com.mbem.immocam.module.annonce.repository;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository pour les opérations sur les annonces.
 *
 * JpaSpecificationExecutor permet la recherche multicritères dynamique
 * via AnnonceSpecification (ville, type, prix min/max, mot-clé).
 *
 * @author MBEMNOVA
 */
@Repository
public interface AnnonceRepository
        extends JpaRepository<Annonce, Long>, JpaSpecificationExecutor<Annonce> {

    // ── Lecture publique ───────────────────────────────────────────────────

    /** Liste paginée des annonces actives pour la page d'accueil. */
    Page<Annonce> findByStatutAndDeletedFalse(StatutAnnonce statut, Pageable pageable);

    // ── Dashboard propriétaire ─────────────────────────────────────────────

    /** Toutes les annonces d'un propriétaire (dashboard). */
    Page<Annonce> findByProprietaireIdAndDeletedFalse(Long proprietaireId, Pageable pageable);

    /** Compter les annonces actives d'un propriétaire (vérifier la limite). */
    long countByProprietaireIdAndStatutAndDeletedFalse(
            Long proprietaireId, StatutAnnonce statut);

    // ── Scheduler ─────────────────────────────────────────────────────────

    /** J-5 : annonces à notifier 5 jours avant expiration. */
    @Query("SELECT a FROM Annonce a WHERE a.statut = 'ACTIVE' " +
           "AND a.dateExpiration BETWEEN :debut AND :fin " +
           "AND a.rappelJ5Envoye = false AND a.deleted = false")
    List<Annonce> findAnnoncesRappelJ5(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin);

    /** J-1 : annonces à notifier 1 jour avant expiration. */
    @Query("SELECT a FROM Annonce a WHERE a.statut = 'ACTIVE' " +
           "AND a.dateExpiration BETWEEN :debut AND :fin " +
           "AND a.rappelJ1Envoye = false AND a.deleted = false")
    List<Annonce> findAnnoncesRappelJ1(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin);

    /** J0 : annonces expirées à passer en statut EXPIREE. */
    @Query("SELECT a FROM Annonce a WHERE a.statut = 'ACTIVE' " +
           "AND a.dateExpiration <= :maintenant AND a.deleted = false")
    List<Annonce> findAnnoncesExpirees(@Param("maintenant") LocalDateTime maintenant);

    /** J+7 : annonces expirées à supprimer définitivement. */
    @Query("SELECT a FROM Annonce a WHERE a.statut = 'EXPIREE' " +
           "AND a.dateExpiration <= :limite AND a.deleted = false")
    List<Annonce> findAnnoncesASupprimer(@Param("limite") LocalDateTime limite);

    // ── Détection de doublon ───────────────────────────────────────────────

    /**
     * Vérifie si une annonce similaire existe déjà pour ce propriétaire.
     * Même type + ville + quartier + prix + numéro WhatsApp = doublon.
     */
    @Query("SELECT COUNT(a) > 0 FROM Annonce a " +
           "WHERE a.proprietaire.id = :propId " +
           "AND a.typeBien.id = :typeBienId " +
           "AND a.localisation.id = :locId " +
           "AND a.prix = :prix " +
           "AND a.numeroWhatsApp = :whatsapp " +
           "AND a.statut = 'ACTIVE' AND a.deleted = false")
    boolean existsDoublon(
            @Param("propId") Long proprietaireId,
            @Param("typeBienId") Long typeBienId,
            @Param("locId") Long localisationId,
            @Param("prix") BigDecimal prix,
            @Param("whatsapp") String numeroWhatsApp);

    // ── Statistiques admin ─────────────────────────────────────────────────

    /** Incrémenter les vues sans charger l'entité. */
    @Modifying
    @Query("UPDATE Annonce a SET a.nombreVues = a.nombreVues + 1 WHERE a.id = :id")
    void incrementerVues(@Param("id") Long id);

    /** Compter les annonces publiées depuis une date (stats admin). */
    @Query("SELECT COUNT(a) FROM Annonce a WHERE a.dateCreation >= :depuis")
    long countPublieesDepuis(@Param("depuis") LocalDateTime depuis);

    /** Classement des villes les plus actives. */
    @Query("SELECT a.localisation.ville, COUNT(a) FROM Annonce a " +
           "WHERE a.statut = 'ACTIVE' AND a.deleted = false " +
           "GROUP BY a.localisation.ville ORDER BY COUNT(a) DESC")
    List<Object[]> findVillesLesPlusActives(Pageable pageable);

    /** Classement des types de biens les plus publiés. */
    @Query("SELECT a.typeBien.libelle, COUNT(a) FROM Annonce a " +
           "WHERE a.deleted = false " +
           "GROUP BY a.typeBien.libelle ORDER BY COUNT(a) DESC")
    List<Object[]> findTypesBiensLesPlusPublies(Pageable pageable);
}
EOF
OK "AnnonceRepository généré"

# =============================================================================
# 3. AnnonceSpecification
# =============================================================================
SECTION "3/13 — AnnonceSpecification"

mkdir -p "$MOD/annonce/specification"

cat > "$MOD/annonce/specification/AnnonceSpecification.java" << 'EOF'
package com.mbem.immocam.module.annonce.specification;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Critères de recherche dynamique pour les annonces.
 *
 * Utilisé pour la barre de recherche (ville, type de bien, prix min/max).
 * Chaque critère est optionnel — seuls les filtres non-null sont appliqués.
 *
 * Usage dans AnnonceService :
 *   Specification<Annonce> spec = AnnonceSpecification.filtrer(ville, typeBienId, prixMin, prixMax);
 *   Page<Annonce> page = annonceRepository.findAll(spec, pageable);
 *
 * @author MBEMNOVA
 */
public class AnnonceSpecification {

    private AnnonceSpecification() {}

    /**
     * Construit la specification de filtrage multicritères.
     *
     * @param ville      Ville (optionnel)
     * @param typeBienId ID du type de bien (optionnel)
     * @param prixMin    Prix minimum en FCFA (optionnel)
     * @param prixMax    Prix maximum en FCFA (optionnel)
     * @return Specification combinant tous les critères actifs
     */
    public static Specification<Annonce> filtrer(
            String ville,
            Long typeBienId,
            BigDecimal prixMin,
            BigDecimal prixMax) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Toujours filtrer sur les annonces actives et non supprimées
            predicates.add(cb.equal(root.get("statut"), StatutAnnonce.ACTIVE));
            predicates.add(cb.equal(root.get("deleted"), false));

            if (ville != null && !ville.isBlank()) {
                predicates.add(cb.equal(
                    cb.lower(root.get("localisation").get("ville")),
                    ville.toLowerCase().trim()
                ));
            }

            if (typeBienId != null) {
                predicates.add(cb.equal(root.get("typeBien").get("id"), typeBienId));
            }

            if (prixMin != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("prix"), prixMin));
            }

            if (prixMax != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("prix"), prixMax));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Specification pour les annonces d'un propriétaire spécifique.
     * Utilisé dans le dashboard propriétaire avec filtres optionnels.
     *
     * @param proprietaireId ID du propriétaire
     * @param statut         Statut (optionnel, tous si null)
     * @return Specification
     */
    public static Specification<Annonce> parProprietaire(
            Long proprietaireId,
            StatutAnnonce statut) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("proprietaire").get("id"), proprietaireId));
            predicates.add(cb.equal(root.get("deleted"), false));
            if (statut != null) {
                predicates.add(cb.equal(root.get("statut"), statut));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Specification admin : toutes les annonces avec filtres multiples.
     *
     * @param ville        Ville (optionnel)
     * @param typeBienId   ID type bien (optionnel)
     * @param proprietaireId ID propriétaire (optionnel)
     * @param statut       Statut (optionnel)
     * @return Specification
     */
    public static Specification<Annonce> filtrerAdmin(
            String ville,
            Long typeBienId,
            Long proprietaireId,
            StatutAnnonce statut) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (ville != null && !ville.isBlank()) {
                predicates.add(cb.equal(
                    cb.lower(root.get("localisation").get("ville")),
                    ville.toLowerCase().trim()
                ));
            }
            if (typeBienId != null) {
                predicates.add(cb.equal(root.get("typeBien").get("id"), typeBienId));
            }
            if (proprietaireId != null) {
                predicates.add(cb.equal(root.get("proprietaire").get("id"), proprietaireId));
            }
            if (statut != null) {
                predicates.add(cb.equal(root.get("statut"), statut));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
EOF
OK "AnnonceSpecification générée"

# =============================================================================
# 4. PhotoRepository
# =============================================================================
SECTION "4/13 — PhotoRepository"

mkdir -p "$MOD/photo/repository"

cat > "$MOD/photo/repository/PhotoRepository.java" << 'EOF'
package com.mbem.immocam.module.photo.repository;

import com.mbem.immocam.module.annonce.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour les photos d'annonces.
 *
 * @author MBEMNOVA
 */
@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {

    List<Photo> findByAnnonceIdOrderByOrdreAsc(Long annonceId);

    long countByAnnonceId(Long annonceId);

    Optional<Photo> findFirstByAnnonceIdAndEstPrincipaleTrue(Long annonceId);

    void deleteByAnnonceId(Long annonceId);

    /** Trouver le prochain ordre disponible pour une annonce. */
    @Query("SELECT COALESCE(MAX(p.ordre), 0) FROM Photo p WHERE p.annonce.id = :annonceId")
    int findMaxOrdreByAnnonceId(@Param("annonceId") Long annonceId);
}
EOF
OK "PhotoRepository généré"

# =============================================================================
# 5. LocalisationRepository
# =============================================================================
SECTION "5/13 — LocalisationRepository"

mkdir -p "$MOD/localisation/repository"

cat > "$MOD/localisation/repository/LocalisationRepository.java" << 'EOF'
package com.mbem.immocam.module.localisation.repository;

import com.mbem.immocam.module.localisation.entity.Localisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour les villes et quartiers du Cameroun.
 *
 * @author MBEMNOVA
 */
@Repository
public interface LocalisationRepository extends JpaRepository<Localisation, Long> {

    /** Liste des villes actives (sans doublons) — pour le filtre de recherche. */
    @Query("SELECT DISTINCT l.ville FROM Localisation l WHERE l.estActive = true ORDER BY l.ville ASC")
    List<String> findVillesActives();

    /** Quartiers d'une ville — chargement dynamique selon ville sélectionnée. */
    List<Localisation> findByVilleAndEstActiveTrueOrderByQuartierAsc(String ville);

    /** Trouver une localisation exacte pour la création d'annonce. */
    Optional<Localisation> findByVilleAndQuartierAndEstActiveTrue(String ville, String quartier);

    boolean existsByVilleAndQuartier(String ville, String quartier);
}
EOF
OK "LocalisationRepository généré"

# =============================================================================
# 6. TypeBienRepository
# =============================================================================
SECTION "6/13 — TypeBienRepository"

mkdir -p "$MOD/typebien/repository"

cat > "$MOD/typebien/repository/TypeBienRepository.java" << 'EOF'
package com.mbem.immocam.module.typebien.repository;

import com.mbem.immocam.module.typebien.entity.TypeBien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour les types de biens immobiliers.
 *
 * @author MBEMNOVA
 */
@Repository
public interface TypeBienRepository extends JpaRepository<TypeBien, Long> {

    /** Types actifs pour les formulaires et filtres. */
    List<TypeBien> findByEstActifTrueOrderByLibelleAsc();

    boolean existsByLibelle(String libelle);
}
EOF
OK "TypeBienRepository généré"

# =============================================================================
# 7. ContactWhatsAppRepository
# =============================================================================
SECTION "7/13 — ContactWhatsAppRepository"

mkdir -p "$MOD/contact/repository"

cat > "$MOD/contact/repository/ContactWhatsAppRepository.java" << 'EOF'
package com.mbem.immocam.module.contact.repository;

import com.mbem.immocam.module.contact.entity.ContactWhatsApp;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/**
 * Repository pour les contacts WhatsApp.
 *
 * @author MBEMNOVA
 */
@Repository
public interface ContactWhatsAppRepository extends JpaRepository<ContactWhatsApp, Long> {

    /** Contacts d'une annonce triés du plus récent (dashboard propriétaire). */
    Page<ContactWhatsApp> findByAnnonceIdOrderByDateContactDesc(Long annonceId, Pageable pageable);

    /** Nombre de contacts pour une annonce (affiché dans le tableau). */
    long countByAnnonceId(Long annonceId);

    /** Contacts depuis une date (statistiques admin). */
    @Query("SELECT COUNT(c) FROM ContactWhatsApp c WHERE c.dateContact >= :depuis")
    long countDepuis(@Param("depuis") LocalDateTime depuis);

    /** Vérifier si un utilisateur a déjà contacté une annonce. */
    boolean existsByUtilisateurIdAndAnnonceId(Long utilisateurId, Long annonceId);
}
EOF
OK "ContactWhatsAppRepository généré"

# =============================================================================
# 8. FavoriRepository
# =============================================================================
SECTION "8/13 — FavoriRepository"

mkdir -p "$MOD/favori/repository"

cat > "$MOD/favori/repository/FavoriRepository.java" << 'EOF'
package com.mbem.immocam.module.favori.repository;

import com.mbem.immocam.module.favori.entity.Favori;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour les favoris des utilisateurs.
 *
 * @author MBEMNOVA
 */
@Repository
public interface FavoriRepository extends JpaRepository<Favori, Long> {

    /** Liste des favoris d'un utilisateur (du plus récent au plus ancien). */
    Page<Favori> findByUtilisateurIdOrderByDateCreationDesc(Long utilisateurId, Pageable pageable);

    Optional<Favori> findByUtilisateurIdAndAnnonceId(Long utilisateurId, Long annonceId);

    boolean existsByUtilisateurIdAndAnnonceId(Long utilisateurId, Long annonceId);

    void deleteByUtilisateurIdAndAnnonceId(Long utilisateurId, Long annonceId);
}
EOF
OK "FavoriRepository généré"

# =============================================================================
# 9. CommentaireRepository
# =============================================================================
SECTION "9/13 — CommentaireRepository"

mkdir -p "$MOD/commentaire/repository"

cat > "$MOD/commentaire/repository/CommentaireRepository.java" << 'EOF'
package com.mbem.immocam.module.commentaire.repository;

import com.mbem.immocam.module.commentaire.entity.Commentaire;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/**
 * Repository pour les commentaires sur les annonces.
 *
 * @author MBEMNOVA
 */
@Repository
public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {

    /**
     * Commentaires de premier niveau d'une annonce (sans les réponses).
     * Triés du plus ancien au plus récent (ordre chronologique).
     */
    @Query("SELECT c FROM Commentaire c WHERE c.annonce.id = :annonceId " +
           "AND c.commentaireParent IS NULL " +
           "AND c.estSupprime = false " +
           "ORDER BY c.dateCreation ASC")
    Page<Commentaire> findByAnnonceId(@Param("annonceId") Long annonceId, Pageable pageable);

    /** Nombre de commentaires actifs pour une annonce. */
    long countByAnnonceIdAndEstSupprimeFalse(Long annonceId);

    /** Commentaires publiés depuis une date (stats admin). */
    @Query("SELECT COUNT(c) FROM Commentaire c WHERE c.dateCreation >= :depuis")
    long countDepuis(@Param("depuis") LocalDateTime depuis);
}
EOF
OK "CommentaireRepository généré"

# =============================================================================
# 10. SignalementRepository
# =============================================================================
SECTION "10/13 — SignalementRepository"

mkdir -p "$MOD/signalement/repository"

cat > "$MOD/signalement/repository/SignalementRepository.java" << 'EOF'
package com.mbem.immocam.module.signalement.repository;

import com.mbem.immocam.module.signalement.entity.Signalement;
import com.mbem.immocam.shared.enums.StatutSignalement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository pour les signalements d'annonces.
 *
 * @author MBEMNOVA
 */
@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {

    /** Liste des signalements en attente (dashboard admin). */
    Page<Signalement> findByStatutOrderByDateCreationDesc(
            StatutSignalement statut, Pageable pageable);

    /** Vérifier si un utilisateur a déjà signalé cette annonce. */
    boolean existsByAuteurIdAndAnnonceIdAndStatut(
            Long auteurId, Long annonceId, StatutSignalement statut);

    /** Nombre de signalements en attente (badge admin). */
    long countByStatut(StatutSignalement statut);
}
EOF
OK "SignalementRepository généré"

# =============================================================================
# 11. ConfigSystemeRepository
# =============================================================================
SECTION "11/13 — ConfigSystemeRepository"

mkdir -p "$MOD/config/repository"

cat > "$MOD/config/repository/ConfigSystemeRepository.java" << 'EOF'
package com.mbem.immocam.module.config.repository;

import com.mbem.immocam.module.config.entity.ConfigSysteme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour la configuration système.
 *
 * Permet à l'admin de modifier les paramètres sans redéploiement.
 *
 * @author MBEMNOVA
 */
@Repository
public interface ConfigSystemeRepository extends JpaRepository<ConfigSysteme, Long> {

    Optional<ConfigSysteme> findByCle(String cle);

    boolean existsByCle(String cle);
}
EOF
OK "ConfigSystemeRepository généré"

# =============================================================================
# 12. LogActiviteRepository
# =============================================================================
SECTION "12/13 — LogActiviteRepository"

mkdir -p "$INFRA/audit"

cat > "$INFRA/audit/LogActiviteRepository.java" << 'EOF'
package com.mbem.immocam.infrastructure.audit;

import com.mbem.immocam.shared.enums.TypeAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/**
 * Repository pour les logs d'activité.
 *
 * Conservation 12 mois (politique de confidentialité).
 * Un job de nettoyage peut appeler deleteLogsAnciens().
 *
 * @author MBEMNOVA
 */
@Repository
public interface LogActiviteRepository extends JpaRepository<LogActivite, Long> {

    Page<LogActivite> findByUtilisateurIdOrderByDateCreationDesc(
            Long utilisateurId, Pageable pageable);

    Page<LogActivite> findByTypeActionOrderByDateCreationDesc(
            TypeAction typeAction, Pageable pageable);

    /** Supprimer les logs plus anciens que 12 mois (RGPD). */
    @Modifying
    @Query("DELETE FROM LogActivite l WHERE l.dateCreation < :limite")
    int deleteLogsAnciens(@Param("limite") LocalDateTime limite);
}
EOF
OK "LogActiviteRepository généré"

# =============================================================================
# 13. CodeValidationRepository et TokenReinitialisationRepository
# =============================================================================
SECTION "13/13 — Auth Repositories"

mkdir -p "$MOD/auth/repository"

cat > "$MOD/auth/repository/CodeValidationRepository.java" << 'EOF'
package com.mbem.immocam.module.auth.repository;

import com.mbem.immocam.module.auth.entity.CodeValidation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository pour les codes OTP de validation email.
 *
 * @author MBEMNOVA
 */
@Repository
public interface CodeValidationRepository extends JpaRepository<CodeValidation, Long> {

    /** Trouver le code valide le plus récent d'un utilisateur. */
    Optional<CodeValidation> findTopByUtilisateurIdAndTypeCodeAndEstUtiliseFalse(
            Long utilisateurId, String typeCode);

    /** Vérifier le code saisi par l'utilisateur. */
    Optional<CodeValidation> findByUtilisateurIdAndCodeAndTypeCodeAndEstUtiliseFalse(
            Long utilisateurId, String code, String typeCode);

    /** Compter les renvois des dernière heure (anti-spam : max 3). */
    @Query("SELECT COUNT(c) FROM CodeValidation c " +
           "WHERE c.utilisateur.id = :userId " +
           "AND c.typeCode = :typeCode " +
           "AND c.dateCreation >= :depuis")
    int countRenvoisRecents(
            @Param("userId") Long utilisateurId,
            @Param("typeCode") String typeCode,
            @Param("depuis") LocalDateTime depuis);

    /** Invalider tous les anciens codes d'un utilisateur. */
    @Modifying
    @Query("UPDATE CodeValidation c SET c.estUtilise = true " +
           "WHERE c.utilisateur.id = :userId AND c.typeCode = :typeCode")
    void invaliderCodesExistants(
            @Param("userId") Long utilisateurId,
            @Param("typeCode") String typeCode);
}
EOF

cat > "$MOD/auth/repository/TokenReinitialisationRepository.java" << 'EOF'
package com.mbem.immocam.module.auth.repository;

import com.mbem.immocam.module.auth.entity.TokenReinitialisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour les tokens de réinitialisation de mot de passe.
 *
 * @author MBEMNOVA
 */
@Repository
public interface TokenReinitialisationRepository extends JpaRepository<TokenReinitialisation, Long> {

    Optional<TokenReinitialisation> findByTokenAndEstUtiliseFalse(String token);

    /** Invalider tous les anciens tokens d'un utilisateur avant d'en créer un nouveau. */
    @Modifying
    @Query("UPDATE TokenReinitialisation t SET t.estUtilise = true " +
           "WHERE t.utilisateur.id = :userId")
    void invaliderTokensExistants(@Param("userId") Long utilisateurId);
}
EOF
OK "CodeValidationRepository et TokenReinitialisationRepository générés"

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
JAVA_COUNT=$(find src/main/java -name "*.java" | wc -l)
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SCRIPT 05 TERMINÉ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Fichiers Java total : $JAVA_COUNT"
INFO ""
INFO "Repositories générés :"
INFO "  UtilisateurRepository"
INFO "  AnnonceRepository + AnnonceSpecification"
INFO "  PhotoRepository, LocalisationRepository, TypeBienRepository"
INFO "  ContactWhatsAppRepository, FavoriRepository"
INFO "  CommentaireRepository, SignalementRepository"
INFO "  ConfigSystemeRepository, LogActiviteRepository"
INFO "  CodeValidationRepository, TokenReinitialisationRepository"
echo ""
INFO "Prochaine étape : bash setup_06_security.sh"