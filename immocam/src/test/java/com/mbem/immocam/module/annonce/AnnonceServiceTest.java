package com.mbem.immocam.module.annonce;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.email.service.EmailService;
import com.mbem.immocam.infrastructure.exception.custom.LimiteAtteintException;
import com.mbem.immocam.module.annonce.dto.request.PublierAnnonceRequest;
import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.mapper.AnnonceMapper;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.annonce.service.AnnonceServiceImpl;
import com.mbem.immocam.module.commentaire.repository.CommentaireRepository;
import com.mbem.immocam.module.config.repository.ConfigSystemeRepository;
import com.mbem.immocam.module.contact.repository.ContactWhatsAppRepository;
import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
import com.mbem.immocam.module.photo.repository.PhotoRepository;
import com.mbem.immocam.module.typebien.entity.TypeBien;
import com.mbem.immocam.module.typebien.repository.TypeBienRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.RoleUtilisateur;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.enums.StatutCompte;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de AnnonceServiceImpl.
 *
 * @author MBEMNOVA
 */
@ExtendWith(MockitoExtension.class)
class AnnonceServiceTest {

    @Mock AnnonceRepository annonceRepository;
    @Mock UtilisateurRepository utilisateurRepository;
    @Mock TypeBienRepository typeBienRepository;
    @Mock LocalisationRepository localisationRepository;
    @Mock PhotoRepository photoRepository;
    @Mock CommentaireRepository commentaireRepository;
    @Mock ContactWhatsAppRepository contactRepository;
    @Mock ConfigSystemeRepository configRepository;
    @Mock AnnonceMapper annonceMapper;
    @Mock EmailService emailService;
    @Mock LogActiviteService logActiviteService;

    @InjectMocks AnnonceServiceImpl annonceService;

    private Utilisateur utilisateurTest() {
        return Utilisateur.builder()
                .prenom("Test").nom("User").email("test@cm")
                .telephone("+237691234567").ville("Douala")
                .role(RoleUtilisateur.UTILISATEUR)
                .statut(StatutCompte.ACTIF)
                .build();
    }

    @Test
    @DisplayName("Limite 5 annonces — lève LimiteAtteintException")
    void publier_limiteAtteinte_leveException() {
        Long proprietaireId = 1L;
        Utilisateur u = utilisateurTest();
        ReflectionTestUtils.setField(u, "id", proprietaireId);

        PublierAnnonceRequest req = new PublierAnnonceRequest();
        req.setTypeBienId(1L); req.setLocalisationId(1L);
        req.setDescription("Description suffisamment longue pour la validation du test");
        req.setPrix(new BigDecimal("50000"));
        req.setNumeroWhatsApp("+237691234567");

        when(utilisateurRepository.findById(proprietaireId)).thenReturn(Optional.of(u));
        when(typeBienRepository.findById(1L))
            .thenReturn(Optional.of(TypeBien.builder().libelle("Appartement").build()));
        when(localisationRepository.findById(1L))
            .thenReturn(Optional.of(Localisation.builder().ville("Douala").build()));
        when(configRepository.findByCle("MAX_ANNONCES_PAR_PROPRIO")).thenReturn(Optional.empty());
        // Simuler que la limite est atteinte (5 annonces actives)
        when(annonceRepository.countByProprietaireIdAndStatutAndDeletedFalse(
            proprietaireId, StatutAnnonce.ACTIVE)).thenReturn(5L);

        assertThatThrownBy(() -> annonceService.publier(req, proprietaireId, "127.0.0.1"))
            .isInstanceOf(LimiteAtteintException.class)
            .hasMessageContaining("limite");
    }

    @Test
    @DisplayName("Accès refusé — modifier une annonce qui n'appartient pas à l'utilisateur")
    void modifier_pasProprio_leveAccesRefuse() {
        Long annonceId = 1L; Long autreUserId = 99L;
        Utilisateur vrai = utilisateurTest();
        ReflectionTestUtils.setField(vrai, "id", 1L);
        Annonce annonce = Annonce.builder()
                .proprietaire(vrai).statut(StatutAnnonce.ACTIVE).build();
        ReflectionTestUtils.setField(annonce, "id", annonceId);

        when(annonceRepository.findById(annonceId)).thenReturn(Optional.of(annonce));

        assertThatThrownBy(() -> annonceService.mettreEnPause(annonceId, autreUserId))
            .isInstanceOf(com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException.class);
    }
}
