package com.mbem.immocam.shared.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Classe de base pour toutes les entites JPA d'ImmoCam.
 *
 * <p>Fournit automatiquement un id BIGSERIAL, dateCreation et dateModification
 * remplis par JPA Auditing (@EnableJpaAuditing dans ImmocamApplication).
 *
 * @author MBEMNOVA
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class BaseEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Remplie automatiquement a la creation. Non modifiable (updatable = false).
     */
    @CreatedDate
    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    /**
     * Mise a jour automatiquement a chaque save().
     */
    @LastModifiedDate
    @Column(name = "date_modification")
    private LocalDateTime dateModification;
}
