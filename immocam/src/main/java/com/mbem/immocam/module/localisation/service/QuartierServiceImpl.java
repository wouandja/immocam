package com.mbem.immocam.module.localisation.service;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.localisation.dto.response.QuartierResponse;
import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.localisation.entity.Quartier;
import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
import com.mbem.immocam.module.localisation.repository.QuartierRepository;
import com.mbem.immocam.shared.enums.TypeAction;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
public class QuartierServiceImpl implements QuartierService {

    private static final int NOM_LONGUEUR_MIN = 2;
    private static final int NOM_LONGUEUR_MAX = 100;

    private final QuartierRepository quartierRepository;
    private final LocalisationRepository localisationRepository;
    private final AnnonceRepository annonceRepository;
    private final LogActiviteService logActiviteService;

    @Override
    @Transactional(readOnly = true)
    public List<String> lister(String ville) {
        if (ville == null || ville.isBlank()) {
            return quartierRepository.findNomsDistincts();
        }
        Localisation localisation = localisationRepository.findByVilleAndEstActiveTrue(ville)
                .stream().findFirst()
                .orElseThrow(() -> new RessourceNotFoundException("Ville introuvable : " + ville));
        return quartierRepository.findByLocalisationIdOrderByNomAsc(localisation.getId())
                .stream().map(Quartier::getNom).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuartierResponse> listerTousAvecVille() {
        return quartierRepository.findAll(Sort.by(Sort.Direction.ASC, "nom")).stream()
                .sorted(Comparator.comparing(q -> q.getLocalisation().getVille()))
                .map(q -> QuartierResponse.builder()
                        .id(q.getId())
                        .nom(q.getNom())
                        .ville(q.getLocalisation().getVille())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public Quartier ajouter(String ville, String nom) {
        String nomNettoye = validerEtNettoyer(nom);
        Localisation localisation = localisationRepository.findByVilleAndEstActiveTrue(ville)
                .stream().findFirst()
                .orElseThrow(() -> new RessourceNotFoundException("Ville introuvable : " + ville));
        return quartierRepository.findByLocalisationIdAndNomIgnoreCase(localisation.getId(), nomNettoye)
                .orElseGet(() -> quartierRepository.save(
                        Quartier.builder().localisation(localisation).nom(nomNettoye).build()));
    }

    @Override
    @Transactional
    public void assurerExistance(Long localisationId, String nom) {
        if (nom == null || nom.isBlank() || localisationId == null) return;
        String nomNettoye = nom.trim();
        if (nomNettoye.length() < NOM_LONGUEUR_MIN || nomNettoye.length() > NOM_LONGUEUR_MAX) return;
        if (quartierRepository.existsByLocalisationIdAndNomIgnoreCase(localisationId, nomNettoye)) return;
        Localisation localisation = localisationRepository.findById(localisationId).orElse(null);
        if (localisation == null) return;
        quartierRepository.save(Quartier.builder().localisation(localisation).nom(nomNettoye).build());
    }

    @Override
    @Transactional
    public void renommer(Long quartierId, String nouveauNom, Long adminId) {
        String nomNettoye = validerEtNettoyer(nouveauNom);
        Quartier quartier = quartierRepository.findById(quartierId)
                .orElseThrow(() -> new RessourceNotFoundException("Quartier", quartierId));
        String ancienNom = quartier.getNom();
        Long localisationId = quartier.getLocalisation().getId();

        if (quartierRepository.existsByLocalisationIdAndNomIgnoreCase(localisationId, nomNettoye)
                && !ancienNom.equalsIgnoreCase(nomNettoye)) {
            throw new IllegalArgumentException("Un quartier portant ce nom existe déjà pour cette ville.");
        }

        quartier.setNom(nomNettoye);
        int nbAnnoncesMaj = annonceRepository.renommerQuartier(localisationId, ancienNom, nomNettoye);

        logActiviteService.log(adminId, TypeAction.MODIFICATION_CONFIG_SYSTEME, "Quartier", quartierId,
                null, "Renommé '" + ancienNom + "' -> '" + nomNettoye + "' (" + nbAnnoncesMaj + " annonce(s))");
    }

    private String validerEtNettoyer(String nom) {
        if (nom == null) throw new IllegalArgumentException("Le quartier ne peut pas être vide");
        String nomNettoye = nom.trim().replaceAll("\\s+", " ");
        if (nomNettoye.length() < NOM_LONGUEUR_MIN || nomNettoye.length() > NOM_LONGUEUR_MAX) {
            throw new IllegalArgumentException(
                    "Le quartier doit comporter entre " + NOM_LONGUEUR_MIN + " et " + NOM_LONGUEUR_MAX + " caractères.");
        }
        return nomNettoye;
    }
}
