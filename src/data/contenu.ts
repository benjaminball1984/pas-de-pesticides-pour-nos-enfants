/**
 * CONTENU ÉDITABLE DU SITE « Pas de pesticides pour nos enfants »
 * ----------------------------------------------------------------
 * Tout le texte affiché à l'écran se modifie ICI, sans toucher au code des pages.
 * Les valeurs marquées « À VALIDER » attendent une confirmation de Bio Consom'acteurs.
 */

/** Identité du site */
export const site = {
  org: "Bio Consom'acteurs",
  adresse: "10 rue Beaumarchais, 93100 Montreuil — France",
  domaine: "pasdepesticidespournosenfants.fr", // À VALIDER : domaine définitif
  annee: "2025",
  titreOnglet: "Pas de pesticides pour nos enfants — Pétition",
  description:
    "Pétition citoyenne pour des cantines sans pesticides, bio, locales et faites maison. Portée par Bio Consom'acteurs.",
  siteAssociation: "https://bioconsomacteurs.org",
};

/**
 * Compteurs (À VALIDER : chiffres réels vs démo, et remise à zéro au lancement).
 * Le pourcentage de l'objectif est calculé automatiquement à partir de ces nombres.
 */
export const compteur = {
  signataires: 0, // rempli EN DIRECT depuis Supabase une fois connecté
  distributions: 0,
  communes: 0, // = nombre de codes postaux distincts parmi les signatures (calculé en direct)
};

/**
 * Objectif « par paliers » (stretch goal).
 * Plutôt qu'un gros dénominateur décourageant (« 0 sur 20 000 »), on affiche le palier
 * juste au-dessus du nombre actuel de signatures. Dès que les signatures atteignent
 * `seuilPalier` (90 %) du palier courant, on passe automatiquement au palier suivant.
 * Liste 100 % éditable : ajoute, retire ou change les paliers librement.
 */
export const paliers = [1000, 1500, 2500, 5000, 7500, 10000, 15000, 20000, 35000, 50000, 75000, 100000];
export const seuilPalier = 0.9;

/** Renvoie l'objectif courant (le premier palier qu'on n'a pas encore atteint à 90 %). */
export function objectifDynamique(signataires: number): number {
  for (const p of paliers) if (signataires < seuilPalier * p) return p;
  return paliers[paliers.length - 1];
}

/** Pourcentage du palier courant (borné à 100). */
export function pourcentObjectif(signataires: number): number {
  const obj = objectifDynamique(signataires);
  return obj > 0 ? Math.min(100, Math.round((signataires / obj) * 100)) : 0;
}

/** Formatage français des nombres : 12 487 (espace insécable fine) */
export const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");

/** Navigation principale (header) */
export const nav = [
  { label: "L'appel", href: "/appel" },
  { label: "Nos demandes", href: "/#demandes" },
  { label: "Agir", href: "/#agir" },
  // { label: "Premier·ères signataires", href: "/#signataires" }, // retiré pour l'instant, à réafficher plus tard
  { label: "Qui sommes-nous", href: "/#bca" },
];

/** Section « Pourquoi maintenant » */
export const urgence = {
  eyebrow: "Pourquoi maintenant",
  titreHtml:
    "Chaque jour, des millions d'enfants <em>mangent à la cantine</em>. La science nous met en garde depuis des années.",
  corpsHtml: [
    "L'expertise collective de l'<strong>INSERM</strong> (2021) établit une <strong>présomption forte</strong> de lien entre l'exposition aux pesticides chez l'enfant et la survenue de cancers pédiatriques — leucémies, tumeurs du système nerveux central — ainsi que des troubles du développement neuropsychologique et moteur.",
    "Les enfants vont à la cantine très tôt, dès la maternelle. Sur ces tout-petits, dont les barrières physiologiques sont immatures, les pesticides agissent davantage. Ce qu'on met dans leur assiette compte le plus.",
  ],
  pull: "Les preuves sont là. Le doute n'est plus permis. Ce qu'il manque, c'est le courage politique.",
  // À VALIDER : exactitude des chiffres et des sources.
  stats: [
    { n: "01", big: "18", u: "%", only: "seulement", ttl: "des communes respectent les seuils EGalim de bio et de durable.", src: "AMF · 2024", alt: false },
    { n: "02", big: "13", u: ",1%", ttl: "de bio en moyenne dans les cantines — la loi en exige 20 %.", src: "Plateforme « ma cantine » · 2022", alt: true },
    { n: "03", big: "7", u: "ans", ttl: "depuis l'entrée en vigueur d'EGalim. Aucune sanction prévue par la loi.", src: "Loi du 30 oct. 2018", alt: false },
    { n: "04", big: "8", u: "/10", ttl: "Français·es estiment qu'il faudrait limiter le plus possible l'usage des pesticides dans l'agriculture.", src: "Ipsos · Réseau Action Climat · oct. 2025", alt: true },
  ],
};

/** Manifeste (extrait de l'appel mis en exergue) */
export const manifeste = {
  paragraphesHtml: [
    "Chaque jour, dans les écoles, les collèges et les lycées de notre pays, des millions d'enfants prennent un repas dont on sait qu'il les expose à des substances que la science accuse depuis des années. Et chaque jour, l'État et trop de collectivités regardent ailleurs.",
    `<span class="y">Cela suffit. Nos enfants ne sont pas une variable d'ajustement.</span>`,
    "Nos enfants ne méritent pas seulement «&nbsp;moins pire&nbsp;». Ils méritent le meilleur. Une cantine digne de ce nom, c'est une cantine bio, faite maison, avec des produits locaux et de saison — saine, équilibrée, et bonne. Parce qu'un repas se mange aussi avec plaisir.",
  ],
};

/** Les 8 demandes. variante: '' (clair) | 'hi' (vert foncé) | 'warm' (jaune) */
export const demandes = {
  eyebrow: "Nos demandes",
  titreHtml: `Aux élu·es, <span class="hand-pull">à toutes les échelles</span> — huit engagements, immédiats et chiffrés.`,
  intro:
    "À l'État, au Parlement, aux régions, départements et communes qui ont la responsabilité directe ou indirecte des cantines de nos enfants, nous demandons un engagement public, immédiat et chiffré sur les mesures suivantes.",
  liste: [
    { n: "01", verbe: "Respecter EGalim, vraiment", texte: "50 % de produits durables, 20 % de bio, dans toutes les cantines de la maternelle au lycée. Et publier une trajectoire vers 100 % bio.", variante: "" },
    { n: "02", verbe: "Cuisiner sur place", texte: "Revenir à des cuisines faites maison, avec des cuisinier·es formé·es et dignement rémunéré·es — plutôt que des grands groupes industriels.", variante: "hi" },
    { n: "03", verbe: "Acheter local et de saison", texte: "Achat direct auprès des paysannes et paysans bio du territoire, à des prix qui couvrent les coûts de production.", variante: "" },
    { n: "04", verbe: "Alternative végétarienne quotidienne", texte: "Une alternative végétarienne chaque jour, et réduction des produits carnés — pour la santé des enfants et l'environnement.", variante: "warm" },
    { n: "05", verbe: "Bannir le plastique", texte: "Réduire les déchets, le gaspillage, et bannir les contenants plastiques de cuisson, de réchauffe et de service.", variante: "" },
    { n: "06", verbe: "Gratuité progressive", texte: "Garantir progressivement la gratuité de la cantine, en commençant par les familles aux revenus les plus modestes.", variante: "hi" },
    { n: "07", verbe: "Zéro pesticide autour des écoles", texte: "Interdire les pesticides de synthèse dans tous les espaces publics, en particulier autour des crèches, écoles et lieux d'enfants.", variante: "" },
    { n: "08", verbe: "Sanctionner les non-respects", texte: "Renforcer EGalim avec des sanctions effectives, et donner aux collectivités les moyens financiers et humains nécessaires.", variante: "warm" },
  ],
};

/** Section « 3 actions pour aller plus loin » */
export const actions = {
  eyebrow: "3 actions pour aller plus loin",
  titreHtml: "Maintenant que vous avez signé,<br>passons à l'action concrète.",
  sous: "Une pétition ne fait gagner aucune cantine. Ce qui fait gagner, c'est le matériel diffusé, les distributions tenues devant les écoles, et les rendez-vous obtenus avec les élu·es.",
  cartes: [
    {
      featured: true,
      step: "Action · à recevoir chez vous",
      titre: "Commander du matériel",
      texteHtml: "Recevoir gratuitement chez soi des affiches et pétitions papier pour passer le mot autour de soi, dans votre école, votre quartier, votre commune.",
      points: ["2 formats au choix&nbsp;: <strong>A5</strong> (flyer) ou <strong>A3</strong> (affiche)", "Gratuit, frais de port au coût", "Livraison 5–7 jours ouvrés"],
      illStyle: "background:rgba(143,190,61,.15)",
      footSmall: "Gratuit · expédié depuis Montreuil (93)",
      cta: { label: "Je commande →", href: "/commander", classe: "btn-primary" },
    },
    {
      featured: false,
      step: "Action · sur le terrain",
      titre: "Organiser une distribution",
      texteHtml: "Tenir une table de signatures devant une école, un marché, une mairie — et apparaître sur la carte publique pour rejoindre d'autres mobilisé·es.",
      points: ["Carte interactive (uMap) des distributions à venir", "Fiche pratique « Comment réussir sa distribution »", "Rappels J-1 et J-0 par email"],
      illStyle: "",
      footSmall: "0 distribution enregistrée",
      cta: { label: "Je m'organise →", href: "/distribution", classe: "btn-orange" },
    },
    {
      featured: false,
      step: "Action · au cœur du débat",
      titre: "Organiser une rencontre entre citoyen·nes et élu·es",
      texteHtml: "Provoquer un échange direct avec un·e maire, un·e député·e, un·e conseiller·e départemental·e — et porter les demandes de la pétition là où elles seront entendues.",
      points: ["Modèle de courrier à adresser à votre élu·e", "Argumentaire prêt à l'emploi (chiffres + sources)", "Soutien BCA pour préparer la rencontre"],
      illStyle: "background:rgba(242,197,61,.18)",
      footSmall: "Modèles + accompagnement BCA",
      cta: { label: "Je sollicite →", href: "/rencontre", classe: "btn-dark" },
    },
  ],
};

/** Bloc signature (textes ; le formulaire lui-même est dans le composant Formulaire) */
export const signature = {
  eyebrow: "Signer maintenant",
  titreHtml: `Ajoutez votre <span class="y">signature</span> au texte de la pétition.`,
  slogan: "Une petite signature pour vous, <br>un grand pas pour leur santé.",
  garanties: [
    "Pétition adressée au gouvernement, aux député·es, aux maires, aux conseils départementaux et régionaux.",
    "Données hébergées en Europe. Aucun cookie traceur, aucun partage tiers.",
    "Présomption forte INSERM · loi EGalim · étude PestiRiv 2025.",
  ],
};

/** Premier·ères signataires — À VALIDER : consentement écrit de chaque personne nommée. */
export const signataires = {
  eyebrow: "Premier·ères signataires",
  titreHtml: `Scientifiques, médecins, paysan·nes et élu·es <em style="font-style:italic;color:var(--orange)">ont déjà signé</em>.`,
  intro:
    "Des voix qui font autorité sur la santé environnementale, l'agronomie, l'alimentation des enfants et la transformation des cantines. Cette liste s'étoffe chaque semaine.",
  personnes: [
    { initiales: "MD", av: "", nom: "Marc Dufumier", role: "Ingénieur agronome, professeur émérite AgroParisTech", tag: "— Sciences" },
    { initiales: "CS", av: "s2", nom: "Pr. Charles Sultan", role: "Endocrinologue pédiatre, expert santé-environnement", tag: "— Médical" },
    { initiales: "JC", av: "s3", nom: "Jacques Caplat", role: "Agronome, essayiste — Agir pour l'Environnement", tag: "— Sciences" },
    { initiales: "CÉ", av: "s4", nom: "Camille Étienne", role: "Activiste, autrice — « Pour un soulèvement écologique »", tag: "— Société civile" },
    { initiales: "SA", av: "s2", nom: "Stéphane Arnoux", role: "Paysan-boulanger bio, Confédération paysanne", tag: "— Paysan·nes" },
    { initiales: "LM", av: "", nom: "Lætitia Mbella", role: "Cheffe de cuisine collective, Mouans-Sartoux", tag: "— Cantines" },
    { initiales: "FV", av: "s3", nom: "Dr. Florence Veber", role: "Pédiatre, autrice « L'enfance polluée »", tag: "— Médical" },
    { initiales: "PR", av: "s4", nom: "Pierre Rabhi (in memoriam)", role: "Agroécologue — Soutien historique BCA", tag: "— Hommage" },
  ],
  orgsTitreHtml: `Soutiens associatifs — <em>plus de 30 organisations</em>`,
  orgs: ["Générations Futures", "Agir pour l'Environnement", "Confédération paysanne", "FNAB", "UFC-Que Choisir", "Greenpeace France", "Slow Food France"],
};

/** Section « Qui sommes-nous » (BCA) */
export const apropos = {
  eyebrow: "Qui porte cette pétition",
  titre: "Bio Consom'acteurs — depuis 2003, l'association des mangeur·euses bio engagé·es.",
  parasHtml: [
    "Bio Consom'acteurs fédère un réseau d'antennes locales partout en France pour défendre une bio paysanne, sociale et solidaire. L'association édite la revue <strong>Bio Conso</strong>, organise des conférences, des opérations de mobilisation et accompagne les collectivités dans la transition de leur restauration collective.",
    "Cette pétition s'inscrit dans la continuité de <strong>l'Appel de Lorient</strong> (2024), porté par BCA et 220+ organisations, en faveur d'une politique publique cohérente pour la bio.",
  ],
  mini: [
    { big: "30", lbl: "antennes locales sur le territoire" },
    { big: "2 000", lbl: "adhérent·es engagé·es" },
    { big: "8 765", lbl: "personnes touchées en 2025" },
    { bigHtml: `220<span style="color:var(--orange)">+</span>`, lbl: "organisations alliées (Appel de Lorient)" },
  ],
};

/** Pied de page. Les liens en « # » sont à câbler (page à créer ou à masquer). */
export const footer = {
  colonnes: [
    { titre: "La campagne", liens: [ { label: "Le manifeste", href: "/#manifeste" }, { label: "Nos demandes", href: "/#demandes" }, { label: "Signer", href: "/#signer" }, { label: "Agir", href: "/#agir" } ] },
    { titre: "Agir", liens: [ { label: "Commander du matériel", href: "/commander" }, { label: "Organiser une distribution", href: "/distribution" }, { label: "Organiser une rencontre", href: "/rencontre" } ] },
    { titre: "Bio Consom'acteurs", liens: [ { label: "Site de l'association ↗", href: "https://bioconsomacteurs.org", externe: true }, { label: "Nous contacter", href: "mailto:contact@bioconsomacteurs.org" }, { label: "Adhérer ↗", href: "https://bioconsomacteurs.org", externe: true }, { label: "Faire un don ↗", href: "https://bioconsomacteurs.org", externe: true } ] },
  ],
  legal: [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Politique de confidentialité", href: "/confidentialite" },
    { label: "RGPD", href: "/rgpd" },
  ],
};
