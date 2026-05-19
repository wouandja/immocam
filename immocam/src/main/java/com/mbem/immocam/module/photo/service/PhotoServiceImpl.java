package com.mbem.immocam.module.photo.service;

import com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException;
import com.mbem.immocam.infrastructure.exception.custom.LimiteAtteintException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.infrastructure.storage.service.StorageService;
import com.mbem.immocam.module.annonce.dto.response.PhotoResponse;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.entity.Photo;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.config.repository.ConfigSystemeRepository;
import com.mbem.immocam.module.photo.repository.PhotoRepository;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Implémentation du service photos.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoServiceImpl implements PhotoService {

    private final AnnonceRepository annonceRepository;
    private final PhotoRepository photoRepository;
    private final ConfigSystemeRepository configRepository;
    private final StorageService storageService;

    @Override
    @Transactional
    public PhotoResponse uploadPhoto(Long annonceId, MultipartFile fichier, Long proprietaireId) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));

        if (!annonce.getProprietaire().getId().equals(proprietaireId)) {
            throw new AccesRefuseException("Vous n'êtes pas autorisé à modifier cette annonce.");
        }

        // Vérifier la limite de photos
        int maxPhotos = Integer.parseInt(
            configRepository.findByCle(ImmoCamConstants.CONFIG_MAX_PHOTOS)
                .map(c -> c.getValeur()).orElse("4"));
        long nbPhotos = photoRepository.countByAnnonceId(annonceId);
        if (nbPhotos >= maxPhotos) {
            throw new LimiteAtteintException(
                "Cette annonce a déjà " + maxPhotos + " photos (maximum autorisé).");
        }

        // Stocker et compresser la photo
        String cheminStockage = storageService.stocker(fichier, annonceId);

        int prochainOrdre = photoRepository.findMaxOrdreByAnnonceId(annonceId) + 1;
        boolean estPremiere = (nbPhotos == 0);

        Photo photo = Photo.builder()
                .cheminStockage(cheminStockage)
                .nomOriginal(fichier.getOriginalFilename())
                .ordre(prochainOrdre)
                .principale(estPremiere)
                .tailleOctets(fichier.getSize())
                .annonce(annonce)
                .build();

        photoRepository.save(photo);
        log.info("Photo uploadée pour annonce {} : {}", annonceId, cheminStockage);

        return PhotoResponse.builder()
                .id(photo.getId())
                .url(storageService.construireUrl(cheminStockage))
                .ordre(photo.getOrdre())
                .principale(photo.isPrincipale())
                .build();
    }

    @Override
    @Transactional
    public void supprimerPhoto(Long annonceId, Long photoId, Long proprietaireId) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));

        if (!annonce.getProprietaire().getId().equals(proprietaireId)) {
            throw new AccesRefuseException("Vous n'êtes pas autorisé à modifier cette annonce.");
        }

        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new RessourceNotFoundException("Photo", photoId));

        storageService.supprimer(photo.getCheminStockage());
        photoRepository.delete(photo);

        // Si on supprime la photo principale, promouvoir la suivante
        if (photo.isPrincipale()) {
            photoRepository.findByAnnonceIdOrderByOrdreAsc(annonceId).stream()
                    .findFirst()
                    .ifPresent(p -> { p.setPrincipale(true); photoRepository.save(p); });
        }
        log.info("Photo {} supprimée de l'annonce {}", photoId, annonceId);
    }
}
