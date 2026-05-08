// main.js – Gemeinsame Funktionen für alle öffentlichen Seiten

// Veraltete Admin-Daten aus dem Browser-Speicher löschen
localStorage.removeItem('siteData');
localStorage.removeItem('adminPasswordHash');

document.addEventListener('DOMContentLoaded', function () {

  // --- Ticker Text ---
  var tickerEl = document.getElementById('tickerText');
  if (tickerEl && siteData.global) {
    tickerEl.textContent = siteData.global.lauftext;
  }

  // --- Kontaktdaten dynamisch befüllen (data-contact="...") ---
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

  // --- Mobile CTA Bar ---
  document.querySelectorAll('.cta-phone').forEach(function(el) {
    el.href = 'tel:' + k.telefon.replace(/[^+\d]/g, '');
    var span = el.querySelector('span');
    if (span) span.textContent = k.telefon;
  });
  document.querySelectorAll('.cta-email').forEach(function(el) {
    el.href = 'mailto:' + k.email;
    var span = el.querySelector('span');
    if (span) span.textContent = k.email;
  });

  // --- Submenu Hover ---
  document.querySelectorAll('.dropdown-submenu').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      this.querySelector('.dropdown-menu') && this.querySelector('.dropdown-menu').classList.add('show');
    });
    el.addEventListener('mouseleave', function() {
      this.querySelector('.dropdown-menu') && this.querySelector('.dropdown-menu').classList.remove('show');
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
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-up').forEach(function(el) { observer.observe(el); });

  // --- GLightbox ---
  if (typeof GLightbox !== 'undefined') {
    GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true });
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

});

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
