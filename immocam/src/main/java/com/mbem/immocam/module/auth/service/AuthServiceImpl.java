package com.mbem.immocam.module.auth.service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.email.service.EmailService;
import com.mbem.immocam.infrastructure.exception.custom.CodeInvalideException;
import com.mbem.immocam.infrastructure.exception.custom.CompteBloqueException;
import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.infrastructure.exception.custom.LimiteAtteintException;
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
import com.mbem.immocam.module.config.service.ConfigSystemeService;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import com.mbem.immocam.shared.enums.RoleUtilisateur;
import com.mbem.immocam.shared.enums.StatutCompte;
import com.mbem.immocam.shared.enums.TypeAction;
import com.mbem.immocam.shared.utils.PhoneUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
    private final ConfigSystemeService configSystemeService;

    @Value("${immocam.otp.expiration-minutes:10}")
    private int otpExpirationMinutes;

    @Value("${immocam.otp.max-renvois-par-heure:3}")
    private int maxRenvoisParHeure;

    @Value("${immocam.otp.max-tentatives-connexion:5}")
    private int maxTentativesConnexion;

    @Value("${immocam.otp.duree-blocage-minutes:30}")
    private int dureeBlocageMinutes;

    // ── Inscription ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse inscrire(RegisterRequest request, String adresseIp) {
        if (!Boolean.TRUE.equals(request.getPolitiqueAcceptee())) {
            throw new IllegalArgumentException(
                "Vous devez accepter la politique de confidentialite pour creer un compte.");
        }
        if (!request.getMotDePasse().equals(request.getConfirmationMotDePasse())) {
            throw new IllegalArgumentException("Les mots de passe ne correspondent pas.");
        }
        if (utilisateurRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new DoublonException("Un compte existe deja avec cet email.");
        }

        String telephone = PhoneUtils.normaliser(request.getTelephone());

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

        String code = genererCodeOtp();
        sauvegarderCode(utilisateur, code, ImmoCamConstants.OTP_TYPE_EMAIL_VALIDATION);
        log.info("Inscription : {} — OTP envoye", utilisateur.getEmail());
        log.debug("Code OTP pour {} : {}", utilisateur.getEmail(), code);
        emailService.envoyerCodeValidation(utilisateur.getEmail(), utilisateur.getPrenom(), code);
        logActiviteService.log(utilisateur.getId(), TypeAction.INSCRIPTION, adresseIp);

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
    public AuthResponse validerEmail(VerifyEmailRequest request) {
        String emailNormalise = request.getEmail().toLowerCase().trim();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(emailNormalise)
                .orElseThrow(() -> new RessourceNotFoundException("Compte non trouve."));

        CodeValidation code = codeValidationRepository
                .findByUtilisateurIdAndCodeAndTypeCodeAndEstUtiliseFalse(
                    utilisateur.getId(),
                    request.getCode(),
                    ImmoCamConstants.OTP_TYPE_EMAIL_VALIDATION)
                .orElseThrow(() -> new CodeInvalideException("Code invalide ou deja utilise."));

        if (!code.estValide()) {
            throw new CodeInvalideException(
                "Ce code a expire. Cliquez ici pour recevoir un nouveau code.");
        }

        code.setEstUtilise(true);
        utilisateur.setStatut(StatutCompte.ACTIF);
        utilisateur.setTentativesConnexionEchouees(0);
        logActiviteService.log(utilisateur.getId(), TypeAction.VALIDATION_EMAIL, null);
        log.info("Email valide : {}", utilisateur.getEmail());

        // role sans prefixe ROLE_ — correspond a hasAuthority('ADMINISTRATEUR')
        String accessToken  = jwtService.genererAccessToken(
                utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole().name());
        String refreshToken = jwtService.genererRefreshToken(
                utilisateur.getId(), utilisateur.getEmail());

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

    // ── Renvoi code OTP ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public void renvoyerCode(ResendCodeRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RessourceNotFoundException("Compte non trouve."));

        LocalDateTime ilYaUneHeure = LocalDateTime.now().minusHours(1);
        int nbRenvois = codeValidationRepository.countRenvoisRecents(
            utilisateur.getId(), request.getTypeCode(), ilYaUneHeure);

        if (nbRenvois >= maxRenvoisParHeure) {
            throw new LimiteAtteintException(
                "Limite de renvois atteinte. Veuillez patienter avant de demander un nouveau code.");
        }

        codeValidationRepository.invaliderCodesExistants(
            utilisateur.getId(), request.getTypeCode());

        String code = genererCodeOtp();
        sauvegarderCode(utilisateur, code, request.getTypeCode());
        log.info("Code OTP renvoye a : {} - le code est : {}", utilisateur.getEmail(), code);
        emailService.envoyerCodeValidation(utilisateur.getEmail(), utilisateur.getPrenom(), code);
    }

    // ── Connexion ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse connecter(LoginRequest request, String adresseIp) {
        String emailNormalise = request.getEmail().toLowerCase().trim();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(emailNormalise)
                .orElseThrow(() -> new BadCredentialsException("Email ou mot de passe incorrect."));

        if (utilisateur.getStatut() == StatutCompte.NON_VERIFIE) {
            throw new CompteBloqueException(
                "Email non valide. Veuillez valider votre email avant de vous connecter.");
        }
        if (utilisateur.estBloque()) {
            throw new CompteBloqueException(
                "Compte temporairement bloque. Reessayez dans 30 minutes.");
        }

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(emailNormalise, request.getMotDePasse()));
        } catch (BadCredentialsException e) {
            int maxTentatives = configSystemeService.getInt(
                    ImmoCamConstants.CONFIG_MAX_CONNEXIONS_ECHOUEES, maxTentativesConnexion);
            int dureeBlocage = configSystemeService.getInt(
                    ImmoCamConstants.CONFIG_DUREE_BLOCAGE_MINUTES, dureeBlocageMinutes);
            int tentatives = utilisateur.getTentativesConnexionEchouees() + 1;
            utilisateur.setTentativesConnexionEchouees(tentatives);

            if (tentatives >= maxTentatives) {
                utilisateur.setCompteBloqueJusqua(
                    LocalDateTime.now().plusMinutes(dureeBlocage));
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

        utilisateur.setTentativesConnexionEchouees(0);
        utilisateur.setCompteBloqueJusqua(null);
        utilisateur.setDernierLogin(LocalDateTime.now());

        // role sans prefixe ROLE_ — correspond a hasAuthority('ADMINISTRATEUR')
        String accessToken  = jwtService.genererAccessToken(
                utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole().name());
        String refreshToken = jwtService.genererRefreshToken(
                utilisateur.getId(), utilisateur.getEmail());

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
            throw new CodeInvalideException("Refresh token invalide ou expire. Reconnectez-vous.");
        }

        String email = jwtService.extraireEmail(token);
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RessourceNotFoundException("Compte non trouve."));

        // role sans prefixe ROLE_ — correspond a hasAuthority('ADMINISTRATEUR')
        String nouveauAccessToken  = jwtService.genererAccessToken(
                utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole().name());
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

    // ── Mot de passe oublie ──────────────────────────────────────────────────

    @Override
    @Transactional
    public void motDePasseOublie(ForgotPasswordRequest request) {
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

            log.info("Lien reinitialisation envoye a : {}", utilisateur.getEmail());
        });
    }

    // ── Reinitialisation mot de passe ────────────────────────────────────────

    @Override
    @Transactional
    public void reinitialiserMotDePasse(ResetPasswordRequest request) {
        if (!request.getNouveauMotDePasse().equals(request.getConfirmationMotDePasse())) {
            throw new IllegalArgumentException("Les mots de passe ne correspondent pas.");
        }

        TokenReinitialisation tokenEntity = tokenReinitialisationRepository
                .findByTokenAndEstUtiliseFalse(request.getToken())
                .orElseThrow(() -> new CodeInvalideException(
                    "Lien invalide ou deja utilise. Demandez un nouveau lien."));

        if (!tokenEntity.estValide()) {
            throw new CodeInvalideException(
                "Ce lien a expire (30 min). Demandez un nouveau lien de reinitialisation.");
        }

        Utilisateur utilisateur = tokenEntity.getUtilisateur();
        utilisateur.setMotDePasseHash(passwordEncoder.encode(request.getNouveauMotDePasse()));
        utilisateur.setTentativesConnexionEchouees(0);
        utilisateur.setCompteBloqueJusqua(null);
        tokenEntity.setEstUtilise(true);

        logActiviteService.log(utilisateur.getId(), TypeAction.REINITIALISATION_MDP, null);
        log.info("Mot de passe reinitialise pour : {}", utilisateur.getEmail());
    }

    // ── Helpers prives ────────────────────────────────────────────────────────

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
