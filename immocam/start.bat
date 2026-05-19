@echo off
REM ============================================================================
REM Script de démarrage ImmoCam avec chargement de données de test
REM ============================================================================

REM Couleurs (simulations)
setlocal enabledelayedexpansion

cls
echo.
echo ============================================================================
echo         🚀 DEMARRAGE IMMOCAM AVEC DONNEES DE TEST
echo ============================================================================
echo.

REM Vérifier que Maven est installé
mvn --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Maven n'est pas installé ou pas dans le PATH
    echo    Veuillez installer Maven ou ajouter son bin au PATH
    pause
    exit /b 1
)

echo ✅ Maven trouvé
echo.

REM Vérifier que PostgreSQL est disponible
psql --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  PostgreSQL n'est pas dans le PATH (non critique)
    echo    Vérifiez que la base de données est accessible
) else (
    echo ✅ PostgreSQL trouvé
)

echo.
echo ============================================================================
echo 1️⃣ COMPILATION DU PROJET
echo ============================================================================
echo.

REM Compiler le projet
call mvn clean compile -q
if errorlevel 1 (
    echo ❌ Erreur lors de la compilation
    pause
    exit /b 1
)

echo ✅ Compilation réussie
echo.

REM Optionnel: Exécuter les tests
set /p RUN_TESTS="Exécuter les tests de vérification? (Y/n): "
if /i "!RUN_TESTS!"=="Y" (
    echo.
    echo ============================================================================
    echo 2️⃣ TESTS DE VÉRIFICATION DES DONNÉES
    echo ============================================================================
    echo.
    
    call mvn test -Dtest=DataLoaderTest -q
    if errorlevel 1 (
        echo ⚠️  Certains tests ont échoué
        echo    Mais l'application peut quand même démarrer
    ) else (
        echo ✅ Tous les tests réussis!
    )
    echo.
)

echo.
echo ============================================================================
echo 3️⃣ DÉMARRAGE DE L'APPLICATION
echo ============================================================================
echo.
echo 📋 Infos de démarrage:
echo    - Base de données: localhost:5432/immocam_dev
echo    - Profil actif: dev
echo    - Chargement de données: ACTIVÉ
echo    - Port serveur: 8080
echo.
echo ⏳ Démarrage en cours...
echo.

REM Lancer l'application
call mvn spring-boot:run -DskipTests

pause
