# 🔍 Guide de Diagnostic de l'API Auth - ImmoCam

## ✅ Checklist Avant de Tester

### 1. Vérifications de Configuration

```typescript
// ✅ À faire dans src/environments/environment.ts
{
  useMock: false,                    // ← DOIT être FALSE
  apiUrl: 'http://localhost:8080/api',  // ← Vérifier l'URL
  logApiCalls: true,                 // ← Active les logs
}
```

### 2. Vérifications du Backend

```bash
# Vérifier que le backend Spring Boot tourne sur le bon port
curl -i http://localhost:8080/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","motDePasse":"password"}'

# Doit retourner une réponse (même si erreur 400/401)
# Si "Cannot GET" → backend pas lancé sur port 8080
```

---

## 🧪 Test 1 : Console du Navigateur (Vérifier que les logs s'affichent)

### Étapes

1. **Ouvre Chrome DevTools** → F12 → Onglet `Console`
2. **Filtre les logs** : Tape `[AuthApi]` ou `[AuthEffects]` dans le filtre
3. **Va sur `/auth/login`**
4. **Entre tes identifiants** (email/mot de passe) **et clique sur "Se connecter"**
5. **Observe la console** :

#### ✅ Ce que tu dois voir

```
[AuthEffects] 📤 login$ triggered {email: "..."}
[AuthApi] 🚀 POST /login {...}
```

Si tu le vois, c'est que l'action est bien dispatchée et l'effet est bien écouté. ✅

#### ❌ Ce que tu ne dois PAS voir

- Rien dans la console → Effects n'écoutent pas
- Les logs d'un autre composant → Vérifier que c'est le bon login component

---

## 🧪 Test 2 : Vérifier l'Appel HTTP Réel

### Étapes

1. **DevTools** → Onglet `Network`
2. **Filtre** : Tape `auth` ou `login`
3. **Clique sur "Se connecter"**
4. **Tu dois voir une requête HTTP** `POST http://localhost:8080/api/auth/login`

#### ✅ Ce que tu dois voir

- **Status**: `200` (succès), `401` (identifiants invalides), ou `400` (erreur)
- **Response** : JSON avec `data: { accessToken, refreshToken, userId, ... }`

```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "userId": 1,
    "email": "test@test.com",
    "prenom": "Jean",
    "nom": "Dupont",
    "role": "UTILISATEUR"
  }
}
```

#### ❌ Ce que tu NE dois PAS voir

- **Pas de requête du tout** → L'action n'est pas dispatchée ou le store n'est pas enregistré
- **CORS error** → Vérifier la configuration CORS du backend
- **404 sur `/api/auth/login`** → L'URL est mauvaise
- **Requête vers mock** → `useMock: true` encore activé

---

## 🧪 Test 3 : Vérifier que les Tokens sont Sauvegardés

### Étapes

1. **DevTools** → Onglet `Application` → `Local Storage`
2. **Cherche les clés** :
   - `immocam_access_token`
   - `immocam_refresh_token`
   - `immocam_user`

#### ✅ Ce que tu dois voir

```
immocam_access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
immocam_refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
immocam_user: '{"id":1,"email":"test@test.com","prenom":"Jean",...}'
```

#### ❌ Ce que tu NE dois PAS voir

- **Clés manquantes** → Tokens ne sont pas sauvegardés
- **`undefined` ou `null`** → Réponse de l'API mal traitée

---

## 🧪 Test 4 : Vérifier le NgRx Store

### Code à exécuter dans la Console

```javascript
// Ouvre la console et copie-colle ceci:

// Accès au store depuis la fenêtre (si devTools NgRx sont actifs)
window.ngDevTools?.store?.subscribe(state => {
  console.log('🔍 State actuel:', state);
  console.log('👤 Utilisateur:', state.auth.user);
  console.log('⏳ Loading:', state.auth.loading);
  console.log('❌ Erreur:', state.auth.error);
});
```

#### ✅ Ce que tu dois voir après la connexion

```
State actuel: {...}
👤 Utilisateur: {id: 1, email: "test@test.com", prenom: "Jean", ...}
⏳ Loading: false
❌ Erreur: null
```

---

## 🚀 Plan de Diagnostic Complet

### Si **L'API n'est jamais appelée** :

1. ✅ Vérifier que `useMock: false` dans `environment.ts`
2. ✅ Vérifier que `AuthEffects` est enregistré dans `app.config.ts` → `provideEffects([AuthEffects, ...])`
3. ✅ Vérifier dans la console : les logs `[AuthEffects]` apparaissent ?
4. ✅ Vérifier que le reducer met bien `loading: true` lors du dispatch
5. ✅ Vérifier dans Network que la requête part bien

### Si **L'API est appelée mais la réponse n'est pas traitée** :

1. ✅ Vérifier le status HTTP (200 ? 401 ? 400 ?)
2. ✅ Vérifier le JSON de la réponse (contient `data` ?)
3. ✅ Vérifier que `_handleAuthResponse` sauvegarde les tokens
4. ✅ Vérifier dans `LocalStorage` que les tokens sont présents

### Si **Les tokens sont sauvegardés mais le login ne marche pas** :

1. ✅ Vérifier que l'utilisateur est bien mis à jour dans le state
2. ✅ Vérifier que la navigation vers `/dashboard` se fait
3. ✅ Vérifier que le guard `authGuard` accepte l'utilisateur

---

## 📝 Logs à Attendre (Ordre Normal)

### Lors d'un Login Réussi

```
[AuthEffects] 📤 login$ triggered {email: "test@test.com"}
[AuthApi] 🚀 POST /login {email: "test@test.com", motDePasse: "..."}
[AuthApi] ✅ Réponse login {success: true, data: {...}}
[AuthApi] 💾 Tokens sauvegardés
[AuthEffects] ✅ login$ success
[AuthEffects] ✅ login$ mapping response {id: 1, ...}
[AuthEffects] 📲 loginSuccess$ triggered {id: 1, ...}
🔄 Navigation vers /dashboard
```

### Lors d'un Login Échoué

```
[AuthEffects] 📤 login$ triggered {email: "test@test.com"}
[AuthApi] 🚀 POST /login
[AuthApi] ❌ Réponse error (401) Identifiants incorrects
[AuthEffects] ❌ login$ error
```

---

## 🔧 Commandes de Test Rapide

### Terminal (avec curl)

```bash
# Test de connexion
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@cameroun.cm","motDePasse":"Pass1234!"}'

# Test de vérification email (après register)
curl -X POST http://localhost:8080/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@cameroun.cm","code":"123456"}'

# Test de refresh
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJ..."}'
```

---

## 📊 Résumé des Fichiers Modifiés

| Fichier | Changement |
|---------|-----------|
| `src/environments/environment.ts` | ✅ Ajouté `logApiCalls: true` |
| `src/app/core/services/api/auth.api.ts` | ✅ Ajouté logs avec `tap()` |
| `src/app/store/auth/auth.effects.ts` | ✅ Ajouté logs à tous les effects |

---

## 🎯 Prochaines Étapes

1. **Lance ton backend Spring Boot** sur `http://localhost:8080`
2. **Démarre ton app Angular** : `npm start`
3. **Ouvre les logs** (F12 → Console)
4. **Fais un login** et observe les logs
5. **Vérify le Network tab** pour voir la requête HTTP

Si tu ne vois rien, envoie-moi les logs de la console et on corrigera ensemble ! 🚀
