#!/usr/bin/env bash
# =============================================================================
#  ImmoCam — Script 1/4 : Fichiers Docker & Config Backend
#  À exécuter depuis la RACINE du projet backend : code/immocam/
#  Usage : bash deploy-01-backend-files.sh
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
info() { echo -e "${BLUE}  → $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
err()  { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ImmoCam — Génération fichiers Backend (Script 1/4)     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérification : on est bien dans le dossier backend
if [[ ! -f "pom.xml" ]]; then
  err "Lancez ce script depuis la racine du projet backend (dossier immocam/ contenant pom.xml)"
fi

info "Répertoire détecté : $(pwd)"

# =============================================================================
# 1. Dockerfile backend (Spring Boot — layered jar)
# =============================================================================
info "Génération : Dockerfile (backend)"

cat > Dockerfile << 'DOCKERFILE'
# =============================================================================
# ImmoCam — Dockerfile Backend Spring Boot
# Multi-stage : Build Maven + Runtime JRE léger
# =============================================================================

# ── Stage 1 : Build ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src src

RUN ./mvnw package -DskipTests -B && \
    java -Djarmode=layertools -jar target/*.jar extract --destination /build/extracted

# ── Stage 2 : Runtime ────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL maintainer="MBEMNOVA" \
      app="immocam-api" \
      version="1.0"

WORKDIR /app

# Utilisateur non-root
RUN addgroup -g 1001 immocam && \
    adduser -u 1001 -G immocam -s /bin/sh -D immocam

# Dossiers nécessaires
RUN mkdir -p /app/uploads/annonces /app/uploads/temp /app/logs && \
    chown -R immocam:immocam /app

USER immocam

# Copie layers (cache Docker optimisé)
COPY --chown=immocam:immocam --from=builder /build/extracted/dependencies/ ./
COPY --chown=immocam:immocam --from=builder /build/extracted/spring-boot-loader/ ./
COPY --chown=immocam:immocam --from=builder /build/extracted/snapshot-dependencies/ ./
COPY --chown=immocam:immocam --from=builder /build/extracted/application/ ./

EXPOSE 1010

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:+UseContainerSupport"

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD wget -qO- http://localhost:1010/api/actuator/health | grep -q UP || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
DOCKERFILE

ok "Dockerfile backend"

# =============================================================================
# 2. .dockerignore backend
# =============================================================================
info "Génération : .dockerignore"

cat > .dockerignore << 'DOCKERIGNORE'
target/
!.gitignore
.idea/
.vscode/
*.md
setup_*.sh
deploy-*.sh
.env
.env.*
logs/
uploads/
src/test/
.git/
*.bat
*.ps1
test_*.sh
test_*.ps1
DOCKERIGNORE

ok ".dockerignore"

# =============================================================================
# 3. application-prod.yml complet
# =============================================================================
info "Génération : src/main/resources/application-prod.yml"

cat > src/main/resources/application-prod.yml << 'PROD_YML'
# =============================================================================
# ImmoCam — Configuration PRODUCTION
# Les valeurs sensibles sont injectées via variables d'environnement
# =============================================================================

spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

  jpa:
    show-sql: false
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        format_sql: false

  flyway:
    enabled: true
    baseline-on-migrate: true
    validate-on-migrate: true

  mail:
    host: ${SMTP_HOST:smtp.gmail.com}
    port: ${SMTP_PORT:587}
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
          connectiontimeout: 5000
          timeout: 5000
          writetimeout: 5000

  thymeleaf:
    cache: true

server:
  error:
    include-message: never
    include-stacktrace: never

# Swagger désactivé en prod
springdoc:
  api-docs:
    enabled: false
  swagger-ui:
    enabled: false

immocam:
  email:
    from: ${EMAIL_FROM:noreply@immocam.cm}
    from-name: ${EMAIL_FROM_NAME:ImmoCam}
  storage:
    upload-dir: ${UPLOAD_DIR:/app/uploads/annonces}
    temp-dir: ${UPLOAD_TEMP_DIR:/app/uploads/temp}
    base-url: ${STORAGE_BASE_URL}
  security:
    jwt:
      secret: ${JWT_SECRET}
  scheduler:
    enabled: true

logging:
  level:
    root: WARN
    com.mbem.immocam: INFO
  file:
    name: /app/logs/immocam.log
  logback:
    rollingpolicy:
      max-file-size: 10MB
      max-history: 7
PROD_YML

ok "application-prod.yml"

# =============================================================================
# 4. healthcheck.sh
# =============================================================================
info "Génération : healthcheck.sh"

cat > healthcheck.sh << 'HEALTH'
#!/bin/sh
wget -qO- http://localhost:1010/api/actuator/health | grep -q '"status":"UP"'
HEALTH

chmod +x healthcheck.sh
ok "healthcheck.sh"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Script 1/4 terminé ✓                                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Fichiers créés dans : $(pwd)"
echo "    ✓ Dockerfile"
echo "    ✓ .dockerignore"
echo "    ✓ src/main/resources/application-prod.yml"
echo "    ✓ healthcheck.sh"
echo ""
echo -e "  ${YELLOW}→ Lancez maintenant : bash deploy-02-frontend-files.sh${NC}"
echo "    (depuis la racine du projet frontend : mbemnova-web/)"
echo ""
