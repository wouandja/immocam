# ImmoCam — Plateforme Immobilière Camerounaise

**Développée par MBEMNOVA** pour TCHINDA KENGNE Franck Junior  
Stack : Spring Boot 4 · Java 21 · PostgreSQL · Angular · VPS local

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture du projet](#2-architecture-du-projet)
3. [Prérequis et installation](#3-prérequis-et-installation)
4. [Démarrage rapide (DEV)](#4-démarrage-rapide-dev)
5. [Déploiement production (VPS)](#5-déploiement-production-vps)
6. [Référence API complète](#6-référence-api-complète)
7. [Règles métier](#7-règles-métier)
8. [Sécurité](#8-sécurité)
9. [Structure des scripts de génération](#9-structure-des-scripts-de-génération)
10. [FAQ et dépannage](#10-faq-et-dépannage)

---

## 1. Vue d'ensemble

ImmoCam est une plateforme d'annonces immobilières ciblant le marché camerounais.

**Fonctionnalités principales :**
- Publication directe d'annonces sans modération (appartements, studios, maisons...)
- Contact propriétaire via WhatsApp (numéro protégé, jamais exposé en clair)
- Système de favoris, commentaires, signalements
- Expiration automatique des annonces (J-5/J-1/J0/J+7)
- Interface d'administration complète
- Authentification sécurisée avec OTP email et JWT

**Package Java :** `com.mbeng.immocam`  
**Dossier source :** `src/main/java/com/mbeng/immocam`

---

## 2. Architecture du projet

```
src/main/java/com/mbeng/immocam/
├── ImmocamApplication.java          ← Point d'entrée Spring Boot
├── config/
│   └── AppConfig.java               ← JPA Auditing, Async, Scheduling
├── shared/                          ← Code partagé entre tous les modules
│   ├── entity/BaseEntity.java       ← id + dateCreation + dateModification
│   ├── enums/                       ← 6 enums métier
│   ├── response/ApiResponse.java    ← Enveloppe JSON standard
│   ├── pagination/PageResponse.java ← Pagination scroll infini
│   ├── constants/ImmoCamConstants.java
│   ├── utils/                       ← PhoneUtils, DateUtils
│   └── validation/                  ← @TelephoneCameroun
├── infrastructure/
│   ├── security/                    ← JWT, filtres, Spring Security
│   ├── storage/                     ← VPS local + Thumbnailator
│   ├── email/                       ← SMTP async + 9 templates Thymeleaf
│   ├── scheduler/                   ← Cron 3h00 expiration annonces
│   ├── exception/                   ← 6 exceptions + GlobalExceptionHandler
│   └── audit/                       ← LogActivite (traçabilité RGPD)
└── module/
    ├── auth/          ← Inscription, connexion, OTP, mot de passe oublié
    ├── utilisateur/   ← Profil, mise à jour, suppression compte
    ├── annonce/       ← CRUD annonces + cycle de vie complet
    ├── photo/         ← Upload, compression, suppression
    ├── commentaire/   ← Lecture publique, poster, répondre, supprimer
    ├── favori/        ← Mes favoris, ajouter, retirer
    ├── contact/       ← Clic WhatsApp + dashboard propriétaire
    ├── signalement/   ← Signaler une annonce
    ├── localisation/  ← 20 villes camerounaises
    ├── typebien/      ← 8 types de biens
    ├── config/        ← Paramètres modifiables par l'admin
    └── admin/         ← Dashboard, gestion complète, exports CSV
```

---

## 3. Prérequis et installation

### Logiciels requis

| Logiciel       | Version min | Vérification               |
|----------------|-------------|----------------------------|
| Java (JDK)     | 21          | `java -version`            |
| Maven          | 3.9+        | `./mvnw -version`          |
| PostgreSQL     | 15+         | `psql --version`           |
| Docker         | 24+         | `docker --version`         |
| Docker Compose | 2.x         | `docker compose version`   |

### Cloner et configurer

```bash
# 1. Cloner le projet
git clone https://github.com/mbemnova/immocam.git
cd immocam

# 2. Générer toute la structure (scripts dans l'ordre)
bash setup_01_pom_and_structure.sh
bash setup_02_config_and_properties.sh
bash setup_03_shared_and_enums.sh
bash setup_04_entities_and_migrations.sh
bash setup_05_repositories.sh
bash setup_06_security.sh
bash setup_07_infrastructure.sh
bash setup_08_auth_module.sh
bash setup_09_annonce_module.sh
bash setup_10_user_modules.sh
bash setup_11_admin_module.sh
bash setup_12_tests_and_finalization.sh

# 3. Créer la base de données PostgreSQL (dev)
psql -U postgres -c "CREATE USER immocam_user WITH PASSWORD 'devpassword';"
psql -U postgres -c "CREATE DATABASE immocam_dev OWNER immocam_user;"

# 4. Copier et configurer .env
cp .env.example .env
# Éditer .env avec vos valeurs (voir section ci-dessous)
```

### Variables d'environnement (.env)

```env
# Base de données
DB_NAME=immocam_db
DB_USERNAME=immocam_user
DB_PASSWORD=CHANGER_CE_MOT_DE_PASSE

# JWT (OBLIGATOIRE — générer avec : openssl rand -hex 64)
JWT_SECRET=COLLER_ICI_LA_CLE_GENEREE

# SMTP (Gmail ou autre)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=votre@gmail.com
SMTP_PASSWORD=mot_de_passe_application_google

# Profil Spring Boot
SPRING_PROFILES_ACTIVE=dev    # dev | prod
```

---

## 4. Démarrage rapide (DEV)

```bash
bash run.sh
```

L'application démarre sur **http://localhost:8080/api**

| URL | Description |
|-----|-------------|
| `http://localhost:8080/api/swagger-ui.html` | Documentation Swagger UI |
| `http://localhost:8080/api/actuator/health` | Health check |
| `http://localhost:8080/api/annonces` | Liste des annonces |

Vérifier que tout fonctionne :

```bash
bash healthcheck.sh
```

Lancer les tests :

```bash
./mvnw test
```

---

## 5. Déploiement production (VPS)

### Préparer le .env de production

```bash
cp .env.example .env
# Remplir TOUTES les valeurs, notamment :
JWT_SECRET=$(openssl rand -hex 64)
DB_PASSWORD=mot_de_passe_fort
SPRING_PROFILES_ACTIVE=prod
STORAGE_BASE_URL=https://votre-domaine.cm/uploads
```

### Déployer avec Docker

```bash
# Déploiement complet (build + tests + docker-compose up)
bash deploy.sh

# Sans tests (plus rapide si déjà testés)
bash deploy.sh --skip-tests

# Build seulement (ne pas déployer)
bash deploy.sh --build-only
```

### Commandes Docker utiles

```bash
# Voir les logs en direct
docker-compose logs -f api

# Redémarrer l'API
docker-compose restart api

# Arrêter tous les services
docker-compose down

# Arrêter ET supprimer les volumes (ATTENTION : efface la base)
docker-compose down -v
```

> Pour charger des données de test (utilisateurs, annonces, photos, types de bien, villes), définissez la variable d'environnement `APP_TEST_DATA_ENABLED=true` avant de lancer `docker-compose up`.
> Exemple : `APP_TEST_DATA_ENABLED=true docker-compose up -d`

### Nginx (reverse proxy recommandé)

```nginx
server {
    listen 80;
    server_name votre-domaine.cm;

    # API Spring Boot
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Photos stockées localement
    location /uploads/ {
        alias /chemin/vers/immocam/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 6. Référence API complète

**URL de base :** `http://localhost:8080/api`  
**Format de toutes les réponses :**
```json
{
  "success": true,
  "message": "Opération réussie",
  "data": { ... },
  "timestamp": "2026-04-20T14:30:00"
}
```

### Authentification (`/auth`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/auth/register` | Non | Inscription + envoi OTP |
| POST | `/auth/verify-email` | Non | Valider le code OTP |
| POST | `/auth/resend-code` | Non | Renvoyer OTP (max 3/h) |
| POST | `/auth/login` | Non | Connexion → tokens JWT |
| POST | `/auth/refresh` | Non | Renouveler l'access token |
| POST | `/auth/forgot-password` | Non | Lien réinitialisation (30 min) |
| POST | `/auth/reset-password` | Non | Nouveau mot de passe |

**Exemple connexion :**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.cm","motDePasse":"secret123"}'
```

### Annonces (`/annonces`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/annonces` | Non | Liste paginée (scroll infini, 12/page) |
| GET | `/annonces/{id}` | Non | Détail (incrémente les vues) |
| POST | `/annonces` | Oui | Publier une annonce |
| PUT | `/annonces/{id}` | Oui | Modifier (propriétaire) |
| PATCH | `/annonces/{id}/pause` | Oui | Mettre en pause |
| PATCH | `/annonces/{id}/reactiver` | Oui | Réactiver |
| PATCH | `/annonces/{id}/renouveler` | Oui | Renouveler 30 jours |
| PATCH | `/annonces/{id}/archiver` | Oui | Archiver définitivement |
| DELETE | `/annonces/{id}` | Oui | Supprimer |
| GET | `/annonces/mes-annonces` | Oui | Dashboard propriétaire |

**Filtres disponibles sur `GET /annonces` :**
```
?ville=Douala&typeBienId=3&prixMin=50000&prixMax=200000&page=0&taille=12
```

**Exemple publication :**
```bash
curl -X POST http://localhost:8080/api/annonces \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "typeBienId": 1,
    "localisationId": 2,
    "description": "Bel appartement moderne au centre-ville de Douala",
    "prix": 150000,
    "numeroWhatsApp": "+237691234567"
  }'
```

### Photos (`/annonces/{id}/photos`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/annonces/{id}/photos` | Oui | Upload (JPG/PNG/WebP, max 4 Mo) |
| DELETE | `/annonces/{id}/photos/{photoId}` | Oui | Supprimer une photo |

### Utilisateur (`/utilisateurs`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/utilisateurs/profil` | Oui | Mon profil |
| PUT | `/utilisateurs/profil` | Oui | Mettre à jour |
| DELETE | `/utilisateurs/compte` | Oui | Supprimer le compte |

### Commentaires

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/annonces/{id}/commentaires` | Non | Lecture publique |
| POST | `/annonces/{id}/commentaires` | Oui | Poster un commentaire |
| POST | `/commentaires/{id}/repondre` | Oui | Répondre (propriétaire) |
| DELETE | `/commentaires/{id}` | Oui | Supprimer |

### Favoris (`/favoris`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/favoris` | Oui | Mes favoris |
| POST | `/favoris/{annonceId}` | Oui | Ajouter |
| DELETE | `/favoris/{annonceId}` | Oui | Retirer |

### Contact WhatsApp (`/contacts`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/contacts` | Oui | Enregistrer clic + retourner lien wa.me |
| GET | `/contacts/annonces/{id}` | Oui | Mes contacts (proprio) |

### Signalement

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/annonces/{id}/signaler` | Oui | Signaler une annonce |

### Localisation et Types de biens (publics)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/localisations/villes` | Non | 20 villes camerounaises |
| GET | `/localisations/quartiers/{ville}` | Non | Quartiers d'une ville |
| GET | `/types-biens` | Non | 8 types de biens |

### Administration (`/admin`) — ROLE_ADMINISTRATEUR requis

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/admin/dashboard` | Statistiques temps réel |
| GET | `/admin/annonces` | Historique toutes annonces |
| DELETE | `/admin/annonces/{id}?motif=...` | Supprimer avec motif |
| PATCH | `/admin/annonces/{id}/pause` | Mettre en pause |
| PATCH | `/admin/annonces/{id}/reactiver` | Réactiver |
| GET | `/admin/utilisateurs` | Liste avec recherche |
| PATCH | `/admin/utilisateurs/{id}/suspendre?motif=...` | Suspendre |
| PATCH | `/admin/utilisateurs/{id}/bannir?motif=...` | Bannir |
| PATCH | `/admin/utilisateurs/{id}/activer` | Réactiver |
| GET | `/admin/signalements?statut=EN_ATTENTE` | Signalements |
| PATCH | `/admin/signalements/{id}/traiter?decision=...` | Traiter |
| DELETE | `/admin/commentaires/{id}` | Supprimer commentaire |
| GET | `/admin/config` | Paramètres système |
| PATCH | `/admin/config/{cle}?valeur=...` | Modifier un paramètre |
| GET | `/admin/rapports/export/annonces` | Export CSV annonces |
| GET | `/admin/rapports/export/utilisateurs` | Export CSV utilisateurs |

**Créer le premier compte administrateur** (en base uniquement) :
```sql
UPDATE utilisateurs
SET role = 'ADMINISTRATEUR'
WHERE email = 'admin@immocam.cm';
```

---

## 7. Règles métier

### Annonces
- **Publication directe** — statut `ACTIVE` immédiatement sans file de modération
- **Limite** — 5 annonces actives max par propriétaire (configurable dans l'admin)
- **Durée de vie** — 30 jours (configurable)
- **Cycle automatique (scheduler 3h00)** :
  - J-5 : email de rappel au propriétaire
  - J-1 : email de dernier rappel
  - J0  : annonce passe en `EXPIREE` (invisible du public)
  - J+7 : annonce `SUPPRIMEE_SYSTEME` (définitif)
- **Renouvellement** — le propriétaire peut renouveler depuis son dashboard

### Numéro WhatsApp
- Le numéro est stocké en base mais **jamais retourné en clair dans l'API**
- Il est intégré uniquement dans le lien `wa.me` généré côté serveur
- Ce mécanisme protège les propriétaires contre le scraping automatique

### Authentification
- OTP 6 chiffres valable **10 minutes**, max 3 renvois/heure
- Après **5 tentatives échouées** en 15 min → compte bloqué 30 min + email d'alerte
- Lien réinitialisation mot de passe valable **30 minutes**

### Commentaires
- Lecture publique sans connexion
- Connexion obligatoire pour commenter
- Un seul niveau de réponse (propriétaire uniquement)
- Suppression soft : le texte est remplacé par `[Commentaire supprimé]`

### Administration
- Suspension : toutes les annonces `ACTIVE` passent en `EN_PAUSE`
- Bannissement : toutes les annonces sont supprimées définitivement
- Réactivation : les annonces `EN_PAUSE` repassent en `ACTIVE`
- Toute suppression admin envoie un email avec le motif au propriétaire

---

## 8. Sécurité

### JWT
- **Access token** : 1 heure (configurable `JWT_ACCESS_EXP`)
- **Refresh token** : 30 jours (configurable `JWT_REFRESH_EXP`)
- Header requis : `Authorization: Bearer <access_token>`

### Rate Limiting
- 100 requêtes/minute par IP (configurable `RATE_LIMIT_RPM`)
- Cache Caffeine — fenêtre glissante de 1 minute
- Réponse 429 avec message JSON en cas de dépassement

### Bonnes pratiques production
```bash
# Générer une clé JWT sécurisée
openssl rand -hex 64

# Vérifier la configuration HTTPS (Nginx)
nginx -t

# Surveiller les logs de sécurité
docker-compose logs api | grep -i "bloque\|tentative\|rate limit"
```

---

## 9. Structure des scripts de génération

Les 12 scripts bash génèrent tout le code source du projet dans l'ordre :

| Script | Rôle |
|--------|------|
| `setup_01_pom_and_structure.sh` | pom.xml + arborescence 130 dossiers |
| `setup_02_config_and_properties.sh` | YAML, Dockerfile, docker-compose |
| `setup_03_shared_and_enums.sh` | BaseEntity, enums, ApiResponse, utils |
| `setup_04_entities_and_migrations.sh` | 13 entités JPA + 4 migrations Flyway |
| `setup_05_repositories.sh` | 14 repositories Spring Data JPA |
| `setup_06_security.sh` | JWT, filtres, SecurityConfig, exceptions |
| `setup_07_infrastructure.sh` | Storage, Email, Scheduler, LogActivite |
| `setup_08_auth_module.sh` | Module auth complet (7 endpoints) |
| `setup_09_annonce_module.sh` | Module annonce + photo + localisation |
| `setup_10_user_modules.sh` | Commentaire, Favori, Contact, Signalement |
| `setup_11_admin_module.sh` | Dashboard admin + 20 endpoints |
| `setup_12_tests_and_finalization.sh` | Tests + run.sh + deploy.sh |

---

## 10. FAQ et dépannage

**L'application ne démarre pas — erreur Flyway**
```
Solution : Vérifier que PostgreSQL est démarré et que les identifiants
dans .env correspondent à la base créée.
```

**Erreur "JWT_SECRET trop court"**
```bash
# Générer une clé valide (minimum 64 caractères)
openssl rand -hex 64
# Copier le résultat dans .env → JWT_SECRET=...
```

**Les emails ne partent pas**
```
1. Vérifier SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD dans .env
2. Pour Gmail : activer l'authentification à 2 facteurs et créer
   un "mot de passe d'application" dans les paramètres Google
3. En dev : utiliser MailHog (port 1025) — déjà configuré dans application.yaml
```

**Photos non stockées / erreur 500 à l'upload**
```bash
# Vérifier que le dossier uploads existe et est accessible
mkdir -p uploads/annonces uploads/temp
chmod 755 uploads/
```

**L'admin ne peut pas se connecter avec son rôle**
```sql
-- Assigner le rôle admin directement en base
UPDATE utilisateurs SET role = 'ADMINISTRATEUR' WHERE email = 'admin@immocam.cm';
```

**Réinitialiser complètement la base (dev seulement)**
```bash
bash run.sh --reset-db
```

---

## Contacts et support

**Développeur :** MBEMNOVA  
**Site :** https://mbemnova.com  
**Email :** mbemnova25@gmail.com  
**WhatsApp :** +237 697 847 396

---

*ImmoCam v1.0.0 — © 2026 MBEMNOVA. Tous droits réservés.*
