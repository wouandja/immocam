package com.mbem.immocam.module.utilisateur.service;

import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.utilisateur.dto.request.ModifierMotDePasseRequest;
import com.mbem.immocam.module.utilisateur.dto.request.UpdateProfilRequest;
import com.mbem.immocam.module.utilisateur.dto.response.ProfilResponse;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.enums.StatutCompte;
import com.mbem.immocam.shared.utils.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation du service utilisateur.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UtilisateurServiceImpl implements UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final AnnonceRepository annonceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public ProfilResponse obtenirProfil(Long utilisateurId) {
        Utilisateur u = obtenirOuErreur(utilisateurId);
        long nbActives = annonceRepository
            .countByProprietaireIdAndStatutAndDeletedFalse(utilisateurId, StatutAnnonce.ACTIVE);
        return ProfilResponse.builder()
                .id(u.getId())
                .prenom(u.getPrenom())
                .nom(u.getNom())
                .email(u.getEmail())
                .telephoneMasque(PhoneUtils.masquer(u.getTelephone()))
                 .telephone(u.getTelephone())  
                .ville(u.getVille())
                .role(u.getRole().name())
                .statut(u.getStatut().name())
                .dateInscription(u.getDateCreation())
                .dernierLogin(u.getDernierLogin())
                .nombreAnnoncesActives(nbActives)
                .build();
    }

    @Override
    @Transactional
    public ProfilResponse mettreAJourProfil(Long utilisateurId, UpdateProfilRequest request) {
        Utilisateur u = obtenirOuErreur(utilisateurId);
        if (request.getPrenom()    != null) u.setPrenom(request.getPrenom().trim());
        if (request.getNom()       != null) u.setNom(request.getNom().trim());
        if (request.getVille()     != null) u.setVille(request.getVille());
        if (request.getTelephone() != null)
            u.setTelephone(PhoneUtils.normaliser(request.getTelephone()));
        return obtenirProfil(utilisateurId);
    }

    @Override
    @Transactional
    public void supprimerCompte(Long utilisateurId) {
        Utilisateur u = obtenirOuErreur(utilisateurId);
        // Désactiver toutes les annonces actives immédiatement
        List<Annonce> annonces = annonceRepository
            .findByProprietaireIdAndDeletedFalse(utilisateurId, Pageable.unpaged())
            .getContent();
        annonces.forEach(a -> {
            a.setStatut(StatutAnnonce.SUPPRIMEE);
            a.setDeleted(true);
        });
        // Marquer le compte comme banni (les commentaires restent avec "Utilisateur supprimé")
        u.setStatut(StatutCompte.BANNI);
        u.setEmail("deleted_" + utilisateurId + "@immocam.deleted");
        u.setPrenom("Utilisateur");
        u.setNom("supprime");
        u.setTelephone("+237000000000");
        log.info("Compte {} anonymisé et supprimé", utilisateurId);
    }

    private Utilisateur obtenirOuErreur(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", id));
    }






    // Ajouter les injections manquantes dans la classe


// Ajouter la méthode
@Override
@Transactional
public void modifierMotDePasse(Long utilisateurId, ModifierMotDePasseRequest request) {
    if (!request.getNouveauMotDePasse().equals(request.getConfirmationMotDePasse())) {
        throw new IllegalArgumentException("Les mots de passe ne correspondent pas.");
    }

    Utilisateur u = obtenirOuErreur(utilisateurId);

    if (!passwordEncoder.matches(request.getAncienMotDePasse(), u.getMotDePasseHash())) {
        throw new IllegalArgumentException("Mot de passe actuel incorrect.");
    }

    u.setMotDePasseHash(passwordEncoder.encode(request.getNouveauMotDePasse()));
    log.info("Mot de passe modifié pour l'utilisateur {}", utilisateurId);
}
    
}
