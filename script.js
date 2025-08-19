(function() {
  const EVENT_DATE = new Date('2025-08-27T18:00:00+02:00');
  // Optionnel : ton URL Google Apps Script si tu veux aussi envoyer là-bas
  const APPS_SCRIPT_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  function updateCountdown() {
    const now = new Date();
    const diff = Math.max(0, EVENT_DATE.getTime() - now.getTime());

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const dd = document.getElementById('dd');
    const hh = document.getElementById('hh');
    const mm = document.getElementById('mm');
    const ss = document.getElementById('ss');

    if (dd && hh && mm && ss) {
      dd.textContent = pad(days);
      hh.textContent = pad(hours);
      mm.textContent = pad(minutes);
      ss.textContent = pad(seconds);
    }
  }

  function emailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
  }

  function handleFormSubmit(form, messageEl, button) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(form);
      const firstName = String(formData.get('firstName') || '').trim();
      const email = String(formData.get('email') || '').trim();

      if (firstName.length < 2) {
        messageEl.textContent = 'Merci d’indiquer votre prénom.';
        return;
      }
      if (!emailValid(email)) {
        messageEl.textContent = 'Merci d’indiquer un email valide.';
        return;
      }

      button.disabled = true;
      messageEl.textContent = 'Inscription en cours…';

      // 👉 ENVOI À NETLIFY FORMS
      fetch("/", {
        method: "POST",
        body: formData
      })
      .then(() => {
        try {
          // Stockage local pour ton usage
          const leads = JSON.parse(localStorage.getItem('leads') || '[]');
          leads.push({ firstName, email, ts: Date.now() });
          localStorage.setItem('leads', JSON.stringify(leads));

          // Fire-and-forget vers Google Sheets via Apps Script
          if (APPS_SCRIPT_URL && APPS_SCRIPT_URL.indexOf('http') === 0) {
            const payload = new FormData();
            payload.append('firstName', firstName);
            payload.append('email', email);
            payload.append('ua', navigator.userAgent || '');
            payload.append('page', location.href || '');
            try {
              fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: payload
              });
            } catch (_) {}
          }
        } catch (_) {}

        messageEl.textContent = 'Merci ! Vous êtes bien inscrit(e). Vous recevrez bientôt toutes les infos du live.';
        form.reset();
      })
      .catch(() => {
        messageEl.textContent = 'Une erreur est survenue, merci de réessayer.';
      })
      .finally(() => {
        button.disabled = false;
      });
    });
  }

  function buildGoogleCalendarLink(dateObj) {
    const start = dateObj.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const endDate = new Date(dateObj.getTime() + 60 * 60 * 1000);
    const end = endDate.toISOString().replace(/[-:]|\.\d{3}/g, '');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: 'Live — Deviens gestionnaire Airbnb en 60 jours',
      dates: start + '/' + end,
      details: "Pas de replay, pas de deuxième chance. C’est mercredi soir en live – ou jamais.",
      location: 'En ligne'
    });
    return 'https://www.google.com/calendar/render?' + params.toString();
  }

  function initCalendarLink() {
    const link = document.getElementById('calendarLink');
    if (link) {
      link.href = buildGoogleCalendarLink(EVENT_DATE);
      link.target = '_blank';
      link.rel = 'noopener';
    }
  }

  function initYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function init() {
    updateCountdown();
    setInterval(updateCountdown, 1000);

    var topForm = document.getElementById('lead-form');
    var topMsg = document.getElementById('formMessage');
    var topBtn = document.getElementById('submitBtn');
    if (topForm && topMsg && topBtn) {
      handleFormSubmit(topForm, topMsg, topBtn);
    }

    var botForm = document.getElementById('lead-form-bottom');
    var botMsg = document.getElementById('formMessage2');
    var botBtn = document.getElementById('submitBtn2');
    if (botForm && botMsg && botBtn) {
      handleFormSubmit(botForm, botMsg, botBtn);
    }

    initCalendarLink();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
