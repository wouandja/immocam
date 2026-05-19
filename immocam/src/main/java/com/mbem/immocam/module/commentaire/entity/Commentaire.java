package com.mbem.immocam.module.commentaire.entity;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Commentaire poste sur une annonce immobiliere.
 *
 * Regles :
 *   - Connexion obligatoire pour commenter
 *   - Visiteurs non connectes : lecture seule
 *   - Publication immediate sans moderation
 *   - Non modifiable apres publication (seulement supprimable)
 *   - Un seul niveau de reponse (reponse du proprietaire)
 *
 * Affichage :
 *   - Tries du plus ancien au plus recent (chronologique)
 *   - Prenom de l'auteur visible, telephone et email JAMAIS affiches
 *
 * Suppression (soft delete) :
 *   - Contenu remplace par "[Commentaire supprime]"
 *   - Auteur, proprietaire de l'annonce et admin peuvent supprimer
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "commentaires")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Commentaire extends BaseEntity {

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annonce_id", nullable = false)
    private Annonce annonce;

    /**
     * Commentaire parent pour les reponses du proprietaire.
     * Un seul niveau — pas de fils imbriques.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commentaire_parent_id")
    private Commentaire reponse;

    @OneToMany(mappedBy = "reponse")
    @Builder.Default
    private List<Commentaire> reponses = new ArrayList<>();

    @Column(name = "est_supprime", nullable = false)
    @Builder.Default
    private boolean estSupprime = false;

    @Column(name = "supprime_par_admin", nullable = false)
    @Builder.Default
    private boolean supprimeParAdmin = false;

    @Column(name = "motif_suppression_admin")
    private String motifSuppressionAdmin;
}
