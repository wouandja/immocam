package com.mbem.immocam.module.annonce.dto.response;

import com.mbem.immocam.module.commentaire.dto.response.CommentaireResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceDetailResponse {
    private Long id;
    private String typeBien;
    private String ville;
    private String quartier;
    private BigDecimal prix;
    private String prixFormate;
    private String statut;
    private String photoPrincipale;
    private String photoPrincipaleThumb;
    private boolean hasPhotos;
    private int nombreVues;
    private int nombreCommentaires;
    private LocalDateTime datePublication;
    private LocalDateTime dateExpiration;
    private Boolean isFavori;

    private String description;
    private int nombreContacts;
    private String lienWhatsApp;
    private String dateExpirationFormatee;
    private String proprietairePrenom;
    private boolean estMienne;
    private List<PhotoResponse> photos;
    private List<CommentaireResponse> commentaires;
    private List<AnnonceListResponse> annoncesSimiliaires;
}
