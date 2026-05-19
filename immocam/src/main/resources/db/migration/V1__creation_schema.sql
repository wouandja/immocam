-- =============================================================================
-- IMMOCAM — V1 : Creation du schema complet
-- Execute automatiquement par Flyway au premier demarrage
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Utilisateurs
CREATE TABLE utilisateurs (
    id                              BIGSERIAL    PRIMARY KEY,
    prenom                          VARCHAR(50)  NOT NULL,
    nom                             VARCHAR(50)  NOT NULL,
    email                           VARCHAR(150) NOT NULL UNIQUE,
    telephone                       VARCHAR(20)  NOT NULL,
    mot_de_passe_hash               TEXT         NOT NULL,
    ville                           VARCHAR(100) NOT NULL,
    role                            VARCHAR(20)  NOT NULL DEFAULT 'UTILISATEUR',
    statut                          VARCHAR(20)  NOT NULL DEFAULT 'NON_VERIFIE',
    politique_acceptee              BOOLEAN      NOT NULL DEFAULT FALSE,
    date_acceptation_politique      TIMESTAMP,
    tentatives_connexion_echouees   INTEGER      NOT NULL DEFAULT 0,
    compte_bloque_jusqu_a           TIMESTAMP,
    motif_suspension                TEXT,
    date_suspension                 TIMESTAMP,
    dernier_login                   TIMESTAMP,
    date_creation                   TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification               TIMESTAMP
);
CREATE INDEX idx_utilisateurs_email  ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_statut ON utilisateurs(statut);

-- Codes OTP
CREATE TABLE codes_validation (
    id                BIGSERIAL    PRIMARY KEY,
    utilisateur_id    BIGINT       NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    code              VARCHAR(10)  NOT NULL,
    type_code         VARCHAR(30)  NOT NULL,
    date_expiration   TIMESTAMP    NOT NULL,
    est_utilise       BOOLEAN      NOT NULL DEFAULT FALSE,
    nombre_renvois    INTEGER      NOT NULL DEFAULT 0,
    date_creation     TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);
CREATE INDEX idx_codes_validation_user ON codes_validation(utilisateur_id);

-- Tokens reinitialisation mot de passe
CREATE TABLE tokens_reinitialisation (
    id                BIGSERIAL    PRIMARY KEY,
    utilisateur_id    BIGINT       NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    token             VARCHAR(255) NOT NULL UNIQUE,
    date_expiration   TIMESTAMP    NOT NULL,
    est_utilise       BOOLEAN      NOT NULL DEFAULT FALSE,
    date_creation     TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);

-- Types de biens
CREATE TABLE types_biens (
    id                BIGSERIAL   PRIMARY KEY,
    libelle           VARCHAR(50) NOT NULL UNIQUE,
    est_actif         BOOLEAN     NOT NULL DEFAULT TRUE,
    date_creation     TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);

-- Localisations (villes + quartiers)
CREATE TABLE localisations (
    id                BIGSERIAL    PRIMARY KEY,
    ville             VARCHAR(100) NOT NULL,
    quartier          VARCHAR(100),
    est_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    est_pre_chargee   BOOLEAN      NOT NULL DEFAULT FALSE,
    date_creation     TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP,
    UNIQUE(ville, quartier)
);
CREATE INDEX idx_localisations_ville  ON localisations(ville);
CREATE INDEX idx_localisations_active ON localisations(est_active);

-- Annonces
CREATE TABLE annonces (
    id                  BIGSERIAL       PRIMARY KEY,
    description         TEXT            NOT NULL,
    prix                NUMERIC(12,2)   NOT NULL,
    numero_whatsapp     VARCHAR(20)     NOT NULL,
    statut              VARCHAR(25)     NOT NULL DEFAULT 'ACTIVE',
    nombre_vues         INTEGER         NOT NULL DEFAULT 0,
    proprietaire_id     BIGINT          NOT NULL REFERENCES utilisateurs(id),
    type_bien_id        BIGINT          NOT NULL REFERENCES types_biens(id),
    localisation_id     BIGINT          NOT NULL REFERENCES localisations(id),
    date_expiration     TIMESTAMP       NOT NULL,
    rappel_j5_envoye    BOOLEAN         NOT NULL DEFAULT FALSE,
    rappel_j1_envoye    BOOLEAN         NOT NULL DEFAULT FALSE,
    motif_suppression   TEXT,
    supprime_par_id     BIGINT,
    date_suppression    TIMESTAMP,
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    date_creation       TIMESTAMP       NOT NULL DEFAULT NOW(),
    date_modification   TIMESTAMP
);
CREATE INDEX idx_annonces_statut       ON annonces(statut);
CREATE INDEX idx_annonces_proprietaire ON annonces(proprietaire_id);
CREATE INDEX idx_annonces_expiration   ON annonces(date_expiration);
CREATE INDEX idx_annonces_deleted      ON annonces(is_deleted);
CREATE INDEX idx_annonces_publiques    ON annonces(statut, is_deleted)
    WHERE statut = 'ACTIVE' AND is_deleted = FALSE;

-- Photos
CREATE TABLE photos (
    id                BIGSERIAL    PRIMARY KEY,
    chemin_stockage   VARCHAR(500) NOT NULL,
    nom_original      VARCHAR(255),
    ordre             INTEGER      NOT NULL DEFAULT 1,
    est_principale    BOOLEAN      NOT NULL DEFAULT FALSE,
    taille_octets     BIGINT,
    annonce_id        BIGINT       NOT NULL REFERENCES annonces(id) ON DELETE CASCADE,
    date_creation     TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);
CREATE INDEX idx_photos_annonce ON photos(annonce_id);

-- Contacts WhatsApp
CREATE TABLE contacts_whatsapp (
    id                 BIGSERIAL   PRIMARY KEY,
    utilisateur_id     BIGINT      NOT NULL REFERENCES utilisateurs(id),
    annonce_id         BIGINT      NOT NULL REFERENCES annonces(id),
    telephone_contact  VARCHAR(20),
    adresse_ip         VARCHAR(45),
    date_contact       TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_creation      TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_modification  TIMESTAMP
);
CREATE INDEX idx_contacts_annonce     ON contacts_whatsapp(annonce_id);
CREATE INDEX idx_contacts_utilisateur ON contacts_whatsapp(utilisateur_id);

-- Favoris
CREATE TABLE favoris (
    id                BIGSERIAL   PRIMARY KEY,
    utilisateur_id    BIGINT      NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    annonce_id        BIGINT      NOT NULL REFERENCES annonces(id),
    date_creation     TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP,
    UNIQUE(utilisateur_id, annonce_id)
);
CREATE INDEX idx_favoris_utilisateur ON favoris(utilisateur_id);

-- Commentaires
CREATE TABLE commentaires (
    id                       BIGSERIAL   PRIMARY KEY,
    contenu                  TEXT        NOT NULL,
    auteur_id                BIGINT      NOT NULL REFERENCES utilisateurs(id),
    annonce_id               BIGINT      NOT NULL REFERENCES annonces(id),
    commentaire_parent_id    BIGINT      REFERENCES commentaires(id),
    est_supprime             BOOLEAN     NOT NULL DEFAULT FALSE,
    supprime_par_admin       BOOLEAN     NOT NULL DEFAULT FALSE,
    motif_suppression_admin  TEXT,
    date_creation            TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_modification        TIMESTAMP
);
CREATE INDEX idx_commentaires_annonce ON commentaires(annonce_id);
CREATE INDEX idx_commentaires_auteur  ON commentaires(auteur_id);

-- Signalements
CREATE TABLE signalements (
    id                BIGSERIAL   PRIMARY KEY,
    auteur_id         BIGINT      NOT NULL REFERENCES utilisateurs(id),
    annonce_id        BIGINT      NOT NULL REFERENCES annonces(id),
    motif             VARCHAR(30) NOT NULL,
    details           TEXT,
    statut            VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
    traite_par_id     BIGINT      REFERENCES utilisateurs(id),
    date_traitement   TIMESTAMP,
    date_creation     TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);
CREATE INDEX idx_signalements_statut  ON signalements(statut);
CREATE INDEX idx_signalements_annonce ON signalements(annonce_id);

-- Configuration systeme
CREATE TABLE config_systeme (
    id                BIGSERIAL    PRIMARY KEY,
    cle               VARCHAR(100) NOT NULL UNIQUE,
    valeur            TEXT         NOT NULL,
    description       TEXT,
    modifie_par_id    BIGINT       REFERENCES utilisateurs(id),
    date_creation     TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);

-- Logs d'activite
CREATE TABLE logs_activite (
    id                BIGSERIAL   PRIMARY KEY,
    utilisateur_id    BIGINT,
    type_action       VARCHAR(40) NOT NULL,
    entite_concernee  VARCHAR(50),
    entite_id         BIGINT,
    adresse_ip        VARCHAR(45),
    details           TEXT,
    date_creation     TIMESTAMP   NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);
CREATE INDEX idx_logs_utilisateur ON logs_activite(utilisateur_id);
CREATE INDEX idx_logs_type_action  ON logs_activite(type_action);
CREATE INDEX idx_logs_date         ON logs_activite(date_creation);
