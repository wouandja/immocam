package com.mbem.immocam.infrastructure.security.filter;

import com.mbem.immocam.infrastructure.security.jwt.JwtService;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

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

                Claims claims = jwtService.extraireClaims(token);
                String email  = claims.getSubject();

                // Lire le rôle depuis le JWT
                String rawRole = (String) claims.get(ImmoCamConstants.JWT_CLAIM_ROLE);

                // Normalise : retire ROLE_ si présent
                // Compatibilité anciens tokens + nouveaux tokens sans préfixe
                String role = (rawRole != null && rawRole.startsWith("ROLE_"))
                        ? rawRole.substring(5)
                        : rawRole;

                List<SimpleGrantedAuthority> authorities = (role != null)
                        ? List.of(new SimpleGrantedAuthority(role))
                        : List.of();

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                email, null, authorities);
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.debug("JWT valide — email: {}, role: {}", email, role);
            }

        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.debug("Token expire pour {} : {}", request.getRequestURI(), e.getMessage());
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Token expire. Veuillez vous reconnecter.");
            return;

        } catch (Exception e) {
            log.debug("Echec validation JWT pour {} : {}", request.getRequestURI(), e.getMessage());
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Token invalide.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
                "{\"success\":false,\"message\":\"" + message + "\"}"
        );
    }
}