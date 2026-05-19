package com.mbem.immocam.infrastructure.security.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.mbem.immocam.infrastructure.security.filter.JwtAuthenticationFilter;
import com.mbem.immocam.infrastructure.security.filter.RateLimitingFilter;

import lombok.RequiredArgsConstructor;

/**
 * Configuration Spring Security d'ImmoCam.
 *
 * Regles d'acces :
 *
 * PUBLIC (visiteur non connecte) :
 * GET /annonces/** - Liste et detail des annonces
 * GET /localisations/** - Villes et quartiers
 * GET /types-biens/** - Types de biens
 * GET /commentaires/** - Lecture des commentaires
 * GET /uploads/** - Photos stockees sur le VPS
 * ALL /auth/** - Inscription, connexion, OTP
 *
 * AUTHENTIFIE :
 * POST /contacts/** - Contact WhatsApp
 * POST /commentaires/** - Poster un commentaire
 * POST /favoris/** - Gerer les favoris
 * POST /signalements/** - Signaler une annonce
 * POST /annonces - Publier une annonce
 * PUT/PATCH/DELETE /annonces/** - Gerer ses annonces
 *
 * ADMIN uniquement :
 * ALL /admin/**
 */

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final RateLimitingFilter rateLimitingFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // ── Auth ────────────────────────────────────────────────────────
                        .requestMatchers("/auth/**").permitAll()

                        // ── Documentation ───────────────────────────────────────────────
                        .requestMatchers(
                                "/swagger-ui/**", "/v3/api-docs/**",
                                "/actuator/health", "/actuator/info")
                        .permitAll()

                        // ── Fichiers statiques ───────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                        // ── Référentiels publics ─────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/localisations/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/types-biens/**").permitAll()

                        // ── Commentaires lecture publique ────────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/commentaires/**").permitAll()

                        // ── Annonces : ORDRE CRITIQUE (précis → large) ───────────────────
                        // 1. Mes annonces : authentifié EN PREMIER
                        .requestMatchers(HttpMethod.GET, "/annonces/mes-annonces").authenticated()
                        // 2. Photos d'une annonce : public
                        .requestMatchers(HttpMethod.GET, "/annonces/*/photos").permitAll()
                        // 3. Détail d'une annonce : public ← /* et non {id}
                        .requestMatchers(HttpMethod.GET, "/annonces/*").permitAll()
                        // 4. Liste des annonces : public
                        .requestMatchers(HttpMethod.GET, "/annonces").permitAll()
                        // 5. Publier
                        .requestMatchers(HttpMethod.POST, "/annonces").authenticated()
                        // 6. Modifier / supprimer
                        .requestMatchers(HttpMethod.PUT, "/annonces/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/annonces/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/annonces/**").authenticated()

                        // ── Interactions utilisateur ─────────────────────────────────────
                        .requestMatchers(HttpMethod.POST, "/contacts/**").authenticated()
                        // ── Commentaires ─────────────────────────────────────────────────
                        // Lecture publique
                        .requestMatchers(HttpMethod.GET, "/annonces/*/commentaires").permitAll()

                        // Écriture authentifiée
                        .requestMatchers(HttpMethod.POST, "/annonces/*/commentaires").authenticated()
                        .requestMatchers(HttpMethod.POST, "/commentaires/*/repondre").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/commentaires/*").authenticated()
                        // ── Favoris ───────────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/favoris").authenticated()
                        .requestMatchers(HttpMethod.POST, "/favoris/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/favoris/*").authenticated()
                        .requestMatchers(HttpMethod.POST, "/signalements/**").authenticated()

                        // ── Admin ────────────────────────────────────────────────────────
                        .requestMatchers("/admin/**").hasAuthority("ADMINISTRATEUR")

                        // ── Fallback ─────────────────────────────────────────────────────
                        .anyRequest().authenticated())
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt avec force 12 — bon équilibre sécurité/performance
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // En production, remplacer par le domaine Angular exact
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
