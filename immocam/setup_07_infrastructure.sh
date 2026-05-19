#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — SCRIPT 07 : INFRASTRUCTURE TRANSVERSALE
# =============================================================================
# Rôle     : Génère toute l'infrastructure partagée :
#            - StorageService + StorageServiceImpl (VPS local, Thumbnailator)
#            - EmailService + EmailServiceImpl (SMTP async Thymeleaf)
#            - Templates HTML email (6 templates)
#            - AnnonceExpirationScheduler (cron J-5/J-1/J0/J+7)
#            - LogActiviteService (audit des actions)
#
# Exécuter : Depuis la RACINE du projet
#            bash setup_07_infrastructure.sh
# Prérequis: Scripts 01 à 06 exécutés
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

SECTION "SCRIPT 07 — INFRASTRUCTURE"
INFO "Répertoire courant : $(pwd)"

BASE="src/main/java/com/mbem/immocam"
INFRA="$BASE/infrastructure"
TEMPLATES="src/main/resources/templates/email"

[[ -d "$INFRA" ]] || ERROR "Dossier $INFRA introuvable. Lancez d'abord le script 01."

# =============================================================================
# 1. StorageService + StorageServiceImpl
# =============================================================================
SECTION "1/5 — StorageService (VPS local + Thumbnailator)"

mkdir -p "$INFRA/storage/service"

cat > "$INFRA/storage/service/StorageService.java" << 'EOF'
package com.mbem.immocam.infrastructure.storage.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Service de stockage des photos d'annonces sur le VPS local.
 *
 * Architecture :
 *   - Stockage : uploads/annonces/YYYY/MM/uuid_annonceId.jpg
 *   - Compression : Thumbnailator — JPEG 80%, max 1280px
 *   - Formats acceptés : JPG, PNG, WebP
 *   - Taille max : 4 Mo par photo (configurable admin)
 *   - 0 photo minimum (annonce sans photo autorisée)
 *   - 4 photos maximum par annonce (configurable admin)
 *
 * Le numéro WhatsApp du propriétaire n'est jamais stocké dans les chemins.
 *
 * @author MBEMNOVA
 */
public interface StorageService {

    /**
     * Stocke, compresse et retourne le chemin relatif de la photo.
     *
     * @param fichier   Fichier uploadé par l'utilisateur
     * @param annonceId ID de l'annonce (inclus dans le nom du fichier)
     * @return Chemin relatif depuis uploads/ (ex: "annonces/2026/04/uuid_12.jpg")
     */
    String stocker(MultipartFile fichier, Long annonceId);

    /**
     * Supprime un fichier du disque VPS.
     *
     * @param cheminStockage Chemin relatif depuis uploads/
     */
    void supprimer(String cheminStockage);

    /**
     * Construit l'URL publique depuis le chemin de stockage.
     *
     * @param cheminStockage Chemin relatif
     * @return URL complète (ex: "https://immocam.cm/uploads/annonces/2026/04/uuid.jpg")
     */
    String construireUrl(String cheminStockage);

    /**
     * Valide le format et la taille avant traitement.
     *
     * @param fichier Fichier à valider
     * @throws IllegalArgumentException si format invalide ou taille dépassée
     */
    void valider(MultipartFile fichier);
}
EOF

cat > "$INFRA/storage/service/StorageServiceImpl.java" << 'EOF'
package com.mbem.immocam.infrastructure.storage.service;

import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Implémentation du stockage local VPS avec compression Thumbnailator.
 *
 * Organisation des fichiers :
 *   uploads/annonces/YYYY/MM/uuid_annonceId.jpg
 *
 * Compression automatique :
 *   - Format de sortie : JPEG (toujours, quelle que soit l'entrée)
 *   - Qualité : 80% (configurable via immocam.storage.compression.qualite)
 *   - Largeur max : 1280px (hauteur proportionnelle, ratio conservé)
 *
 * @author MBEMNOVA
 */
@Service
@Slf4j
public class StorageServiceImpl implements StorageService {

    @Value("${immocam.storage.upload-dir}")
    private String uploadDir;

    @Value("${immocam.storage.base-url}")
    private String baseUrl;

    @Value("${immocam.storage.compression.qualite:0.80}")
    private double qualiteCompression;

    @Value("${immocam.storage.compression.largeur-max:1280}")
    private int largeurMax;

    @Value("${immocam.storage.max-taille-photo-mo:4}")
    private int maxTailleMo;

    private static final long BYTES_PAR_MO = 1024L * 1024L;

    @Override
    public String stocker(MultipartFile fichier, Long annonceId) {
        valider(fichier);
        try {
            // Dossier organisé par année/mois pour éviter trop de fichiers
            LocalDate aujourd_hui = LocalDate.now();
            String sousDossier = String.format("annonces/%d/%02d",
                aujourd_hui.getYear(), aujourd_hui.getMonthValue());
            Path dossierCible = Paths.get(uploadDir, sousDossier);
            Files.createDirectories(dossierCible);

            String nomFichier = UUID.randomUUID() + "_" + annonceId + ".jpg";
            Path cheminComplet = dossierCible.resolve(nomFichier);

            // Compression et redimensionnement avec Thumbnailator
            Thumbnails.of(fichier.getInputStream())
                    .size(largeurMax, largeurMax * 10) // hauteur très grande = pas de limite
                    .keepAspectRatio(true)
                    .outputQuality(qualiteCompression)
                    .outputFormat("jpg")
                    .toFile(cheminComplet.toFile());

            String cheminRelatif = sousDossier + "/" + nomFichier;
            log.info("Photo stockée : {} ({} Ko)",
                cheminRelatif, Files.size(cheminComplet) / 1024);
            return cheminRelatif;

        } catch (IOException e) {
            log.error("Erreur stockage photo pour annonce {} : {}", annonceId, e.getMessage());
            throw new RuntimeException("Erreur lors du stockage de la photo", e);
        }
    }

    @Override
    public void supprimer(String cheminStockage) {
        if (cheminStockage == null || cheminStockage.isBlank()) return;
        try {
            Path fichier = Paths.get(uploadDir, cheminStockage);
            boolean supprime = Files.deleteIfExists(fichier);
            if (supprime) {
                log.info("Photo supprimée : {}", cheminStockage);
            }
        } catch (IOException e) {
            log.warn("Impossible de supprimer la photo : {}", cheminStockage, e);
        }
    }

    @Override
    public String construireUrl(String cheminStockage) {
        if (cheminStockage == null) return null;
        return baseUrl + "/" + cheminStockage;
    }

    @Override
    public void valider(MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est vide");
        }
        if (fichier.getSize() > (long) maxTailleMo * BYTES_PAR_MO) {
            throw new IllegalArgumentException(
                "La photo dépasse la taille maximale de " + maxTailleMo + " Mo");
        }
        String contentType = fichier.getContentType();
        if (contentType == null
                || (!contentType.startsWith("image/jpeg")
                    && !contentType.startsWith("image/png")
                    && !contentType.startsWith("image/webp"))) {
            throw new IllegalArgumentException(
                "Format non accepté. Utilisez JPG, PNG ou WebP.");
        }
    }
}
EOF
OK "StorageService.java généré"
OK "StorageServiceImpl.java généré"

# =============================================================================
# 2. EmailService + EmailServiceImpl
# =============================================================================
SECTION "2/5 — EmailService (SMTP async Thymeleaf)"

mkdir -p "$INFRA/email/service"

cat > "$INFRA/email/service/EmailService.java" << 'EOF'
package com.mbem.immocam.infrastructure.email.service;

/**
 * Service d'envoi des emails transactionnels ImmoCam.
 *
 * Tous les envois sont asynchrones (@Async) pour ne pas bloquer la requête HTTP.
 * Templates HTML Thymeleaf dans : src/main/resources/templates/email/
 *
 * Emails envoyés par ImmoCam :
 *   - Validation email (OTP 6 chiffres, valable 10 min)
 *   - Réinitialisation mot de passe (lien 30 min)
 *   - Confirmation publication annonce
 *   - Rappel expiration J-5 et J-1
 *   - Annonce suspendue / supprimée par admin (avec motif)
 *   - Alerte connexion suspecte (5 tentatives échouées)
 *
 * @author MBEMNOVA
 */
public interface EmailService {

    /** OTP de validation email lors de l'inscription. */
    void envoyerCodeValidation(String destinataire, String prenom, String code);

    /** Lien de réinitialisation du mot de passe (valable 30 min). */
    void envoyerLienReinitialisation(String destinataire, String prenom, String lien);

    /** Confirmation que l'annonce est en ligne. */
    void envoyerConfirmationPublication(String destinataire, String prenom,
                                        String typeBien, String ville, String quartier);

    /** Rappel J-5 ou J-1 avant expiration d'une annonce. */
    void envoyerRappelExpiration(String destinataire, String prenom,
                                 String typeBien, String ville,
                                 String dateExpiration, int joursRestants);

    /** Annonce suspendue automatiquement (J0 — expiration). */
    void envoyerAnnonceSuspendue(String destinataire, String prenom,
                                 String typeBien, String ville);

    /**
     * Annonce supprimée par l'administrateur (motif obligatoire).
     * Le propriétaire reçoit le motif de suppression.
     */
    void envoyerAnnonceSupprimeeParAdmin(String destinataire, String prenom,
                                         String typeBien, String ville, String motif);

    /** Alerte après 5 tentatives de connexion échouées. */
    void envoyerAlerteConnexionSuspecte(String destinataire, String prenom,
                                        String adresseIp, String dateHeure);

    /** Notification de suspension du compte. */
    void envoyerCompteSuspendu(String destinataire, String prenom, String motif);

    /** Notification de réactivation du compte. */
    void envoyerCompteReactive(String destinataire, String prenom);
}
EOF

cat > "$INFRA/email/service/EmailServiceImpl.java" << 'EOF'
package com.mbem.immocam.infrastructure.email.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

/**
 * Implémentation du service email.
 *
 * Tous les envois sont @Async — exécutés dans un thread séparé pour ne pas
 * bloquer la réponse HTTP (inscription, modification d'annonce...).
 *
 * Les templates HTML sont dans src/main/resources/templates/email/.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${immocam.email.from}")
    private String fromEmail;

    @Value("${immocam.email.from-name}")
    private String fromName;

    @Async
    @Override
    public void envoyerCodeValidation(String destinataire, String prenom, String code) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("code", code);
            ctx.setVariable("expiration", "10 minutes");
            String html = templateEngine.process("email/code-validation", ctx);
            envoyer(destinataire, "Validez votre compte ImmoCam", html);
        } catch (Exception e) {
            log.error("Erreur envoi code validation à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerLienReinitialisation(String destinataire, String prenom, String lien) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("lien", lien);
            String html = templateEngine.process("email/reinitialisation", ctx);
            envoyer(destinataire, "Réinitialisez votre mot de passe ImmoCam", html);
        } catch (Exception e) {
            log.error("Erreur envoi lien réinitialisation à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerConfirmationPublication(String destinataire, String prenom,
                                               String typeBien, String ville, String quartier) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("typeBien", typeBien);
            ctx.setVariable("ville", ville);
            ctx.setVariable("quartier", quartier);
            String html = templateEngine.process("email/confirmation-publication", ctx);
            envoyer(destinataire, "Votre annonce est en ligne sur ImmoCam", html);
        } catch (Exception e) {
            log.error("Erreur envoi confirmation publication à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerRappelExpiration(String destinataire, String prenom,
                                        String typeBien, String ville,
                                        String dateExpiration, int joursRestants) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("typeBien", typeBien);
            ctx.setVariable("ville", ville);
            ctx.setVariable("dateExpiration", dateExpiration);
            ctx.setVariable("joursRestants", joursRestants);
            String html = templateEngine.process("email/rappel-expiration", ctx);
            String sujet = joursRestants == 1
                ? "Votre annonce ImmoCam expire demain"
                : "Votre annonce ImmoCam expire dans " + joursRestants + " jours";
            envoyer(destinataire, sujet, html);
        } catch (Exception e) {
            log.error("Erreur envoi rappel expiration à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerAnnonceSuspendue(String destinataire, String prenom,
                                        String typeBien, String ville) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("typeBien", typeBien);
            ctx.setVariable("ville", ville);
            String html = templateEngine.process("email/annonce-suspendue", ctx);
            envoyer(destinataire, "Votre annonce ImmoCam a expiré", html);
        } catch (Exception e) {
            log.error("Erreur envoi annonce suspendue à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerAnnonceSupprimeeParAdmin(String destinataire, String prenom,
                                                String typeBien, String ville, String motif) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("typeBien", typeBien);
            ctx.setVariable("ville", ville);
            ctx.setVariable("motif", motif);
            String html = templateEngine.process("email/annonce-supprimee-admin", ctx);
            envoyer(destinataire, "Votre annonce ImmoCam a été supprimée", html);
        } catch (Exception e) {
            log.error("Erreur envoi annonce supprimée admin à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerAlerteConnexionSuspecte(String destinataire, String prenom,
                                               String adresseIp, String dateHeure) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("adresseIp", adresseIp);
            ctx.setVariable("dateHeure", dateHeure);
            String html = templateEngine.process("email/alerte-connexion", ctx);
            envoyer(destinataire, "Alerte sécurité — Tentatives de connexion suspectes", html);
        } catch (Exception e) {
            log.error("Erreur envoi alerte connexion à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerCompteSuspendu(String destinataire, String prenom, String motif) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("motif", motif);
            String html = templateEngine.process("email/compte-suspendu", ctx);
            envoyer(destinataire, "Votre compte ImmoCam a été suspendu", html);
        } catch (Exception e) {
            log.error("Erreur envoi compte suspendu à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerCompteReactive(String destinataire, String prenom) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            String html = templateEngine.process("email/compte-reactive", ctx);
            envoyer(destinataire, "Votre compte ImmoCam a été réactivé", html);
        } catch (Exception e) {
            log.error("Erreur envoi compte réactivé à {} : {}", destinataire, e.getMessage());
        }
    }

    /** Envoi SMTP commun à tous les emails. */
    private void envoyer(String destinataire, String sujet, String html) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail, fromName);
        helper.setTo(destinataire);
        helper.setSubject(sujet);
        helper.setText(html, true);
        mailSender.send(message);
        log.info("Email envoyé à {} : {}", destinataire, sujet);
    }
}
EOF
OK "EmailService.java généré"
OK "EmailServiceImpl.java généré"

# =============================================================================
# 3. Templates HTML email (Thymeleaf)
# =============================================================================
SECTION "3/5 — Templates email HTML"

mkdir -p "$TEMPLATES"

cat > "$TEMPLATES/code-validation.html" << 'EOF'
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="fr">
<head><meta charset="UTF-8"><title>Validation ImmoCam</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#1a56db;margin-bottom:4px;">ImmoCam</h2>
  <p style="color:#888;font-size:13px;margin-top:0;">Plateforme immobilière camerounaise</p>
  <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
  <h3>Validez votre compte</h3>
  <p>Bonjour <strong th:text="${prenom}">Prénom</strong>,</p>
  <p>Voici votre code de validation :</p>
  <div style="text-align:center;margin:24px 0;">
    <span th:text="${code}"
          style="font-size:40px;font-weight:bold;letter-spacing:10px;
                 background:#f0f4ff;padding:16px 28px;border-radius:8px;color:#1a56db;">
      000000
    </span>
  </div>
  <p>Ce code est valable <strong th:text="${expiration}">10 minutes</strong>.</p>
  <p>Si vous n'avez pas créé de compte ImmoCam, ignorez cet email.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px;">
  <p style="color:#aaa;font-size:11px;text-align:center;">
    MBEMNOVA — mbemnova.com — +237 697 847 396
  </p>
</div>
</body>
</html>
EOF

cat > "$TEMPLATES/reinitialisation.html" << 'EOF'
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="fr">
<head><meta charset="UTF-8"><title>Réinitialisation ImmoCam</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#1a56db;">ImmoCam</h2>
  <p>Bonjour <strong th:text="${prenom}">Prénom</strong>,</p>
  <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe.<br>
     Ce lien est valable <strong>30 minutes</strong>.</p>
  <div style="text-align:center;margin:28px 0;">
    <a th:href="${lien}"
       style="background:#1a56db;color:#fff;padding:14px 28px;border-radius:6px;
              text-decoration:none;font-weight:bold;display:inline-block;">
      Réinitialiser mon mot de passe
    </a>
  </div>
  <p style="color:#888;font-size:12px;">
    Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
    Votre mot de passe actuel reste inchangé.
  </p>
</div>
</body>
</html>
EOF

cat > "$TEMPLATES/confirmation-publication.html" << 'EOF'
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="fr">
<head><meta charset="UTF-8"><title>Annonce publiée — ImmoCam</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#1a56db;">ImmoCam</h2>
  <p>Bonjour <strong th:text="${prenom}">Prénom</strong>,</p>
  <p>Votre annonce est maintenant <strong>en ligne</strong> sur ImmoCam !</p>
  <div style="background:#f0f9ff;border-left:4px solid #1a56db;padding:12px 16px;margin:20px 0;">
    <strong th:text="${typeBien}">Appartement</strong>
    à <span th:text="${quartier}">Akwa</span>,
    <span th:text="${ville}">Douala</span>
  </div>
  <p>Vous pouvez gérer votre annonce depuis votre dashboard : renouveler,
     modifier, mettre en pause ou consulter vos contacts WhatsApp.</p>
  <p style="color:#888;font-size:12px;margin-top:24px;">
    Rappel : votre annonce sera automatiquement suspendue après 30 jours.
    Vous recevrez un rappel 5 jours avant l'expiration.
  </p>
</div>
</body>
</html>
EOF

cat > "$TEMPLATES/rappel-expiration.html" << 'EOF'
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="fr">
<head><meta charset="UTF-8"><title>Rappel expiration — ImmoCam</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#1a56db;">ImmoCam</h2>
  <p>Bonjour <strong th:text="${prenom}">Prénom</strong>,</p>
  <p>Votre annonce <strong><span th:text="${typeBien}">Appartement</span>
     à <span th:text="${ville}">Douala</span></strong>
     expire dans <strong th:text="${joursRestants}">5</strong> jour(s)
     (le <strong th:text="${dateExpiration}">05/05/2026</strong>).</p>
  <p>Renouvelez-la en un clic depuis votre dashboard pour qu'elle reste visible.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="https://immocam.cm/dashboard"
       style="background:#1a56db;color:#fff;padding:14px 28px;border-radius:6px;
              text-decoration:none;font-weight:bold;display:inline-block;">
      Renouveler mon annonce
    </a>
  </div>
  <p style="color:#888;font-size:12px;">
    Sans action de votre part, l'annonce sera suspendue automatiquement à expiration,
    puis supprimée définitivement 7 jours plus tard.
  </p>
</div>
</body>
</html>
EOF

cat > "$TEMPLATES/annonce-suspendue.html" << 'EOF'
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="fr">
<head><meta charset="UTF-8"><title>Annonce expirée — ImmoCam</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#1a56db;">ImmoCam</h2>
  <p>Bonjour <strong th:text="${prenom}">Prénom</strong>,</p>
  <p>Votre annonce <strong><span th:text="${typeBien}">Appartement</span>
     à <span th:text="${ville}">Douala</span></strong>
     a expiré et n'est plus visible du public.</p>
  <p>Vous pouvez la renouveler depuis votre dashboard pour la remettre en ligne
     immédiatement.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="https://immocam.cm/dashboard"
       style="background:#1a56db;color:#fff;padding:14px 28px;border-radius:6px;
              text-decoration:none;font-weight:bold;display:inline-block;">
      Renouveler mon annonce
    </a>
  </div>
  <p style="color:#e53e3e;font-size:12px;">
    Sans action de votre part, l'annonce sera supprimée définitivement dans 7 jours.
  </p>
</div>
</body>
</html>
EOF

cat > "$TEMPLATES/annonce-supprimee-admin.html" << 'EOF'
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="fr">
<head><meta charset="UTF-8"><title>Annonce supprimée — ImmoCam</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#1a56db;">ImmoCam</h2>
  <p>Bonjour <strong th:text="${prenom}">Prénom</strong>,</p>
  <p>Votre annonce <strong><span th:text="${typeBien}">Appartement</span>
     à <span th:text="${ville}">Douala</span></strong>
     a été supprimée par l'administration ImmoCam.</p>
  <div style="background:#fff5f5;border-left:4px solid #e53e3e;padding:12px 16px;margin:20px 0;">
    <strong>Motif :</strong> <span th:text="${motif}">Contenu inapproprié</span>
  </div>
  <p>Si vous pensez que cette suppression est une erreur, contactez notre support
     via WhatsApp au +237 697 847 396.</p>
</div>
</body>
</html>
EOF

cat > "$TEMPLATES/alerte-connexion.html" << 'EOF'
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="fr">
<head><meta charset="UTF-8"><title>Alerte sécurité — ImmoCam</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#e53e3e;">⚠ Alerte sécurité — ImmoCam</h2>
  <p>Bonjour <strong th:text="${prenom}">Prénom</strong>,</p>
  <p>Nous avons détecté plusieurs tentatives de connexion échouées sur votre compte.</p>
  <div style="background:#fff5f5;border-left:4px solid #e53e3e;padding:12px 16px;margin:20px 0;">
    <strong>IP :</strong> <span th:text="${adresseIp}">0.0.0.0</span><br>
    <strong>Date :</strong> <span th:text="${dateHeure}">01/01/2026 à 14h00</span>
  </div>
  <p>Votre compte a été temporairement bloqué pendant 30 minutes.<br>
     Si ce n'était pas vous, changez immédiatement votre mot de passe.</p>
</div>
</body>
</html>
EOF

cat > "$TEMPLATES/compte-suspendu.html" << 'EOF'
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="fr">
<head><meta charset="UTF-8"><title>Compte suspendu — ImmoCam</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#1a56db;">ImmoCam</h2>
  <p>Bonjour <strong th:text="${prenom}">Prénom</strong>,</p>
  <p>Votre compte ImmoCam a été <strong>suspendu temporairement</strong>.</p>
  <div style="background:#fff5f5;border-left:4px solid #e53e3e;padding:12px 16px;margin:20px 0;">
    <strong>Motif :</strong> <span th:text="${motif}">Violation des conditions d'utilisation</span>
  </div>
  <p>Contactez notre support via WhatsApp au <strong>+237 697 847 396</strong>
     pour contester cette décision.</p>
</div>
</body>
</html>
EOF

cat > "$TEMPLATES/compte-reactive.html" << 'EOF'
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="fr">
<head><meta charset="UTF-8"><title>Compte réactivé — ImmoCam</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#1a56db;">ImmoCam</h2>
  <p>Bonjour <strong th:text="${prenom}">Prénom</strong>,</p>
  <p>Bonne nouvelle ! Votre compte ImmoCam a été <strong>réactivé</strong>.
     Vous pouvez vous connecter et publier vos annonces normalement.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="https://immocam.cm/login"
       style="background:#1a56db;color:#fff;padding:14px 28px;border-radius:6px;
              text-decoration:none;font-weight:bold;display:inline-block;">
      Se connecter
    </a>
  </div>
</div>
</body>
</html>
EOF

OK "9 templates email générés"

# =============================================================================
# 4. AnnonceExpirationScheduler
# =============================================================================
SECTION "4/5 — AnnonceExpirationScheduler"

mkdir -p "$INFRA/scheduler"

cat > "$INFRA/scheduler/AnnonceExpirationScheduler.java" << 'EOF'
package com.mbem.immocam.infrastructure.scheduler;

import com.mbem.immocam.infrastructure.email.service.EmailService;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.utils.DateUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler d'expiration automatique des annonces ImmoCam.
 *
 * Exécuté chaque nuit à 3h00 (configurable via SCHEDULER_CRON).
 *
 * Cycle de vie géré :
 *   J-5 : email au propriétaire "Votre annonce expire dans 5 jours"
 *         + badge dans le dashboard
 *   J-1 : email de dernier rappel
 *   J0  : statut -> EXPIREE (invisible du public)
 *   J+7 : statut -> SUPPRIMEE_SYSTEME (suppression définitive)
 *
 * @author MBEMNOVA
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AnnonceExpirationScheduler {

    private final AnnonceRepository annonceRepository;
    private final EmailService emailService;

    @Value("${immocam.annonce.delai-rappel-j5:5}")
    private int delaiRappelJ5;

    @Value("${immocam.annonce.delai-rappel-j1:1}")
    private int delaiRappelJ1;

    @Value("${immocam.annonce.delai-suppression-apres-expiration:7}")
    private int delaiSuppressionJours;

    /**
     * Tâche principale — s'exécute chaque nuit à 3h00.
     * Désactivée en profil dev (immocam.scheduler.enabled=false).
     */
    @Scheduled(cron = "${immocam.scheduler.expiration-cron:0 0 3 * * *}")
    @Transactional
    public void executerVerificationExpiration() {
        log.info("Scheduler démarré : vérification des expirations d'annonces");
        LocalDateTime maintenant = LocalDateTime.now();
        int total = 0;

        total += envoyerRappelsJ5(maintenant);
        total += envoyerRappelsJ1(maintenant);
        total += suspendreExpirees(maintenant);
        total += supprimerDefinitivement(maintenant);

        log.info("Scheduler terminé : {} annonces traitées", total);
    }

    /** J-5 : email de premier rappel. */
    private int envoyerRappelsJ5(LocalDateTime maintenant) {
        LocalDateTime debut = maintenant.plusDays(delaiRappelJ5).withHour(0).withMinute(0);
        LocalDateTime fin   = maintenant.plusDays(delaiRappelJ5).withHour(23).withMinute(59);
        List<Annonce> annonces = annonceRepository.findAnnoncesRappelJ5(debut, fin);

        for (Annonce a : annonces) {
            try {
                emailService.envoyerRappelExpiration(
                    a.getProprietaire().getEmail(),
                    a.getProprietaire().getPrenom(),
                    a.getTypeBien().getLibelle(),
                    a.getLocalisation().getVille(),
                    DateUtils.formatEmail(a.getDateExpiration()),
                    delaiRappelJ5
                );
                a.setRappelJ5Envoye(true);
                log.debug("Rappel J-5 envoyé pour annonce id={}", a.getId());
            } catch (Exception e) {
                log.error("Erreur rappel J-5 annonce id={} : {}", a.getId(), e.getMessage());
            }
        }
        return annonces.size();
    }

    /** J-1 : email de dernier rappel. */
    private int envoyerRappelsJ1(LocalDateTime maintenant) {
        LocalDateTime debut = maintenant.plusDays(delaiRappelJ1).withHour(0).withMinute(0);
        LocalDateTime fin   = maintenant.plusDays(delaiRappelJ1).withHour(23).withMinute(59);
        List<Annonce> annonces = annonceRepository.findAnnoncesRappelJ1(debut, fin);

        for (Annonce a : annonces) {
            try {
                emailService.envoyerRappelExpiration(
                    a.getProprietaire().getEmail(),
                    a.getProprietaire().getPrenom(),
                    a.getTypeBien().getLibelle(),
                    a.getLocalisation().getVille(),
                    DateUtils.formatEmail(a.getDateExpiration()),
                    delaiRappelJ1
                );
                a.setRappelJ1Envoye(true);
                log.debug("Rappel J-1 envoyé pour annonce id={}", a.getId());
            } catch (Exception e) {
                log.error("Erreur rappel J-1 annonce id={} : {}", a.getId(), e.getMessage());
            }
        }
        return annonces.size();
    }

    /** J0 : passer les annonces expirées en statut EXPIREE. */
    private int suspendreExpirees(LocalDateTime maintenant) {
        List<Annonce> annonces = annonceRepository.findAnnoncesExpirees(maintenant);
        for (Annonce a : annonces) {
            try {
                a.setStatut(StatutAnnonce.EXPIREE);
                emailService.envoyerAnnonceSuspendue(
                    a.getProprietaire().getEmail(),
                    a.getProprietaire().getPrenom(),
                    a.getTypeBien().getLibelle(),
                    a.getLocalisation().getVille()
                );
                log.info("Annonce id={} passée en EXPIREE", a.getId());
            } catch (Exception e) {
                log.error("Erreur expiration annonce id={} : {}", a.getId(), e.getMessage());
            }
        }
        return annonces.size();
    }

    /** J+7 : supprimer définitivement les annonces expirées sans renouvellement. */
    private int supprimerDefinitivement(LocalDateTime maintenant) {
        LocalDateTime limite = maintenant.minusDays(delaiSuppressionJours);
        List<Annonce> annonces = annonceRepository.findAnnoncesASupprimer(limite);
        for (Annonce a : annonces) {
            try {
                a.setStatut(StatutAnnonce.SUPPRIMEE_SYSTEME);
                a.setDeleted(true);
                log.info("Annonce id={} supprimée définitivement par le système", a.getId());
            } catch (Exception e) {
                log.error("Erreur suppression système annonce id={} : {}", a.getId(), e.getMessage());
            }
        }
        return annonces.size();
    }
}
EOF
OK "AnnonceExpirationScheduler.java généré"

# =============================================================================
# 5. LogActiviteService
# =============================================================================
SECTION "5/5 — LogActiviteService"

cat > "$INFRA/audit/LogActiviteService.java" << 'EOF'
package com.mbem.immocam.infrastructure.audit;

import com.mbem.immocam.shared.enums.TypeAction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service d'enregistrement des logs d'activité ImmoCam.
 *
 * Toutes les actions significatives sont tracées de façon asynchrone
 * (@Async) pour ne pas impacter les performances des requêtes.
 *
 * Conservation : 12 mois (politique de confidentialité).
 *
 * Usage dans les services métier :
 *   logActiviteService.log(utilisateurId, TypeAction.PUBLICATION_ANNONCE,
 *                          "Annonce", annonceId, request.getRemoteAddr(), null);
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LogActiviteService {

    private final LogActiviteRepository logActiviteRepository;

    /**
     * Enregistre une action dans les logs de façon asynchrone.
     *
     * @param utilisateurId    ID de l'utilisateur (null si action système)
     * @param typeAction       Type d'action (enum TypeAction)
     * @param entiteConcernee  Nom de l'entité (ex : "Annonce", "Utilisateur")
     * @param entiteId         ID de l'entité concernée (null si non applicable)
     * @param adresseIp        Adresse IP de la requête
     * @param details          Détails complémentaires (JSON ou texte libre)
     */
    @Async
    public void log(Long utilisateurId,
                    TypeAction typeAction,
                    String entiteConcernee,
                    Long entiteId,
                    String adresseIp,
                    String details) {
        try {
            LogActivite logEntry = LogActivite.builder()
                    .utilisateurId(utilisateurId)
                    .typeAction(typeAction)
                    .entiteConcernee(entiteConcernee)
                    .entiteId(entiteId)
                    .adresseIp(adresseIp)
                    .details(details)
                    .build();
            logActiviteRepository.save(logEntry);
        } catch (Exception e) {
            // Ne jamais faire échouer une requête à cause d'un log
            log.warn("Erreur enregistrement log {} pour user {} : {}",
                typeAction, utilisateurId, e.getMessage());
        }
    }

    /**
     * Raccourci pour les actions sans détails supplémentaires.
     *
     * @param utilisateurId ID utilisateur
     * @param typeAction    Type d'action
     * @param adresseIp     IP de la requête
     */
    @Async
    public void log(Long utilisateurId, TypeAction typeAction, String adresseIp) {
        log(utilisateurId, typeAction, null, null, adresseIp, null);
    }
}
EOF
OK "LogActiviteService.java généré"

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
JAVA_COUNT=$(find src/main/java -name "*.java" | wc -l)
HTML_COUNT=$(find src/main/resources/templates -name "*.html" | wc -l)
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SCRIPT 07 TERMINÉ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Fichiers Java total     : $JAVA_COUNT"
INFO "Templates email total   : $HTML_COUNT"
INFO ""
INFO "Générés dans ce script :"
INFO "  infrastructure/storage/service/StorageService.java"
INFO "  infrastructure/storage/service/StorageServiceImpl.java"
INFO "  infrastructure/email/service/EmailService.java"
INFO "  infrastructure/email/service/EmailServiceImpl.java"
INFO "  templates/email/  (9 templates HTML Thymeleaf)"
INFO "  infrastructure/scheduler/AnnonceExpirationScheduler.java"
INFO "  infrastructure/audit/LogActiviteService.java"
echo ""
INFO "Prochaine étape : bash setup_08_auth_module.sh"