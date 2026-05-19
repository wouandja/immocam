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
