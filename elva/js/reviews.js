/* ==========================================================================
   reviews.js — Avis visiteurs (formulaire + affichage automatique)

   Envoie un avis au backend (server/server.js), stocké dans data/reviews.json,
   et publié immédiatement sur le site (pas de validation manuelle).
   ========================================================================== */
(function () {
  function apiUrl(path) {
    return ((window.SITE_CONFIG && window.SITE_CONFIG.apiBase) || "/api") + path;
  }

  function starString(rating) {
    const n = Math.min(5, Math.max(1, Number(rating) || 0));
    return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  }

  function reviewCard(review) {
    const li = document.createElement("li");
    li.className = "review-card";

    const stars = document.createElement("p");
    stars.className = "review-card__stars";
    stars.textContent = starString(review.rating);

    const msg = document.createElement("p");
    msg.className = "review-card__message";
    msg.textContent = review.message;

    const name = document.createElement("p");
    name.className = "review-card__name hand";
    name.textContent = "— " + review.name;

    li.append(stars, msg, name);
    return li;
  }

  async function loadReviews() {
    const list = document.querySelector("[data-review-list]");
    if (!list) return;
    try {
      const res = await fetch(apiUrl("/reviews"));
      if (!res.ok) throw new Error("Réponse " + res.status);
      const reviews = await res.json();
      list.innerHTML = "";
      if (!reviews.length) {
        const empty = document.createElement("li");
        empty.className = "review-card review-card--empty";
        empty.textContent = "Aucun avis pour l'instant, soyez la première ou le premier !";
        list.append(empty);
        return;
      }
      reviews.slice().reverse().forEach((r) => list.append(reviewCard(r)));
    } catch (err) {
      console.warn("[avis] chargement impossible :", err.message);
    }
  }

  function initReviewForm() {
    const form = document.getElementById("review-form");
    if (!form) return;
    const status = form.querySelector("[data-review-status]");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.website.value) return; // piège anti-bot rempli -> on ignore silencieusement

      const payload = {
        name: form.name.value.trim(),
        rating: Number(form.rating.value),
        message: form.message.value.trim()
      };
      if (!payload.name || !payload.message) return;

      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      if (status) status.textContent = "Envoi…";

      try {
        const res = await fetch(apiUrl("/reviews"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Réponse " + res.status);
        form.reset();
        if (status) status.textContent = "Merci, votre avis est en ligne !";
        loadReviews();
      } catch (err) {
        if (status) status.textContent = "Impossible d'envoyer l'avis pour le moment.";
        console.warn("[avis] envoi impossible :", err.message);
      } finally {
        btn.disabled = false;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initReviewForm();
    loadReviews();
  });
})();