package com.mbem.immocam.module.annonce.entity;

import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.typebien.entity.TypeBien;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.entity.BaseEntity;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entite centrale metier d'ImmoCam.
 *
 * Publication directe : statut ACTIVE immediatement a la soumission.
 * Pas de file d'attente de moderation.
 *
 * Cycle de vie automatique gere par AnnonceExpirationScheduler (cron 3h00) :
 * J-5 : rappel email au proprietaire
 * J-1 : rappel email final
 * J0 : statut EXPIREE (invisible du public)
 * J+7 : statut SUPPRIMEE_SYSTEME (suppression definitive)
 *
 * Securite WhatsApp : le numero n'est jamais expose dans l'API.
 * Utilise uniquement pour generer le lien wa.me cote service.
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "annonces")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Annonce extends BaseEntity {

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    /** Prix en FCFA — minimum 1 000 FCFA. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal prix;

    /**
     * Numero WhatsApp du proprietaire.
     * JAMAIS expose en clair dans l'API — utilise uniquement pour generer wa.me.
     */
    @Column(name = "numero_whatsapp", nullable = false, length = 20)
    private String numeroWhatsApp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    @Builder.Default
    private StatutAnnonce statut = StatutAnnonce.ACTIVE;

    @Column(name = "nombre_vues", nullable = false)
    @Builder.Default
    private int nombreVues = 0;

    // ── Relations ─────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proprietaire_id", nullable = false)
    private Utilisateur proprietaire;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "type_bien_id", nullable = false)
    private TypeBien typeBien;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "localisation_id", nullable = false)
    private Localisation localisation;

    @Column(length = 100, nullable = false, columnDefinition = "varchar(100) default 'Non spécifié'")
    @Builder.Default
    private String quartier = "Non spécifié";

    @OneToMany(mappedBy = "annonce", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<Photo> photos = new ArrayList<>();

    @OneToMany(mappedBy = "annonce", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<com.mbem.immocam.module.commentaire.entity.Commentaire> commentaires = new ArrayList<>();

    @OneToMany(mappedBy = "annonce", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<com.mbem.immocam.module.favori.entity.Favori> favoris = new ArrayList<>();

    @OneToMany(mappedBy = "annonce", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<com.mbem.immocam.module.contact.entity.ContactWhatsApp> contacts = new ArrayList<>();

    @OneToMany(mappedBy = "annonce", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<com.mbem.immocam.module.signalement.entity.Signalement> signalements = new ArrayList<>();

    // ── Cycle de vie ──────────────────────────────────────────────────────

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Column(name = "date_publication")
    private LocalDateTime datePublication;

    @Column(name = "ip_derniere_publication", length = 45)
    private String ipDernierePublication;

    @Column(name = "rappel_j5_envoye", nullable = false)
    @Builder.Default
    private boolean rappelJ5Envoye = false;

    @Column(name = "rappel_j1_envoye", nullable = false)
    @Builder.Default
    private boolean rappelJ1Envoye = false;

    // ── Suppression admin ─────────────────────────────────────────────────

    @Column(name = "motif_suppression")
    private String motifSuppression;

    @Column(name = "supprime_par_id")
    private Long supprimeParId;

    @Column(name = "date_suppression")
    private LocalDateTime dateSuppression;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean deleted = false;

    // ── Methodes utilitaires ──────────────────────────────────────────────

    /** Incremente le compteur de vues a chaque consultation du detail. */
    public void incrementerVues() {
        this.nombreVues++;
    }

    /** Verifie si l'annonce est expiree. */
    public boolean estExpiree() {
        return dateExpiration != null && LocalDateTime.now().isAfter(dateExpiration);
    }

    /** Verifie si l'annonce est visible publiquement (active, non supprimee, non expiree). */
    public boolean estVisible() {
        return StatutAnnonce.ACTIVE.equals(this.statut) && !this.deleted && !estExpiree();
    }

    /**
     * Statut "réel" tel qu'il doit être affiché, sans attendre le passage du
     * scheduler de minuit : une annonce ACTIVE dont la date d'expiration est
     * dépassée est affichée comme EXPIREE (le statut persisté en base, lui,
     * n'est corrigé qu'au prochain passage du scheduler).
     */
    public StatutAnnonce getStatutEffectif() {
        if (StatutAnnonce.ACTIVE.equals(this.statut) && estExpiree()) {
            return StatutAnnonce.EXPIREE;
        }
        return this.statut;
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime maintenant = LocalDateTime.now();
        if (this.statut == null) {
            this.statut = StatutAnnonce.ACTIVE;
        }
        if (this.dateExpiration == null) {
            this.dateExpiration = maintenant.plusDays(30);
        }
        if (this.datePublication == null) {
            this.datePublication = maintenant;
        }
    }
}
