/**
 * Actualités : environ 60 % d'articles de Bio Consom'acteurs, 40 % de ses alliés (règle de l'équipe, 15/10/2026).
 * Les plus récentes en premier. `une` : affichée sur l'accueil (EGalim et le 14 novembre y restent, comme
 * actualités de BCA, plutôt qu'en blocs séparés).
 */
export interface Actu {
  date: string;
  titre: string;
  source: string;
  url: string;
  bca?: boolean;
  une?: boolean;
}

export const actus: Actu[] = [
  { date: '13 octobre 2026', source: 'Générations Futures', titre: 'Omnibus Pesticides : les 9, 10 et 11 octobre, Générations Futures mobilisée dans toute la France', url: 'https://www.generations-futures.fr/actualites/omnibus-pesticides-les-9-10-et-11-octobre-generations-futures-mobilisee-dans-toute-la-france/' },
  { date: '8 octobre 2026', source: "Bio Consom'acteurs", bca: true, une: true, titre: 'Loi Omnibus : bulldozer sur la nature', url: 'https://bioconsomacteurs.org/articles/les-bio-consomactions/loi-omnibus-bulldozer-sur-la-nature/' },
  { date: '8 octobre 2026', source: "Bio Consom'acteurs", bca: true, titre: 'Retour sur « Stop pesticides »', url: 'https://bioconsomacteurs.org/articles/les-bio-consomactions/retour-sur-stop-pesticides/' },
  { date: '7 octobre 2026', source: "Bio Consom'acteurs", bca: true, une: true, titre: 'Le 14 novembre, donnons la parole aux enfants', url: 'https://bioconsomacteurs.org/articles/les-bio-consomactions/le-14-novembre-donnons-la-parole-aux-enfants/' },
  { date: '5 octobre 2026', source: 'Basta!', titre: '« Stop aux pesticides » : les images de la manifestation contre Syngenta et les « ravages de l’agrochimie »', url: 'https://basta.media/Reportage-stop-pesticides-images-manifestation-contre-syngenta-ravages-agrochimie-Cancer-Colere' },
  { date: '23 septembre 2026', source: "Bio Consom'acteurs", bca: true, titre: 'Journée européenne du Bio 2026 : pour plus de bio dans nos cantines', url: 'https://bioconsomacteurs.org/articles/societe/journee-europeenne-du-bio-2026-pour-plus-de-bio-dans-nos-cantines/' },
  { date: '17 septembre 2026', source: "Bio Consom'acteurs", bca: true, une: true, titre: "Loi EGalim : avec quatre associations, Bio Consom'acteurs demande à l'État de respecter ses propres objectifs dans ses cantines", url: 'https://bioconsomacteurs.org/articles/on-parle-de-nous/bio-dans-les-cantines/' },
  { date: '8 septembre 2026', source: "Bio Consom'acteurs", bca: true, titre: 'Stop aux idées reçues : « La bio, ce n’est pas meilleur pour la santé »', url: 'https://bioconsomacteurs.org/articles/societe/stop-aux-idees-recues-la-bio-ce-nest-pas-meilleur-pour-la-sante/' },
  { date: '20 juillet 2026', source: "Bio Consom'acteurs", bca: true, titre: "Lettre aux député·es avant le vote de la loi d'urgence agricole", url: 'https://bioconsomacteurs.org/articles/bcactus/lettre-aux-depute%c2%b7es/' },
  { date: '22 janvier 2026', source: 'Agir pour l’Environnement', titre: 'Découvrez le tout premier palmarès des cantines bio des villes-préfectures', url: 'https://www.agirpourlenvironnement.org/publications/palmares-des-cantines-bio/' },
  { date: '18 décembre 2025', source: 'Reporterre', titre: 'Votre école est-elle exposée aux pesticides ? Consultez cette carte du « Monde »', url: 'https://reporterre.net/Votre-ecole-est-elle-exposee-aux-pesticides-Consultez-cette-carte-du-Monde' },
];
