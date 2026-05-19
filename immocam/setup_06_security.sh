#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — SCRIPT 06 : SÉCURITÉ (JWT + Spring Security)
# =============================================================================
# Rôle     : Génère toute la couche sécurité :
#            - JwtService (génération/validation JWT)
#            - JwtAuthenticationFilter (filtre Once Per Request)
#            - UserDetailsServiceImpl
#            - RateLimitingFilter (protection anti-spam par IP)
#            - SecurityConfig (routes publiques/protégées/admin, CORS)
#            - SecurityUtils (helper accès utilisateur courant)
#            - GlobalExceptionHandler (gestion centralisée des erreurs)
#            - 6 exceptions custom métier
#            - ImmocamApplicationTests.java
#
# Exécuter : Depuis la RACINE du projet
#            bash setup_06_security.sh
# Prérequis: Scripts 01 à 05 exécutés
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

SECTION "SCRIPT 06 — SÉCURITÉ"
INFO "Répertoire courant : $(pwd)"

BASE="src/main/java/com/mbem/immocam"
SEC="$BASE/infrastructure/security"
EXC="$BASE/infrastructure/exception"

[[ -d "$BASE/infrastructure" ]] || ERROR "Infrastructure introuvable. Lancez d'abord le script 01."


# =============================================================================
# 1. JwtService
# =============================================================================
SECTION "1/9 — JwtService"

mkdir -p "$SEC/jwt"

cat > "$SEC/jwt/JwtService.java" << 'EOF'
package com.mbem.immocam.infrastructure.security.jwt;

import com.mbem.immocam.shared.constants.ImmoCamConstants;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

/**
 * Service de génération et validation des tokens JWT.
 *
 * Access token  : durée 1 heure (configurable via JWT_ACCESS_EXP)
 * Refresh token : durée 30 jours (configurable via JWT_REFRESH_EXP)
 *
 * Claims embarqués :
 *   - sub     : email de l'utilisateur
 *   - userId  : id Long de l'utilisateur
 *   - role    : UTILISATEUR ou ADMINISTRATEUR
 *   - type    : ACCESS ou REFRESH
 *
 * @author MBEMNOVA
 */
@Service
@Slf4j
public class JwtService {

    @Value("${immocam.security.jwt.secret}")
    private String secret;

    @Value("${immocam.security.jwt.access-expiration-ms}")
    private long accessExpirationMs;

    @Value("${immocam.security.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Génère un access token JWT.
     *
     * @param userId ID de l'utilisateur
     * @param email  Email (subject du token)
     * @param role   Rôle Spring Security
     * @return Token JWT signé
     */
    public String genererAccessToken(Long userId, String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claims(Map.of(
                    ImmoCamConstants.JWT_CLAIM_USER_ID, userId,
                    ImmoCamConstants.JWT_CLAIM_ROLE, role,
                    ImmoCamConstants.JWT_CLAIM_TYPE, ImmoCamConstants.JWT_TYPE_ACCESS
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessExpirationMs))
                .signWith(getKey())
                .compact();
    }

    /**
     * Génère un refresh token JWT.
     *
     * @param userId ID de l'utilisateur
     * @param email  Email (subject du token)
     * @return Refresh token JWT signé
     */
    public String genererRefreshToken(Long userId, String email) {
        return Jwts.builder()
                .subject(email)
                .claims(Map.of(
                    ImmoCamConstants.JWT_CLAIM_USER_ID, userId,
                    ImmoCamConstants.JWT_CLAIM_TYPE, ImmoCamConstants.JWT_TYPE_REFRESH
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpirationMs))
                .signWith(getKey())
                .compact();
    }

    /**
     * Extrait tous les claims d'un token.
     *
     * @param token Token JWT
     * @return Claims extraits
     * @throws JwtException si le token est invalide ou expiré
     */
    public Claims extraireClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Extrait l'email (subject) du token. */
    public String extraireEmail(String token) {
        return extraireClaims(token).getSubject();
    }

    /** Extrait l'ID utilisateur du token. */
    public Long extraireUserId(String token) {
        Object userId = extraireClaims(token).get(ImmoCamConstants.JWT_CLAIM_USER_ID);
        return userId instanceof Integer ? ((Integer) userId).longValue() : (Long) userId;
    }

    /**
     * Vérifie si un token est valide (signature correcte et non expiré).
     *
     * @param token Token JWT à valider
     * @return true si valide
     */
    public boolean estValide(String token) {
        try {
            Claims claims = extraireClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            log.debug("Token JWT invalide : {}", e.getMessage());
            return false;
        }
    }

    /** Vérifie que le token est un access token (pas un refresh token). */
    public boolean estAccessToken(String token) {
        try {
            String type = (String) extraireClaims(token).get(ImmoCamConstants.JWT_CLAIM_TYPE);
            return ImmoCamConstants.JWT_TYPE_ACCESS.equals(type);
        } catch (Exception e) {
            return false;
        }
    }
}
EOF
OK "JwtService.java généré"

# =============================================================================
# 2. UserDetailsServiceImpl
# =============================================================================
SECTION "2/9 — UserDetailsServiceImpl"

mkdir -p "$SEC/userdetails"

cat > "$SEC/userdetails/UserDetailsServiceImpl.java" << 'EOF'
package com.mbem.immocam.infrastructure.security.userdetails;

import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.StatutCompte;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implémentation de UserDetailsService pour Spring Security.
 *
 * Chargé par JwtAuthenticationFilter à chaque requête authentifiée.
 * Vérifie le statut du compte avant d'autoriser l'accès.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                    "Utilisateur non trouvé : " + email));

        // Vérifications du statut du compte
        if (StatutCompte.BANNI.equals(utilisateur.getStatut())) {
            throw new DisabledException("Compte banni définitivement");
        }
        if (StatutCompte.SUSPENDU.equals(utilisateur.getStatut())) {
            throw new DisabledException("Compte suspendu temporairement");
        }
        if (utilisateur.estBloque()) {
            throw new LockedException("Compte temporairement bloqué suite à des tentatives échouées");
        }

        String role = "ROLE_" + utilisateur.getRole().name();

        return User.builder()
                .username(utilisateur.getEmail())
                .password(utilisateur.getMotDePasseHash())
                .authorities(List.of(new SimpleGrantedAuthority(role)))
                .build();
    }
}
EOF
OK "UserDetailsServiceImpl.java généré"

# =============================================================================
# 3. JwtAuthenticationFilter
# =============================================================================
SECTION "3/9 — JwtAuthenticationFilter"

mkdir -p "$SEC/filter"

cat > "$SEC/filter/JwtAuthenticationFilter.java" << 'EOF'
package com.mbem.immocam.infrastructure.security.filter;

import com.mbem.immocam.infrastructure.security.jwt.JwtService;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre JWT exécuté une seule fois par requête (OncePerRequestFilter).
 *
 * Processus :
 *   1. Extraire le token du header Authorization: Bearer <token>
 *   2. Valider la signature et l'expiration
 *   3. Vérifier que c'est un access token (pas un refresh token)
 *   4. Charger l'utilisateur depuis la base
 *   5. Peupler le SecurityContext
 *
 * @author MBEMNOVA
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader(ImmoCamConstants.AUTHORIZATION_HEADER);

        if (authHeader == null || !authHeader.startsWith(ImmoCamConstants.BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(ImmoCamConstants.BEARER_PREFIX.length());

        try {
            if (jwtService.estValide(token)
                    && jwtService.estAccessToken(token)
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                String email = jwtService.extraireEmail(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            log.debug("Échec validation JWT pour {} : {}", request.getRequestURI(), e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
EOF
OK "JwtAuthenticationFilter.java généré"

# =============================================================================
# 4. RateLimitingFilter
# =============================================================================
SECTION "4/9 — RateLimitingFilter"

cat > "$SEC/filter/RateLimitingFilter.java" << 'EOF'
package com.mbem.immocam.infrastructure.security.filter;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Filtre de limitation de débit par adresse IP.
 *
 * Protège l'API contre :
 *   - Brute force sur /api/auth/login
 *   - Spam sur l'envoi de codes OTP
 *   - Scraping massif
 *
 * Configuration : immocam.security.rate-limit.requetes-par-minute (défaut 100)
 * Fenêtre de temps : 1 minute (reset automatique via Caffeine)
 *
 * @author MBEMNOVA
 */
@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    @Value("${immocam.security.rate-limit.requetes-par-minute:100}")
    private int requetesParMinute;

    // Cache IP -> compteur de requêtes, expire après 1 minute
    private final Cache<String, AtomicInteger> cache = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String ip = extraireIp(request);
        AtomicInteger compteur = cache.get(ip, k -> new AtomicInteger(0));

        if (compteur.incrementAndGet() > requetesParMinute) {
            log.warn("Rate limit dépassé pour l'IP : {}", ip);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Trop de requetes. Veuillez patienter un instant.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /** Extrait l'IP réelle en tenant compte des proxies (X-Forwarded-For). */
    private String extraireIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
EOF
OK "RateLimitingFilter.java généré"

# =============================================================================
# 5. SecurityConfig
# =============================================================================
SECTION "5/9 — SecurityConfig"

mkdir -p "$SEC/config"

cat > "$SEC/config/SecurityConfig.java" << 'EOF'
package com.mbem.immocam.infrastructure.security.config;

import com.mbem.immocam.infrastructure.security.filter.JwtAuthenticationFilter;
import com.mbem.immocam.infrastructure.security.filter.RateLimitingFilter;
import lombok.RequiredArgsConstructor;
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

import java.util.List;

/**
 * Configuration Spring Security d'ImmoCam.
 *
 * Règles d'accès (résumé du cahier des charges) :
 *
 * PUBLIC (visiteur non connecté) :
 *   GET  /annonces/**           — Liste et détail des annonces
 *   GET  /localisations/**      — Villes et quartiers (formulaires)
 *   GET  /types-biens/**        — Types de biens (formulaires)
 *   GET  /commentaires/**       — Lecture des commentaires
 *   POST /annonces/*/partager   — Partage sans connexion
 *   ALL  /auth/**               — Inscription, connexion, OTP
 *   GET  /uploads/**            — Photos stockées sur le VPS
 *
 * AUTHENTIFIÉ (utilisateur connecté) :
 *   POST /contacts/**           — Contact WhatsApp (connexion obligatoire)
 *   POST /commentaires/**       — Poster un commentaire
 *   POST /favoris/**            — Gérer les favoris
 *   POST /signalements/**       — Signaler une annonce
 *   POST /annonces             — Publier une annonce
 *   PUT/PATCH/DELETE /annonces/** — Gérer ses annonces
 *
 * ADMIN uniquement :
 *   ALL  /admin/**
 *
 * @author MBEMNOVA
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

                // ── PUBLIC — Visiteur non connecté ──────────────────────────
                .requestMatchers(HttpMethod.GET,  "/annonces/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/localisations/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/types-biens/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/commentaires/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/uploads/**").permitAll()
                .requestMatchers("/auth/**").permitAll()

                // ── Documentation (Swagger désactivé en prod) ────────────────
                .requestMatchers(
                    "/swagger-ui/**", "/v3/api-docs/**",
                    "/actuator/health", "/actuator/info"
                ).permitAll()

                // ── ADMIN uniquement ─────────────────────────────────────────
                .requestMatchers("/admin/**").hasRole("ADMINISTRATEUR")

                // ── Tout le reste : authentification requise ─────────────────
                .anyRequest().authenticated()
            )
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
EOF
OK "SecurityConfig.java généré"

# =============================================================================
# 6. SecurityUtils
# =============================================================================
SECTION "6/9 — SecurityUtils"

cat > "$SEC/config/SecurityUtils.java" << 'EOF'
package com.mbem.immocam.infrastructure.security.config;

import com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Utilitaires pour accéder à l'utilisateur courant depuis le SecurityContext.
 *
 * Usage dans les services :
 *   String email = SecurityUtils.getEmailUtilisateurCourant();
 *   boolean isAdmin = SecurityUtils.estAdmin();
 *
 * @author MBEMNOVA
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Retourne l'email de l'utilisateur actuellement authentifié.
     *
     * @return Email de l'utilisateur courant
     * @throws AccesRefuseException si aucun utilisateur n'est authentifié
     */
    public static String getEmailUtilisateurCourant() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccesRefuseException("Authentification requise");
        }
        if (auth.getPrincipal() instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        return auth.getName();
    }

    /**
     * Vérifie si l'utilisateur courant est administrateur.
     *
     * @return true si ROLE_ADMINISTRATEUR
     */
    public static boolean estAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMINISTRATEUR"));
    }

    /**
     * Vérifie si l'utilisateur est authentifié.
     *
     * @return true si authentifié
     */
    public static boolean estAuthentifie() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null
                && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal());
    }
}
EOF
OK "SecurityUtils.java généré"

# =============================================================================
# 7. Exceptions custom métier
# =============================================================================
SECTION "7/9 — Exceptions custom"

mkdir -p "$EXC/custom"

cat > "$EXC/custom/RessourceNotFoundException.java" << 'EOF'
package com.mbem.immocam.infrastructure.exception.custom;

/**
 * Ressource introuvable (404).
 * Ex : annonce inexistante, utilisateur non trouvé.
 *
 * @author MBEMNOVA
 */
public class RessourceNotFoundException extends RuntimeException {
    public RessourceNotFoundException(String message) {
        super(message);
    }
    public RessourceNotFoundException(String ressource, Long id) {
        super(ressource + " introuvable avec l'id : " + id);
    }
}
EOF

cat > "$EXC/custom/AccesRefuseException.java" << 'EOF'
package com.mbem.immocam.infrastructure.exception.custom;

/**
 * Accès non autorisé (403).
 * Ex : tentative de modifier l'annonce d'un autre propriétaire.
 *
 * @author MBEMNOVA
 */
public class AccesRefuseException extends RuntimeException {
    public AccesRefuseException(String message) {
        super(message);
    }
}
EOF

cat > "$EXC/custom/LimiteAtteintException.java" << 'EOF'
package com.mbem.immocam.infrastructure.exception.custom;

/**
 * Limite métier atteinte (403).
 * Ex : propriétaire a atteint sa limite de 5 annonces actives.
 *
 * @author MBEMNOVA
 */
public class LimiteAtteintException extends RuntimeException {
    public LimiteAtteintException(String message) {
        super(message);
    }
}
EOF

cat > "$EXC/custom/DoublonException.java" << 'EOF'
package com.mbem.immocam.infrastructure.exception.custom;

/**
 * Doublon détecté (409).
 * Ex : annonce similaire déjà publiée, email déjà utilisé.
 *
 * @author MBEMNOVA
 */
public class DoublonException extends RuntimeException {
    public DoublonException(String message) {
        super(message);
    }
}
EOF

cat > "$EXC/custom/CodeInvalideException.java" << 'EOF'
package com.mbem.immocam.infrastructure.exception.custom;

/**
 * Code OTP invalide, expiré ou déjà utilisé (400).
 *
 * @author MBEMNOVA
 */
public class CodeInvalideException extends RuntimeException {
    public CodeInvalideException(String message) {
        super(message);
    }
}
EOF

cat > "$EXC/custom/CompteBloqueException.java" << 'EOF'
package com.mbem.immocam.infrastructure.exception.custom;

/**
 * Compte temporairement bloqué suite à des tentatives échouées (403).
 * Blocage de 30 minutes après 5 tentatives incorrectes en 15 min.
 *
 * @author MBEMNOVA
 */
public class CompteBloqueException extends RuntimeException {
    public CompteBloqueException(String message) {
        super(message);
    }
}
EOF

OK "6 exceptions custom générées"

# =============================================================================
# 8. GlobalExceptionHandler
# =============================================================================
SECTION "8/9 — GlobalExceptionHandler"

mkdir -p "$EXC/handler"

cat > "$EXC/handler/GlobalExceptionHandler.java" << 'EOF'
package com.mbem.immocam.infrastructure.exception.handler;

import com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException;
import com.mbem.immocam.infrastructure.exception.custom.CodeInvalideException;
import com.mbem.immocam.infrastructure.exception.custom.CompteBloqueException;
import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.infrastructure.exception.custom.LimiteAtteintException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.shared.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.HashMap;
import java.util.Map;

/**
 * Gestionnaire global des exceptions.
 *
 * Toutes les exceptions remontées jusqu'à la couche controller sont
 * interceptées ici et transformées en réponses JSON structurées ApiResponse.
 *
 * Ne jamais exposer les stack traces en production (configuré dans application.yaml).
 *
 * @author MBEMNOVA
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── Exceptions métier ImmoCam ─────────────────────────────────────────

    @ExceptionHandler(RessourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleNotFound(RessourceNotFoundException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(AccesRefuseException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleAccesRefuse(AccesRefuseException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(LimiteAtteintException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleLimite(LimiteAtteintException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(DoublonException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<Void> handleDoublon(DoublonException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(CodeInvalideException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleCodeInvalide(CodeInvalideException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(CompteBloqueException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleCompteBloque(CompteBloqueException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    // ── Exceptions Spring Security ────────────────────────────────────────

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleBadCredentials(BadCredentialsException ex) {
        return ApiResponse.erreur("Email ou mot de passe incorrect.");
    }

    @ExceptionHandler(DisabledException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleDisabled(DisabledException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(LockedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleLocked(LockedException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleAccessDenied(AccessDeniedException ex) {
        return ApiResponse.erreur("Accès non autorisé.");
    }

    // ── Validation Bean Validation ────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> erreurs = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String champ = ((FieldError) error).getField();
            erreurs.put(champ, error.getDefaultMessage());
        });
        ApiResponse<Map<String, String>> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setMessage("Données invalides");
        response.setData(erreurs);
        return response;
    }

    // ── Upload photos ─────────────────────────────────────────────────────

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public ApiResponse<Void> handleMaxSize(MaxUploadSizeExceededException ex) {
        return ApiResponse.erreur("La photo dépasse la taille maximale autorisée (4 Mo).");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    // ── Erreur générique ──────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleGeneral(Exception ex) {
        log.error("Erreur inattendue", ex);
        return ApiResponse.erreur("Une erreur est survenue. Veuillez réessayer.");
    }
}
EOF
OK "GlobalExceptionHandler.java généré"

# =============================================================================
# 9. ImmocamApplicationTests.java
# =============================================================================
SECTION "9/9 — ImmocamApplicationTests.java"

mkdir -p "src/test/java/com/mbem/immocam"

cat > "src/test/java/com/mbem/immocam/ImmocamApplicationTests.java" << 'EOF'
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
EOF
OK "ImmocamApplicationTests.java généré"

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
JAVA_COUNT=$(find src/main/java -name "*.java" | wc -l)
TEST_COUNT=$(find src/test/java -name "*.java" | wc -l)
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SCRIPT 06 TERMINÉ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Fichiers Java main : $JAVA_COUNT"
INFO "Fichiers Java test : $TEST_COUNT"
INFO ""
INFO "Générés dans ce script :"
INFO "  infrastructure/security/jwt/JwtService.java"
INFO "  infrastructure/security/userdetails/UserDetailsServiceImpl.java"
INFO "  infrastructure/security/filter/JwtAuthenticationFilter.java"
INFO "  infrastructure/security/filter/RateLimitingFilter.java"
INFO "  infrastructure/security/config/SecurityConfig.java"
INFO "  infrastructure/security/config/SecurityUtils.java"
INFO "  infrastructure/exception/custom/  (6 exceptions)"
INFO "  infrastructure/exception/handler/GlobalExceptionHandler.java"
INFO "  ImmocamApplicationTests.java"
echo ""
WARN "Scripts restants : 07 (Infrastructure) → 08 (Auth) → 09 (Annonces)"
WARN "                   10 (Modules) → 11 (Admin) → 12 (Tests & Deploy)"
echo ""
INFO "Prochaine étape : bash setup_07_infrastructure.sh"