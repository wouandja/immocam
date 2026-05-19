package com.mbem.immocam.module.contact.entity;

import com.mbem.immocam.module.annonce.entity.Annonce;
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
 * Enregistrement d'un clic sur le bouton "Contacter via WhatsApp".
 *
 * Connexion obligatoire pour contacter un proprietaire.
 * Le proprietaire consulte ces donnees dans son dashboard (par annonce).
 *
 * SECURITE : Le numero WhatsApp du proprietaire n'est jamais stocke ici.
 * Seul le telephone de l'utilisateur qui a clique est enregistre.
 *
 * @author MBEMNOVA
 */
@Entity
@Table(name = "contacts_whatsapp")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactWhatsApp extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annonce_id", nullable = false)
    private Annonce annonce;

    /** Telephone de l'utilisateur qui a clique (son propre numero). */
    @Column(name = "telephone_contact", length = 20)
    private String telephoneContact;

    /** Adresse IP pour audit de securite. */
    @Column(name = "adresse_ip", length = 45)
    private String adresseIp;

    @Column(name = "date_contact", nullable = false)
    private LocalDateTime dateContact;
}
