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
