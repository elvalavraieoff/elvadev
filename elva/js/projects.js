/* ==========================================================================
   projects.js — Liste des projets + génération automatique des pages du carnet

   ➜ Pour ajouter / modifier un projet : édite uniquement le tableau ci-dessous.
   ➜ image : chemin vers ton fichier (ratio conseillé 16:10, ex. 1000 x 625)
   ➜ link  : laisse "" tant qu'il n'y a pas de lien (affiche "lien à venir")
   ========================================================================== */
const projects = [
  {
    name: "Clow Gestion",
    category: "Bot Discord",
    description: "Bot Discord de gestion.",
    image: "assets/images/owners.png",
    technologies: ["JavaScript"],           // à compléter
    link: ""
  },
  {
    name: "Ksuu Shop",
    category: "Bot Discord",
    description: "Bot Discord développé en JavaScript.",
    image: "assets/images/ksuushop.png",
    technologies: ["JavaScript"],
    link: ""
  },
  {
    name: "Dmall Tools",
    category: "Outils Discord",
    description: "Outils pour Discord développés en Python.",
    image: "assets/images/dmall.png",
    technologies: ["Python"],
    link: ""
  },
  {
    name: "Ksuu Ticket",
    category: "Bot Discord",
    description: "Bot Discord développé en JavaScript.",
    image: "assets/images/ticket-exch.png",
    technologies: ["JavaScript"],
    link: ""
  }
];

/* ---------- Rendu --------------------------------------------------------- */
/* Alternance de papiers et de bords déchirés pour que chaque page soit différente */
const PAPER_STYLES = ["", "paper--dark", "paper--gray", ""];
const TORN_STYLES = ["torn-a", "torn-b", "torn-c", "torn-b"];

/* Petit utilitaire : crée un élément sans jamais injecter de HTML brut */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/* Construit une "page de carnet" pour un projet */
function createProjectElement(project, index) {
  const slot = el("li", "project-slot piece piece--lift reveal");
  slot.appendChild(el("span", "tape tape--short"));

  const paper = el("article", `project paper ${PAPER_STYLES[index % PAPER_STYLES.length]} ${TORN_STYLES[index % TORN_STYLES.length]}`);

  /* En-tête : numéro + catégorie */
  const top = el("div", "project__top");
  top.appendChild(el("span", "project__num", "n°" + String(index + 1).padStart(2, "0")));
  top.appendChild(el("span", "project__cat", project.category));
  paper.appendChild(top);

  /* Image collée */
  const wrap = el("div", "project__photo-wrap");
  wrap.appendChild(el("span", "tape"));
  const photo = el("div", "photo photo--wide project__photo");
  const img = document.createElement("img");
  img.src = project.image;
  img.alt = "Aperçu du projet " + project.name;
  img.width = 1000;
  img.height = 625;
  img.loading = "lazy";
  photo.appendChild(img);
  wrap.appendChild(photo);
  paper.appendChild(wrap);

  /* Texte */
  paper.appendChild(el("h2", "project__name", project.name));
  paper.appendChild(el("p", "project__desc", project.description));

  if (project.technologies && project.technologies.length) {
    const tech = el("ul", "project__tech");
    project.technologies.forEach((t) => tech.appendChild(el("li", "", t)));
    paper.appendChild(tech);
  }

  /* Bouton (ou mention si le lien n'existe pas encore) */
  const foot = el("div", "project__foot");
  if (project.link) {
    const a = el("a", "btn", "Voir le projet →");
    a.href = project.link;
    a.target = "_blank";
    a.rel = "noopener";
    foot.appendChild(a);
  } else {
    foot.appendChild(el("span", "project__soon", "lien privée"));
  }
  paper.appendChild(foot);

  slot.appendChild(paper);
  return slot;
}

/* Remplit la liste sur la page Projets */
function renderProjects() {
  const list = document.querySelector("[data-projects-list]");
  if (!list) return;
  const fragment = document.createDocumentFragment();
  projects.forEach((p, i) => fragment.appendChild(createProjectElement(p, i)));
  list.appendChild(fragment);
  if (window.ELVA) {
    window.ELVA.watchImages(list);
    window.ELVA.observeReveal(list);
  }
}

/* Chiffre réel affiché sur l'accueil : nombre de projets listés ci-dessus */
function renderProjectsCount() {
  document.querySelectorAll("[data-projects-count]").forEach((node) => {
    node.textContent = projects.length + " présentés ici";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderProjects();
  renderProjectsCount();
});
