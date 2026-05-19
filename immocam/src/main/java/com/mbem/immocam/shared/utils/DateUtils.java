package com.mbem.immocam.shared.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * Utilitaires de dates pour ImmoCam.
 * Fuseau horaire : Africa/Douala (UTC+1).
 *
 * @author MBEMNOVA
 */
public final class DateUtils {

    public static final DateTimeFormatter FORMAT_AFFICHAGE =
        DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public static final DateTimeFormatter FORMAT_AFFICHAGE_HEURE =
        DateTimeFormatter.ofPattern("dd/MM/yyyy 'a' HH'h'mm");

    private DateUtils() {}

    /**
     * Calcule la date d'expiration d'une annonce.
     *
     * @param datePublication Date de publication
     * @param dureeJours      Duree de vie (issue de ConfigSysteme)
     * @return Date d'expiration
     */
    public static LocalDateTime calculerExpiration(LocalDateTime datePublication, int dureeJours) {
        return datePublication.plusDays(dureeJours);
    }

    /**
     * Verifie si une date est passee.
     *
     * @param date Date a verifier
     * @return true si dans le passe
     */
    public static boolean estExpiree(LocalDateTime date) {
        return date != null && LocalDateTime.now().isAfter(date);
    }

    /**
     * Calcule le nombre de jours restants avant une date.
     *
     * @param dateExpiration Date limite
     * @return Jours restants (negatif si deja expire)
     */
    public static long joursRestants(LocalDateTime dateExpiration) {
        return ChronoUnit.DAYS.between(LocalDateTime.now(), dateExpiration);
    }

    /**
     * Formate une date en texte relatif lisible par l'utilisateur.
     * Exemples : "A l'instant", "Il y a 2 heures", "Le 05/04/2026"
     *
     * @param date Date a formater
     * @return Texte relatif
     */
    public static String formatRelatif(LocalDateTime date) {
        if (date == null) return "";
        long min  = ChronoUnit.MINUTES.between(date, LocalDateTime.now());
        long h    = ChronoUnit.HOURS.between(date, LocalDateTime.now());
        long j    = ChronoUnit.DAYS.between(date, LocalDateTime.now());
        if (min < 1)  return "A l'instant";
        if (min < 60) return "Il y a " + min + " minute"  + (min > 1 ? "s" : "");
        if (h   < 24) return "Il y a " + h   + " heure"   + (h   > 1 ? "s" : "");
        if (j   < 7)  return "Il y a " + j   + " jour"    + (j   > 1 ? "s" : "");
        return "Le " + date.format(FORMAT_AFFICHAGE);
    }

    /**
     * Formate une date pour les templates email.
     *
     * @param date Date a formater
     * @return Ex : "05/04/2026 a 14h30"
     */
    public static String formatEmail(LocalDateTime date) {
        return date == null ? "" : date.format(FORMAT_AFFICHAGE_HEURE);
    }
}
