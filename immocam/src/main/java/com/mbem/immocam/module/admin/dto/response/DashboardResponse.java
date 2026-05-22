package com.mbem.immocam.module.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Statistiques temps réel du dashboard administrateur.
 *
 * @author MBEMNOVA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    // ── Aujourd'hui ──────────────────────────────────────────────────────
    private long annoncesPublieesAujourdhui;
    private long nouveauxInscritsAujourdhui;
    private long contactsWhatsAppAujourdhui;
    private long commentairesAujourdhui;

    // ── 7 derniers jours ─────────────────────────────────────────────────
    private long annoncesPubliees7j;
    private long nouveauxInscrits7j;
    private long contactsWhatsApp7j;

    // ── Temps réel ────────────────────────────────────────────────────────
    private long annoncesActives;
    private long signalementsEnAttente;
    private long utilisateursActifs;
    private long utilisateursSuspendus;
    private long utilisateursTotal;
    private long contactsWhatsAppTotal;
}
