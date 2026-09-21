/* ==========================================================================
   config.js — Réglages du site (à modifier ici, nulle part ailleurs)
   ⚠ Ne JAMAIS mettre de token Discord dans ce fichier : il est public.
   Le token va dans le fichier .env (côté serveur uniquement).
   ========================================================================== */
window.SITE_CONFIG = {
  /* Préfixe des endpoints du petit backend (server/server.js). */
  apiBase: "/api",

  /* Liens des boutons. Laisser "" tant qu'un lien n'est pas prêt :
     le bouton s'affichera en "à renseigner". */
  links: {
    discord: "https://discord.gg/s2aF5C2emx",        // ton profil Discord ou une invitation pour t'écrire
    discordInvite: "https://discord.gg/s2aF5C2emx",  // invitation du serveur (bouton "Rejoindre le serveur")
    email: "elvapro7@gmail.com",          // ex. "elva@exemple.fr" (mailto: ajouté automatiquement)
    fiverr: "https://fr.fiverr.com/s/3A8EDjr",         // ex. "https://www.fiverr.com/ton-profil"
    github: "https://github.com/elvalavraieoff"          // ex. "https://github.com/ton-pseudo"
  },

  /* Compteur de visites : "backend" = /api/visits (voir js/visits.js). */
  visits: { provider: "backend" }
};
