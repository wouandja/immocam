-- Traçabilité : qui a mis l'annonce en pause (admin uniquement, NULL = propriétaire)
ALTER TABLE annonces ADD COLUMN mis_en_pause_par_id BIGINT REFERENCES utilisateurs(id);

-- Notifications admin (signalements, nouvelles inscriptions, ...)
CREATE TABLE notifications (
    id              BIGSERIAL    PRIMARY KEY,
    type            VARCHAR(30)  NOT NULL,
    titre           VARCHAR(255) NOT NULL,
    message         TEXT,
    lien            VARCHAR(255),
    reference_id    BIGINT,
    lu              BOOLEAN      NOT NULL DEFAULT FALSE,
    date_creation   TIMESTAMP    NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP
);
CREATE INDEX idx_notifications_lu   ON notifications(lu);
CREATE INDEX idx_notifications_date ON notifications(date_creation DESC);
