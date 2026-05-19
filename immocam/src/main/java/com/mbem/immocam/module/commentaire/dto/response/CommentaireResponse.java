package com.mbem.immocam.module.commentaire.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentaireResponse {
    private Long id;
    private String auteurPrenom;
    private String contenu;
    private LocalDateTime dateCreation;
    private boolean estProprietaire;
    private boolean estMien;
    private ReponseCommentaireResponse reponse;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReponseCommentaireResponse {
        private Long id;
        private String contenu;
        private LocalDateTime dateCreation;
    }
}
