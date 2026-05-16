// main.js – Gemeinsame Funktionen für alle öffentlichen Seiten

localStorage.removeItem('siteData');
localStorage.removeItem('adminPasswordHash');

document.addEventListener('DOMContentLoaded', function () {

  // --- Ticker Text ---
  var tickerEl = document.getElementById('tickerText');
  if (tickerEl && siteData.global) tickerEl.textContent = siteData.global.lauftext;

  // --- Kontaktdaten dynamisch befüllen ---
  var k = siteData.kontakt;
  document.querySelectorAll('[data-contact="telefon"]').forEach(function(el) {
    el.textContent = k.telefon;
    if (el.tagName === 'A') el.href = 'tel:' + k.telefon.replace(/[^+\d]/g, '');
  });
  document.querySelectorAll('[data-contact="mobil"]').forEach(function(el) {
    el.textContent = k.mobil;
    if (el.tagName === 'A') el.href = 'tel:' + k.mobil.replace(/[^+\d]/g, '');
  });
  document.querySelectorAll('[data-contact="email"]').forEach(function(el) {
    el.textContent = k.email;
    if (el.tagName === 'A') el.href = 'mailto:' + k.email;
  });
  document.querySelectorAll('[data-contact="name"]').forEach(function(el) {
    el.textContent = k.name;
  });
  document.querySelectorAll('[data-contact="adresse"]').forEach(function(el) {
    el.textContent = k.strasse + ', ' + k.plz + ' ' + k.ort;
  });

  // --- Submenu Hover ---
  document.querySelectorAll('.dropdown-submenu').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      var m = this.querySelector('.dropdown-menu');
      if (m) m.classList.add('show');
    });
    el.addEventListener('mouseleave', function() {
      var m = this.querySelector('.dropdown-menu');
      if (m) m.classList.remove('show');
    });
  });

  // --- IntersectionObserver Fade-in ---
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.fade-up').forEach(function(el) { observer.observe(el); });

  // --- GLightbox ---
  if (typeof GLightbox !== 'undefined') {
    GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true, keyboardNavigation: true });
  }

  // --- 2-Click Google Maps Consent ---
  document.querySelectorAll('.map-load-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var container = this.closest('.map-container');
      var overlay   = container.querySelector('.map-consent-overlay');
      var iframe    = container.querySelector('iframe');
      if (iframe && iframe.dataset.src) iframe.src = iframe.dataset.src;
      if (overlay) overlay.classList.add('hidden');
    });
  });

  // --- Floating Contact Button ---
  _erstelleFloatButton(k);

});

function _erstelleFloatButton(k) {
  var tel   = 'tel:' + k.telefon.replace(/[^+\d]/g, '');
  var mail  = 'mailto:' + k.email;

  var wrap = document.createElement('div');
  wrap.className = 'float-kontakt';
  wrap.setAttribute('aria-label', 'Kontakt');
  wrap.innerHTML =
    '<div class="float-kontakt-menu" aria-hidden="true">' +
      '<a href="' + mail + '" class="float-kontakt-link">' +
        '<i class="bi bi-envelope-fill" aria-hidden="true"></i><span>E-Mail schreiben</span>' +
      '</a>' +
      '<a href="' + tel + '" class="float-kontakt-link">' +
        '<i class="bi bi-telephone-fill" aria-hidden="true"></i><span>' + k.telefon + '</span>' +
      '</a>' +
    '</div>' +
    '<button class="float-kontakt-btn" aria-expanded="false" aria-label="Kontaktoptionen öffnen">' +
      '<i class="bi bi-telephone-fill"></i>' +
      '<i class="bi bi-x-lg"></i>' +
    '</button>';

  document.body.appendChild(wrap);

  var btn  = wrap.querySelector('.float-kontakt-btn');
  var menu = wrap.querySelector('.float-kontakt-menu');
  var open = false;

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    open = !open;
    wrap.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
  });

  document.addEventListener('click', function(e) {
    if (open && !wrap.contains(e.target)) {
      open = false;
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
      menu.setAttribute('aria-hidden', true);
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && open) {
      open = false;
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
      menu.setAttribute('aria-hidden', true);
      btn.focus();
    }
  });
}

// --- Galerie rendern (allgemein, wird von einigen Seiten genutzt) ---
function renderGallery(bilder, containerId) {
  var el = document.getElementById(containerId);
  if (!el || !bilder || bilder.length === 0) return;
  el.innerHTML = bilder.map(function(b) {
    return '<a href="' + b.url + '" class="gallery-item glightbox" data-gallery="gallery-' + containerId + '" data-glightbox="title: ' + b.alt + '">' +
      '<img src="' + b.url + '" alt="' + b.alt + '" loading="lazy">' +
      '<div class="overlay"><i class="bi bi-zoom-in"></i></div></a>';
  }).join('');
}
