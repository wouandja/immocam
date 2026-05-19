-- Script de vérification des données de test ImmoCam
-- Exécuter avec: psql -U immocam_user -d immocam_dev -f check_test_data.sql

\echo '=== 🔍 VÉRIFICATION DES DONNÉES DE TEST ==='

\echo ''
\echo '📊 1. Utilisateurs créés:'
SELECT id, prenom, nom, email, statut, role FROM utilisateurs ORDER BY id;

\echo ''
\echo '📈 Nombre d''utilisateurs: ' 
SELECT COUNT(*) as total_utilisateurs FROM utilisateurs;

\echo ''
\echo '🏠 2. Annonces créées:'
SELECT a.id, a.description, a.prix, u.prenom, u.nom, t.libelle, l.ville, a.statut 
FROM annonces a 
LEFT JOIN utilisateurs u ON a.proprietaire_id = u.id 
LEFT JOIN types_biens t ON a.type_bien_id = t.id 
LEFT JOIN localisations l ON a.localisation_id = l.id 
ORDER BY a.id;

\echo ''
\echo '📈 Nombre d''annonces: '
SELECT COUNT(*) as total_annonces FROM annonces;

\echo ''
\echo '📸 3. Photos créées:'
SELECT p.id, p.nom_original, p.ordre, a.id as annonce_id, a.description 
FROM photos p 
LEFT JOIN annonces a ON p.annonce_id = a.id 
ORDER BY a.id, p.ordre;

\echo ''
\echo '📈 Nombre de photos: '
SELECT COUNT(*) as total_photos FROM photos;

\echo ''
\echo '💬 4. Commentaires créés:'
SELECT c.id, c.contenu, u.prenom, u.nom, a.id as annonce_id 
FROM commentaires c 
LEFT JOIN utilisateurs u ON c.auteur_id = u.id 
LEFT JOIN annonces a ON c.annonce_id = a.id 
ORDER BY a.id;

\echo ''
\echo '📈 Nombre de commentaires: '
SELECT COUNT(*) as total_commentaires FROM commentaires;

\echo ''
\echo '⭐ 5. Favoris créés:'
SELECT f.id, u.prenom as utilisateur, a.description as annonce 
FROM favoris f 
LEFT JOIN utilisateurs u ON f.utilisateur_id = u.id 
LEFT JOIN annonces a ON f.annonce_id = a.id 
ORDER BY u.id;

\echo ''
\echo '📈 Nombre de favoris: '
SELECT COUNT(*) as total_favoris FROM favoris;

\echo ''
\echo '📱 6. Contacts WhatsApp créés:'
SELECT c.id, u.prenom as contacteur, a.description as annonce 
FROM contacts_whatsapp c 
LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id 
LEFT JOIN annonces a ON c.annonce_id = a.id 
ORDER BY a.id;

\echo ''
\echo '📈 Nombre de contacts: '
SELECT COUNT(*) as total_contacts FROM contacts_whatsapp;

\echo ''
\echo '✅ VÉRIFICATION COMPLÈTE'
