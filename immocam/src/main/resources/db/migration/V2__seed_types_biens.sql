-- IMMOCAM — V2 : 8 types de biens immobiliers initiaux
INSERT INTO types_biens (libelle, est_actif, date_creation) VALUES
    ('Chambre',     TRUE, NOW()),
    ('Studio',      TRUE, NOW()),
    ('Appartement', TRUE, NOW()),
    ('Bureau',      TRUE, NOW()),
    ('Magasin',     TRUE, NOW()),
    ('Maison',      TRUE, NOW()),
    ('Boutique',    TRUE, NOW()),
    ('Espace',      TRUE, NOW());
