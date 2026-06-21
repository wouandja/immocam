package com.mbem.immocam.infrastructure.email.service;

/**
 * Service d'envoi des emails transactionnels ImmoCam.
 *
 * Tous les envois sont asynchrones (@Async) pour ne pas bloquer la requête HTTP.
 * Templates HTML Thymeleaf dans : src/main/resources/templates/email/
 *
 * Emails envoyés par ImmoCam :
 *   - Validation email (OTP 6 chiffres, valable 10 min)
 *   - Réinitialisation mot de passe (lien 30 min)
 *   - Confirmation publication annonce
 *   - Rappel expiration J-5 et J-1
 *   - Annonce suspendue / supprimée par admin (avec motif)
 *   - Alerte connexion suspecte (5 tentatives échouées)
 *
 * @author MBEMNOVA
 */
public interface EmailService {

    /** OTP de validation email lors de l'inscription. */
    void envoyerCodeValidation(String destinataire, String prenom, String code);

    /** Lien de réinitialisation du mot de passe (valable 30 min). */
    void envoyerLienReinitialisation(String destinataire, String prenom, String lien);

    /** Confirmation que l'annonce est en ligne. */
    void envoyerConfirmationPublication(String destinataire, String prenom,
                                        String typeBien, String ville, String quartier);

    /** Rappel J-5 ou J-1 avant expiration d'une annonce. */
    void envoyerRappelExpiration(String destinataire, String prenom,
                                 String typeBien, String ville,
                                 String dateExpiration, int joursRestants);

    /** Annonce suspendue automatiquement (J0 — expiration). */
    void envoyerAnnonceSuspendue(String destinataire, String prenom,
                                 String typeBien, String ville);

    /** Confirmation de renouvellement (manuel ou réactivation auto-prolongée). */
    void envoyerConfirmationRenouvellement(String destinataire, String prenom,
                                           String typeBien, String ville,
                                           String nouvelleDateExpiration);

    /**
     * Annonce supprimée par l'administrateur (motif obligatoire).
     * Le propriétaire reçoit le motif de suppression.
     */
    void envoyerAnnonceSupprimeeParAdmin(String destinataire, String prenom,
                                         String typeBien, String ville, String motif);

    /** Alerte après 5 tentatives de connexion échouées. */
    void envoyerAlerteConnexionSuspecte(String destinataire, String prenom,
                                        String adresseIp, String dateHeure);

    /** Notification de suspension du compte. */
    void envoyerCompteSuspendu(String destinataire, String prenom, String motif);

    /** Notification de réactivation du compte. */
    void envoyerCompteReactive(String destinataire, String prenom);
}
