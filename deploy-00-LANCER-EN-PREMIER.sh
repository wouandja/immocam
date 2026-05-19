#!/usr/bin/env bash
# =============================================================================
#  ImmoCam — Script MAÎTRE : Génère et place tous les scripts
#
#  À exécuter UNE SEULE FOIS depuis la RACINE du mono-repo
#  (le dossier parent qui contient immocam/ et mbemnova-web/)
#
#  Usage : bash deploy-00-LANCER-EN-PREMIER.sh
#
#  Ce script copie les 4 scripts de déploiement aux bons endroits
#  et affiche les instructions complètes.
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
info() { echo -e "${BLUE}  → $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
err()  { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ImmoCam — Installation des scripts de déploiement          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Vérification : on est dans le bon répertoire
if [[ ! -d "immocam" ]] || [[ ! -d "mbemnova-web" ]]; then
  if [[ -d "../immocam" ]] && [[ -d "../mbemnova-web" ]]; then
    cd ..
    info "Remontée au répertoire parent : $(pwd)"
  else
    err "Lancez ce script depuis la racine du projet\n  (le dossier contenant immocam/ et mbemnova-web/)"
  fi
fi

ROOT="$(pwd)"
info "Répertoire racine détecté : ${ROOT}"

# =============================================================================
# Copie des scripts aux bons endroits
# =============================================================================
info "Placement des scripts de déploiement..."

# Script 1 → backend
cp "${SCRIPT_DIR}/deploy-01-backend-files.sh" "${ROOT}/immocam/deploy-01-backend-files.sh"
chmod +x "${ROOT}/immocam/deploy-01-backend-files.sh"
ok "immocam/deploy-01-backend-files.sh"

# Script 2 → frontend
cp "${SCRIPT_DIR}/deploy-02-frontend-files.sh" "${ROOT}/mbemnova-web/deploy-02-frontend-files.sh"
chmod +x "${ROOT}/mbemnova-web/deploy-02-frontend-files.sh"
ok "mbemnova-web/deploy-02-frontend-files.sh"

# Scripts 3 et 4 → racine
cp "${SCRIPT_DIR}/deploy-03-compose-cicd.sh" "${ROOT}/deploy-03-compose-cicd.sh"
chmod +x "${ROOT}/deploy-03-compose-cicd.sh"
ok "deploy-03-compose-cicd.sh (racine)"

cp "${SCRIPT_DIR}/deploy-04-vps-setup.sh" "${ROOT}/deploy-04-vps-setup.sh"
chmod +x "${ROOT}/deploy-04-vps-setup.sh"
ok "deploy-04-vps-setup.sh (racine — à copier sur le VPS)"

# =============================================================================
# Affichage des instructions complètes
# =============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Tous les scripts sont en place ! Suivez l'ordre ci-dessous ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}══ EN LOCAL (sur votre machine) ══${NC}"
echo ""
echo -e "  ${BLUE}ÉTAPE 1${NC} — Générer les fichiers du backend Spring Boot"
echo "  ─────────────────────────────────────────────────────"
echo "  cd ${ROOT}/immocam"
echo "  bash deploy-01-backend-files.sh"
echo ""
echo "  Fichiers créés :"
echo "    • Dockerfile (Spring Boot multi-stage)"
echo "    • .dockerignore"
echo "    • src/main/resources/application-prod.yml"
echo "    • healthcheck.sh"
echo ""
echo -e "  ${BLUE}ÉTAPE 2${NC} — Générer les fichiers du frontend Angular"
echo "  ─────────────────────────────────────────────────────"
echo "  cd ${ROOT}/mbemnova-web"
echo "  bash deploy-02-frontend-files.sh"
echo ""
echo "  Fichiers créés :"
echo "    • Dockerfile (Angular + Nginx multi-stage)"
echo "    • nginx.conf (SPA routing)"
echo "    • .dockerignore"
echo "    • src/environments/environment.prod.ts"
echo ""
echo -e "  ${YELLOW}  ⚠  Ouvrez environment.prod.ts et remplacez VPS_IP_ADDRESS${NC}"
echo -e "  ${YELLOW}     par l'IP réelle de votre VPS !${NC}"
echo ""
echo -e "  ${BLUE}ÉTAPE 3${NC} — Générer docker-compose + CI/CD GitHub Actions"
echo "  ─────────────────────────────────────────────────────"
echo "  cd ${ROOT}"
echo "  bash deploy-03-compose-cicd.sh"
echo ""
echo "  Fichiers créés :"
echo "    • docker-compose.prod.yml (ports: 1011, 4202, 5433)"
echo "    • nginx-prod.conf (prêt pour domaine futur)"
echo "    • .env.prod.template"
echo "    • .github/workflows/immocam-ci-cd.yml"
echo ""
echo -e "${YELLOW}══ SUR LE VPS (via SSH) ══${NC}"
echo ""
echo -e "  ${BLUE}ÉTAPE 4${NC} — Préparer le VPS"
echo "  ─────────────────────────────────────────────────────"
echo "  # Copier le script sur le VPS"
echo "  scp ${ROOT}/deploy-04-vps-setup.sh USER@VPS_IP:/tmp/"
echo "  scp ${ROOT}/docker-compose.prod.yml USER@VPS_IP:/tmp/"
echo "  scp ${ROOT}/.env.prod.template USER@VPS_IP:/tmp/"
echo "  scp ${ROOT}/nginx-prod.conf USER@VPS_IP:/tmp/"
echo ""
echo "  # Sur le VPS :"
echo "  ssh USER@VPS_IP"
echo "  sudo bash /tmp/deploy-04-vps-setup.sh"
echo ""
echo -e "  ${BLUE}ÉTAPE 5${NC} — Créer .env.prod sur le VPS"
echo "  ─────────────────────────────────────────────────────"
echo "  cp /opt/immocam/.env.prod.template /opt/immocam/.env.prod"
echo "  nano /opt/immocam/.env.prod"
echo ""
echo "  # Valeurs à remplir obligatoirement :"
echo "    DB_PASSWORD       → mot de passe fort"
echo "    JWT_SECRET        → openssl rand -hex 64"
echo "    SMTP_USERNAME     → votre email"
echo "    SMTP_PASSWORD     → mot de passe application Gmail"
echo "    GITHUB_REPOSITORY → votre_org/votre_repo  (minuscules!)"
echo "    STORAGE_BASE_URL  → http://VPS_IP:1011/api/uploads/"
echo ""
echo -e "${YELLOW}══ GITHUB (dans le navigateur) ══${NC}"
echo ""
echo -e "  ${BLUE}ÉTAPE 6${NC} — Secrets GitHub Actions"
echo "  ─────────────────────────────────────────────────────"
echo "  Repo → Settings → Secrets and variables → Actions"
echo ""
echo "  Si TontinePro est sur le MÊME VPS → ces secrets existent déjà :"
echo "    VPS_HOST   ✓ (déjà configuré pour TontinePro)"
echo "    VPS_USER   ✓ (déjà configuré pour TontinePro)"
echo "    VPS_SSH_KEY ✓ (déjà configuré pour TontinePro)"
echo ""
echo -e "  ${YELLOW}  ⚠  Si le repo est différent de TontinePro, ajoutez-les.${NC}"
echo ""
echo -e "${YELLOW}══ DÉPLOIEMENT ══${NC}"
echo ""
echo -e "  ${BLUE}ÉTAPE 7${NC} — Premier déploiement"
echo "  ─────────────────────────────────────────────────────"
echo "  cd ${ROOT}"
echo "  git add ."
echo "  git commit -m 'feat: add ImmoCam production deployment'"
echo "  git push origin main"
echo ""
echo "  → Le pipeline CI/CD se déclenche automatiquement"
echo "  → Durée estimée : 8 à 12 minutes (build + tests + push + deploy)"
echo ""
echo -e "${GREEN}══ RÉSULTAT FINAL ══${NC}"
echo ""
echo "  Ports utilisés par ImmoCam (aucun conflit avec TontinePro) :"
echo "    1011 → API Spring Boot"
echo "    4202 → Frontend Angular"
echo "    5433 → PostgreSQL (localhost uniquement)"
echo ""
echo "  TontinePro utilise : 8080, 4201, 3306, 9090, 3100"
echo ""
echo -e "  ${GREEN}🌐 Frontend : http://VPS_IP:4202${NC}"
echo -e "  ${GREEN}🔌 API      : http://VPS_IP:1011/api${NC}"
echo ""
echo "  Quand vous aurez un nom de domaine :"
echo "    → Les commentaires 'TODO domaine' dans les fichiers générés"
echo "       indiquent exactement quoi modifier."
echo ""
