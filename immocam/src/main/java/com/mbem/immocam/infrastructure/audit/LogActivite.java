package com.mbem.immocam.infrastructure.audit;

import com.mbem.immocam.shared.entity.BaseEntity;
import com.mbem.immocam.shared.enums.TypeAction;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Log d'activite pour l'audit complet de la plateforme.
 *
 * Enregistre toutes les actions significatives : authentification,
 * publications, modifications, contacts WhatsApp, signalements,
 * actions administratives.
 *
 * Utilise dans le dashboard admin pour l'historique.
 * Conservation : 12 mois (politique de confidentialite).
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "logs_activite")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogActivite extends BaseEntity {

    /** ID de l'utilisateur concerne (null si action systeme). */
    @Column(name = "utilisateur_id")
    private Long utilisateurId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_action", nullable = false, length = 40)
    private TypeAction typeAction;

    /** Nom de l'entite concernee (ex : "Annonce", "Utilisateur"). */
    @Column(name = "entite_concernee", length = 50)
    private String entiteConcernee;

    /** ID de l'entite concernee. */
    @Column(name = "entite_id")
    private Long entiteId;

    /** Adresse IP de la requete (audit de securite). */
    @Column(name = "adresse_ip", length = 45)
    private String adresseIp;

    /** Details complementaires (JSON ou texte libre). */
    @Column(name = "details", columnDefinition = "TEXT")
    private String details;
}
