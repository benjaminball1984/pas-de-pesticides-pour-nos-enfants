# Visuels Canva de la campagne

Dossier Canva : https://www.canva.com/folder/FAHX98oaATQ (« Pas de pesticides pour nos enfants · visuels »).
Les anciennes versions (12 designs) sont dans la corbeille Canva depuis le 14/10/2026. Le sous-dossier « Anciennes versions » est vide : Canva supprime un dossier définitivement, il est laissé à Ben.

Fabrication : `node scripts/visuels/visuels.mjs` écrit les PNG, PDF et sources d'import dans `public/`,
puis déploiement, puis `import-design-from-url` sur `https://pasdepesticidespournosenfants.net/modeles/<nom>`
(sans `.html`, qui répond 307).

## Lien « Modifier sur Canva » de la page /visuels

Les 18 liens de modèle (canva.link) sont posés dans le champ `canva` de `src/data/visuels.json` (14/10/2026).
Ils ont été créés dans l'éditeur Canva : Partager → Lien de modèle → Créer un lien de modèle. Pour un nouveau visuel,
refaire ce geste puis coller le lien dans `canva` ; `visuels.mjs` garde les liens existants quand il régénère la liste.

| Visuel | Design Canva |
|---|---|
| appel-titre | DAHX9zg8z3I — https://www.canva.com/d/RJTSp45NAQYeqHh |
| appel-cela-suffit (« Ça suffit ») | DAHX-Qcq0IQ — https://www.canva.com/d/2vwiAGDuovZG9RP |
| appel-preuves | DAHX-WIWDyE — https://www.canva.com/d/FKLT4Tj5NY9RYAs |
| appel-egalim | DAHX906sKw8 — https://www.canva.com/d/rlfIDh43uLIvhm0 |
| appel-ferme | DAHX9_89Hi0 — https://www.canva.com/d/GiWutm5kiPhM9Vi |
| demande-01 | DAHX9_p41SA — https://www.canva.com/d/CBqY2uNlwtLpTVD |
| demande-02 | DAHX96yKuRw — https://www.canva.com/d/c43176sU9yscE8E |
| demande-03 | DAHX9x8EQlw — https://www.canva.com/d/7mnfSz2y_y3yeuz |
| demande-04 | DAHX9_Q9teY — https://www.canva.com/d/XMCTWFX0gEFbNe8 |
| demande-05 | DAHX9wQOKx0 — https://www.canva.com/d/uQ3whWB7cMcHgjo |
| demande-06 | DAHX9yNPMF4 — https://www.canva.com/d/WFvBPelBSE6b_4p |
| demande-07 | DAHX9_xskQs — https://www.canva.com/d/SDhwdH8-pVGypvy |
| demande-08 | DAHX91TW2xk — https://www.canva.com/d/j9o0QKlCBhhjcjg |
| demande-09 | DAHX-RNMZAc — https://www.canva.com/d/HSybNKA4GzhYRx_ |
| chiffre-7-pourcent | DAHX9wEfu8U — https://www.canva.com/d/dSR7CbtH7u2h3Uc |
| chiffre-18-pourcent | DAHX94e3kxE — https://www.canva.com/d/QNQvOdPJG-Qf4it |
| chiffre-1-7-million | DAHX93_QcMI — https://www.canva.com/d/LfkednDMcV7nSJP |
| chiffre-78-pourcent | DAHX97p2MRw — https://www.canva.com/d/2Hvm1uYqGSeMcRr |
