package com.mbem.immocam;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Test de démarrage du contexte Spring Boot.
 *
 * Vérifie que l'ensemble de la configuration, des beans et des
 * repositories se charge correctement sans erreur.
 *
 * Utilise le profil "test" avec H2 en mémoire (application-test.yaml).
 *
 * @author MBEMNOVA
 */
@SpringBootTest
@ActiveProfiles("test")
class ImmocamApplicationTests {

    @Test
    void contextLoads() {
        // Ce test vérifie que le contexte Spring démarre sans erreur.
        // S'il passe, toute la configuration est correcte.
    }
}
