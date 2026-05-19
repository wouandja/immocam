package com.mbem.immocam.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * Configuration principale Spring Boot d'ImmoCam.
 *
 * Active par ImmocamApplication :
 *   @EnableJpaAuditing  -> remplissage auto dateCreation/dateModification
 *   @EnableCaching      -> cache Caffeine (OTP, listes villes/types)
 *   @EnableAsync        -> envoi email non bloquant
 *   @EnableScheduling   -> cron nocturne expiration annonces
 *
 * @author MBEMNOVA
 */
@Configuration
public class AppConfig {

    /**
     * Fournit l'identite de l'auteur pour JPA Auditing.
     * Utilisateur connecte -> son email. Systeme -> "system".
     *
     * @return AuditorAware<String>
     */
    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null
                    || !auth.isAuthenticated()
                    || "anonymousUser".equals(auth.getPrincipal())) {
                return Optional.of("system");
            }
            return Optional.of(auth.getName());
        };
    }
}
