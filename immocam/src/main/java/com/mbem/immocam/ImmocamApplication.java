package com.mbem.immocam;

import java.util.Optional;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Point d'entree de l'application ImmoCam.
 * Plateforme immobiliere camerounaise — MBEMNOVA.
 *
 * @EnableJpaAuditing : dateCreation/dateModification auto sur BaseEntity
 * @EnableCaching : cache Caffeine (OTP rate-limit, listes)
 * @EnableAsync : envoi emails asynchrone (ne bloque pas la requete HTTP)
 * @EnableScheduling : cron 3h00 d'expiration automatique des annonces
 *
 * @author MBEMNOVA
 */
@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
@EnableCaching
@EnableAsync
@EnableScheduling
public class ImmocamApplication {

    public static void main(String[] args) {
        SpringApplication.run(ImmocamApplication.class, args);
    }

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
