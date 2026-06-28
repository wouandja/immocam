-- Améliore le message WhatsApp par défaut (ajoute la variable {proprietaire}).
-- Ne touche pas aux installations où l'admin a déjà personnalisé le message.
UPDATE config_systeme
SET valeur = 'Bonjour {proprietaire}, je suis interesse(e) par votre annonce ImmoCam : {type} a {quartier}, {ville} — {prix}. Est-elle toujours disponible ?',
    description = 'Message pre-rempli WhatsApp (placeholders: {proprietaire}, {type}, {quartier}, {ville}, {prix})'
WHERE cle = 'MSG_WHATSAPP'
  AND valeur = 'Bonjour, je vous contacte depuis ImmoCam concernant votre annonce : {type} a {quartier}, {ville} — {prix} FCFA. Est-il toujours disponible ?';
