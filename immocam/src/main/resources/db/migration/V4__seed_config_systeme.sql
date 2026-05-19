-- IMMOCAM — V4 : Configuration systeme par defaut
-- Modifiable par l'admin via son interface sans redeploiement
INSERT INTO config_systeme (cle, valeur, description, date_creation) VALUES
    ('DUREE_VIE_ANNONCE_JOURS', '30',
     'Duree de vie d''une annonce en jours avant expiration automatique', NOW()),
    ('DELAI_RAPPEL_JOURS', '5',
     'Jours avant expiration pour le premier rappel (J-5)', NOW()),
    ('DELAI_RAPPEL_FINAL_JOURS', '1',
     'Jours avant expiration pour le rappel final (J-1)', NOW()),
    ('DELAI_SUPPRESSION_JOURS', '7',
     'Jours apres expiration avant suppression definitive (J+7)', NOW()),
    ('MAX_PHOTOS_PAR_ANNONCE', '4',
     'Nombre maximum de photos par annonce', NOW()),
    ('MAX_TAILLE_PHOTO_MO', '4',
     'Taille maximale d''une photo en megaoctets', NOW()),
    ('MAX_ANNONCES_PAR_PROPRIO', '5',
     'Annonces actives simultanees max par proprietaire (V2: lie a l''abonnement)', NOW()),
    ('MSG_WHATSAPP',
     'Bonjour, je vous contacte depuis ImmoCam concernant votre annonce : {type} a {quartier}, {ville} — {prix} FCFA. Est-il toujours disponible ?',
     'Message pre-rempli WhatsApp (placeholders: {type}, {quartier}, {ville}, {prix})', NOW()),
    ('MAX_CONNEXIONS_ECHOUEES', '5',
     'Tentatives de connexion echouees avant blocage du compte', NOW()),
    ('DUREE_BLOCAGE_MINUTES', '30',
     'Duree du blocage en minutes apres tentatives echouees', NOW());
