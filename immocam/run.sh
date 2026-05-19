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
