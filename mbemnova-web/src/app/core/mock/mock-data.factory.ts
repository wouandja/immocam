// =============================================================================
// IMMOCAM — Mock Data Factory V2
// Données réalistes camerounaises avec descriptions authentiques
// =============================================================================

import { StatutAnnonce } from '@core/services/models';

// ─── Villes et quartiers ───────────────────────────────────────────────────

export const VILLES_QUARTIERS: Record<string, string[]> = {
  Douala: [
    'Bonanjo',
    'Akwa',
    'Deido',
    'Bali',
    'New Bell',
    'Bonabéri',
    'Makepe',
    'Kotto',
    'Logpom',
    'Ndogpassi',
  ],
  Yaoundé: [
    'Bastos',
    'Centre-ville',
    'Nlongkak',
    'Messa',
    'Biyem-Assi',
    'Mendong',
    'Omnisport',
    'Mfandena',
    'Essos',
  ],
  Bafoussam: ['Quartier Commercial', 'Djeleng', 'Tamdja', 'Kouoté', 'Tougang'],
  Kribi: ['Plage', 'Centre', 'Grand Batanga', 'Mboa Ma Mbock'],
  Limbé: ['Down Beach', 'Mile 4', 'Bota', 'Church Street'],
  Bamenda: ['Commercial Avenue', 'Old Town', 'Ntarikon', 'Small Mankon'],
  Buea: ['Molyko', 'Great Soppo', 'Bonduma', 'Mile 17'],
  Garoua: ['Yelwa', 'Poumpoumré', 'Foulbéré'],
  Ngaoundéré: ['Baladji', 'Centre administratif', 'Mbideng'],
};

export const MOCK_VILLES = Object.keys(VILLES_QUARTIERS);

// ─── Types de biens ────────────────────────────────────────────────────────

export const MOCK_TYPE_BIENS = [
  { id: 1, nom: 'Appartement', icone: '🏢', active: true },
  { id: 2, nom: 'Studio', icone: '🏠', active: true },
  { id: 3, nom: 'Villa', icone: '🏡', active: true },
  { id: 4, nom: 'Maison', icone: '🏘️', active: true },
  { id: 5, nom: 'Bureau', icone: '💼', active: true },
  { id: 6, nom: 'Boutique', icone: '🏪', active: true },
  { id: 7, nom: 'Chambre', icone: '🛏️', active: true },
  { id: 8, nom: 'Terrain', icone: '🌱', active: true },
];

// ─── Localisations ─────────────────────────────────────────────────────────

let _locId = 1;
export const MOCK_LOCALISATIONS = Object.entries(VILLES_QUARTIERS).flatMap(([ville, quartiers]) =>
  quartiers.map((quartier) => ({ id: _locId++, ville, quartier, active: true })),
);

// ─── Descriptions réalistes ────────────────────────────────────────────────

const DESCRIPTIONS: Record<string, string[]> = {
  Appartement: [
    'Bel appartement moderne de 2 chambres entièrement rénové en 2025. Cuisine équipée (réfrigérateur, plaques électriques, évier inox), salon spacieux avec ventilateur, 2 chambres climatisées, salle de bain avec chauffe-eau. Eau et électricité disponibles 24h/24. Gardiennage 24h, parking sécurisé. Idéal couple ou jeune professionnel.',
    "Appartement F3 au 2ème étage d'un immeuble sécurisé. 3 chambres, 2 salles de bain, grand salon, cuisine équipée, balcon avec vue dégagée. Groupe électrogène en cas de coupure. Gardien permanent. Connexion internet fibre disponible dans le bâtiment.",
    'Grand appartement lumineux en rez-de-chaussée surélevé. 4 pièces dont 2 chambres, salon-salle à manger séparé, cuisine aménagée, WC invité séparé. Résidence sécurisée avec portail automatique. Parking 2 voitures. Quartier calme et prisé.',
  ],
  Studio: [
    'Studio meublé idéal pour étudiant ou jeune professionnel. Pièce principale avec lit 2 places, table de travail, armoire. Kitchenette équipée. Salle de bain avec douche. WiFi inclus. Eau chaude, électricité stable. Immeuble sécurisé, proche université et transports en commun.',
    'Studio cosy entièrement meublé au 3ème étage. Vue agréable, lumière naturelle. Lit, bureau, TV, réfrigérateur, plaque de cuisson, vaisselle fournis. Eau et électricité incluses dans le loyer. Accès 24h/24. Bail flexible (mensuel ou annuel).',
  ],
  Villa: [
    'Somptueuse villa 5 chambres dans résidence fermée et gardée 24h. Piscine privée 8m x 4m, jardin paysagé, garage 3 voitures, générateur 20 KVA, fosse sceptique, citerne 10 000L. Cuisine moderne entièrement équipée. Salle de jeux, bureau. Idéale famille expatriée ou diplomatique.',
    'Villa contemporaine 4 chambres avec jardin clos. 3 salles de bains, salon-salle à manger séparé, cuisine US, dressing maître, buanderie. Groupe électrogène, citerne eau, climatisation centrale. Quartier résidentiel prisé, proximité écoles internationales.',
  ],
  Maison: [
    'Maison de ville sur 2 niveaux, 4 chambres, 2 salles de bain. Grande cour clôturée pouvant accueillir 3 véhicules. Cuisine avec garde-manger, séjour spacieux. Eau de la SNEC, électricité AES (compteur propre). Connexion internet MTN disponible.',
    'Belle maison standalone avec cour, 3 chambres, salon, cuisine équipée. Jardin potager, poulailler possible, espace pour petit commerce en façade. Titre foncier disponible pour consultation. Quartier accessible, desservi par taxis-motos.',
  ],
  Bureau: [
    "Bureau professionnel au rez-de-chaussée commercial, surface 50m², climatisé. Salle d'attente, bureau principal, salle de réunion pour 8 personnes. WC séparé. Groupe électrogène automatique, connexion fibre optique. Parking clients devant le local. Idéal cabinet médical, cabinet juridique, agence.",
    'Espace bureau open space 80m² au 2ème étage. 6 postes de travail, salle de réunion vitrée 10 places, kitchenette, 2 WC. Sécurité 24h, badge magnétique. Accès internet très haut débit. Électricité triphasée disponible. Bail 1 an minimum.',
  ],
  Boutique: [
    'Local commercial en rez-de-chaussée sur axe très fréquenté. 35m² au sol, hauteur sous plafond 4m. Vitrine 6m, arrière-boutique, WC. Électricité triphasée, branchement eau. Idéal alimentation, pharmacie, boutique vêtements. Loyer charges comprises.',
    'Boutique angle 2 rues dans zone commerciale animée. 45m² + réserve 15m². Climatisé, alarme, rideau métallique. Fort passage piéton et vehicules. Proximité parking municipal. Droit au bail négociable.',
  ],
  Chambre: [
    'Chambre meublée chez particulier dans maison calme. Lit 2 places, matelas neuf, armoire, table de nuit, ventilateur. Salle de bain et WC partagés (2 locataires max). Cuisine partagée avec réfrigérateur. WiFi, eau, électricité inclus. Ambiance familiale, quartier sécurisé.',
    'Chambre indépendante avec entrée privée, salle de bain privée. Lit, bureau, armoire, TV, réfrigérateur mini. Eau et électricité incluses. Accès illimité. Jardin partagé. Idéal pour étudiant ou travailleur en déplacement. Caution 1 mois.',
  ],
  Terrain: [
    'Terrain de 500m² titré dans quartier résidentiel en plein développement. Forme régulière 20m x 25m, terrain plat. Accès route goudronnée, eau et électricité en bordure. Documents en règle (titre foncier, plan topographique). Idéal construction villa ou immeuble R+2.',
    'Parcelle 300m² en zone résidentielle, tous documents disponibles. Voisinage bâti, quartier sécurisé. Eau SNEC et électricité accessibles depuis la rue. Possibilité financement étalé sur 12 mois.',
  ],
};

function getDescription(typeBien: string): string {
  const descs = DESCRIPTIONS[typeBien] ?? DESCRIPTIONS['Appartement'];
  return descs[Math.floor(Math.random() * descs.length)];
}

// ─── Prénoms camerounais ───────────────────────────────────────────────────

const PRENOMS = [
  'Jean-Pierre',
  'Marie-Claire',
  'Emmanuel',
  'Fatima',
  'Christian',
  'Grâce',
  'Bertrand',
  'Aïcha',
  'Rodrigue',
  'Cécile',
  'Thierry',
  'Sandrine',
  'Alain',
  'Nathalie',
  'Serge',
  'Pascale',
  'Hervé',
  'Monique',
  'Franck',
  'Sylvie',
];

// ─── Générateur d'annonces ─────────────────────────────────────────────────

export function generateAnnonces(count = 50): any[] {
  const annonces = [];
  const villes = Object.keys(VILLES_QUARTIERS);
  const prixParType: Record<string, [number, number]> = {
    Appartement: [60000, 300000],
    Studio: [25000, 100000],
    Villa: [300000, 1200000],
    Maison: [80000, 400000],
    Bureau: [100000, 600000],
    Boutique: [50000, 350000],
    Chambre: [15000, 60000],
    Terrain: [50000, 800000],
  };

  const statuts = [
    ...Array(40).fill(StatutAnnonce.ACTIVE),
    ...Array(4).fill(StatutAnnonce.EN_PAUSE),
    ...Array(4).fill(StatutAnnonce.EXPIREE),
    ...Array(2).fill(StatutAnnonce.ARCHIVEE),
  ];

  for (let i = 1; i <= count; i++) {
    const ville = villes[i % villes.length];
    const quartiers = VILLES_QUARTIERS[ville];
    const quartier = quartiers[i % quartiers.length];
    const type = MOCK_TYPE_BIENS[(i - 1) % MOCK_TYPE_BIENS.length];
    const [pMin, pMax] = prixParType[type.nom] ?? [30000, 200000];
    const step = 5000;
    const prix = Math.round((pMin + Math.random() * (pMax - pMin)) / step) * step;

    const pubDaysAgo = Math.floor(Math.random() * 25);
    const pubDate = new Date(Date.now() - pubDaysAgo * 86400000);
    const expDate = new Date(pubDate.getTime() + 30 * 86400000);
    const statut = statuts[i - 1] ?? StatutAnnonce.ACTIVE;

    const loc = MOCK_LOCALISATIONS.find((l) => l.ville === ville && l.quartier === quartier);

    annonces.push({
      id: i,
      typeBien: type.nom,
      typeBienId: type.id,
      ville,
      quartier,
      prix,
      prixFormate: new Intl.NumberFormat('fr-CM').format(prix) + ' FCFA',
      statut,
      photoPrincipale: `https://picsum.photos/seed/${type.nom}${i}/800/500`,
      photoPrincipaleThumb: `https://picsum.photos/seed/${type.nom}${i}/400/250`,
      hasPhotos: i % 4 !== 0, // 75% ont des photos
      datePublication: pubDate.toISOString(),
      dateExpiration: expDate.toISOString(),
      nombreVues: Math.floor(Math.random() * 850) + 5,
      nombreCommentaires: Math.floor(Math.random() * 8),
      nombreContacts: Math.floor(Math.random() * 35),
      isFavori: false,
      description: getDescription(type.nom),
      proprietairePrenom: PRENOMS[i % PRENOMS.length],
      localisationId: loc?.id ?? i,
      photos:
        i % 4 !== 0
          ? Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
              id: i * 10 + j,
              url: `https://picsum.photos/seed/${type.nom}${i}${j}/800/500`,
              urlThumb: `https://picsum.photos/seed/${type.nom}${i}${j}/400/250`,
              ordre: j,
              principale: j === 0,
            }))
          : [],
      commentaires:
        i % 5 === 0
          ? [
              {
                id: i * 100,
                auteurPrenom: PRENOMS[(i + 1) % PRENOMS.length],
                contenu:
                  'Bonjour, est-ce que le bien est encore disponible ? Peut-on visiter ce week-end ?',
                dateCreation: new Date(Date.now() - 2 * 86400000).toISOString(),
                estProprietaire: false,
                estMien: false,
                reponse:
                  i % 10 === 0
                    ? {
                        id: i * 100 + 1,
                        contenu:
                          'Oui, toujours disponible ! Contactez-moi sur WhatsApp pour organiser une visite.',
                        dateCreation: new Date(Date.now() - 86400000).toISOString(),
                      }
                    : null,
              },
            ]
          : [],
    });
  }
  return annonces;
}

// ─── Utilisateurs mock ─────────────────────────────────────────────────────

export const MOCK_USER = {
  id: 1,
  prenom: 'Franck',
  nom: 'Tchinda',
  nomComplet: 'Franck Tchinda',
  email: 'franck@mbemnova.com',
  telephone: '+237691877527',
  ville: 'Douala',
  role: 'UTILISATEUR' as const,
  statut: 'ACTIF' as const,
  emailVerifie: true,
  dateInscription: '2026-01-15T10:00:00Z',
  nombreAnnoncesActives: 3,
  nombreFavoris: 7,
};

export const MOCK_ADMIN_USER = {
  ...MOCK_USER,
  id: 99,
  prenom: 'Admin',
  nom: 'ImmoCam',
  nomComplet: 'Admin ImmoCam',
  email: 'admin@immocam.cm',
  role: 'ADMINISTRATEUR' as const,
};

export const MOCK_AUTH_RESPONSE = {
  accessToken: 'mock_access_token_immocam_2026',
  refreshToken: 'mock_refresh_token_immocam_2026',
  tokenType: 'Bearer',
  expiresIn: 3600,
  utilisateur: MOCK_USER,
};

// Index
export { VILLES_QUARTIERS as MOCK_VILLES_QUARTIERS };
