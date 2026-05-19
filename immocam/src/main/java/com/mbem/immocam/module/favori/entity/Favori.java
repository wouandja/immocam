package com.mbem.immocam.module.favori.entity;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Annonce mise en favori par un utilisateur.
 *
 * La liste des favoris affiche le statut actuel de chaque annonce :
 *   ACTIVE          : affichage normal
 *   EN_PAUSE        : badge "Temporairement indisponible"
 *   EXPIREE         : badge "Cette annonce a expire"
 *   SUPPRIMEE/autre : "Cette annonce n'est plus disponible" + bouton Supprimer
 *
 * @author MBEMNOVA
 */
@Entity
@Table(
    name = "favoris",
    uniqueConstraints = @UniqueConstraint(columnNames = {"utilisateur_id", "annonce_id"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Favori extends BaseEntity {

    @Column(name = "date_ajout")
    private java.time.LocalDateTime dateAjout;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annonce_id", nullable = false)
    private Annonce annonce;
}
