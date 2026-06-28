-- La contrainte CHECK générée automatiquement (Hibernate ddl-auto) ne listait que
-- 4 des 7 valeurs de StatutSignalement (manquaient TRAITE_INFO, TRAITE_PAUSE,
-- TRAITE_BANNISSEMENT) : tout admin choisissant ces décisions recevait une erreur 500.
-- On retire la contrainte, comme pour les autres colonnes de statut (annonces.statut,
-- utilisateurs.statut) qui ne sont pas contraintes en base — la validation est
-- déjà assurée par l'enum Java côté application.
ALTER TABLE signalements DROP CONSTRAINT IF EXISTS signalements_statut_check;
