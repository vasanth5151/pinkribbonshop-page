/* ==========================================================================
   Aurelia — Premium Corporate Gifting
   Vanilla JS: header, mobile nav, reveal, carousel, accordion, form, WhatsApp.
   No third-party libraries, no API keys, no credentials.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* SITE CONFIG — edit these three values to go live                    */
  /* ------------------------------------------------------------------ */
  var CONFIG = {
    // WhatsApp number in international format, digits only (country code first).
    whatsappNumber: '919884000783',
    whatsappMessage: 'Hi, I would like to enquire about corporate gift hampers for my company.',
    // Primary line for the header and store "Call Us" buttons. The full list of
    // numbers is in the footer markup, so it is not driven from here.
    phoneNumber: '+919884000783'
  };

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ================================================================== */
  /* 1. WhatsApp + phone links                                          */
  /* ================================================================== */
  function initContactLinks() {
    var base = 'https://wa.me/' + CONFIG.whatsappNumber +
               '?text=' + encodeURIComponent(CONFIG.whatsappMessage);

    $$('[data-whatsapp]').forEach(function (el) { el.href = base; });
    $$('[data-call-link]').forEach(function (el) {
      el.href = 'tel:' + CONFIG.phoneNumber.replace(/[^\d+]/g, '');
    });
  }

  /* ================================================================== */
  /* 2. Sticky header: compact + background on scroll                   */
  /* ================================================================== */
  function initHeader() {
    var header = $('#site-header');
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ================================================================== */
  /* 3. Mobile navigation                                               */
  /* ================================================================== */
  function initMobileNav() {
    var toggle = $('#nav-toggle');
    var nav    = $('#primary-nav');
    var scrim  = $('#nav-scrim');
    if (!toggle || !nav || !scrim) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      scrim.hidden = !open;
      document.body.classList.toggle('is-locked', open);
      if (open) {
        var firstLink = $('.nav__link', nav);
        if (firstLink) firstLink.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    scrim.addEventListener('click', function () { setOpen(false); toggle.focus(); });

    // Close after choosing a destination.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset state if the viewport grows past the mobile breakpoint.
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* ================================================================== */
  /* 4. Active nav link while scrolling                                 */
  /* ================================================================== */
  function initScrollSpy() {
    var links = $$('.nav__link');
    var map = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      var section = document.querySelector(id);
      if (section) { map[id.slice(1)] = link; sections.push(section); }
    });
    if (!sections.length || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        var active = map[entry.target.id];
        if (active) active.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ================================================================== */
  /* 5. Scroll reveal                                                   */
  /* ================================================================== */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ================================================================== */
  /* 6. FAQ accordion — one panel open at a time                        */
  /* ================================================================== */
  function initAccordion() {
    var root = $('#faq-accordion');
    if (!root) return;

    var triggers = $$('.accordion__trigger', root);

    function close(trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      document.getElementById(trigger.getAttribute('aria-controls')).hidden = true;
    }

    function open(trigger) {
      triggers.forEach(function (t) { if (t !== trigger) close(t); });
      trigger.setAttribute('aria-expanded', 'true');
      document.getElementById(trigger.getAttribute('aria-controls')).hidden = false;
    }

    triggers.forEach(function (trigger, i) {
      trigger.addEventListener('click', function () {
        if (trigger.getAttribute('aria-expanded') === 'true') close(trigger);
        else open(trigger);
      });

      // Arrow / Home / End navigation between questions.
      trigger.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown') next = triggers[(i + 1) % triggers.length];
        else if (e.key === 'ArrowUp') next = triggers[(i - 1 + triggers.length) % triggers.length];
        else if (e.key === 'Home') next = triggers[0];
        else if (e.key === 'End') next = triggers[triggers.length - 1];
        if (next) { e.preventDefault(); next.focus(); }
      });
    });

    open(triggers[0]);
  }

  /* ================================================================== */
  /* 7. Testimonial carousel — 3 per page on desktop, 1 on mobile       */
  /* ================================================================== */
  function initCarousel() {
    var root = $('[data-carousel]');
    if (!root) return;

    var track  = $('.carousel__track', root);
    var slides = $$('.testimonial', track);
    var prevBtn = $('[data-carousel-prev]', root);
    var nextBtn = $('[data-carousel-next]', root);
    var dotsBox = $('#carousel-dots');
    if (!track || !slides.length) return;

    var index = 0;
    var perView = 3;
    var pages = 1;
    var gap = 0;

    function computePerView() {
      var w = window.innerWidth;
      if (w <= 640) return 1;
      if (w <= 900) return 2;
      return 3;
    }

    function buildDots() {
      if (!dotsBox) return;
      dotsBox.innerHTML = '';
      for (var i = 0; i < pages; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel__dot';
        dot.setAttribute('aria-label', 'Go to testimonial page ' + (i + 1) + ' of ' + pages);
        dot.dataset.page = String(i);
        dot.addEventListener('click', function (e) {
          goTo(Number(e.currentTarget.dataset.page));
        });
        dotsBox.appendChild(dot);
      }
    }

    function render() {
      // A page is one viewport width plus the gap that follows it.
      track.style.transform =
        'translateX(calc(' + (-index) + ' * (100% + ' + gap + 'px)))';

      slides.forEach(function (slide, i) {
        var visible = i >= index * perView && i < (index + 1) * perView;
        // Keep off-screen cards out of the tab order.
        slide.querySelectorAll('a, button').forEach(function (el) {
          el.tabIndex = visible ? 0 : -1;
        });
      });

      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index >= pages - 1;

      $$('.carousel__dot', dotsBox).forEach(function (dot, i) {
        if (i === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }

    function goTo(next) {
      index = Math.max(0, Math.min(next, pages - 1));
      render();
    }

    function setBasis() {
      slides.forEach(function (slide) {
        slide.style.flexBasis =
          'calc((100% - ' + (perView - 1) * gap + 'px) / ' + perView + ')';
      });
    }

    function layout() {
      var nextPerView = computePerView();
      gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      if (nextPerView === perView && dotsBox && dotsBox.children.length) {
        setBasis();
        render();
        return;
      }
      perView = nextPerView;
      pages = Math.ceil(slides.length / perView);
      index = Math.min(index, pages - 1);

      setBasis();
      buildDots();
      render();
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(index + 1); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1); }
    });

    // Touch swipe
    var startX = 0, startY = 0, tracking = false;
    track.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    track.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        goTo(dx < 0 ? index + 1 : index - 1);
      }
    }, { passive: true });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 150);
    });

    layout();
  }

  /* ================================================================== */
  /* 8. Bulk enquiry form                                               */
  /* ================================================================== */
  function initForm() {
    var form = $('#quote-form');
    if (!form) return;

    var summary = $('#form-summary');
    var success = $('#form-success');
    var submitBtn = $('#quote-submit');

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var PHONE_RE = /^[+]?[\d\s().-]{8,18}$/;

    var RULES = {
      // Optional; still validated for sanity if the visitor fills it in.
      fullName: function (v) {
        if (v && v.length < 2) return 'Please enter at least 2 characters.';
        return '';
      },
      phone: function (v) {
        if (!v) return 'Please enter a phone number.';
        if (!PHONE_RE.test(v)) return 'Please enter a valid phone number.';
        return '';
      },
      workEmail: function (v) {
        if (!v) return 'Please enter your official email address.';
        if (!EMAIL_RE.test(v)) return 'Please enter a valid email address.';
        return '';
      },
      company: function (v) {
        if (!v) return 'Please enter your company name.';
        return '';
      },
      location: function () { return ''; },
      message: function () { return ''; }
    };

    function fieldOf(input) { return input.closest('.field'); }

    function showError(input, message) {
      var wrap = fieldOf(input);
      var errorEl = document.getElementById(input.id + '-error');
      if (wrap) wrap.classList.toggle('has-error', Boolean(message));
      if (errorEl) errorEl.textContent = message;
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function validateField(input) {
      var rule = RULES[input.name];
      if (!rule) return true;
      var message = rule(input.value.trim());
      showError(input, message);
      return !message;
    }

    var inputs = $$('.field__input', form);

    inputs.forEach(function (input) {
      // Validate on blur, then live-correct once the field has an error.
      input.addEventListener('blur', function () { validateField(input); });
      input.addEventListener('input', function () {
        if (fieldOf(input) && fieldOf(input).classList.contains('has-error')) validateField(input);
      });
      if (input.tagName === 'SELECT') {
        input.addEventListener('change', function () { validateField(input); });
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var invalid = inputs.filter(function (input) { return !validateField(input); });

      if (invalid.length) {
        if (summary) {
          summary.textContent = invalid.length === 1
            ? 'Please correct the highlighted field before submitting.'
            : 'Please correct the ' + invalid.length + ' highlighted fields before submitting.';
          summary.hidden = false;
        }
        invalid[0].focus();
        return;
      }

      if (summary) { summary.hidden = true; summary.textContent = ''; }

      var payload = Object.fromEntries(new FormData(form).entries());

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      /* ----------------------------------------------------------------
         Wire this up to your backend or form service. Post to your own
         endpoint — never place API keys or credentials in this file.

         fetch('/api/corporate-enquiry', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
         }).then(...)
      ---------------------------------------------------------------- */
      window.setTimeout(function () {
        if (window.console && console.info) {
          console.info('Corporate enquiry ready to submit:', payload);
        }
        form.hidden = true;
        if (success) {
          success.hidden = false;
          success.focus();
        }
      }, 650);
    });

    // Pre-fill the message when a product card's "Request Quote" is used.
    $$('[data-quote-cta]').forEach(function (cta) {
      cta.addEventListener('click', function () {
        var messageField = $('#message');
        var product = cta.getAttribute('data-quote-cta');
        if (messageField && !messageField.value.trim()) {
          messageField.value = 'I am interested in the ' + product + '. Please share bulk pricing and branding options.';
        }
      });
    });
  }

  /* ================================================================== */
  /* 9. Mobile sticky CTA — hide while the enquiry form is on screen    */
  /* ================================================================== */
  function initMobileCta() {
    var bar = $('#mobile-cta');
    var hero = $('#hero');
    var quote = $('#quote');
    if (!bar || !('IntersectionObserver' in window)) return;

    var pastHero = false;
    var onQuote = false;

    function apply() {
      bar.classList.toggle('is-visible', pastHero && !onQuote);
    }

    if (hero) {
      new IntersectionObserver(function (entries) {
        pastHero = !entries[0].isIntersecting;
        apply();
      }, { threshold: 0 }).observe(hero);
    }

    if (quote) {
      new IntersectionObserver(function (entries) {
        onQuote = entries[0].isIntersecting;
        apply();
      }, { threshold: 0 }).observe(quote);
    }
  }

  /* ================================================================== */
  /* 10. Footer year                                                    */
  /* ================================================================== */
  function initYear() {
    var el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ================================================================== */
  /* Boot                                                               */
  /* ================================================================== */
  function init() {
    initContactLinks();
    initHeader();
    initMobileNav();
    initScrollSpy();
    initReveal();
    initAccordion();
    initCarousel();
    initForm();
    initMobileCta();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
