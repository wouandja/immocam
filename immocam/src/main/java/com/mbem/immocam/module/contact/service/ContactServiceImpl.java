package com.mbem.immocam.module.contact.service;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.config.repository.ConfigSystemeRepository;
import com.mbem.immocam.module.contact.dto.response.ContactListResponse;
import com.mbem.immocam.module.contact.dto.response.ContactResponse;
import com.mbem.immocam.module.contact.entity.ContactWhatsApp;
import com.mbem.immocam.module.contact.repository.ContactWhatsAppRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.enums.TypeAction;
import com.mbem.immocam.shared.pagination.PageResponse;
import com.mbem.immocam.shared.utils.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Implémentation du service contact WhatsApp.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContactServiceImpl implements ContactService {

    private final ContactWhatsAppRepository contactRepository;
    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ConfigSystemeRepository configRepository;
    private final LogActiviteService logActiviteService;

@Override
@Transactional
public ContactResponse contacter(Long utilisateurId, Long annonceId, String adresseIp) {
    Annonce annonce = annonceRepository.findById(annonceId)
            .filter(a -> !a.isDeleted() && StatutAnnonce.ACTIVE.equals(a.getStatut()))
            .orElseThrow(() -> new RessourceNotFoundException("Annonce introuvable ou inactive."));
    Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
            .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", utilisateurId));

    // ✅ Le propriétaire ne peut pas contacter sa propre annonce
    if (annonce.getProprietaire().getId().equals(utilisateurId)) {
        throw new AccesRefuseException("Vous ne pouvez pas contacter votre propre annonce.");
    }

    boolean dejaContacte = contactRepository
            .existsByUtilisateurIdAndAnnonceIdAndAnnonce_Proprietaire_IdNot(
                utilisateurId, annonceId, utilisateurId);

    if (!dejaContacte) {
        ContactWhatsApp contact = ContactWhatsApp.builder()
                .utilisateur(utilisateur)
                .annonce(annonce)
                .telephoneContact(utilisateur.getTelephone())
                .adresseIp(adresseIp)
                .dateContact(LocalDateTime.now())
                .build();
        contactRepository.save(contact);
        logActiviteService.log(utilisateurId, TypeAction.CONTACT_WHATSAPP, "Annonce", annonceId, adresseIp, null);
    }

    String template = configRepository.findByCle(ImmoCamConstants.CONFIG_MSG_WHATSAPP)
            .map(c -> c.getValeur())
            .orElse("Bonjour, je vous contacte depuis ImmoCam.");
    String msg = template
            .replace("{type}", annonce.getTypeBien().getLibelle())
            .replace("{quartier}", annonce.getQuartier() != null ? annonce.getQuartier() : "")
            .replace("{ville}", annonce.getLocalisation().getVille())
            .replace("{prix}", annonce.getPrix().toPlainString());

    String lien = PhoneUtils.construireLienWhatsApp(annonce.getNumeroWhatsApp(), msg);
    return ContactResponse.builder().lienWhatsApp(lien).build();
}
















@Override
    @Transactional(readOnly = true)
    public PageResponse<ContactListResponse> listeContacts(Long annonceId, Long proprietaireId,
            Pageable pageable) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));
        if (!annonce.getProprietaire().getId().equals(proprietaireId)) {
            throw new AccesRefuseException("Accès non autorisé à ces contacts.");
        }
        Page<ContactWhatsApp> page = contactRepository
                .findByAnnonceIdOrderByDateContactDesc(annonceId, pageable);
        Page<ContactListResponse> dto = page.map(c -> ContactListResponse.builder()
                .telephoneMasque(PhoneUtils.masquer(c.getTelephoneContact()))
                .dateContact(c.getDateContact())
                .build());
        return PageResponse.from(dto);
    }




    @Override
    public long compterContacts(Long annonceId) {
        return contactRepository.countByAnnonceId(annonceId);
    }



@Override
@Transactional(readOnly = true)
public PageResponse<ContactListResponse> mesContacts(Long utilisateurId, Pageable pageable) {
    Page<ContactWhatsApp> page = contactRepository
        .findDedupByProprietaire(utilisateurId, pageable); // ✅ remplacé ici

    Page<ContactListResponse> dto = page.map(c -> ContactListResponse.builder()
        .id(c.getId())
        .utilisateurPrenom(c.getUtilisateur().getPrenom())
        .telephoneMasque(PhoneUtils.masquer(c.getTelephoneContact()))
        .lienWhatsApp(PhoneUtils.construireLienWhatsApp(
            c.getTelephoneContact(),
            "Bonjour, je suis disponible pour votre annonce sur ImmoCam."))
        .annonceTitre(c.getAnnonce().getTypeBien().getLibelle()
            + " – " + c.getAnnonce().getLocalisation().getVille())
        .dateContact(c.getDateContact())
        .build());

    return PageResponse.from(dto);
}


}
