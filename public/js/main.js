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
 * Certificates
 * ------------------------------------------------------------------------ */
function renderCertificates() {
  const grid = document.getElementById('certificates-grid');
  if (!grid || !Array.isArray(certificates) || certificates.length === 0) return;

  const fragment = document.createDocumentFragment();

  certificates.forEach((certificate) => {
    const card = element('article', 'certificate-card');
    const iconBox = element('span', 'certificate-icon');
    iconBox.appendChild(icon('i-award'));

    const body = element('div', 'certificate-body');
    body.appendChild(element('h3', 'certificate-title', certificate.title));

    const metaParts = [certificate.issuer, certificate.date].filter(Boolean);
    if (metaParts.length > 0) {
      body.appendChild(element('p', 'certificate-meta', metaParts.join(' · ')));
    }

    const url = safeExternalUrl(certificate.url);
    if (url) {
      const link = document.createElement('a');
      link.className = 'certificate-link';
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.appendChild(document.createTextNode('View credential'));
      link.appendChild(icon('i-external'));
      body.appendChild(link);
    }

    card.appendChild(iconBox);
    card.appendChild(body);
    fragment.appendChild(card);
  });

  grid.replaceChildren(fragment);
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
    'Web Developer in training',
    'Learning by building',
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
let updateActiveSection = () => {};

function initScrollEffects() {
  let ticking = false;

  function update() {
    const scrollY = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('is-scrolled', scrollY > 8);

    if (backToTopButton) {
      backToTopButton.classList.toggle('is-visible', scrollY > 480);
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
initReveal();
initContactForm();
initTypedRole();
initLocalClock();
