package com.mbem.immocam.module.annonce.entity;

import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Photo d'une annonce immobiliere.
 *
 * Stockage : local VPS dans uploads/annonces/YYYY/MM/
 * Compression : Thumbnailator, JPEG 80%, max 1280px
 * Limite : 0 minimum (annonce sans photo autorisee) — 4 maximum
 * Formats acceptes : JPG, PNG, WebP — Taille max : 4 Mo
 *
 * La photo avec ordre = 1 est la photo principale du carrousel.
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "photos")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Photo extends BaseEntity {

    /**
     * Chemin relatif depuis le dossier uploads/.
     * Exemple : "annonces/2026/04/uuid_12345.jpg"
     * JAMAIS expose dans l'API — utilise url/urlThumb.
     */
    @Column(name = "chemin_stockage", nullable = false, length = 500)
    private String cheminStockage;

    /** URL publique de la photo originale. Construite a partir de storage.local.base-url. */
    @Column(name = "url", length = 500)
    private String url;

    /** URL publique du thumbnail. Construite a partir de storage.local.base-url. */
    @Column(name = "url_thumb", length = 500)
    private String urlThumb;

    @Column(name = "nom_original", length = 255)
    private String nomOriginal;

    /** Ordre dans le carrousel. ordre = 1 => photo principale. */
    @Column(nullable = false)
    private int ordre;

    @Column(name = "est_principale", nullable = false)
    @Builder.Default
    private boolean principale = false;

    /** Taille en octets apres compression Thumbnailator. */
    @Column(name = "taille_octets")
    private long tailleOctets;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annonce_id", nullable = false)
    private Annonce annonce;
}
