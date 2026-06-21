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
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactServiceImpl implements ContactService {

    private final ContactWhatsAppRepository contactRepository;
    private final AnnonceRepository         annonceRepository;
    private final UtilisateurRepository     utilisateurRepository;
    private final ConfigSystemeRepository   configRepository;
    private final LogActiviteService        logActiviteService;

    @Override
    @Transactional
    public ContactResponse contacter(Long utilisateurId, Long annonceId, String adresseIp) {

        Annonce annonce = annonceRepository.findById(annonceId)
                .filter(a -> !a.isDeleted() && StatutAnnonce.ACTIVE.equals(a.getStatut()))
                .orElseThrow(() -> new RessourceNotFoundException("Annonce introuvable ou inactive."));

        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", utilisateurId));

        boolean estProprietaire = annonce.getProprietaire().getId().equals(utilisateurId);

        // ✅ Le propriétaire peut cliquer sur son propre lien (test / partage)
        // On n'enregistre pas le contact et on ne le compte pas dans les stats.
        if (!estProprietaire) {
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
                logActiviteService.log(utilisateurId, TypeAction.CONTACT_WHATSAPP,
                        "Annonce", annonceId, adresseIp, null);
            }
        }

        String message = construireMessage(annonce, estProprietaire);
        String lien    = PhoneUtils.construireLienWhatsApp(annonce.getNumeroWhatsApp(), message);

        return ContactResponse.builder().lienWhatsApp(lien).build();
    }

    /**
     * Construit un message WhatsApp riche avec uniquement les champs
     * réellement présents dans l'entité Annonce :
     *   description, prix, quartier, localisation (ville), typeBien (libelle),
     *   datePublication, dateExpiration.
     *
     * Rendu dans WhatsApp (exemple) :
     * ─────────────────────────────────────
     * Bonjour 👋, je vous contacte via *ImmoCam* au sujet de votre annonce :
     *
     * 🏠 *Appartement – Bonapriso, Douala*
     * 💰 150 000 FCFA
     * 🗓 Publié le 01/06/2025
     *
     * 📝 Grand appartement lumineux au 3e étage,
     * proche des commodités...
     *
     * Je suis intéressé(e) et souhaite obtenir plus d'informations.
     * Merci de me recontacter. 🙏
     * ─────────────────────────────────────
     */
    private String construireMessage(Annonce annonce, boolean estProprietaire) {

        // ── Champs de base (tous présents dans l'entité) ──────────────────
        String type     = annonce.getTypeBien() != null
                          ? annonce.getTypeBien().getLibelle() : "Bien immobilier";
        String ville    = annonce.getLocalisation() != null
                          ? annonce.getLocalisation().getVille() : "";
        String quartier = (annonce.getQuartier() != null
                           && !annonce.getQuartier().isBlank()
                           && !"Non spécifié".equalsIgnoreCase(annonce.getQuartier()))
                          ? annonce.getQuartier() + ", " : "";
        String localisation = quartier + ville;

        // Prix formaté en FCFA avec séparateur milliers
        String prix = annonce.getPrix() != null
                      ? String.format(Locale.FRANCE, "%,.0f FCFA", annonce.getPrix())
                      : "";

        // Date de publication lisible
        String datePublication = annonce.getDatePublication() != null
                ? annonce.getDatePublication()
                         .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "";

        // Icône selon libellé type de bien
        String libelle = type.toLowerCase();
        String icone   = libelle.contains("studio")      ? "🏠"
                       : libelle.contains("appartement") ? "🏢"
                       : libelle.contains("villa")       ? "🏡"
                       : libelle.contains("bureau")      ? "🏬"
                       : libelle.contains("terrain")     ? "🌍"
                       : libelle.contains("boutique")    ? "🏪"
                       : libelle.contains("magasin")     ? "🏪"
                       : libelle.contains("chambre")     ? "🛏"
                       : "🏠";

        // Description tronquée à 200 caractères pour ne pas surcharger le message
        String description = "";
        if (annonce.getDescription() != null && !annonce.getDescription().isBlank()) {
            String desc = annonce.getDescription().trim();
            description = desc.length() > 200 ? desc.substring(0, 200) + "…" : desc;
        }

        // ── Message propriétaire (aperçu / test) ─────────────────────────
        if (estProprietaire) {
            StringBuilder msg = new StringBuilder();
            msg.append("🔍 *Aperçu de votre annonce ImmoCam*\n\n");
            msg.append(icone).append(" *").append(type);
            if (!localisation.isBlank()) msg.append(" – ").append(localisation);
            msg.append("*\n");
            if (!prix.isBlank())            msg.append("💰 ").append(prix).append("\n");
            if (!datePublication.isBlank()) msg.append("🗓 Publié le ").append(datePublication).append("\n");
            if (!description.isBlank())     msg.append("\n📝 ").append(description).append("\n");
            msg.append("\n👆 _Voici ce que vos contacts verront en vous écrivant via ImmoCam._");
            return msg.toString();
        }

        // ── Message contact standard ──────────────────────────────────────
        StringBuilder msg = new StringBuilder();
        msg.append("Bonjour 👋, je vous contacte via *ImmoCam* au sujet de votre annonce :\n\n");
        msg.append(icone).append(" *").append(type);
        if (!localisation.isBlank()) msg.append(" – ").append(localisation);
        msg.append("*\n");
        if (!prix.isBlank())            msg.append("💰 ").append(prix).append("\n");
        if (!datePublication.isBlank()) msg.append("🗓 Publié le ").append(datePublication).append("\n");
        if (!description.isBlank())     msg.append("\n📝 ").append(description).append("\n");
        msg.append("\nJe suis intéressé(e) et souhaite obtenir plus d'informations.\n");
        msg.append("Merci de me recontacter. 🙏");
        return msg.toString();
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
                .findDedupByProprietaire(utilisateurId, pageable);
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