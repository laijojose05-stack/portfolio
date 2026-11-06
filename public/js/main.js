import { projects, certificates } from './projects.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scrollBehavior = () => (reduceMotion ? 'auto' : 'smooth');

/* --------------------------------------------------------------------------
 * Small DOM helpers
 * ------------------------------------------------------------------------ */
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (typeof text === 'string') node.textContent = text;
  return node;
}

function icon(name, className = 'icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#${name}`);
  svg.appendChild(use);
  return svg;
}

function safeExternalUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null;
}

/* --------------------------------------------------------------------------
 * Footer year
 * ------------------------------------------------------------------------ */
const yearNode = document.getElementById('current-year');
if (yearNode) yearNode.textContent = String(new Date().getFullYear());

/* --------------------------------------------------------------------------
 * Projects: data-driven cards, filtering, and accessible modal
 * ------------------------------------------------------------------------ */
const projectsGrid = document.getElementById('projects-grid');
const projectsEmpty = document.getElementById('projects-empty');
const filterStatus = document.getElementById('filter-status');

function createProjectCard(project, index) {
  const item = element('article', 'work-item');
  const titleId = `project-title-${project.id}`;
  item.dataset.filters = project.filters.join(' ');
  item.setAttribute('data-reveal', '');
  item.setAttribute('aria-labelledby', titleId);

  const number = element('span', 'work-number', String(index + 1).padStart(2, '0'));
  number.setAttribute('aria-hidden', 'true');

  const body = element('div', 'work-body');
  body.appendChild(element('p', 'work-category', project.category));

  const title = element('h3', 'work-title-name', project.title);
  title.id = titleId;
  body.appendChild(title);
  body.appendChild(element('p', 'work-summary', project.summary));

  const techList = element('ul', 'tech-badges');
  techList.setAttribute('aria-label', `Technologies used in ${project.title}`);
  project.technologies.forEach((tech) => techList.appendChild(element('li', 'tech-badge', tech)));
  body.appendChild(techList);

  const thumbWrap = element('button', 'work-thumb');
  thumbWrap.type = 'button';
  thumbWrap.dataset.projectId = project.id;
  thumbWrap.setAttribute('aria-label', `Open the ${project.title} case study`);
  thumbWrap.setAttribute('aria-haspopup', 'dialog');
  if (project.thumbnailWidth && project.thumbnailHeight) {
    thumbWrap.classList.add('work-thumb--photo');
  }

  const image = document.createElement('img');
  image.src = project.thumbnail;
  image.alt = project.thumbnailAlt;
  image.width = project.thumbnailWidth || 640;
  image.height = project.thumbnailHeight || 400;
  image.loading = 'lazy';
  image.decoding = 'async';
  thumbWrap.appendChild(image);

  const cue = element('span', 'work-thumb__cue');
  cue.setAttribute('aria-hidden', 'true');
  cue.appendChild(icon('i-arrow-up-right'));
  thumbWrap.appendChild(cue);
  body.appendChild(thumbWrap);

  const actions = element('div', 'work-actions');
  const detailsButton = element('button', 'btn-details');
  detailsButton.type = 'button';
  detailsButton.dataset.projectId = project.id;
  detailsButton.setAttribute('aria-label', `View details for ${project.title}`);
  detailsButton.setAttribute('aria-haspopup', 'dialog');
  detailsButton.appendChild(document.createTextNode('Open case study'));
  detailsButton.appendChild(icon('i-arrow-right'));
  actions.appendChild(detailsButton);

  const githubUrl = safeExternalUrl(project.links?.github);
  if (githubUrl) {
    const githubLink = document.createElement('a');
    githubLink.className = 'button button--outline';
    githubLink.href = githubUrl;
    githubLink.target = '_blank';
    githubLink.rel = 'noopener noreferrer';
    githubLink.appendChild(icon('i-github'));
    githubLink.appendChild(document.createTextNode('GitHub'));
    actions.appendChild(githubLink);
  }

  const demoUrl = safeExternalUrl(project.links?.demo);
  if (demoUrl) {
    const demoLink = document.createElement('a');
    demoLink.className = 'button button--outline';
    demoLink.href = demoUrl;
    demoLink.target = '_blank';
    demoLink.rel = 'noopener noreferrer';
    demoLink.appendChild(icon('i-external'));
    demoLink.appendChild(document.createTextNode('Live demo'));
    actions.appendChild(demoLink);
  }

  body.appendChild(actions);

  item.appendChild(number);
  item.appendChild(body);
  return item;
}

function renderProjects() {
  if (!projectsGrid) return;

  const fragment = document.createDocumentFragment();
  projects.forEach((project, index) => fragment.appendChild(createProjectCard(project, index)));
  projectsGrid.replaceChildren(fragment);

  if (filterStatus) {
    const total = projects.length;
    filterStatus.textContent = `Showing all ${total} project${total === 1 ? '' : 's'}.`;
  }
}

/* ---- Filtering ---- */
const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
let projectColumns = [];

function applyFilter(filter) {
  if (!projectsGrid) return;

  let visibleCount = 0;

  projectColumns.forEach((column) => {
    const matches = filter === 'all' || column.dataset.filters.split(' ').includes(filter);
    column.hidden = !matches;
    if (matches) visibleCount += 1;
  });

  filterButtons.forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  if (projectsEmpty) projectsEmpty.hidden = visibleCount !== 0;

  if (filterStatus) {
    if (filter === 'all') {
      filterStatus.textContent = `Showing all ${visibleCount} projects.`;
    } else {
      const activeButton = filterButtons.find((button) => button.dataset.filter === filter);
      const label = activeButton ? activeButton.textContent.trim() : filter;
      filterStatus.textContent = `Showing ${visibleCount} project${visibleCount === 1 ? '' : 's'} using ${label}.`;
    }
  }
}

function initFilters() {
  if (!projectsGrid) return;

  projectColumns = Array.from(projectsGrid.querySelectorAll('.work-item'));

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.dataset.filter || 'all'));
  });

  const resetButton = document.getElementById('reset-filter');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      applyFilter('all');
      const allButton = filterButtons.find((button) => button.dataset.filter === 'all');
      if (allButton) allButton.focus();
    });
  }
}

/* ---- Modal ---- */
const modalOverlay = document.getElementById('project-modal');
const modalDialog = modalOverlay?.querySelector('.modal-dialog');
const modalContent = document.getElementById('modal-content');
const modalScroll = document.getElementById('modal-scroll');
const modalTitle = document.getElementById('modal-title');
const modalCategory = document.getElementById('modal-category');
const modalCloseButton = document.getElementById('modal-close');
const backgroundNodes = [
  document.querySelector('.site-header'),
  document.querySelector('main'),
  document.querySelector('.site-footer'),
  document.getElementById('back-to-top'),
].filter(Boolean);

let lastFocusedElement = null;
let modalTimer = null;
let modalOpen = false;

function buildModalSection(title, contentNode) {
  const section = element('section', 'modal-section');
  section.appendChild(element('h3', null, title));
  section.appendChild(contentNode);
  return section;
}

function buildParagraph(text) {
  return element('p', null, text);
}

function buildList(items, ordered = false) {
  const list = document.createElement(ordered ? 'ol' : 'ul');
  items.forEach((item) => list.appendChild(element('li', null, item)));
  return list;
}

function buildTechnologyList(items) {
  const list = element('dl', 'modal-tech-list');
  items.forEach((item) => {
    const row = element('div', 'modal-tech-item');
    row.appendChild(element('dt', null, item.name));
    row.appendChild(element('dd', null, item.purpose));
    list.appendChild(row);
  });
  return list;
}

function renderModalContent(project) {
  const fragment = document.createDocumentFragment();

  const image = document.createElement('img');
  image.className = 'modal-thumb';
  image.src = project.thumbnail;
  image.alt = project.thumbnailAlt;
  image.width = project.thumbnailWidth || 640;
  image.height = project.thumbnailHeight || 400;
  image.decoding = 'async';
  fragment.appendChild(image);

  fragment.appendChild(element('p', 'modal-summary', project.summary));
  fragment.appendChild(buildModalSection('Overview', buildParagraph(project.details.overview)));
  fragment.appendChild(buildModalSection('Problem statement', buildParagraph(project.details.problem)));
  fragment.appendChild(buildModalSection('Objectives', buildList(project.details.objectives)));
  fragment.appendChild(buildModalSection('Key features', buildList(project.details.features)));
  fragment.appendChild(buildModalSection('How the system works', buildList(project.details.workflow, true)));
  fragment.appendChild(buildModalSection('Technologies and their purpose', buildTechnologyList(project.details.technologies)));
  fragment.appendChild(buildModalSection('Learning outcomes', buildList(project.details.learnings)));
  fragment.appendChild(buildModalSection('Future enhancements', buildList(project.details.future)));

  if (project.details.note) {
    const note = element('div', 'modal-note');
    note.appendChild(icon('i-info'));
    note.appendChild(element('span', null, project.details.note));
    const noteSection = element('section', 'modal-section');
    noteSection.appendChild(note);
    fragment.appendChild(noteSection);
  }

  const githubUrl = safeExternalUrl(project.links?.github);
  const demoUrl = safeExternalUrl(project.links?.demo);

  if (githubUrl || demoUrl) {
    const links = element('div', 'modal-links');
    if (demoUrl) {
      const demo = document.createElement('a');
      demo.className = 'button button--solid';
      demo.href = demoUrl;
      demo.target = '_blank';
      demo.rel = 'noopener noreferrer';
      demo.appendChild(icon('i-external'));
      demo.appendChild(document.createTextNode('Visit live demo'));
      links.appendChild(demo);
    }
    if (githubUrl) {
      const github = document.createElement('a');
      github.className = 'button button--outline';
      github.href = githubUrl;
      github.target = '_blank';
      github.rel = 'noopener noreferrer';
      github.appendChild(icon('i-github'));
      github.appendChild(document.createTextNode('View source on GitHub'));
      links.appendChild(github);
    }
    fragment.appendChild(links);
  }

  modalContent.replaceChildren(fragment);
}

function getModalFocusableElements() {
  if (!modalDialog) return [];
  return Array.from(
    modalDialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
  ).filter((node) => node.offsetParent !== null);
}

function openModal(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project || !modalOverlay || !modalDialog) return;

  lastFocusedElement = document.activeElement;
  modalTitle.textContent = project.title;
  modalCategory.textContent = project.category;
  renderModalContent(project);

  if (modalTimer) {
    window.clearTimeout(modalTimer);
    modalTimer = null;
  }

  modalOverlay.hidden = false;
  document.body.classList.add('modal-open');
  backgroundNodes.forEach((node) => node.setAttribute('inert', ''));

  // Tiny delay lets the browser register the element before the transition.
  window.requestAnimationFrame(() => {
    if (modalScroll) modalScroll.scrollTop = 0;
    modalOverlay.classList.add('is-open');
    modalDialog.focus();
  });

  modalOpen = true;
}

function closeModal() {
  if (!modalOverlay || !modalOpen) return;

  modalOverlay.classList.remove('is-open');
  document.body.classList.remove('modal-open');
  backgroundNodes.forEach((node) => node.removeAttribute('inert'));
  modalOpen = false;

  modalTimer = window.setTimeout(() => {
    modalOverlay.hidden = true;
    modalTimer = null;
  }, reduceMotion ? 0 : 200);

  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus({ preventScroll: true });
  }
}

function initModal() {
  if (!projectsGrid || !modalOverlay || !modalDialog) return;

  projectsGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-project-id]');
    if (button) openModal(button.dataset.projectId);
  });

  modalCloseButton?.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (!modalOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getModalFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      modalDialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === modalDialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (!modalDialog.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  });
}

/* --------------------------------------------------------------------------
 * Certificates: dedicated card layout with click-to-preview lightbox.
 * ------------------------------------------------------------------------ */
function renderCertificates() {
  const grid = document.getElementById('certificates-grid');
  if (!grid || !Array.isArray(certificates) || certificates.length === 0) return;

  const fragment = document.createDocumentFragment();

  certificates.forEach((certificate, index) => {
    const item = element('article', 'certificate-card');
    const titleId = `certificate-title-${index}`;
    const image = typeof certificate.image === 'string' && certificate.image.startsWith('/') ? certificate.image : null;
    const url = safeExternalUrl(certificate.url);

    item.setAttribute('data-reveal', '');
    item.setAttribute('aria-labelledby', titleId);

    // Left: certificate thumbnail.
    if (image) {
      const thumbWrap = element('div', 'certificate-thumb');
      thumbWrap.setAttribute('role', 'button');
      thumbWrap.setAttribute('tabindex', '0');
      thumbWrap.setAttribute('aria-label', `View the ${certificate.title} certificate`);
      thumbWrap.dataset.certIndex = String(index);

      const img = document.createElement('img');
      img.src = image;
      img.alt = certificate.imageAlt || `${certificate.title} certificate.`;
      img.loading = 'lazy';
      img.decoding = 'async';
      thumbWrap.appendChild(img);

      const cue = element('span', 'certificate-thumb__cue');
      cue.setAttribute('aria-hidden', 'true');
      cue.appendChild(icon('i-arrow-up-right'));
      thumbWrap.appendChild(cue);

      item.appendChild(thumbWrap);
    }

    // Right: metadata, title, summary, actions.
    const body = element('div', 'certificate-body');

    const metaParts = [certificate.issuer, certificate.date].filter(Boolean);
    if (metaParts.length > 0) {
      body.appendChild(element('p', 'certificate-meta', metaParts.join(' · ')));
    }

    const title = element('h3', 'certificate-title', certificate.title);
    title.id = titleId;
    body.appendChild(title);

    if (certificate.summary) {
      body.appendChild(element('p', 'certificate-summary', certificate.summary));
    }

    const actions = element('div', 'certificate-actions');
    if (url) {
      const link = document.createElement('a');
      link.className = 'button button--solid';
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.appendChild(document.createTextNode('Verify credential'));
      link.appendChild(icon('i-arrow-up-right'));
      actions.appendChild(link);
    }
    if (image) {
      const view = document.createElement('a');
      view.className = 'button button--outline';
      view.href = image;
      view.target = '_blank';
      view.rel = 'noopener noreferrer';
      view.appendChild(document.createTextNode('View certificate'));
      view.appendChild(icon('i-arrow-up-right'));
      actions.appendChild(view);
    }
    body.appendChild(actions);

    item.appendChild(body);
    fragment.appendChild(item);
  });

  grid.replaceChildren(fragment);
}

/* --------------------------------------------------------------------------
 * Certificate lightbox modal: open a full certificate image on thumbnail click.
 * ------------------------------------------------------------------------ */
const certModal = document.getElementById('certificate-modal');
const certModalClose = document.getElementById('certificate-modal-close');
const certModalImage = document.getElementById('certificate-modal-image');
const certModalCaption = document.getElementById('certificate-modal-caption');
let certModalOpen = false;

function openCertModal(index) {
  const cert = certificates[index];
  if (!cert || !certModal) return;
  certModalImage.src = cert.image;
  certModalImage.alt = cert.imageAlt || cert.title;
  const datePart = cert.date ? ` · ${cert.date}` : '';
  certModalCaption.textContent = `${cert.title} — ${cert.issuer}${datePart}`;
  certModal.hidden = false;
  document.body.classList.add('cert-modal-open');
  window.requestAnimationFrame(() => certModal.classList.add('is-open'));
  certModalOpen = true;
}

function closeCertModal() {
  if (!certModalOpen) return;
  certModal.classList.remove('is-open');
  document.body.classList.remove('cert-modal-open');
  certModalOpen = false;
  certModalTimer = window.setTimeout(() => {
    certModal.hidden = true;
    certModalTimer = null;
  }, reduceMotion ? 0 : 250);
}

let certModalTimer = null;

function initCertModal() {
  const grid = document.getElementById('certificates-grid');
  if (!grid || !certModal) return;

  grid.addEventListener('click', (event) => {
    const thumb = event.target.closest('[data-cert-index]');
    if (thumb) openCertModal(thumb.dataset.certIndex);
  });

  grid.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const thumb = event.target.closest('[data-cert-index]');
      if (thumb) openCertModal(thumb.dataset.certIndex);
    }
  });

  certModalClose?.addEventListener('click', closeCertModal);

  certModal?.addEventListener('click', (event) => {
    if (event.target === certModal) closeCertModal();
  });

  document.addEventListener('keydown', (event) => {
    if (!certModalOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCertModal();
    }
  });
}

/* --------------------------------------------------------------------------
 * Hero role and local time
 * ------------------------------------------------------------------------ */
function initTypedRole() {
  const typed = document.querySelector('[data-typed]');
  if (!typed) return;

  const phrases = [
    'Student Developer',
    'Computer Engineering Student',
    'final year',
    'Learning by building',
    'open to work',
    'quick learner',
  ];

  typed.textContent = phrases[0];
  if (reduceMotion) return;

  let phraseIndex = 0;
  let charIndex = phrases[0].length;
  let deleting = true;
  let timer = null;

  function tick() {
    timer = null;
    const phrase = phrases[phraseIndex];

    if (deleting) {
      charIndex = Math.max(0, charIndex - 1);
      typed.textContent = phrase.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        timer = window.setTimeout(tick, 420);
      } else {
        timer = window.setTimeout(tick, 30);
      }
      return;
    }

    charIndex += 1;
    typed.textContent = phrase.slice(0, charIndex);
    if (charIndex === phrase.length) {
      deleting = true;
      timer = window.setTimeout(tick, 2000);
    } else {
      timer = window.setTimeout(tick, 58);
    }
  }

  timer = window.setTimeout(tick, 2000);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (timer) window.clearTimeout(timer);
      timer = null;
    } else if (!timer) {
      timer = window.setTimeout(tick, 500);
    }
  });
}

function initLocalClock() {
  const clock = document.getElementById('local-clock');
  if (!clock) return;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  function update() {
    clock.textContent = `${formatter.format(new Date())} IST`;
  }

  update();
  window.setInterval(update, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) update();
  });
}

/* --------------------------------------------------------------------------
 * Navigation and full-screen menu
 * ------------------------------------------------------------------------ */
const header = document.getElementById('site-header');
const brand = document.querySelector('.brand');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('primary-menu');
const navLinks = navMenu ? Array.from(navMenu.querySelectorAll('a[href^="#"]')) : [];
const menuBackgroundNodes = [
  brand,
  document.querySelector('main'),
  document.querySelector('.site-footer'),
  document.getElementById('back-to-top'),
].filter(Boolean);

let navOpen = false;

function getMenuFocusableElements() {
  if (!navToggle || !navMenu) return [];
  return [
    navToggle,
    ...Array.from(navMenu.querySelectorAll('a[href], button:not([disabled])')),
  ].filter((node) => node.offsetParent !== null);
}

function setNavOpen(open, restoreFocus = true) {
  if (!navToggle || !navMenu || open === navOpen) return;

  navOpen = open;
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  navToggle.classList.toggle('is-open', open);
  navMenu.classList.toggle('is-open', open);
  navMenu.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('menu-open', open);
  menuBackgroundNodes.forEach((node) => {
    if (open) node.setAttribute('inert', '');
    else node.removeAttribute('inert');
  });

  if (open) {
    navMenu.removeAttribute('inert');
    window.setTimeout(() => {
      if (navOpen && navLinks[0]) navLinks[0].focus({ preventScroll: true });
    }, 80);
  } else {
    if (restoreFocus) navToggle.focus({ preventScroll: true });
    navMenu.setAttribute('inert', '');
  }
}

function initNavigation() {
  if (!navToggle || !navMenu) return;

  navToggle.addEventListener('click', () => setNavOpen(!navOpen));

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const target = document.querySelector(link.getAttribute('href'));
      setNavOpen(false, false);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });

  brand?.addEventListener('click', () => {
    if (navOpen) setNavOpen(false, false);
  });

  document.addEventListener('keydown', (event) => {
    if (!navOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setNavOpen(false);
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getMenuFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (active === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    } else if (active === first && event.shiftKey) {
      event.preventDefault();
      last.focus();
    } else if (!navMenu.contains(active) && active !== navToggle) {
      event.preventDefault();
      first.focus();
    }
  });

  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function setActiveSection(id) {
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function updateActiveSection() {
    if (sections.length === 0) return;

    const probe = window.scrollY + (header ? header.offsetHeight : 76) + 120;
    let current = sections[0];

    sections.forEach((section) => {
      const top = section.getBoundingClientRect().top + window.scrollY;
      if (top <= probe) current = section;
    });

    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
      current = sections[sections.length - 1];
    }

    setActiveSection(current.id);
  }

  updateActiveSection();
  window.addEventListener('resize', updateActiveSection);
  return updateActiveSection;
}

/* --------------------------------------------------------------------------
 * Scroll effects: header shadow, back-to-top, active section
 * ------------------------------------------------------------------------ */
const backToTopButton = document.getElementById('back-to-top');
const siteFooter = document.querySelector('.site-footer');
const scrollProgressBar = document.querySelector('.scroll-progress span');
let updateActiveSection = () => {};

function initScrollEffects() {
  let ticking = false;

  function update() {
    const scrollY = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('is-scrolled', scrollY > 8);

    if (backToTopButton) {
      const footerInView = siteFooter ? siteFooter.getBoundingClientRect().top < window.innerHeight : false;
      backToTopButton.classList.toggle('is-visible', scrollY > 480 && !footerInView);
      backToTopButton.classList.toggle('is-hidden', footerInView);
    }

    if (scrollProgressBar) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(scrollY / scrollable, 1) : 0;
      scrollProgressBar.style.transform = `scaleX(${progress})`;
    }

    updateActiveSection();
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  if (backToTopButton) {
    backToTopButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: scrollBehavior() });
      const hero = document.getElementById('home');
      if (hero) hero.focus({ preventScroll: true });
    });
  }
}

/* --------------------------------------------------------------------------
 * Scroll reveal (progressive enhancement: content is visible without JS)
 * ------------------------------------------------------------------------ */
function initReveal() {
  const targets = Array.from(document.querySelectorAll('[data-reveal]:not([data-reveal-ready])'));
  if (targets.length === 0) return;

  targets.forEach((target) => {
    target.dataset.revealReady = 'true';
    target.classList.add('reveal');
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach((target) => target.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -36px 0px' }
  );

  targets.forEach((target) => observer.observe(target));

  // Safety net: never leave content invisible if an observer event is missed.
  window.setTimeout(() => {
    targets.forEach((target) => target.classList.add('is-visible'));
  }, 4000);
}

/* --------------------------------------------------------------------------
 * Contact form
 * ------------------------------------------------------------------------ */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitButton = document.getElementById('contact-submit');
  const submitLabel = submitButton?.querySelector('.btn-label');
  const statusNode = document.getElementById('form-status');

  const fields = {
    name: {
      input: document.getElementById('name'),
      error: document.getElementById('name-error'),
      validate(value) {
        if (!value) return 'Please enter your name.';
        if (value.length < 2) return 'Please enter at least 2 characters for your name.';
        if (value.length > 80) return 'Your name must be 80 characters or fewer.';
        return '';
      },
    },
    email: {
      input: document.getElementById('email'),
      error: document.getElementById('email-error'),
      validate(value) {
        if (!value) return 'Please enter your email address.';
        if (value.length > 254 || !EMAIL_PATTERN.test(value)) return 'Please enter a valid email address.';
        return '';
      },
    },
    subject: {
      input: document.getElementById('subject'),
      error: document.getElementById('subject-error'),
      validate(value) {
        if (!value) return 'Please add a subject.';
        if (value.length < 3) return 'Please use at least 3 characters for the subject.';
        if (value.length > 120) return 'The subject must be 120 characters or fewer.';
        return '';
      },
    },
    message: {
      input: document.getElementById('message'),
      error: document.getElementById('message-error'),
      validate(value) {
        if (!value) return 'Please write a message.';
        if (value.length < 10) return 'Please write at least 10 characters.';
        if (value.length > 3000) return 'Your message must be 3000 characters or fewer.';
        return '';
      },
    },
  };

  const fieldNames = Object.keys(fields);
  let isSubmitting = false;

  function setFieldError(name, message) {
    const field = fields[name];
    if (!field?.input || !field.error) return;

    const hasError = Boolean(message);
    field.input.classList.toggle('is-invalid', hasError);
    field.input.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    field.error.textContent = message;
    field.error.classList.toggle('is-visible', hasError);
  }

  function validateField(name) {
    const field = fields[name];
    if (!field?.input) return '';
    const value = field.input.value.trim();
    const message = field.validate(value);
    setFieldError(name, message);
    return message;
  }

  function setStatus(type, message) {
    if (!statusNode) return;
    statusNode.className = 'form-status';
    statusNode.textContent = message;
    if (type) statusNode.classList.add('is-visible', `is-${type}`);
  }

  function setSubmitting(submitting) {
    isSubmitting = submitting;
    if (!submitButton) return;
    submitButton.disabled = submitting;
    submitButton.classList.toggle('is-loading', submitting);
    if (submitLabel) submitLabel.textContent = submitting ? 'Sending...' : 'Send message';
  }

  fieldNames.forEach((name) => {
    const field = fields[name];
    if (!field?.input) return;

    field.input.setAttribute('aria-invalid', 'false');

    field.input.addEventListener('blur', () => {
      if (field.input.value.trim() === '' && !field.input.classList.contains('is-invalid')) return;
      field.input.dataset.touched = 'true';
      validateField(name);
    });

    field.input.addEventListener('input', () => {
      if (field.input.dataset.touched === 'true') validateField(name);
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setStatus(null, '');

    let firstInvalid = null;

    fieldNames.forEach((name) => {
      const field = fields[name];
      if (!field?.input) return;
      field.input.dataset.touched = 'true';
      const message = validateField(name);
      if (message && !firstInvalid) firstInvalid = field.input;
    });

    if (firstInvalid) {
      setStatus('error', 'Please fix the highlighted fields and try again.');
      firstInvalid.focus();
      return;
    }

    const payload = {
      name: fields.name.input.value.trim(),
      email: fields.email.input.value.trim(),
      subject: fields.subject.input.value.trim(),
      message: fields.message.input.value.trim(),
      website: document.getElementById('website')?.value || '',
    };

    setSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (data && data.errors && typeof data.errors === 'object') {
        Object.entries(data.errors).forEach(([name, message]) => {
          if (fields[name]) setFieldError(name, String(message));
        });
      }

      if (response.ok && data?.ok) {
        if (data.delivered) {
          setStatus('success', data.message || 'Your message was sent successfully.');
          form.reset();
          fieldNames.forEach((name) => {
            setFieldError(name, '');
            if (fields[name].input) fields[name].input.dataset.touched = 'false';
          });
        } else {
          setStatus('info', data.message || 'Email delivery is not configured yet. Please email laijojose05@gmail.com directly.');
        }
      } else if (response.status === 429) {
        setStatus('error', data?.message || 'Too many messages. Please try again later.');
      } else if (response.status === 400) {
        setStatus('error', data?.message || 'Please check the form and try again.');
        const firstServerField = fieldNames.find((name) => fields[name].input?.classList.contains('is-invalid'));
        if (firstServerField) fields[firstServerField].input.focus();
      } else {
        setStatus('error', data?.message || 'Your message could not be sent. Please email laijojose05@gmail.com directly.');
      }
    } catch {
      setStatus('error', 'Could not reach the server. Please check your connection or email laijojose05@gmail.com directly.');
    } finally {
      setSubmitting(false);
    }

    if (statusNode && statusNode.classList.contains('is-visible')) {
      statusNode.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
    }
  });
}

/* --------------------------------------------------------------------------
 * Technologies marquee: seamless right-to-left scrolling skill cards.
 * Clones the skill set enough to cover the viewport plus one full cycle,
 * then animates one set width so the loop is seamless.
 * ------------------------------------------------------------------------ */
function initSkillsMarquee() {
  if (reduceMotion) return;
  const grid = document.querySelector('ul.skill-grid[aria-label="Technologies Laijo is learning and using"]');
  if (!grid || grid.classList.contains('skill-marquee-init')) return;

  const originals = Array.from(grid.querySelectorAll('.skill-card'));
  if (originals.length === 0) return;

  originals.forEach((card) => card.removeAttribute('data-reveal'));
  const masterHTML = originals.map((card) => card.outerHTML).join('');
  if (!masterHTML) return;
  originals.forEach((card) => card.remove());

  let masterSet = masterHTML;

  function build() {
    const existing = grid.querySelector('.skill-track');
    if (existing) existing.remove();

    const track = document.createElement('div');
    track.className = 'skill-track';
    const containerWidth = grid.clientWidth || 0;

    track.innerHTML = masterSet;
    grid.appendChild(track);

    const oneSetWidth = track.scrollWidth || 0;
    if (!oneSetWidth) {
      track.remove();
      return;
    }

    const copies = Math.max(2, Math.ceil((oneSetWidth + containerWidth) / oneSetWidth));
    track.innerHTML = '';
    for (let i = 0; i < copies; i++) {
      track.insertAdjacentHTML('beforeend', masterSet);
    }

    track.style.setProperty('--skill-set-width', `${Math.round(oneSetWidth)}px`);
    const duration = Math.max(15, Math.min(40, oneSetWidth / 100));
    track.style.setProperty('--skill-duration', `${duration}s`);
    track.style.animation = `skillMarquee ${duration}s linear infinite`;
    track.style.animationPlayState = "";
  }

  build();

  grid.addEventListener('mouseenter', () => {
    const t = grid.querySelector('.skill-track');
    if (t) t.style.animationPlayState = 'paused';
  });

  grid.addEventListener('mouseleave', () => {
    const t = grid.querySelector('.skill-track');
    if (t) t.style.animationPlayState = 'running';
  });

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(build).observe(grid);
  } else {
    window.addEventListener('resize', build);
  }

  grid.classList.add('skill-marquee', 'skill-marquee-init');
}

/* --------------------------------------------------------------------------
 * Initialise everything
 * ------------------------------------------------------------------------ */
if (projectsGrid) {
  renderProjects();
  initFilters();
  initModal();
}

renderCertificates();

const navUpdater = initNavigation();
if (typeof navUpdater === 'function') updateActiveSection = navUpdater;

initScrollEffects();
initSkillsMarquee();
initReveal();
initContactForm();
initTypedRole();
initLocalClock();
initHeroParticles();
initHeroScrollParallax();


/* --------------------------------------------------------------------------
 * Hero Floating Particles Canvas
 * ------------------------------------------------------------------------ */
function initHeroParticles() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width, height;
  const PARTICLE_COUNT = 50;
  const particles = [];

  function resize() {
    const hero = canvas.closest('.hero');
    if (!hero) return;
    width = hero.offsetWidth;
    height = hero.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticle(randomY) {
    return {
      x: Math.random() * (width || window.innerWidth),
      y: randomY ? Math.random() * (height || window.innerHeight) : (height || window.innerHeight) + Math.random() * 40,
      radius: Math.random() * 2.2 + 0.6,
      speedY: -(Math.random() * 0.35 + 0.12),
      swayAmplitude: Math.random() * 0.6 + 0.2,
      swaySpeed: Math.random() * 0.008 + 0.003,
      swayOffset: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.5 + 0.15,
    };
  }

  resize();
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle(true));
  }

  let animId = null;
  function render() {
    ctx.clearRect(0, 0, width, height);
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const now = performance.now();

    particles.forEach((p, i) => {
      p.y += p.speedY;
      p.x += Math.sin(now * p.swaySpeed + p.swayOffset) * p.swayAmplitude;

      if (p.y < -10) {
        particles[i] = createParticle(false);
        return;
      }

      const color = isLight ? `rgba(224, 109, 68, ${p.opacity})` : `rgba(204, 255, 0, ${p.opacity})`;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    animId = requestAnimationFrame(render);
  }

  animId = requestAnimationFrame(render);
  window.addEventListener('resize', resize);

  const heroSection = canvas.closest('.hero');
  if (heroSection && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animId) {
          animId = requestAnimationFrame(render);
        } else if (!entry.isIntersecting && animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      },
      { threshold: 0 }
    );
    obs.observe(heroSection);
  }
}

/* --------------------------------------------------------------------------
 * Hero Scroll Fade-Out Parallax
 * ------------------------------------------------------------------------ */
function initHeroScrollParallax() {
  if (reduceMotion) return;

  const heroCopy = document.querySelector('.hero__copy');
  const hero = document.querySelector('.hero');
  if (!heroCopy || !hero) return;

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const heroRect = hero.getBoundingClientRect();
      const heroHeight = heroRect.height;
      const scrolled = -heroRect.top;

      if (scrolled < 0 || scrolled > heroHeight) {
        ticking = false;
        return;
      }

      const progress = Math.max(0, Math.min((scrolled - heroHeight * 0.2) / (heroHeight * 0.6), 1));
      const opacity = 1 - progress;
      const translateY = -progress * 60;

      heroCopy.style.opacity = opacity.toFixed(3);
      heroCopy.style.transform = `translateY(${translateY.toFixed(1)}px)`;
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}


/* --------------------------------------------------------------------------
 * Ambient Cursor Spotlight & Subtle Dynamic Parallax
 * ------------------------------------------------------------------------ */
function initAmbientCursor() {
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (!isFinePointer || reduceMotion) return;

  const root = document.documentElement;
  const heroTitle = document.querySelector('.hero__title');
  const cards = Array.from(document.querySelectorAll('.work-thumb, .education-card'));

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let targetX = mouseX;
  let targetY = mouseY;
  let isTicking = false;

  window.addEventListener(
    'mousemove',
    (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      root.style.setProperty('--mouse-opacity', '1');

      // Update card relative coordinate for spotlight border
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        if (
          targetX >= rect.left - 100 &&
          targetX <= rect.right + 100 &&
          targetY >= rect.top - 100 &&
          targetY <= rect.bottom + 100
        ) {
          card.style.setProperty('--card-mouse-x', `${targetX - rect.left}px`);
          card.style.setProperty('--card-mouse-y', `${targetY - rect.top}px`);
        }
      });

      if (!isTicking) {
        isTicking = true;
        window.requestAnimationFrame(updateCursorEffects);
      }
    },
    { passive: true }
  );

  document.addEventListener('mouseleave', () => {
    root.style.setProperty('--mouse-opacity', '0');
    if (heroTitle) heroTitle.style.transform = 'none';
  });

  function updateCursorEffects() {
    // Smooth lerp for ambient fluid lighting
    const ease = 0.12;
    mouseX += (targetX - mouseX) * ease;
    mouseY += (targetY - mouseY) * ease;

    root.style.setProperty('--mouse-x', `${mouseX.toFixed(1)}px`);
    root.style.setProperty('--mouse-y', `${mouseY.toFixed(1)}px`);

    // 3D parallax on hero title when cursor moves across the viewport
    if (heroTitle && window.scrollY < window.innerHeight) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const tiltX = ((mouseX - centerX) / centerX) * 14;
      const tiltY = ((mouseY - centerY) / centerY) * 8;
      const rotY = ((mouseX - centerX) / centerX) * 4;
      const rotX = -((mouseY - centerY) / centerY) * 3;
      heroTitle.style.transform = `perspective(800px) translate3d(${tiltX.toFixed(2)}px, ${tiltY.toFixed(2)}px, 0) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    }

    if (Math.abs(targetX - mouseX) > 0.2 || Math.abs(targetY - mouseY) > 0.2) {
      window.requestAnimationFrame(updateCursorEffects);
    } else {
      isTicking = false;
    }
  }
}

/* --------------------------------------------------------------------------
 * Section Visibility Observer — adds 'is-visible' class to sections
 * ------------------------------------------------------------------------ */
function initSectionObserver() {
  if (typeof IntersectionObserver === 'undefined') return;
  
  const sections = document.querySelectorAll('.section');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );
  
  sections.forEach((section) => observer.observe(section));
}

/* --------------------------------------------------------------------------
 * Stat Number Count-Up Animation
 * ------------------------------------------------------------------------ */
function initStatCountUp() {
  const statNumbers = document.querySelectorAll('.stat-accent');
  if (!statNumbers.length || reduceMotion) return;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          const finalText = entry.target.textContent;
          const finalNum = parseInt(finalText, 10);
          
          if (isNaN(finalNum)) return;
          
          const duration = 1200;
          const startTime = performance.now();
          
          function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * finalNum);
            entry.target.textContent = String(current);
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              entry.target.textContent = finalText;
            }
          }
          
          requestAnimationFrame(animate);
        }
      });
    },
    { threshold: 0.5 }
  );
  
  statNumbers.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
 * Skill Card 3D Tilt on Hover
 * ------------------------------------------------------------------------ */
function initSkillCardTilt() {
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (!isFinePointer || reduceMotion) return;
  
  const cards = document.querySelectorAll('.skill-card');
  
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateX = y * -12;
      const rotateY = x * 12;
      card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.03)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* --------------------------------------------------------------------------
 * Smooth Parallax for Section Titles on Scroll
 * ------------------------------------------------------------------------ */
function initSectionParallax() {
  if (reduceMotion) return;
  
  const titles = document.querySelectorAll('.section-title, .about-title, .work-title, .contact-title');
  if (!titles.length) return;
  
  let ticking = false;
  
  function updateParallax() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    
    titles.forEach((title) => {
      const rect = title.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const offset = (centerY - vh / 2) / vh;
      const translateY = offset * -15;
      title.style.transform = `translateY(${translateY.toFixed(2)}px)`;
    });
    
    ticking = false;
  }
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateParallax);
    }
  }, { passive: true });
}

initSectionObserver();
initStatCountUp();
initSkillCardTilt();
initSectionParallax();
initAmbientCursor();


/* --------------------------------------------------------------------------
 * Theme Switcher: System Theme Follower & Manual Toggle
 * ------------------------------------------------------------------------ */
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
  const STORAGE_KEY = 'portfolio-theme';

  function getEffectiveTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return mediaQuery.matches ? 'light' : 'dark';
  }

  function applyTheme(theme, isManual = false) {
    document.documentElement.setAttribute('data-theme', theme);

    if (isManual) {
      localStorage.setItem(STORAGE_KEY, theme);
    }

    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
      toggleBtn.setAttribute('title', `Switch to ${nextTheme} theme`);
    }

    // Update meta theme-color for mobile address bars
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'light' ? '#f8f7fc' : '#0b0d0c');
    }
  }

  // Initial application from storage or system preference
  applyTheme(getEffectiveTheme());

  // Listen to system preference changes when user has not pinned a manual choice
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'light' : 'dark');
    }
  });

  // Manual toggle click handler
  toggleBtn?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
  });
}

initTheme();

/* --------------------------------------------------------------------------
 * High-End Cinematic Editorial Intro Engine
 * ------------------------------------------------------------------------ */
function initCinematicIntro() {
  const introEl = document.getElementById('cinematic-intro');
  const canvas = document.getElementById('cinematic-canvas');
  const badge = document.querySelector('.cinematic-badge');
  const badgeText = document.getElementById('cinematic-badge-text');
  const firstName = document.querySelector('.cinematic-first');
  const lastName = document.querySelector('.cinematic-last');
  const subText = document.getElementById('cinematic-sub');
  const progressFill = document.getElementById('cinematic-timeline-fill');

  if (!introEl || !canvas) return;

  if (reduceMotion) {
    introEl.style.display = 'none';
    document.body.classList.add('intro-ready');
    return;
  }

  document.body.classList.add('intro-active');

  // Canvas Starfield / Mesh Simulation
  const ctx = canvas.getContext('2d');
  let animationId = null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvas() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
  }
  resizeCanvas();

  let width = window.innerWidth;
  let height = window.innerHeight;

  window.addEventListener('resize', () => {
    if (!introEl.parentNode) return;
    width = window.innerWidth;
    height = window.innerHeight;
    resizeCanvas();
  });

  // Tap anywhere on mobile to smoothly advance/finish intro early if desired
  introEl.addEventListener('touchstart', () => {}, { passive: true });

  const nodes = [];
  const nodeCount = Math.min(width < 600 ? 28 : 60, Math.floor((width * height) / 16000));
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 1.8 + 0.8,
    });
  }

  function renderNodes() {
    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const lineColor = isLight ? '109, 155, 195' : '41, 98, 255';
    const particleColor = isLight ? 'rgba(224, 109, 68, 0.55)' : 'rgba(204, 255, 0, 0.65)';
    const lineAlphaBase = isLight ? 0.16 : 0.12;

    // Draw connecting mesh lines
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.strokeStyle = `rgba(${lineColor}, ${(1 - dist / 140) * lineAlphaBase})`;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0) n.x = width;
      if (n.x > width) n.x = 0;
      if (n.y < 0) n.y = height;
      if (n.y > height) n.y = 0;

      ctx.fillStyle = particleColor;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    if (introEl.parentNode && !introEl.classList.contains('is-dismissed')) {
      animationId = window.requestAnimationFrame(renderNodes);
    }
  }

  animationId = window.requestAnimationFrame(renderNodes);

  // Precision Editorial Sequence Choreography
  let startTime = 0;
  const TOTAL_DURATION = 3200; // 3.2 seconds: punchy, sleek, elegant

  function timelineProgress(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const p = Math.min(elapsed / TOTAL_DURATION, 1);

    if (progressFill) progressFill.style.width = `${(p * 100).toFixed(1)}%`;

    if (p < 1 && !introEl.classList.contains('is-dismissed')) {
      window.requestAnimationFrame(timelineProgress);
    }
  }

  window.requestAnimationFrame(timelineProgress);

  // Beat 1 (0.2s): System badge appears
  window.setTimeout(() => {
    badge?.classList.add('is-visible');
  }, 200);

  // Beat 2 (0.6s): First word 'LAIJO' materializes with optical deblur
  window.setTimeout(() => {
    firstName?.classList.add('is-visible');
  }, 600);

  // Beat 3 (0.9s): Second word 'JOSE.' locks into place alongside it
  window.setTimeout(() => {
    lastName?.classList.add('is-visible');
  }, 900);

  // Beat 4 (1.3s): College & engineering status line lights up
  window.setTimeout(() => {
    if (badgeText) badgeText.textContent = 'ONLINE // READY';
    subText?.classList.add('is-visible');
  }, 1300);

  // Beat 5 (2.5s): FLUID DISSOLVE & SEAMLESS REVEAL
  // The intro overlay dissolves cleanly so LAIJO JOSE is already in place on the website!
  window.setTimeout(() => {
    introEl.classList.add('is-dismissed');
    document.body.classList.remove('intro-active');
    document.body.classList.add('intro-ready');

    window.setTimeout(() => {
      if (animationId) window.cancelAnimationFrame(animationId);
      introEl.remove();
    }, 800);
  }, 2500);
}

initCinematicIntro();
