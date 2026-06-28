package com.mbem.immocam.module.config.service;

import com.mbem.immocam.module.config.entity.ConfigSysteme;
import com.mbem.immocam.module.config.repository.ConfigSystemeRepository;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Garantit l'existence des paramètres système par défaut, au cas où la
 * migration Flyway V4 n'a pas tourné (ex: profil dev, Flyway désactivé,
 * schéma géré par Hibernate ddl-auto). Ne recrée jamais une clé déjà
 * présente — ne touche donc jamais à une valeur déjà personnalisée.
 *
 * @author MBEMNOVA
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ConfigSystemeSeeder implements ApplicationRunner {

    private final ConfigSystemeRepository configRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Map<String, String[]> defauts = new LinkedHashMap<>();
        defauts.put(ImmoCamConstants.CONFIG_DUREE_VIE_ANNONCE,
                new String[]{"30", "Duree de vie d'une annonce en jours avant expiration automatique"});
        defauts.put(ImmoCamConstants.CONFIG_DELAI_RAPPEL,
                new String[]{"5", "Jours avant expiration pour le premier rappel (J-5)"});
        defauts.put(ImmoCamConstants.CONFIG_DELAI_RAPPEL_FINAL,
                new String[]{"1", "Jours avant expiration pour le rappel final (J-1)"});
        defauts.put(ImmoCamConstants.CONFIG_DELAI_SUPPRESSION,
                new String[]{"7", "Jours apres expiration avant suppression definitive (J+7)"});
        defauts.put(ImmoCamConstants.CONFIG_MAX_PHOTOS,
                new String[]{"4", "Nombre maximum de photos par annonce"});
        defauts.put(ImmoCamConstants.CONFIG_MAX_TAILLE_PHOTO,
                new String[]{"4", "Taille maximale d'une photo en megaoctets"});
        defauts.put(ImmoCamConstants.CONFIG_MAX_ANNONCES,
                new String[]{"5", "Annonces actives simultanees max par proprietaire"});
        defauts.put(ImmoCamConstants.CONFIG_MSG_WHATSAPP,
                new String[]{
                        "Bonjour {proprietaire}, je suis interesse(e) par votre annonce ImmoCam : {type} a {quartier}, {ville} — {prix}. Est-elle toujours disponible ?",
                        "Message pre-rempli WhatsApp (placeholders: {proprietaire}, {type}, {quartier}, {ville}, {prix})"});
        defauts.put(ImmoCamConstants.CONFIG_MAX_CONNEXIONS_ECHOUEES,
                new String[]{"5", "Tentatives de connexion echouees avant blocage du compte"});
        defauts.put(ImmoCamConstants.CONFIG_DUREE_BLOCAGE_MINUTES,
                new String[]{"30", "Duree du blocage en minutes apres tentatives echouees"});

        int crees = 0;
        for (Map.Entry<String, String[]> entry : defauts.entrySet()) {
            if (configRepository.existsByCle(entry.getKey())) continue;
            configRepository.save(ConfigSysteme.builder()
                    .cle(entry.getKey())
                    .valeur(entry.getValue()[0])
                    .description(entry.getValue()[1])
                    .build());
            crees++;
        }
        if (crees > 0) {
            log.info("Parametres systeme initialises : {} cle(s) creee(s)", crees);
        }
    }
}
