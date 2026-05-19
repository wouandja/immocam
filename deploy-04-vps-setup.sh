#!/usr/bin/env bash
# =============================================================================
#  ImmoCam — Script 4/4 : Setup VPS Production
#
#  À exécuter SUR LE VPS, une seule fois.
#  Usage : sudo bash deploy-04-vps-setup.sh
#
#  Ce script :
#    1. Crée le dossier /opt/immocam avec la bonne structure
#    2. Copie docker-compose.prod.yml et .env.prod.template sur le VPS
#    3. Configure UFW pour ouvrir les ports 1011 et 4202
#    4. Configure le backup automatique PostgreSQL
#    5. Crée le service systemd de démarrage automatique
#
#  Prérequis (déjà présents sur le VPS d'après votre config) :
#    ✅ Docker 29.4 installé
#    ✅ docker compose plugin installé
#    ✅ Utilisateur avec accès docker
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
info() { echo -e "${BLUE}  → $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
err()  { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

# Vérification root
if [[ $EUID -ne 0 ]]; then
  err "Ce script doit être exécuté avec sudo : sudo bash deploy-04-vps-setup.sh"
fi

APP_DIR="/opt/immocam"
APP_USER="${SUDO_USER:-$(logname 2>/dev/null || echo 'tontinepro')}"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ImmoCam — Setup VPS Production (Script 4/4)            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  APP_DIR  : ${APP_DIR}"
echo "  APP_USER : ${APP_USER}"
echo ""

# =============================================================================
# 1. Structure de dossiers
# =============================================================================
info "1/6 Création de la structure ${APP_DIR}..."

mkdir -p "${APP_DIR}"/{backups,scripts,logs}

# L'utilisateur qui lance docker doit pouvoir écrire ici
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
chmod 750 "${APP_DIR}"
chmod 700 "${APP_DIR}/backups"

ok "Structure créée : ${APP_DIR}"

# =============================================================================
# 2. Copier les fichiers de configuration depuis le répertoire courant
# =============================================================================
info "2/6 Copie des fichiers de configuration..."

# Cherche docker-compose.prod.yml dans le répertoire courant ou le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "${SCRIPT_DIR}/docker-compose.prod.yml" ]; then
  cp "${SCRIPT_DIR}/docker-compose.prod.yml" "${APP_DIR}/docker-compose.prod.yml"
  ok "docker-compose.prod.yml copié"
elif [ -f "$(pwd)/docker-compose.prod.yml" ]; then
  cp "$(pwd)/docker-compose.prod.yml" "${APP_DIR}/docker-compose.prod.yml"
  ok "docker-compose.prod.yml copié"
else
  warn "docker-compose.prod.yml non trouvé — vous devrez le copier manuellement :"
  warn "  scp docker-compose.prod.yml ${APP_USER}@VPS:${APP_DIR}/"
fi

if [ -f "${SCRIPT_DIR}/.env.prod.template" ]; then
  cp "${SCRIPT_DIR}/.env.prod.template" "${APP_DIR}/.env.prod.template"
  ok ".env.prod.template copié"
fi

if [ -f "${SCRIPT_DIR}/nginx-prod.conf" ]; then
  cp "${SCRIPT_DIR}/nginx-prod.conf" "${APP_DIR}/nginx-prod.conf"
  ok "nginx-prod.conf copié (pour usage futur avec domaine)"
fi

chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

# =============================================================================
# 3. Vérification et configuration UFW
# =============================================================================
info "3/6 Configuration du firewall (UFW)..."

if ! command -v ufw &>/dev/null; then
  apt-get install -y ufw -q
fi

# Vérifier les ports déjà utilisés par TontinePro
echo ""
warn "Ports actuellement utilisés sur ce VPS (vérification) :"
ss -tlnp 2>/dev/null | grep -E ":(80|443|8080|4201|1010|3306|9090|3100)" | awk '{print "  " $4}' || echo "  (impossible de vérifier)"
echo ""

# Vérifier que les ports ImmoCam sont libres
for PORT in 1011 4202 5433; do
  if ss -tlnp 2>/dev/null | grep -q ":${PORT} "; then
    warn "PORT ${PORT} semble déjà utilisé !"
    warn "Vérifiez : ss -tlnp | grep ${PORT}"
  else
    ok "Port ${PORT} disponible"
  fi
done

# Ouvrir les ports ImmoCam dans UFW
ufw allow 1011/tcp comment "ImmoCam API" > /dev/null 2>&1
ufw allow 4202/tcp comment "ImmoCam Frontend" > /dev/null 2>&1
# PostgreSQL : uniquement localhost (ne pas exposer sur internet)
# Port 5433 déjà lié sur 127.0.0.1 dans docker-compose

# S'assurer qu'UFW est actif (sans casser la session SSH !)
if ufw status | grep -q "Status: inactive"; then
  warn "UFW inactif — activation avec SSH autorisé..."
  ufw allow ssh > /dev/null 2>&1
  ufw --force enable > /dev/null 2>&1
fi

ufw reload > /dev/null 2>&1 || true

ok "Firewall configuré (ports 1011, 4202 ouverts)"

# =============================================================================
# 4. Script de backup PostgreSQL automatique
# =============================================================================
info "4/6 Configuration backup PostgreSQL..."

cat > "${APP_DIR}/scripts/backup-postgres.sh" << 'BACKUP'
#!/bin/bash
# =============================================================================
# ImmoCam — Backup PostgreSQL automatique
# Lancé par cron chaque nuit à 2h30
# =============================================================================

set -euo pipefail

APP_DIR="/opt/immocam"
BACKUP_DIR="${APP_DIR}/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/immocam_${DATE}.sql.gz"
KEEP_DAYS=30

# Charger les variables
if [ -f "${APP_DIR}/.env.prod" ]; then
  set -a
  source "${APP_DIR}/.env.prod"
  set +a
else
  echo "$(date) - ERREUR: .env.prod introuvable" >&2
  exit 1
fi

echo "$(date) - Début backup ImmoCam PostgreSQL..."

mkdir -p "${BACKUP_DIR}"

# Backup via docker exec
docker exec immocam_postgres \
  pg_dump \
    -U "${DB_USERNAME:-immocam_user}" \
    -d "${DB_NAME:-immocam_db}" \
    --no-password \
    --format=custom \
    --compress=9 \
  2>/dev/null | gzip > "${BACKUP_FILE}"

SIZE=$(du -sh "${BACKUP_FILE}" 2>/dev/null | cut -f1)
echo "$(date) - Backup créé: ${BACKUP_FILE} (${SIZE})"

# Nettoyage des vieux backups
find "${BACKUP_DIR}" -name "immocam_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
COUNT=$(ls -1 "${BACKUP_DIR}"/immocam_*.sql.gz 2>/dev/null | wc -l)
echo "$(date) - ${COUNT} backup(s) conservé(s)"
BACKUP

chmod +x "${APP_DIR}/scripts/backup-postgres.sh"
chown "${APP_USER}:${APP_USER}" "${APP_DIR}/scripts/backup-postgres.sh"

# Cron backup à 2h30 (différent de TontinePro qui est à 3h00)
CRON_FILE="/etc/cron.d/immocam-backup"
echo "30 2 * * * ${APP_USER} ${APP_DIR}/scripts/backup-postgres.sh >> /var/log/immocam-backup.log 2>&1" > "${CRON_FILE}"
chmod 644 "${CRON_FILE}"

ok "Backup PostgreSQL configuré (chaque nuit à 2h30)"

# =============================================================================
# 5. Script de monitoring rapide
# =============================================================================
info "5/6 Script de monitoring..."

cat > "${APP_DIR}/scripts/status.sh" << 'STATUS'
#!/bin/bash
# =============================================================================
# ImmoCam — Vérification rapide de l'état des services
# Usage : bash /opt/immocam/scripts/status.sh
# =============================================================================

APP_DIR="/opt/immocam"

echo ""
echo "══════════════════════════════════════════"
echo "  ImmoCam — État des services"
echo "══════════════════════════════════════════"
echo ""

# État des conteneurs
if [ -f "${APP_DIR}/docker-compose.prod.yml" ] && [ -f "${APP_DIR}/.env.prod" ]; then
  docker compose \
    -f "${APP_DIR}/docker-compose.prod.yml" \
    --env-file "${APP_DIR}/.env.prod" \
    ps 2>/dev/null || echo "  Conteneurs non démarrés"
else
  echo "  docker-compose.prod.yml ou .env.prod manquant dans ${APP_DIR}"
fi

echo ""
echo "── Ports en écoute ──────────────────────"
ss -tlnp | grep -E ":(1011|4202|5433)" | awk '{print "  " $1 " " $4}' || echo "  (aucun port ImmoCam actif)"

echo ""
echo "── Health checks ────────────────────────"

# API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:1011/api/actuator/health 2>/dev/null || echo "000")
if [ "${API_STATUS}" = "200" ]; then
  echo "  ✅ API      : OK (HTTP ${API_STATUS}) → http://$(hostname -I | awk '{print $1}'):1011/api"
else
  echo "  ❌ API      : NON DISPONIBLE (HTTP ${API_STATUS})"
fi

# Frontend
FRONT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:4202 2>/dev/null || echo "000")
if [ "${FRONT_STATUS}" = "200" ]; then
  echo "  ✅ Frontend : OK (HTTP ${FRONT_STATUS}) → http://$(hostname -I | awk '{print $1}'):4202"
else
  echo "  ❌ Frontend : NON DISPONIBLE (HTTP ${FRONT_STATUS})"
fi

echo ""
echo "── Utilisation disque ───────────────────"
docker system df 2>/dev/null | head -5 || true
echo ""
STATUS

chmod +x "${APP_DIR}/scripts/status.sh"
chown "${APP_USER}:${APP_USER}" "${APP_DIR}/scripts/status.sh"

ok "Script status.sh créé"

# =============================================================================
# 6. Instructions finales
# =============================================================================
info "6/6 Génération des instructions..."

VPS_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}' || echo "VPS_IP_A_DEFINIR")

cat > "${APP_DIR}/DEPLOIEMENT-INSTRUCTIONS.txt" << INSTRUCTIONS
=============================================================================
  ImmoCam — Instructions de déploiement
  Générées le $(date)
=============================================================================

IP de ce VPS : ${VPS_IP}

═══════════════════════════════════════════════════════════════════════════════
ÉTAPE 1 — Créer le fichier .env.prod sur ce VPS
═══════════════════════════════════════════════════════════════════════════════

  cp ${APP_DIR}/.env.prod.template ${APP_DIR}/.env.prod
  nano ${APP_DIR}/.env.prod

  Remplir obligatoirement :
    DB_PASSWORD       → mot de passe fort pour PostgreSQL
    JWT_SECRET        → openssl rand -hex 64
    SMTP_USERNAME     → votre email Gmail
    SMTP_PASSWORD     → mot de passe application Gmail
    GITHUB_REPOSITORY → votre_org/votre_repo (en minuscules)
    STORAGE_BASE_URL  → http://${VPS_IP}:1011/api/uploads/
                        (ou https://VOTRE_DOMAINE/uploads quand disponible)

═══════════════════════════════════════════════════════════════════════════════
ÉTAPE 2 — Configurer les secrets GitHub Actions
═══════════════════════════════════════════════════════════════════════════════

  GitHub → votre repo → Settings → Secrets and variables → Actions

  Secrets requis :
    VPS_HOST    = ${VPS_IP}
    VPS_USER    = ${APP_USER}   (ou tontinepro si c'est le même utilisateur)
    VPS_SSH_KEY = (contenu de votre clé privée SSH — même que TontinePro)

  ℹ️  Si vous utilisez déjà VPS_HOST, VPS_USER, VPS_SSH_KEY pour TontinePro,
      pas besoin de les recréer — ImmoCam réutilise les mêmes !

═══════════════════════════════════════════════════════════════════════════════
ÉTAPE 3 — Mettre à jour environment.prod.ts dans le frontend
═══════════════════════════════════════════════════════════════════════════════

  Fichier : mbemnova-web/src/environments/environment.prod.ts
  Remplacez VPS_IP_ADDRESS par : ${VPS_IP}

  apiUrl: 'http://${VPS_IP}:1011/api',

═══════════════════════════════════════════════════════════════════════════════
ÉTAPE 4 — Premier déploiement (git push)
═══════════════════════════════════════════════════════════════════════════════

  git add .
  git commit -m "feat: add ImmoCam deployment configuration"
  git push origin main

  Le pipeline GitHub Actions va automatiquement :
    1. Lancer les tests backend
    2. Builder le frontend Angular
    3. Construire et pousser les images Docker vers GHCR
    4. Se connecter au VPS et déployer les conteneurs

═══════════════════════════════════════════════════════════════════════════════
ACCÈS À L'APPLICATION (sans domaine)
═══════════════════════════════════════════════════════════════════════════════

  🌐 Frontend    : http://${VPS_IP}:4202
  🔌 API         : http://${VPS_IP}:1011/api
  🔍 Health API  : http://${VPS_IP}:1011/api/actuator/health
  📦 Swagger     : désactivé en prod (activer en dev localement)

═══════════════════════════════════════════════════════════════════════════════
COMMANDES UTILES SUR LE VPS
═══════════════════════════════════════════════════════════════════════════════

  # État des services
  bash ${APP_DIR}/scripts/status.sh

  # Logs en temps réel
  docker logs immocam_api -f
  docker logs immocam_frontend -f
  docker logs immocam_postgres -f

  # Redémarrer un service
  docker compose -f ${APP_DIR}/docker-compose.prod.yml --env-file ${APP_DIR}/.env.prod restart api

  # Backup manuel
  bash ${APP_DIR}/scripts/backup-postgres.sh

  # Arrêter tout ImmoCam
  docker compose -f ${APP_DIR}/docker-compose.prod.yml --env-file ${APP_DIR}/.env.prod down

═══════════════════════════════════════════════════════════════════════════════
MIGRATION VERS UN NOM DE DOMAINE (quand disponible)
═══════════════════════════════════════════════════════════════════════════════

  1. Pointez votre domaine DNS vers ${VPS_IP}
  2. Obtenez un certificat SSL :
       sudo certbot certonly --standalone -d VOTRE_DOMAINE
  3. Modifiez docker-compose.prod.yml :
       - Commentez les "ports:" dans les services api et frontend
       - Décommentez le bloc "nginx-reverse-proxy"
  4. Modifiez nginx-prod.conf :
       - Remplacez VOTRE_DOMAINE
  5. Modifiez .env.prod :
       - STORAGE_BASE_URL=https://VOTRE_DOMAINE/uploads
  6. Modifiez environment.prod.ts :
       - apiUrl: 'https://VOTRE_DOMAINE/api'
  7. git push origin main → redéploiement automatique

=============================================================================
INSTRUCTIONS


chown "${APP_USER}:${APP_USER}" "${APP_DIR}/DEPLOIEMENT-INSTRUCTIONS.txt"

ok "Instructions générées dans ${APP_DIR}/DEPLOIEMENT-INSTRUCTIONS.txt"

# =============================================================================
# Résumé final
# =============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Script 4/4 terminé — VPS prêt ! ✓                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Structure créée :"
echo "    ${APP_DIR}/"
echo "    ├── docker-compose.prod.yml"
echo "    ├── .env.prod.template"
echo "    ├── nginx-prod.conf (pour domaine futur)"
echo "    ├── scripts/"
echo "    │   ├── backup-postgres.sh  (backup auto 2h30)"
echo "    │   └── status.sh           (monitoring rapide)"
echo "    ├── backups/"
echo "    ├── logs/"
echo "    └── DEPLOIEMENT-INSTRUCTIONS.txt"
echo ""
echo -e "  ${YELLOW}══ PROCHAINES ÉTAPES ══${NC}"
echo ""
echo -e "  ${BLUE}1.${NC} Créer .env.prod :"
echo "       cp ${APP_DIR}/.env.prod.template ${APP_DIR}/.env.prod"
echo "       nano ${APP_DIR}/.env.prod"
echo ""
echo -e "  ${BLUE}2.${NC} Remplacer VPS_IP_ADDRESS dans environment.prod.ts :"
echo "       mbemnova-web/src/environments/environment.prod.ts"
echo "       → apiUrl: 'http://${VPS_IP}:1011/api'"
echo ""
echo -e "  ${BLUE}3.${NC} Configurer secrets GitHub Actions (mêmes que TontinePro) :"
echo "       VPS_HOST / VPS_USER / VPS_SSH_KEY"
echo ""
echo -e "  ${BLUE}4.${NC} git push origin main → déploiement automatique !"
echo ""
echo -e "  Lisez aussi : ${APP_DIR}/DEPLOIEMENT-INSTRUCTIONS.txt"
echo ""
echo -e "  ${GREEN}🌐 Frontend sera sur : http://${VPS_IP}:4202${NC}"
echo -e "  ${GREEN}🔌 API sera sur      : http://${VPS_IP}:1011/api${NC}"
echo ""
