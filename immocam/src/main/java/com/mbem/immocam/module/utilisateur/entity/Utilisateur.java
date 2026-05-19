package com.mbem.immocam.module.utilisateur.entity;

import com.mbem.immocam.shared.entity.BaseEntity;
import com.mbem.immocam.shared.enums.RoleUtilisateur;
import com.mbem.immocam.shared.enums.StatutCompte;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entite centrale du systeme ImmoCam.
 *
 * Un seul compte pour tout : locataire, proprietaire, admin.
 * Un utilisateur devient proprietaire des sa premiere publication.
 *
 * Securite connexion :
 *   - Apres 5 tentatives echouees en 15 min -> compte bloque 30 min
 *   - Email valide par OTP 6 chiffres valable 10 min
 *
 * Politique de confidentialite :
 *   - Obligatoirement acceptee a l'inscription (bouton desactive sinon)
 *   - Date d'acceptation enregistree pour audit
 *
 * @author MBEMNOVA
 */
@Entity
@Table(
    name = "utilisateurs",
    uniqueConstraints = @UniqueConstraint(columnNames = "email")
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Utilisateur extends BaseEntity {

    @Column(nullable = false, length = 50)
    private String prenom;

    @Column(nullable = false, length = 50)
    private String nom;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /** Stocke au format normalise +237XXXXXXXXX */
    @Column(nullable = false, length = 20)
    private String telephone;

    /** Hash BCrypt — jamais expose dans les reponses API. */
    @Column(name = "mot_de_passe_hash", nullable = false)
    private String motDePasseHash;

    @Column(nullable = false, length = 100)
    private String ville;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RoleUtilisateur role = RoleUtilisateur.UTILISATEUR;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutCompte statut = StatutCompte.NON_VERIFIE;

    // ── Politique de confidentialite ──────────────────────────────────────
    @Column(name = "politique_acceptee", nullable = false)
    @Builder.Default
    private boolean politiqueAcceptee = false;

    @Column(name = "date_acceptation_politique")
    private LocalDateTime dateAcceptationPolitique;

    // ── Securite — gestion des tentatives de connexion ─────────────────────
    @Column(name = "tentatives_connexion_echouees", nullable = false)
    @Builder.Default
    private int tentativesConnexionEchouees = 0;

    /** Date jusqu'a laquelle le compte est bloque (null = non bloque). */
    @Column(name = "compte_bloque_jusqu_a")
    private LocalDateTime compteBloqueJusqua;

    // ── Suspension admin ──────────────────────────────────────────────────
    @Column(name = "motif_suspension")
    private String motifSuspension;

    @Column(name = "date_suspension")
    private LocalDateTime dateSuspension;

    // ── Activite ──────────────────────────────────────────────────────────
    @Column(name = "dernier_login")
    private LocalDateTime dernierLogin;

    // ── Methodes utilitaires ──────────────────────────────────────────────

    /**
     * Verifie si le compte est actuellement bloque par le mecanisme
     * anti-brute-force (5 tentatives echouees -> 30 min de blocage).
     */
    public boolean estBloque() {
        return compteBloqueJusqua != null
                && LocalDateTime.now().isBefore(compteBloqueJusqua);
    }

    /** Retourne le nom complet (prenom + nom). */
    public String getNomComplet() {
        return prenom + " " + nom;
    }
}
