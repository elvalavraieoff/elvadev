/* smooth-scroll.js
   Défilement fluide vers les ancres, avec compensation de la hauteur de la navbar. */

(function () {
  var NAV_HEIGHT = 66; // doit correspondre à .nav-inner dans css/04-nav.css

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;

      var target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.pageYOffset - NAV_HEIGHT,
        behavior: reduce ? 'auto' : 'smooth'
      });
      history.replaceState(null, '', id);
    });
  });
})();
