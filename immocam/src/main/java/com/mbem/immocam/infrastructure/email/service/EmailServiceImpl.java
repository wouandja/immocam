package com.mbem.immocam.infrastructure.email.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

/**
 * Implémentation du service email.
 *
 * Tous les envois sont @Async — exécutés dans un thread séparé pour ne pas
 * bloquer la réponse HTTP (inscription, modification d'annonce...).
 *
 * Les templates HTML sont dans src/main/resources/templates/email/.
 *
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${immocam.email.from}")
    private String fromEmail;

    @Value("${immocam.email.from-name}")
    private String fromName;

    @Async
    @Override
    public void envoyerCodeValidation(String destinataire, String prenom, String code) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("code", code);
            ctx.setVariable("expiration", "10 minutes");
            String html = templateEngine.process("email/code-validation", ctx);
            envoyer(destinataire, "Validez votre compte ImmoCam", html);
        } catch (Exception e) {
            log.error("Erreur envoi code validation à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerLienReinitialisation(String destinataire, String prenom, String lien) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("lien", lien);
            String html = templateEngine.process("email/reinitialisation", ctx);
            envoyer(destinataire, "Réinitialisez votre mot de passe ImmoCam", html);
        } catch (Exception e) {
            log.error("Erreur envoi lien réinitialisation à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerConfirmationPublication(String destinataire, String prenom,
                                               String typeBien, String ville, String quartier) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("typeBien", typeBien);
            ctx.setVariable("ville", ville);
            ctx.setVariable("quartier", quartier);
            String html = templateEngine.process("email/confirmation-publication", ctx);
            envoyer(destinataire, "Votre annonce est en ligne sur ImmoCam", html);
        } catch (Exception e) {
            log.error("Erreur envoi confirmation publication à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerRappelExpiration(String destinataire, String prenom,
                                        String typeBien, String ville,
                                        String dateExpiration, int joursRestants) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("typeBien", typeBien);
            ctx.setVariable("ville", ville);
            ctx.setVariable("dateExpiration", dateExpiration);
            ctx.setVariable("joursRestants", joursRestants);
            String html = templateEngine.process("email/rappel-expiration", ctx);
            String sujet = joursRestants == 1
                ? "Votre annonce ImmoCam expire demain"
                : "Votre annonce ImmoCam expire dans " + joursRestants + " jours";
            envoyer(destinataire, sujet, html);
        } catch (Exception e) {
            log.error("Erreur envoi rappel expiration à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerAnnonceSuspendue(String destinataire, String prenom,
                                        String typeBien, String ville) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("typeBien", typeBien);
            ctx.setVariable("ville", ville);
            String html = templateEngine.process("email/annonce-suspendue", ctx);
            envoyer(destinataire, "Votre annonce ImmoCam a expiré", html);
        } catch (Exception e) {
            log.error("Erreur envoi annonce suspendue à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerAnnonceSupprimeeParAdmin(String destinataire, String prenom,
                                                String typeBien, String ville, String motif) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("typeBien", typeBien);
            ctx.setVariable("ville", ville);
            ctx.setVariable("motif", motif);
            String html = templateEngine.process("email/annonce-supprimee-admin", ctx);
            envoyer(destinataire, "Votre annonce ImmoCam a été supprimée", html);
        } catch (Exception e) {
            log.error("Erreur envoi annonce supprimée admin à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerAlerteConnexionSuspecte(String destinataire, String prenom,
                                               String adresseIp, String dateHeure) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("adresseIp", adresseIp);
            ctx.setVariable("dateHeure", dateHeure);
            String html = templateEngine.process("email/alerte-connexion", ctx);
            envoyer(destinataire, "Alerte sécurité — Tentatives de connexion suspectes", html);
        } catch (Exception e) {
            log.error("Erreur envoi alerte connexion à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerCompteSuspendu(String destinataire, String prenom, String motif) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            ctx.setVariable("motif", motif);
            String html = templateEngine.process("email/compte-suspendu", ctx);
            envoyer(destinataire, "Votre compte ImmoCam a été suspendu", html);
        } catch (Exception e) {
            log.error("Erreur envoi compte suspendu à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    @Override
    public void envoyerCompteReactive(String destinataire, String prenom) {
        try {
            Context ctx = new Context();
            ctx.setVariable("prenom", prenom);
            String html = templateEngine.process("email/compte-reactive", ctx);
            envoyer(destinataire, "Votre compte ImmoCam a été réactivé", html);
        } catch (Exception e) {
            log.error("Erreur envoi compte réactivé à {} : {}", destinataire, e.getMessage());
        }
    }

    /** Envoi SMTP commun à tous les emails. */
    private void envoyer(String destinataire, String sujet, String html) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail, fromName);
        helper.setTo(destinataire);
        helper.setSubject(sujet);
        helper.setText(html, true);
        mailSender.send(message);
        log.info("Email envoyé à {} : {}", destinataire, sujet);
    }
}
