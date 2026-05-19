package com.mbem.immocam.config;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.entity.Photo;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.photo.repository.PhotoRepository;
import com.mbem.immocam.module.commentaire.entity.Commentaire;
import com.mbem.immocam.module.commentaire.repository.CommentaireRepository;
import com.mbem.immocam.module.contact.entity.ContactWhatsApp;
import com.mbem.immocam.module.contact.repository.ContactWhatsAppRepository;
import com.mbem.immocam.module.favori.entity.Favori;
import com.mbem.immocam.module.favori.repository.FavoriRepository;
import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
import com.mbem.immocam.module.typebien.entity.TypeBien;
import com.mbem.immocam.module.typebien.repository.TypeBienRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.RoleUtilisateur;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.enums.StatutCompte;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * Chargeur de données de test pour ImmoCam.
 *
 * Exécuté au démarrage de l'application si le profil 'test-data' est activé.
 * Crée des utilisateurs, annonces, photos, commentaires, favoris et contacts de
 * test.
 *
 * @author MBEMNOVA
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final AnnonceRepository annonceRepository;
    private final PhotoRepository photoRepository;
    private final CommentaireRepository commentaireRepository;
    private final FavoriRepository favoriRepository;
    private final ContactWhatsAppRepository contactRepository;
    private final TypeBienRepository typeBienRepository;
    private final LocalisationRepository localisationRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.test-data.enabled:false}")
    private boolean testDataEnabled;

    @Override
    public void run(String... args) {
        if (!testDataEnabled) {
            log.info("Chargement des données de test désactivé");
            return;
        }

        log.info("Début du chargement des données de test...");

        try {
            chargerDonneesTest();
            log.info("Données de test chargées avec succès");
        } catch (Exception e) {
            log.error("Erreur lors du chargement des données de test", e);
        }
    }

    @Transactional
    public void chargerDonneesTest() {
        // Supprimer toutes les données existantes
        log.info("Suppression des données existantes...");
        utilisateurRepository.deleteAll();
        annonceRepository.deleteAll();
        photoRepository.deleteAll();
        commentaireRepository.deleteAll();
        favoriRepository.deleteAll();
        contactRepository.deleteAll();
        typeBienRepository.deleteAll();
        localisationRepository.deleteAll();
        log.info("Données supprimées");

        // Créer l'administrateur
        creerAdministrateur();

        // Créer les utilisateurs
        List<Utilisateur> utilisateurs = creerUtilisateurs();

        // Créer les annonces avec photos
        creerAnnonces(utilisateurs);

        // Créer commentaires
        creerCommentaires(utilisateurs);

        // Créer favoris
        creerFavoris(utilisateurs);

        // Créer contacts WhatsApp
        creerContacts(utilisateurs);
    }

    private Utilisateur creerAdministrateur() {
        Utilisateur admin = Utilisateur.builder()
                .prenom("Admin")
                .nom("ImmoCam")
                .email("admin@immocam.cm")
                .telephone("+237690000000")
                .motDePasseHash(passwordEncoder.encode("Admin123"))
                .ville("Yaounde")
                .role(RoleUtilisateur.ADMINISTRATEUR)
                .statut(StatutCompte.ACTIF)
                .politiqueAcceptee(true)
                .dateAcceptationPolitique(LocalDateTime.now())
                .build();

        return utilisateurRepository.save(admin);
    }

    private List<Utilisateur> creerUtilisateurs() {
        List<Utilisateur> utilisateurs = Arrays.asList(
                Utilisateur.builder()
                        .prenom("Jean")
                        .nom("Dupont")
                        .email("jean@email.com")
                        .telephone("+237691111111")
                        .motDePasseHash(passwordEncoder.encode("User123"))
                        .ville("Douala")
                        .role(RoleUtilisateur.UTILISATEUR)
                        .statut(StatutCompte.ACTIF)
                        .politiqueAcceptee(true)
                        .dateAcceptationPolitique(LocalDateTime.now())
                        .build(),
                Utilisateur.builder()
                        .prenom("Marie")
                        .nom("Kamga")
                        .email("marie@email.com")
                        .telephone("+237692222222")
                        .motDePasseHash(passwordEncoder.encode("User123"))
                        .ville("Yaounde")
                        .role(RoleUtilisateur.UTILISATEUR)
                        .statut(StatutCompte.ACTIF)
                        .politiqueAcceptee(true)
                        .dateAcceptationPolitique(LocalDateTime.now())
                        .build(),
                Utilisateur.builder()
                        .prenom("Paul")
                        .nom("Mbarga")
                        .email("paul@email.com")
                        .telephone("+237693333333")
                        .motDePasseHash(passwordEncoder.encode("User123"))
                        .ville("Douala")
                        .role(RoleUtilisateur.UTILISATEUR)
                        .statut(StatutCompte.ACTIF)
                        .politiqueAcceptee(true)
                        .dateAcceptationPolitique(LocalDateTime.now())
                        .build(),
                Utilisateur.builder()
                        .prenom("Claire")
                        .nom("Ndom")
                        .email("claire@email.com")
                        .telephone("+237694444444")
                        .motDePasseHash(passwordEncoder.encode("User123"))
                        .ville("Yaounde")
                        .role(RoleUtilisateur.UTILISATEUR)
                        .statut(StatutCompte.ACTIF)
                        .politiqueAcceptee(true)
                        .dateAcceptationPolitique(LocalDateTime.now())
                        .build());

        return utilisateurRepository.saveAll(utilisateurs);
    }

    private void creerAnnonces(List<Utilisateur> utilisateurs) {
        // Récupérer les types de bien et localisations
        List<TypeBien> typesBien = typeBienRepository.findAll();
        List<Localisation> localisations = localisationRepository.findAll();

        if (typesBien.isEmpty() || localisations.isEmpty()) {
            log.warn("Types de bien ou localisations non trouvés, skipping création annonces");
            return;
        }

        // Créer 2 annonces par utilisateur
        int annonceIndex = 0;
        for (Utilisateur utilisateur : utilisateurs) {
            for (int i = 0; i < 2; i++) {
                TypeBien typeBien = typesBien.get(annonceIndex % typesBien.size());
                Localisation localisation = localisations.get(annonceIndex % localisations.size());

                Annonce annonce = Annonce.builder()
                        .description("Belle " + typeBien.getLibelle() + " à " + localisation.getVille() +
                                ". Idéalement située, toutes commodités à proximité.")
                        .prix(BigDecimal.valueOf(50000 + (annonceIndex * 25000))) // 50k à 500k
                        .numeroWhatsApp(utilisateur.getTelephone())
                        .statut(StatutAnnonce.ACTIVE)
                        .dateExpiration(LocalDateTime.now().plusDays(30))
                        .datePublication(LocalDateTime.now().minusDays(annonceIndex))
                        .proprietaire(utilisateur)
                        .typeBien(typeBien)
                        .localisation(localisation)
                        .build();

                annonce = annonceRepository.save(annonce);

                // Créer 4 photos par annonce
                creerPhotosPourAnnonce(annonce, annonceIndex);

                annonceIndex++;
            }
        }
    }

    private void creerPhotosPourAnnonce(Annonce annonce, int annonceIndex) {
        String[] urls = {
                "https://picsum.photos/800/600?random=" + (annonceIndex * 4 + 1),
                "https://picsum.photos/800/600?random=" + (annonceIndex * 4 + 2),
                "https://picsum.photos/800/600?random=" + (annonceIndex * 4 + 3),
                "https://picsum.photos/800/600?random=" + (annonceIndex * 4 + 4)
        };

        for (int i = 0; i < urls.length; i++) {
            String cheminStockage = String.format("annonces/%d/%02d/%d_%s.jpg",
                    LocalDateTime.now().getYear(),
                    LocalDateTime.now().getMonthValue(),
                    annonce.getId(),
                    "photo_" + (i + 1));

            Photo photo = Photo.builder()
                    .cheminStockage(cheminStockage)
                    .url("http://localhost:8080/uploads/" + cheminStockage)
                    .urlThumb("http://localhost:8080/uploads/thumbs/" + cheminStockage)
                    .nomOriginal("photo_" + (i + 1) + ".jpg")
                    .ordre(i + 1)
                    .principale(i == 0)
                    .tailleOctets(102400L) // 100KB simulé
                    .annonce(annonce)
                    .build();

            photoRepository.save(photo);
        }
    }

    private void creerCommentaires(List<Utilisateur> utilisateurs) {
        List<Annonce> annonces = annonceRepository.findAll();

        if (annonces.isEmpty())
            return;

        // Annonce 1 : 6 commentaires (3 normaux + 3 réponses)
        creerCommentairesPourAnnonce(annonces.get(0), utilisateurs, 6);

        // Annonce 2 : 3 commentaires
        creerCommentairesPourAnnonce(annonces.get(1), utilisateurs, 3);

        // Annonce 3 : 0 commentaires

        // Autres annonces : 1 ou 2 commentaires
        for (int i = 3; i < annonces.size(); i++) {
            int nbCommentaires = (i % 2) + 1;
            creerCommentairesPourAnnonce(annonces.get(i), utilisateurs, nbCommentaires);
        }
    }

    private void creerCommentairesPourAnnonce(Annonce annonce, List<Utilisateur> utilisateurs, int nbCommentaires) {
        for (int i = 0; i < nbCommentaires; i++) {
            Utilisateur auteur = utilisateurs.get(i % utilisateurs.size());

            Commentaire commentaire = Commentaire.builder()
                    .contenu("Très belle annonce ! Intéressé par plus de détails.")
                    .auteur(auteur)
                    .annonce(annonce)
                    .build();

            commentaireRepository.save(commentaire);
        }
    }

    private void creerFavoris(List<Utilisateur> utilisateurs) {
        List<Annonce> annonces = annonceRepository.findAll();

        if (annonces.isEmpty())
            return;

        // Chaque utilisateur ajoute 2-3 annonces d'autres utilisateurs en favoris
        for (Utilisateur utilisateur : utilisateurs) {
            int nbFavoris = 2 + (utilisateur.getId().intValue() % 2); // 2 ou 3

            for (int i = 0; i < nbFavoris; i++) {
                // Choisir une annonce d'un autre utilisateur
                Annonce annonce = annonces.get((utilisateur.getId().intValue() + i) % annonces.size());

                if (!annonce.getProprietaire().getId().equals(utilisateur.getId())) {
                    Favori favori = Favori.builder()
                            .utilisateur(utilisateur)
                            .annonce(annonce)
                            .dateAjout(LocalDateTime.now())
                            .build();

                    favoriRepository.save(favori);
                }
            }
        }
    }

    private void creerContacts(List<Utilisateur> utilisateurs) {
        List<Annonce> annonces = annonceRepository.findAll();

        if (annonces.isEmpty())
            return;

        // Simuler 3-5 contacts par annonce
        for (Annonce annonce : annonces) {
            int nbContacts = 3 + (annonce.getId().intValue() % 3); // 3, 4 ou 5

            for (int i = 0; i < nbContacts; i++) {
                Utilisateur contacteur = utilisateurs.get(i % utilisateurs.size());

                ContactWhatsApp contact = ContactWhatsApp.builder()
                        .utilisateur(contacteur)
                        .annonce(annonce)
                        .telephoneContact(contacteur.getTelephone())
                        .build();

                contactRepository.save(contact);
            }
        }
    }
}