# Bailocam — Guide de déploiement

**Domaine :** https://bailocam.com  
**Serveur :** 109.199.120.6 (Ubuntu 24.04 LTS, Contabo)  
**Architecture :** Nginx (host) → Docker (api + frontend + postgres)

---

## 1. Secrets GitHub Actions à configurer

Aller dans : **GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | `109.199.120.6` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | Clé privée SSH ci-dessous |

### Clé privée SSH (VPS_SSH_KEY)

Copier **intégralement** la clé privée depuis le serveur :

```bash
ssh root@109.199.120.6
cat /root/.ssh/github_actions
```

Copier tout le contenu (de `-----BEGIN OPENSSH PRIVATE KEY-----` jusqu'à `-----END OPENSSH PRIVATE KEY-----`  inclus) dans le secret GitHub `VPS_SSH_KEY`.

> La clé publique correspondante est déjà dans `/root/.ssh/authorized_keys` sur le serveur.

---

## 2. Fichier secrets sur le serveur

Le fichier `/opt/bailocam/.env.prod` est **déjà créé** sur le serveur avec les valeurs de production. Il n'est jamais commité sur Git.

Pour le modifier :

```bash
ssh root@109.199.120.6
nano /opt/bailocam/.env.prod
```

Modèle des variables requises → voir `.env.prod.template` dans le repo.

---

## 3. Premier déploiement (SSL + mise en ligne)

### 3.1 DNS — Pointer le domaine vers le serveur

Créer deux enregistrements A chez votre registrar :

```
bailocam.com      A  109.199.120.6
www.bailocam.com  A  109.199.120.6
```

Attendre la propagation DNS (quelques minutes à 24h).

### 3.2 Obtenir le certificat SSL (Let's Encrypt)

```bash
ssh root@109.199.120.6

# Vérifier que Nginx répond bien sur le domaine
curl -I http://bailocam.com

# Obtenir le certificat
certbot --nginx -d bailocam.com -d www.bailocam.com \
  --email contact@bailocam.com \
  --agree-tos --no-eff-email

# Activer la config nginx complète (HTTPS)
cp /etc/nginx/sites-available/bailocam-temp /etc/nginx/sites-available/bailocam-temp.bak
cp /root/nginx-prod.conf /etc/nginx/sites-available/bailocam  # ou voir ci-dessous
nginx -t && systemctl reload nginx
```

> La config nginx finale est dans le repo : `nginx-prod.conf`  
> Elle est automatiquement copiée sur le serveur à chaque déploiement CI/CD.

### 3.3 Lancer les conteneurs manuellement (premier démarrage)

```bash
ssh root@109.199.120.6

cd /opt/bailocam

# S'assurer que docker-compose.prod.yml est présent
# (il sera copié automatiquement par CI/CD ensuite)
# Ou copier manuellement depuis le repo local

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Vérifier l'état
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker logs immocam_api --tail=50
```

### 3.4 Renouvellement SSL automatique

Certbot configure un timer systemd automatiquement. Vérifier :

```bash
systemctl status certbot.timer
certbot renew --dry-run
```

---

## 4. Déploiements suivants (CI/CD automatique)

Chaque `git push` sur `main` déclenche le pipeline :

1. **test-backend** — Build Maven
2. **build-frontend** — Build Angular production
3. **build-push** — Build + push images Docker vers GHCR
4. **deploy** — SSH sur le serveur → pull images → `docker compose up -d`

Le pipeline met à jour automatiquement les conteneurs sans downtime.

---

## 5. Structure du serveur

```
/opt/bailocam/
├── .env.prod          # Secrets (chmod 600, jamais sur Git)
├── backup.sh          # Script backup PostgreSQL
├── backups/           # Sauvegardes quotidiennes (7 jours)
└── docker-compose.prod.yml  # Copié par CI/CD à chaque déploiement

/etc/nginx/sites-available/
├── bailocam           # Config HTTPS finale (après SSL)
└── bailocam-temp      # Config HTTP temporaire (challenge Certbot)

/root/.ssh/
├── github_actions     # Clé privée SSH pour GitHub Actions
└── github_actions.pub # Clé publique (dans authorized_keys)
```

---

## 6. Commandes utiles

```bash
# État des conteneurs
docker compose -f /opt/bailocam/docker-compose.prod.yml \
  --env-file /opt/bailocam/.env.prod ps

# Logs API
docker logs immocam_api --tail=100 -f

# Logs Frontend
docker logs immocam_frontend --tail=50

# Backup manuel
/opt/bailocam/backup.sh

# Lister les backups
ls -lh /opt/bailocam/backups/

# Reload Nginx
nginx -t && systemctl reload nginx

# Statut pare-feu
ufw status verbose

# Statut fail2ban
fail2ban-client status
fail2ban-client status sshd
```

---

## 7. Sécurité

| Mesure | État |
|--------|------|
| UFW actif (22, 80, 443 uniquement) | ✅ |
| fail2ban (SSH + Nginx) | ✅ |
| PermitRootLogin prohibit-password | ✅ |
| MaxAuthTries 3 | ✅ |
| SSL/TLS 1.2+ Let's Encrypt | ✅ après DNS |
| HSTS preload | ✅ dans nginx-prod.conf |
| Secrets hors Git (.env.prod) | ✅ |
| Backup PostgreSQL quotidien (3h00) | ✅ |

---

## 8. SMTP

| Paramètre | Valeur |
|-----------|--------|
| Hôte | mail.bailocam.com |
| Port | 587 (STARTTLS) |
| Utilisateur | contact@bailocam.com |
| FROM | contact@bailocam.com |
| FROM_NAME | Bailocam |

> Le mot de passe SMTP est dans `/opt/bailocam/.env.prod` uniquement.

---

## 9. Images Docker (GHCR)

```
ghcr.io/wouandja/immocam/immocam-api:latest
ghcr.io/wouandja/immocam/immocam-frontend:latest
```

Les images sont publiques en lecture. Pour les pull manuellement :

```bash
docker pull ghcr.io/wouandja/immocam/immocam-api:latest
docker pull ghcr.io/wouandja/immocam/immocam-frontend:latest
```
