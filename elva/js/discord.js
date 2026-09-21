/* ==========================================================================
   discord.js — Carte Discord (avatar, pseudo, statut, membres, en ligne)

   Le navigateur n'appelle JAMAIS l'API Discord directement : il interroge
   ton petit backend (GET /api/discord, voir server/server.js) qui garde le
   token secret. Configuration : fichier .env
       DISCORD_BOT_TOKEN, DISCORD_SERVER_ID, DISCORD_USER_ID

   Format attendu de la réponse :
   { server: { name, memberCount, onlineCount } | null,
     user:   { username, displayName, avatarUrl, status } | null }
   Toute valeur absente (null) est simplement masquée : rien n'est inventé.
   ========================================================================== */
async function fetchDiscordData() {
  const apiBase = (window.SITE_CONFIG && window.SITE_CONFIG.apiBase) || "/api";
  const response = await fetch(apiBase + "/discord", { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Réponse " + response.status);
  return response.json();
}

const STATUS_LABELS = { online: "en ligne", idle: "absente", dnd: "ne pas déranger", offline: "hors ligne" };
const formatNumber = (n) => new Intl.NumberFormat("fr-FR").format(n);

/* Écrit une valeur, ou masque la ligne si la donnée n'existe pas */
function setField(card, key, value) {
  const node = card.querySelector(`[data-discord="${key}"]`);
  const row = card.querySelector(`[data-discord-row="${key}"]`);
  const missing = value === null || value === undefined || value === "";
  if (row) row.hidden = missing;
  if (node && !missing) node.textContent = value;
}

function fillDiscordCard(card, data) {
  const { server, user } = data;

  /* Utilisatrice */
  if (user) {
    setField(card, "name", user.displayName || user.username);
    if (user.avatarUrl) {
      const img = card.querySelector('[data-discord="avatar"]');
      img.alt = "Avatar Discord de " + (user.displayName || user.username);
      img.addEventListener("load", () => { img.hidden = false; }, { once: true });
      img.src = user.avatarUrl;
    }
    const status = card.querySelector('[data-discord="status"]');
    if (status && user.status && STATUS_LABELS[user.status]) {
      status.textContent = STATUS_LABELS[user.status];
      status.dataset.status = user.status;
      status.hidden = false;
    }
  } else {
    const name = card.querySelector('[data-discord="name"]');
    if (name) name.hidden = true;
  }

  /* Serveur */
  setField(card, "server", server && server.name);
  setField(card, "members", server && typeof server.memberCount === "number" ? formatNumber(server.memberCount) : null);
  setField(card, "online", server && typeof server.onlineCount === "number" ? formatNumber(server.onlineCount) : null);
}

function showDiscordError(card) {
  card.querySelectorAll("[data-discord-row]").forEach((row) => { row.hidden = true; });
  const name = card.querySelector('[data-discord="name"]');
  if (name) name.hidden = true;
  const error = card.querySelector('[data-discord="error"]');
  if (error) error.hidden = false;
}

async function initDiscordCard() {
  const card = document.querySelector("[data-discord-card]");
  if (!card) return;
  try {
    fillDiscordCard(card, await fetchDiscordData());
  } catch (err) {
    console.warn("[discord] données indisponibles :", err.message);
    showDiscordError(card);
  }
}

document.addEventListener("DOMContentLoaded", initDiscordCard);
