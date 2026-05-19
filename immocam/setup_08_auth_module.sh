#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — SCRIPT 08 : MODULE AUTH COMPLET
# =============================================================================
# Rôle     : Génère le module d'authentification complet :
#            - DTOs request/response
#            - AuthService (interface + implémentation)
#            - AuthController (tous les endpoints documentés Swagger)
#
# Endpoints générés :
#   POST /auth/register          — Inscription + envoi OTP
#   POST /auth/verify-email      — Validation code OTP
#   POST /auth/resend-code       — Renvoyer OTP (max 3/h)
#   POST /auth/login             — Connexion email+mdp
#   POST /auth/refresh           — Renouveler l'access token
#   POST /auth/logout            — Déconnexion
#   POST /auth/forgot-password   — Demande réinitialisation mdp
#   POST /auth/reset-password    — Réinitialiser le mdp avec le token
#
# Exécuter : Depuis la RACINE du projet
#            bash setup_08_auth_module.sh
# Prérequis: Scripts 01 à 07 exécutés
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

SECTION "SCRIPT 08 — MODULE AUTH"
INFO "Répertoire courant : $(pwd)"

BASE="src/main/java/com/mbem/immocam"
AUTH="$BASE/module/auth"

[[ -d "$AUTH" ]] || ERROR "Dossier $AUTH introuvable. Lancez d'abord le script 01."

# =============================================================================
# 1. DTOs Request
# =============================================================================
SECTION "1/4 — DTOs Request"

mkdir -p "$AUTH/dto/request" "$AUTH/dto/response"

cat > "$AUTH/dto/request/RegisterRequest.java" << 'EOF'
package com.mbem.immocam.module.auth.dto.request;

import com.mbem.immocam.shared.validation.TelephoneCameroun;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Requête d'inscription.
 *
 * La politique de confidentialité DOIT être acceptée (politiqueAcceptee = true)
 * sinon le bouton "Créer mon compte" reste désactivé côté Angular.
 * Validation aussi côté backend pour la sécurité.
 *
 * @author MBEMNOVA
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(min = 2, max = 50, message = "Le prénom doit contenir entre 2 et 50 caractères")
    private String prenom;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(min = 2, max = 50, message = "Le nom doit contenir entre 2 et 50 caractères")
    private String nom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le téléphone est obligatoire")
    @TelephoneCameroun
    private String telephone;

    @NotBlank(message = "La ville est obligatoire")
    private String ville;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String motDePasse;

    @NotBlank(message = "La confirmation du mot de passe est obligatoire")
    private String confirmationMotDePasse;

    /**
     * Doit être true pour que le compte soit créé.
     * Correspond au checkbox "J'accepte la politique de confidentialité".
     */
    @NotNull(message = "Vous devez accepter la politique de confidentialité")
    private Boolean politiqueAcceptee;
}
EOF

cat > "$AUTH/dto/request/LoginRequest.java" << 'EOF'
package com.mbem.immocam.module.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Requête de connexion.
 *
 * Après 5 tentatives échouées en 15 min : compte bloqué 30 min.
 *
 * @author MBEMNOVA
 */
@Data
public class LoginRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String motDePasse;
}
EOF

cat > "$AUTH/dto/request/VerifyEmailRequest.java" << 'EOF'
package com.mbem.immocam.module.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Requête de validation du code OTP reçu par email.
 * Code valable 10 minutes, max 3 renvois par heure.
 *
 * @author MBEMNOVA
 */
@Data
public class VerifyEmailRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le code est obligatoire")
    @Size(min = 6, max = 6, message = "Le code doit contenir exactement 6 chiffres")
    private String code;
}
EOF

cat > "$AUTH/dto/request/ResendCodeRequest.java" << 'EOF'
package com.mbem.immocam.module.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Requête de renvoi du code OTP.
 * Maximum 3 renvois par heure (anti-spam).
 *
 * @author MBEMNOVA
 */
@Data
public class ResendCodeRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    /** EMAIL_VALIDATION ou REINITIALISATION_MDP */
    @NotBlank(message = "Le type de code est obligatoire")
    private String typeCode;
}
EOF

cat > "$AUTH/dto/request/RefreshTokenRequest.java" << 'EOF'
package com.mbem.immocam.module.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Requête de renouvellement du token d'accès via le refresh token.
 *
 * @author MBEMNOVA
 */
@Data
public class RefreshTokenRequest {

    @NotBlank(message = "Le refresh token est obligatoire")
    private String refreshToken;
}
EOF

cat > "$AUTH/dto/request/ForgotPasswordRequest.java" << 'EOF'
package com.mbem.immocam.module.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Requête de mot de passe oublié.
 * Envoie un lien de réinitialisation valable 30 minutes.
 *
 * @author MBEMNOVA
 */
@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;
}
EOF

cat > "$AUTH/dto/request/ResetPasswordRequest.java" << 'EOF'
package com.mbem.immocam.module.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Requête de réinitialisation du mot de passe avec le token reçu par email.
 *
 * @author MBEMNOVA
 */
@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Le token est obligatoire")
    private String token;

    @NotBlank(message = "Le nouveau mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String nouveauMotDePasse;

    @NotBlank(message = "La confirmation est obligatoire")
    private String confirmationMotDePasse;
}
EOF

OK "7 DTOs request générés"

# =============================================================================
# 2. DTOs Response
# =============================================================================
SECTION "2/4 — DTOs Response"

cat > "$AUTH/dto/response/AuthResponse.java" << 'EOF'
package com.mbem.immocam.module.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Réponse de connexion/inscription réussie.
 * Contient les tokens JWT et les informations de base de l'utilisateur.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;

    /** Type de token — toujours "Bearer" */
    @Builder.Default
    private String tokenType = "Bearer";

    private Long userId;
    private String email;
    private String prenom;
    private String nom;

    /** UTILISATEUR ou ADMINISTRATEUR */
    private String role;
}
EOF

OK "AuthResponse.java généré"

# =============================================================================
# 3. AuthService (interface + implémentation)
# =============================================================================
SECTION "3/4 — AuthService"

mkdir -p "$AUTH/service"

cat > "$AUTH/service/AuthService.java" << 'EOF'
package com.mbem.immocam.module.auth.service;

import com.mbem.immocam.module.auth.dto.request.ForgotPasswordRequest;
import com.mbem.immocam.module.auth.dto.request.LoginRequest;
import com.mbem.immocam.module.auth.dto.request.RefreshTokenRequest;
import com.mbem.immocam.module.auth.dto.request.RegisterRequest;
import com.mbem.immocam.module.auth.dto.request.ResendCodeRequest;
import com.mbem.immocam.module.auth.dto.request.ResetPasswordRequest;
import com.mbem.immocam.module.auth.dto.request.VerifyEmailRequest;
import com.mbem.immocam.module.auth.dto.response.AuthResponse;

/**
 * Service d'authentification ImmoCam.
 *
 * @author MBEMNOVA
 */
public interface AuthService {

    AuthResponse inscrire(RegisterRequest request, String adresseIp);

    void validerEmail(VerifyEmailRequest request);

    void renvoyerCode(ResendCodeRequest request);

    AuthResponse connecter(LoginRequest request, String adresseIp);

    AuthResponse rafraichirToken(RefreshTokenRequest request);

    void motDePasseOublie(ForgotPasswordRequest request);

    void reinitialiserMotDePasse(ResetPasswordRequest request);
}
EOF

cat > "$AUTH/service/AuthServiceImpl.java" << 'EOF'
package com.mbem.immocam.module.auth.service;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.email.service.EmailService;
import com.mbem.immocam.infrastructure.exception.custom.CodeInvalideException;
import com.mbem.immocam.infrastructure.exception.custom.CompteBloqueException;
import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.infrastructure.security.jwt.JwtService;
import com.mbem.immocam.module.auth.dto.request.ForgotPasswordRequest;
import com.mbem.immocam.module.auth.dto.request.LoginRequest;
import com.mbem.immocam.module.auth.dto.request.RefreshTokenRequest;
import com.mbem.immocam.module.auth.dto.request.RegisterRequest;
import com.mbem.immocam.module.auth.dto.request.ResendCodeRequest;
import com.mbem.immocam.module.auth.dto.request.ResetPasswordRequest;
import com.mbem.immocam.module.auth.dto.request.VerifyEmailRequest;
import com.mbem.immocam.module.auth.dto.response.AuthResponse;
import com.mbem.immocam.module.auth.entity.CodeValidation;
import com.mbem.immocam.module.auth.entity.TokenReinitialisation;
import com.mbem.immocam.module.auth.repository.CodeValidationRepository;
import com.mbem.immocam.module.auth.repository.TokenReinitialisationRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import com.mbem.immocam.shared.enums.RoleUtilisateur;
import com.mbem.immocam.shared.enums.StatutCompte;
import com.mbem.immocam.shared.enums.TypeAction;
import com.mbem.immocam.shared.utils.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

/**
 * Implémentation du service d'authentification ImmoCam.
 *
 * Couvre tous les scénarios du cahier des charges :
 *   - Inscription avec validation email OTP
 *   - Connexion avec gestion brute-force (5 tentatives / 30 min de blocage)
 *   - Refresh token
 *   - Mot de passe oublié / réinitialisation
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final CodeValidationRepository codeValidationRepository;
    private final TokenReinitialisationRepository tokenReinitialisationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final LogActiviteService logActiviteService;

    @Value("${immocam.otp.expiration-minutes:10}")
    private int otpExpirationMinutes;

    @Value("${immocam.otp.max-renvois-par-heure:3}")
    private int maxRenvoisParHeure;

    @Value("${immocam.otp.max-tentatives-connexion:5}")
    private int maxTentativesConnexion;

    @Value("${immocam.otp.duree-blocage-minutes:30}")
    private int dureeBlocageMinutes;

    // ── Inscription ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse inscrire(RegisterRequest request, String adresseIp) {
        // Validation de la politique de confidentialité (obligatoire)
        if (!Boolean.TRUE.equals(request.getPolitiqueAcceptee())) {
            throw new IllegalArgumentException(
                "Vous devez accepter la politique de confidentialité pour créer un compte.");
        }

        // Vérification des mots de passe
        if (!request.getMotDePasse().equals(request.getConfirmationMotDePasse())) {
            throw new IllegalArgumentException("Les mots de passe ne correspondent pas.");
        }

        // Vérification email unique
        if (utilisateurRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new DoublonException("Un compte existe déjà avec cet email.");
        }

        // Normalisation et validation du numéro camerounais
        String telephone = PhoneUtils.normaliser(request.getTelephone());

        // Création du compte (statut NON_VERIFIE jusqu'à validation OTP)
        Utilisateur utilisateur = Utilisateur.builder()
                .prenom(request.getPrenom().trim())
                .nom(request.getNom().trim())
                .email(request.getEmail().toLowerCase().trim())
                .telephone(telephone)
                .motDePasseHash(passwordEncoder.encode(request.getMotDePasse()))
                .ville(request.getVille())
                .role(RoleUtilisateur.UTILISATEUR)
                .statut(StatutCompte.NON_VERIFIE)
                .politiqueAcceptee(true)
                .dateAcceptationPolitique(LocalDateTime.now())
                .build();

        utilisateurRepository.save(utilisateur);

        // Générer et envoyer l'OTP
        String code = genererCodeOtp();
        sauvegarderCode(utilisateur, code, ImmoCamConstants.OTP_TYPE_EMAIL_VALIDATION);
        emailService.envoyerCodeValidation(utilisateur.getEmail(), utilisateur.getPrenom(), code);

        logActiviteService.log(utilisateur.getId(), TypeAction.INSCRIPTION, adresseIp);
        log.info("Inscription : {} — OTP envoyé", utilisateur.getEmail());

        // Retourner les infos sans tokens (compte non vérifié)
        return AuthResponse.builder()
                .userId(utilisateur.getId())
                .email(utilisateur.getEmail())
                .prenom(utilisateur.getPrenom())
                .nom(utilisateur.getNom())
                .role(utilisateur.getRole().name())
                .build();
    }

    // ── Validation email ─────────────────────────────────────────────────────

    @Override
    @Transactional
    public void validerEmail(VerifyEmailRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RessourceNotFoundException("Compte non trouvé."));

        CodeValidation code = codeValidationRepository
                .findByUtilisateurIdAndCodeAndTypeCodeAndEstUtiliseFalse(
                    utilisateur.getId(),
                    request.getCode(),
                    ImmoCamConstants.OTP_TYPE_EMAIL_VALIDATION)
                .orElseThrow(() -> new CodeInvalideException(
                    "Code invalide ou déjà utilisé."));

        if (!code.estValide()) {
            throw new CodeInvalideException(
                "Ce code a expiré. Cliquez ici pour recevoir un nouveau code.");
        }

        // Activer le compte
        code.setEstUtilise(true);
        utilisateur.setStatut(StatutCompte.ACTIF);
        utilisateur.setTentativesConnexionEchouees(0);

        logActiviteService.log(utilisateur.getId(), TypeAction.VALIDATION_EMAIL, null);
        log.info("Email validé : {}", utilisateur.getEmail());
    }

    // ── Renvoi code OTP ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public void renvoyerCode(ResendCodeRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RessourceNotFoundException("Compte non trouvé."));

        // Vérifier la limite de renvois (3 par heure)
        LocalDateTime ilYaUneHeure = LocalDateTime.now().minusHours(1);
        int nbRenvois = codeValidationRepository.countRenvoisRecents(
            utilisateur.getId(), request.getTypeCode(), ilYaUneHeure);

        if (nbRenvois >= maxRenvoisParHeure) {
            throw new LimiteAtteintException(
                "Limite de renvois atteinte. Veuillez patienter avant de demander un nouveau code.");
        }

        // Invalider les anciens codes
        codeValidationRepository.invaliderCodesExistants(
            utilisateur.getId(), request.getTypeCode());

        // Générer et envoyer le nouveau code
        String code = genererCodeOtp();
        sauvegarderCode(utilisateur, code, request.getTypeCode());
        emailService.envoyerCodeValidation(utilisateur.getEmail(), utilisateur.getPrenom(), code);

        log.info("Code OTP renvoyé à : {}", utilisateur.getEmail());
    }

    // ── Connexion ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse connecter(LoginRequest request, String adresseIp) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email ou mot de passe incorrect."));

        // Vérifier si le compte est bloqué (brute-force)
        if (utilisateur.estBloque()) {
            throw new CompteBloqueException(
                "Compte temporairement bloqué. Réessayez dans 30 minutes.");
        }

        try {
            // Spring Security vérifie le mot de passe
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse()));
        } catch (BadCredentialsException e) {
            // Incrémenter le compteur de tentatives
            int tentatives = utilisateur.getTentativesConnexionEchouees() + 1;
            utilisateur.setTentativesConnexionEchouees(tentatives);

            if (tentatives >= maxTentativesConnexion) {
                // Bloquer le compte 30 minutes
                utilisateur.setCompteBloqueJusqua(
                    LocalDateTime.now().plusMinutes(dureeBlocageMinutes));
                utilisateur.setTentativesConnexionEchouees(0);
                emailService.envoyerAlerteConnexionSuspecte(
                    utilisateur.getEmail(), utilisateur.getPrenom(),
                    adresseIp, LocalDateTime.now().toString());
                logActiviteService.log(utilisateur.getId(), TypeAction.COMPTE_BLOQUE, adresseIp);
            } else {
                logActiviteService.log(utilisateur.getId(),
                    TypeAction.TENTATIVE_CONNEXION_ECHOUEE, adresseIp);
            }
            throw new BadCredentialsException("Email ou mot de passe incorrect.");
        }

        // Connexion réussie — réinitialiser le compteur
        utilisateur.setTentativesConnexionEchouees(0);
        utilisateur.setCompteBloqueJusqua(null);
        utilisateur.setDernierLogin(LocalDateTime.now());

        String role = "ROLE_" + utilisateur.getRole().name();
        String accessToken  = jwtService.genererAccessToken(utilisateur.getId(), utilisateur.getEmail(), role);
        String refreshToken = jwtService.genererRefreshToken(utilisateur.getId(), utilisateur.getEmail());

        logActiviteService.log(utilisateur.getId(), TypeAction.CONNEXION, adresseIp);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(utilisateur.getId())
                .email(utilisateur.getEmail())
                .prenom(utilisateur.getPrenom())
                .nom(utilisateur.getNom())
                .role(utilisateur.getRole().name())
                .build();
    }

    // ── Refresh token ────────────────────────────────────────────────────────

    @Override
    public AuthResponse rafraichirToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (!jwtService.estValide(token)) {
            throw new CodeInvalideException("Refresh token invalide ou expiré. Reconnectez-vous.");
        }
        String email = jwtService.extraireEmail(token);
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RessourceNotFoundException("Compte non trouvé."));

        String role = "ROLE_" + utilisateur.getRole().name();
        String nouveauAccessToken = jwtService.genererAccessToken(
            utilisateur.getId(), utilisateur.getEmail(), role);
        String nouveauRefreshToken = jwtService.genererRefreshToken(
            utilisateur.getId(), utilisateur.getEmail());

        return AuthResponse.builder()
                .accessToken(nouveauAccessToken)
                .refreshToken(nouveauRefreshToken)
                .userId(utilisateur.getId())
                .email(utilisateur.getEmail())
                .prenom(utilisateur.getPrenom())
                .nom(utilisateur.getNom())
                .role(utilisateur.getRole().name())
                .build();
    }

    // ── Mot de passe oublié ──────────────────────────────────────────────────

    @Override
    @Transactional
    public void motDePasseOublie(ForgotPasswordRequest request) {
        // Ne pas indiquer si l'email existe (sécurité — anti-enumération)
        utilisateurRepository.findByEmail(request.getEmail()).ifPresent(utilisateur -> {
            tokenReinitialisationRepository.invaliderTokensExistants(utilisateur.getId());

            String token = UUID.randomUUID().toString();
            TokenReinitialisation tokenEntity = TokenReinitialisation.builder()
                    .utilisateur(utilisateur)
                    .token(token)
                    .dateExpiration(LocalDateTime.now().plusMinutes(30))
                    .build();
            tokenReinitialisationRepository.save(tokenEntity);

            String lien = "https://immocam.cm/reset-password?token=" + token;
            emailService.envoyerLienReinitialisation(
                utilisateur.getEmail(), utilisateur.getPrenom(), lien);

            log.info("Lien réinitialisation envoyé à : {}", utilisateur.getEmail());
        });
    }

    // ── Réinitialisation mot de passe ────────────────────────────────────────

    @Override
    @Transactional
    public void reinitialiserMotDePasse(ResetPasswordRequest request) {
        if (!request.getNouveauMotDePasse().equals(request.getConfirmationMotDePasse())) {
            throw new IllegalArgumentException("Les mots de passe ne correspondent pas.");
        }

        TokenReinitialisation tokenEntity = tokenReinitialisationRepository
                .findByTokenAndEstUtiliseFalse(request.getToken())
                .orElseThrow(() -> new CodeInvalideException(
                    "Lien invalide ou déjà utilisé. Demandez un nouveau lien."));

        if (!tokenEntity.estValide()) {
            throw new CodeInvalideException(
                "Ce lien a expiré (30 min). Demandez un nouveau lien de réinitialisation.");
        }

        Utilisateur utilisateur = tokenEntity.getUtilisateur();
        utilisateur.setMotDePasseHash(passwordEncoder.encode(request.getNouveauMotDePasse()));
        utilisateur.setTentativesConnexionEchouees(0);
        utilisateur.setCompteBloqueJusqua(null);
        tokenEntity.setEstUtilise(true);

        logActiviteService.log(utilisateur.getId(), TypeAction.REINITIALISATION_MDP, null);
        log.info("Mot de passe réinitialisé pour : {}", utilisateur.getEmail());
    }

    // ── Helpers privés ────────────────────────────────────────────────────────

    private String genererCodeOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    private void sauvegarderCode(Utilisateur utilisateur, String code, String typeCode) {
        CodeValidation codeValidation = CodeValidation.builder()
                .utilisateur(utilisateur)
                .code(code)
                .typeCode(typeCode)
                .dateExpiration(LocalDateTime.now().plusMinutes(otpExpirationMinutes))
                .build();
        codeValidationRepository.save(codeValidation);
    }
}
EOF
OK "AuthService.java généré"
OK "AuthServiceImpl.java généré"

# =============================================================================
# 4. AuthController
# =============================================================================
SECTION "4/4 — AuthController"

mkdir -p "$AUTH/controller"

cat > "$AUTH/controller/AuthController.java" << 'EOF'
package com.mbem.immocam.module.auth.controller;

import com.mbem.immocam.module.auth.dto.request.ForgotPasswordRequest;
import com.mbem.immocam.module.auth.dto.request.LoginRequest;
import com.mbem.immocam.module.auth.dto.request.RefreshTokenRequest;
import com.mbem.immocam.module.auth.dto.request.RegisterRequest;
import com.mbem.immocam.module.auth.dto.request.ResendCodeRequest;
import com.mbem.immocam.module.auth.dto.request.ResetPasswordRequest;
import com.mbem.immocam.module.auth.dto.request.VerifyEmailRequest;
import com.mbem.immocam.module.auth.dto.response.AuthResponse;
import com.mbem.immocam.module.auth.service.AuthService;
import com.mbem.immocam.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller d'authentification ImmoCam.
 *
 * Tous les endpoints sont publics (configurés dans SecurityConfig).
 * Le rate-limiting est assuré par RateLimitingFilter.
 *
 * @author MBEMNOVA
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification",
     description = "Inscription, connexion, validation email, réinitialisation mot de passe")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Inscription",
               description = "Crée un compte et envoie un OTP de validation par email. " +
                             "La politique de confidentialité doit être acceptée.")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> inscrire(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.inscrire(request, httpRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                    "Compte créé. Vérifiez votre email pour le code de validation.", response));
    }

    @Operation(summary = "Validation email",
               description = "Valide le code OTP reçu par email. " +
                             "Le compte passe en statut ACTIF.")
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> validerEmail(
            @Valid @RequestBody VerifyEmailRequest request) {
        authService.validerEmail(request);
        return ResponseEntity.ok(ApiResponse.message(
            "Email validé avec succès. Vous pouvez maintenant vous connecter."));
    }

    @Operation(summary = "Renvoyer le code OTP",
               description = "Renvoie un nouveau code de validation. Maximum 3 fois par heure.")
    @PostMapping("/resend-code")
    public ResponseEntity<ApiResponse<Void>> renvoyerCode(
            @Valid @RequestBody ResendCodeRequest request) {
        authService.renvoyerCode(request);
        return ResponseEntity.ok(ApiResponse.message(
            "Un nouveau code vient d'être envoyé à votre adresse email."));
    }

    @Operation(summary = "Connexion",
               description = "Connexion par email et mot de passe. " +
                             "Retourne un access token (1h) et un refresh token (30j). " +
                             "Après 5 tentatives échouées : compte bloqué 30 min.")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> connecter(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.connecter(request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Connexion réussie.", response));
    }

    @Operation(summary = "Rafraîchir le token",
               description = "Génère un nouvel access token depuis le refresh token.")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> rafraichirToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.rafraichirToken(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @Operation(summary = "Mot de passe oublié",
               description = "Envoie un lien de réinitialisation valable 30 minutes. " +
                             "Ne révèle pas si l'email existe (anti-énumération).")
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> motDePasseOublie(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.motDePasseOublie(request);
        return ResponseEntity.ok(ApiResponse.message(
            "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."));
    }

    @Operation(summary = "Réinitialiser le mot de passe",
               description = "Réinitialise le mot de passe avec le token reçu par email.")
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> reinitialiserMotDePasse(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.reinitialiserMotDePasse(request);
        return ResponseEntity.ok(ApiResponse.message(
            "Mot de passe modifié avec succès. Vous pouvez vous connecter."));
    }
}
EOF
OK "AuthController.java généré"

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
JAVA_COUNT=$(find src/main/java -name "*.java" | wc -l)
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SCRIPT 08 TERMINÉ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Fichiers Java total : $JAVA_COUNT"
INFO ""
INFO "Générés dans ce script :"
INFO "  module/auth/dto/request/  (7 DTOs)"
INFO "  module/auth/dto/response/ (AuthResponse)"
INFO "  module/auth/service/AuthService.java"
INFO "  module/auth/service/AuthServiceImpl.java"
INFO "  module/auth/controller/AuthController.java"
echo ""
INFO "Endpoints disponibles :"
INFO "  POST /api/auth/register"
INFO "  POST /api/auth/verify-email"
INFO "  POST /api/auth/resend-code"
INFO "  POST /api/auth/login"
INFO "  POST /api/auth/refresh"
INFO "  POST /api/auth/forgot-password"
INFO "  POST /api/auth/reset-password"
echo ""
INFO "Prochaine étape : bash setup_09_annonce_module.sh"