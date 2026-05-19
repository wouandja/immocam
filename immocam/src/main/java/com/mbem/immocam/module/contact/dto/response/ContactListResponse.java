package com.mbem.immocam.module.contact.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour la liste des contacts d'une annonce (dashboard propriétaire).
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactListResponse {
    private Long id;
    private String utilisateurPrenom;
    private String telephoneMasque;
    private String lienWhatsApp;
    private String annonceTitre;
    private LocalDateTime dateContact;
}