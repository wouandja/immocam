#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — SCRIPT 01 SANS PYTHON
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
ERROR()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
SECTION() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; \
            echo -e "${CYAN}  $1${NC}"; \
            echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

SECTION "SCRIPT 01 — POM.XML + ARBORESCENCE"
INFO "Répertoire courant : $(pwd)"

# =============================================================================
# PARTIE 1 — POM.XML COMPLET (en BASH uniquement)
# =============================================================================
SECTION "1/2 — Génération du pom.xml"

cat > pom.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.5</version>
    <relativePath/>
  </parent>

  <groupId>com.mbem</groupId>
  <artifactId>immocam</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>ImmoCam</name>
  <description>Plateforme immobiliere camerounaise — MBEMNOVA</description>

  <properties>
    <java.version>21</java.version>
    <jjwt.version>0.12.6</jjwt.version>
    <thumbnailator.version>0.4.20</thumbnailator.version>
    <mapstruct.version>1.6.3</mapstruct.version>
    <lombok.version>1.18.36</lombok.version>
    <flyway.version>10.15.0</flyway.version>
    <springdoc.version>2.8.8</springdoc.version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-api</artifactId>
      <version>${jjwt.version}</version>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-impl</artifactId>
      <version>${jjwt.version}</version>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-jackson</artifactId>
      <version>${jjwt.version}</version>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-core</artifactId>
      <version>${flyway.version}</version>
    </dependency>
    <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-database-postgresql</artifactId>
      <version>${flyway.version}</version>
    </dependency>
    <dependency>
      <groupId>net.coobird</groupId>
      <artifactId>thumbnailator</artifactId>
      <version>${thumbnailator.version}</version>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-mail</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-cache</artifactId>
    </dependency>
    <dependency>
      <groupId>com.github.ben-manes.caffeine</groupId>
      <artifactId>caffeine</artifactId>
    </dependency>
    <dependency>
      <groupId>org.mapstruct</groupId>
      <artifactId>mapstruct</artifactId>
      <version>${mapstruct.version}</version>
    </dependency>
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <version>${lombok.version}</version>
      <optional>true</optional>
    </dependency>
    <dependency>
      <groupId>org.springdoc</groupId>
      <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
      <version>${springdoc.version}</version>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.security</groupId>
      <artifactId>spring-security-test</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <configuration>
          <excludes>
            <exclude>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
            </exclude>
          </excludes>
        </configuration>
      </plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <configuration>
          <source>21</source>
          <target>21</target>
          <annotationProcessorPaths>
            <path>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
              <version>${lombok.version}</version>
            </path>
            <path>
              <groupId>org.mapstruct</groupId>
              <artifactId>mapstruct-processor</artifactId>
              <version>${mapstruct.version}</version>
            </path>
          </annotationProcessorPaths>
          <compilerArgs>
            <arg>-Amapstruct.defaultComponentModel=spring</arg>
            <arg>-Amapstruct.unmappedTargetPolicy=WARN</arg>
          </compilerArgs>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
EOF

OK "pom.xml généré"

# =============================================================================
# PARTIE 2 — ARBORESCENCE COMPLÈTE
# =============================================================================
SECTION "2/2 — Création de l'arborescence"

JAVA="src/main/java/com/mbem/immocam"
RES="src/main/resources"
TEST="src/test/java/com/mbem/immocam"

mkd() { mkdir -p "$1" && OK "mkdir $1"; }

# Création de tous les dossiers
mkd "$JAVA/config"
mkd "$JAVA/shared/enums"
mkd "$JAVA/shared/constants"
mkd "$JAVA/shared/response"
mkd "$JAVA/shared/pagination"
mkd "$JAVA/shared/utils"
mkd "$JAVA/shared/validation"
mkd "$JAVA/shared/entity"
mkd "$JAVA/infrastructure/security/config"
mkd "$JAVA/infrastructure/security/filter"
mkd "$JAVA/infrastructure/security/jwt"
mkd "$JAVA/infrastructure/security/userdetails"
mkd "$JAVA/infrastructure/storage/service"
mkd "$JAVA/infrastructure/storage/config"
mkd "$JAVA/infrastructure/email/service"
mkd "$JAVA/infrastructure/scheduler"
mkd "$JAVA/infrastructure/exception/handler"
mkd "$JAVA/infrastructure/exception/custom"
mkd "$JAVA/infrastructure/audit"

# Modules
for module in auth utilisateur annonce photo commentaire favori contact signalement localisation typebien config admin; do
    mkd "$JAVA/module/$module/controller"
    mkd "$JAVA/module/$module/service"
    mkd "$JAVA/module/$module/repository"
    mkd "$JAVA/module/$module/entity"
    mkd "$JAVA/module/$module/dto/request"
    mkd "$JAVA/module/$module/dto/response"
    case $module in
        annonce) mkd "$JAVA/module/annonce/specification" ;;
        utilisateur|annonce|commentaire) mkd "$JAVA/module/$module/mapper" ;;
    esac
done

# Resources
mkd "$RES/db/migration"
mkd "$RES/templates/email"
mkd "$RES/static"

# Uploads
mkdir -p uploads/annonces uploads/temp
touch uploads/annonces/.gitkeep uploads/temp/.gitkeep
OK "uploads/ créés"

# Tests
mkd "$TEST/module/auth"
mkd "$TEST/module/annonce"
mkd "$TEST/module/commentaire"
mkd "$TEST/module/favori"
mkd "$TEST/module/contact"
mkd "$TEST/module/signalement"
mkd "$TEST/infrastructure/storage"
mkd "$TEST/infrastructure/email"
mkd "$TEST/infrastructure/security"
mkd "$TEST/integration"

# Mise à jour .gitignore (sans Python)
echo "" >> .gitignore 2>/dev/null || true
cat >> .gitignore << 'EOF'

# Uploads VPS
uploads/annonces/*
uploads/temp/*
!uploads/annonces/.gitkeep
!uploads/temp/.gitkeep

# Secrets
.env
.env.local
application-prod.yml

# Logs
logs/
*.log
EOF

OK ".gitignore mis à jour"

# Résumé
echo ""
JAVA_COUNT=$(find src/main/java -type d 2>/dev/null | wc -l)
TEST_COUNT=$(find src/test/java -type d 2>/dev/null | wc -l)

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SCRIPT 01 TERMINÉ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
INFO "Dossiers Java créés : $JAVA_COUNT"
INFO "Dossiers tests créés : $TEST_COUNT"
echo ""
INFO "Prochaine étape : bash setup_02_config_and_properties.sh"