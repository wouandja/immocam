#!/bin/bash

# Script de test des données ImmoCam
# Vérifie si les données de test ont été créées et sont accessibles via l'API

echo "================================"
echo "🧪 TEST API IMMOCAM"
echo "================================"
echo ""

BASE_URL="http://localhost:1010"
ADMIN_EMAIL="admin@immocam.cm"
ADMIN_PASSWORD="Admin123"
USER_EMAIL="jean@email.com"
USER_PASSWORD="User123"

echo "⏳ Attente du démarrage du serveur..."
for i in {1..30}; do
    if curl -s "$BASE_URL/actuator/health" > /dev/null 2>&1; then
        echo "✅ Serveur démarré!"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

echo ""
echo "1️⃣ TEST: Récupérer la liste des annonces (PUBLIC)"
echo "────────────────────────────────────────────"
curl -s "$BASE_URL/annonces?page=0&taille=10" | jq '.data | {nbAnnonces: length, premiere: .[0] | {id, description, prix, typeBien}}' 2>/dev/null || echo "❌ Erreur"

echo ""
echo "2️⃣ TEST: Connexion admin"
echo "────────────────────────────────────────────"
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"motDePasse\":\"$ADMIN_PASSWORD\"}" | jq -r '.data.accessToken' 2>/dev/null)

if [ "$ADMIN_TOKEN" != "null" ] && [ ! -z "$ADMIN_TOKEN" ]; then
    echo "✅ Connexion réussie"
    echo "   Token: ${ADMIN_TOKEN:0:20}..."
else
    echo "❌ Connexion échouée"
    ADMIN_TOKEN=""
fi

echo ""
echo "3️⃣ TEST: Connexion utilisateur"
echo "────────────────────────────────────────────"
USER_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"motDePasse\":\"$USER_PASSWORD\"}" | jq -r '.data.accessToken' 2>/dev/null)

if [ "$USER_TOKEN" != "null" ] && [ ! -z "$USER_TOKEN" ]; then
    echo "✅ Connexion réussie"
    echo "   Token: ${USER_TOKEN:0:20}..."
else
    echo "❌ Connexion échouée"
    USER_TOKEN=""
fi

echo ""
echo "4️⃣ TEST: Détail d'une annonce"
echo "────────────────────────────────────────────"
curl -s "$BASE_URL/annonces/1" | jq '.data | {id, description, prix, nombreVues, photos: .photos | length}' 2>/dev/null || echo "❌ Erreur"

echo ""
echo "5️⃣ TEST: Mes annonces (privé - avec token)"
echo "────────────────────────────────────────────"
if [ ! -z "$USER_TOKEN" ]; then
    curl -s -H "Authorization: Bearer $USER_TOKEN" \
         "$BASE_URL/annonces/mes-annonces?page=0&taille=10" | \
         jq '.data | {nbAnnonces: length, annonces: .[].description}' 2>/dev/null || echo "❌ Erreur"
else
    echo "❌ Token non disponible"
fi

echo ""
echo "6️⃣ TEST: Types de bien"
echo "────────────────────────────────────────────"
curl -s "$BASE_URL/types-biens" | jq '.data | {nbTypes: length, types: .[].libelle}' 2>/dev/null || echo "❌ Erreur"

echo ""
echo "7️⃣ TEST: Localisations"
echo "────────────────────────────────────────────"
curl -s "$BASE_URL/localisations" | jq '.data | {nbVilles: length, villes: .[0:5][].ville}' 2>/dev/null || echo "❌ Erreur"

echo ""
echo "================================"
echo "✅ Tests complétés"
echo "================================"
