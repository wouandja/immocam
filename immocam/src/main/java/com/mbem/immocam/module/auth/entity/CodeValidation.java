package com.mbem.immocam.module.auth.entity;

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

import java.time.LocalDateTime;

/**
 * Code OTP a 6 chiffres pour validation email et reinitialisation mot de passe.
 *
 * Regles :
 *   - Valable 10 minutes apres generation
 *   - Maximum 3 renvois par heure (anti-spam)
 *   - Usage unique (estUtilise = true apres utilisation)
 *   - Types : EMAIL_VALIDATION ou REINITIALISATION_MDP
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "codes_validation")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeValidation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    /** Code OTP a 6 chiffres. */
    @Column(nullable = false, length = 10)
    private String code;

    /** EMAIL_VALIDATION ou REINITIALISATION_MDP */
    @Column(name = "type_code", nullable = false, length = 30)
    private String typeCode;

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Column(name = "est_utilise", nullable = false)
    @Builder.Default
    private boolean estUtilise = false;

    /** Compteur de renvois — max 3 par heure. */
    @Column(name = "nombre_renvois", nullable = false)
    @Builder.Default
    private int nombreRenvois = 0;

    /** Verifie si le code est encore valide (non expire et non utilise). */
    public boolean estValide() {
        return !estUtilise && LocalDateTime.now().isBefore(dateExpiration);
    }
}
