export type ExpiryTier = 'expired' | 'urgent' | 'soon';

export interface ExpiryStatus {
  tier: ExpiryTier;
  daysLeft: number;
  label: string;
}

/**
 * Statut d'expiration d'une annonce à partir de sa dateExpiration (ISO) et,
 * si connu, de son statut backend. Le statut prime sur le calcul de date :
 * EXPIREE est toujours considéré "expired", même si dateExpiration n'a pas
 * encore été rafraîchie côté client.
 */
export function getExpiryStatus(dateExpiration: string, statut?: string): ExpiryStatus {
  const diffMs = new Date(dateExpiration).getTime() - Date.now();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // diffMs < 0 et non "daysLeft < 0" : Math.ceil() d'une différence négative
  // inférieure à 24h donne -0, qui n'est PAS < 0 en JS — ça faisait passer
  // une annonce expirée depuis quelques heures pour "urgent" au lieu de "expired".
  if (statut === 'EXPIREE' || diffMs < 0) {
    return { tier: 'expired', daysLeft, label: 'Expirée' };
  }
  if (daysLeft <= 2) {
    return {
      tier: 'urgent', daysLeft,
      label: daysLeft === 0 ? "Expire aujourd'hui" : `Expire dans ${daysLeft} j`,
    };
  }
  return { tier: 'soon', daysLeft, label: `Expire dans ${daysLeft} j` };
}
