#!/usr/bin/env bash
# =============================================================================
#  ImmoCam — Script 3/4 : Docker Compose Production + CI/CD GitHub Actions
#  À exécuter depuis la RACINE du mono-repo (dossier parent contenant
#  les dossiers immocam/ et mbemnova-web/)
#  Usage : bash deploy-03-compose-cicd.sh
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
info() { echo -e "${BLUE}  → $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
err()  { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ImmoCam — Docker Compose & CI/CD (Script 3/4)           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérification : on est dans le bon dossier
if [[ ! -d "immocam" ]] || [[ ! -d "mbemnova-web" ]]; then
  # Essayons un niveau au-dessus
  if [[ -d "../immocam" ]] && [[ -d "../mbemnova-web" ]]; then
    cd ..
    info "Remontée au répertoire parent : $(pwd)"
  else
    err "Impossible de trouver immocam/ et mbemnova-web/\nLancez depuis la racine du projet contenant ces deux dossiers."
  fi
fi

info "Répertoire racine : $(pwd)"
mkdir -p .github/workflows

# =============================================================================
# 1. docker-compose.prod.yml
# =============================================================================
info "Génération : docker-compose.prod.yml"

cat > docker-compose.prod.yml << 'COMPOSE'
# =============================================================================
# ImmoCam — Docker Compose PRODUCTION
#
# Ports exposés sur le VPS (choisis pour ne pas conflicuer avec TontinePro) :
#   - 1011  → API Spring Boot  (interne : 1010)
#   - 4202  → Frontend Angular (interne : 80)
#   - 5433  → PostgreSQL       (interne : 5432) — accès admin uniquement
#
# TontinePro utilise : 8080, 4201, 3306, 9090, 3100 → AUCUN CONFLIT
#
# Accès sans domaine :
#   Frontend : http://VPS_IP:4202
#   API      : http://VPS_IP:1011/api
#   Swagger  : http://VPS_IP:1011/api/swagger-ui.html  (désactivé en prod)
#
# ╔══════════════════════════════════════════════════════════════╗
# ║  QUAND VOUS AUREZ UN NOM DE DOMAINE :                        ║
# ║  Décommentez le bloc "# ── NGINX REVERSE PROXY (domaine) ──" ║
# ║  et commentez les ports exposés directement (4202, 1011)     ║
# ║  Puis relancez : docker compose -f docker-compose.prod.yml   ║
# ║    --env-file .env.prod up -d                                ║
# ╚══════════════════════════════════════════════════════════════╝
# =============================================================================

services:

  # ── PostgreSQL ─────────────────────────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: immocam_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-immocam_db}
      POSTGRES_USER: ${DB_USERNAME:-immocam_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      TZ: Africa/Douala
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # Port exposé uniquement sur localhost (admin/backup uniquement)
    # Pas accessible depuis l'extérieur grâce au firewall
    ports:
      - "127.0.0.1:5433:5432"
    networks:
      - immocam_backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-immocam_user} -d ${DB_NAME:-immocam_db}"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s
    command: >
      postgres
        -c max_connections=50
        -c shared_buffers=128MB
        -c effective_cache_size=256MB
        -c log_min_duration_statement=1000
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ── Backend Spring Boot ─────────────────────────────────────────────────────
  api:
    image: ghcr.io/${GITHUB_REPOSITORY}/immocam-api:${IMAGE_TAG:-latest}
    container_name: immocam_api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_URL: jdbc:postgresql://postgres:5432/${DB_NAME:-immocam_db}
      DB_USERNAME: ${DB_USERNAME:-immocam_user}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      SMTP_HOST: ${SMTP_HOST:-smtp.gmail.com}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USERNAME: ${SMTP_USERNAME}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      EMAIL_FROM: ${EMAIL_FROM:-noreply@immocam.cm}
      EMAIL_FROM_NAME: ${EMAIL_FROM_NAME:-ImmoCam}
      UPLOAD_DIR: /app/uploads/annonces
      UPLOAD_TEMP_DIR: /app/uploads/temp
      # ── Sans domaine : URL publique avec IP et port exposé ──
      # TODO domaine : remplacer par https://VOTRE_DOMAINE/uploads
      STORAGE_BASE_URL: ${STORAGE_BASE_URL:-http://VPS_IP_ADDRESS:1011/api/uploads/}
      JAVA_OPTS: "-Xms256m -Xmx512m -XX:+UseG1GC -XX:+UseContainerSupport"
      APP_TEST_DATA_ENABLED: "false"
      TZ: Africa/Douala
    volumes:
      - uploads_data:/app/uploads
      - api_logs:/app/logs
    # Exposé directement sur le VPS (sans domaine)
    # TODO domaine : commenter ces ports et utiliser le bloc nginx ci-dessous
    ports:
      - "0.0.0.0:1011:1010"
    networks:
      - immocam_backend
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:1010/api/actuator/health | grep -q UP || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 90s
    logging:
      driver: "json-file"
      options:
        max-size: "20m"
        max-file: "5"

  # ── Frontend Angular ────────────────────────────────────────────────────────
  frontend:
    image: ghcr.io/${GITHUB_REPOSITORY}/immocam-frontend:${IMAGE_TAG:-latest}
    container_name: immocam_frontend
    restart: unless-stopped
    depends_on:
      - api
    # Exposé directement sur le VPS (sans domaine)
    # TODO domaine : commenter ces ports et utiliser le bloc nginx ci-dessous
    ports:
      - "0.0.0.0:4202:80"
    networks:
      - immocam_backend
      - immocam_proxy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:80 || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "3"

  # ════════════════════════════════════════════════════════════════════════════
  # BLOC NGINX REVERSE PROXY — À DÉCOMMENTER QUAND VOUS AVEZ UN NOM DE DOMAINE
  # ════════════════════════════════════════════════════════════════════════════
  # Ce bloc nginx gère SSL Let's Encrypt + routing domaine
  # Quand vous décommentez ceci :
  #   1. Commentez les "ports:" dans les services api et frontend ci-dessus
  #   2. Remplacez VOTRE_DOMAINE dans nginx-prod.conf
  #   3. Obtenez le certificat SSL : sudo certbot certonly --standalone -d VOTRE_DOMAINE
  #   4. Relancez : docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
  #
  # nginx-reverse-proxy:
  #   image: nginx:1.27-alpine
  #   container_name: immocam_nginx
  #   restart: unless-stopped
  #   ports:
  #     - "0.0.0.0:NGINX_HTTP_PORT:80"    # Port HTTP libre sur VPS (ex: 8090)
  #     - "0.0.0.0:NGINX_HTTPS_PORT:443"  # Port HTTPS libre sur VPS (ex: 8443)
  #   volumes:
  #     - ./nginx-prod.conf:/etc/nginx/conf.d/default.conf:ro
  #     - /etc/letsencrypt:/etc/letsencrypt:ro
  #     - /var/www/certbot:/var/www/certbot:ro
  #   depends_on:
  #     - api
  #     - frontend
  #   networks:
  #     - immocam_proxy
  #   logging:
  #     driver: "json-file"
  #     options:
  #       max-size: "10m"
  #       max-file: "3"
  # ════════════════════════════════════════════════════════════════════════════

# ── Volumes persistants ───────────────────────────────────────────────────────
volumes:
  postgres_data:
    driver: local
    name: immocam_postgres_data
  uploads_data:
    driver: local
    name: immocam_uploads_data
  api_logs:
    driver: local
    name: immocam_api_logs

# ── Réseaux isolés ────────────────────────────────────────────────────────────
networks:
  immocam_backend:
    driver: bridge
    name: immocam_backend_net
  immocam_proxy:
    driver: bridge
    name: immocam_proxy_net
COMPOSE

ok "docker-compose.prod.yml"

# =============================================================================
# 2. nginx-prod.conf (prêt pour quand le domaine arrivera — commenté dans compose)
# =============================================================================
info "Génération : nginx-prod.conf (pour usage futur avec domaine)"

cat > nginx-prod.conf << 'NGINX_PROD'
# =============================================================================
# ImmoCam — Config Nginx Reverse Proxy (avec nom de domaine + SSL)
#
# À utiliser UNIQUEMENT quand vous avez un nom de domaine.
# Ce fichier est monté dans le conteneur nginx-reverse-proxy (voir compose).
#
# Remplacez VOTRE_DOMAINE par votre vrai domaine (ex: immocam.cm)
# =============================================================================

# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name VOTRE_DOMAINE www.VOTRE_DOMAINE;

    # Challenge Let's Encrypt (renouvellement auto)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS principal
server {
    listen 443 ssl;
    http2 on;
    server_name VOTRE_DOMAINE www.VOTRE_DOMAINE;

    ssl_certificate     /etc/letsencrypt/live/VOTRE_DOMAINE/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/VOTRE_DOMAINE/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 20M;

    # API backend
    location /api/ {
        proxy_pass http://immocam_api:1010/api/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads (fichiers statiques)
    location /uploads/ {
        proxy_pass http://immocam_api:1010/api/uploads/;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend Angular
    location / {
        proxy_pass http://immocam_frontend:80/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_PROD

ok "nginx-prod.conf (prêt pour le domaine)"

# =============================================================================
# 3. .env.prod.template
# =============================================================================
info "Génération : .env.prod.template"

cat > .env.prod.template << 'ENV_TEMPLATE'
# =============================================================================
# ImmoCam — Template variables d'environnement PRODUCTION
# Copier en .env.prod et remplir toutes les valeurs
# NE JAMAIS COMMITTER .env.prod sur Git !
# Emplacement sur le VPS : /opt/immocam/.env.prod
# =============================================================================

# ── Base de données PostgreSQL ────────────────────────────────────────────────
DB_NAME=immocam_db
DB_USERNAME=immocam_user
DB_PASSWORD=REMPLACER_MOT_DE_PASSE_FORT

# ── JWT (générer avec: openssl rand -hex 64) ──────────────────────────────────
JWT_SECRET=REMPLACER_AVEC_openssl_rand_hex_64

# ── Email SMTP ────────────────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=votre-email@gmail.com
SMTP_PASSWORD=xxxx_xxxx_xxxx_xxxx

EMAIL_FROM=noreply@immocam.cm
EMAIL_FROM_NAME=ImmoCam

# ── Stockage uploads ──────────────────────────────────────────────────────────
# Sans domaine : utiliser l'IP du VPS + port backend exposé (1011)
# TODO domaine : remplacer par https://VOTRE_DOMAINE/uploads
STORAGE_BASE_URL=http://VPS_IP_ADDRESS:1011/api/uploads/

# ── Docker Registry (GitHub Container Registry) ───────────────────────────────
# Format : organization/repository (en minuscules)
# Exemple : monorg/monrepo
GITHUB_REPOSITORY=REMPLACER_PAR_VOTRE_ORG_SLASH_REPO
IMAGE_TAG=latest

# ── Spring ────────────────────────────────────────────────────────────────────
SPRING_PROFILES_ACTIVE=prod
ENV_TEMPLATE

ok ".env.prod.template"

# =============================================================================
# 4. GitHub Actions CI/CD
# =============================================================================
info "Génération : .github/workflows/immocam-ci-cd.yml"

cat > .github/workflows/immocam-ci-cd.yml << 'CICD'
# =============================================================================
# ImmoCam — Pipeline CI/CD GitHub Actions
#
# Déclenchement : push sur main ou tag v*.*.*
#
# Jobs :
#   1. test-backend   : Tests Maven + PostgreSQL
#   2. build-frontend : Build Angular production
#   3. build-push     : Build & push images Docker vers GHCR
#   4. deploy         : Déploiement sur VPS via SSH
#
# Secrets GitHub requis (Settings → Secrets and variables → Actions) :
#   VPS_HOST      : IP ou hostname du VPS
#   VPS_USER      : Utilisateur SSH (ex: tontinepro ou immocam)
#   VPS_SSH_KEY   : Clé privée SSH (même que TontinePro si même VPS)
#
# Réutilise les secrets SSH de TontinePro (même VPS) ✓
# =============================================================================

name: 🚀 CI/CD ImmoCam

on:
  push:
    branches: [ main ]
    tags: [ "v*.*.*" ]
    paths:
      # Déclenche uniquement si les dossiers ImmoCam sont modifiés
      - 'immocam/**'
      - 'mbemnova-web/**'
      - 'docker-compose.prod.yml'
      - '.github/workflows/immocam-ci-cd.yml'
  pull_request:
    branches: [ main ]
    paths:
      - 'immocam/**'
      - 'mbemnova-web/**'

env:
  REGISTRY: ghcr.io
  JAVA_VERSION: "21"
  NODE_VERSION: "20"

permissions:
  contents: read
  packages: write

jobs:

  # ════════════════════════════════════════════════════════════
  # JOB 1 : Tests Backend Spring Boot
  # ════════════════════════════════════════════════════════════
  test-backend:
    name: 🧪 Tests Backend (Spring Boot + PostgreSQL)
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: immocam_test
          POSTGRES_USER: immocam_user
          POSTGRES_PASSWORD: testpassword
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U immocam_user -d immocam_test"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 10

    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: ☕ Setup Java ${{ env.JAVA_VERSION }}
        uses: actions/setup-java@v4
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: temurin
          cache: maven

      - name: 🔧 Permissions mvnw
        working-directory: immocam
        run: chmod +x mvnw

      - name: 🧪 Tests Maven
        working-directory: immocam
        run: ./mvnw test -B
        env:
          SPRING_PROFILES_ACTIVE: test
          DB_URL: jdbc:postgresql://localhost:5432/immocam_test
          DB_USERNAME: immocam_user
          DB_PASSWORD: testpassword
          JWT_SECRET: test-secret-key-for-ci-cd-pipeline-only-long-enough-64chars-ok
          SMTP_USERNAME: test@test.com
          SMTP_PASSWORD: test
          STORAGE_BASE_URL: http://localhost:1010/api/uploads/

      - name: 📊 Rapport de tests
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: immocam-backend-test-results
          path: immocam/target/surefire-reports/
          retention-days: 7

  # ════════════════════════════════════════════════════════════
  # JOB 2 : Build Frontend Angular
  # ════════════════════════════════════════════════════════════
  build-frontend:
    name: 🧪 Build Frontend (Angular)
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: 🟢 Setup Node ${{ env.NODE_VERSION }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
          cache-dependency-path: mbemnova-web/package-lock.json

      - name: 📦 npm ci
        working-directory: mbemnova-web
        run: npm ci --prefer-offline --no-audit

      - name: 🏗️ Build production
        working-directory: mbemnova-web
        run: npx ng build --configuration=production

  # ════════════════════════════════════════════════════════════
  # JOB 3 : Build & Push images Docker vers GHCR
  # ════════════════════════════════════════════════════════════
  build-push:
    name: 🐳 Build & Push Images Docker
    runs-on: ubuntu-latest
    needs: [ test-backend, build-frontend ]
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v')

    outputs:
      image_tag: ${{ steps.tag.outputs.sha }}
      repo: ${{ steps.tag.outputs.repo }}

    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: 🏷️ Calcul du tag
        id: tag
        run: |
          SHA=$(echo "${{ github.sha }}" | cut -c1-7)
          REPO=$(echo "${{ github.repository }}" | tr '[:upper:]' '[:lower:]')
          echo "sha=${SHA}" >> $GITHUB_OUTPUT
          echo "repo=${REPO}" >> $GITHUB_OUTPUT
          echo "Tag: ${SHA} | Repo: ${REPO}"

      - name: 🔑 Login GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: 🛠️ Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      # ── Image Backend ───────────────────────────────────────
      - name: 🏗️ Build & Push API
        uses: docker/build-push-action@v6
        with:
          context: ./immocam
          file: ./immocam/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ steps.tag.outputs.repo }}/immocam-api:${{ steps.tag.outputs.sha }}
            ${{ env.REGISTRY }}/${{ steps.tag.outputs.repo }}/immocam-api:latest
          cache-from: type=gha,scope=immocam-api
          cache-to: type=gha,mode=max,scope=immocam-api
          platforms: linux/amd64

      # ── Image Frontend ──────────────────────────────────────
      - name: 🏗️ Build & Push Frontend
        uses: docker/build-push-action@v6
        with:
          context: ./mbemnova-web
          file: ./mbemnova-web/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ steps.tag.outputs.repo }}/immocam-frontend:${{ steps.tag.outputs.sha }}
            ${{ env.REGISTRY }}/${{ steps.tag.outputs.repo }}/immocam-frontend:latest
          cache-from: type=gha,scope=immocam-frontend
          cache-to: type=gha,mode=max,scope=immocam-frontend
          platforms: linux/amd64

  # ════════════════════════════════════════════════════════════
  # JOB 4 : Déploiement sur VPS
  # ════════════════════════════════════════════════════════════
  deploy:
    name: 🚀 Deploy → VPS (IP directe)
    runs-on: ubuntu-latest
    needs: build-push
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v')

    environment:
      name: production-immocam

    steps:
      - name: 🚀 Deploy via SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: 22
          timeout: 300s
          script: |
            set -euo pipefail

            APP_DIR="/opt/immocam"
            IMAGE_TAG="${{ needs.build-push.outputs.image_tag }}"
            REPO="${{ needs.build-push.outputs.repo }}"

            echo "🚀 Déploiement ImmoCam — tag: ${IMAGE_TAG}"
            echo "   Repo: ${REPO}"

            # Vérifier que .env.prod existe
            if [ ! -f "${APP_DIR}/.env.prod" ]; then
              echo "❌ ERREUR: ${APP_DIR}/.env.prod introuvable!"
              echo "   Créez-le depuis .env.prod.template"
              echo "   Voir : /opt/immocam/.env.prod.template"
              exit 1
            fi

            cd "${APP_DIR}"

            # Mise à jour du tag dans .env.prod
            sed -i "s|^IMAGE_TAG=.*|IMAGE_TAG=${IMAGE_TAG}|" "${APP_DIR}/.env.prod"
            sed -i "s|^GITHUB_REPOSITORY=.*|GITHUB_REPOSITORY=${REPO}|" "${APP_DIR}/.env.prod"

            # Login GHCR
            echo "${{ secrets.GITHUB_TOKEN }}" | \
              docker login ghcr.io -u "${{ github.actor }}" --password-stdin

            # Pull des nouvelles images
            echo "📥 Pull image API..."
            docker pull "ghcr.io/${REPO}/immocam-api:${IMAGE_TAG}"
            echo "📥 Pull image Frontend..."
            docker pull "ghcr.io/${REPO}/immocam-frontend:${IMAGE_TAG}"

            # Export des variables
            export IMAGE_TAG
            export GITHUB_REPOSITORY="${REPO}"

            # Démarrage / mise à jour des conteneurs
            echo "🔄 Mise à jour des conteneurs..."
            docker compose \
              -f "${APP_DIR}/docker-compose.prod.yml" \
              --env-file "${APP_DIR}/.env.prod" \
              up -d --remove-orphans --no-build

            # Attendre que l'API soit healthy
            echo "⏳ Attente API (max 3 minutes)..."
            ATTEMPTS=0
            MAX=36
            until docker inspect --format='{{.State.Health.Status}}' immocam_api 2>/dev/null | grep -q "healthy"; do
              ATTEMPTS=$((ATTEMPTS + 1))
              if [ "${ATTEMPTS}" -ge "${MAX}" ]; then
                echo "⚠️  Timeout : API pas encore healthy après ${MAX} tentatives"
                echo "   Logs récents :"
                docker logs immocam_api --tail=30 2>&1 || true
                echo "   Déploiement considéré OK si le conteneur tourne."
                break
              fi
              echo "   ⌛ Tentative ${ATTEMPTS}/${MAX}..."
              sleep 5
            done

            # Nettoyage des vieilles images
            docker image prune -f > /dev/null 2>&1 || true

            echo ""
            echo "✅ ══ Déploiement ImmoCam réussi ! ══"
            echo "🌐 Frontend : http://$(curl -s ifconfig.me 2>/dev/null || echo 'VPS_IP'):4202"
            echo "🔌 API      : http://$(curl -s ifconfig.me 2>/dev/null || echo 'VPS_IP'):1011/api"
            echo "📅 $(date)"
            echo ""

            # État des conteneurs ImmoCam
            docker compose \
              -f "${APP_DIR}/docker-compose.prod.yml" \
              --env-file "${APP_DIR}/.env.prod" \
              ps
CICD

ok ".github/workflows/immocam-ci-cd.yml"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Script 3/4 terminé ✓                                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Fichiers créés dans : $(pwd)"
echo "    ✓ docker-compose.prod.yml"
echo "    ✓ nginx-prod.conf (pour usage futur avec domaine)"
echo "    ✓ .env.prod.template"
echo "    ✓ .github/workflows/immocam-ci-cd.yml"
echo ""
echo -e "  ${YELLOW}→ Lancez maintenant : bash deploy-04-vps-setup.sh${NC}"
echo "    (ce script est à exécuter sur le VPS, pas en local)"
echo ""
