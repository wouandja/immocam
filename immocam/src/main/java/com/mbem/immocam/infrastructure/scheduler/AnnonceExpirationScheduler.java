package com.mbem.immocam.infrastructure.scheduler;

import com.mbem.immocam.infrastructure.email.service.EmailService;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.config.service.ConfigSystemeService;
import com.mbem.immocam.shared.constants.ImmoCamConstants;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.utils.DateUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler d'expiration automatique des annonces ImmoCam.
 *
 * Exécuté chaque nuit à 3h00 (configurable via SCHEDULER_CRON).
 *
 * Cycle de vie géré :
 *   J-5 : email au propriétaire "Votre annonce expire dans 5 jours"
 *         + badge dans le dashboard
 *   J-1 : email de dernier rappel
 *   J0  : statut -> EXPIREE (invisible du public)
 *   J+7 : statut -> SUPPRIMEE_SYSTEME (suppression définitive)
 *
 * @author MBEMNOVA
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AnnonceExpirationScheduler {

    private final AnnonceRepository annonceRepository;
    private final EmailService emailService;
    private final ConfigSystemeService configSystemeService;

    @Value("${immocam.annonce.delai-rappel-j5:5}")
    private int delaiRappelJ5;

    @Value("${immocam.annonce.delai-rappel-j1:1}")
    private int delaiRappelJ1;

    @Value("${immocam.annonce.delai-suppression-apres-expiration:7}")
    private int delaiSuppressionJours;

    /**
     * Tâche principale — s'exécute chaque nuit à 3h00.
     * Désactivée en profil dev (immocam.scheduler.enabled=false).
     */
    @Scheduled(cron = "${immocam.scheduler.expiration-cron:0 0 3 * * *}")
    @Transactional
    public void executerVerificationExpiration() {
        log.info("Scheduler démarré : vérification des expirations d'annonces");
        LocalDateTime maintenant = LocalDateTime.now();
        int total = 0;

        total += envoyerRappelsJ5(maintenant);
        total += envoyerRappelsJ1(maintenant);
        total += suspendreExpirees(maintenant);
        total += supprimerDefinitivement(maintenant);

        log.info("Scheduler terminé : {} annonces traitées", total);
    }

    /** J-5 : email de premier rappel. */
    private int envoyerRappelsJ5(LocalDateTime maintenant) {
        int delai = configSystemeService.getInt(ImmoCamConstants.CONFIG_DELAI_RAPPEL, delaiRappelJ5);
        LocalDateTime debut = maintenant.plusDays(delai).withHour(0).withMinute(0);
        LocalDateTime fin   = maintenant.plusDays(delai).withHour(23).withMinute(59);
        List<Annonce> annonces = annonceRepository.findAnnoncesRappelJ5(debut, fin);

        for (Annonce a : annonces) {
            try {
                emailService.envoyerRappelExpiration(
                    a.getProprietaire().getEmail(),
                    a.getProprietaire().getPrenom(),
                    a.getTypeBien().getLibelle(),
                    a.getLocalisation().getVille(),
                    DateUtils.formatEmail(a.getDateExpiration()),
                    delai
                );
                a.setRappelJ5Envoye(true);
                log.debug("Rappel J-5 envoyé pour annonce id={}", a.getId());
            } catch (Exception e) {
                log.error("Erreur rappel J-5 annonce id={} : {}", a.getId(), e.getMessage());
            }
        }
        return annonces.size();
    }

    /** J-1 : email de dernier rappel. */
    private int envoyerRappelsJ1(LocalDateTime maintenant) {
        int delai = configSystemeService.getInt(ImmoCamConstants.CONFIG_DELAI_RAPPEL_FINAL, delaiRappelJ1);
        LocalDateTime debut = maintenant.plusDays(delai).withHour(0).withMinute(0);
        LocalDateTime fin   = maintenant.plusDays(delai).withHour(23).withMinute(59);
        List<Annonce> annonces = annonceRepository.findAnnoncesRappelJ1(debut, fin);

        for (Annonce a : annonces) {
            try {
                emailService.envoyerRappelExpiration(
                    a.getProprietaire().getEmail(),
                    a.getProprietaire().getPrenom(),
                    a.getTypeBien().getLibelle(),
                    a.getLocalisation().getVille(),
                    DateUtils.formatEmail(a.getDateExpiration()),
                    delai
                );
                a.setRappelJ1Envoye(true);
                log.debug("Rappel J-1 envoyé pour annonce id={}", a.getId());
            } catch (Exception e) {
                log.error("Erreur rappel J-1 annonce id={} : {}", a.getId(), e.getMessage());
            }
        }
        return annonces.size();
    }

    /** J0 : passer les annonces expirées en statut EXPIREE. */
    private int suspendreExpirees(LocalDateTime maintenant) {
        List<Annonce> annonces = annonceRepository.findAnnoncesExpirees(maintenant);
        for (Annonce a : annonces) {
            try {
                a.setStatut(StatutAnnonce.EXPIREE);
                emailService.envoyerAnnonceSuspendue(
                    a.getProprietaire().getEmail(),
                    a.getProprietaire().getPrenom(),
                    a.getTypeBien().getLibelle(),
                    a.getLocalisation().getVille()
                );
                log.info("Annonce id={} passée en EXPIREE", a.getId());
            } catch (Exception e) {
                log.error("Erreur expiration annonce id={} : {}", a.getId(), e.getMessage());
            }
        }
        return annonces.size();
    }

    /** J+7 : supprimer définitivement les annonces expirées sans renouvellement. */
    private int supprimerDefinitivement(LocalDateTime maintenant) {
        int delai = configSystemeService.getInt(ImmoCamConstants.CONFIG_DELAI_SUPPRESSION, delaiSuppressionJours);
        LocalDateTime limite = maintenant.minusDays(delai);
        List<Annonce> annonces = annonceRepository.findAnnoncesASupprimer(limite);
        for (Annonce a : annonces) {
            try {
                a.setStatut(StatutAnnonce.SUPPRIMEE_SYSTEME);
                a.setDeleted(true);
                log.info("Annonce id={} supprimée définitivement par le système", a.getId());
            } catch (Exception e) {
                log.error("Erreur suppression système annonce id={} : {}", a.getId(), e.getMessage());
            }
        }
        return annonces.size();
    }
}
