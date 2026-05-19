package com.mbem.immocam.infrastructure.security.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static String getEmailUtilisateurCourant() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccesRefuseException("Authentification requise");
        }
        // Principal est maintenant un String (email) depuis le nouveau filter
        return auth.getName();
    }

    public static boolean estAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ADMINISTRATEUR")); // ← sans ROLE_
    }

    public static boolean estAuthentifie() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null
                && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal());
    }
}