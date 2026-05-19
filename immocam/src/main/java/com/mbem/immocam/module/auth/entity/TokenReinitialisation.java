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
 * Token UUID unique envoye par email pour reinitialiser le mot de passe.
 *
 * Regles :
 *   - Lien valable 30 minutes
 *   - Usage unique (estUtilise = true apres utilisation)
 *   - Un seul token actif par utilisateur a la fois
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "tokens_reinitialisation")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenReinitialisation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Column(name = "est_utilise", nullable = false)
    @Builder.Default
    private boolean estUtilise = false;

    /** Verifie si le token est encore valide (non expire et non utilise). */
    public boolean estValide() {
        return !estUtilise && LocalDateTime.now().isBefore(dateExpiration);
    }
}
