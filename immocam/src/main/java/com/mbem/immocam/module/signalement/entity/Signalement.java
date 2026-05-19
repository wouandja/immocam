package com.mbem.immocam.module.signalement.entity;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.entity.BaseEntity;
import com.mbem.immocam.shared.enums.StatutSignalement;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Signalement d'une annonce par un utilisateur connecte.
 *
 * Regles :
 *   - Connexion obligatoire pour signaler
 *   - Le motif est obligatoire
 *   - Si motif = AUTRE : champ texte libre obligatoire
 *
 * Traitement admin (4 decisions) :
 *   IGNORE      -> Annonce reste active
 *   SUPPRESSION -> Annonce supprimee + proprietaire notifie
 *   SUSPENSION  -> Compte proprietaire suspendu
 *   BANNISSEMENT -> Via action separee sur le compte
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "signalements")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Signalement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annonce_id", nullable = false)
    private Annonce annonce;

    @Column(nullable = false, length = 100)
    private String motif;

    /** Obligatoire si motif = AUTRE. Optionnel sinon pour precisions. */
    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatutSignalement statut = StatutSignalement.EN_ATTENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par_id")
    private Utilisateur traiteParAdmin;

    @Column(name = "date_traitement")
    private LocalDateTime dateTraitement;

    @Column(name = "date_signalement")
    private LocalDateTime dateSignalement;

    @Column(name = "administrateur_note", columnDefinition = "TEXT")
    private String administrateurNote;
}
