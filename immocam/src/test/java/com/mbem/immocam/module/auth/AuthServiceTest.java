package com.mbem.immocam.module.auth;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.email.service.EmailService;
import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.infrastructure.security.jwt.JwtService;
import com.mbem.immocam.module.auth.dto.request.RegisterRequest;
import com.mbem.immocam.module.auth.dto.response.AuthResponse;
import com.mbem.immocam.module.auth.entity.CodeValidation;
import com.mbem.immocam.module.auth.repository.CodeValidationRepository;
import com.mbem.immocam.module.auth.repository.TokenReinitialisationRepository;
import com.mbem.immocam.module.auth.service.AuthServiceImpl;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.RoleUtilisateur;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de AuthServiceImpl.
 * Toutes les dépendances sont mockées avec Mockito.
 *
 * @author MBEMNOVA
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UtilisateurRepository utilisateurRepository;
    @Mock CodeValidationRepository codeValidationRepository;
    @Mock TokenReinitialisationRepository tokenReinitialisationRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock AuthenticationManager authenticationManager;
    @Mock EmailService emailService;
    @Mock LogActiviteService logActiviteService;

    @InjectMocks AuthServiceImpl authService;

    @Test
    @DisplayName("Inscription réussie — retourne l'utilisateur et envoie l'OTP")
    void inscrire_succes_envoieOtpEtRetourneInfos() {
        ReflectionTestUtils.setField(authService, "otpExpirationMinutes", 10);
        RegisterRequest req = new RegisterRequest();
        req.setPrenom("Franck");
        req.setNom("Junior");
        req.setEmail("franck@example.cm");
        req.setTelephone("+237691234567");
        req.setVille("Douala");
        req.setMotDePasse("motdepasse123");
        req.setConfirmationMotDePasse("motdepasse123");
        req.setPolitiqueAcceptee(true);

        when(utilisateurRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$hash");
        Utilisateur saved = Utilisateur.builder()
                .prenom("Franck").nom("Junior").email("franck@example.cm")
                .role(RoleUtilisateur.UTILISATEUR)
                .build();
        ReflectionTestUtils.setField(saved, "id", 1L);
        when(utilisateurRepository.save(any())).thenReturn(saved);
        when(codeValidationRepository.save(any())).thenReturn(new CodeValidation());

        AuthResponse response = authService.inscrire(req, "127.0.0.1");

        assertThat(response).isNotNull();
        verify(emailService).envoyerCodeValidation(anyString(), anyString(), anyString());
        verify(utilisateurRepository).save(any(Utilisateur.class));
    }

    @Test
    @DisplayName("Inscription échoue — email déjà utilisé")
    void inscrire_emailExistant_leveDoublonException() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("existant@immocam.cm");
        req.setPolitiqueAcceptee(true);
        req.setMotDePasse("abc12345");
        req.setConfirmationMotDePasse("abc12345");

        when(utilisateurRepository.existsByEmail(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.inscrire(req, "127.0.0.1"))
            .isInstanceOf(DoublonException.class)
            .hasMessageContaining("compte existe déjà");
    }

    @Test
    @DisplayName("Inscription échoue — politique non acceptée")
    void inscrire_politiqueNonAcceptee_leveException() {
        RegisterRequest req = new RegisterRequest();
        req.setPolitiqueAcceptee(false);

        assertThatThrownBy(() -> authService.inscrire(req, "127.0.0.1"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("politique");
    }

    @Test
    @DisplayName("Inscription échoue — mots de passe différents")
    void inscrire_motDePasseDifferents_leveException() {
        RegisterRequest req = new RegisterRequest();
        req.setPolitiqueAcceptee(true);
        req.setMotDePasse("password123");
        req.setConfirmationMotDePasse("different456");
        when(utilisateurRepository.existsByEmail(any())).thenReturn(false);

        assertThatThrownBy(() -> authService.inscrire(req, "127.0.0.1"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("correspondent pas");
    }
}
