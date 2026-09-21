/* ==========================================================================
   visits.js — Compteur de visites RÉEL

   initVisitCounter() :
     1. enregistre la visite (une seule fois par navigateur) auprès du backend,
     2. affiche le total renvoyé par le serveur.
   Si le service ne répond pas, le compteur reste masqué : jamais de faux chiffre.

   ➜ Pour utiliser TON propre système plus tard, remplace uniquement l'objet
     "providers" ci-dessous : chaque provider expose deux fonctions
        register() -> Promise<number>   (compte une nouvelle visite)
        read()     -> Promise<number>   (lit le total sans compter)
   ========================================================================== */
const VISIT_STORAGE_KEY = "elva-visit-counted";

const providers = {
  /* Par défaut : le petit backend fourni (server/server.js, données dans data/visits.json) */
  backend: {
    async register() {
      const res = await fetch(apiUrl("/visits/hit"), { method: "POST" });
      if (!res.ok) throw new Error("Réponse " + res.status);
      return (await res.json()).count;
    },
    async read() {
      const res = await fetch(apiUrl("/visits"));
      if (!res.ok) throw new Error("Réponse " + res.status);
      return (await res.json()).count;
    }
  }

  /* Exemple d'un autre service :
  monService: {
    async register() { ... },
    async read() { ... }
  }
  */
};

function apiUrl(path) {
  return ((window.SITE_CONFIG && window.SITE_CONFIG.apiBase) || "/api") + path;
}

/* Ce navigateur a-t-il déjà été compté ? (évite de gonfler le total à chaque page) */
function hasBeenCounted() {
  try { return localStorage.getItem(VISIT_STORAGE_KEY) === "1"; } catch (e) { return false; }
}
function markAsCounted() {
  try { localStorage.setItem(VISIT_STORAGE_KEY, "1"); } catch (e) { /* ignoré */ }
}

/* Écrit la phrase dans tous les emplacements [data-visit-counter] */
function renderVisitCounter(count) {
  const formatted = new Intl.NumberFormat("fr-FR").format(count);
  const sentence = count > 1 ? "personnes sont passées" : "personne est passée";
  document.querySelectorAll("[data-visit-counter]").forEach((node) => {
    node.textContent = "";
    const strong = document.createElement("strong");
    strong.textContent = formatted;
    node.append(strong, ` ${sentence} par ici.`);
    node.hidden = false;
  });
}

async function initVisitCounter() {
  if (!document.querySelector("[data-visit-counter]")) return;
  const name = (window.SITE_CONFIG && window.SITE_CONFIG.visits && window.SITE_CONFIG.visits.provider) || "backend";
  const provider = providers[name];
  if (!provider) return;

  try {
    let count;
    if (hasBeenCounted()) {
      count = await provider.read();
    } else {
      count = await provider.register();
      markAsCounted();
    }
    if (Number.isFinite(count)) renderVisitCounter(count);
  } catch (err) {
    console.warn("[visites] compteur indisponible :", err.message);
  }
}

document.addEventListener("DOMContentLoaded", initVisitCounter);
