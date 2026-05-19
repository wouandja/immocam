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
