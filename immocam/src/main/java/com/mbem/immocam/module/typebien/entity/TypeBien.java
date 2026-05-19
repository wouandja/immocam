package com.mbem.immocam.module.typebien.entity;

import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Type de bien immobilier.
 *
 * 8 types initiaux charges via migration Flyway V2 :
 * Chambre, Studio, Appartement, Bureau, Magasin, Maison, Boutique, Espace
 *
 * L'admin peut ajouter, modifier ou desactiver des types.
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "types_biens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypeBien extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String libelle;

    @Column(name = "est_actif", nullable = false)
    @Builder.Default
    private boolean estActif = true;
}
