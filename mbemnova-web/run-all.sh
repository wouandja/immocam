#!/usr/bin/env bash
# =============================================================================
# IMMOCAM — LANCEUR AUTOMATIQUE (Windows Git Bash)
# Exécute les 12 scripts dans l'ordre sans interruption
# =============================================================================
# UTILISATION :
#   1. Placer ce fichier dans le même dossier que les 12 scripts ng-*.sh
#   2. Ouvrir Git Bash dans ce dossier
#   3. bash run-all.sh
# =============================================================================

set -e  # Arrêt si une commande échoue

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

OK()      { echo -e "${GREEN}[✓]${NC} $1"; }
INFO()    { echo -e "${BLUE}[i]${NC} $1"; }
WARN()    { echo -e "${YELLOW}[!]${NC} $1"; }
ERROR()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }

clear
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       IMMOCAM FRONTEND — INSTALLATION AUTOMATIQUE       ║"
echo "║       12 scripts · Angular 21 · Tailwind 4 · NgRx       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# =============================================================================
# VÉRIFICATIONS PRÉALABLES
# =============================================================================

echo -e "${CYAN}── VÉRIFICATIONS ──────────────────────────────────────────${NC}"

# Node.js
if ! command -v node &>/dev/null; then
  ERROR "Node.js non installé. Télécharger : https://nodejs.org (version 20+)"
fi
NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 20 ]; then
  ERROR "Node.js 20+ requis. Version actuelle : $(node -v)"
fi
OK "Node.js $(node -v)"

# npm
if ! command -v npm &>/dev/null; then
  ERROR "npm non installé"
fi
OK "npm $(npm -v)"

# Angular CLI
if ! command -v ng &>/dev/null; then
  WARN "Angular CLI non trouvé. Installation en cours..."
  npm install -g @angular/cli@21 --silent
  OK "Angular CLI installé"
else
  OK "Angular CLI $(ng version --skip-confirmation 2>/dev/null | grep 'Angular CLI' | awk '{print $3}' || echo 'détecté')"
fi

# Git
if ! command -v git &>/dev/null; then
  ERROR "Git non installé. Télécharger : https://git-scm.com"
fi
OK "Git $(git --version | awk '{print $3}')"

# Vérifier que les 12 scripts sont présents
echo ""
echo -e "${CYAN}── VÉRIFICATION DES 12 SCRIPTS ───────────────────────────${NC}"
MISSING=0
for i in 01 02 03 04 05 06 07 08 09 10 11 12; do
  FILE=$(ls ng-${i}-*.sh 2>/dev/null | head -1)
  if [ -z "$FILE" ]; then
    echo -e "  ${RED}[✗]${NC} ng-${i}-*.sh : MANQUANT"
    MISSING=$((MISSING + 1))
  else
    echo -e "  ${GREEN}[✓]${NC} $FILE"
  fi
done

if [ "$MISSING" -gt 0 ]; then
  ERROR "$MISSING script(s) manquant(s). Placez tous les ng-*.sh dans ce dossier."
fi

echo ""
echo -e "${GREEN}✅ Tous les 12 scripts présents${NC}"
echo ""

# =============================================================================
# DOSSIER DE DESTINATION
# =============================================================================

PROJECT_DIR="immocam-frontend"

if [ -d "$PROJECT_DIR" ]; then
  echo -e "${YELLOW}⚠  Le dossier '$PROJECT_DIR' existe déjà.${NC}"
  echo -n "   Supprimer et recréer ? (o/N) : "
  read -r CHOICE
  if [[ "$CHOICE" == "o" || "$CHOICE" == "O" || "$CHOICE" == "y" || "$CHOICE" == "Y" ]]; then
    rm -rf "$PROJECT_DIR"
    OK "Dossier supprimé"
  else
    echo "   Abandon."
    exit 0
  fi
fi

# =============================================================================
# EXÉCUTION DES 12 SCRIPTS
# =============================================================================

SCRIPT_DIR="$(pwd)"
START_TIME=$(date +%s)

echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  EXÉCUTION DES 12 SCRIPTS                                ${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"

# # ── Script 01 — depuis le dossier parent ─────────────────────────────────────
# echo ""
# echo -e "${BLUE}[1/12]${NC} ng-01-init.sh — Initialisation projet..."
# bash "$SCRIPT_DIR/$(ls ng-01-*.sh)" || ERROR "Échec script 01"
# OK "Script 01 terminé"

# # Entrer dans le projet créé
# cd "$PROJECT_DIR" || ERROR "Dossier '$PROJECT_DIR' introuvable après script 01"
# INFO "Répertoire de travail : $(pwd)"

# ── Scripts 02 à 12 — depuis la racine du projet ─────────────────────────────

run_script() {
  local NUM="$1"
  local FILE
  FILE=$(ls "$SCRIPT_DIR"/ng-${NUM}-*.sh 2>/dev/null | head -1)
  if [ -z "$FILE" ]; then
    ERROR "Script ng-${NUM}-*.sh introuvable dans $SCRIPT_DIR"
  fi
  local NAME
  NAME=$(basename "$FILE")
  echo ""
  echo -e "${BLUE}[${NUM}/12]${NC} ${NAME}..."
  bash "$FILE" || ERROR "Échec script ${NUM} (${NAME})"
  OK "Script ${NUM} terminé"
}

run_script "02"
run_script "03"
run_script "04"
run_script "05"
run_script "06"
run_script "07"
run_script "08"
run_script "09"
run_script "10"
run_script "11"
run_script "12"

# =============================================================================
# NPM INSTALL
# =============================================================================

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  NPM INSTALL                                             ${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
echo ""
INFO "Installation des dépendances npm..."
npm install --legacy-peer-deps || npm install || ERROR "npm install échoué"
OK "Dépendances installées"

# =============================================================================
# RÉSUMÉ FINAL
# =============================================================================

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ IMMOCAM FRONTEND — INSTALLATION RÉUSSIE            ║${NC}"
echo -e "${GREEN}║   Durée : ${MINUTES}min ${SECONDS}s                                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📁 Projet créé dans :${NC}"
echo "   $(pwd)"
echo ""
echo -e "${CYAN}🚀 POUR DÉMARRER :${NC}"
echo ""
echo -e "   ${YELLOW}# Mode présentation (données mock, sans backend) :${NC}"
echo "   npm start"
echo "   → http://localhost:4200"
echo ""
echo -e "   ${YELLOW}# Comptes de test disponibles :${NC}"
echo "   Email: user@test.cm    Rôle: Utilisateur"
echo "   Email: admin@test.cm   Rôle: Administrateur"
echo "   Mot de passe: n'importe lequel"
echo "   Code OTP universel: 123456"
echo ""
echo -e "   ${YELLOW}# Pour connecter l'API Spring Boot :${NC}"
echo "   Modifier : src/environments/environment.ts"
echo "   Changer  : useMock: false"
echo "   Changer  : apiUrl: 'http://localhost:8080/api'"
echo "   Puis lancer : npm run start:api"
echo ""
echo -e "${CYAN}📞 Support MBEMNOVA : +237 697 847 396${NC}"
echo ""