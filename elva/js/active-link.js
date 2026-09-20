/* active-link.js
   Souligne en bleu le lien de la section actuellement visible. */

(function () {
  if (!('IntersectionObserver' in window)) return;

  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = links.map(function (link) {
    return document.querySelector(link.getAttribute('href'));
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var i = sections.indexOf(entry.target);
      if (i < 0) return;
      links.forEach(function (l) { l.classList.remove('active'); });
      links[i].classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(function (section) { if (section) observer.observe(section); });
})();
