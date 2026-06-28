package com.mbem.immocam.module.notification.entity;

import com.mbem.immocam.shared.entity.BaseEntity;
import com.mbem.immocam.shared.enums.TypeNotification;
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
 * Notification destinée aux administrateurs (signalement, nouvelle inscription, ...).
 *
 * Boîte de réception partagée : tous les admins voient les mêmes notifications,
 * "lu" est un état global (pas de suivi par admin individuel).
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TypeNotification type;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String message;

    /** Route frontend vers laquelle naviguer au clic (ex: /admin/signalements). */
    @Column
    private String lien;

    /** ID de l'entité concernée (signalement, utilisateur, ...). */
    @Column(name = "reference_id")
    private Long referenceId;

    @Column(nullable = false)
    @Builder.Default
    private boolean lu = false;
}
