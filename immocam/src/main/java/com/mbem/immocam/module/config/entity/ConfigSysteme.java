package com.mbem.immocam.module.config.entity;

import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
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
 * Parametres configurables par l'admin sans toucher au code ni redeployer.
 *
 * Cles disponibles (ImmoCamConstants.CONFIG_*) :
 *   DUREE_VIE_ANNONCE_JOURS  -> 30 jours (defaut)
 *   DELAI_RAPPEL_JOURS       -> 5 jours (J-5)
 *   DELAI_SUPPRESSION_JOURS  -> 7 jours apres expiration (J+7)
 *   MAX_PHOTOS_PAR_ANNONCE   -> 4 photos (defaut)
 *   MAX_TAILLE_PHOTO_MO      -> 4 Mo (defaut)
 *   MAX_ANNONCES_PAR_PROPRIO -> 5 annonces actives (defaut)
 *   MSG_WHATSAPP             -> Template message pre-rempli
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "config_systeme")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfigSysteme extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String cle;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String valeur;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Admin qui a effectue la derniere modification. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modifie_par_id")
    private Utilisateur modifiePar;
}
