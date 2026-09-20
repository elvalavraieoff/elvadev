/* nav-menu.js
   Ouverture et fermeture du menu hamburger sur mobile. */

(function () {
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  if (!nav || !burger) return;

  function setOpen(open) {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  }

  burger.addEventListener('click', function () {
    setOpen(!nav.classList.contains('open'));
  });

  // on referme dès qu'un lien du menu est choisi
  document.querySelectorAll('#mobile-menu a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setOpen(false);
      burger.focus();
    }
  });
})();
