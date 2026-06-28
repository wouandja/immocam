package com.mbem.immocam.module.localisation.entity;

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
 * Référentiel des quartiers par ville — indépendant des annonces.
 *
 * Permet à l'admin de pré-charger des quartiers avant toute annonce, et
 * sert de source d'autocomplétion lors de la publication d'une annonce.
 * Le champ {@code Annonce.quartier} reste une chaîne libre pour des
 * raisons de compatibilité, mais est systématiquement synchronisé avec
 * ce référentiel (voir QuartierService.assurerExistance).
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "quartiers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quartier extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "localisation_id", nullable = false)
    private Localisation localisation;

    @Column(nullable = false, length = 100)
    private String nom;
}
