package com.mbem.immocam.module.favori.service;

import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.infrastructure.storage.service.StorageService;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.favori.dto.response.FavoriResponse;
import com.mbem.immocam.module.favori.entity.Favori;
import com.mbem.immocam.module.favori.repository.FavoriRepository;
import com.mbem.immocam.module.photo.repository.PhotoRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.pagination.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implémentation du service favoris.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
public class FavoriServiceImpl implements FavoriService {

    private final FavoriRepository favoriRepository;
    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PhotoRepository photoRepository;
    private final StorageService        storageService;  // ← ajouter

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FavoriResponse> mesFavoris(Long utilisateurId, Pageable pageable) {
        Page<Favori> page = favoriRepository
            .findByUtilisateurIdOrderByDateCreationDesc(utilisateurId, pageable);

        Page<FavoriResponse> dtoPage = page.map(f -> {
            Annonce a = f.getAnnonce();
            FavoriResponse dto = FavoriResponse.builder()
                    .favoriId(f.getId())
                    .annonceId(a.getId())
                    .typeBien(a.getTypeBien().getLibelle())
                    .ville(a.getLocalisation().getVille())
                    .quartier(a.getQuartier())
                    .prix(a.getPrix())
                    .statutAnnonce(a.getStatutEffectif().name())
                    .dateAjout(f.getDateCreation())
                    .build();

            photoRepository.findFirstByAnnonceIdAndPrincipaleTrue(a.getId())
                    .ifPresent(p -> dto.setPhotoUrl(
                        storageService.construireUrl(p.getCheminStockage())  // ← URL complète
                    ));

            return dto;
        });

        return PageResponse.from(dtoPage);
    }
    @Override
    @Transactional
    public FavoriResponse ajouter(Long utilisateurId, Long annonceId) {
        if (favoriRepository.existsByUtilisateurIdAndAnnonceId(utilisateurId, annonceId)) {
            throw new DoublonException("Cette annonce est déjà dans vos favoris.");
        }
        Utilisateur u = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", utilisateurId));
        Annonce a = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));

        Favori favori = Favori.builder().utilisateur(u).annonce(a).build();
        favoriRepository.save(favori);

        return FavoriResponse.builder()
                .favoriId(favori.getId())
                .annonceId(annonceId)
                .typeBien(a.getTypeBien().getLibelle())
                .ville(a.getLocalisation().getVille())
                .quartier(a.getQuartier())
                .statutAnnonce(a.getStatutEffectif().name())
                .build();
    }

    @Override
    @Transactional
    public void retirer(Long utilisateurId, Long annonceId) {
        favoriRepository.deleteByUtilisateurIdAndAnnonceId(utilisateurId, annonceId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean estEnFavori(Long utilisateurId, Long annonceId) {
        return favoriRepository.existsByUtilisateurIdAndAnnonceId(utilisateurId, annonceId);
    }
}
