export enum StatutAnnonce {
  ACTIVE    = 'ACTIVE',
  EN_PAUSE  = 'EN_PAUSE',
  EXPIREE   = 'EXPIREE',
  ARCHIVEE  = 'ARCHIVEE',
  SUPPRIMEE = 'SUPPRIMEE',
  EN_ATTENTE = 'EN_ATTENTE',
}

export enum RoleUtilisateur {
  UTILISATEUR    = 'UTILISATEUR',
  ADMINISTRATEUR = 'ADMINISTRATEUR',
}

export enum StatutCompte {
  ACTIF    = 'ACTIF',
  SUSPENDU = 'SUSPENDU',
  BANNI    = 'BANNI',
}

export enum MotifSignalement {
  ANNONCE_FRAUDULEUSE  = 'ANNONCE_FRAUDULEUSE',
  PHOTOS_NON_CONFORMES = 'PHOTOS_NON_CONFORMES',
  PRIX_INCORRECT       = 'PRIX_INCORRECT',
  BIEN_DEJA_LOUE       = 'BIEN_DEJA_LOUE',
  CONTENU_INAPPROPRIE  = 'CONTENU_INAPPROPRIE',
  AUTRE                = 'AUTRE',
}

export enum StatutSignalement {
  EN_ATTENTE = 'EN_ATTENTE',
  TRAITE     = 'TRAITE',
  IGNORE     = 'IGNORE',
}

export const STATUT_ANNONCE_LABELS: Record<StatutAnnonce, string> = {
  [StatutAnnonce.ACTIVE]:    'Active',
  [StatutAnnonce.EN_PAUSE]:  'En pause',
  [StatutAnnonce.EXPIREE]:   'Expirée',
  [StatutAnnonce.ARCHIVEE]:  'Archivée',
  [StatutAnnonce.SUPPRIMEE]: 'Supprimée',
  [StatutAnnonce.EN_ATTENTE]: 'En attente',
};

export const MOTIF_SIGNALEMENT_LABELS: Record<MotifSignalement, string> = {
  [MotifSignalement.ANNONCE_FRAUDULEUSE]:  'Annonce frauduleuse ou arnaque',
  [MotifSignalement.PHOTOS_NON_CONFORMES]: 'Photos non conformes au bien réel',
  [MotifSignalement.PRIX_INCORRECT]:       'Prix incorrect ou trompeur',
  [MotifSignalement.BIEN_DEJA_LOUE]:       'Bien déjà loué ou vendu',
  [MotifSignalement.CONTENU_INAPPROPRIE]:  'Contenu inapproprié',
  [MotifSignalement.AUTRE]:                'Autre',
};

export const STATUT_ANNONCE_COLORS: Record<StatutAnnonce, string> = {
  [StatutAnnonce.ACTIVE]:    'badge-active',
  [StatutAnnonce.EN_PAUSE]:  'badge-pause',
  [StatutAnnonce.EXPIREE]:   'badge-expired',
  [StatutAnnonce.ARCHIVEE]:  'badge-archived',
  [StatutAnnonce.SUPPRIMEE]: 'badge-deleted',
  [StatutAnnonce.EN_ATTENTE]: 'badge-pending',
};
