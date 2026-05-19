package com.mbem.immocam.module.localisation.entity;

import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Localisation geographique — couple ville/quartier.
 *
 * Les 20 villes camerounaises sont pre-chargees via la migration Flyway V3.
 * L'admin peut ajouter, modifier ou desactiver des villes depuis son interface.
 * Les quartiers sont charges dynamiquement selon la ville selectionnee.
 *
 * 20 villes initiales :
 * Yaounde, Douala, Maroua, Garoua, Ngaoundere, Bertoua, Mbalmayo, Bafia,
 * Nkongsamba, Edea, Bafoussam, Dschang, Foumban, Bamenda, Buea, Kumba,
 * Limbe, Ebolowa, Kribi, Sangmelima
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "localisations", uniqueConstraints = @UniqueConstraint(columnNames = { "ville" }))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Localisation extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String ville;

    @Column(name = "est_active", nullable = false)
    @Builder.Default
    private boolean estActive = true;

    /** true = pre-chargee via migration Flyway. */
    @Column(name = "est_pre_chargee", nullable = false)
    @Builder.Default
    private boolean estPreChargee = false;
}
