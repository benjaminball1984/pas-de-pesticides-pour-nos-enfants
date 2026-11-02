/**
 * Kit à imprimer chez soi (page /kit), dans la direction artistique typographique de novembre 2026.
 *
 *   node scripts/kit/kit.mjs
 *
 * Produit dans public/kit/ :
 *   flyers-couleur.pdf, flyers-noir-et-blanc.pdf   A4 paysage, deux flyers A5 à couper au milieu
 *   affiche-couleur.pdf, affiche-noir-et-blanc.pdf A4 portrait (s'agrandit en A3 à l'impression)
 *   flyers-apercu.png, affiche-apercu.png          vignettes de la page /kit
 *   qr-petition.png                                QR code vers le formulaire de signature
 *   partage.png                                    image de partage des réseaux (1200 × 630)
 *
 * Rendu par Chrome ou Edge sans fenêtre, polices embarquées. Le QR code est relu après coup (jsQR
 * de 26septembre si présent) : on ne livre jamais un QR non vérifié.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import QRCode from "qrcode";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SORTIE = join(RACINE, "public", "kit");
const TEMPO = join(RACINE, ".kit-tmp");
const CIBLE = "https://pasdepesticidespournosenfants.net/#signer";
const ADRESSE = "pasdepesticidespournosenfants.net";
for (const d of [SORTIE, TEMPO]) mkdirSync(d, { recursive: true });

const NAVIGATEUR = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].find((c) => existsSync(c));
if (!NAVIGATEUR) throw new Error("Chrome ou Edge introuvable");

const FS = join(RACINE, "node_modules", "@fontsource");
const police = (dossier, fichier, fam, w) =>
  `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(join(FS, dossier, "files", fichier)).toString("base64")}) format('woff2')}`;
const POLICES = [
  police("antonio", "antonio-latin-500-normal.woff2", "Antonio", 500),
  police("antonio", "antonio-latin-700-normal.woff2", "Antonio", 700),
  police("pt-sans", "pt-sans-latin-400-normal.woff2", "PT Sans", 400),
  police("pt-sans", "pt-sans-latin-700-normal.woff2", "PT Sans", 700),
].join("\n");

/* QR code : noir sur blanc dans les deux versions (le plus lisible par tous les téléphones). */
const qrSvg = await QRCode.toString(CIBLE, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#141414", light: "#FFFFFF" } });
const QR = "data:image/svg+xml;base64," + Buffer.from(qrSvg).toString("base64");
await QRCode.toFile(join(SORTIE, "qr-petition.png"), CIBLE, { errorCorrectionLevel: "M", margin: 2, width: 1000, color: { dark: "#141414", light: "#FFFFFF" } });

/* Couleurs : la charte de la campagne, ou du noir sur blanc pour imprimer sans encre de couleur. */
const THEMES = {
  couleur: { fond: "#FFF8EC", texte: "#141414", bandeau: "#E4362B", titre: "#FFF8EC", titre2: "#141414", chiffre: "#1E8A3E", trait: "#E4362B", cri: "#E4362B" },
  nb: { fond: "#FFFFFF", texte: "#141414", bandeau: "#FFFFFF", titre: "#141414", titre2: "#141414", chiffre: "#141414", trait: "#141414", cri: "#141414" },
};

const css = (t) => `${POLICES}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:${t.fond};color:${t.texte};font-family:'PT Sans',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.doc{display:flex;flex-direction:column;background:${t.fond};overflow:hidden}
.bandeau{background:${t.bandeau};color:${t.titre};font-family:'Antonio';font-weight:700;text-transform:uppercase;line-height:.92;${t.bandeau === "#FFFFFF" ? `border-bottom:2.2mm solid ${t.texte};` : ""}}
.bandeau .l1{display:block;color:${t.titre}}
.bandeau .l2{display:block;color:${t.titre2}}
.slogan{font-family:'Antonio';font-weight:500;text-transform:uppercase;letter-spacing:.03em;line-height:1.12}
.corps{display:flex;flex-direction:column}
.chiffres{display:grid;grid-template-columns:1fr 1fr;border-top:.8mm solid ${t.texte}}
.chiffres div+div{border-left:.3mm solid ${t.texte}33}
.chiffres b{display:block;font-family:'Antonio';font-weight:700;color:${t.chiffre};line-height:1}
.chiffres span{display:block;line-height:1.25}
.chiffres i{display:block;font-style:normal;font-family:'Antonio';text-transform:uppercase;letter-spacing:.08em;opacity:.7}
.cri{font-family:'Antonio';font-weight:700;text-transform:uppercase;line-height:1;color:${t.cri}}
.pied{margin-top:auto!important;display:flex;align-items:center;border-top:1.4mm solid ${t.trait}}
.pied img{display:block;background:#fff}
.signez{font-family:'Antonio';font-weight:700;text-transform:uppercase;line-height:.95}
.url{font-weight:700}
.bca{font-family:'Antonio';text-transform:uppercase;letter-spacing:.1em;opacity:.75}`;

/** Un flyer A5 portrait (148 × 210 mm). */
const flyer = () => `<section class="doc" style="width:148mm;height:210mm">
  <div class="bandeau" style="padding:9mm 9mm 7mm;font-size:17mm"><span class="l1">Pas de pesticides</span><span class="l2">pour nos enfants&nbsp;!</span>
    <p class="slogan" style="font-size:4.8mm;margin-top:4mm">Une petite signature pour vous,<br>un grand pas pour leur santé.</p></div>
  <div class="corps" style="padding:6mm 9mm 5mm;gap:5mm">
    <p style="font-size:4.1mm;line-height:1.38">Nos enfants sont exposés chaque jour aux pesticides&nbsp;: dans leur assiette, à la cantine, aux abords des écoles et de leurs lieux de jeux. Nous demandons aux élu·es, à toutes les échelles, un engagement clair, immédiat et chiffré.</p>
    <div class="chiffres">
      <div style="padding:4mm 4mm 0 0"><b style="font-size:11mm">&lt;&nbsp;7&nbsp;%</b><span style="font-size:3.5mm;margin-top:1.5mm">de bio dans les achats de la restauration collective, quand la loi en exige 20&nbsp;%.</span><i style="font-size:2.6mm;margin-top:1.5mm">Agence Bio</i></div>
      <div style="padding:4mm 0 0 4mm"><b style="font-size:11mm">1,7&nbsp;million</b><span style="font-size:3.5mm;margin-top:1.5mm">d'écoliers vont en classe sous forte pression pesticides.</span><i style="font-size:2.6mm;margin-top:1.5mm">Le Monde · déc. 2025</i></div>
    </div>
    <p class="cri" style="font-size:8.4mm">Ça suffit. Nos enfants ne doivent pas payer leurs profits de leur vie.</p>
  </div>
  <div class="pied" style="margin:0 9mm 8mm;padding-top:4mm;gap:6mm">
    <img src="${QR}" style="width:28mm;height:28mm">
    <div style="display:grid;gap:2mm"><p class="signez" style="font-size:9mm">Signez<br>la pétition</p><p class="url" style="font-size:3.4mm">${ADRESSE}</p><p class="bca" style="font-size:2.8mm">Une pétition de Bio Consom'acteurs</p></div>
  </div>
</section>`;

/** L'affiche A4 portrait (210 × 297 mm). */
const affiche = () => `<section class="doc" style="width:210mm;height:297mm">
  <div class="bandeau" style="padding:13mm 14mm 10mm;font-size:26mm"><span class="l1">Pas de pesticides</span><span class="l2">pour nos enfants&nbsp;!</span>
    <p class="slogan" style="font-size:7.4mm;margin-top:6mm">Une petite signature pour vous,<br>un grand pas pour leur santé.</p></div>
  <div class="corps" style="padding:8mm 14mm 6mm;gap:7mm">
    <p style="font-size:6mm;line-height:1.36">Nos enfants sont exposés chaque jour aux pesticides&nbsp;: dans leur assiette, à la cantine, aux abords des écoles et de leurs lieux de jeux.</p>
    <div class="chiffres">
      <div style="padding:6mm 6mm 0 0"><b style="font-size:17mm">&lt;&nbsp;7&nbsp;%</b><span style="font-size:4.6mm;margin-top:2mm">de bio dans les achats de la restauration collective, quand la loi en exige 20&nbsp;%.</span><i style="font-size:3.2mm;margin-top:2mm">Agence Bio</i></div>
      <div style="padding:6mm 0 0 6mm"><b style="font-size:17mm">1,7&nbsp;million</b><span style="font-size:4.6mm;margin-top:2mm">d'écoliers vont en classe sous forte pression pesticides.</span><i style="font-size:3.2mm;margin-top:2mm">Le Monde · déc. 2025</i></div>
    </div>
    <p class="cri" style="font-size:10mm">Ça suffit. Nos enfants ne doivent pas payer leurs profits de leur vie.</p>
  </div>
  <div class="pied" style="margin:0 14mm 12mm;padding-top:7mm;gap:10mm">
    <img src="${QR}" style="width:44mm;height:44mm">
    <div style="display:grid;gap:3mm"><p class="signez" style="font-size:15mm">Signez<br>la pétition</p><p class="url" style="font-size:5mm">${ADRESSE}</p><p class="bca" style="font-size:3.8mm">Une pétition de Bio Consom'acteurs</p></div>
  </div>
</section>`;

/** Deux flyers sur une feuille A4 paysage, avec un trait de coupe au milieu. */
const feuilleFlyers = () => `<div style="display:flex;width:297mm;height:210mm;position:relative">${flyer()}<div style="width:1mm"></div>${flyer()}
  <div style="position:absolute;left:148.5mm;top:0;bottom:0;border-left:.3mm dashed #999"></div></div>`;

const page = (t, taille, corps) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${css(t)}
@page{size:${taille};margin:0}</style></head><body>${corps}</body></html>`;

function rendre(nom, html, { pdf, png }) {
  const src = join(TEMPO, nom + ".html");
  writeFileSync(src, html);
  const url = pathToFileURL(src).href;
  const base = ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--virtual-time-budget=4000", `--user-data-dir=${join(TEMPO, "profil")}`];
  if (pdf) execFileSync(NAVIGATEUR, [...base, "--no-pdf-header-footer", `--print-to-pdf=${pdf}`, url], { stdio: "ignore" });
  if (png) execFileSync(NAVIGATEUR, [...base, `--window-size=${png.l},${png.h}`, `--force-device-scale-factor=${png.echelle ?? 1}`, `--screenshot=${png.fichier}`, url], { stdio: "ignore" });
}

for (const [cle, suffixe] of [["couleur", "couleur"], ["nb", "noir-et-blanc"]]) {
  const t = THEMES[cle];
  rendre(`flyers-${cle}`, page(t, "297mm 210mm", feuilleFlyers()), { pdf: join(SORTIE, `flyers-${suffixe}.pdf`) });
  rendre(`affiche-${cle}`, page(t, "210mm 297mm", affiche()), { pdf: join(SORTIE, `affiche-${suffixe}.pdf`) });
}

/* Vignettes de la page /kit : 360 px de large, mise à l'échelle par zoom CSS (1 mm ≈ 3,78 px). */
const vignette = (largeurMm, corps) => `<!doctype html><html><head><meta charset="utf-8"><style>${css(THEMES.couleur)}
body{zoom:${(360 / (largeurMm * 3.7795)).toFixed(4)}}</style></head><body>${corps}</body></html>`;
rendre("flyers-apercu", vignette(148, flyer()), { png: { fichier: join(SORTIE, "flyers-apercu.png"), l: 360, h: 511, echelle: 2 } });
rendre("affiche-apercu", vignette(210, affiche()), { png: { fichier: join(SORTIE, "affiche-apercu.png"), l: 360, h: 509, echelle: 2 } });

/* Image de partage des réseaux, 1200 × 630. */
const t = THEMES.couleur;
rendre("partage", `<!doctype html><html><head><meta charset="utf-8"><style>${css(t)}
body{width:1200px;height:630px;background:${t.bandeau};color:${t.titre};display:flex;flex-direction:column;justify-content:center;padding:0 70px}
h1{font-family:'Antonio';font-weight:700;text-transform:uppercase;font-size:140px;line-height:.94}
h1 span{display:block;color:#141414}
p{font-family:'Antonio';font-weight:500;text-transform:uppercase;letter-spacing:.04em;font-size:40px;margin-top:34px;color:#FFF8EC}
small{display:block;font-family:'Antonio';text-transform:uppercase;letter-spacing:.12em;font-size:24px;margin-top:22px;color:#141414}</style></head>
<body><h1>Pas de pesticides <span>pour nos enfants&nbsp;!</span></h1><p>Une petite signature pour vous, un grand pas pour leur santé.</p><small>Une pétition de Bio Consom'acteurs</small></body></html>`,
  { png: { fichier: join(SORTIE, "partage.png"), l: 1200, h: 630 } });

/* Vérification du QR code produit, relu depuis le PNG final. */
const JSQR = ["jsqr", join(RACINE, "..", "26septembre", "node_modules", "jsqr", "dist", "jsQR.js")];
let relu = null;
for (const m of JSQR) {
  try {
    const jsQR = (await import(m.endsWith(".js") ? pathToFileURL(m).href : m)).default;
    const { PNG } = await import(pathToFileURL(join(RACINE, "..", "26septembre", "node_modules", "pngjs", "lib", "png.js")).href).catch(() => ({}));
    if (!PNG) break;
    const img = PNG.sync.read(readFileSync(join(SORTIE, "qr-petition.png")));
    relu = jsQR(new Uint8ClampedArray(img.data), img.width, img.height)?.data ?? null;
    break;
  } catch { /* essai suivant */ }
}
if (relu === null) console.warn("QR code non relu (jsQR ou pngjs introuvable) : le vérifier à la main.");
else if (relu !== CIBLE) throw new Error(`QR code faux : il mène à ${relu}`);
else console.log(`QR code vérifié : ${relu}`);

rmSync(TEMPO, { recursive: true, force: true });
console.log("Kit produit dans public/kit/");
