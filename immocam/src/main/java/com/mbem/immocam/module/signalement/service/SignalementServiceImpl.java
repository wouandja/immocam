package com.mbem.immocam.module.signalement.service;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.signalement.dto.request.SignalerAnnonceRequest;
import com.mbem.immocam.module.signalement.dto.response.SignalementResponse;
import com.mbem.immocam.module.signalement.entity.Signalement;
import com.mbem.immocam.module.signalement.repository.SignalementRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.MotifSignalement;
import com.mbem.immocam.shared.enums.StatutSignalement;
import com.mbem.immocam.shared.enums.TypeAction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implémentation du service signalement.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SignalementServiceImpl implements SignalementService {

    private final SignalementRepository signalementRepository;
    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final LogActiviteService logActiviteService;

    @Override
    @Transactional
    public SignalementResponse signaler(Long annonceId, Long auteurId,
                                        SignalerAnnonceRequest request) {
        // Empêcher les signalements en double EN_ATTENTE
        if (signalementRepository.existsByAuteurIdAndAnnonceIdAndStatut(
                auteurId, annonceId, StatutSignalement.EN_ATTENTE)) {
            throw new DoublonException(
                "Vous avez déjà signalé cette annonce. Votre signalement est en cours d'examen.");
        }
        // Motif AUTRE = details obligatoire
        if (MotifSignalement.AUTRE.equals(request.getMotif())
                && (request.getDetails() == null || request.getDetails().isBlank())) {
            throw new IllegalArgumentException(
                "Veuillez préciser le motif dans le champ 'Autre'.");
        }

        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new RessourceNotFoundException("Annonce", annonceId));
        Utilisateur auteur = utilisateurRepository.findById(auteurId)
                .orElseThrow(() -> new RessourceNotFoundException("Utilisateur", auteurId));

        Signalement s = Signalement.builder()
                .auteur(auteur)
                .annonce(annonce)
                .motif(request.getMotif().name())
                .description(request.getDetails())
                .statut(StatutSignalement.EN_ATTENTE)
                .build();
        signalementRepository.save(s);

        logActiviteService.log(auteurId, TypeAction.SIGNALEMENT_SOUMIS, "Annonce", annonceId, null, null);
        log.info("Annonce {} signalée par utilisateur {}", annonceId, auteurId);

        return SignalementResponse.builder()
                .id(s.getId())
                .motif(s.getMotif())
                .statut(s.getStatut().name())
                .dateSignalement(s.getDateCreation())
                .build();
    }
}
