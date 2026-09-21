/* ==========================================================================
   main.js — Comportements communs à toutes les pages
   (thème, menu mobile, apparitions, images manquantes, liens configurables)
   Expose window.ELVA pour que les autres scripts réutilisent les fonctions.
   ========================================================================== */
(function () {
  "use strict";

  const config = window.SITE_CONFIG || { links: {} };
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Thème sombre / clair ---------------------------------------- */
  function initTheme() {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button) return;
    button.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("elva-theme", next); } catch (e) { /* stockage indisponible : ignoré */ }
    });
  }

  /* ---------- Menu hamburger (mobile) ------------------------------------- */
  function initNav() {
    const burger = document.querySelector(".burger");
    const menu = document.getElementById("menu");
    if (!burger || !menu) return;

    const setOpen = (open) => {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      menu.classList.toggle("is-open", open);
    };
    burger.addEventListener("click", () => setOpen(burger.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    window.matchMedia("(min-width: 761px)").addEventListener("change", () => setOpen(false));
  }

  /* ---------- Apparition progressive -------------------------------------- */
  let revealObserver = null;

  function observeReveal(root = document) {
    const items = root.querySelectorAll(".reveal:not(.is-visible)");
    if (!items.length) return;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    }
    items.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Images manquantes -------------------------------------------
     Si une image n'existe pas encore, son conteneur .photo reçoit .is-missing
     (petit papier "photo à venir"). À rappeler après un rendu dynamique. */
  function watchImages(root = document) {
    root.querySelectorAll(".photo img").forEach((img) => {
      const mark = () => img.closest(".photo").classList.add("is-missing");
      const unmark = () => img.closest(".photo").classList.remove("is-missing");
      img.addEventListener("error", mark);
      img.addEventListener("load", unmark);
      if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) mark();
    });
  }

  /* ---------- Liens configurables (js/config.js) --------------------------
     <a data-link="github"> reçoit l'URL de config.links.github.
     Lien vide => bouton "à renseigner" (désactivé). */
  function applyLinks(root = document) {
    root.querySelectorAll("[data-link]").forEach((el) => {
      let url = (config.links || {})[el.dataset.link] || "";
      if (url && el.dataset.link === "email" && !url.startsWith("mailto:")) url = "mailto:" + url;

      if (url) {
        el.href = url;
        el.classList.remove("is-unset");
        el.removeAttribute("aria-disabled");
        el.removeAttribute("title");
      } else {
        el.classList.add("is-unset");
        el.setAttribute("aria-disabled", "true");
        el.title = "Lien à renseigner dans js/config.js";
        el.addEventListener("click", (e) => e.preventDefault());
      }
    });
  }

  function setYear() {
    document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
    observeReveal();
    watchImages();
    applyLinks();
    setYear();
  });

  /* API partagée avec projects.js, discord.js, visits.js */
  window.ELVA = { observeReveal, watchImages, applyLinks, config };
})();
