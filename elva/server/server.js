/* ==========================================================================
   server.js — Petit serveur sans dépendance (Node 18+)
   - sert le site statique
   - GET  /api/discord     -> infos Discord (le token reste ICI, jamais dans le navigateur)
   - GET  /api/visits      -> total des visites
   - POST /api/visits/hit  -> enregistre une visite et renvoie le total

   Lancer :  node server/server.js   (ou  npm start)
   Configurer : copier .env.example en .env et le remplir.
   Sur un hébergeur serverless, chaque route ci-dessous se recopie facilement
   dans une fonction (Vercel, Netlify, Cloudflare Workers…).
   ========================================================================== */
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");

/* ---------- .env minimal (évite d'installer dotenv) ------------------------ */
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv(path.join(ROOT, ".env"));

const PORT = Number(process.env.PORT) || 3000;
const TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const SERVER_ID = process.env.DISCORD_SERVER_ID || "";
const USER_ID = process.env.DISCORD_USER_ID || "";
const USE_LANYARD = process.env.USE_LANYARD === "true";
const TRUST_PROXY = process.env.TRUST_PROXY === "true";
const DISCORD_API = "https://discord.com/api/v10";

/* ---------- Discord -------------------------------------------------------- */
async function discordGet(endpoint) {
  const res = await fetch(DISCORD_API + endpoint, { headers: { Authorization: `Bot ${TOKEN}` } });
  if (!res.ok) throw new Error(`Discord ${endpoint} -> ${res.status}`);
  return res.json();
}

/* Serveur : avec token => vrais compteurs (le bot doit être membre du serveur).
   Sans token => widget public du serveur (à activer dans Paramètres > Widget). */
async function getServer() {
  if (!SERVER_ID) return null;
  if (TOKEN) {
    const g = await discordGet(`/guilds/${SERVER_ID}?with_counts=true`);
    return { name: g.name, memberCount: g.approximate_member_count ?? null, onlineCount: g.approximate_presence_count ?? null };
  }
  const res = await fetch(`${DISCORD_API}/guilds/${SERVER_ID}/widget.json`);
  if (!res.ok) throw new Error(`Widget -> ${res.status} (widget désactivé ?)`);
  const w = await res.json();
  return { name: w.name, memberCount: null, onlineCount: w.presence_count ?? null };
}

/* Utilisatrice : pseudo + avatar via l'API (token requis). */
async function getUser() {
  if (!USER_ID || !TOKEN) return null;
  const u = await discordGet(`/users/${USER_ID}`);
  const avatarUrl = u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(u.id) >> 22n) % 6n)}.png`;
  return { username: u.username, displayName: u.global_name || u.username, avatarUrl, status: null };
}

/* Statut : l'API REST de Discord ne le fournit pas (il faut une connexion
   gateway). Option : le service public Lanyard (USE_LANYARD=true) — il faut
   avoir rejoint leur serveur Discord. Sinon le statut n'est pas affiché. */
async function getStatus() {
  if (!USE_LANYARD || !USER_ID) return null;
  const res = await fetch(`https://api.lanyard.rest/v1/users/${USER_ID}`);
  if (!res.ok) return null;
  const body = await res.json();
  return body.success ? body.data.discord_status : null;
}

let discordCache = { at: 0, data: null };
async function getDiscordData() {
  if (discordCache.data && Date.now() - discordCache.at < 60_000) return discordCache.data; // cache 60 s
  const [server, user, status] = await Promise.allSettled([getServer(), getUser(), getStatus()]);
  const val = (r) => (r.status === "fulfilled" ? r.value : null);
  [server, user, status].forEach((r) => r.status === "rejected" && console.warn("[discord]", r.reason.message));

  const data = { server: val(server), user: val(user), updatedAt: new Date().toISOString() };
  if (data.user && val(status)) data.user.status = val(status);
  if (!data.server && !data.user) throw new Error("Aucune donnée Discord disponible (vérifie le .env)");
  discordCache = { at: Date.now(), data };
  return data;
}

/* ---------- Visites (stockées dans data/visits.json) ----------------------- */
const VISITS_FILE = path.join(ROOT, "data", "visits.json");
let visits = 0;
try { visits = JSON.parse(fs.readFileSync(VISITS_FILE, "utf8")).count || 0; } catch { /* premier lancement */ }

function saveVisits() {
  fs.mkdirSync(path.dirname(VISITS_FILE), { recursive: true });
  const tmp = VISITS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify({ count: visits }));
  fs.renameSync(tmp, VISITS_FILE); // écriture atomique
}

/* Anti-doublon simple : une visite par visiteur (IP + navigateur) et par jour.
   Seul un hash est gardé en mémoire, jamais l'IP en clair. */
let seenDay = "";
const seenToday = new Set();
function isNewVisitor(req) {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== seenDay) { seenDay = day; seenToday.clear(); }
  const ip = TRUST_PROXY ? String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() : req.socket.remoteAddress;
  const id = crypto.createHash("sha256").update(ip + "|" + (req.headers["user-agent"] || "")).digest("hex");
  if (seenToday.has(id)) return false;
  seenToday.add(id);
  return true;
}

/* ---------- Fichiers statiques -------------------------------------------- */
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2"
};
/* Seuls ces éléments sont publics (le .env, server/ et data/ ne le sont jamais). */
const isPublic = (rel) => /^(css|js|assets)\//.test(rel) || /^[a-z0-9-]+\.html$/.test(rel);

function serveStatic(req, res) {
  let rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || !isPublic(rel.replace(/\\/g, "/"))) return send(res, 404, "Introuvable");
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, "Introuvable");
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(buf);
  });
}

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}
const sendJson = (res, status, obj) => send(res, status, JSON.stringify(obj), "application/json; charset=utf-8");

/* ---------- Routes --------------------------------------------------------- */
const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  const { pathname } = new URL(req.url, "http://x");

  try {
    if (req.method === "GET" && pathname === "/api/discord") {
      try { return sendJson(res, 200, await getDiscordData()); }
      catch (e) { console.warn("[discord]", e.message); return sendJson(res, 502, { error: "discord_unavailable" }); }
    }
    if (req.method === "GET" && pathname === "/api/visits") return sendJson(res, 200, { count: visits });
    if (req.method === "POST" && pathname === "/api/visits/hit") {
      if (isNewVisitor(req)) { visits += 1; saveVisits(); }
      return sendJson(res, 200, { count: visits });
    }
    if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res);
    return send(res, 405, "Méthode non autorisée");
  } catch (e) {
    console.error(e);
    return send(res, 500, "Erreur serveur");
  }
});

server.listen(PORT, () => console.log(`ELVA — http://localhost:${PORT}`));
