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
