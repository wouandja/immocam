package com.mbem.immocam.module.signalement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de réponse après soumission d'un signalement.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalementResponse {
    private Long id;
    private String motif;
    private String statut;
    private LocalDateTime dateSignalement;
}
