package com.mbem.immocam.infrastructure.storage.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Service de stockage des photos d'annonces sur le VPS local.
 *
 * Architecture :
 *   - Stockage : uploads/annonces/YYYY/MM/uuid_annonceId.jpg
 *   - Compression : Thumbnailator — JPEG 80%, max 1280px
 *   - Formats acceptés : JPG, PNG, WebP
 *   - Taille max : 4 Mo par photo (configurable admin)
 *   - 0 photo minimum (annonce sans photo autorisée)
 *   - 4 photos maximum par annonce (configurable admin)
 *
 * Le numéro WhatsApp du propriétaire n'est jamais stocké dans les chemins.
 *
 * @author MBEMNOVA
 */
public interface StorageService {

    /**
     * Stocke, compresse et retourne le chemin relatif de la photo.
     *
     * @param fichier   Fichier uploadé par l'utilisateur
     * @param annonceId ID de l'annonce (inclus dans le nom du fichier)
     * @return Chemin relatif depuis uploads/ (ex: "annonces/2026/04/uuid_12.jpg")
     */
    String stocker(MultipartFile fichier, Long annonceId);

    /**
     * Supprime un fichier du disque VPS.
     *
     * @param cheminStockage Chemin relatif depuis uploads/
     */
    void supprimer(String cheminStockage);

    /**
     * Construit l'URL publique depuis le chemin de stockage.
     *
     * @param cheminStockage Chemin relatif
     * @return URL complète (ex: "https://immocam.cm/uploads/annonces/2026/04/uuid.jpg")
     */
    String construireUrl(String cheminStockage);

    /**
     * Valide le format et la taille avant traitement.
     *
     * @param fichier Fichier à valider
     * @throws IllegalArgumentException si format invalide ou taille dépassée
     */
    void valider(MultipartFile fichier);
}
