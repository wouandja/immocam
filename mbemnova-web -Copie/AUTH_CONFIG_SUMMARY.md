# ✅ Auth Module - Configuration Complète Validée

## 📋 État Actuel du Projet

### ✅ Configuration (src/environments/environment.ts)
- `useMock: false` → ✅ API réelle activée
- `apiUrl: 'http://localhost:8080/api'` → ✅ Configuré
- `logApiCalls: true` → ✅ Logs de débogage activés

### ✅ NgRx Store (src/app/store/auth/)
- **auth.actions.ts** → ✅ Toutes les actions créées (register, login, verify, refresh, forgot, reset, logout)
- **auth.reducer.ts** → ✅ Gère loading, error, user, pendingEmail
- **auth.selectors.ts** → ✅ Selectors pour isLoggedIn, currentUser, loading, error
- **auth.effects.ts** → ✅ **COMPLET** : login$, register$, verifyEmail$, resendCode$, forgotPassword$, resetPassword$, logout$, init$

### ✅ Services (src/app/core/services/)
- **auth.api.ts** → ✅ Appels HTTP vers le backend + logs de débogage
- **auth.service.ts** → ✅ Logique métier (login, register, verify, refresh, logout)
- **storage.service.ts** → ✅ Gestion des tokens en localStorage
- **interceptors/** → ✅ authInterceptor, refreshInterceptor, errorInterceptor, loadingInterceptor

### ✅ Routes & Guards (src/app/core/guards/)
- **auth.guard.ts** → ✅ Protège les routes privées
- **verified.guard.ts** → ✅ Protège jusqu'à vérification email
- **guest.guard.ts** → ✅ Protège les pages auth (login/register) si déjà connecté
- **role.guard.ts** → ✅ Protège les pages admin

### ✅ Configuration App (src/app/app.config.ts)
```typescript
// ✅ Tous les providers sont enregistrés :
provideStore({
  auth: authReducer,  // ✅ Reducer
  ...
}),

provideEffects([
  AuthEffects,        // ✅ Effects pour les appels API
  ...
]),

// ✅ Interceptors en ordre correct :
const httpInterceptors = [
  ...(environment.useMock ? [mockInterceptor] : []),
  authInterceptor,        // ← Ajoute le token
  refreshInterceptor,     // ← Rafraîchit sur 401
  loadingInterceptor,     // ← Spinner
  errorInterceptor,       // ← Toasts d'erreur
];

// ✅ Initialisation app :
{
  provide: APP_INITIALIZER,
  useFactory: initializeApp,
  deps: [AuthService],  // ← Restaure session depuis localStorage
  multi: true,
}
```

---

## 🔄 Flow Complet du Login

### 1. User clic "Se connecter" dans LoginComponent
```typescript
// src/app/features/auth/login/login.component.ts
onSubmit(): void {
  // ✅ Dispatch l'action avec les données
  this.store.dispatch(authActions.login({ 
    req: { email: "test@test.com", motDePasse: "..." } 
  }));
}
```

### 2. NgRx Effect écoute l'action
```typescript
// src/app/store/auth/auth.effects.ts
login$ = createEffect(() =>
  this.actions$.pipe(
    ofType(authActions.login),  // ← Écoute l'action
    switchMap(({ req }) =>
      this.authApi.login(req)   // ← Appelle l'API
        .pipe(
          map((res) => authActions.loginSuccess({ user: res.data })),
          catchError((err) => of(authActions.loginFailure({ error: ... })))
        )
    )
  )
);
```

### 3. AuthApi appelle le backend
```typescript
// src/app/core/services/api/auth.api.ts
login(req: LoginRequest): Observable<ApiResponse<UtilisateurProfil>> {
  // ✅ Appel HTTP POST
  return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/login`, req)
    .pipe(
      tap(res => this.log('✅ Réponse login', res)),
      map(res => this._handleAuthResponse(res))  // ← Sauvegarde tokens
    );
}
```

### 4. Réponse stockée et naviguation
```typescript
// src/app/store/auth/auth.effects.ts
loginSuccess$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(authActions.loginSuccess),
      tap(({ user }) => {
        this.auth.updateUser(user);    // ← Mis à jour en state
        this.router.navigate(['/dashboard']);  // ← Navigation
      })
    ),
  { dispatch: false }
);
```

### 5. Reducer met à jour le state
```typescript
// src/app/store/auth/auth.reducer.ts
on(authActions.loginSuccess, (s, { user }) => ({
  ...s, 
  loading: false,    // ← Loading stoppé
  user,              // ← User enregistré
  error: null        // ← Erreur cleared
})),
```

---

## 🧪 Logs Attendus dans la Console

```
[AuthEffects] 📤 login$ triggered {email: "test@test.com"}
[AuthApi] 🚀 POST /login {email: "test@test.com", motDePasse: "..."}
[AuthApi] ✅ Réponse login {success: true, data: {...}}
[AuthApi] 💾 Tokens sauvegardés 
[AuthEffects] ✅ login$ success
[AuthEffects] 📲 loginSuccess$ triggered
🔄 Navigation vers /dashboard
```

---

## 🔍 Vérifications Réseau (Network Tab)

### Requête Envoyée
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "test@test.com",
  "motDePasse": "Pass1234!"
}
```

### Réponse Attendue (200 OK)
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

---

## 💾 LocalStorage Après Login

```
immocam_access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
immocam_refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
immocam_user: '{"id":1,"email":"test@test.com","prenom":"Jean","nom":"Dupont","role":"UTILISATEUR","emailVerifie":true}'
```

---

## 🎯 Autres Flows Implémentés

### Register
- ✅ POST `/auth/register` → stocke email dans `pendingEmail`
- ✅ Navigate vers `/auth/verify-email?email=...`
- ✅ Lance resend code si expiré

### Verify Email
- ✅ POST `/auth/verify-email` avec code
- ✅ Reçoit tokens + user
- ✅ Stocke en localStorage
- ✅ Navigate vers `/dashboard`

### Refresh Token
- ✅ Automatique sur 401 (refreshInterceptor)
- ✅ POST `/auth/refresh` avec refreshToken
- ✅ Met à jour accessToken
- ✅ Rejoue la requête initiale

### Forgot Password
- ✅ POST `/auth/forgot-password` 
- ✅ Reçoit lien reset
- ✅ Navigate vers `/auth/login`

### Reset Password
- ✅ POST `/auth/reset-password` avec token + nouveau mot de passe
- ✅ Navigate vers `/auth/login`

### Logout
- ✅ Clear tokens et user
- ✅ Reset store à initialState
- ✅ Navigate vers `/`

---

## 📋 Checklist de Lancement

- [ ] Backend Spring Boot lancé sur `http://localhost:8080`
- [ ] DB initialisée avec au moins 1 compte de test
- [ ] `npm install` → dépendances installées
- [ ] `npm start` → app lancée sur `http://localhost:4200`
- [ ] F12 → Console → logs attendus
- [ ] Network tab → Requêtes HTTP visibles
- [ ] LocalStorage → Tokens sauvegardés
- [ ] `/dashboard` → Accessible après login
- [ ] F5 refresh → Session restaurée depuis localStorage

---

## 🚀 Prêt à Tester !

Tous les éléments sont en place. Lance le backend et teste le flow complet du login.
Si ça ne marche pas, consulte le guide `API_TEST_GUIDE.md` pour déboguer.
