package com.mbem.immocam.module.localisation.service;

import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.localisation.entity.Quartier;
import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
import com.mbem.immocam.module.localisation.repository.QuartierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Initialise le référentiel des quartiers à partir des annonces existantes,
 * au cas où la migration Flyway V6 n'a pas tourné (ex: profil dev, Flyway
 * désactivé et schéma géré par Hibernate ddl-auto). Sans effet si la table
 * contient déjà des données (cas normal en production).
 *
 * @author MBEMNOVA
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class QuartierBackfillRunner implements ApplicationRunner {

    private final QuartierRepository quartierRepository;
    private final LocalisationRepository localisationRepository;
    private final AnnonceRepository annonceRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (quartierRepository.count() > 0) return;

        Map<Long, Localisation> localisations = localisationRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(Localisation::getId, l -> l));

        List<Object[]> couples = annonceRepository.findCouplesLocalisationQuartierDistincts();
        int inseres = 0;
        for (Object[] couple : couples) {
            Long localisationId = (Long) couple[0];
            String quartier = (String) couple[1];
            Localisation localisation = localisations.get(localisationId);
            if (localisation == null || quartier == null || quartier.isBlank()) continue;
            if (quartierRepository.existsByLocalisationIdAndNomIgnoreCase(localisationId, quartier)) continue;
            quartierRepository.save(Quartier.builder().localisation(localisation).nom(quartier.trim()).build());
            inseres++;
        }
        if (inseres > 0) {
            log.info("Référentiel quartiers initialisé depuis les annonces existantes : {} quartier(s)", inseres);
        }
    }
}
