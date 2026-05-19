// =============================================================================
// IMMOCAM — Mock Interceptor V2
// Intercept HTTP → données simulées avec état persistant + scénarios erreur
// Activé si environment.useMock === true
// =============================================================================

import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, throwError, delay } from 'rxjs';
import { environment } from '@environments/environment';
import { MockStateService } from './mock-state.service';
import {
  MOCK_AUTH_RESPONSE, MOCK_ADMIN_USER, MOCK_USER,
  MOCK_LOCALISATIONS, MOCK_TYPE_BIENS, MOCK_VILLES,
} from './mock-data.factory';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ok(data: any, message = 'Succès') {
  return new HttpResponse({ status: 200, body: { success: true, message, data } });
}

function err(status: number, message: string, code?: string) {
  return new HttpErrorResponse({
    status,
    error: { success: false, message, code },
    statusText: message,
  });
}

function page<T>(items: T[], p = 0, size = 12) {
  const start = p * size;
  const content = items.slice(start, start + size);
  return { content, page: p, size, totalElements: items.length,
    totalPages: Math.ceil(items.length / size), first: p === 0,
    last: start + size >= items.length, empty: content.length === 0,
    numberOfElements: content.length };
}

function params(url: string) {
  return new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
}

// ─── Intercepteur principal ───────────────────────────────────────────────────

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMock) return next(req);

  const state  = inject(MockStateService);
  const url    = req.url.replace(environment.apiUrl, '');
  const method = req.method;
  const qp     = params(req.url);
  const body   = req.body as any ?? {};
  const d      = environment.mockDelay ?? 600;

  let response: HttpResponse<any> | null = null;
  let errorResponse: HttpErrorResponse | null = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════════════════════

  // POST /auth/register
  if (url.includes('/auth/register') && method === 'POST') {
    // Simuler email déjà existant
    if (body.email?.includes('exist')) {
      errorResponse = err(409, 'Un compte avec cet email existe déjà');
    } else {
      state.generateOTP(body.email);
      response = ok({ email: body.email }, 'Compte créé. Vérifiez votre email.');
    }
  }

  // POST /auth/verify-email
  else if (url.includes('/auth/verify-email') && method === 'POST') {
    const result = state.verifyOTP(body.email, body.code);
    if (result === 'expired') {
      errorResponse = err(400, 'Code expiré. Cliquez pour en recevoir un nouveau.', 'OTP_EXPIRED');
    } else if (result === 'invalid') {
      errorResponse = err(400, 'Code incorrect. Vérifiez votre email.', 'OTP_INVALID');
    } else {
      const user = body.email?.includes('admin') ? MOCK_ADMIN_USER : MOCK_USER;
      state.loginSuccess(user as any, {
        access: MOCK_AUTH_RESPONSE.accessToken,
        refresh: MOCK_AUTH_RESPONSE.refreshToken,
      });
      response = ok({ ...MOCK_AUTH_RESPONSE, utilisateur: user });
    }
  }

  // POST /auth/resend-code
  else if (url.includes('/auth/resend-code') && method === 'POST') {
    if (!state.canResend()) {
      errorResponse = err(429, 'Limite d\'envois atteinte. Contactez le support.', 'RESEND_LIMIT');
    } else {
      state.recordResend();
      response = ok(null, 'Code renvoyé avec succès');
    }
  }

  // POST /auth/login
  else if (url.includes('/auth/login') && method === 'POST') {
    // SC-09.2: Compte bloqué
    if (state.isBlocked()) {
      const mins = state.getBlockedMinutes();
      errorResponse = err(423, `Compte temporairement bloqué. Réessayez dans ${mins} minute(s).`, 'ACCOUNT_LOCKED');
    }
    // Mauvais mot de passe (simulé si password = 'wrong')
    else if (body.motDePasse === 'wrong') {
      state.recordLoginAttempt();
      const sess = state.getSession();
      const remaining = 5 - sess.loginAttempts;
      errorResponse = err(401,
        remaining > 0
          ? `Identifiants incorrects. ${remaining} tentative(s) restante(s) avant blocage.`
          : 'Compte bloqué 30 minutes.',
        'INVALID_CREDENTIALS'
      );
    }
    // Compte non vérifié (simulé si email contient 'unverified')
    else if (body.email?.includes('unverified')) {
      errorResponse = err(403, 'Email non vérifié. Vérifiez votre boîte mail.', 'EMAIL_NOT_VERIFIED');
    }
    // Compte suspendu (simulé si email contient 'suspended')
    else if (body.email?.includes('suspended')) {
      errorResponse = err(403, 'Votre compte a été suspendu. Contactez le support.', 'ACCOUNT_SUSPENDED');
    }
    // Connexion réussie
    else {
      const user = body.email?.includes('admin') ? MOCK_ADMIN_USER : MOCK_USER;
      state.loginSuccess(user as any, {
        access: MOCK_AUTH_RESPONSE.accessToken,
        refresh: MOCK_AUTH_RESPONSE.refreshToken,
      });
      response = ok({ ...MOCK_AUTH_RESPONSE, utilisateur: user });
    }
  }

  // POST /auth/refresh
  else if (url.includes('/auth/refresh') && method === 'POST') {
    if (body.refreshToken === 'invalid_token') {
      errorResponse = err(401, 'Session expirée. Veuillez vous reconnecter.', 'TOKEN_EXPIRED');
    } else {
      response = ok(MOCK_AUTH_RESPONSE);
    }
  }

  // POST /auth/logout
  else if (url.includes('/auth/logout') && method === 'POST') {
    state.logout();
    response = ok(null, 'Déconnexion réussie');
  }

  // POST /auth/forgot-password
  else if (url.includes('/auth/forgot-password') && method === 'POST') {
    if (!body.email?.includes('@')) {
      errorResponse = err(400, 'Format email invalide');
    } else {
      // Simuler email introuvable
      if (body.email?.includes('notfound')) {
        // On répond quand même OK (sécurité : ne pas révéler si l'email existe)
      }
      response = ok(null, 'Email de réinitialisation envoyé si le compte existe');
    }
  }

  // POST /auth/reset-password
  else if (url.includes('/auth/reset-password') && method === 'POST') {
    if (body.token === 'expired_token') {
      errorResponse = err(400, 'Lien expiré. Demandez un nouveau lien.', 'TOKEN_EXPIRED');
    } else {
      response = ok(null, 'Mot de passe modifié avec succès');
    }
  }

  // GET /auth/me
  else if ((url.includes('/auth/me') || (url.includes('/utilisateurs/me') && method === 'GET')) && method === 'GET') {
    const sess = state.getSession();
    response = ok(sess.user ?? MOCK_USER);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANNONCES
  // ═══════════════════════════════════════════════════════════════════════════

  // Actions PATCH (ordre important : avant la route générale)
  else if (url.match(/\/annonces\/(\d+)\/pause$/) && method === 'PATCH') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    state.updateAnnonce(id, { statut: 'EN_PAUSE' });
    response = ok(null, 'Annonce mise en pause');
  }
  else if (url.match(/\/annonces\/(\d+)\/reactiver$/) && method === 'PATCH') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    state.updateAnnonce(id, { statut: 'ACTIVE' });
    response = ok(null, 'Annonce réactivée');
  }
  else if (url.match(/\/annonces\/(\d+)\/renouveler$/) && method === 'PATCH') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    const newExp = new Date(Date.now() + 30 * 86400000).toISOString();
    state.updateAnnonce(id, { dateExpiration: newExp, statut: 'ACTIVE' });
    response = ok(null, 'Annonce renouvelée pour 30 jours');
  }
  else if (url.match(/\/annonces\/(\d+)\/archiver$/) && method === 'PATCH') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    state.updateAnnonce(id, { statut: 'ARCHIVEE' });
    response = ok(null, 'Annonce archivée');
  }

  // Photos
  else if (url.match(/\/annonces\/(\d+)\/photos$/) && method === 'POST') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    const photos = [{ id: Date.now(), url: `https://picsum.photos/seed/new${id}/800/500`,
      urlThumb: `https://picsum.photos/seed/new${id}/400/250`, ordre: 0, principale: true }];
    state.updateAnnonce(id, { photos, hasPhotos: true, photoPrincipale: photos[0].url, photoPrincipaleThumb: photos[0].urlThumb });
    response = ok(photos, 'Photos uploadées');
  }
  else if (url.match(/\/annonces\/\d+\/photos\/\d+$/) && method === 'DELETE') {
    response = ok(null, 'Photo supprimée');
  }

  // Mes annonces
  else if (url.includes('/annonces/mes-annonces') && method === 'GET') {
    const p = parseInt(qp.get('page') ?? '0');
    const s = parseInt(qp.get('size') ?? '12');
    response = ok(page(state.getMesAnnonces(), p, s));
  }

  // Dashboard stats
  else if (url.includes('/annonces/dashboard-stats') && method === 'GET') {
    const mes = state.getMesAnnonces();
    response = ok({
      nombreAnnoncesActives: mes.filter(a => a.statut === 'ACTIVE').length,
      nombreAnnoncesTotal: mes.length,
      nombreContactsTotal: mes.reduce((s, a) => s + (a.nombreContacts ?? 0), 0),
      nombreFavorisTotal: state.getFavoris().length,
      nombreVuesTotal: mes.reduce((s, a) => s + (a.nombreVues ?? 0), 0),
      annoncesExpirantBientot: mes.filter(a => {
        const exp = new Date(a.dateExpiration);
        const diff = (exp.getTime() - Date.now()) / 86400000;
        return diff <= 5 && diff >= 0 && a.statut === 'ACTIVE';
      }),
    });
  }

  // DELETE annonce
  else if (url.match(/\/annonces\/(\d+)$/) && method === 'DELETE') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    state.deleteAnnonce(id);
    response = ok(null, 'Annonce supprimée');
  }

  // GET annonce detail
  else if (url.match(/\/annonces\/(\d+)$/) && method === 'GET') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    const annonce = state.getAnnonce(id);
    if (!annonce) {
      errorResponse = err(404, 'Annonce introuvable ou supprimée');
    } else {
      // Incrémenter les vues
      state.updateAnnonce(id, { nombreVues: (annonce.nombreVues ?? 0) + 1 });
      const isFav = state.isFavori(id);
      response = ok({ ...state.getAnnonce(id), isFavori: isFav });
    }
  }

  // PUT /annonces/:id (modifier)
  else if (url.match(/\/annonces\/(\d+)$/) && method === 'PUT') {
    const id = parseInt(url.match(/\/annonces\/(\d+)/)![1]);
    state.updateAnnonce(id, body);
    response = ok(state.getAnnonce(id), 'Annonce modifiée');
  }

  // GET /annonces (liste publique avec filtres)
  else if (url.startsWith('/annonces') && !url.includes('/mes-') && !url.includes('/dashboard') && method === 'GET') {
    let all = state.getAnnonces().filter(a => a.statut === 'ACTIVE');

    // Filtres
    const ville    = qp.get('ville');
    const typeId   = qp.get('typeBienId');
    const locId    = qp.get('localisationId');
    const prixMin  = qp.get('prixMin');
    const prixMax  = qp.get('prixMax');
    const motCle   = qp.get('motCle');

    if (ville)   all = all.filter(a => a.ville.toLowerCase() === ville.toLowerCase());
    if (typeId)  all = all.filter(a => a.typeBienId === parseInt(typeId));
    if (locId)   all = all.filter(a => a.localisationId === parseInt(locId));
    if (prixMin) all = all.filter(a => a.prix >= parseInt(prixMin));
    if (prixMax) all = all.filter(a => a.prix <= parseInt(prixMax));
    if (motCle)  all = all.filter(a =>
      a.description.toLowerCase().includes(motCle.toLowerCase()) ||
      a.quartier.toLowerCase().includes(motCle.toLowerCase()) ||
      a.typeBien.toLowerCase().includes(motCle.toLowerCase())
    );

    // Marquer les favoris si connecté
    const sess = state.getSession();
    if (sess.user) {
      all = all.map(a => ({ ...a, isFavori: state.isFavori(a.id) }));
    }

    const p = parseInt(qp.get('page') ?? '0');
    const s = parseInt(qp.get('size') ?? '12');
    response = ok(page(all, p, s));
  }

  // POST /annonces (publier)
  else if (url === '/annonces' && method === 'POST') {
    // SC-09.1: Vérifier limite annonces actives
    const activeCount = state.getActiveCount();
    if (activeCount >= 5) {
      errorResponse = err(422,
        'Vous avez atteint votre limite de 5 annonces actives. Archivez ou supprimez une annonce existante.',
        'MAX_ANNONCES_REACHED'
      );
    }
    // SC-09.1: Vérifier doublon
    else if (state.checkDuplicate(body.typeBienId, body.localisationId, body.prix)) {
      // On laisse passer mais on avertit (le frontend affiche une alerte non bloquante)
      const loc = MOCK_LOCALISATIONS.find(l => l.id === body.localisationId);
      const type = MOCK_TYPE_BIENS.find(t => t.id === body.typeBienId);
      const newAnnonce = {
        id: Date.now(),
        typeBien: type?.nom ?? 'Bien',
        typeBienId: body.typeBienId,
        ville: loc?.ville ?? 'Douala',
        quartier: loc?.quartier ?? 'Centre',
        prix: body.prix,
        prixFormate: new Intl.NumberFormat('fr-CM').format(body.prix) + ' FCFA',
        statut: 'ACTIVE',
        hasPhotos: false,
        datePublication: new Date().toISOString(),
        dateExpiration: new Date(Date.now() + 30 * 86400000).toISOString(),
        nombreVues: 0, nombreCommentaires: 0, nombreContacts: 0,
        photos: [], commentaires: [],
        proprietairePrenom: state.getSession().user?.prenom ?? 'Propriétaire',
        description: body.description,
        localisationId: body.localisationId,
        isFavori: false,
        photoPrincipale: null, photoPrincipaleThumb: null,
        _duplicateWarning: true,
      };
      state.addAnnonce(newAnnonce);
      response = ok(newAnnonce, 'Annonce publiée (annonce similaire détectée)');
    } else {
      const loc = MOCK_LOCALISATIONS.find(l => l.id === body.localisationId);
      const type = MOCK_TYPE_BIENS.find(t => t.id === body.typeBienId);
      const newAnnonce = {
        id: Date.now(),
        typeBien: type?.nom ?? 'Bien',
        typeBienId: body.typeBienId,
        ville: loc?.ville ?? 'Douala',
        quartier: loc?.quartier ?? 'Centre',
        prix: body.prix,
        prixFormate: new Intl.NumberFormat('fr-CM').format(body.prix) + ' FCFA',
        statut: 'ACTIVE',
        hasPhotos: false,
        datePublication: new Date().toISOString(),
        dateExpiration: new Date(Date.now() + 30 * 86400000).toISOString(),
        nombreVues: 0, nombreCommentaires: 0, nombreContacts: 0,
        photos: [], commentaires: [],
        proprietairePrenom: state.getSession().user?.prenom ?? 'Propriétaire',
        description: body.description,
        localisationId: body.localisationId,
        isFavori: false,
        photoPrincipale: null, photoPrincipaleThumb: null,
      };
      state.addAnnonce(newAnnonce);
      response = ok(newAnnonce, 'Annonce publiée avec succès');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FAVORIS
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url.match(/\/favoris\/check\/(\d+)/) && method === 'GET') {
    const id = parseInt(url.match(/\/favoris\/check\/(\d+)/)![1]);
    response = ok({ isFavori: state.isFavori(id) });
  }
  else if (url === '/favoris' && method === 'GET') {
    response = ok(state.getFavorisData());
  }
  else if (url === '/favoris' && method === 'POST') {
    state.addFavori(body.annonceId);
    response = ok(null, 'Ajouté aux favoris');
  }
  else if (url.match(/\/favoris\/(\d+)$/) && method === 'DELETE') {
    const id = parseInt(url.match(/\/favoris\/(\d+)/)![1]);
    state.removeFavori(id);
    response = ok(null, 'Retiré des favoris');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMENTAIRES
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url === '/commentaires' && method === 'POST') {
    // Validation contenu
    if (!body.contenu || body.contenu.trim().length < 5) {
      errorResponse = err(400, 'Le commentaire doit contenir au moins 5 caractères');
    } else if (body.contenu.length > 500) {
      errorResponse = err(400, 'Le commentaire ne peut pas dépasser 500 caractères');
    } else {
      const comment = state.addComment(body.annonceId, body.contenu.trim());
      response = ok(comment, 'Commentaire publié');
    }
  }
  else if (url.match(/\/commentaires\/(\d+)\/reponse$/) && method === 'POST') {
    const id = parseInt(url.match(/\/commentaires\/(\d+)/)![1]);
    response = ok({
      id: Date.now(), contenu: body.contenu,
      dateCreation: new Date().toISOString(),
    });
  }
  else if (url.match(/\/commentaires\/(\d+)$/) && method === 'DELETE') {
    const id = parseInt(url.match(/\/commentaires\/(\d+)/)![1]);
    state.deleteComment(id);
    response = ok(null, 'Commentaire supprimé');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTACTS
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url === '/contacts' && method === 'POST') {
    const annonce = state.getAnnonce(body.annonceId);
    if (!annonce) {
      errorResponse = err(404, 'Annonce introuvable');
    } else {
      state.updateAnnonce(body.annonceId, {
        nombreContacts: (annonce.nombreContacts ?? 0) + 1
      });
      const phone = '237691877527';
      const msg = encodeURIComponent(
        `Bonjour, je vous contacte depuis ImmoCam concernant votre annonce : ` +
        `${annonce.typeBien} à ${annonce.quartier}, ${annonce.ville} — ` +
        `${annonce.prixFormate}. Est-il toujours disponible ?`
      );
      response = ok({ whatsappUrl: `https://wa.me/${phone}?text=${msg}` });
    }
  }
  else if (url.includes('/contacts/mes-contacts')) {
    const mes = state.getMesAnnonces().slice(0, 3).flatMap((a, i) => [
      { id: i * 10 + 1, utilisateurTelephone: `+2376912345${i}7`, utilisateurPrenom: ['Jean','Marie','Paul'][i % 3],
        annonceId: a.id, annonceTitre: `${a.typeBien} à ${a.quartier}`,
        dateContact: new Date(Date.now() - i * 3600000).toISOString() },
    ]);
    response = ok(page(mes, 0, 20));
  }
  else if (url.includes('/contacts/annonce/')) {
    const id = parseInt(url.split('/').pop() ?? '0');
    response = ok([
      { id: 1, utilisateurTelephone: '+237691234567', utilisateurPrenom: 'Jean',
        annonceId: id, annonceTitre: 'Annonce', dateContact: new Date().toISOString() },
      { id: 2, utilisateurTelephone: '+237698765432', utilisateurPrenom: 'Marie',
        annonceId: id, annonceTitre: 'Annonce', dateContact: new Date(Date.now() - 86400000).toISOString() },
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNALEMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url === '/signalements' && method === 'POST') {
    if (!body.motif) {
      errorResponse = err(400, 'Le motif est obligatoire');
    } else {
      response = ok(null, 'Signalement enregistré. Notre équipe va examiner cette annonce.');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCALISATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url.includes('/localisations/villes')) {
    response = ok(MOCK_VILLES);
  }
  else if (url.includes('/localisations/quartiers')) {
    const ville = qp.get('ville') ?? 'Douala';
    const quartiers = MOCK_LOCALISATIONS.filter(
      l => l.ville.toLowerCase() === ville.toLowerCase()
    );
    response = ok(quartiers);
  }
  else if (url.includes('/localisations') && method === 'GET') {
    response = ok(MOCK_LOCALISATIONS);
  }
  else if (url.includes('/localisations') && method === 'POST') {
    response = ok({ id: Date.now(), ...body, active: true }, 'Localisation ajoutée');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE BIENS
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url.includes('/typebien') && method === 'GET') {
    response = ok(MOCK_TYPE_BIENS);
  }
  else if (url.includes('/typebien') && method === 'POST') {
    response = ok({ id: Date.now(), ...body, active: true }, 'Type de bien ajouté');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILISATEUR (profil)
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url.includes('/utilisateurs/me') && method === 'PUT') {
    const sess = state.getSession();
    const updated = { ...(sess.user ?? MOCK_USER), ...body };
    response = ok(updated, 'Profil mis à jour');
  }
  else if (url.includes('/utilisateurs/me/password') && method === 'PUT') {
    if (body.ancienMotDePasse === 'wrongpassword') {
      errorResponse = err(400, 'Mot de passe actuel incorrect');
    } else {
      response = ok(null, 'Mot de passe modifié avec succès');
    }
  }
  else if (url.includes('/utilisateurs/me') && method === 'DELETE') {
    state.logout();
    response = ok(null, 'Compte supprimé. Vos données seront anonymisées sous 30 jours.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════════════════════════════

  else if (url.includes('/admin/dashboard')) {
    const days7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toISOString().split('T')[0],
        valeur: Math.floor(Math.random() * 150) + 30,
      };
    });
    response = ok({
      visitesTotales: 15840, visitesTotales7j: 2340, visitesTotales30j: 9200,
      annoncesActives: state.getAnnonces().filter(a => a.statut === 'ACTIVE').length,
      nouvellesAnnonces: 8, nouvellesAnnonces7j: 27,
      nouveauxInscrits: 5, nouveauxInscrits7j: 21,
      contactsWhatsapp: 89, contactsWhatsapp7j: 312,
      commentairesPublies: 15, commentairesPublies7j: 58,
      signalEmentsNonTraites: 3,
      evolutionVisites: days7,
      evolutionContacts: days7.map(d => ({ ...d, valeur: Math.floor(d.valeur * 0.35) })),
      evolutionPublications: days7.map(d => ({ ...d, valeur: Math.floor(d.valeur * 0.12) })),
      villesActives: [
        { ville: 'Douala', nombreAnnonces: 31 },
        { ville: 'Yaoundé', nombreAnnonces: 22 },
        { ville: 'Bafoussam', nombreAnnonces: 8 },
        { ville: 'Kribi', nombreAnnonces: 5 },
      ],
      typesBiensPopulaires: [
        { typeBien: 'Appartement', nombreAnnonces: 28 },
        { typeBien: 'Studio', nombreAnnonces: 18 },
        { typeBien: 'Maison', nombreAnnonces: 10 },
        { typeBien: 'Bureau', nombreAnnonces: 6 },
      ],
    });
  }
  else if (url.includes('/admin/annonces') && method === 'GET') {
    let all = state.getAnnonces();
    const statut = qp.get('statut');
    const ville  = qp.get('ville');
    if (statut) all = all.filter(a => a.statut === statut);
    if (ville)  all = all.filter(a => a.ville === ville);
    const p = parseInt(qp.get('page') ?? '0');
    response = ok(page(all, p, 20));
  }
  else if (url.match(/\/admin\/annonces\/\d+$/) && method === 'DELETE') {
    const id = parseInt(url.split('/').pop() ?? '0');
    state.deleteAnnonce(id);
    response = ok(null, 'Annonce supprimée par administration');
  }
  else if (url.match(/\/admin\/annonces\/\d+\/pause$/) && method === 'PATCH') {
    const id = parseInt(url.match(/\/admin\/annonces\/(\d+)/)![1]);
    state.updateAnnonce(id, { statut: 'EN_PAUSE' });
    response = ok(null, 'Annonce mise en pause par administration');
  }
  else if (url.includes('/admin/utilisateurs') && method === 'GET') {
    const mockUsers = Array.from({ length: 30 }, (_, i) => ({
      id: i + 2, prenom: ['Aimé','Marie','Jean','Grace','Paul','Bertrand'][i % 6],
      nom: ['Talla','Fotso','Ngono','Essomba','Biya','Kamga'][i % 6],
      nomComplet: `Utilisateur ${i + 2}`,
      email: `user${i + 2}@immocam.cm`,
      telephone: `+2376${String(i).padStart(8, '0')}`,
      ville: MOCK_VILLES[i % MOCK_VILLES.length],
      role: 'UTILISATEUR',
      statut: i % 8 === 0 ? 'SUSPENDU' : i % 15 === 0 ? 'BANNI' : 'ACTIF',
      emailVerifie: i % 5 !== 0,
      dateInscription: new Date(Date.now() - i * 86400000 * 4).toISOString(),
      nombreAnnonces: Math.floor(Math.random() * 5),
      nombreConnexions: Math.floor(Math.random() * 80) + 5,
      derniereConnexion: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
    }));
    const recherche = qp.get('recherche') ?? '';
    const filtered = recherche
      ? mockUsers.filter(u => u.nomComplet.toLowerCase().includes(recherche.toLowerCase()) ||
          u.email.toLowerCase().includes(recherche.toLowerCase()))
      : mockUsers;
    const p = parseInt(qp.get('page') ?? '0');
    response = ok(page(filtered, p, 20));
  }
  else if (url.match(/\/admin\/utilisateurs\/\d+\/(suspendre|bannir|activer)$/)) {
    response = ok(null, 'Action effectuée sur l\'utilisateur');
  }
  else if (url.includes('/admin/signalements') && method === 'GET') {
    const signalements = [
      { id: 1, annonceId: 3, annonceTitre: 'Appartement Akwa — Douala',
        auteurPrenom: 'Jean', auteurEmail: 'jean@test.cm',
        motif: 'ANNONCE_FRAUDULEUSE', description: 'Le prix affiché ne correspond pas à la réalité',
        statut: 'EN_ATTENTE', dateSignalement: new Date().toISOString() },
      { id: 2, annonceId: 7, annonceTitre: 'Studio Bastos — Yaoundé',
        auteurPrenom: 'Marie', auteurEmail: 'marie@test.cm',
        motif: 'PRIX_INCORRECT', description: null,
        statut: 'EN_ATTENTE', dateSignalement: new Date(Date.now() - 3600000).toISOString() },
      { id: 3, annonceId: 12, annonceTitre: 'Maison Bonanjo — Douala',
        auteurPrenom: 'Paul', auteurEmail: 'paul@test.cm',
        motif: 'BIEN_DEJA_LOUE', description: 'Le bien est loué depuis 2 mois',
        statut: 'EN_ATTENTE', dateSignalement: new Date(Date.now() - 7200000).toISOString() },
      { id: 4, annonceId: 5, annonceTitre: 'Bureau Centre-ville — Yaoundé',
        auteurPrenom: 'Grace', auteurEmail: 'grace@test.cm',
        motif: 'PHOTOS_NON_CONFORMES', description: null,
        statut: 'TRAITE', dateSignalement: new Date(Date.now() - 86400000).toISOString(),
        dateTraitement: new Date(Date.now() - 43200000).toISOString() },
    ];
    const statutFilter = qp.get('statut');
    const filtered = statutFilter ? signalements.filter(s => s.statut === statutFilter) : signalements;
    const p = parseInt(qp.get('page') ?? '0');
    response = ok(page(filtered, p, 20));
  }
  else if (url.match(/\/admin\/signalements\/\d+$/) && method === 'PUT') {
    response = ok(null, 'Signalement traité');
  }
  else if (url.includes('/admin/commentaires') && method === 'GET') {
    response = ok(page([], 0));
  }
  else if (url.match(/\/admin\/commentaires\/\d+$/) && method === 'DELETE') {
    response = ok(null, 'Commentaire supprimé');
  }
  else if (url.includes('/admin/config') && method === 'GET') {
    response = ok({
      dureeVieAnnonce: 30, joursRappelExpiration: 5, joursSuppressionDefinitive: 7,
      maxPhotosParAnnonce: 4, maxAnnoncesParProprietaire: 5,
      messageWhatsappDefaut: 'Bonjour, je vous contacte depuis ImmoCam concernant votre annonce : {type} à {quartier}, {ville} — {prix} FCFA. Est-il toujours disponible ?',
      rateLimit: 100, schedulerEnabled: true,
    });
  }
  else if (url.includes('/admin/config') && method === 'PUT') {
    response = ok(body, 'Configuration mise à jour');
  }
  else if (url.includes('/admin/exports/')) {
    const type = url.includes('utilisateurs') ? 'utilisateurs' : 'annonces';
    const csvContent = type === 'annonces'
      ? 'id,type,ville,quartier,prix,statut,vues\n' +
        state.getAnnonces().slice(0, 10).map(a =>
          `${a.id},${a.typeBien},${a.ville},${a.quartier},${a.prix},${a.statut},${a.nombreVues}`
        ).join('\n')
      : 'id,prenom,nom,email,ville,statut\n1,Franck,Tchinda,franck@mbemnova.com,Douala,ACTIF';
    response = new HttpResponse({
      status: 200,
      body: new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }),
    });
  }

  // ─── Route non couverte → API réelle ─────────────────────────────────────
  if (!response && !errorResponse) {
    console.warn(`[MOCK] Route non couverte: ${method} ${url}`);
    return next(req);
  }

  // Retourner la réponse (ok ou erreur) avec délai simulé
  if (errorResponse) {
    return throwError(() => errorResponse).pipe(delay(d));
  }
  return of(response!).pipe(delay(d));
};
