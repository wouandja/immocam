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

    AuthResponse validerEmail(VerifyEmailRequest request);

    void renvoyerCode(ResendCodeRequest request);

    AuthResponse connecter(LoginRequest request, String adresseIp);

    AuthResponse rafraichirToken(RefreshTokenRequest request);

    void motDePasseOublie(ForgotPasswordRequest request);

    void reinitialiserMotDePasse(ResetPasswordRequest request);
}
