/* nav-scroll.js
   Affiche la bordure de la navbar dès que la page défile. */

(function () {
  var nav = document.getElementById('nav');
  if (!nav) return;

  function update() {
    nav.classList.toggle('is-stuck', window.scrollY > 8);
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
})();
