#!/usr/bin/env bash
# =============================================================================
#  ImmoCam — Script 2/4 : Fichiers Docker & Config Frontend Angular
#  À exécuter depuis la RACINE du projet frontend : mbemnova-web/
#  Usage : bash deploy-02-frontend-files.sh
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
info() { echo -e "${BLUE}  → $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
err()  { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ImmoCam — Génération fichiers Frontend (Script 2/4)    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérification : on est bien dans le dossier frontend
if [[ ! -f "package.json" ]] || ! grep -q "mbemnova-web\|immocam" package.json 2>/dev/null; then
  err "Lancez ce script depuis la racine du projet frontend (dossier mbemnova-web/ contenant package.json)"
fi

info "Répertoire détecté : $(pwd)"

# =============================================================================
# 1. Dockerfile frontend (Angular → Nginx)
# =============================================================================
info "Génération : Dockerfile (frontend)"

cat > Dockerfile << 'DOCKERFILE'
# =============================================================================
# ImmoCam — Dockerfile Frontend Angular
# Multi-stage : Build Angular + Nginx léger
# =============================================================================

# ── Stage 1 : Build Angular ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copie des manifestes en premier (cache Docker optimal)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

COPY . .

# Build production (utilise l'Angular CLI local)
ENV PATH=/app/node_modules/.bin:$PATH
RUN ng build --configuration=production

# ── Stage 2 : Nginx ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

LABEL maintainer="MBEMNOVA" \
      app="immocam-frontend"

# Supprimer la config par défaut
RUN rm -f /etc/nginx/conf.d/default.conf

# Config nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie du build Angular (outputPath dans angular.json : dist/immocam-frontend)
COPY --from=builder /app/dist/immocam-frontend /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
DOCKERFILE

ok "Dockerfile frontend"

# =============================================================================
# 2. nginx.conf (SPA routing + proxy vers backend)
# =============================================================================
info "Génération : nginx.conf"

cat > nginx.conf << 'NGINX'
# =============================================================================
# ImmoCam — Config Nginx Frontend (dans le conteneur)
# Sert l'Angular SPA + proxifie /api vers le backend
# =============================================================================

server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # ── Compression ──────────────────────────────────────────────────────────
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types
        text/plain text/css application/javascript application/json
        application/x-javascript text/xml application/xml
        application/xml+rss text/javascript image/svg+xml
        application/vnd.ms-fontobject application/x-font-ttf font/opentype;

    # ── Assets statiques (cache long) ────────────────────────────────────────
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
    }

    # ── Proxy vers API backend ────────────────────────────────────────────────
    # Le frontend appelle /api/* → redirigé vers le conteneur backend
    location /api/ {
        proxy_pass http://immocam_api:1010/api/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
    }

    # ── SPA routing (Angular Router) ─────────────────────────────────────────
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # ── Headers de sécurité ───────────────────────────────────────────────────
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ── Logs ─────────────────────────────────────────────────────────────────
    access_log /var/log/nginx/immocam_access.log;
    error_log  /var/log/nginx/immocam_error.log warn;
}
NGINX

ok "nginx.conf"

# =============================================================================
# 3. .dockerignore frontend
# =============================================================================
info "Génération : .dockerignore"

cat > .dockerignore << 'DOCKERIGNORE'
node_modules/
dist/
.angular/
.vscode/
.git/
*.md
*.sh
.env
.env.*
coverage/
.nyc_output/
ng-*.sh
DOCKERIGNORE

ok ".dockerignore"

# =============================================================================
# 4. environment.prod.ts — pointe vers l'IP VPS par port
#    (à modifier quand le nom de domaine sera disponible)
# =============================================================================
info "Génération : src/environments/environment.prod.ts"

mkdir -p src/environments

cat > src/environments/environment.prod.ts << 'ENV_PROD'
// =============================================================================
// ImmoCam — Environnement PRODUCTION
//
// SANS NOM DE DOMAINE : l'API est accessible via IP:PORT du VPS
//
// ╔══════════════════════════════════════════════════════════════╗
// ║  QUAND VOUS AUREZ UN NOM DE DOMAINE :                        ║
// ║  1. Remplacez l'IP par votre domaine dans apiUrl             ║
// ║  2. Passez http → https                                      ║
// ║  3. Supprimez le commentaire "TODO: domaine"                 ║
// ║  Exemple: apiUrl: 'https://immocam.cm/api'                   ║
// ╚══════════════════════════════════════════════════════════════╝
//
// TODO: domaine — remplacer par https://VOTRE_DOMAINE/api
// =============================================================================

export const environment = {
  production: true,

  // ── Remplacez VPS_IP_ADDRESS par l'IP réelle de votre VPS ──
  // Le frontend tourne sur le port 4202, le backend sur 1011
  // Le nginx interne du frontend proxifie /api → backend:1010
  // MAIS depuis le navigateur client, l'appel va vers le VPS directement
  // Donc apiUrl pointe vers l'IP publique du VPS + port backend exposé
  apiUrl: 'http://VPS_IP_ADDRESS:1011/api',

  // TODO domaine : apiUrl: 'https://VOTRE_DOMAINE/api',
};
ENV_PROD

ok "src/environments/environment.prod.ts"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Script 2/4 terminé ✓                                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Fichiers créés dans : $(pwd)"
echo "    ✓ Dockerfile"
echo "    ✓ nginx.conf"
echo "    ✓ .dockerignore"
echo "    ✓ src/environments/environment.prod.ts"
echo ""
echo -e "  ${YELLOW}⚠  IMPORTANT : Ouvrez src/environments/environment.prod.ts${NC}"
echo -e "  ${YELLOW}   et remplacez VPS_IP_ADDRESS par l'IP réelle de votre VPS${NC}"
echo ""
echo -e "  ${YELLOW}→ Lancez maintenant : bash deploy-03-compose-cicd.sh${NC}"
echo "    (depuis la racine du MONO-REPO contenant les deux projets)"
echo ""
