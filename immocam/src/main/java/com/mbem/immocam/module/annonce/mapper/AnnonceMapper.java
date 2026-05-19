package com.mbem.immocam.module.annonce.mapper;

import com.mbem.immocam.module.annonce.dto.response.AnnonceDetailResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceListResponse;
import com.mbem.immocam.module.annonce.dto.response.AnnonceDashboardResponse;
import com.mbem.immocam.module.annonce.dto.response.PhotoResponse;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.entity.Photo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * Mapper MapStruct Annonce <-> DTO.
 * Généré automatiquement à la compilation (zero reflection).
 *
 * @author MBEMNOVA
 */
@Mapper(componentModel = "spring")
public interface AnnonceMapper {

    @Mapping(source = "typeBien.libelle", target = "typeBien")
    @Mapping(source = "localisation.ville", target = "ville")
    @Mapping(source = "dateCreation", target = "datePublication")
    @Mapping(target = "prixFormate", ignore = true) // construit par le service
    @Mapping(target = "photoPrincipale", ignore = true) // construit par le service
    @Mapping(target = "photoPrincipaleThumb", ignore = true) // construit par le service
    @Mapping(target = "hasPhotos", ignore = true) // construit par le service
    @Mapping(target = "nombreCommentaires", ignore = true) // construit par le service
    @Mapping(target = "isFavori", ignore = true) // construit par le contrôleur
    AnnonceListResponse toListResponse(Annonce annonce);

    List<AnnonceListResponse> toListResponse(List<Annonce> annonces);

    @Mapping(source = "typeBien.libelle", target = "typeBien")
    @Mapping(source = "localisation.ville", target = "ville")
    @Mapping(source = "dateCreation", target = "datePublication")
    @Mapping(source = "proprietaire.prenom", target = "proprietairePrenom")
    @Mapping(target = "prixFormate", ignore = true) // construit par le service
    @Mapping(target = "photoPrincipale", ignore = true) // construit par le service
    @Mapping(target = "photoPrincipaleThumb", ignore = true) // construit par le service
    @Mapping(target = "hasPhotos", ignore = true) // construit par le service
    @Mapping(target = "lienWhatsApp", ignore = true) // construit par le service
    @Mapping(target = "dateExpirationFormatee", ignore = true) // construit par le service
    @Mapping(target = "estMienne", ignore = true) // déterminé par le service
    @Mapping(target = "nombreCommentaires", ignore = true)
    @Mapping(target = "nombreContacts", ignore = true)
    @Mapping(target = "photos", ignore = true) // construit par le service
    @Mapping(target = "commentaires", ignore = true) // construit par le service
    @Mapping(target = "annoncesSimiliaires", ignore = true) // construit par le service
    @Mapping(target = "isFavori", ignore = true) // construit par le contrôleur
    AnnonceDetailResponse toDetailResponse(Annonce annonce);

    @Mapping(source = "typeBien.libelle", target = "typeBien")
    @Mapping(source = "localisation.ville", target = "ville")
    @Mapping(source = "dateCreation", target = "datePublication")
    @Mapping(target = "dateExpirationFormatee", ignore = true) // construit par le service
    @Mapping(target = "prixFormate", ignore = true) // construit par le service
    @Mapping(target = "nombreContacts", ignore = true) // construit par le service
    @Mapping(target = "nombreCommentaires", ignore = true) // construit par le service
    @Mapping(target = "photoUrl", ignore = true) // construit par le service
    AnnonceDashboardResponse toDashboardResponse(Annonce annonce);

    @Mapping(target = "url", ignore = true) // construit par StorageService.construireUrl()
    PhotoResponse toPhotoResponse(Photo photo);
}
