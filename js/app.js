/**
 * Alys Café — Interactive Workstation Manager (js/app.js)
 * Features:
 * - Draggable desktop windows with pointer & touch support
 * - Dynamic z-index layering and focus management
 * - Responsive masonry-style window auto-layout ("arrumar a mesa")
 * - Theme switcher (Dia / Café) with localStorage persistence
 * - Bilingual support (PT / EN) with localStorage persistence
 * - Coffee cup click counter with animated steam and toast feedback
 * - Real-time clock
 */

document.addEventListener('DOMContentLoaded', () => {
  // Window Definitions: [id, defaultX, defaultY, defaultWidth]
  const WINDOW_CONFIGS = [
    { id: 'home', x: 80, y: 104, w: 450, open: true },
    { id: 'trajetoria', x: 560, y: 104, w: 450, open: true },
    { id: 'sobre', x: 1040, y: 104, w: 420, open: true },
    { id: 'agora', x: 180, y: 520, w: 430, open: true },
    { id: 'links', x: 650, y: 620, w: 370, open: false },
    { id: 'estante', x: 1040, y: 600, w: 450, open: false },
    { id: 'faq', x: 380, y: 220, w: 440, open: false },
    { id: 'contato', x: 740, y: 240, w: 420, open: false }
  ];

  // State
  let topZ = WINDOW_CONFIGS.length + 10;
  let coffeeCount = 0;
  let toastTimer = null;
  let dragging = null;

  // DOM Elements
  const desk = document.getElementById('desk');
  const toastNotice = document.getElementById('toastNotice');
  const clockElement = document.getElementById('clockText');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');
  const btnLangPt = document.getElementById('btnLangPt');
  const btnLangEn = document.getElementById('btnLangEn');
  const cupBtn = document.getElementById('cupBtn');
  const tidyBtn = document.getElementById('tidyBtn');

  const dockCountBadge = document.getElementById('dockCountBadge');
  const emptyDeskHint = document.getElementById('emptyDeskHint');

  // Stored state for windows
  const windows = {};

  function updateDockStatus() {
    let openCount = 0;
    WINDOW_CONFIGS.forEach(cfg => {
      const win = windows[cfg.id];
      if (!win) return;
      if (win.open) openCount += 1;
      if (win.dockBtn) {
        win.dockBtn.classList.toggle('is-open', win.open);
        win.dockBtn.setAttribute('aria-pressed', String(win.open));
      }
      if (win.dockDot) {
        win.dockDot.classList.toggle('open', win.open);
      }
    });
    if (dockCountBadge) {
      dockCountBadge.textContent = `${openCount}/${WINDOW_CONFIGS.length}`;
    }
    if (emptyDeskHint) {
      if (openCount === 0) {
        if (!emptyDeskHint.classList.contains('visible')) {
          emptyDeskHint.classList.remove('visible');
          void emptyDeskHint.offsetWidth;
          emptyDeskHint.classList.add('visible');
        }
      } else {
        emptyDeskHint.classList.remove('visible');
      }
    }
  }

  WINDOW_CONFIGS.forEach((cfg, index) => {
    const el = document.getElementById(`win-${cfg.id}`);
    const dockBtn = document.querySelector(`.dock-btn[data-window="${cfg.id}"]`);
    const dockDot = dockBtn ? dockBtn.querySelector('.dock-dot') : null;

    windows[cfg.id] = {
      id: cfg.id,
      index,
      el,
      dockBtn,
      dockDot,
      x: cfg.x,
      y: cfg.y,
      w: cfg.w,
      defaultW: cfg.w,
      open: cfg.open,
      z: index + 1,
      closeTimer: null,
      openTimer: null,
      moveTimer: null
    };

    if (el) {
      // Set initial styles
      el.style.zIndex = index + 1;
      el.style.display = cfg.open ? 'block' : 'none';

      // Pointer down to focus
      el.addEventListener('pointerdown', () => {
        focusWindow(cfg.id);
      });

      // Drag header
      const header = el.querySelector('.window-header');
      if (header) {
        header.addEventListener('pointerdown', (e) => {
          if (e.target.closest('button')) return; // Ignore close button
          startDrag(cfg.id, e);
        });
      }

      // Close button
      const closeBtn = el.querySelector('.window-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          closeWindow(cfg.id);
        });
      }
    }
  });

  updateDockStatus();

  // Dock buttons click
  document.querySelectorAll('.dock-btn[data-window]').forEach(btn => {
    btn.addEventListener('click', () => {
      const winId = btn.getAttribute('data-window');
      
      // Close mobile menu if expanded
      const dock = document.getElementById('dock');
      const dockMobileToggle = document.getElementById('dockMobileToggle');
      if (dock && dock.classList.contains('expanded')) {
        dock.classList.remove('expanded');
        if (dockMobileToggle) dockMobileToggle.setAttribute('aria-expanded', 'false');
      }

      toggleWindow(winId);
    });
  });

  // Tidy button
  if (tidyBtn) {
    tidyBtn.addEventListener('click', () => {
      const dock = document.getElementById('dock');
      const dockMobileToggle = document.getElementById('dockMobileToggle');
      if (dock && dock.classList.contains('expanded')) {
        dock.classList.remove('expanded');
        if (dockMobileToggle) dockMobileToggle.setAttribute('aria-expanded', 'false');
      }
      tidyDesk({ animate: true, notify: true });
    });
  }

  // Mobile Dock Toggle
  const dockMobileToggle = document.getElementById('dockMobileToggle');
  const dock = document.getElementById('dock');
  if (dockMobileToggle && dock) {
    dockMobileToggle.addEventListener('click', () => {
      const isExpanded = dock.classList.toggle('expanded');
      dockMobileToggle.setAttribute('aria-expanded', String(isExpanded));
    });
  }

  // Window Drag Handlers
  function startDrag(id, e) {
    if (e.button !== 0) return; // Left click only
    if (window.innerWidth < 820) return; // Desabilita drag em telas pequenas (mobile)
    
    focusWindow(id);
    const win = windows[id];
    if (win && win.el) {
      win.el.classList.remove('animating-move', 'tidying');
      win.el.classList.add('dragging');
    }
    dragging = {
      id,
      dx: e.pageX - win.x,
      dy: e.pageY - win.y
    };
    e.preventDefault();
  }

  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const win = windows[dragging.id];
    if (!win || !win.el) return;

    const newX = Math.max(-win.w + 100, Math.min(e.pageX - dragging.dx, window.innerWidth - 80));
    const newY = Math.max(68, e.pageY - dragging.dy);

    win.x = newX;
    win.y = newY;
    win.el.style.left = `${newX}px`;
    win.el.style.top = `${newY}px`;
  });

  function stopDrag() {
    if (dragging) {
      const win = windows[dragging.id];
      if (win && win.el) {
        win.el.classList.remove('dragging');
      }
      dragging = null;
      syncDeskHeight();
    }
  }

  window.addEventListener('pointerup', stopDrag);
  window.addEventListener('pointercancel', stopDrag);
  window.addEventListener('blur', stopDrag);

  function isWindowInViewport(win) {
    if (!win || !win.open || !win.el) return false;
    const rect = win.el.getBoundingClientRect();
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;
    // Consider visible if header/top body is comfortably between top nav and bottom dock
    const verticallyVisible = rect.top >= 58 && rect.top <= viewH - 150 && rect.bottom >= 120;
    const horizontallyVisible = rect.right > 60 && rect.left < viewW - 60;
    return verticallyVisible && horizontallyVisible;
  }

  function placeWindowInViewport(win, animateMove = false) {
    if (!win || !win.el) return;

    if (window.innerWidth < 820) {
      // On mobile, windows are stacked vertically in .desk; scroll smoothly to the window
      requestAnimationFrame(() => {
        const rect = win.el.getBoundingClientRect();
        const targetScroll = window.scrollY + rect.top - 78;
        window.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      });
      return;
    }

    const maxW = window.innerWidth - 24;
    win.w = Math.min(win.w || win.defaultW, maxW);
    win.el.style.width = `${win.w}px`;

    // Keep horizontally inside viewport
    win.x = Math.max(16, Math.min(win.x, window.innerWidth - win.w - 16));

    // Calculate vertical range inside the current scroll viewport
    const topBound = window.scrollY + 86;
    const bottomBound = window.scrollY + window.innerHeight - 96;
    const winH = win.el.offsetHeight || 320;
    const maxTop = Math.max(topBound, bottomBound - winH);

    // Always place comfortably in the current viewport regardless of scroll position
    const cascadeOffset = ((win.index || 0) % 4) * 18;
    const sweetSpotY = window.scrollY + Math.max(88, Math.round((window.innerHeight - Math.min(winH, window.innerHeight - 180)) * 0.32)) + cascadeOffset;
    win.y = Math.max(topBound, Math.min(sweetSpotY, maxTop));

    if (animateMove) {
      clearTimeout(win.moveTimer);
      win.el.classList.add('animating-move', 'tidying');
      win.el.style.left = `${win.x}px`;
      win.el.style.top = `${win.y}px`;
      win.moveTimer = setTimeout(() => {
        if (win.el) win.el.classList.remove('animating-move', 'tidying');
      }, 500);
    } else {
      win.el.style.left = `${win.x}px`;
      win.el.style.top = `${win.y}px`;
    }
  }

  function focusWindow(id) {
    const win = windows[id];
    if (!win || !win.el) return;

    topZ += 1;
    win.z = topZ;
    win.el.style.zIndex = topZ;

    // Toggle visual focus class
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.el.classList.add('focused');
  }

  function openWindow(id) {
    const win = windows[id];
    if (!win || !win.el) return;

    if (win.closeTimer) {
      clearTimeout(win.closeTimer);
      win.closeTimer = null;
    }
    if (win.openTimer) {
      clearTimeout(win.openTimer);
      win.openTimer = null;
    }

    win.open = true;
    win.el.classList.remove('closing', 'opening', 'tidying');
    win.el.style.display = 'block';
    updateDockStatus();

    placeWindowInViewport(win, false);

    // Trigger opening animation
    void win.el.offsetWidth;
    win.el.classList.add('opening');
    win.openTimer = setTimeout(() => {
      if (win.el) win.el.classList.remove('opening');
      win.openTimer = null;
    }, 340);

    focusWindow(id);
    syncDeskHeight();
  }

  function closeWindow(id) {
    const win = windows[id];
    if (!win || !win.el || !win.open) return;

    if (win.openTimer) {
      clearTimeout(win.openTimer);
      win.openTimer = null;
    }

    win.open = false;
    win.el.classList.remove('focused', 'opening', 'tidying');
    updateDockStatus();

    // Trigger closing animation before hiding
    void win.el.offsetWidth;
    win.el.classList.add('closing');

    clearTimeout(win.closeTimer);
    win.closeTimer = setTimeout(() => {
      if (!win.open && win.el) {
        win.el.style.display = 'none';
        win.el.classList.remove('closing');
      }
      win.closeTimer = null;
      syncDeskHeight();
    }, 250);
  }

  function toggleWindow(id) {
    const win = windows[id];
    if (!win) return;

    if (win.open) {
      // If the window is open but scrolled out of view, bring it into the current viewport and focus it
      if (!isWindowInViewport(win)) {
        placeWindowInViewport(win, true);
        focusWindow(id);
        syncDeskHeight();
        return;
      }
      // If already open and visible in the viewport, close it with animation
      closeWindow(id);
    } else {
      openWindow(id);
    }
  }

  // Tidy Desk — Auto organizes open windows into responsive columns
  function tidyDesk(options = {}) {
    const { animate = false, notify = false } = options;
    const W = window.innerWidth;
    const isMobile = W < 820;
    const isTablet = W >= 820 && W < 1320;
    const cols = isMobile ? 1 : (isTablet ? 2 : 3);
    const gap = isMobile ? 14 : 24;
    const pad = isMobile ? 12 : 36;

    // If user explicitly clicked "arrumar a mesa" and all windows are closed, reopen default windows
    const anyOpen = WINDOW_CONFIGS.some(cfg => windows[cfg.id] && windows[cfg.id].open);
    if (notify && !anyOpen) {
      WINDOW_CONFIGS.forEach(cfg => {
        if (cfg.open) {
          const w = windows[cfg.id];
          if (w && w.el) {
            w.open = true;
            w.el.classList.remove('closing');
            w.el.style.display = 'block';
          }
        }
      });
      updateDockStatus();
    }
    
    // Calculate width ensuring we don't exceed max width per window
    const maxWinW = 480;
    let colW = Math.floor((W - pad * 2 - gap * (cols - 1)) / cols);
    colW = isMobile ? colW : Math.min(colW, maxWinW);
    
    // Calculate total grid width to center it on the screen
    const gridW = colW * cols + gap * (cols - 1);
    const startX = Math.max(pad, Math.floor((W - gridW) / 2));
    
    const tops = new Array(cols).fill(isMobile ? 88 : 108);

    // Record starting positions if animating on desktop
    const prevPositions = {};
    if (animate && !isMobile) {
      WINDOW_CONFIGS.forEach(cfg => {
        const win = windows[cfg.id];
        if (!win || !win.open || !win.el) return;
        win.el.classList.remove('animating-move', 'tidying');
        prevPositions[cfg.id] = {
          x: win.x,
          y: win.y,
          w: win.el.offsetWidth || win.w
        };
      });
    }

    // Calculate target coordinates for each open window
    const targets = {};
    WINDOW_CONFIGS.forEach(cfg => {
      const win = windows[cfg.id];
      if (!win || !win.open || !win.el) return;

      // Find column with smallest current height
      let targetCol = 0;
      for (let i = 1; i < cols; i++) {
        if (tops[i] < tops[targetCol]) targetCol = i;
      }

      // Measure height at target column width
      win.el.style.width = `${colW}px`;
      const height = win.el.offsetHeight || 320;

      const targetX = startX + targetCol * (colW + gap);
      const targetY = tops[targetCol];

      targets[cfg.id] = { x: targetX, y: targetY, w: colW };
      tops[targetCol] = targetY + height + gap;
    });

    if (animate && !isMobile) {
      // Restore starting positions before triggering CSS transition
      WINDOW_CONFIGS.forEach(cfg => {
        const win = windows[cfg.id];
        const prev = prevPositions[cfg.id];
        if (!win || !win.open || !win.el || !prev) return;
        win.el.style.width = `${prev.w}px`;
        win.el.style.left = `${prev.x}px`;
        win.el.style.top = `${prev.y}px`;
      });

      // Force reflow so browser registers the starting state
      if (desk) void desk.offsetHeight;

      // Apply target positions with smooth transition
      WINDOW_CONFIGS.forEach(cfg => {
        const win = windows[cfg.id];
        const target = targets[cfg.id];
        if (!win || !win.open || !win.el || !target) return;

        win.w = target.w;
        win.x = target.x;
        win.y = target.y;

        clearTimeout(win.moveTimer);
        win.el.classList.add('animating-move', 'tidying');
        win.el.style.width = `${win.w}px`;
        win.el.style.left = `${win.x}px`;
        win.el.style.top = `${win.y}px`;

        win.moveTimer = setTimeout(() => {
          if (win.el) {
            win.el.classList.remove('animating-move', 'tidying');
          }
        }, 520);
      });
    } else {
      WINDOW_CONFIGS.forEach(cfg => {
        const win = windows[cfg.id];
        const target = targets[cfg.id];
        if (!win || !win.open || !win.el || !target) return;

        win.w = target.w;
        win.x = target.x;
        win.y = target.y;

        win.el.style.width = `${win.w}px`;
        win.el.style.left = `${win.x}px`;
        win.el.style.top = `${win.y}px`;

        if (animate && isMobile) {
          clearTimeout(win.moveTimer);
          win.el.classList.remove('tidying');
          void win.el.offsetWidth;
          win.el.classList.add('tidying');
          win.moveTimer = setTimeout(() => {
            if (win.el) win.el.classList.remove('tidying');
          }, 520);
        }
      });
    }

    syncDeskHeight();

    if (notify) {
      if (window.scrollY > 140) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const lang = document.documentElement.getAttribute('data-lang');
      const message = lang === 'en'
        ? 'windows tidied up on the desk! ↺'
        : 'janelas arrumadas na mesa! ↺';
      flashToast(message);
    }
  }

  function syncDeskHeight() {
    let maxBottom = 760;
    Object.values(windows).forEach(win => {
      if (win.open && win.el) {
        const bottom = win.y + win.el.offsetHeight;
        if (bottom > maxBottom) maxBottom = bottom;
      }
    });
    if (desk) {
      desk.style.minHeight = `${maxBottom + 120}px`;
    }
  }

  // Theme Management (dia / cafe)
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('alyscafe_theme', theme);

    if (theme === 'cafe') {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    } else {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    }
  }

  const savedTheme = localStorage.getItem('alyscafe_theme') || 'dia';
  setTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'cafe' ? 'dia' : 'cafe';
      setTheme(next);
    });
  }

  // Language Management (pt / en)
  function setLanguage(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem('alyscafe_lang', lang);

    if (btnLangPt && btnLangEn) {
      if (lang === 'en') {
        btnLangPt.classList.remove('active');
        btnLangEn.classList.add('active');
      } else {
        btnLangPt.classList.add('active');
        btnLangEn.classList.remove('active');
      }
    }

    if (emptyDeskHint && emptyDeskHint.classList.contains('visible')) {
      emptyDeskHint.classList.remove('visible');
      void emptyDeskHint.offsetWidth;
      emptyDeskHint.classList.add('visible');
    }
  }

  const savedLang = localStorage.getItem('alyscafe_lang') || 'pt';
  setLanguage(savedLang);

  if (btnLangPt) {
    btnLangPt.addEventListener('click', () => setLanguage('pt'));
  }
  if (btnLangEn) {
    btnLangEn.addEventListener('click', () => setLanguage('en'));
  }

  // Coffee Cup Counter & Toast
  function flashToast(msg) {
    if (!toastNotice) return;
    clearTimeout(toastTimer);
    toastNotice.textContent = msg;
    toastNotice.classList.add('show');
    toastTimer = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 2500);
  }

  window.flashToast = flashToast;

  if (cupBtn) {
    cupBtn.addEventListener('click', () => {
      coffeeCount += 1;
      const lang = document.documentElement.getAttribute('data-lang');
      const message = lang === 'en' 
        ? `cup no. ${coffeeCount} this visit ↺` 
        : `café nº ${coffeeCount} da visita ↺`;
      flashToast(message);
    });
  }

  // Contact Form Submission Handler (Formspree AJAX)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '...';
      btn.disabled = true;

      const formData = new FormData(contactForm);
      const endpoint = contactForm.getAttribute('action');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const lang = document.documentElement.getAttribute('data-lang');
          const message = lang === 'en' ? 'note left at the counter!' : 'recado no balcão!';
          flashToast(message);
          contactForm.reset();
        } else {
          // Se o endpoint for inválido ou der erro, avisa na tela
          const lang = document.documentElement.getAttribute('data-lang');
          flashToast(lang === 'en' ? 'Form error (check setup)' : 'Erro de configuração');
        }
      } catch (error) {
        const lang = document.documentElement.getAttribute('data-lang');
        flashToast(lang === 'en' ? 'Connection error' : 'Erro de conexão');
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }

  // Real-time Clock
  function updateClock() {
    if (!clockElement) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}`;
  }

  updateClock();
  setInterval(updateClock, 10000);

  // Resize listener
  window.addEventListener('resize', () => {
    tidyDesk();
  });

  // Initial layout arrangement
  setTimeout(() => tidyDesk(), 50);

  // Recalculate once all resources (fonts, images) are fully loaded
  window.addEventListener('load', () => tidyDesk());
});
