// package com.mbem.immocam.integration;

// import com.mbem.immocam.module.annonce.entity.Annonce;
// import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
// import com.mbem.immocam.module.localisation.entity.Localisation;
// import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
// import com.mbem.immocam.module.typebien.entity.TypeBien;
// import com.mbem.immocam.module.typebien.repository.TypeBienRepository;
// import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
// import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
// import com.mbem.immocam.shared.enums.RoleUtilisateur;
// import com.mbem.immocam.shared.enums.StatutAnnonce;
// import com.mbem.immocam.shared.enums.StatutCompte;
// import org.junit.jupiter.api.DisplayName;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.PageRequest;
// import org.springframework.test.context.ActiveProfiles;

// import java.math.BigDecimal;
// import java.time.LocalDateTime;

// import static org.assertj.core.api.Assertions.assertThat;

// /**
//  * Tests d'intégration des repositories JPA avec H2 en mémoire.
//  * Flyway désactivé, DDL géré par Hibernate (ddl-auto: create-drop).
//  *
//  * @author MBEMNOVA
//  */
// @DataJpaTest
// @ActiveProfiles("test")
// class AnnonceRepositoryIntegrationTest {

//     @Autowired AnnonceRepository annonceRepository;
//     @Autowired UtilisateurRepository utilisateurRepository;
//     @Autowired TypeBienRepository typeBienRepository;
//     @Autowired LocalisationRepository localisationRepository;

//     @Test
//     @DisplayName("Sauvegarde et récupération d'une annonce")
//     void sauvegarder_etRecuperer_annonce() {
//         Utilisateur u = utilisateurRepository.save(Utilisateur.builder()
//             .prenom("Franck").nom("Junior").email("franck@test.cm")
//             .telephone("+237691234567").ville("Douala")
//             .motDePasseHash("hash").politiqueAcceptee(true)
//             .role(RoleUtilisateur.UTILISATEUR).statut(StatutCompte.ACTIF).build());

//         TypeBien tb = typeBienRepository.save(
//             TypeBien.builder().libelle("Appartement").estActif(true).build());

//         Localisation loc = localisationRepository.save(
//             Localisation.builder().ville("Douala").quartier("Akwa").estActive(true).build());

//         Annonce annonce = annonceRepository.save(Annonce.builder()
//             .description("Belle annonce de test suffisamment longue")
//             .prix(new BigDecimal("150000"))
//             .numeroWhatsApp("+237691234567")
//             .statut(StatutAnnonce.ACTIVE)
//             .proprietaire(u).typeBien(tb).localisation(loc)
//             .dateExpiration(LocalDateTime.now().plusDays(30))
//             .build());

//         assertThat(annonce.getId()).isNotNull();

//         Page<Annonce> actives = annonceRepository.findByStatutAndDeletedFalse(
//             StatutAnnonce.ACTIVE, PageRequest.of(0, 10));
//         assertThat(actives.getContent()).hasSize(1);
//         assertThat(actives.getContent().get(0).getPrix())
//             .isEqualByComparingTo(new BigDecimal("150000"));
//     }

//     @Test
//     @DisplayName("Compte les annonces actives d'un propriétaire")
//     void compterAnnoncesActives_parProprietaire() {
//         Utilisateur u = utilisateurRepository.save(Utilisateur.builder()
//             .prenom("Test").nom("User").email("u@test.cm")
//             .telephone("+237691111111").ville("Yaoundé")
//             .motDePasseHash("hash").politiqueAcceptee(true)
//             .role(RoleUtilisateur.UTILISATEUR).statut(StatutCompte.ACTIF).build());

//         TypeBien tb = typeBienRepository.save(
//             TypeBien.builder().libelle("Studio").estActif(true).build());
//         Localisation loc = localisationRepository.save(
//             Localisation.builder().ville("Yaoundé").estActive(true).build());

//         for (int i = 0; i < 3; i++) {
//             annonceRepository.save(Annonce.builder()
//                 .description("Description test numéro " + i + " suffisamment longue pour valider")
//                 .prix(new BigDecimal("50000"))
//                 .numeroWhatsApp("+237691111111")
//                 .statut(StatutAnnonce.ACTIVE)
//                 .proprietaire(u).typeBien(tb).localisation(loc)
//                 .dateExpiration(LocalDateTime.now().plusDays(30))
//                 .build());
//         }

//         long count = annonceRepository
//             .countByProprietaireIdAndStatutAndDeletedFalse(u.getId(), StatutAnnonce.ACTIVE);
//         assertThat(count).isEqualTo(3);
//     }
// }
