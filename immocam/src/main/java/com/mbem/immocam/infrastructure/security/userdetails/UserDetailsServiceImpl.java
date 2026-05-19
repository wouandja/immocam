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

@Service
@RequiredArgsConstructor
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Utilisateur non trouve : " + email));

        if (StatutCompte.BANNI.equals(utilisateur.getStatut())) {
            throw new DisabledException("Compte banni definitivement");
        }
        if (StatutCompte.SUSPENDU.equals(utilisateur.getStatut())) {
            throw new DisabledException("Compte suspendu temporairement");
        }
        if (utilisateur.estBloque()) {
            throw new LockedException("Compte temporairement bloque");
        }

        // Sans préfixe ROLE_ — cohérent avec le filter JWT et hasAuthority()
        String role = utilisateur.getRole().name(); // "ADMINISTRATEUR" ou "UTILISATEUR"

        return User.builder()
                .username(utilisateur.getEmail())
                .password(utilisateur.getMotDePasseHash())
                .authorities(List.of(new SimpleGrantedAuthority(role)))
                .build();
    }
}