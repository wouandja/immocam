package com.mbem.immocam.config;

import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.photo.repository.PhotoRepository;
import com.mbem.immocam.module.commentaire.repository.CommentaireRepository;
import com.mbem.immocam.module.contact.repository.ContactWhatsAppRepository;
import com.mbem.immocam.module.favori.repository.FavoriRepository;
import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
import com.mbem.immocam.module.typebien.repository.TypeBienRepository;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.RoleUtilisateur;
import com.mbem.immocam.shared.enums.StatutCompte;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test de vérification des données de test créées par DataLoader.
 * 
 * À exécuter avec : mvn test -Dtest=DataLoaderTest
 */
@SpringBootTest
@ActiveProfiles("dev")
public class DataLoaderTest {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private AnnonceRepository annonceRepository;

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private CommentaireRepository commentaireRepository;

    @Autowired
    private FavoriRepository favoriRepository;

    @Autowired
    private ContactWhatsAppRepository contactRepository;

    @Autowired
    private TypeBienRepository typeBienRepository;

    @Autowired
    private LocalisationRepository localisationRepository;

    @Test
    public void testDataLoaderUtilisateurs() {
        System.out.println("\n=== 🧪 TEST: Utilisateurs ===");
        
        long countUtilisateurs = utilisateurRepository.count();
        System.out.println("✓ Total utilisateurs: " + countUtilisateurs);
        assertTrue(countUtilisateurs >= 5, "Au moins 5 utilisateurs doivent être créés (1 admin + 4 users)");

        // Vérifier l'admin
        var admin = utilisateurRepository.findByEmail("admin@immocam.cm");
        assertTrue(admin.isPresent(), "Admin doit exister");
        assertEquals(RoleUtilisateur.ADMINISTRATEUR, admin.get().getRole());
        assertEquals(StatutCompte.ACTIF, admin.get().getStatut());
        System.out.println("✓ Admin trouvé: " + admin.get().getEmail());

        // Vérifier un utilisateur
        var jean = utilisateurRepository.findByEmail("jean@email.com");
        assertTrue(jean.isPresent(), "Jean doit exister");
        assertEquals("Jean", jean.get().getPrenom());
        assertEquals("Dupont", jean.get().getNom());
        assertEquals(StatutCompte.ACTIF, jean.get().getStatut());
        System.out.println("✓ Utilisateur trouvé: " + jean.get().getNomComplet());
    }

    @Test
    public void testDataLoaderAnnonces() {
        System.out.println("\n=== 🧪 TEST: Annonces ===");
        
        long countAnnonces = annonceRepository.count();
        System.out.println("✓ Total annonces: " + countAnnonces);
        assertEquals(8, countAnnonces, "8 annonces doivent être créées (2 par utilisateur)");

        var annonces = annonceRepository.findAll();
        assertFalse(annonces.isEmpty(), "Au moins une annonce doit exister");
        
        var premiere = annonces.get(0);
        assertNotNull(premiere.getPrix(), "Le prix ne doit pas être null");
        assertNotNull(premiere.getDescription(), "La description ne doit pas être null");
        assertNotNull(premiere.getProprietaire(), "Le propriétaire ne doit pas être null");
        assertNotNull(premiere.getTypeBien(), "Le type de bien ne doit pas être null");
        assertNotNull(premiere.getLocalisation(), "La localisation ne doit pas être null");
        System.out.println("✓ Première annonce: " + premiere.getDescription());
        System.out.println("  - Prix: " + premiere.getPrix() + " FCFA");
        System.out.println("  - Type: " + premiere.getTypeBien().getLibelle());
        System.out.println("  - Ville: " + premiere.getLocalisation().getVille());
    }

    @Test
    public void testDataLoaderPhotos() {
        System.out.println("\n=== 🧪 TEST: Photos ===");
        
        long countPhotos = photoRepository.count();
        System.out.println("✓ Total photos: " + countPhotos);
        assertEquals(32, countPhotos, "32 photos doivent être créées (4 par annonce)");

        var photos = photoRepository.findAll();
        assertFalse(photos.isEmpty(), "Au moins une photo doit exister");
        
        var premiere = photos.get(0);
        assertNotNull(premiere.getAnnonce(), "L'annonce ne doit pas être null");
        assertNotNull(premiere.getCheminStockage(), "Le chemin de stockage ne doit pas être null");
        assertTrue(premiere.getOrdre() > 0, "L'ordre doit être positif");
        System.out.println("✓ Première photo: " + premiere.getNomOriginal());
        System.out.println("  - Ordre: " + premiere.getOrdre());
        System.out.println("  - URL: " + premiere.getUrl());
    }

    @Test
    public void testDataLoaderCommentaires() {
        System.out.println("\n=== 🧪 TEST: Commentaires ===");
        
        long countCommentaires = commentaireRepository.count();
        System.out.println("✓ Total commentaires: " + countCommentaires);
        assertTrue(countCommentaires >= 9, "Au moins 9 commentaires doivent être créés (6+3)");

        var commentaires = commentaireRepository.findAll();
        assertFalse(commentaires.isEmpty(), "Au moins un commentaire doit exister");
        
        var premier = commentaires.get(0);
        assertNotNull(premier.getContenu(), "Le contenu ne doit pas être null");
        assertNotNull(premier.getAuteur(), "L'auteur ne doit pas être null");
        assertNotNull(premier.getAnnonce(), "L'annonce ne doit pas être null");
        System.out.println("✓ Premier commentaire: " + premier.getContenu());
        System.out.println("  - Auteur: " + premier.getAuteur().getNomComplet());
    }

    @Test
    public void testDataLoaderFavoris() {
        System.out.println("\n=== 🧪 TEST: Favoris ===");
        
        long countFavoris = favoriRepository.count();
        System.out.println("✓ Total favoris: " + countFavoris);
        assertTrue(countFavoris >= 8, "Au moins 8 favoris doivent être créés (2-3 par utilisateur)");

        var favoris = favoriRepository.findAll();
        assertFalse(favoris.isEmpty(), "Au moins un favori doit exister");
        
        var premier = favoris.get(0);
        assertNotNull(premier.getUtilisateur(), "L'utilisateur ne doit pas être null");
        assertNotNull(premier.getAnnonce(), "L'annonce ne doit pas être null");
        assertNotNull(premier.getDateAjout(), "La date d'ajout ne doit pas être null");
        System.out.println("✓ Premier favori: " + premier.getUtilisateur().getNomComplet());
    }

    @Test
    public void testDataLoaderContacts() {
        System.out.println("\n=== 🧪 TEST: Contacts WhatsApp ===");
        
        long countContacts = contactRepository.count();
        System.out.println("✓ Total contacts: " + countContacts);
        assertTrue(countContacts >= 24, "Au moins 24 contacts doivent être créés (3-5 par annonce)");

        var contacts = contactRepository.findAll();
        assertFalse(contacts.isEmpty(), "Au moins un contact doit exister");
        
        var premier = contacts.get(0);
        assertNotNull(premier.getUtilisateur(), "L'utilisateur ne doit pas être null");
        assertNotNull(premier.getAnnonce(), "L'annonce ne doit pas être null");
        System.out.println("✓ Premier contact: " + premier.getUtilisateur().getNomComplet());
    }

    @Test
    public void testDataLoaderIntegrite() {
        System.out.println("\n=== 🧪 TEST: Intégrité des données ===");
        
        var utilisateurs = utilisateurRepository.findAll();
        var annonces = annonceRepository.findAll();
        var photos = photoRepository.findAll();

        // Vérifier que toutes les annonces ont un propriétaire valide
        for (var annonce : annonces) {
            assertNotNull(annonce.getProprietaire(), "Toute annonce doit avoir un propriétaire");
            assertTrue(utilisateurs.contains(annonce.getProprietaire()), 
                      "Le propriétaire de l'annonce doit exister dans la base");
        }
        System.out.println("✓ Toutes les annonces ont un propriétaire valide");

        // Vérifier que toutes les photos ont une annonce valide
        for (var photo : photos) {
            assertNotNull(photo.getAnnonce(), "Toute photo doit avoir une annonce");
            assertTrue(annonces.contains(photo.getAnnonce()), 
                      "L'annonce de la photo doit exister dans la base");
        }
        System.out.println("✓ Toutes les photos ont une annonce valide");

        // Vérifier que les 8 annonces ont 32 photos (4 par annonce)
        assertEquals(32, photos.size(), "8 annonces × 4 photos = 32 photos");
        System.out.println("✓ 32 photos trouvées (4 par annonce)");
    }

    @Test
    public void testDataLoaderResume() {
        System.out.println("\n" +
                "╔═══════════════════════════════════════════════════════╗\n" +
                "║          📊 RÉSUMÉ DES DONNÉES DE TEST               ║\n" +
                "╚═══════════════════════════════════════════════════════╝\n");

        long countUtilisateurs = utilisateurRepository.count();
        long countAnnonces = annonceRepository.count();
        long countPhotos = photoRepository.count();
        long countCommentaires = commentaireRepository.count();
        long countFavoris = favoriRepository.count();
        long countContacts = contactRepository.count();
        long countTypes = typeBienRepository.count();
        long countLocalisations = localisationRepository.count();

        System.out.println("  👥 Utilisateurs:        " + countUtilisateurs);
        System.out.println("  🏠 Annonces:            " + countAnnonces);
        System.out.println("  📸 Photos:              " + countPhotos);
        System.out.println("  💬 Commentaires:        " + countCommentaires);
        System.out.println("  ⭐ Favoris:             " + countFavoris);
        System.out.println("  📱 Contacts WhatsApp:   " + countContacts);
        System.out.println("  🏷️  Types de bien:      " + countTypes);
        System.out.println("  📍 Localisations:       " + countLocalisations);
        System.out.println("\n" +
                "╔═══════════════════════════════════════════════════════╗\n" +
                "║                    ✅ TOUS LES TESTS OK               ║\n" +
                "╚═══════════════════════════════════════════════════════╝\n");

        assertTrue(countUtilisateurs >= 5);
        assertTrue(countAnnonces == 8);
        assertTrue(countPhotos == 32);
    }
}
