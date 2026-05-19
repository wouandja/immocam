# 🧪 Guide de test des données ImmoCam

Ce guide explique comment vérifier que les données de test ont été correctement créées et sont accessibles.

---

## 📋 Table des matières

1. [Test via JUnit](#test-via-junit)
2. [Test via API REST](#test-via-api-rest)
3. [Test via SQL Direct](#test-via-sql-direct)
4. [Troubleshooting](#troubleshooting)

---

## 1️⃣ Test via JUnit

La méthode la plus fiable pour vérifier les données directement dans la base de données.

### Exécuter tous les tests

```bash
mvn clean test -Dtest=DataLoaderTest
```

### Exécuter un test spécifique

```bash
# Test des utilisateurs uniquement
mvn test -Dtest=DataLoaderTest#testDataLoaderUtilisateurs

# Test des annonces uniquement
mvn test -Dtest=DataLoaderTest#testDataLoaderAnnonces

# Test des photos uniquement
mvn test -Dtest=DataLoaderTest#testDataLoaderPhotos

# Résumé complet
mvn test -Dtest=DataLoaderTest#testDataLoaderResume
```

### Résultat attendu

```
╔═══════════════════════════════════════════════════════╗
║          📊 RÉSUMÉ DES DONNÉES DE TEST               ║
╚═══════════════════════════════════════════════════════╝

  👥 Utilisateurs:        5
  🏠 Annonces:            8
  📸 Photos:              32
  💬 Commentaires:        ≥ 9
  ⭐ Favoris:             ≥ 8
  📱 Contacts WhatsApp:   ≥ 24
  🏷️  Types de bien:      8
  📍 Localisations:       20

╔═══════════════════════════════════════════════════════╗
║                    ✅ TOUS LES TESTS OK               ║
╚═══════════════════════════════════════════════════════╝
```

---

## 2️⃣ Test via API REST

### Prérequis

- L'application doit être démarrée
- jq installé pour les tests bash (optionnel)

### Démarrer l'application

```bash
mvn spring-boot:run
```

L'application démarre sur `http://localhost:8080`

### Option A: Script PowerShell (Windows)

```powershell
# Exécuter le script de test
.\test_api.ps1
```

**Sortie attendue:**
```
================================
🧪 TEST API IMMOCAM
================================

TEST: Récupérer la liste des annonces (PUBLIC)
────────────────────────────────────────────
✅ Succès
   Nombre d'annonces: 8

TEST: Connexion admin
────────────────────────────────────────────
✅ Succès
   Email: admin@immocam.cm
   Rôle: ADMINISTRATEUR
   Token: eyJhbGciOiJIUzI1NiIs...

TEST: Connexion utilisateur
────────────────────────────────────────────
✅ Succès
   Utilisateur: Jean Dupont
   Email: jean@email.com

TEST: Détail d'une annonce
────────────────────────────────────────────
✅ Succès
   Description: Belle Chambre à Douala...
   Prix: 50000 FCFA
   Photos: 4
   Vues: 0

TEST: Types de bien
────────────────────────────────────────────
✅ Succès
   Nombre de types: 8
   Types: Chambre, Studio, Appartement, Bureau...

✅ Tests complétés
```

### Option B: Script Bash (Linux/Mac)

```bash
chmod +x test_api.sh
./test_api.sh
```

### Option C: Commandes curl manuelles

#### 1. Récupérer les annonces

```bash
curl http://localhost:8080/annonces?page=0&taille=10 | jq
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "description": "Belle Chambre à Douala...",
      "prix": 50000,
      "typeBien": "Chambre",
      "ville": "Douala",
      "photos": [...]
    },
    ...
  ]
}
```

#### 2. Connexion

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean@email.com",
    "motDePasse": "User123"
  }' | jq
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "userId": 2,
    "email": "jean@email.com",
    "prenom": "Jean",
    "nom": "Dupont",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR..."
  }
}
```

#### 3. Récupérer les annonces de l'utilisateur (avec token)

```bash
# D'abord, récupérer le token
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jean@email.com","motDePasse":"User123"}' | jq -r '.data.accessToken')

# Ensuite récupérer les annonces
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/annonces/mes-annonces?page=0 | jq
```

#### 4. Détail d'une annonce

```bash
curl http://localhost:8080/annonces/1 | jq '.data | {id, description, prix, photos, commentaires}'
```

#### 5. Types de bien

```bash
curl http://localhost:8080/types-biens | jq '.data | map(.libelle)'
```

**Réponse attendue:**
```json
[
  "Chambre",
  "Studio",
  "Appartement",
  "Bureau",
  "Magasin",
  "Maison",
  "Boutique",
  "Espace"
]
```

#### 6. Localisations (villes)

```bash
curl http://localhost:8080/localisations | jq '.data | map(.ville) | unique'
```

**Réponse attendue:**
```json
[
  "Yaounde",
  "Douala",
  "Maroua",
  ...
]
```

---

## 3️⃣ Test via SQL Direct

Connectez-vous à PostgreSQL et exécutez le script de vérification :

### Avec psql

```bash
psql -U immocam_user -d immocam_dev -f check_test_data.sql
```

### Ou manuellement dans pgAdmin

#### Compter les utilisateurs

```sql
SELECT COUNT(*) as total_utilisateurs FROM utilisateurs;
```

**Résultat attendu:** `5`

#### Lister les utilisateurs

```sql
SELECT id, prenom, nom, email, statut, role FROM utilisateurs ORDER BY id;
```

**Résultat attendu:**
```
 id | prenom | nom   | email                | statut | role
----+--------+-------+----------------------+--------+---------------
  1 | Admin  | Immo  | admin@immocam.cm     | ACTIF  | ADMINISTRATEUR
  2 | Jean   | Dupon | jean@email.com       | ACTIF  | UTILISATEUR
  3 | Marie  | Kamga | marie@email.com      | ACTIF  | UTILISATEUR
  4 | Paul   | Mbar  | paul@email.com       | ACTIF  | UTILISATEUR
  5 | Claire | Ndom  | claire@email.com     | ACTIF  | UTILISATEUR
```

#### Compter les annonces

```sql
SELECT COUNT(*) as total_annonces FROM annonces;
```

**Résultat attendu:** `8`

#### Lister les annonces

```sql
SELECT a.id, a.prix, u.prenom, u.nom, t.libelle, l.ville 
FROM annonces a 
LEFT JOIN utilisateurs u ON a.proprietaire_id = u.id 
LEFT JOIN types_biens t ON a.type_bien_id = t.id 
LEFT JOIN localisations l ON a.localisation_id = l.id 
ORDER BY a.id;
```

#### Compter les photos

```sql
SELECT COUNT(*) as total_photos FROM photos;
```

**Résultat attendu:** `32`

#### Vérifier les photos par annonce

```sql
SELECT a.id, COUNT(p.id) as nb_photos 
FROM annonces a 
LEFT JOIN photos p ON p.annonce_id = a.id 
GROUP BY a.id;
```

**Résultat attendu:** 4 photos par annonce

---

## 🔍 Troubleshooting

### Problème: Les données ne sont pas créées

**Cause 1:** Le profil `dev` n'est pas activé

```bash
# Vérifier dans application-dev.yml
cat src/main/resources/application-dev.yml | grep "test-data"
```

Doit afficher:
```yaml
app:
  test-data:
    enabled: true
```

**Cause 2:** Les migrations Flyway ont échoué

```sql
-- Vérifier si les tables existent
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
```

Doit retourner: `utilisateurs`, `annonces`, `photos`, `commentaires`, etc.

**Cause 3:** La base de données n'est pas vide

Le DataLoader ne crée les données que si `utilisateurRepository.count() == 0`

Solution: Vider la base de données

```sql
-- ⚠️ ATTENTION : Cette commande supprime TOUTES les données
DELETE FROM utilisateurs CASCADE;
```

### Problème: Erreurs de compilation du DataLoader

**Vérifier les imports:**
```bash
mvn compile -q
```

Doit compiler sans erreurs.

### Problème: Connexion échouée avec les identifiants de test

**Vérifier les credentials:**
- Admin: `admin@immocam.cm` / `Admin123`
- User: `jean@email.com` / `User123`

**Vérifier le statut du compte:**
```sql
SELECT email, statut FROM utilisateurs WHERE email = 'jean@email.com';
```

Doit retourner: `statut = ACTIF`

---

## ✅ Checklist de vérification complète

- [ ] 5 utilisateurs créés (1 admin + 4 users)
- [ ] 8 annonces publiées (2 par user)
- [ ] 32 photos uploadées (4 par annonce)
- [ ] ≥ 9 commentaires créés
- [ ] ≥ 8 favoris créés
- [ ] ≥ 24 contacts WhatsApp créés
- [ ] 8 types de bien pré-chargés
- [ ] 20 villes pré-chargées
- [ ] Connexion admin OK
- [ ] Connexion utilisateur OK
- [ ] API annonces accessible
- [ ] Compteur de vues fonctionne

---

## 📞 Support

En cas de problème:

1. Vérifier les logs: `tail -100 logs/immocam.log`
2. Vérifier la connexion à la BD: `psql -U immocam_user -d immocam_dev`
3. Consulter le fichier `README.md` du projet principal

