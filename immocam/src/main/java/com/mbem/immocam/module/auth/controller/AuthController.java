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
    public ResponseEntity<ApiResponse<AuthResponse>> validerEmail(
            @Valid @RequestBody VerifyEmailRequest request) {
        AuthResponse response = authService.validerEmail(request);
        return ResponseEntity.ok(ApiResponse.ok(
            "Email validé avec succès. Connexion établie.", response));
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

