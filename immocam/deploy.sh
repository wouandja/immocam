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
