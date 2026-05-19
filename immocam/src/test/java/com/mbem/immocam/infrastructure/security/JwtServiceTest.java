package com.mbem.immocam.infrastructure.security;

import com.mbem.immocam.infrastructure.security.jwt.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests unitaires de JwtService.
 * Aucune dépendance Spring — instanciation directe.
 *
 * @author MBEMNOVA
 */
class JwtServiceTest {

    private JwtService jwtService;

    private static final Long   USER_ID = 42L;
    private static final String EMAIL   = "test@immocam.cm";
    private static final String ROLE    = "ROLE_UTILISATEUR";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret",
            "test-secret-key-minimum-32-characters-for-hmac-sha256-signing-key");
        ReflectionTestUtils.setField(jwtService, "accessExpirationMs",  3_600_000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpirationMs", 86_400_000L);
    }

    @Test
    @DisplayName("Génère un access token valide et extractible")
    void genererAccessToken_retourneTokenValide() {
        String token = jwtService.genererAccessToken(USER_ID, EMAIL, ROLE);

        assertThat(token).isNotBlank();
        assertThat(jwtService.estValide(token)).isTrue();
        assertThat(jwtService.estAccessToken(token)).isTrue();
        assertThat(jwtService.extraireEmail(token)).isEqualTo(EMAIL);
        assertThat(jwtService.extraireUserId(token)).isEqualTo(USER_ID);
    }

    @Test
    @DisplayName("Génère un refresh token — n'est pas un access token")
    void genererRefreshToken_nEstPasUnAccessToken() {
        String refresh = jwtService.genererRefreshToken(USER_ID, EMAIL);

        assertThat(refresh).isNotBlank();
        assertThat(jwtService.estValide(refresh)).isTrue();
        assertThat(jwtService.estAccessToken(refresh)).isFalse();
    }

    @Test
    @DisplayName("Token invalide (modifié) est rejeté")
    void tokenModifie_estInvalide() {
        String token = jwtService.genererAccessToken(USER_ID, EMAIL, ROLE);
        String tokenModifie = token.substring(0, token.length() - 5) + "XXXXX";

        assertThat(jwtService.estValide(tokenModifie)).isFalse();
    }

    @Test
    @DisplayName("Token expiré est rejeté")
    void tokenExpire_estInvalide() throws Exception {
        ReflectionTestUtils.setField(jwtService, "accessExpirationMs", 1L);
        String token = jwtService.genererAccessToken(USER_ID, EMAIL, ROLE);
        Thread.sleep(10);

        assertThat(jwtService.estValide(token)).isFalse();
    }
}
