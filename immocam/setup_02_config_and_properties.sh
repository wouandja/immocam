#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — SCRIPT 02 : CONFIGURATION & CONTENEURISATION (Version BASH pur)
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
WARN()    { echo -e "${YELLOW}[!]${NC} $1"; }
ERROR()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; \
            echo -e "${CYAN}  $1${NC}"; \
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

[[ -f "pom.xml" ]] || ERROR "Lancez ce script depuis la racine du projet."

SECTION "SCRIPT 02 — CONFIGURATION & CONTENEURISATION"
INFO "Répertoire : $(pwd)"

RES="src/main/resources"
mkdir -p "$RES"
mkdir -p src/test/resources

# =============================================================================
# 1. application.yaml
# =============================================================================
SECTION "1/6 — application.yaml"

cat > "$RES/application.yaml" << 'EOF'
# =============================================================================
# IMMOCAM — Configuration principale
# =============================================================================

spring:
  application:
    name: immocam

  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/immocam_db}
    username: ${DB_USERNAME:immocam_user}
    password: ${DB_PASSWORD:changeme}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: ${DB_POOL_MAX:10}
      minimum-idle: ${DB_POOL_MIN:2}
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      pool-name: ImmoCamHikariPool

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        default_batch_fetch_size: 20
        jdbc:
          batch_size: 20
          order_inserts: true
    open-in-view: false

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    validate-on-migrate: true

  mail:
    host: ${SMTP_HOST:smtp.gmail.com}
    port: ${SMTP_PORT:587}
    username: ${SMTP_USERNAME:}
    password: ${SMTP_PASSWORD:}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=50000,expireAfterWrite=3600s

  servlet:
    multipart:
      enabled: true
      max-file-size: ${UPLOAD_MAX_FILE_SIZE:4MB}
      max-request-size: ${UPLOAD_MAX_REQUEST_SIZE:20MB}

  thymeleaf:
    prefix: classpath:/templates/
    suffix: .html
    cache: true
    encoding: UTF-8

  jackson:
    serialization:
      write-dates-as-timestamps: false
    default-property-inclusion: non_null
    time-zone: Africa/Douala

server:
  port: ${SERVER_PORT:8080}
  servlet:
    context-path: /api
  compression:
    enabled: true
    mime-types: application/json
    min-response-size: 1024
  error:
    include-message: always
    include-stacktrace: never
  tomcat:
    connection-timeout: 20000
    threads:
      max: 200

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
      base-path: /actuator
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true

springdoc:
  api-docs:
    path: /v3/api-docs
    enabled: ${SWAGGER_ENABLED:true}
  swagger-ui:
    path: /swagger-ui.html
    enabled: ${SWAGGER_ENABLED:true}

immocam:
  storage:
    upload-dir: ${UPLOAD_DIR:./uploads/annonces}
    temp-dir: ${UPLOAD_TEMP_DIR:./uploads/temp}
    base-url: ${STORAGE_BASE_URL:http://localhost:8080/uploads}
    compression:
      enabled: true
      qualite: 0.80
      largeur-max: 1280
    max-photos-par-annonce: ${MAX_PHOTOS:4}
  security:
    jwt:
      secret: ${JWT_SECRET:CHANGE_THIS_IN_PRODUCTION}
      access-expiration-ms: ${JWT_ACCESS_EXP:3600000}
      refresh-expiration-ms: ${JWT_REFRESH_EXP:2592000000}
    rate-limit:
      requetes-par-minute: ${RATE_LIMIT_RPM:100}
  annonce:
    duree-vie-jours: ${ANNONCE_DUREE:30}
    max-annonces-par-proprietaire: ${MAX_ANNONCES:5}
  scheduler:
    expiration-cron: ${SCHEDULER_CRON:0 0 3 * * *}
    enabled: ${SCHEDULER_ENABLED:true}

---
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: jdbc:postgresql://localhost:5432/immocam_dev
    username: immocam_user
    password: devpassword
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  thymeleaf:
    cache: false
  mail:
    host: localhost
    port: 1025
server:
  error:
    include-stacktrace: always
immocam:
  security:
    jwt:
      secret: dev-secret-key-only-for-development
  scheduler:
    enabled: false
springdoc:
  swagger-ui:
    enabled: true

---
spring:
  config:
    activate:
      on-profile: prod
  jpa:
    show-sql: false
  thymeleaf:
    cache: true
server:
  error:
    include-message: never
    include-stacktrace: never
immocam:
  scheduler:
    enabled: true
springdoc:
  swagger-ui:
    enabled: false
  api-docs:
    enabled: false
EOF

OK "application.yaml généré"

# =============================================================================
# 2. application-test.yaml
# =============================================================================
SECTION "2/6 — application-test.yaml"

cat > src/test/resources/application-test.yaml << 'EOF'
spring:
  datasource:
    url: jdbc:h2:mem:immocam_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: false
  flyway:
    enabled: false
  cache:
    type: simple
immocam:
  storage:
    upload-dir: ./target/test-uploads
    compression:
      enabled: false
  security:
    jwt:
      secret: test-secret-key-minimum-32-chars
  scheduler:
    enabled: false
server:
  port: 0
EOF

OK "application-test.yaml généré"

# =============================================================================
# 3. logback-spring.xml
# =============================================================================
SECTION "3/6 — logback-spring.xml"

cat > "$RES/logback-spring.xml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <springProperty scope="context" name="APP_NAME" source="spring.application.name" defaultValue="immocam"/>

  <springProfile name="dev,default">
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
      <encoder>
        <pattern>%d{HH:mm:ss.SSS} %highlight(%-5level) [%thread] %logger{36} - %msg%n</pattern>
      </encoder>
    </appender>
    <root level="INFO">
      <appender-ref ref="CONSOLE"/>
    </root>
    <logger name="com.mbem.immocam" level="DEBUG"/>
    <logger name="org.hibernate.SQL" level="DEBUG"/>
  </springProfile>

  <springProfile name="prod">
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
      <encoder>
        <pattern>{"timestamp":"%d{ISO8601}","level":"%level","app":"${APP_NAME}","message":"%msg"}%n</pattern>
      </encoder>
    </appender>
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
      <file>logs/immocam.log</file>
      <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>logs/immocam-%d{yyyy-MM-dd}.log.gz</fileNamePattern>
        <maxHistory>30</maxHistory>
      </rollingPolicy>
      <encoder>
        <pattern>{"timestamp":"%d{ISO8601}","level":"%level","app":"${APP_NAME}","message":"%msg"}%n</pattern>
      </encoder>
    </appender>
    <root level="WARN">
      <appender-ref ref="CONSOLE"/>
      <appender-ref ref="FILE"/>
    </root>
    <logger name="com.mbem.immocam" level="INFO"/>
  </springProfile>

  <logger name="org.springframework.security" level="WARN"/>
  <logger name="org.flywaydb" level="INFO"/>
</configuration>
EOF

OK "logback-spring.xml généré"

# =============================================================================
# 4. Dockerfile
# =============================================================================
SECTION "4/6 — Dockerfile"

cat > Dockerfile << 'EOF'
# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN ./mvnw dependency:go-offline -B
COPY src src
RUN ./mvnw package -DskipTests -B
RUN java -Djarmode=layertools -jar target/*.jar extract --destination /build/extracted

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine AS runtime
LABEL maintainer="MBEMNOVA"
WORKDIR /app
RUN addgroup -g 1001 immocam && \
    adduser -u 1001 -G immocam -s /bin/sh -D immocam
RUN mkdir -p /app/uploads/annonces /app/uploads/temp /app/logs && \
    chown -R immocam:immocam /app
USER immocam
COPY --chown=immocam:immocam --from=builder /build/extracted/dependencies/ ./
COPY --chown=immocam:immocam --from=builder /build/extracted/spring-boot-loader/ ./
COPY --chown=immocam:immocam --from=builder /build/extracted/snapshot-dependencies/ ./
COPY --chown=immocam:immocam --from=builder /build/extracted/application/ ./
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/actuator/health | grep -q UP || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
EOF

OK "Dockerfile généré"

# =============================================================================
# 5. docker-compose.yml
# =============================================================================
SECTION "5/6 — docker-compose.yml"

cat > docker-compose.yml << 'EOF'
version: '3.9'

volumes:
  postgres_data:
  uploads_data:

networks:
  immocam_network:
    driver: bridge

services:
  postgres:
    image: postgres:16-alpine
    container_name: immocam_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-immocam_db}
      POSTGRES_USER: ${DB_USERNAME:-immocam_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - immocam_network
    ports:
      - "${DB_EXPOSE_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-immocam_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
    command: postgres -c max_connections=50 -c shared_buffers=128MB

  api:
    build: .
    image: immocam-api:latest
    container_name: immocam_api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-prod}
      DB_URL: jdbc:postgresql://postgres:5432/${DB_NAME:-immocam_db}
      DB_USERNAME: ${DB_USERNAME:-immocam_user}
      DB_PASSWORD: ${DB_PASSWORD:-changeme}
      JWT_SECRET: ${JWT_SECRET}
      SMTP_HOST: ${SMTP_HOST:-smtp.gmail.com}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USERNAME: ${SMTP_USERNAME:-}
      SMTP_PASSWORD: ${SMTP_PASSWORD:-}
      UPLOAD_DIR: /app/uploads/annonces
      STORAGE_BASE_URL: ${STORAGE_BASE_URL:-https://immocam.cm/uploads}
      JAVA_OPTS: "-Xms256m -Xmx512m -XX:+UseG1GC"
    volumes:
      - uploads_data:/app/uploads
      - ./logs:/app/logs
    networks:
      - immocam_network
    ports:
      - "${API_PORT:-8080}:8080"
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8080/api/actuator/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 90s
EOF

OK "docker-compose.yml généré"

# =============================================================================
# 6. .env.example et .dockerignore
# =============================================================================
SECTION "6/6 — .env.example + .dockerignore"

cat > .env.example << 'EOF'
# =============================================================================
# IMMOCAM — Variables d'environnement
# Copier ce fichier en .env et remplir les valeurs
# =============================================================================

# Base de données
DB_NAME=immocam_db
DB_USERNAME=immocam_user
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_EXPOSE_PORT=5432

# JWT (générer avec: openssl rand -hex 64)
JWT_SECRET=CHANGE_ME_GENERATE_WITH_OPENSSL_RAND_HEX_64

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe

# Stockage
STORAGE_BASE_URL=https://immocam.cm/uploads

# Serveur
API_PORT=8080
SPRING_PROFILES_ACTIVE=prod

# Limites
MAX_ANNONCES=5
MAX_PHOTOS=4
ANNONCE_DUREE=30
RATE_LIMIT_RPM=100
EOF

# Créer .env pour le dev s'il n'existe pas
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
DB_NAME=immocam_dev
DB_USERNAME=immocam_user
DB_PASSWORD=devpassword
JWT_SECRET=dev-secret-key-only-for-development
SPRING_PROFILES_ACTIVE=dev
API_PORT=8080
EOF
    OK ".env créé (profil dev)"
else
    INFO ".env existant conservé"
fi

cat > .dockerignore << 'EOF'
target/
!.gitignore
.idea/
.vscode/
*.md
setup_*.sh
.env
.env.*
logs/
uploads/
src/test/
.git/
EOF

OK ".env.example et .dockerignore générés"

# =============================================================================
# Résumé
# =============================================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SCRIPT 02 TERMINÉ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Fichiers générés :"
INFO "  src/main/resources/application.yaml"
INFO "  src/test/resources/application-test.yaml"
INFO "  src/main/resources/logback-spring.xml"
INFO "  Dockerfile"
INFO "  docker-compose.yml"
INFO "  .env.example + .env (dev)"
INFO "  .dockerignore"
echo ""
WARN "ACTION REQUISE avant production :"
WARN "  1. Modifier .env avec vos valeurs réelles"
WARN "  2. Générer JWT_SECRET: openssl rand -hex 64"
WARN "  3. Configurer SMTP"
echo ""
INFO "Prochaine étape : bash setup_03_shared_and_enums.sh"