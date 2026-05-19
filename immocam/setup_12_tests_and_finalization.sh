#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — SCRIPT 12 : TESTS + FINALISATION
# =============================================================================
# Rôle     : Génère les tests unitaires et d'intégration, les scripts de
#            démarrage/déploiement et valide la cohérence du projet :
#            - Tests unitaires : AuthServiceTest, AnnonceServiceTest,
#              JwtServiceTest, StorageServiceTest, PhoneUtilsTest
#            - Test d'intégration : AnnonceRepositoryIntegrationTest
#            - run.sh       — démarrage rapide local (dev)
#            - deploy.sh    — déploiement VPS (prod)
#            - healthcheck.sh — vérification santé du serveur
#
# Exécuter : Depuis la RACINE du projet
#            bash setup_12_tests_and_finalization.sh
# Prérequis: Scripts 01 à 11 exécutés
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
WARN()    { echo -e "${YELLOW}[!]${NC} $1"; }
ERROR()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; \
            echo -e "${CYAN}  $1${NC}"; \
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

[[ -f "pom.xml" ]] || ERROR "pom.xml introuvable. Lancez depuis la racine du projet."

SECTION "SCRIPT 12 — TESTS + FINALISATION"
INFO "Répertoire courant : $(pwd)"

TEST="src/test/java/com/mbem/immocam"
mkdir -p "$TEST/module/auth"
mkdir -p "$TEST/module/annonce"
mkdir -p "$TEST/infrastructure/security"
mkdir -p "$TEST/infrastructure/storage"
mkdir -p "$TEST/shared/utils"
mkdir -p "$TEST/integration"

# =============================================================================
# 1. Tests unitaires — JwtServiceTest
# =============================================================================
SECTION "1/6 — JwtServiceTest"

cat > "$TEST/infrastructure/security/JwtServiceTest.java" << 'EOF'
package com.mbem.immocam.infrastructure.security;

import com.mbem.immocam.infrastructure.security.jwt.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests unitaires de JwtService.
 * Aucune dépendance Spring — instanciation directe.
 *
 * @author MBEMNOVA
 */
class JwtServiceTest {

    private JwtService jwtService;

    private static final Long   USER_ID = 42L;
    private static final String EMAIL   = "test@immocam.cm";
    private static final String ROLE    = "ROLE_UTILISATEUR";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret",
            "test-secret-key-minimum-32-characters-for-hmac-sha256-signing-key");
        ReflectionTestUtils.setField(jwtService, "accessExpirationMs",  3_600_000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpirationMs", 86_400_000L);
    }

    @Test
    @DisplayName("Génère un access token valide et extractible")
    void genererAccessToken_retourneTokenValide() {
        String token = jwtService.genererAccessToken(USER_ID, EMAIL, ROLE);

        assertThat(token).isNotBlank();
        assertThat(jwtService.estValide(token)).isTrue();
        assertThat(jwtService.estAccessToken(token)).isTrue();
        assertThat(jwtService.extraireEmail(token)).isEqualTo(EMAIL);
        assertThat(jwtService.extraireUserId(token)).isEqualTo(USER_ID);
    }

    @Test
    @DisplayName("Génère un refresh token — n'est pas un access token")
    void genererRefreshToken_nEstPasUnAccessToken() {
        String refresh = jwtService.genererRefreshToken(USER_ID, EMAIL);

        assertThat(refresh).isNotBlank();
        assertThat(jwtService.estValide(refresh)).isTrue();
        assertThat(jwtService.estAccessToken(refresh)).isFalse();
    }

    @Test
    @DisplayName("Token invalide (modifié) est rejeté")
    void tokenModifie_estInvalide() {
        String token = jwtService.genererAccessToken(USER_ID, EMAIL, ROLE);
        String tokenModifie = token.substring(0, token.length() - 5) + "XXXXX";

        assertThat(jwtService.estValide(tokenModifie)).isFalse();
    }

    @Test
    @DisplayName("Token expiré est rejeté")
    void tokenExpire_estInvalide() throws Exception {
        ReflectionTestUtils.setField(jwtService, "accessExpirationMs", 1L);
        String token = jwtService.genererAccessToken(USER_ID, EMAIL, ROLE);
        Thread.sleep(10);

        assertThat(jwtService.estValide(token)).isFalse();
    }
}
EOF
OK "JwtServiceTest.java généré"

# =============================================================================
# 2. Tests unitaires — PhoneUtilsTest
# =============================================================================
SECTION "2/6 — PhoneUtilsTest"

cat > "$TEST/shared/utils/PhoneUtilsTest.java" << 'EOF'
package com.mbem.immocam.shared.utils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests unitaires de PhoneUtils.
 *
 * @author MBEMNOVA
 */
class PhoneUtilsTest {

    @Test
    @DisplayName("Normalise un numéro à 9 chiffres")
    void normaliser_neufChiffres() {
        assertThat(PhoneUtils.normaliser("691234567")).isEqualTo("+237691234567");
    }

    @Test
    @DisplayName("Normalise un numéro avec 0 en tête")
    void normaliser_avecZero() {
        assertThat(PhoneUtils.normaliser("0691234567")).isEqualTo("+237691234567");
    }

    @Test
    @DisplayName("Conserve un numéro déjà au format international")
    void normaliser_dejaInternational() {
        assertThat(PhoneUtils.normaliser("+237691234567")).isEqualTo("+237691234567");
    }

    @ParameterizedTest
    @DisplayName("Normalise avec espaces et tirets")
    @ValueSource(strings = {"+237 691 234 567", "+237-691-234-567", "+237 691234567"})
    void normaliser_avecSeparateurs(String input) {
        assertThat(PhoneUtils.normaliser(input)).isEqualTo("+237691234567");
    }

    @Test
    @DisplayName("Lève une exception pour un format inconnu")
    void normaliser_formatInconnu_leveException() {
        assertThatThrownBy(() -> PhoneUtils.normaliser("12345"))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Construit un lien wa.me correct")
    void construireLienWhatsApp_retourneLienValide() {
        String lien = PhoneUtils.construireLienWhatsApp("+237691234567", "Bonjour test");
        assertThat(lien).startsWith("https://wa.me/237691234567?text=");
        assertThat(lien).doesNotContain("+237"); // le + est retiré pour wa.me
    }

    @Test
    @DisplayName("Masque correctement un numéro")
    void masquer_retourneNumeroPartiellementMasque() {
        String masque = PhoneUtils.masquer("+237691234567");
        assertThat(masque).isEqualTo("+237 *** **** 567");
        assertThat(masque).doesNotContain("234");
    }
}
EOF
OK "PhoneUtilsTest.java généré"

# =============================================================================
# 3. Tests unitaires — AuthServiceTest
# =============================================================================
SECTION "3/6 — AuthServiceTest"

cat > "$TEST/module/auth/AuthServiceTest.java" << 'EOF'
package com.mbem.immocam.module.auth;

import com.mbem.immocam.infrastructure.audit.LogActiviteService;
import com.mbem.immocam.infrastructure.email.service.EmailService;
import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.infrastructure.security.jwt.JwtService;
import com.mbem.immocam.module.auth.dto.request.RegisterRequest;
import com.mbem.immocam.module.auth.dto.response.AuthResponse;
import com.mbem.immocam.module.auth.entity.CodeValidation;
import com.mbem.immocam.module.auth.repository.CodeValidationRepository;
import com.mbem.immocam.module.auth.repository.TokenReinitialisationRepository;
import com.mbem.immocam.module.auth.service.AuthServiceImpl;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.RoleUtilisateur;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de AuthServiceImpl.
 * Toutes les dépendances sont mockées avec Mockito.
 *
 * @author MBEMNOVA
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UtilisateurRepository utilisateurRepository;
    @Mock CodeValidationRepository codeValidationRepository;
    @Mock TokenReinitialisationRepository tokenReinitialisationRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock AuthenticationManager authenticationManager;
    @Mock EmailService emailService;
    @Mock LogActiviteService logActiviteService;

    @InjectMocks AuthServiceImpl authService;

    @Test
    @DisplayName("Inscription réussie — retourne l'utilisateur et envoie l'OTP")
    void inscrire_succes_envoieOtpEtRetourneInfos() {
        ReflectionTestUtils.setField(authService, "otpExpirationMinutes", 10);
        RegisterRequest req = new RegisterRequest();
        req.setPrenom("Franck");
        req.setNom("Junior");
        req.setEmail("franck@example.cm");
        req.setTelephone("+237691234567");
        req.setVille("Douala");
        req.setMotDePasse("motdepasse123");
        req.setConfirmationMotDePasse("motdepasse123");
        req.setPolitiqueAcceptee(true);

        when(utilisateurRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$hash");
        Utilisateur saved = Utilisateur.builder()
                .prenom("Franck").nom("Junior").email("franck@example.cm")
                .role(RoleUtilisateur.UTILISATEUR)
                .build();
        ReflectionTestUtils.setField(saved, "id", 1L);
        when(utilisateurRepository.save(any())).thenReturn(saved);
        when(codeValidationRepository.save(any())).thenReturn(new CodeValidation());

        AuthResponse response = authService.inscrire(req, "127.0.0.1");

        assertThat(response).isNotNull();
        verify(emailService).envoyerCodeValidation(anyString(), anyString(), anyString());
        verify(utilisateurRepository).save(any(Utilisateur.class));
    }

    @Test
    @DisplayName("Inscription échoue — email déjà utilisé")
    void inscrire_emailExistant_leveDoublonException() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("existant@immocam.cm");
        req.setPolitiqueAcceptee(true);
        req.setMotDePasse("abc12345");
        req.setConfirmationMotDePasse("abc12345");

        when(utilisateurRepository.existsByEmail(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.inscrire(req, "127.0.0.1"))
            .isInstanceOf(DoublonException.class)
            .hasMessageContaining("compte existe déjà");
    }

    @Test
    @DisplayName("Inscription échoue — politique non acceptée")
    void inscrire_politiqueNonAcceptee_leveException() {
        RegisterRequest req = new RegisterRequest();
        req.setPolitiqueAcceptee(false);

        assertThatThrownBy(() -> authService.inscrire(req, "127.0.0.1"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("politique");
    }

    @Test
    @DisplayName("Inscription échoue — mots de passe différents")
    void inscrire_motDePasseDifferents_leveException() {
        RegisterRequest req = new RegisterRequest();
        req.setPolitiqueAcceptee(true);
        req.setMotDePasse("password123");
        req.setConfirmationMotDePasse("different456");
        when(utilisateurRepository.existsByEmail(any())).thenReturn(false);

        assertThatThrownBy(() -> authService.inscrire(req, "127.0.0.1"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("correspondent pas");
    }
}
EOF
OK "AuthServiceTest.java généré"

# =============================================================================
# 4. Tests unitaires — AnnonceServiceTest
# =============================================================================
SECTION "4/6 — AnnonceServiceTest"

cat > "$TEST/module/annonce/AnnonceServiceTest.java" << 'EOF'
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
EOF
OK "AnnonceServiceTest.java généré"

# =============================================================================
# 5. Test d'intégration — Repository
# =============================================================================
SECTION "5/6 — AnnonceRepositoryIntegrationTest"

cat > "$TEST/integration/AnnonceRepositoryIntegrationTest.java" << 'EOF'
package com.mbem.immocam.integration;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.module.localisation.entity.Localisation;
import com.mbem.immocam.module.localisation.repository.LocalisationRepository;
import com.mbem.immocam.module.typebien.entity.TypeBien;
import com.mbem.immocam.module.typebien.repository.TypeBienRepository;
import com.mbem.immocam.module.utilisateur.entity.Utilisateur;
import com.mbem.immocam.module.utilisateur.repository.UtilisateurRepository;
import com.mbem.immocam.shared.enums.RoleUtilisateur;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import com.mbem.immocam.shared.enums.StatutCompte;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests d'intégration des repositories JPA avec H2 en mémoire.
 * Flyway désactivé, DDL géré par Hibernate (ddl-auto: create-drop).
 *
 * @author MBEMNOVA
 */
@DataJpaTest
@ActiveProfiles("test")
class AnnonceRepositoryIntegrationTest {

    @Autowired AnnonceRepository annonceRepository;
    @Autowired UtilisateurRepository utilisateurRepository;
    @Autowired TypeBienRepository typeBienRepository;
    @Autowired LocalisationRepository localisationRepository;

    @Test
    @DisplayName("Sauvegarde et récupération d'une annonce")
    void sauvegarder_etRecuperer_annonce() {
        Utilisateur u = utilisateurRepository.save(Utilisateur.builder()
            .prenom("Franck").nom("Junior").email("franck@test.cm")
            .telephone("+237691234567").ville("Douala")
            .motDePasseHash("hash").politiqueAcceptee(true)
            .role(RoleUtilisateur.UTILISATEUR).statut(StatutCompte.ACTIF).build());

        TypeBien tb = typeBienRepository.save(
            TypeBien.builder().libelle("Appartement").estActif(true).build());

        Localisation loc = localisationRepository.save(
            Localisation.builder().ville("Douala").quartier("Akwa").estActive(true).build());

        Annonce annonce = annonceRepository.save(Annonce.builder()
            .description("Belle annonce de test suffisamment longue")
            .prix(new BigDecimal("150000"))
            .numeroWhatsApp("+237691234567")
            .statut(StatutAnnonce.ACTIVE)
            .proprietaire(u).typeBien(tb).localisation(loc)
            .dateExpiration(LocalDateTime.now().plusDays(30))
            .build());

        assertThat(annonce.getId()).isNotNull();

        Page<Annonce> actives = annonceRepository.findByStatutAndDeletedFalse(
            StatutAnnonce.ACTIVE, PageRequest.of(0, 10));
        assertThat(actives.getContent()).hasSize(1);
        assertThat(actives.getContent().get(0).getPrix())
            .isEqualByComparingTo(new BigDecimal("150000"));
    }

    @Test
    @DisplayName("Compte les annonces actives d'un propriétaire")
    void compterAnnoncesActives_parProprietaire() {
        Utilisateur u = utilisateurRepository.save(Utilisateur.builder()
            .prenom("Test").nom("User").email("u@test.cm")
            .telephone("+237691111111").ville("Yaoundé")
            .motDePasseHash("hash").politiqueAcceptee(true)
            .role(RoleUtilisateur.UTILISATEUR).statut(StatutCompte.ACTIF).build());

        TypeBien tb = typeBienRepository.save(
            TypeBien.builder().libelle("Studio").estActif(true).build());
        Localisation loc = localisationRepository.save(
            Localisation.builder().ville("Yaoundé").estActive(true).build());

        for (int i = 0; i < 3; i++) {
            annonceRepository.save(Annonce.builder()
                .description("Description test numéro " + i + " suffisamment longue pour valider")
                .prix(new BigDecimal("50000"))
                .numeroWhatsApp("+237691111111")
                .statut(StatutAnnonce.ACTIVE)
                .proprietaire(u).typeBien(tb).localisation(loc)
                .dateExpiration(LocalDateTime.now().plusDays(30))
                .build());
        }

        long count = annonceRepository
            .countByProprietaireIdAndStatutAndDeletedFalse(u.getId(), StatutAnnonce.ACTIVE);
        assertThat(count).isEqualTo(3);
    }
}
EOF
OK "AnnonceRepositoryIntegrationTest.java généré"

# =============================================================================
# 6. Scripts de démarrage et déploiement
# =============================================================================
SECTION "6/6 — Scripts run.sh, deploy.sh, healthcheck.sh"

cat > "run.sh" << 'EOF'
#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — run.sh : Démarrage rapide en développement local
# =============================================================================
# Usage : bash run.sh [--reset-db]
#
# Prérequis :
#   - Java 21 installé
#   - PostgreSQL démarré avec la base immocam_dev créée
#   - Fichier .env présent (copié depuis .env.example)
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'
YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
OK()   { echo -e "${GREEN}[✓]${NC} $1"; }
INFO() { echo -e "${BLUE}[i]${NC} $1"; }
WARN() { echo -e "${YELLOW}[!]${NC} $1"; }

echo -e "${CYAN}"
echo "  ___                       ____"
echo " |_ _|_ __ ___  _ __ ___   / ___|__ _ _ __ ___"
echo "  | || '_ \` _ \| '_ \` _ \ | |   / _\` | '_ \` _ \\"
echo "  | || | | | | | | | | | || |__| (_| | | | | | |"
echo " |___|_| |_| |_|_| |_| |_| \____\__,_|_| |_| |_|"
echo ""
echo -e "${NC}  Plateforme immobilière camerounaise — MBEMNOVA"
echo ""

# Vérifier Java 21
JAVA_VERSION=$(java -version 2>&1 | head -n1 | cut -d'"' -f2 | cut -d'.' -f1)
if [[ "$JAVA_VERSION" -lt 21 ]]; then
    echo -e "${RED}[✗] Java 21+ requis. Version détectée : $JAVA_VERSION${NC}"
    exit 1
fi
OK "Java $JAVA_VERSION détecté"

# Charger les variables d'environnement depuis .env si présent
if [[ -f ".env" ]]; then
    set -a; source .env; set +a
    OK "Variables .env chargées"
else
    WARN ".env non trouvé — utilisation des valeurs par défaut"
fi

# Créer les dossiers nécessaires
mkdir -p uploads/annonces uploads/temp logs
OK "Dossiers uploads/ et logs/ prêts"

# Réinitialiser la base de données si demandé
if [[ "${1:-}" == "--reset-db" ]]; then
    WARN "Réinitialisation de la base de données..."
    psql "${DB_URL:-jdbc:postgresql://localhost:5432/immocam_dev}" \
         -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null || true
    OK "Base de données réinitialisée"
fi

INFO "Démarrage d'ImmoCam en mode DEV..."
INFO "API accessible sur : http://localhost:8080/api"
INFO "Swagger UI : http://localhost:8080/api/swagger-ui.html"
INFO "Actuator   : http://localhost:8080/api/actuator/health"
echo ""

export SPRING_PROFILES_ACTIVE=dev
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev \
    --no-transfer-progress 2>&1
EOF
chmod +x run.sh
OK "run.sh généré"

cat > "deploy.sh" << 'EOF'
#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — deploy.sh : Déploiement sur VPS de production
# =============================================================================
# Usage : bash deploy.sh [--build-only] [--skip-tests]
#
# Prérequis :
#   - Docker et Docker Compose installés sur le VPS
#   - Fichier .env avec les vraies valeurs de production
#   - JWT_SECRET générée : openssl rand -hex 64
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
WARN()    { echo -e "${YELLOW}[!]${NC} $1"; }
ERROR()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n  $1\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

SKIP_TESTS="${1:-}"
BUILD_ONLY="${1:-}"

SECTION "DÉPLOIEMENT IMMOCAM — $(date '+%d/%m/%Y %H:%M')"

# ── Vérifications préalables ────────────────────────────────────────────────
[[ -f ".env" ]] || ERROR ".env introuvable. Copiez .env.example et remplissez les valeurs."
source .env

[[ -n "${JWT_SECRET:-}" ]]       || ERROR "JWT_SECRET non défini dans .env"
[[ "${#JWT_SECRET}" -ge 64 ]]    || ERROR "JWT_SECRET trop court (min 64 caractères)"
[[ -n "${DB_PASSWORD:-}" ]]      || ERROR "DB_PASSWORD non défini dans .env"
[[ "${DB_PASSWORD}" != "changeme" ]] || WARN "DB_PASSWORD utilise la valeur par défaut !"

command -v docker >/dev/null 2>&1      || ERROR "Docker non installé"
command -v docker-compose >/dev/null 2>&1 || ERROR "Docker Compose non installé"
OK "Prérequis validés"

# ── Build Maven ─────────────────────────────────────────────────────────────
SECTION "1/4 — Build Maven"
if [[ "$SKIP_TESTS" == "--skip-tests" ]]; then
    WARN "Tests ignorés (--skip-tests)"
    ./mvnw clean package -DskipTests --no-transfer-progress
else
    ./mvnw clean package --no-transfer-progress
fi
OK "JAR compilé : $(ls target/*.jar)"

[[ "$BUILD_ONLY" == "--build-only" ]] && { OK "Build terminé (--build-only)"; exit 0; }

# ── Sauvegarde base de données ──────────────────────────────────────────────
SECTION "2/4 — Sauvegarde PostgreSQL"
BACKUP_DIR="backups/$(date '+%Y/%m')"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/immocam_$(date '+%Y%m%d_%H%M%S').sql.gz"

if docker ps | grep -q immocam_postgres; then
    docker exec immocam_postgres pg_dump \
        -U "${DB_USERNAME:-immocam_user}" "${DB_NAME:-immocam_db}" \
        | gzip > "$BACKUP_FILE" && OK "Sauvegarde : $BACKUP_FILE"
else
    WARN "PostgreSQL non démarré — sauvegarde ignorée"
fi

# ── Déploiement Docker ───────────────────────────────────────────────────────
SECTION "3/4 — Déploiement Docker"
docker-compose pull postgres 2>/dev/null || true
docker-compose build --no-cache api
OK "Image Docker construite"

docker-compose up -d --force-recreate
OK "Conteneurs démarrés"

# ── Vérification santé ───────────────────────────────────────────────────────
SECTION "4/4 — Vérification de santé"
INFO "Attente du démarrage (max 120 secondes)..."
MAX_WAIT=120; WAIT=0
until curl -sf "http://localhost:${API_PORT:-8080}/api/actuator/health" \
        | grep -q '"status":"UP"' 2>/dev/null; do
    sleep 5; WAIT=$((WAIT + 5))
    if [[ $WAIT -ge $MAX_WAIT ]]; then
        ERROR "L'API ne répond pas après $MAX_WAIT secondes. Logs : docker-compose logs api"
    fi
    echo -n "."
done
echo ""

OK "API opérationnelle sur http://localhost:${API_PORT:-8080}/api"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  DÉPLOIEMENT TERMINÉ AVEC SUCCÈS${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Commandes utiles :"
INFO "  Logs en direct : docker-compose logs -f api"
INFO "  Redémarrer     : docker-compose restart api"
INFO "  Arrêter        : docker-compose down"
EOF
chmod +x deploy.sh
OK "deploy.sh généré"

cat > "healthcheck.sh" << 'EOF'
#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — healthcheck.sh : Vérification de santé du serveur
# =============================================================================
# Usage : bash healthcheck.sh [--url http://localhost:8080/api]
# =============================================================================
set -euo pipefail

BASE_URL="${2:-http://localhost:8080/api}"
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
OK()   { echo -e "${GREEN}[✓]${NC} $1"; }
FAIL() { echo -e "${RED}[✗]${NC} $1"; ERREURS=$((ERREURS + 1)); }
WARN() { echo -e "${YELLOW}[!]${NC} $1"; }

ERREURS=0
echo "Vérification de santé ImmoCam — $BASE_URL"
echo "────────────────────────────────────────────"

# Health actuator
STATUS=$(curl -sf "$BASE_URL/actuator/health" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "UNREACHABLE")
if [[ "$STATUS" == "UP" ]]; then
    OK "Actuator health : UP"
else
    FAIL "Actuator health : $STATUS"
fi

# Liste annonces (endpoint public)
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/annonces?page=0&taille=1" 2>/dev/null || echo "000")
if [[ "$HTTP" == "200" ]]; then
    OK "GET /annonces : $HTTP"
else
    FAIL "GET /annonces : $HTTP"
fi

# Villes (endpoint public)
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/localisations/villes" 2>/dev/null || echo "000")
if [[ "$HTTP" == "200" ]]; then
    OK "GET /localisations/villes : $HTTP"
else
    FAIL "GET /localisations/villes : $HTTP"
fi

# Types biens (endpoint public)
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/types-biens" 2>/dev/null || echo "000")
if [[ "$HTTP" == "200" ]]; then
    OK "GET /types-biens : $HTTP"
else
    FAIL "GET /types-biens : $HTTP"
fi

# Auth (doit retourner 400 avec body vide, pas 500)
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "000")
if [[ "$HTTP" == "400" ]]; then
    OK "POST /auth/login (validation) : $HTTP"
else
    WARN "POST /auth/login : $HTTP (attendu 400)"
fi

echo "────────────────────────────────────────────"
if [[ $ERREURS -eq 0 ]]; then
    echo -e "${GREEN}Tous les contrôles sont OK${NC}"
    exit 0
else
    echo -e "${RED}$ERREURS erreur(s) détectée(s)${NC}"
    exit 1
fi
EOF
chmod +x healthcheck.sh
OK "healthcheck.sh généré"

# ── Résumé final ──────────────────────────────────────────────────────────────
echo ""
JAVA_MAIN=$(find src/main/java -name "*.java" 2>/dev/null | wc -l)
JAVA_TEST=$(find src/test/java -name "*.java" 2>/dev/null | wc -l)
SQL_COUNT=$(find src/main/resources/db -name "*.sql" 2>/dev/null | wc -l)
HTML_COUNT=$(find src/main/resources/templates -name "*.html" 2>/dev/null | wc -l)
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SCRIPT 12 TERMINÉ — PROJET IMMOCAM COMPLET !${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Fichiers Java (main) : $JAVA_MAIN"
INFO "Fichiers Java (test) : $JAVA_TEST"
INFO "Migrations SQL       : $SQL_COUNT"
INFO "Templates email      : $HTML_COUNT"
INFO "Scripts shell        : run.sh, deploy.sh, healthcheck.sh"
echo ""
INFO "Pour démarrer en DEV :"
INFO "  bash run.sh"
echo ""
INFO "Pour lancer les tests :"
INFO "  ./mvnw test"
echo ""
INFO "Pour déployer en PROD :"
INFO "  bash deploy.sh"