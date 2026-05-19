package com.mbem.immocam.module.photo.service;

import com.mbem.immocam.module.annonce.dto.response.PhotoResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service de gestion des photos d'annonces.
 *
 * @author MBEMNOVA
 */
public interface PhotoService {

    /**
     * Upload et compression d'une photo pour une annonce.
     * Maximum 4 photos par annonce (configurable admin).
     *
     * @param annonceId ID de l'annonce
     * @param fichier   Fichier à uploader
     * @param proprietaireId ID du propriétaire (vérification autorisation)
     * @return DTO de la photo créée
     */
    PhotoResponse uploadPhoto(Long annonceId, MultipartFile fichier, Long proprietaireId);

    /**
     * Supprime une photo d'une annonce (disque + base de données).
     *
     * @param annonceId      ID de l'annonce
     * @param photoId        ID de la photo à supprimer
     * @param proprietaireId ID du propriétaire
     */
    void supprimerPhoto(Long annonceId, Long photoId, Long proprietaireId);
}
