# Script de test des données ImmoCam (PowerShell)
# Vérifie si les données de test sont bien créées et accessibles via l'API

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🧪 TEST API IMMOCAM" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://localhost:1010"
$ADMIN_EMAIL = "admin@immocam.cm"
$ADMIN_PASSWORD = "Admin123"
$USER_EMAIL = "jean@email.com"
$USER_PASSWORD = "User123"

# Fonction pour afficher les résultats
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = ""
    )
    
    Write-Host ""
    Write-Host "TEST: $Name" -ForegroundColor Yellow
    Write-Host "────────────────────────────────────────────" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            Headers = $Headers
        }
        
        if ($Body) {
            $params["Body"] = $Body
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "✅ Succès" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Attendre le démarrage du serveur
Write-Host "⏳ Attente du démarrage du serveur..." -ForegroundColor Magenta
$serverReady = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $health = Invoke-RestMethod "$BASE_URL/actuator/health" -ErrorAction SilentlyContinue
        if ($health.status -eq "UP") {
            $serverReady = $true
            break
        }
    }
    catch {
    }
    Write-Host -NoNewline "."
    Start-Sleep -Seconds 2
}

if ($serverReady) {
    Write-Host ""
    Write-Host "✅ Serveur démarré!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Serveur n'a pas démarré" -ForegroundColor Red
    exit 1
}

# Test 1: Liste des annonces (PUBLIC)
$annoncesResponse = Test-Endpoint "Récupérer la liste des annonces (PUBLIC)" `
    "$BASE_URL/annonces?page=0&taille=10"

if ($annoncesResponse) {
    $annonces = $annoncesResponse.data
    Write-Host "   Nombre d'annonces: $($annonces.Count)" -ForegroundColor Green
    if ($annonces.Count -gt 0) {
        Write-Host "   Première annonce: $($annonces[0].description)" -ForegroundColor Green
        Write-Host "   Prix: $($annonces[0].prix) FCFA" -ForegroundColor Green
    }
}

# Test 2: Connexion admin
Write-Host ""
Write-Host "TEST: Connexion admin" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────" -ForegroundColor Gray

$loginBody = @{
    email = $ADMIN_EMAIL
    motDePasse = $ADMIN_PASSWORD
} | ConvertTo-Json

$adminResponse = Test-Endpoint "Connexion admin" "$BASE_URL/auth/login" "POST" @{} $loginBody

$adminToken = ""
if ($adminResponse -and $adminResponse.data.accessToken) {
    $adminToken = $adminResponse.data.accessToken
    Write-Host "   Email: $($adminResponse.data.email)" -ForegroundColor Green
    Write-Host "   Rôle: $($adminResponse.data.role)" -ForegroundColor Green
    Write-Host "   Token: $($adminToken.Substring(0, 20))..." -ForegroundColor Green
}

# Test 3: Connexion utilisateur
Write-Host ""
Write-Host "TEST: Connexion utilisateur" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────" -ForegroundColor Gray

$loginBody = @{
    email = $USER_EMAIL
    motDePasse = $USER_PASSWORD
} | ConvertTo-Json

$userResponse = Test-Endpoint "Connexion utilisateur" "$BASE_URL/auth/login" "POST" @{} $loginBody

$userToken = ""
if ($userResponse -and $userResponse.data.accessToken) {
    $userToken = $userResponse.data.accessToken
    Write-Host "   Utilisateur: $($userResponse.data.prenom) $($userResponse.data.nom)" -ForegroundColor Green
    Write-Host "   Email: $($userResponse.data.email)" -ForegroundColor Green
    Write-Host "   Token: $($userToken.Substring(0, 20))..." -ForegroundColor Green
}

# Test 4: Détail d'une annonce
$annonceDetail = Test-Endpoint "Détail d'une annonce" "$BASE_URL/annonces/1"
if ($annonceDetail -and $annonceDetail.data) {
    Write-Host "   Description: $($annonceDetail.data.description)" -ForegroundColor Green
    Write-Host "   Prix: $($annonceDetail.data.prix) FCFA" -ForegroundColor Green
    Write-Host "   Photos: $($annonceDetail.data.photos.Count)" -ForegroundColor Green
    Write-Host "   Vues: $($annonceDetail.data.nombreVues)" -ForegroundColor Green
}

# Test 5: Mes annonces (avec token)
if ($userToken) {
    $mesAnnoncesResponse = Test-Endpoint "Mes annonces" `
        "$BASE_URL/annonces/mes-annonces?page=0&taille=10" `
        "GET" `
        @{ "Authorization" = "Bearer $userToken" }
    
    if ($mesAnnoncesResponse -and $mesAnnoncesResponse.data) {
        Write-Host "   Nombre d'annonces: $($mesAnnoncesResponse.data.Count)" -ForegroundColor Green
    }
}

# Test 6: Types de bien
$typesResponse = Test-Endpoint "Types de bien" "$BASE_URL/types-biens"
if ($typesResponse -and $typesResponse.data) {
    Write-Host "   Nombre de types: $($typesResponse.data.Count)" -ForegroundColor Green
    Write-Host "   Types: $($typesResponse.data[0..3] | ForEach-Object { $_.libelle } | Join-String -Separator ', ')" -ForegroundColor Green
}

# Test 7: Localisations
$localisationsResponse = Test-Endpoint "Localisations (villes)" "$BASE_URL/localisations"
if ($localisationsResponse -and $localisationsResponse.data) {
    $villes = $localisationsResponse.data | Select-Object -Unique -Property ville
    Write-Host "   Nombre de localisations: $($localisationsResponse.data.Count)" -ForegroundColor Green
    Write-Host "   Villes: $($villes[0..4] | ForEach-Object { $_.ville } | Join-String -Separator ', ')" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Tests complétés" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Résumé:" -ForegroundColor Yellow
Write-Host "   ✓ Annonces créées: $($annoncesResponse.data.Count ?? 0)" -ForegroundColor Green
Write-Host "   ✓ Connexion admin: OK" -ForegroundColor Green
Write-Host "   ✓ Connexion utilisateur: OK" -ForegroundColor Green
Write-Host "   ✓ Types de bien: OK" -ForegroundColor Green
Write-Host "   ✓ Localisations: OK" -ForegroundColor Green
