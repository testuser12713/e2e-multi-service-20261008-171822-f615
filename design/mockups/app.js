(function () {
  'use strict';

  var ANALYSIS_HINTS = {
    word_count: 'Wörter zählen',
    top_words: 'häufigste Wörter',
    reading_time: 'geschätzte Lesezeit'
  };

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function stamp() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function stampSeconds() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function newId() {
    return Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function showBanner(html) {
    var existing = document.querySelector('.js-error-banner');
    if (existing) existing.remove();
    var banner = document.createElement('div');
    banner.className = 'error-banner js-error-banner';
    banner.setAttribute('role', 'alert');
    banner.innerHTML =
      '<span class="error-icon" aria-hidden="true">!</span>' +
      '<div class="error-body">' + html + '</div>' +
      '<button type="button" class="error-close js-error-close" aria-label="Schließen">&times;</button>';
    var main = document.querySelector('main');
    if (main) main.insertBefore(banner, main.firstChild);
    else document.body.insertBefore(banner, document.body.firstChild);
    banner.querySelector('.js-error-close').addEventListener('click', function () {
      banner.remove();
    });
  }

  function wireTextToggle(textEl) {
    var card = textEl.closest('.job-card');
    var toggle = card ? card.querySelector('.js-job-toggle') : null;
    function sync() {
      var expanded = textEl.classList.contains('is-expanded');
      textEl.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      if (toggle) {
        var clamped = textEl.scrollHeight > textEl.clientHeight + 1;
        if (!clamped && !expanded) {
          toggle.style.display = 'none';
        } else {
          toggle.style.display = '';
        }
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        toggle.textContent = expanded ? 'Weniger anzeigen' : 'Mehr anzeigen';
      }
    }
    function flip() {
      textEl.classList.toggle('is-expanded');
      sync();
    }
    textEl.addEventListener('click', flip);
    textEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
    if (toggle) toggle.addEventListener('click', flip);
    sync();
  }

  function addJobCard(text, analysis) {
    var list = document.querySelector('.js-job-list');
    if (!list) return;
    var empty = document.querySelector('.empty-state');
    if (empty) empty.remove();

    var card = document.createElement('article');
    card.className = 'job-card is-new';
    card.setAttribute('data-od-id', 'job-card-new');
    card.innerHTML =
      '<div class="job-top">' +
        '<span class="badge badge-pending"><span class="badge-dot"></span>wartend</span>' +
        '<span class="job-meta">#' + newId() + ' · ' + stamp() + '</span>' +
      '</div>' +
      '<p class="job-text js-job-text" tabindex="0" role="button" aria-expanded="false">' + escapeHtml(text) + '</p>' +
      '<button type="button" class="job-toggle js-job-toggle" aria-expanded="false">Mehr anzeigen</button>' +
      '<div class="job-analysis">' + escapeHtml(analysis) + ' — ' + (ANALYSIS_HINTS[analysis] || '') + '</div>' +
      '<div class="job-result is-pending">Warte auf Worker…<span class="progress" aria-hidden="true"></span></div>';
    list.insertBefore(card, list.firstChild);
    wireTextToggle(card.querySelector('.js-job-text'));
    setTimeout(function () { card.classList.remove('is-new'); }, 600);
  }

  function wireForm(form) {
    var ta = form.querySelector('.js-job-text');
    var sel = form.querySelector('.js-analysis');
    var counter = form.querySelector('.js-char-counter');
    var submit = form.querySelector('.js-submit');
    var label = submit ? submit.querySelector('.js-submit-label') : null;
    var err = form.querySelector('.field-error');

    function update() {
      if (counter) counter.textContent = ta.value.length + ' Zeichen';
      var empty = ta.value.trim().length === 0;
      if (submit) {
        submit.disabled = empty;
        submit.setAttribute('aria-disabled', empty ? 'true' : 'false');
        if (label) label.textContent = empty ? 'Auftrag anlegen (Text erforderlich)' : 'Auftrag anlegen';
      }
      if (!empty && ta.classList.contains('is-invalid')) {
        ta.classList.remove('is-invalid');
        if (err) err.classList.remove('is-visible');
      }
    }

    ta.addEventListener('input', update);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = ta.value.trim();
      var mode = form.getAttribute('data-submit-mode') || 'add';
      if (!text) {
        ta.classList.add('is-invalid');
        if (err) err.classList.add('is-visible');
        showBanner('<strong>Übermittlung fehlgeschlagen.</strong> Die API hat den Text abgelehnt (400).');
        return;
      }
      if (mode === 'unreachable') {
        showBanner('<strong>API nicht erreichbar.</strong> Auftrag konnte nicht angelegt werden.');
        var refresh = document.querySelector('.js-refresh-status');
        if (refresh) { refresh.classList.add('is-error'); refresh.textContent = 'Auto-Aktualisierung pausiert — neuer Versuch'; }
        return;
      }
      addJobCard(text, sel ? sel.value : 'word_count');
      ta.value = '';
      update();
      ta.focus();
    });

    var example = document.querySelector('[data-example-text]');
    if (example && !example.getAttribute('data-wired')) {
      example.setAttribute('data-wired', '1');
      example.addEventListener('click', function () {
        ta.value = example.getAttribute('data-example-text');
        update();
        ta.focus();
      });
    }

    update();
  }

  document.querySelectorAll('form.js-job-form').forEach(wireForm);
  document.querySelectorAll('.job-text.js-job-text').forEach(wireTextToggle);
  document.querySelectorAll('.js-error-close').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var banner = btn.closest('.js-error-banner');
      if (banner) banner.remove();
    });
  });
  document.querySelectorAll('.js-retry').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var banner = btn.closest('.js-error-banner');
      if (banner) banner.remove();
      var health = document.querySelector('.js-health-chip');
      if (health) health.innerHTML = '<span class="health-dot is-ok"></span>API ok';
      var refresh = document.querySelector('.js-refresh-status');
      if (refresh) {
        refresh.classList.remove('is-error');
        refresh.textContent = 'Auto-Aktualisierung alle 5 s · letzte Aktualisierung ' + stampSeconds();
      }
    });
  });
})();
