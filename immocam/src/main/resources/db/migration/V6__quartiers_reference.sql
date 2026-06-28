-- Catalogue des quartiers par ville (référentiel, indépendant des annonces)
CREATE TABLE quartiers (
    id                BIGSERIAL    PRIMARY KEY,
    localisation_id   BIGINT       NOT NULL REFERENCES localisations(id),
    nom               VARCHAR(100) NOT NULL,
    date_creation     TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);
CREATE UNIQUE INDEX uk_quartiers_localisation_nom ON quartiers(localisation_id, LOWER(nom));
CREATE INDEX idx_quartiers_localisation ON quartiers(localisation_id);

-- Backfill : reprend les quartiers déjà utilisés par des annonces existantes
INSERT INTO quartiers (localisation_id, nom, date_creation)
SELECT DISTINCT a.localisation_id, a.quartier, NOW()
FROM annonces a
WHERE a.quartier IS NOT NULL AND a.quartier <> '' AND a.quartier <> 'Non spécifié'
ON CONFLICT (localisation_id, LOWER(nom)) DO NOTHING;
