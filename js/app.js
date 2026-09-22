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

  // Stored state for windows
  const windows = {};

  WINDOW_CONFIGS.forEach((cfg, index) => {
    const el = document.getElementById(`win-${cfg.id}`);
    const dockBtn = document.querySelector(`.dock-btn[data-window="${cfg.id}"]`);
    const dockDot = dockBtn ? dockBtn.querySelector('.dock-dot') : null;

    windows[cfg.id] = {
      id: cfg.id,
      el,
      dockBtn,
      dockDot,
      x: cfg.x,
      y: cfg.y,
      w: cfg.w,
      open: cfg.open,
      z: index + 1
    };

    if (el) {
      // Set initial styles
      el.style.zIndex = index + 1;
      el.style.display = cfg.open ? 'block' : 'none';
      if (cfg.open && dockDot) {
        dockDot.classList.add('open');
      }

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

  // Dock buttons click
  document.querySelectorAll('.dock-btn[data-window]').forEach(btn => {
    btn.addEventListener('click', () => {
      const winId = btn.getAttribute('data-window');
      toggleWindow(winId);
    });
  });

  // Tidy button
  if (tidyBtn) {
    tidyBtn.addEventListener('click', () => {
      tidyDesk();
    });
  }

  // Window Drag Handlers
  function startDrag(id, e) {
    if (e.button !== 0) return; // Left click only
    if (window.innerWidth < 820) return; // Desabilita drag em telas pequenas (mobile)
    
    focusWindow(id);
    const win = windows[id];
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

  window.addEventListener('pointerup', () => {
    if (dragging) {
      dragging = null;
      syncDeskHeight();
    }
  });

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

    win.open = true;
    win.el.style.display = 'block';
    if (win.dockDot) {
      win.dockDot.classList.add('open');
    }

    // Keep window inside visible bounds
    const maxW = window.innerWidth - 24;
    win.w = Math.min(win.w, maxW);
    win.el.style.width = `${win.w}px`;
    win.x = Math.max(12, Math.min(win.x, window.innerWidth - win.w - 12));
    win.y = Math.max(80, Math.min(win.y, window.scrollY + 100));

    win.el.style.left = `${win.x}px`;
    win.el.style.top = `${win.y}px`;

    focusWindow(id);
    syncDeskHeight();
  }

  function closeWindow(id) {
    const win = windows[id];
    if (!win || !win.el) return;

    win.open = false;
    win.el.style.display = 'none';
    win.el.classList.remove('focused');
    if (win.dockDot) {
      win.dockDot.classList.remove('open');
    }
    syncDeskHeight();
  }

  function toggleWindow(id) {
    const win = windows[id];
    if (!win) return;

    if (win.open) {
      // If already open and top-most, close it; otherwise bring it to focus
      if (win.z === topZ) {
        closeWindow(id);
      } else {
        focusWindow(id);
      }
    } else {
      openWindow(id);
    }
  }

  // Tidy Desk — Auto organizes open windows into responsive columns
  function tidyDesk() {
    const W = window.innerWidth;
    const isMobile = W < 820;
    const isTablet = W >= 820 && W < 1320;
    const cols = isMobile ? 1 : (isTablet ? 2 : 3);
    const gap = isMobile ? 14 : 24;
    const pad = isMobile ? 12 : 36;
    
    // Calculate width ensuring we don't exceed max width per window
    const maxWinW = 480;
    let colW = Math.floor((W - pad * 2 - gap * (cols - 1)) / cols);
    colW = isMobile ? colW : Math.min(colW, maxWinW);
    
    // Calculate total grid width to center it on the screen
    const gridW = colW * cols + gap * (cols - 1);
    const startX = Math.max(pad, Math.floor((W - gridW) / 2));
    
    const tops = new Array(cols).fill(isMobile ? 88 : 108);

    WINDOW_CONFIGS.forEach(cfg => {
      const win = windows[cfg.id];
      if (!win || !win.open || !win.el) return;

      // Find column with smallest current height
      let targetCol = 0;
      for (let i = 1; i < cols; i++) {
        if (tops[i] < tops[targetCol]) targetCol = i;
      }

      win.w = colW;
      win.x = startX + targetCol * (colW + gap);
      win.y = tops[targetCol];

      win.el.style.width = `${win.w}px`;
      win.el.style.left = `${win.x}px`;
      win.el.style.top = `${win.y}px`;

      const height = win.el.offsetHeight || 320;
      tops[targetCol] = win.y + height + gap;
    });

    syncDeskHeight();
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
