package com.mbem.immocam.module.signalement.service;

import com.mbem.immocam.module.signalement.dto.request.SignalerAnnonceRequest;
import com.mbem.immocam.module.signalement.dto.response.SignalementResponse;

/**
 * Service de gestion des signalements.
 *
 * @author MBEMNOVA
 */
public interface SignalementService {

    /** Signaler une annonce (connexion obligatoire). */
    SignalementResponse signaler(Long annonceId, Long auteurId,
                                 SignalerAnnonceRequest request);
}
