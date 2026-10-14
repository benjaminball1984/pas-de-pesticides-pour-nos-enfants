/**
 * Visuels typographiques de la campagne (4:5, 1080 × 1350).
 *
 *   node scripts/visuels/visuels.mjs
 *
 * Pour chaque visuel :
 *   public/visuels/<nom>.png        PNG 2160 × 2700 (réseaux, impression)
 *   public/visuels/<nom>-mini.png   vignette 540 × 675 (page /visuels)
 *   public/visuels/<nom>.pdf        PDF vectoriel
 *   public/modeles/<nom>.html       source d'import Canva : chaque ligne posée en position absolue,
 *                                   chaque aplat en forme séparée (méthode reprise de 26septembre,
 *                                   scripts/novembre/canva-html.mjs). Canva l'importe depuis
 *                                   https://pasdepesticidespournosenfants.net/modeles/<nom> (sans .html).
 *   src/data/visuels.json           la liste lue par la page /visuels (les liens Canva y sont gardés).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SITE = "https://pasdepesticidespournosenfants.net";
const PUB = join(RACINE, "public");
const TEMPO = join(RACINE, ".visuels-tmp");
const L = 1080, H = 1350;
for (const d of [join(PUB, "visuels"), join(PUB, "modeles", "polices"), TEMPO]) mkdirSync(d, { recursive: true });

const NAVIGATEUR = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].find((c) => existsSync(c));
if (!NAVIGATEUR) throw new Error("Chrome ou Edge introuvable");

/* Polices : embarquées pour le rendu, publiées pour Canva. */
const FS = join(RACINE, "node_modules", "@fontsource");
const POLICES = {
  "caveat-brush-latin-400-normal.woff2": ["Caveat Brush", 400, "normal"],
  "antonio-latin-500-normal.woff2": ["Antonio", 500, "normal"],
  "antonio-latin-700-normal.woff2": ["Antonio", 700, "normal"],
  "pt-sans-latin-400-normal.woff2": ["PT Sans", 400, "normal"],
  "pt-sans-latin-700-normal.woff2": ["PT Sans", 700, "normal"],
  "pt-sans-latin-400-italic.woff2": ["PT Sans", 400, "italic"],
};
const dossierPolice = (f) => join(FS, f.startsWith("caveat") ? "caveat-brush" : f.startsWith("antonio") ? "antonio" : "pt-sans", "files", f);
let ffEmbarque = "", ffPublie = "";
for (const [f, [fam, w, st]] of Object.entries(POLICES)) {
  const b64 = readFileSync(dossierPolice(f)).toString("base64");
  ffEmbarque += `@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};src:url(data:font/woff2;base64,${b64}) format('woff2')}\n`;
  copyFileSync(dossierPolice(f), join(PUB, "modeles", "polices", f));
  ffPublie += `@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};src:url(${SITE}/modeles/polices/${f}) format('woff2')}\n`;
}
const LOGO = "data:image/jpeg;base64," + readFileSync(join(PUB, "images", "logo-bca.jpg")).toString("base64");

/* Charte Bio Consom'acteurs 2024 */
const C = { vert: "#004D40", vertNuit: "#00352C", tilleul: "#B0C27D", jaune: "#FFCC45", corail: "#EB734D", ciel: "#9EBFCC", creme: "#FAF7F0" };
const THEMES = {
  vert: { fond: C.vert, texte: C.creme, accent: C.jaune, doux: C.tilleul, pied: C.creme },
  jaune: { fond: C.jaune, texte: C.vertNuit, accent: C.vert, doux: C.vertNuit, pied: C.vertNuit },
  creme: { fond: C.creme, texte: C.vertNuit, accent: C.corail, doux: C.vert, pied: C.vertNuit },
};

/* Les visuels. `fit` : hauteur maximale du bloc principal, la taille de police descend jusqu'à tenir. */
const VISUELS = [
  { nom: "appel-titre", famille: "L'appel", titre: "Pas de pesticides pour nos enfants !", theme: "vert", sur: "Pétition",
    corps: `<h1 class="brush" style="font-size:150px">Pas de pesticides <span class="acc">pour nos enfants&nbsp;!</span></h1>
            <p class="sous" style="font-size:46px">Une petite signature pour vous, un grand pas pour leur santé.</p>` },
  { nom: "appel-cela-suffit", famille: "L'appel", titre: "Cela suffit.", theme: "vert", sur: "L'appel",
    corps: `<h1 class="brush" style="font-size:190px"><span class="acc">Cela suffit.</span></h1>
            <p class="brush" style="font-size:104px">Nos enfants ne sont pas une variable d'ajustement.</p>` },
  { nom: "appel-preuves", famille: "L'appel", titre: "Les preuves sont là.", theme: "vert", sur: "Ce que dit la science",
    corps: `<h1 class="brush" style="font-size:112px">Les preuves sont là. Le doute n'est plus permis. <span class="acc">Ce qu'il manque, c'est le courage politique.</span></h1>` },
  { nom: "appel-egalim", famille: "L'appel", titre: "Que l'État respecte la loi", theme: "creme", sur: "Loi EGalim",
    corps: `<h1 class="brush" style="font-size:118px">Nous demandons simplement que l'État respecte <span class="acc">la loi qu'il a adoptée.</span></h1>
            <p class="sous" style="font-size:36px">Demande préalable du 17 septembre 2026&nbsp;: Bio&nbsp;Consom'acteurs, Notre Affaire à Tous, Générations Futures, Agir pour l'Environnement et le Collectif Les Pieds dans le Plat.</p>` },
  { nom: "appel-ferme", famille: "L'appel", titre: "Derrière chaque cantine, il y a une ferme.", theme: "jaune", sur: "Cantines bio",
    corps: `<h1 class="brush" style="font-size:170px">Derrière chaque cantine, <span class="acc">il y a une ferme.</span></h1>` },
];
const DEMANDES = [
  ["Respecter EGalim, tout de suite", "50 % de produits durables et de qualité dont 20 % de bio dans toutes les cantines, et une trajectoire vers 100 % bio."],
  ["Cuisiner sur place", "Des cuisines faites maison, avec des cuisinier·es formé·es et dignement rémunéré·es."],
  ["Acheter local et de saison", "L'achat direct aux paysannes et paysans bio du territoire, à des prix qui couvrent les coûts de production."],
  ["Une alternative végétarienne chaque jour", "Et moins de produits carnés, pour la santé des enfants et pour l'environnement."],
  ["Bannir le plastique", "Réduire les déchets et le gaspillage, et bannir les contenants plastiques de cuisson, de réchauffe et de service."],
  ["Vers la gratuité", "Une cantine gratuite pour toutes les familles, en commençant par les plus modestes."],
  ["Zéro pesticide autour des écoles", "Interdire l'usage des pesticides dans tous les espaces publics, en particulier autour des crèches et des écoles."],
  ["Des sanctions et des moyens", "Renforcer EGalim avec des sanctions effectives, et donner aux collectivités les moyens de l'appliquer."],
  ["Rejeter la loi Omnibus", "Elle supprimerait les réévaluations des pesticides : un énième laisser-passer aux entreprises agrochimiques."],
];
DEMANDES.forEach(([verbe, texte], i) => {
  const n = String(i + 1).padStart(2, "0");
  VISUELS.push({ nom: `demande-${n}`, famille: "Nos demandes", titre: `${n}. ${verbe}`, theme: "vert",
    sur: i === 8 ? "Nos demandes · aux eurodéputé·es" : "Nos demandes",
    corps: `<div class="num"><p class="n1">${n}</p><p class="n2">/09</p></div>
            <h1 class="brush" style="font-size:132px"><span class="acc">${verbe}</span></h1>
            <p class="sous" style="font-size:50px">${texte.replace(/ %/g, "&nbsp;%").replace(/ :/g, "&nbsp;:")}</p>` });
});
const CHIFFRES = [
  ["chiffre-7-pourcent", "&lt;&nbsp;7&nbsp;%", "de bio dans les achats de la restauration collective. La loi en exige 20&nbsp;%.", "Agence Bio", "Moins de 7 % de bio"],
  ["chiffre-18-pourcent", "18&nbsp;%", "des communes seulement respectent les deux seuils de la loi EGalim.", "Association des maires de France, 2024", "18 % des communes"],
  ["chiffre-1-7-million", "1,7&nbsp;million", "d'écoliers vont en classe sous forte pression pesticides.", "Le Monde, décembre 2025", "1,7 million d'écoliers"],
  ["chiffre-78-pourcent", "78&nbsp;%", "des Françaises et des Français sont favorables à la limitation des pesticides.", "Ipsos bva · Réseau Action Climat, octobre 2025", "78 % favorables"],
];
for (const [nom, n, texte, src, titre] of CHIFFRES) {
  VISUELS.push({ nom, famille: "Les chiffres", titre, theme: "jaune", sur: "Le chiffre",
    corps: `<p class="big" style="font-size:${n.includes("million") ? 230 : 330}px">${n}</p>
            <p class="sous fort" style="font-size:62px">${texte}</p>
            <p class="src">${src}</p>` });
}

function compo(v, { pourCanva = false } = {}) {
  const t = THEMES[v.theme];
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
${pourCanva ? ffPublie : ffEmbarque}
@page{size:${L}px ${H}px;margin:0}
html,body{margin:0;width:${L}px;height:${H}px;overflow:hidden}
body{background:${t.fond};color:${t.texte};font-family:'PT Sans',sans-serif;position:relative}
.feuille{position:absolute;background:${C.tilleul};border-radius:100% 0 100% 0;width:96px;height:46px}
.egal{position:absolute;background:${C.corail};width:74px;height:15px;border-radius:3px;transform:rotate(-38deg)}
.sur{position:absolute;top:96px;left:230px;right:90px;font-family:'Antonio',sans-serif;font-weight:500;font-size:34px;letter-spacing:4px;text-transform:uppercase;color:${t.doux};margin:0}
#corps{position:absolute;left:90px;right:90px;top:250px;bottom:270px;display:flex;flex-direction:column;justify-content:center;gap:34px}
.brush{font-family:'Caveat Brush',cursive;font-weight:400;text-transform:uppercase;line-height:.98;margin:0;color:${t.texte}}
.acc{color:${t.accent}}
.sous{margin:0;font-size:46px;line-height:1.25;color:${t.texte}}
.fort{font-weight:700}
.num{display:flex;align-items:baseline;gap:8px}
.n1{margin:0;font-family:'Antonio',sans-serif;font-weight:700;font-size:200px;line-height:.9;color:${t.accent}}
.n2{margin:0;font-family:'Antonio',sans-serif;font-size:70px;line-height:1;color:${t.doux};font-weight:500}
.big{margin:0;font-family:'Antonio',sans-serif;font-weight:700;line-height:.95;color:${t.accent};white-space:nowrap}
.src{margin:0;font-family:'Antonio',sans-serif;font-weight:500;font-size:32px;letter-spacing:3px;text-transform:uppercase;color:${t.doux}}
.pied{position:absolute;left:90px;bottom:96px;right:260px;font-family:'Antonio',sans-serif;font-weight:700;font-size:40px;letter-spacing:2px;text-transform:uppercase;color:${t.pied};margin:0;line-height:1.15}
.pied span{color:${{ vert: C.jaune, jaune: C.vert, creme: C.corail }[v.theme]}}
.logo{position:absolute;right:90px;bottom:80px;width:140px;height:140px;border-radius:18px}
</style></head><body>
<div class="feuille" style="left:92px;top:92px;transform:rotate(-24deg)"></div>
<div class="feuille" style="left:104px;top:150px;transform:rotate(-8deg)"></div>
<p class="sur">${v.sur}</p>
<div id="corps">${v.corps}</div>
<div class="egal" style="left:86px;bottom:236px"></div>
<div class="egal" style="left:112px;bottom:236px"></div>
<p class="pied">Je signe sur<br><span>pasdepesticidespournosenfants.net</span></p>
<img class="logo" src="${pourCanva ? SITE + "/images/logo-bca.jpg" : LOGO}" alt="">
<script>
// Ajuste la taille du texte jusqu'à ce que le bloc tienne dans sa zone.
function ajuster(){
  const c=document.getElementById("corps");
  const txt=[...c.querySelectorAll(".brush,.sous,.big")];
  for(let i=0;i<60 && c.scrollHeight>c.clientHeight+1;i++) txt.forEach(e=>{e.style.fontSize=(parseFloat(getComputedStyle(e).fontSize)*0.96)+"px"});
  const big=c.querySelector(".big"); if(big) while(big.scrollWidth>c.clientWidth) big.style.fontSize=(parseFloat(getComputedStyle(big).fontSize)*0.97)+"px";
}
</script>
</body></html>`;
}

/* Relevé des positions pour Canva (après ajustement des tailles). */
const RELEVE = `<script>
addEventListener("load", () => document.fonts.ready.then(() => {
  ajuster();
  const els = [];
  const px = (v) => Math.round(v * 10) / 10;
  const INLINE = new Set(["SPAN", "BR", "B", "STRONG", "EM", "I"]);
  const maj = (cs) => cs.textTransform === "uppercase";
  const html = (n, up) => {
    if (n.nodeType === 3) { const t = up ? n.textContent.toUpperCase() : n.textContent; return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\\u00a0/g, "&nbsp;"); }
    if (n.nodeName === "BR") return "<br>";
    const cs = getComputedStyle(n);
    const st = ["color:" + cs.color, "font-family:" + cs.fontFamily.replace(/"/g, "'"), "font-weight:" + cs.fontWeight, "font-size:" + cs.fontSize].join(";");
    return '<span style="' + st + '">' + [...n.childNodes].map((c) => html(c, up || maj(cs))).join("") + "</span>";
  };
  for (const e of document.body.querySelectorAll("*")) {
    if (["SCRIPT", "TEXTAREA", "STYLE", "TITLE", "META"].includes(e.nodeName)) continue;
    const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    const fond = cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : null;
    if (fond && e.nodeName !== "IMG" && e !== document.body) els.push({ type: "aplat", top: px(r.top), left: px(r.left), width: px(e.offsetWidth), height: px(e.offsetHeight), fond, rayon: cs.borderRadius, rotation: cs.transform, cx: px(r.left + r.width / 2), cy: px(r.top + r.height / 2) });
    if (e.nodeName === "IMG") { els.push({ type: "image", top: px(r.top), left: px(r.left), width: px(r.width), height: px(r.height), src: e.getAttribute("src"), rayon: cs.borderRadius }); continue; }
    const enfants = [...e.childNodes];
    const bloc = cs.display !== "inline" && cs.display !== "flex" && enfants.length && enfants.every((c) => c.nodeType === 3 || INLINE.has(c.nodeName)) && e.textContent.trim();
    if (bloc) els.push({ type: "texte", top: px(r.top), left: px(r.left), width: px(r.width), height: px(r.height),
      html: enfants.map((c) => html(c, maj(cs))).join(""), famille: cs.fontFamily, taille: cs.fontSize, graisse: cs.fontWeight, style: cs.fontStyle,
      couleur: cs.color, interligne: cs.lineHeight, espacement: cs.letterSpacing, align: cs.textAlign });
  }
  const t = document.createElement("textarea"); t.id = "fige";
  t.textContent = JSON.stringify({ fond: getComputedStyle(document.body).backgroundColor, els });
  document.body.appendChild(t);
}));
</script>`;

function chrome(args) {
  execFileSync(NAVIGATEUR, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=5000", ...args], { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 26 });
}
const prete = (html) => html.replace("</body>", `<script>addEventListener("load",()=>document.fonts.ready.then(ajuster))</script></body>`);

function pageCanva(rel, label) {
  const ordre = [...rel.els.filter((e) => e.type === "aplat"), ...rel.els.filter((e) => e.type !== "aplat")];
  const morceaux = ordre.map((e) => {
    if (e.type === "aplat") {
      // Forme tournée : on repose la boîte d'origine sur son centre, avec la seule rotation.
      let rot = "", top = e.top, left = e.left;
      if (e.rotation && e.rotation !== "none") {
        const [a, b] = e.rotation.match(/matrix\(([^)]+)\)/)[1].split(",").map(Number);
        rot = `transform:rotate(${Math.round(Math.atan2(b, a) * 180 / Math.PI)}deg);`;
        top = e.cy - e.height / 2; left = e.cx - e.width / 2;
      }
      return `<div style="position:absolute;top:${top}px;left:${left}px;width:${e.width}px;height:${e.height}px;background:${e.fond};border-radius:${e.rayon};${rot}"></div>`;
    }
    if (e.type === "image") return `<img src="${e.src}" alt="" style="position:absolute;top:${e.top}px;left:${e.left}px;width:${e.width}px;height:${e.height}px;border-radius:${e.rayon}">`;
    const interligne = e.interligne === "normal" ? `${Math.round(parseFloat(e.taille) * 1.2)}px` : e.interligne;
    const uneLigne = e.height < parseFloat(interligne) * 1.5;
    const marge = uneLigne ? Math.round(e.width * 0.16) : 0;
    return `<div style="position:absolute;top:${e.top}px;left:${e.left}px;width:${e.width + marge}px;font-family:${e.famille.replace(/"/g, "'")};font-size:${e.taille};font-weight:${e.graisse};font-style:${e.style};color:${e.couleur};line-height:${interligne};letter-spacing:${e.espacement};text-align:${e.align === "start" ? "left" : e.align};${uneLigne ? "white-space:nowrap;" : ""}">${e.html}</div>`;
  });
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${label}</title>
<style>${ffPublie}
  body{margin:0;background:#888}
  [data-document-role="page"]{margin:0 auto 40px}
</style></head><body>
<div data-document-role="page" data-label="${label}" style="position:relative;width:${L}px;height:${H}px;overflow:hidden;background:${rel.fond}">
${morceaux.join("\n")}
</div>
</body></html>`;
}

const anciens = existsSync(join(RACINE, "src", "data", "visuels.json")) ? JSON.parse(readFileSync(join(RACINE, "src", "data", "visuels.json"), "utf8")) : [];
const liste = [];
for (const v of VISUELS) {
  const src = join(TEMPO, v.nom + ".html");
  writeFileSync(src, prete(compo(v)), "utf8");
  const url = pathToFileURL(src).href;
  chrome(["--force-device-scale-factor=2", `--window-size=${L},${H}`, `--screenshot=${join(PUB, "visuels", v.nom + ".png")}`, url]);
  chrome(["--force-device-scale-factor=0.5", `--window-size=${L},${H}`, `--screenshot=${join(PUB, "visuels", v.nom + "-mini.png")}`, url]);
  chrome(["--no-pdf-header-footer", `--print-to-pdf=${join(PUB, "visuels", v.nom + ".pdf")}`, url]);

  // Relevé dans le navigateur, puis page d'import Canva
  const srcRel = join(TEMPO, v.nom + "-releve.html");
  writeFileSync(srcRel, compo(v, { pourCanva: false }).replace("</body>", RELEVE + "</body>"), "utf8");
  const dom = execFileSync(NAVIGATEUR, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--virtual-time-budget=5000",
    `--window-size=${L},${H}`, "--dump-dom", pathToFileURL(srcRel).href], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 26 }).toString();
  const m = dom.match(/<textarea id="fige">([\s\S]*?)<\/textarea>/);
  if (!m) throw new Error("relevé introuvable : " + v.nom);
  const rel = JSON.parse(m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&"));
  rel.els.forEach((e) => { if (e.type === "image") e.src = SITE + "/images/logo-bca.jpg"; });
  writeFileSync(join(PUB, "modeles", v.nom + ".html"), pageCanva(rel, v.titre), "utf8");

  const avant = anciens.find((a) => a.nom === v.nom);
  liste.push({ nom: v.nom, famille: v.famille, titre: v.titre, canva: avant?.canva || "" });
  console.log("  " + v.nom);
}
writeFileSync(join(RACINE, "src", "data", "visuels.json"), JSON.stringify(liste, null, 2) + "\n", "utf8");
console.log(`${liste.length} visuels`);
