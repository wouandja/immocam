package com.mbem.immocam.infrastructure.storage.service;

import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class StorageServiceImpl implements StorageService {

    private static final List<String> FORMATS_ACCEPTES = List.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long TAILLE_MAX_BYTES = 4L * 1024 * 1024; // 4 Mo

    @Value("${immocam.storage.upload-dir:./uploads/annonces}")
    private String uploadDir;

    @Value("${immocam.storage.base-url:http://localhost:1010/api/uploads/}")
    private String baseUrl;

    @Value("${immocam.storage.compression.qualite:0.80}")
    private double qualite;

    @Value("${immocam.storage.compression.largeur-max:1280}")
    private int largeurMax;

    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public String stocker(MultipartFile fichier, Long annonceId) {
        valider(fichier);

        String sousRep = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String nomFichier = UUID.randomUUID() + "_" + annonceId + ".jpg";

        // Chemin RELATIF stocké en base : "annonces/2026/05/uuid_22.jpg"
        String cheminRelatif = "annonces/" + sousRep + "/" + nomFichier;

        // Chemin ABSOLU sur le disque : "<uploadDir>/2026/05/uuid_22.jpg"
        // uploadDir = "./uploads/annonces" → le "annonces/" est déjà dans uploadDir
        Path destination = Paths.get(uploadDir, sousRep, nomFichier).toAbsolutePath();

        try {
            // Créer les dossiers parents si nécessaire
            Files.createDirectories(destination.getParent());

            // Compression + conversion JPEG via Thumbnailator
            try (InputStream in = fichier.getInputStream()) {
                Thumbnails.of(in)
                        .size(largeurMax, largeurMax)   // max 1280×1280, ratio conservé
                        .keepAspectRatio(true)
                        .outputFormat("jpg")
                        .outputQuality(qualite)
                        .toFile(destination.toFile());
            }

            log.info("Photo stockée : {}", destination);
            return cheminRelatif;

        } catch (IOException e) {
            log.error("Erreur lors du stockage de la photo pour annonce {} : {}", annonceId, e.getMessage());
            throw new RuntimeException("Impossible de stocker la photo. Veuillez réessayer.", e);
        }
    }

    @Override
    public void supprimer(String cheminStockage) {
        if (cheminStockage == null || cheminStockage.isBlank()) return;

        // cheminStockage = "annonces/2026/05/uuid.jpg"
        // On retire le préfixe "annonces/" car uploadDir le contient déjà
        String cheminSansPrefix = cheminStockage.startsWith("annonces/")
                ? cheminStockage.substring("annonces/".length())
                : cheminStockage;

        Path fichier = Paths.get(uploadDir, cheminSansPrefix).toAbsolutePath();

        try {
            boolean supprime = Files.deleteIfExists(fichier);
            if (supprime) {
                log.info("Photo supprimée : {}", fichier);
            } else {
                log.warn("Photo introuvable sur le disque : {}", fichier);
            }
        } catch (IOException e) {
            log.error("Erreur lors de la suppression : {}", e.getMessage());
            throw new RuntimeException("Impossible de supprimer la photo.", e);
        }
    }

    @Override
    public String construireUrl(String cheminStockage) {
        if (cheminStockage == null) return null;
        if (cheminStockage.startsWith("http")) return cheminStockage;
        String base = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
        // "http://localhost:1010/api/uploads/" + "annonces/2026/05/uuid.jpg"
        return base + cheminStockage;
    }

    @Override
    public void valider(MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est vide ou absent.");
        }
        if (fichier.getSize() > TAILLE_MAX_BYTES) {
            throw new IllegalArgumentException(
                    "Taille max dépassée : " + (fichier.getSize() / 1024 / 1024) + " Mo (max 4 Mo).");
        }
        String contentType = fichier.getContentType();
        if (contentType == null || !FORMATS_ACCEPTES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "Format non accepté : " + contentType + ". Formats valides : JPG, PNG, WebP.");
        }
    }
}