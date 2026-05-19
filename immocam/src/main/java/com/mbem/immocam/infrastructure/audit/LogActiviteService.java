package com.mbem.immocam.infrastructure.audit;

import com.mbem.immocam.shared.enums.TypeAction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service d'enregistrement des logs d'activité ImmoCam.
 *
 * Toutes les actions significatives sont tracées de façon asynchrone
 * (@Async) pour ne pas impacter les performances des requêtes.
 *
 * Conservation : 12 mois (politique de confidentialité).
 *
 * Usage dans les services métier :
 *   logActiviteService.log(utilisateurId, TypeAction.PUBLICATION_ANNONCE,
 *                          "Annonce", annonceId, request.getRemoteAddr(), null);
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LogActiviteService {

    private final LogActiviteRepository logActiviteRepository;

    /**
     * Enregistre une action dans les logs de façon asynchrone.
     *
     * @param utilisateurId    ID de l'utilisateur (null si action système)
     * @param typeAction       Type d'action (enum TypeAction)
     * @param entiteConcernee  Nom de l'entité (ex : "Annonce", "Utilisateur")
     * @param entiteId         ID de l'entité concernée (null si non applicable)
     * @param adresseIp        Adresse IP de la requête
     * @param details          Détails complémentaires (JSON ou texte libre)
     */
    @Async
    public void log(Long utilisateurId,
                    TypeAction typeAction,
                    String entiteConcernee,
                    Long entiteId,
                    String adresseIp,
                    String details) {
        try {
            LogActivite logEntry = LogActivite.builder()
                    .utilisateurId(utilisateurId)
                    .typeAction(typeAction)
                    .entiteConcernee(entiteConcernee)
                    .entiteId(entiteId)
                    .adresseIp(adresseIp)
                    .details(details)
                    .build();
            logActiviteRepository.save(logEntry);
        } catch (Exception e) {
            // Ne jamais faire échouer une requête à cause d'un log
            log.warn("Erreur enregistrement log {} pour user {} : {}",
                typeAction, utilisateurId, e.getMessage());
        }
    }

    /**
     * Raccourci pour les actions sans détails supplémentaires.
     *
     * @param utilisateurId ID utilisateur
     * @param typeAction    Type d'action
     * @param adresseIp     IP de la requête
     */
    @Async
    public void log(Long utilisateurId, TypeAction typeAction, String adresseIp) {
        log(utilisateurId, typeAction, null, null, adresseIp, null);
    }
}
