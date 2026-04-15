 // ── Tab Navigation ──────────────────────────────────────────────
    function switchPage(id) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const page = document.getElementById('page-' + id);
      const nav  = document.getElementById('nav-' + id);
      if (page) page.classList.add('active');
      if (nav)  nav.classList.add('active');
      window.scrollTo(0, 0);
    }

    // ── Login Modal ──────────────────────────────────────────────────
    const loginErrors = [
      "Invalid credentials. Please check your University ID and password.",
      "Authentication failed. Your session may have expired — please try again.",
      "Access denied. Too many failed attempts. Wait 30 seconds and try again.",
      "Unable to connect to the identity server. Please try again shortly.",
      "Your account is not yet activated. Check your welcome email for setup instructions.",
      "Password has expired. Use 'Forgot password?' to reset via your recovery email.",
      "Multi-factor authentication required. Check your registered device for a prompt.",
      "Account temporarily locked. Contact IT support at helpdesk@norchester.edu.",
    ];
    let errorIndex = 0;

    function openLogin() {
      document.getElementById('loginModal').classList.add('open');
      document.getElementById('loginError').classList.remove('show');
      document.getElementById('loginUser').value = '';
      document.getElementById('loginPass').value = '';
      document.getElementById('loginUser').classList.remove('error');
      document.getElementById('loginPass').classList.remove('error');
      setTimeout(() => document.getElementById('loginUser').focus(), 80);
    }

    function closeLogin() {
      document.getElementById('loginModal').classList.remove('open');
    }

    function handleBackdropClick(e) {
      if (e.target === document.getElementById('loginModal')) closeLogin();
    }

    function attemptLogin() {
      const u = document.getElementById('loginUser').value.trim();
      const p = document.getElementById('loginPass').value;
      const errEl = document.getElementById('loginError');
      const userEl = document.getElementById('loginUser');
      const passEl = document.getElementById('loginPass');

      errEl.classList.remove('show');

      if (!u || !p) {
        userEl.classList.toggle('error', !u);
        passEl.classList.toggle('error', !p);
        void errEl.offsetWidth;
        errEl.textContent = "Please enter both your University ID and password.";
        errEl.classList.add('show');
        return;
      }

      userEl.classList.remove('error');
      passEl.classList.remove('error');

      void errEl.offsetWidth;
      errEl.textContent = loginErrors[errorIndex % loginErrors.length];
      errorIndex++;
      errEl.classList.add('show');
      passEl.value = '';
      passEl.focus();
    }

    // ── Game Overlay ─────────────────────────────────────────────────
    function openOverlay() {
      document.getElementById('gameOverlay').classList.add('open');
      initLimelightNav();
    }

    function closeOverlay() {
      document.getElementById('gameOverlay').classList.remove('open');
    }

    // ── Topbar LimelightNav ───────────────────────────────────────────
    // Maps limelight nav tabs → sidebar item IDs (order matches nav items)
    const _LLN_MAP = [
      { sidebarId: 'nav-home',       icon: 'home',     label: 'Home'     },
      { sidebarId: 'nav-aichat',     icon: 'ai',       label: 'AI'       },
      { sidebarId: 'nav-globalchat', icon: 'globe',    label: 'Chat'     },
      { sidebarId: 'nav-dm',         icon: 'dm',       label: 'DMs'      },
      { sidebarId: 'nav-settings',   icon: 'settings', label: 'Settings' },
    ];

    function initLimelightNav() {
      const nav = document.getElementById('overlayLimelightNav');
      if (!nav) return;

      if (!nav._llnReady) {
        nav._llnReady = true;
        const icons = window.OrbitLimelightIcons || {};
        nav.items = _LLN_MAP.map(entry => ({
          id:    entry.sidebarId,
          icon:  icons[entry.icon] || '',
          label: entry.label,
          onClick() {
            // Scope to #gameSidebar — the university nav has conflicting IDs (e.g. nav-home)
            const el = document.querySelector('#gameSidebar #' + entry.sidebarId);
            if (el) selectSidebarItem(el);
          },
        }));
      }

      // Re-measure after overlay becomes visible (offsets are 0 while hidden)
      nav.refreshPosition();
    }

    function syncLimelightNav(sidebarItemId) {
      const nav = document.getElementById('overlayLimelightNav');
      if (!nav) return;
      const idx = _LLN_MAP.findIndex(m => m.sidebarId === sidebarItemId);
      if (idx !== -1) nav.activeIndex = idx;
    }

    function selectSidebarItem(el) {
      if (!el) return;
      if (el.classList.contains('sb-item')) syncLimelightNav(el.id);
      document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      const label = el.dataset.label || el.querySelector('.sb-item-label')?.textContent.trim() || el.textContent.trim();
      document.getElementById('topbarTitle').textContent = label;

      // Switch panel
      const isHome        = (el.id === 'nav-home');
      const isAiChat      = (el.id === 'nav-aichat');
      const isGlobalChat  = (el.id === 'nav-globalchat');
      const isDm          = (el.id === 'nav-dm');
      const isSettings    = (el.id === 'nav-settings');
      const isSuggestions = (el.id === 'nav-suggestions');
      const isPlaceholder = !isHome && !isAiChat && !isGlobalChat && !isDm && !isSettings && !isSuggestions;
      document.getElementById('homePanel').classList.toggle('active', isHome);
      document.getElementById('aiChatPanel').classList.toggle('active', isAiChat);
      document.getElementById('globalChatPanel').classList.toggle('active', isGlobalChat);
      document.getElementById('dmPanel').classList.toggle('active', isDm);
      document.getElementById('settingsPanel').classList.toggle('active', isSettings);
      document.getElementById('suggestionsPanel').classList.toggle('active', isSuggestions);
      document.getElementById('placeholderPanel').classList.toggle('active', isPlaceholder);
      if (isPlaceholder) {
        const isGame = el.classList.contains('game-item');
        document.getElementById('phIcon').textContent = isGame ? '▶' : '◈';
        document.getElementById('phTitle').textContent = isGame ? label : label + ' — Coming Soon';
        document.getElementById('phSub').textContent = isGame
          ? 'This game will be playable in a future update.'
          : 'This feature will be available in a future update.';
      }
      if (isAiChat)       initAcGlow();
      if (isGlobalChat)   initGlobalChat();
      if (isDm)           initDmPanel();
      if (isSettings)     initSettingsPanel();
      if (isSuggestions)  initSuggestionsPanel();
    }

    // ── Theme switching ───────────────────────────────────────────────
    // glowOpacity: primary ambient glow intensity for #gameOverlay::before/::after
    // Calibrated per-theme so saturated/light colors don't overpower the space bg.
    const THEMES = {
      '#4f8ef7': { name:'Default',   rgb:'79,142,247',  glowOpacity: 0.065 },
      '#c8c8e8': { name:'Midnight',  rgb:'200,200,232', glowOpacity: 0.06  },
      '#7c3aed': { name:'Blackhole', rgb:'124,58,237',  glowOpacity: 0.09  },
      '#8b00ff': { name:'Purple',    rgb:'139,0,255',   glowOpacity: 0.07  },
      '#22d3a0': { name:'Green',     rgb:'34,211,160',  glowOpacity: 0.055 },
      '#dc2626': { name:'Red',       rgb:'220,38,38',   glowOpacity: 0.038 },
      '#f0c060': { name:'Gold',      rgb:'240,192,96',  glowOpacity: 0.038 },
      '#60a5fa': { name:'White',     rgb:'96,165,250',  glowOpacity: 0.06  },
      '#ffffff': { name:'B&W',       rgb:'255,255,255', glowOpacity: 0.022 },
    };

    function applyTheme(hex) {
      const t = THEMES[hex];
      if (!t) return;
      const root = document.documentElement.style;
      root.setProperty('--gblue',        hex);
      root.setProperty('--gblue-rgb',    t.rgb);
      root.setProperty('--accent',       hex); // keep alias for any legacy refs
      root.setProperty('--glow-opacity', String(t.glowOpacity));
    }

    function setTheme(color, dotEl) {
      applyTheme(color);
      document.querySelectorAll('.sb-theme-dot').forEach(d => d.classList.remove('active'));
      if (dotEl) dotEl.classList.add('active');
      try { localStorage.setItem('orbit-theme', color); } catch(e) {}
      // Re-render grid so card accent glows update live
      renderGrid();
    }

    // Restore saved theme
    (function() {
      try {
        const saved = localStorage.getItem('orbit-theme');
        if (saved && THEMES[saved]) {
          applyTheme(saved);
          // mark the dot after DOM ready — done inline on load in overlay open
        }
      } catch(e) {}
    })();

    // ── Game search / filter ──────────────────────────────────────────
    function filterGames(query) {
      const q = query.trim().toLowerCase();
      const items = document.querySelectorAll('#gamesList .sb-item');
      let visible = 0;
      items.forEach(item => {
        const name = item.dataset.label.toLowerCase();
        const show = !q || name.includes(q);
        item.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      document.getElementById('gamesCount').textContent = visible;
    }

    // ══════════════════════════════════════════════════════════════════
    //  HOME PANEL
    // ══════════════════════════════════════════════════════════════════

    // ── Game data ────────────────────────────────────────────────────
    const GAMES = [
      { id:1,  name:'Tetrix',        cat:'Puzzle',  icon:'▦',  plays:2847, desc:'Stack falling blocks and clear lines before the stack reaches the top.' },
      { id:2,  name:'Neon Snake',    cat:'Arcade',  icon:'◈',  plays:1923, desc:'Guide your glowing snake — eat, grow, and avoid yourself.' },
      { id:3,  name:'2048',          cat:'Puzzle',  icon:'⬡',  plays:2341, desc:'Slide and merge numbered tiles to reach the elusive 2048 tile.' },
      { id:4,  name:'Minefield',     cat:'Classic', icon:'⚡', plays:1456, desc:'Uncover every safe square without detonating a single mine.' },
      { id:5,  name:'Flapbird',      cat:'Arcade',  icon:'▶',  plays:1788, desc:'Tap to keep your bird airborne through an endless pipe maze.' },
      { id:6,  name:'Brickout',      cat:'Classic', icon:'▦',  plays: 934, desc:'Break every brick with a bouncing ball — don\'t let it drop.' },
      { id:7,  name:'Pac-Grid',      cat:'Arcade',  icon:'◉',  plays:1654, desc:'Eat every dot on the grid while outsmarting four hungry ghosts.' },
      { id:8,  name:'Starblast',     cat:'Arcade',  icon:'✦',  plays:1122, desc:'Pilot a lone fighter through relentless waves of asteroid clusters.' },
      { id:9,  name:'Pong Duel',     cat:'Sports',  icon:'◎',  plays: 876, desc:'Classic paddle battle — first to 11 wins the set.' },
      { id:10, name:'Chess Classic', cat:'Classic', icon:'♟',  plays:2156, desc:'Full rules chess against an AI opponent at adjustable difficulty.' },
      { id:11, name:'Sudoku Pro',    cat:'Puzzle',  icon:'▦',  plays:1834, desc:'Fill the 9×9 grid so every row, column, and box holds 1–9.' },
      { id:12, name:'Wordcraft',     cat:'Chill',   icon:'◇',  plays:1245, desc:'Find hidden words in a shuffled letter grid before time runs out.' },
      { id:13, name:'Memory Grid',   cat:'Puzzle',  icon:'⬡',  plays: 987, desc:'Flip cards and match every pair using pure memory.' },
      { id:14, name:'Card Solitaire',cat:'Chill',   icon:'◈',  plays:1567, desc:'Classic Klondike solitaire — build four foundation piles, ace to king.' },
      { id:15, name:'Mahjong Tiles', cat:'Chill',   icon:'▦',  plays:1089, desc:'Clear the board by matching identical free tiles from the pyramid.' },
      { id:16, name:'Tic Tac Toe',   cat:'Classic', icon:'✕',  plays: 678, desc:'Noughts and crosses — claim three in a row before your opponent does.' },
      { id:17, name:'Column Drop',   cat:'Puzzle',  icon:'▼',  plays:1345, desc:'Drop discs and connect four in a row horizontally, vertically, or diagonally.' },
      { id:18, name:'Sea Battle',    cat:'Classic', icon:'◉',  plays: 756, desc:'Sink the enemy fleet before they find yours. Five ships, ten rounds.' },
      { id:19, name:'Tower Rush',    cat:'RPG',     icon:'⬡',  plays:1456, desc:'Place towers strategically to stop waves of creeps from crossing the map.' },
      { id:20, name:'Cookie Empire', cat:'Chill',   icon:'∞',  plays:2089, desc:'Click to bake cookies, then automate production into a vast cookie empire.' },
      { id:21, name:'TypeSpeed',     cat:'Rhythm',  icon:'▶',  plays:1678, desc:'Words rain down — type them before they hit the floor. Beat your WPM record.' },
      { id:22, name:'Asteroid Field',cat:'Arcade',  icon:'✦',  plays:1234, desc:'Rotate, thrust, and blast asteroids in the zero-gravity void of space.' },
      { id:23, name:'Bubble Pop',    cat:'Chill',   icon:'◎',  plays:1567, desc:'Aim and shoot bubbles to form matching groups of three or more.' },
      { id:24, name:'Mole Hunt',     cat:'Fun',     icon:'⚡', plays: 892, desc:'Whack every mole that pops up — they get faster each round.' },
      { id:25, name:'Color Simon',   cat:'Classic', icon:'◈',  plays: 743, desc:'Repeat the growing colour sequence from memory as long as you can.' },
      { id:26, name:'Hangman',       cat:'Classic', icon:'◇',  plays: 934, desc:'Guess the hidden word letter by letter before the figure is complete.' },
      { id:27, name:'Blackjack 21',  cat:'Classic', icon:'♠',  plays:1123, desc:'Hit or stand — beat the dealer to 21 without going bust.' },
      { id:28, name:'Pixel Dungeon', cat:'Horror',  icon:'▦',  plays:1789, desc:'Descend floor by floor through a procedurally generated dungeon of horrors.' },
      { id:29, name:'Number Slide',  cat:'Puzzle',  icon:'⬡',  plays: 645, desc:'Slide numbered tiles into order using the single empty space.' },
      { id:30, name:'Word Hunt',     cat:'Puzzle',  icon:'◇',  plays:1234, desc:'Swipe through a letter grid to find as many words as possible.' },
      { id:31, name:'Gravity Shift', cat:'Racing',  icon:'▼',  plays:1456, desc:'Flip gravity on/off to navigate a speeding craft through tight corridors.' },
      { id:32, name:'Orbit Classic', cat:'Classic', icon:'◉',  plays:1678, desc:'The original Orbit mini-game — circle the planet and collect stars.' },
      { id:33, name:'Idle Kingdom',  cat:'Chill',   icon:'∞',  plays:1234, desc:'Build a kingdom while away — return to find your coffers overflowing.' },
      { id:34, name:'Hex Merge',     cat:'Puzzle',  icon:'⬡',  plays: 978, desc:'Place and merge numbered hexagons to reach ever-higher tile values.' },
    ];

    const CAT_COLORS = {
      Puzzle:  { bg:'rgba(109,40,217,0.18)',  text:'#a78bfa' },
      Arcade:  { bg:'rgba(234,88,12,0.18)',   text:'#fb923c' },
      Classic: { bg:'rgba(75,85,99,0.22)',    text:'#9ca3af' },
      RPG:     { bg:'rgba(180,83,9,0.2)',     text:'#fbbf24' },
      Chill:   { bg:'rgba(5,150,105,0.18)',   text:'#34d399' },
      Sports:  { bg:'rgba(37,99,235,0.18)',   text:'#60a5fa' },
      Fun:     { bg:'rgba(180,83,9,0.18)',    text:'#fcd34d' },
      Horror:  { bg:'rgba(185,28,28,0.2)',    text:'#f87171' },
      Rhythm:  { bg:'rgba(190,24,93,0.2)',    text:'#f472b6' },
      Racing:  { bg:'rgba(8,145,178,0.2)',    text:'#22d3ee' },
    };

    // Rich gradient backgrounds for each card's icon area
    const CAT_GRADIENTS = {
      Puzzle:  'linear-gradient(145deg, #1e0d4a 0%, #2d1066 55%, #120830 100%)',
      Arcade:  'linear-gradient(145deg, #3d1500 0%, #5c2200 55%, #1a0800 100%)',
      Classic: 'linear-gradient(145deg, #111419 0%, #1c2028 55%, #080a0e 100%)',
      RPG:     'linear-gradient(145deg, #2d1a00 0%, #452800 55%, #160d00 100%)',
      Chill:   'linear-gradient(145deg, #002a1e 0%, #003d2a 55%, #001410 100%)',
      Sports:  'linear-gradient(145deg, #001540 0%, #001f5e 55%, #000a20 100%)',
      Fun:     'linear-gradient(145deg, #2a1a00 0%, #3d2800 55%, #140d00 100%)',
      Horror:  'linear-gradient(145deg, #2a0000 0%, #400000 55%, #150000 100%)',
      Rhythm:  'linear-gradient(145deg, #2a001a 0%, #400028 55%, #140010 100%)',
      Racing:  'linear-gradient(145deg, #001a2a 0%, #002840 55%, #000d14 100%)',
    };

    // ── State ─────────────────────────────────────────────────────────
    let homeSearchQ   = '';
    let activeCat     = 'All';
    let favorites     = new Set();
    let recentPlayed  = []; // array of game ids, most recent first
    let playedToday   = 0;

    function fmtPlays(n) {
      return n >= 1000 ? (n/1000).toFixed(1).replace(/\.0$/,'') + 'k' : String(n);
    }

    // ── Starfield — upward-drifting particles with accent glow ────────
    let starfieldRaf = null;
    function initStarfield() {
      const canvas = document.getElementById('starfieldCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let W, H, stars = [];

      function resize() {
        const p = canvas.parentElement;
        W = canvas.width  = p.offsetWidth;
        H = canvas.height = p.offsetHeight;
      }

      // Read accent as rgb from CSS var (live, theme-aware)
      function accentRgb() {
        return getComputedStyle(document.documentElement)
          .getPropertyValue('--gblue-rgb').trim() || '79,142,247';
      }

      function mkStars() {
        stars = Array.from({length: 140}, (_, i) => ({
          x:      Math.random() * (W || 800),
          y:      Math.random() * (H || 600),
          r:      Math.random() * 1.2 + 0.2,
          vy:     -(Math.random() * 0.22 + 0.04),  // upward
          vx:     (Math.random() - 0.5) * 0.06,     // slight lateral drift
          phase:  Math.random() * Math.PI * 2,       // twinkle offset
          speed:  Math.random() * 0.6 + 0.4,         // twinkle speed multiplier
          accent: i < 14,                            // ~10% get accent colour
        }));
      }

      let t = 0;
      function draw() {
        t += 1;
        ctx.clearRect(0, 0, W, H);
        const rgb = accentRgb();

        for (const s of stars) {
          // Smooth sinusoidal twinkle
          const tw = 0.12 + 0.52 * (0.5 + 0.5 * Math.sin(t * 0.012 * s.speed + s.phase));

          // Move upward, wrap at top
          s.y += s.vy;
          s.x += s.vx;
          if (s.y < -4)  { s.y = H + 4; s.x = Math.random() * W; }
          if (s.x < -4)  s.x = W + 4;
          if (s.x > W+4) s.x = -4;

          if (s.accent) {
            // Accent-coloured star with soft glow
            const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
            glow.addColorStop(0,   `rgba(${rgb},${(tw * 0.9).toFixed(3)})`);
            glow.addColorStop(0.4, `rgba(${rgb},${(tw * 0.25).toFixed(3)})`);
            glow.addColorStop(1,   `rgba(${rgb},0)`);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * 4, 0, 6.2832);
            ctx.fillStyle = glow;
            ctx.fill();
            // Hard core
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, 6.2832);
            ctx.fillStyle = `rgba(${rgb},${tw.toFixed(3)})`;
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, 6.2832);
            ctx.fillStyle = `rgba(255,255,255,${tw.toFixed(3)})`;
            ctx.fill();
          }
        }
        starfieldRaf = requestAnimationFrame(draw);
      }

      if (starfieldRaf) cancelAnimationFrame(starfieldRaf);
      resize(); mkStars(); draw();
      new ResizeObserver(() => { resize(); mkStars(); }).observe(canvas.parentElement);
    }

    // ── Render recently played ─────────────────────────────────────────
    function renderRecent() {
      const row = document.getElementById('recentChips');
      if (!row) return;
      if (recentPlayed.length === 0) {
        row.innerHTML = '<span class="recent-chip-empty">No games played yet — pick one below!</span>';
        return;
      }
      row.innerHTML = recentPlayed.slice(0,8).map(id => {
        const g = GAMES.find(x => x.id === id);
        if (!g) return '';
        return `<div class="recent-chip" onclick="playGame(${g.id})">
          <span class="recent-chip-icon">${g.icon}</span>${g.name}
        </div>`;
      }).join('');
    }

    // ── Render featured card ───────────────────────────────────────────
    function renderFeatured() {
      const card = document.getElementById('featuredCard');
      if (!card) return;
      const g = [...GAMES].sort((a,b) => b.plays - a.plays)[0];
      const cc = CAT_COLORS[g.cat] || { bg:'#1a1a1a', text:'#888' };
      card.innerHTML = `
        <div class="featured-eyebrow">⭐ &nbsp;Featured Game</div>
        <div class="featured-title">
          <span class="featured-icon">${g.icon}</span>${g.name}
        </div>
        <div class="featured-desc">${g.desc}</div>
        <div class="featured-meta">
          <span style="background:${cc.bg};color:${cc.text};padding:0.12rem 0.5rem;border-radius:4px;font-size:0.57rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;font-family:var(--orbit-ui)">${g.cat}</span>
          <strong>${fmtPlays(g.plays)}</strong> plays
        </div>
        <button class="featured-play-btn" onclick="playGame(${g.id})">▶ &nbsp;Play Now</button>`;
    }

    // ── Render game grid ───────────────────────────────────────────────
    function renderGrid() {
      const grid = document.getElementById('homeGrid');
      if (!grid) return;
      const q   = homeSearchQ.toLowerCase();
      const cat = activeCat;
      const visible = GAMES.filter(g =>
        (cat === 'All' || g.cat === cat) &&
        (!q || g.name.toLowerCase().includes(q) || g.cat.toLowerCase().includes(q))
      );
      if (visible.length === 0) {
        grid.innerHTML = `<div class="home-no-results"><span class="home-no-results-icon">◈</span>No games match "${homeSearchQ || cat}"</div>`;
        return;
      }
      grid.innerHTML = visible.map(g => {
        const cc   = CAT_COLORS[g.cat]     || { bg:'rgba(255,255,255,0.06)', text:'#888' };
        const grad = CAT_GRADIENTS[g.cat]  || 'linear-gradient(145deg,#111,#000)';
        const fav  = favorites.has(g.id);
        return `<div class="game-card" id="gc-${g.id}">
          <div class="gc-icon-wrap">
            <div class="gc-icon-bg" style="background:${grad}"></div>
            <span class="gc-icon">${g.icon}</span>
          </div>
          <div class="gc-info">
            <div class="gc-name" title="${g.name}">${g.name}</div>
            <div class="gc-meta">
              <span class="gc-tag" style="background:${cc.bg};color:${cc.text}">${g.cat}</span>
              <span class="gc-plays">${fmtPlays(g.plays)}</span>
            </div>
          </div>
          <button class="gc-fav${fav?' faved':''}" onclick="toggleFav(${g.id},this,event)" title="${fav?'Unfavorite':'Favorite'}">♥</button>
          <div class="gc-play-overlay">
            <button class="gc-play-btn" onclick="playGame(${g.id})">▶ Play</button>
          </div>
        </div>`;
      }).join('');
    }

    // ── Stats ─────────────────────────────────────────────────────────
    function loadStats() {
      try {
        const favArr = JSON.parse(localStorage.getItem('orbit-favs') || '[]');
        favorites = new Set(favArr);
        recentPlayed = JSON.parse(localStorage.getItem('orbit-recent') || '[]');
        playedToday = parseInt(sessionStorage.getItem('orbit-today') || '0');
        const streak = parseInt(localStorage.getItem('orbit-streak') || '0');
        document.getElementById('statStreak').textContent = streak;
        document.getElementById('statToday').textContent  = playedToday;
      } catch(e) {}
    }
    function saveStats() {
      try {
        localStorage.setItem('orbit-favs',   JSON.stringify([...favorites]));
        localStorage.setItem('orbit-recent', JSON.stringify(recentPlayed));
        sessionStorage.setItem('orbit-today', String(playedToday));
      } catch(e) {}
    }

    // ── Play a game ────────────────────────────────────────────────────
    function playGame(id) {
      const g = GAMES.find(x => x.id === id);
      if (!g) return;
      // Add to recent (dedupe, keep newest first)
      recentPlayed = [id, ...recentPlayed.filter(x => x !== id)].slice(0, 10);
      playedToday++;
      document.getElementById('statToday').textContent = playedToday;
      try {
        const tot = parseInt(localStorage.getItem('orbit-total-played')||'0') + 1;
        localStorage.setItem('orbit-total-played', String(tot));
      } catch(e) {}
      saveStats();
      renderRecent();
      // Show placeholder with game name
      document.getElementById('phIcon').textContent  = g.icon;
      document.getElementById('phTitle').textContent = g.name;
      document.getElementById('phSub').textContent   = 'This game will be playable in a future update.';
      ['homePanel','aiChatPanel','globalChatPanel','dmPanel'].forEach(id =>
        document.getElementById(id)?.classList.remove('active')
      );
      document.getElementById('placeholderPanel').classList.add('active');
      document.getElementById('topbarTitle').textContent = g.name;
      // Deselect sidebar game items, mark none active
      document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
    }

    // ── Favorite toggle ────────────────────────────────────────────────
    function toggleFav(id, btn, e) {
      e.stopPropagation();
      if (favorites.has(id)) { favorites.delete(id); btn.classList.remove('faved'); btn.title = 'Favorite'; }
      else { favorites.add(id); btn.classList.add('faved'); btn.title = 'Unfavorite'; }
      saveStats();
    }

    // ── Home search ────────────────────────────────────────────────────
    function homeSearchFilter(q) {
      homeSearchQ = q;
      renderGrid();
    }

    // ── Category filter ────────────────────────────────────────────────
    function setCat(cat, el) {
      activeCat = cat;
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      el.classList.add('active');
      renderGrid();
    }

    // ── Random game ────────────────────────────────────────────────────
    function playRandom() {
      const pool = GAMES.filter(g => activeCat === 'All' || g.cat === activeCat);
      if (!pool.length) return;
      playGame(pool[Math.floor(Math.random() * pool.length)].id);
    }

    // ── Init home on overlay open ─────────────────────────────────────
    const _origOpenOverlay = openOverlay;
    openOverlay = function() {
      _origOpenOverlay();
      // Restore theme dot
      try {
        const saved = localStorage.getItem('orbit-theme');
        if (saved && THEMES[saved]) {
          applyTheme(saved);
          document.querySelectorAll('.sb-theme-dot').forEach(d => d.classList.remove('active'));
          const dot = [...document.querySelectorAll('.sb-theme-dot')]
            .find(d => d.title === THEMES[saved].name);
          if (dot) dot.classList.add('active');
        }
      } catch(e) {}
      ensureFirebase();
      updateProfileDisplay();
      trackSession();
      loadStats();
      renderRecent();
      renderFeatured();
      renderGrid();
      initStarfield();
    };
    const _origCloseOverlay = closeOverlay;
    closeOverlay = function() {
      _origCloseOverlay();
      if (starfieldRaf) { cancelAnimationFrame(starfieldRaf); starfieldRaf = null; }
    };

    // ── AI Chat ──────────────────────────────────────────────────────
    let acChips = [];

    function acAddMsg(role, text) {
      const msgs  = document.getElementById('acMessages');
      const empty = document.getElementById('acEmpty');
      if (empty) empty.style.display = 'none';
      const div = document.createElement('div');
      div.className = 'ac-msg ' + role;
      div.innerHTML = `
        <div class="ac-avatar">${role === 'ai' ? '✦' : '◈'}</div>
        <div class="ac-bubble">${text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}</div>`;
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function acShowTyping() {
      const msgs  = document.getElementById('acMessages');
      const empty = document.getElementById('acEmpty');
      if (empty) empty.style.display = 'none';
      const div = document.createElement('div');
      div.className = 'ac-msg ai'; div.id = 'acTyping';
      div.innerHTML = `<div class="ac-avatar">✦</div><div class="ac-bubble ac-typing-bubble"><div class="ac-dot"></div><div class="ac-dot"></div><div class="ac-dot"></div></div>`;
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function acHideTyping() {
      const el = document.getElementById('acTyping');
      if (el) el.remove();
    }

    const GROQ_SYSTEM = `You are Orbit AI, the assistant built into Orbit — a gaming platform with 34 browser games. Be chill, casual, and fun. Keep answers short (1-3 sentences usually). Use lowercase, be relaxed, use the occasional emoji.

Games: Tetrix (Puzzle), Neon Snake (Arcade), 2048 (Puzzle), Minefield (Classic), Flapbird (Arcade), Brickout (Classic), Pac-Grid (Arcade), Starblast (Arcade), Pong Duel (Sports), Chess Classic (Classic), Sudoku Pro (Puzzle), Wordcraft (Chill), Memory Grid (Puzzle), Card Solitaire (Chill), Mahjong Tiles (Chill), Tic Tac Toe (Classic), Column Drop (Puzzle), Sea Battle (Classic), Tower Rush (RPG), Cookie Empire (Chill), TypeSpeed (Rhythm), Asteroid Field (Arcade), Bubble Pop (Chill), Mole Hunt (Fun), Color Simon (Classic), Hangman (Classic), Blackjack 21 (Classic), Pixel Dungeon (Horror), Number Slide (Puzzle), Word Hunt (Puzzle), Gravity Shift (Racing), Orbit Classic (Classic), Idle Kingdom (Chill), Hex Merge (Puzzle).

CRITICAL RULE: If ANYONE asks for homework help, essays, math problems, coding assignments for school, academic writing, study help, or anything school-related — refuse immediately. Say something like "nah that's not my vibe lol, i only do games 🎮" and don't budge.`;

    let acConvHistory = [];

    async function acSend() {
      const ta   = document.getElementById('acTextarea');
      const text = ta.value.trim();
      if (!text) return;
      ta.value = ''; ta.style.height = '';
      acUpdateSendBtn(); acClosePalette();
      const chipCtx  = acChips.length ? `[Context: ${acChips.join(', ')}]\n` : '';
      const fullText = chipCtx + text;
      acAddMsg('user', text);
      acChips = []; document.getElementById('acChipsRow').innerHTML = '';
      acConvHistory.push({ role: 'user', content: fullText });
      if (acConvHistory.length > 14) acConvHistory = acConvHistory.slice(-14);
      const lbl = document.querySelector('.ac-model-label');
      if (lbl) lbl.textContent = 'Orbit AI · llama-3.3';
      acShowTyping();
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: GROQ_SYSTEM }, ...acConvHistory],
            max_tokens: 280, temperature: 0.82,
          }),
        });
        const data = await resp.json();
        acHideTyping();
        const reply = data.choices?.[0]?.message?.content?.trim() || "hmm something went weird, try again?";
        acConvHistory.push({ role: 'assistant', content: reply });
        if (acConvHistory.length > 14) acConvHistory = acConvHistory.slice(-14);
        acAddMsg('ai', reply);
      } catch(e) {
        acHideTyping();
        acAddMsg('ai', 'my connection glitched 😬 try again in a sec');
      }
    }

    function acSendSuggestion(text) {
      document.getElementById('acTextarea').value = text;
      acSend();
    }

    function acOnInput(ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 156) + 'px';
      acUpdateSendBtn();
      const val = ta.value;
      if (val.startsWith('/')) acOpenPalette(val.slice(1));
      else acClosePalette();
    }

    function acUpdateSendBtn() {
      const ta  = document.getElementById('acTextarea');
      const btn = document.getElementById('acSendBtn');
      if (btn) btn.classList.toggle('ready', ta.value.trim().length > 0);
    }

    function acKeydown(e) {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); acSend(); }
      if (e.key === 'Escape') acClosePalette();
    }

    function acOpenPalette(filter) {
      const palette = document.getElementById('acCmdPalette');
      let visible = 0;
      palette.querySelectorAll('.ac-cmd-item').forEach(item => {
        const name = item.querySelector('.ac-cmd-slash').textContent.slice(1);
        const show = !filter || name.startsWith(filter.toLowerCase());
        item.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      palette.classList.toggle('open', visible > 0);
    }

    function acClosePalette() {
      const p = document.getElementById('acCmdPalette');
      if (p) p.classList.remove('open');
    }

    function acSelectCmd(cmd) {
      const ta = document.getElementById('acTextarea');
      ta.value = cmd + ' '; ta.focus();
      acClosePalette(); acUpdateSendBtn();
    }

    function acAddChip() {
      const options = ['Tetrix','Neon Snake','Chess Classic','Pixel Dungeon','Cookie Empire','2048','TypeSpeed','Pong Duel'];
      const available = options.filter(o => !acChips.includes(o));
      if (!available.length || acChips.length >= 4) return;
      const pick = available[Math.floor(Math.random() * available.length)];
      acChips.push(pick);
      const row  = document.getElementById('acChipsRow');
      const chip = document.createElement('div');
      chip.className = 'ac-chip';
      chip.dataset.name = pick;
      chip.innerHTML = `${pick} <button class="ac-chip-remove" title="Remove" onclick="acRemoveChip(this)">×</button>`;
      row.appendChild(chip);
    }

    function acRemoveChip(btn) {
      const chip = btn.parentElement;
      acChips = acChips.filter(c => c !== chip.dataset.name);
      chip.remove();
    }

    let acGlowBound = false;
    function initAcGlow() {
      if (acGlowBound) return;
      acGlowBound = true;
      const wrap = document.getElementById('acWrap');
      const glow = document.getElementById('acGlow');
      if (!wrap || !glow) return;
      wrap.addEventListener('mousemove', e => {
        const r = wrap.getBoundingClientRect();
        const x = ((e.clientX - r.left)  / r.width  * 100).toFixed(1);
        const y = ((e.clientY - r.top)   / r.height * 100).toFixed(1);
        glow.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(var(--gblue-rgb),0.055) 0%, transparent 52%)`;
      });
      wrap.addEventListener('mouseleave', () => { glow.style.background = ''; });
    }

    // ══════════════════════════════════════════════════════════════════
    //  FIREBASE + CHAT
    // ══════════════════════════════════════════════════════════════════

    const FB_CONFIG = {
      apiKey:      import.meta.env.VITE_FIREBASE_API_KEY,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId:   import.meta.env.VITE_FIREBASE_PROJECT_ID,
    };

    let fbApp = null, fbDb = null;
    let fbUid = null, fbUsername = null;
    let groqKey = null, giphyKey = null;
    let gcOnlineUsers = {};

    function ensureFirebase() {
      if (fbApp) return;
      try {
        fbApp = firebase.initializeApp(FB_CONFIG);
        fbDb  = firebase.database();
      } catch(e) {
        // Already initialized (e.g. overlay reopened)
        fbApp = firebase.app();
        fbDb  = firebase.database();
      }

      // ── User identity
      try {
        fbUid      = localStorage.getItem('orbit-uid');
        fbUsername = localStorage.getItem('orbit-username');
      } catch(e) {}
      if (!fbUid) {
        fbUid      = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
        fbUsername = 'Orbit_' + String(Math.floor(1000 + Math.random() * 9000));
        try { localStorage.setItem('orbit-uid', fbUid); localStorage.setItem('orbit-username', fbUsername); } catch(e) {}
      }
      // Restore registered status
      try {
        if (localStorage.getItem('orbit-registered') === '1') {
          isRegistered = true;
          userFriendCode = localStorage.getItem('orbit-friend-code') || null;
        }
      } catch(e) {}

      // ── Load API keys
      fbDb.ref('config/keys/groq').get().then(s  => { if (s.exists()) groqKey   = s.val(); });
      fbDb.ref('config/keys/giphy').get().then(s => { if (s.exists()) giphyKey  = s.val(); });

      // ── Presence
      const presRef = fbDb.ref('presence/' + fbUid);
      fbDb.ref('.info/connected').on('value', snap => {
        if (!snap.val()) return;
        presRef.onDisconnect().update({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
        presRef.set({ online: true, username: fbUsername, lastSeen: firebase.database.ServerValue.TIMESTAMP });
      });

      // ── Watch all presence
      fbDb.ref('presence').on('value', snap => {
        gcOnlineUsers = {};
        snap.forEach(child => {
          gcOnlineUsers[child.key] = { uid: child.key, ...child.val() };
        });
        renderOnlinePills();
        renderDmSidebar();
      });
    }

    // ── HTML helpers
    function escH(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function escJ(s) { return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n'); }

    // ══════════════════════════════════════════════════════════════════
    //  GLOBAL CHAT
    // ══════════════════════════════════════════════════════════════════

    let gcInitialized = false;
    let gcReplyTo     = null;
    let gcMentionStart = -1;
    let gcGifOpen     = false;
    let gcPendingGif  = null;
    let gcTypingTimer = null;
    let gcIsTyping    = false;
    let gcGifTimer    = null;

    const GC_REACTIONS = ['👍','❤️','😂','😮','🔥','😢'];

    function initGlobalChat() {
      ensureFirebase();
      if (gcInitialized || !fbDb) return;
      gcInitialized = true;

      // Messages
      fbDb.ref('chat/messages').limitToLast(80).on('value', snap => {
        const msgs = [];
        snap.forEach(c => msgs.push({ id: c.key, ...c.val() }));
        renderGcMessages(msgs);
      });

      // Typing
      fbDb.ref('chat/typing').on('value', snap => {
        const typers = [];
        snap.forEach(c => {
          if (c.key === fbUid) return;
          const d = c.val();
          if (d && d.active && Date.now() - (d.ts||0) < 5000) typers.push(d.username || 'Someone');
        });
        const bar = document.getElementById('gcTypingBar');
        if (!bar) return;
        if (!typers.length) { bar.innerHTML = ''; return; }
        const label = typers.slice(0,3).join(', ') + (typers.length===1?' is':' are') + ' typing…';
        bar.innerHTML = `<div class="gc-typing-dots-wrap"><div class="gc-typing-dot"></div><div class="gc-typing-dot"></div><div class="gc-typing-dot"></div></div><span>${escH(label)}</span>`;
      });
    }

    function renderOnlinePills() {
      const el = document.getElementById('gcOnlinePills');
      const ct = document.getElementById('gcOnlineCount');
      if (!el) return;
      const online = Object.values(gcOnlineUsers).filter(u => u.online);
      if (ct) ct.textContent = online.length;
      el.innerHTML = online.map(u =>
        `<div class="gc-online-pill${u.uid===fbUid?' self':''}"
          title="${u.uid===fbUid?'You':'DM '+escH(u.username||'User')}"
          onclick="${u.uid!==fbUid?`openDmWith('${escJ(u.uid)}','${escJ(u.username||'User')}')`:''}"
        ><div class="gc-pill-dot${u.uid===fbUid?' self':''}"></div>${escH(u.username||'User')}</div>`
      ).join('');
    }

    function renderGcMessages(msgs) {
      const c = document.getElementById('gcMsgs');
      if (!c) return;
      const atBottom = c.scrollTop + c.clientHeight >= c.scrollHeight - 100;
      if (!msgs.length) { c.innerHTML = '<div class="gc-empty-msg">No messages yet — say something!</div>'; return; }
      let html = '', prevUid = null, prevTime = 0;
      msgs.forEach(msg => {
        const ts = msg.timestamp || 0;
        const grouped = msg.uid === prevUid && ts - prevTime < 300000 && !msg.replyTo;
        html += buildGcMsgHtml(msg, grouped);
        prevUid = msg.uid; prevTime = ts;
      });
      c.innerHTML = html;
      if (atBottom) c.scrollTop = c.scrollHeight;
      c.querySelectorAll('.gc-react-opener').forEach(btn =>
        btn.addEventListener('click', e => { e.stopPropagation(); showReactionPicker(btn, btn.dataset.id); })
      );
    }

    function buildGcMsgHtml(msg, grouped) {
      const time    = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '';
      const uname   = escH(msg.username || 'User');
      const isSelf  = msg.uid === fbUid;
      const initials = (msg.username||'?').slice(0,2).toUpperCase();

      let body = '';
      if (msg.text) body += `<div class="gc-msg-text">${escH(msg.text).replace(/@(\w+)/g,'<span class="gc-mention">@$1</span>')}</div>`;
      if (msg.imageData) body += `<img class="gc-msg-image" src="${msg.imageData}" loading="lazy" onclick="gcViewImg(this.src)"/>`;
      if (msg.gifUrl)    body += `<img class="gc-msg-gif"   src="${escH(msg.gifUrl)}" loading="lazy"/>`;

      let replyHtml = '';
      if (msg.replyTo) replyHtml = `<div class="gc-reply-quote">
        <span class="gc-reply-quote-user">${escH(msg.replyTo.username||'')}</span>
        <span class="gc-reply-quote-text">${escH((msg.replyTo.text||'').slice(0,80))}</span>
      </div>`;

      let reactHtml = '<div class="gc-reactions">';
      if (msg.reactions) {
        for (const [emoji, users] of Object.entries(msg.reactions)) {
          const cnt = Object.keys(users).length;
          if (!cnt) continue;
          const act = users[fbUid] ? ' active' : '';
          reactHtml += `<button class="gc-reaction-chip${act}" onclick="gcToggleReaction('${msg.id}','${emoji}')">${emoji} ${cnt}</button>`;
        }
      }
      reactHtml += `<button class="gc-reaction-add gc-react-opener" data-id="${msg.id}" title="React">＋</button></div>`;

      const actions = `<div class="gc-msg-actions">
        <button class="gc-act-btn" onclick="gcSetReply('${msg.id}','${uname}','${escJ(msg.text||'')}')" title="Reply">↩</button>
        <button class="gc-act-btn gc-react-opener" data-id="${msg.id}" title="React">☺</button>
      </div>`;

      if (grouped) return `<div class="gc-msg-row grouped" data-id="${msg.id}">
        <div class="gc-msg-spacer"></div>
        <div class="gc-msg-body">${replyHtml}${body}${reactHtml}</div>${actions}</div>`;

      return `<div class="gc-msg-row${isSelf?' self':''}" data-id="${msg.id}">
        <div class="gc-msg-avatar" title="${uname}">${initials}</div>
        <div class="gc-msg-body">
          <div class="gc-msg-header">
            <span class="gc-msg-username${isSelf?' self':''}">${uname}</span>
            <span class="gc-msg-time">${time}</span>
          </div>
          ${replyHtml}${body}${reactHtml}
        </div>${actions}</div>`;
    }

    function gcSend() {
      if (!fbDb) return;
      const ta  = document.getElementById('gcTextarea');
      const text = ta.value.trim();
      if (!text && !gcPendingGif) return;
      const msg = { uid: fbUid, username: fbUsername, timestamp: firebase.database.ServerValue.TIMESTAMP };
      if (text)       msg.text   = text;
      if (gcReplyTo)  msg.replyTo = gcReplyTo;
      if (gcPendingGif) { msg.gifUrl = gcPendingGif; gcPendingGif = null; document.getElementById('gcGifChipWrap').innerHTML = ''; }
      fbDb.ref('chat/messages').push(msg);
      fbDb.ref('chat/typing/'+fbUid).remove();
      ta.value = ''; ta.style.height = '20px';
      gcClearReply(); gcClearMention(); gcUpdateSendBtn(); gcUpdateCharCount();
      gcIsTyping = false; clearTimeout(gcTypingTimer);
    }

    function gcSendImageData(dataUrl) {
      if (!fbDb) return;
      fbDb.ref('chat/messages').push({ uid:fbUid, username:fbUsername, timestamp:firebase.database.ServerValue.TIMESTAMP, imageData:dataUrl });
    }

    function gcOnInput(ta) {
      const GC_MIN_H = 20, GC_MAX_H = 120;
      ta.style.height = GC_MIN_H + 'px';
      ta.style.height = Math.min(ta.scrollHeight, GC_MAX_H) + 'px';
      gcUpdateSendBtn();
      gcUpdateCharCount();
      if (!gcIsTyping && fbDb) {
        gcIsTyping = true;
        fbDb.ref('chat/typing/'+fbUid).set({ active:true, username:fbUsername, ts:Date.now() });
      }
      clearTimeout(gcTypingTimer);
      gcTypingTimer = setTimeout(() => {
        gcIsTyping = false;
        fbDb?.ref('chat/typing/'+fbUid).remove();
      }, 3500);
      // @mention detection
      const val = ta.value, cur = ta.selectionStart;
      const m = val.slice(0,cur).match(/@(\w*)$/);
      if (m) { gcMentionStart = cur - m[0].length; gcShowMention(m[1]); }
      else gcClearMention();
    }

    function gcKeydown(e) {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); gcSend(); }
      if (e.key === 'Escape') { gcClearMention(); gcClosePicker(); }
    }

    function gcUpdateSendBtn() {
      const ta = document.getElementById('gcTextarea');
      const btn = document.getElementById('gcSendBtn');
      if (btn) btn.classList.toggle('ready', !!(ta?.value.trim() || gcPendingGif));
    }

    function gcUpdateCharCount() {
      const ta  = document.getElementById('gcTextarea');
      const el  = document.getElementById('gcCharCount');
      if (!ta || !el) return;
      const len = ta.value.length;
      if (len < 400) { el.textContent = ''; el.className = 'gc-char-count'; return; }
      el.textContent = `${len}/500`;
      el.className   = 'gc-char-count' + (len >= 480 ? ' danger' : ' warn');
    }

    // Re-compute textarea height if the panel resizes (e.g. window resize or sidebar toggle)
    window.addEventListener('resize', () => {
      const ta = document.getElementById('gcTextarea');
      if (ta && ta.value) gcOnInput(ta);
    });

    function gcSetReply(msgId, username, text) {
      gcReplyTo = { msgId, username, text };
      document.getElementById('gcReplyBar').classList.add('show');
      document.getElementById('gcReplyUser').textContent = username;
      document.getElementById('gcReplyText').textContent = text.slice(0,70);
      document.getElementById('gcTextarea')?.focus();
    }
    function gcClearReply() {
      gcReplyTo = null;
      document.getElementById('gcReplyBar')?.classList.remove('show');
    }

    function gcToggleReaction(msgId, emoji) {
      if (!fbDb) return;
      const path = `chat/messages/${msgId}/reactions/${emoji}/${fbUid}`;
      fbDb.ref(path).once('value').then(s => s.val() ? fbDb.ref(path).remove() : fbDb.ref(path).set(true));
    }

    function showReactionPicker(btn, msgId) {
      document.querySelectorAll('.gc-reaction-picker').forEach(p => p.remove());
      const picker = document.createElement('div');
      picker.className = 'gc-reaction-picker';
      GC_REACTIONS.forEach(emoji => {
        const b = document.createElement('button');
        b.className = 'gc-reaction-picker-btn'; b.textContent = emoji;
        b.onclick = e => { e.stopPropagation(); gcToggleReaction(msgId, emoji); picker.remove(); };
        picker.appendChild(b);
      });
      const row = btn.closest('.gc-msg-row');
      (row || btn.parentElement).appendChild(picker);
      setTimeout(() => document.addEventListener('click', () => picker.remove(), { once:true }), 10);
    }

    // ── GIF Picker
    function gcToggleGifPicker() {
      const el = document.getElementById('gcGifPicker');
      gcGifOpen = !gcGifOpen;
      el?.classList.toggle('open', gcGifOpen);
      if (gcGifOpen) gcLoadTrending();
    }
    function gcClosePicker() {
      gcGifOpen = false;
      document.getElementById('gcGifPicker')?.classList.remove('open');
    }

    async function gcLoadTrending() {
      const grid = document.getElementById('gcGifGrid');
      if (!grid) return;
      if (!giphyKey) { grid.innerHTML = '<div class="gc-gif-loading">Set config/keys/giphy in Firebase to enable GIFs</div>'; return; }
      grid.innerHTML = '<div class="gc-gif-loading">Loading trending…</div>';
      try {
        const r = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${giphyKey}&limit=20&rating=g`);
        const d = await r.json();
        gcShowGifGrid(d.data?.map(g => ({ url: g.images.fixed_height_small.url, title: g.title })) || []);
      } catch(e) { grid.innerHTML = '<div class="gc-gif-loading">Failed to load GIFs.</div>'; }
    }

    function gcSearchGifs(q) {
      clearTimeout(gcGifTimer);
      gcGifTimer = setTimeout(async () => {
        if (!q.trim()) { gcLoadTrending(); return; }
        if (!giphyKey) return;
        const grid = document.getElementById('gcGifGrid');
        if (grid) grid.innerHTML = '<div class="gc-gif-loading">Searching…</div>';
        try {
          const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${giphyKey}&q=${encodeURIComponent(q)}&limit=20&rating=g`);
          const d = await r.json();
          gcShowGifGrid(d.data?.map(g => ({ url: g.images.fixed_height_small.url, title: g.title })) || []);
        } catch(e) {}
      }, 400);
    }

    function gcShowGifGrid(items) {
      const grid = document.getElementById('gcGifGrid');
      if (!grid) return;
      if (!items.length) { grid.innerHTML = '<div class="gc-gif-loading">No results.</div>'; return; }
      grid.innerHTML = items.map(g =>
        `<img class="gc-gif-item" src="${escH(g.url)}" alt="${escH(g.title)}" loading="lazy" onclick="gcSelectGif('${escJ(g.url)}')"/>`
      ).join('');
    }

    function gcSelectGif(url) {
      gcPendingGif = url;
      gcClosePicker();
      gcUpdateSendBtn();
      const wrap = document.getElementById('gcGifChipWrap');
      if (wrap) wrap.innerHTML = `<div class="gc-gif-chip">
        <img src="${escH(url)}" style="height:28px;border-radius:3px;object-fit:cover;"/>
        GIF ready
        <button class="gc-gif-chip-remove" onclick="gcClearPendingGif()">×</button>
      </div>`;
      document.getElementById('gcTextarea')?.focus();
    }

    function gcClearPendingGif() {
      gcPendingGif = null;
      document.getElementById('gcGifChipWrap').innerHTML = '';
      gcUpdateSendBtn();
    }

    // ── Image upload
    function gcTriggerImageUpload() { document.getElementById('gcImageInput')?.click(); }

    function gcHandleImage(input) {
      const file = input.files[0];
      if (!file) return;
      input.value = '';
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const maxW = 700, scale = Math.min(1, maxW / img.width);
          const cv = document.createElement('canvas');
          cv.width = img.width * scale; cv.height = img.height * scale;
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          gcSendImageData(cv.toDataURL('image/jpeg', 0.72));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function gcViewImg(src) {
      const ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(4px)';
      const im = document.createElement('img');
      im.src = src; im.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:8px;object-fit:contain;';
      ov.appendChild(im); ov.onclick = () => ov.remove();
      document.body.appendChild(ov);
    }

    // ── @mentions
    function gcShowMention(filter) {
      const dd = document.getElementById('gcMentionDropdown');
      if (!dd) return;
      const online = Object.values(gcOnlineUsers).filter(u => u.uid !== fbUid && u.online);
      const hits   = filter ? online.filter(u => (u.username||'').toLowerCase().startsWith(filter.toLowerCase())) : online;
      if (!hits.length) { gcClearMention(); return; }
      dd.innerHTML = hits.slice(0,6).map(u =>
        `<div class="gc-mention-item" onclick="gcInsertMention('${escJ(u.username||'User')}')">
          <div class="gc-mention-dot"></div>
          <span class="gc-mention-name">${escH(u.username||'User')}</span>
        </div>`
      ).join('');
      dd.classList.add('open');
    }

    function gcInsertMention(username) {
      const ta = document.getElementById('gcTextarea');
      if (!ta) return;
      ta.value = ta.value.slice(0, gcMentionStart) + '@' + username + ' ' + ta.value.slice(ta.selectionStart);
      ta.focus(); gcClearMention(); gcUpdateSendBtn();
    }
    function gcClearMention() {
      gcMentionStart = -1;
      document.getElementById('gcMentionDropdown')?.classList.remove('open');
    }

    // ══════════════════════════════════════════════════════════════════
    //  DIRECT MESSAGES
    // ══════════════════════════════════════════════════════════════════

    let dmCurrentUid  = null;
    let dmCurrentName = null;
    let dmListener    = null;
    let dmTypingTimer = null;
    let dmIsTyping    = false;

    function initDmPanel() {
      ensureFirebase();
      renderDmSidebar();
    }

    function renderDmSidebar() {
      const list = document.getElementById('dmUserList');
      if (!list) return;
      const users = Object.values(gcOnlineUsers).filter(u => u.uid !== fbUid);
      if (!users.length) {
        list.innerHTML = '<div style="padding:1rem 0.75rem;font-size:0.68rem;color:rgba(255,255,255,0.12);font-family:var(--orbit-ui)">No users online</div>';
        return;
      }
      list.innerHTML = users.map(u =>
        `<div class="dm-user-item${u.uid===dmCurrentUid?' active':''}" onclick="openDmWith('${escJ(u.uid)}','${escJ(u.username||'User')}')">
          <div class="dm-user-dot${u.online?'':' offline'}"></div>
          <span class="dm-user-name">${escH(u.username||'User')}</span>
        </div>`
      ).join('');
    }

    function dmConvId(a, b) { return [a,b].sort().join('__'); }

    function openDmWith(uid, username) {
      // Ensure DM panel is visible
      if (!document.getElementById('dmPanel').classList.contains('active')) {
        selectSidebarItem(document.getElementById('nav-dm'));
      }
      if (dmCurrentUid === uid) return;
      // Detach previous listener
      if (dmListener && dmCurrentUid) {
        fbDb?.ref('dm/' + dmConvId(fbUid, dmCurrentUid) + '/messages').off('value', dmListener);
        dmListener = null;
      }
      dmCurrentUid = uid; dmCurrentName = username;
      renderDmSidebar();

      // Show message area
      document.getElementById('dmNochat').style.display   = 'none';
      document.getElementById('dmMsgArea').style.display  = 'flex';

      // Header
      const isOnline = gcOnlineUsers[uid]?.online;
      document.getElementById('dmHeader').innerHTML = `
        <div class="dm-header-dot" style="${isOnline?'':'background:rgba(255,255,255,0.16)'}"></div>
        <div>
          <div class="dm-header-name">${escH(username)}</div>
          <div class="dm-header-status">${isOnline?'Online':'Last seen recently'}</div>
        </div>`;

      // Messages listener
      const convId = dmConvId(fbUid, uid);
      dmListener = fbDb.ref('dm/'+convId+'/messages').limitToLast(60).on('value', snap => {
        const msgs = [];
        snap.forEach(c => msgs.push({ id:c.key, ...c.val() }));
        renderDmMessages(msgs);
      });
    }

    function renderDmMessages(msgs) {
      const c = document.getElementById('dmMsgs');
      if (!c) return;
      const atBottom = c.scrollTop + c.clientHeight >= c.scrollHeight - 60;
      if (!msgs.length) { c.innerHTML = '<div class="dm-empty">Send a message to get the conversation going</div>'; return; }
      let html = '', prevUid = null, prevTime = 0;
      msgs.forEach(msg => {
        const ts = msg.timestamp||0;
        const grouped = msg.uid === prevUid && ts - prevTime < 300000;
        const isSelf  = msg.uid === fbUid;
        const uname   = escH(msg.username||'User');
        const initials = (msg.username||'?').slice(0,2).toUpperCase();
        const time     = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '';
        let body = msg.text ? `<div class="gc-msg-text">${escH(msg.text)}</div>` : '';
        if (msg.imageData) body += `<img class="gc-msg-image" src="${msg.imageData}" loading="lazy" onclick="gcViewImg(this.src)"/>`;
        if (grouped) {
          html += `<div class="gc-msg-row grouped"><div class="gc-msg-spacer"></div><div class="gc-msg-body">${body}</div></div>`;
        } else {
          html += `<div class="gc-msg-row${isSelf?' self':''}">
            <div class="gc-msg-avatar" title="${uname}">${initials}</div>
            <div class="gc-msg-body">
              <div class="gc-msg-header">
                <span class="gc-msg-username${isSelf?' self':''}">${uname}</span>
                <span class="gc-msg-time">${time}</span>
              </div>${body}
            </div></div>`;
        }
        prevUid = msg.uid; prevTime = ts;
      });
      c.innerHTML = html;
      if (atBottom) c.scrollTop = c.scrollHeight;
    }

    function dmSend() {
      if (!fbDb || !dmCurrentUid) return;
      const ta = document.getElementById('dmTextarea');
      const text = ta.value.trim();
      if (!text) return;
      fbDb.ref('dm/'+dmConvId(fbUid,dmCurrentUid)+'/messages').push({
        uid: fbUid, username: fbUsername,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        text,
      });
      ta.value = ''; ta.style.height = ''; dmUpdateSendBtn();
    }

    function dmKeydown(e) {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); dmSend(); }
    }
    function dmOnInput(ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
      dmUpdateSendBtn();
    }
    function dmUpdateSendBtn() {
      const ta = document.getElementById('dmTextarea');
      const btn = document.getElementById('dmSendBtn');
      if (btn) btn.classList.toggle('ready', !!(ta?.value.trim()));
    }

    // ══════════════════════════════════════════════════════════════════
    //  ACCOUNT SYSTEM
    // ══════════════════════════════════════════════════════════════════

    let isRegistered   = false;
    let userFriendCode = null;

    async function sha256(str) {
      const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
    }

    function updateProfileDisplay() {
      const avEl = document.getElementById('sbAvatar');
      const unEl = document.getElementById('sbUsername');
      if (avEl) avEl.textContent  = (fbUsername||'?').slice(0,2).toUpperCase();
      if (unEl) unEl.textContent  = fbUsername || 'Guest';
    }

    function toggleProfileDropdown(e) {
      e.stopPropagation();
      const dd = document.getElementById('profileDropdown');
      const open = dd.classList.contains('open');
      if (open) { dd.classList.remove('open'); return; }
      renderProfileDropdown();
      dd.classList.add('open');
      setTimeout(() => document.addEventListener('click', () => dd.classList.remove('open'), { once:true }), 10);
    }

    function renderProfileDropdown() {
      const dd = document.getElementById('profileDropdown');
      if (!dd) return;
      const badge = isRegistered ? 'member' : 'guest';
      const badgeTxt = isRegistered ? '✦ Member' : 'Guest';
      const codeHtml = userFriendCode
        ? `<div class="profile-dd-code" onclick="copyFriendCode()" title="Click to copy"># ${userFriendCode}</div>` : '';
      const actions = isRegistered
        ? `<div class="profile-dd-sep"></div>
           <div class="profile-dd-item" onclick="showChangeName()">✏ Change Name</div>
           <div class="profile-dd-item danger" onclick="signOut()">⤴ Sign Out</div>`
        : `<div class="profile-dd-sep"></div>
           <div class="profile-dd-item" onclick="showChangeName()">✏ Change Name</div>
           <div class="profile-dd-item" onclick="showAuthModal('signin')">🔑 Sign In</div>
           <div class="profile-dd-item" onclick="showAuthModal('register')">⊕ Register</div>`;
      dd.innerHTML = `<div class="profile-dd-user">
        <div class="profile-dd-name">${escH(fbUsername||'Guest')}</div>
        <div class="profile-dd-badge ${badge}">${badgeTxt}</div>${codeHtml}
      </div>${actions}`;
    }

    function showChangeName() {
      document.getElementById('profileDropdown')?.classList.remove('open');
      const name = prompt('New username (3–20 chars, letters/numbers/underscores):', fbUsername);
      if (!name) return;
      const clean = name.trim().replace(/[^a-zA-Z0-9_]/g,'');
      if (clean.length < 3 || clean.length > 20) { alert('Username must be 3–20 characters.'); return; }
      fbUsername = clean;
      try { localStorage.setItem('orbit-username', fbUsername); } catch(e) {}
      if (fbDb) fbDb.ref('presence/'+fbUid).update({ username: fbUsername });
      updateProfileDisplay();
    }

    function showAuthModal(tab) {
      document.getElementById('profileDropdown')?.classList.remove('open');
      document.getElementById('authModal')?.classList.add('open');
      setAuthTab(tab);
      document.getElementById('authUsernameInput').value = '';
      document.getElementById('authPasswordInput').value = '';
      document.getElementById('authError').textContent   = '';
    }

    function closeAuthModal() {
      document.getElementById('authModal')?.classList.remove('open');
    }

    function setAuthTab(tab) {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
      document.getElementById('authModal').dataset.tab = tab;
      document.getElementById('authSubmitBtn').textContent = tab === 'signin' ? 'Sign In' : 'Register';
      document.getElementById('authBoxSub').textContent    = tab === 'signin' ? 'Welcome back' : 'Create an account';
    }

    async function authSubmit() {
      const tab   = document.getElementById('authModal').dataset.tab;
      const uname = document.getElementById('authUsernameInput').value.trim();
      const pass  = document.getElementById('authPasswordInput').value;
      const errEl = document.getElementById('authError');
      const btn   = document.getElementById('authSubmitBtn');
      errEl.textContent = '';
      if (!uname || uname.length < 3 || uname.length > 20 || !/^[a-zA-Z0-9_]+$/.test(uname)) {
        errEl.textContent = 'Username: 3–20 chars, letters/numbers/underscores only'; return;
      }
      if (!pass || pass.length < 6) { errEl.textContent = 'Password must be at least 6 characters'; return; }
      if (!fbDb) { errEl.textContent = 'Not connected to Firebase'; return; }
      btn.disabled = true;
      try {
        const hash = await sha256(pass);
        if (tab === 'register') {
          const taken = await fbDb.ref('users').orderByChild('username').equalTo(uname).limitToFirst(1).get();
          if (taken.exists()) { errEl.textContent = 'Username already taken'; return; }
          const fc = Math.random().toString(36).slice(2,8).toUpperCase();
          await fbDb.ref('users/'+fbUid).set({ username:uname, passwordHash:hash, createdAt:firebase.database.ServerValue.TIMESTAMP, friendCode:fc });
          fbDb.ref('stats/totalUsers').transaction(n => (n||0)+1);
          fbUsername = uname; userFriendCode = fc; isRegistered = true;
          try { localStorage.setItem('orbit-username',fbUsername); localStorage.setItem('orbit-registered','1'); localStorage.setItem('orbit-friend-code',fc); } catch(e){}
          fbDb.ref('presence/'+fbUid).update({ username: fbUsername });
          updateProfileDisplay(); closeAuthModal();
          const fcEl = document.getElementById('settingsFriendCode');
          if (fcEl) fcEl.textContent = fc;
        } else {
          // Sign in — look up by username
          const snap = await fbDb.ref('users').orderByChild('username').equalTo(uname).limitToFirst(1).get();
          if (!snap.exists()) { errEl.textContent = 'Account not found'; return; }
          let found = null, foundId = null;
          snap.forEach(c => { found = c.val(); foundId = c.key; });
          if (found.passwordHash !== hash) { errEl.textContent = 'Wrong password'; return; }
          fbUsername = found.username; userFriendCode = found.friendCode||null; isRegistered = true;
          try { localStorage.setItem('orbit-username',fbUsername); localStorage.setItem('orbit-registered','1'); localStorage.setItem('orbit-friend-code',userFriendCode||''); } catch(e){}
          fbDb.ref('presence/'+fbUid).update({ username: fbUsername });
          updateProfileDisplay(); closeAuthModal();
        }
      } catch(err) {
        errEl.textContent = 'Something went wrong. Try again.';
        console.warn('auth error', err);
      } finally {
        btn.disabled = false;
      }
    }

    function signOut() {
      document.getElementById('profileDropdown')?.classList.remove('open');
      isRegistered = false; userFriendCode = null;
      fbUsername = 'Orbit_' + String(Math.floor(1000 + Math.random()*9000));
      try { localStorage.setItem('orbit-username',fbUsername); localStorage.removeItem('orbit-registered'); localStorage.removeItem('orbit-friend-code'); } catch(e){}
      if (fbDb) fbDb.ref('presence/'+fbUid).update({ username: fbUsername });
      updateProfileDisplay();
    }

    // ══════════════════════════════════════════════════════════════════
    //  SETTINGS PANEL
    // ══════════════════════════════════════════════════════════════════

    let settingsInited = false;

    function initSettingsPanel() {
      ensureFirebase();
      renderSettingsThemeTiles();
      loadSettingsStats();
      loadPlatformStats();
      renderPlaytimeChart();
      // Restore brightness
      try {
        const b = localStorage.getItem('orbit-brightness') || '100';
        const sl = document.getElementById('brightnessSlider');
        if (sl) { sl.value = b; document.getElementById('brightnessVal').textContent = b+'%'; applyBrightness(b); }
      } catch(e) {}
      // Restore font active tile
      try {
        const savedFont = localStorage.getItem('orbit-font');
        if (savedFont) document.querySelectorAll('.settings-font-tile').forEach(t => t.classList.toggle('active', t.dataset.font === savedFont));
      } catch(e) {}
      // Restore notif toggle (orbit-switch)
      try {
        const n = document.getElementById('notifToggle');
        if (n) {
          n.checked = localStorage.getItem('orbit-notifs') === '1';
          // Wire change event (safe to add multiple times — handler checks guard)
          if (!n._orbitBound) {
            n._orbitBound = true;
            n.addEventListener('change', e => setNotifPref(e.detail.checked));
          }
        }
      } catch(e) {}
      // Friend code
      if (userFriendCode) { const el = document.getElementById('settingsFriendCode'); if (el) el.textContent = userFriendCode; }
    }

    function renderSettingsThemeTiles() {
      const grid = document.getElementById('settingsThemeGrid');
      if (!grid) return;
      const cur = localStorage.getItem('orbit-theme') || '#4f8ef7';
      grid.innerHTML = Object.entries(THEMES).map(([hex,t]) =>
        `<div class="settings-theme-tile${hex===cur?' active':''}" onclick="applyThemeFromSettings('${hex}',this)">
          <div class="settings-theme-swatch" style="background:${hex};box-shadow:0 0 8px ${hex}44"></div>
          <div class="settings-theme-name">${t.name}</div>
        </div>`
      ).join('');
    }

    function applyThemeFromSettings(hex, el) {
      applyTheme(hex);
      try { localStorage.setItem('orbit-theme', hex); } catch(e){}
      renderGrid();
      document.querySelectorAll('.settings-theme-tile').forEach(t => t.classList.toggle('active', t===el));
      document.querySelectorAll('.sb-theme-dot').forEach(d => d.classList.toggle('active', d.title === THEMES[hex]?.name));
    }

    function setFont(el) {
      const font = el.dataset.font;
      document.documentElement.style.setProperty('--orbit-ui', font);
      document.querySelectorAll('.settings-font-tile').forEach(t => t.classList.toggle('active', t===el));
      try { localStorage.setItem('orbit-font', font); } catch(e){}
    }

    function setBrightness(val) {
      document.getElementById('brightnessVal').textContent = val+'%';
      applyBrightness(val);
      try { localStorage.setItem('orbit-brightness', val); } catch(e){}
    }

    function applyBrightness(val) {
      const ov = document.getElementById('gameOverlay');
      if (ov) ov.style.filter = `brightness(${val/100})`;
    }

    function loadSettingsStats() {
      const total  = parseInt(localStorage.getItem('orbit-total-played')||'0');
      const streak = parseInt(localStorage.getItem('orbit-streak')||'0');
      const el1 = document.getElementById('stTotalPlayed'); if (el1) el1.textContent = total;
      const el2 = document.getElementById('stFavCount');    if (el2) el2.textContent = favorites.size;
      const el3 = document.getElementById('stStreakVal');   if (el3) el3.textContent = streak;
    }

    function loadPlatformStats() {
      if (!fbDb) return;
      fbDb.ref('presence').once('value', snap => {
        let n = 0; snap.forEach(c => { if(c.val().online) n++; });
        const el = document.getElementById('siteStatOnline'); if (el) el.textContent = n;
      });
      fbDb.ref('stats').get().then(snap => {
        if (!snap.exists()) return;
        const d = snap.val();
        const ue = document.getElementById('siteStatUsers'); if (ue) ue.textContent = fmtPlays(d.totalUsers||0);
        const me = document.getElementById('siteStatMsgs');  if (me) me.textContent = fmtPlays(d.totalMessages||0);
      });
    }

    function renderPlaytimeChart() {
      const chart = document.getElementById('playtimeChart');
      if (!chart) return;
      let sessions = {};
      try { sessions = JSON.parse(localStorage.getItem('orbit-sessions')||'{}'); } catch(e){}
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate()-i);
        const key = d.toISOString().slice(0,10);
        days.push({ lbl:['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()], cnt: sessions[key]||0 });
      }
      const max = Math.max(...days.map(d=>d.cnt), 1);
      chart.innerHTML = days.map(d => `<div class="playtime-bar-wrap">
        <div class="playtime-bar-outer"><div class="playtime-bar-inner" style="height:${Math.round(d.cnt/max*100)}%"></div></div>
        <div class="playtime-bar-lbl">${d.lbl}</div>
      </div>`).join('');
    }

    function trackSession() {
      const key = new Date().toISOString().slice(0,10);
      try {
        const s = JSON.parse(localStorage.getItem('orbit-sessions')||'{}');
        s[key] = (s[key]||0)+1;
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-14);
        const cut = cutoff.toISOString().slice(0,10);
        Object.keys(s).forEach(k => { if(k<cut) delete s[k]; });
        localStorage.setItem('orbit-sessions', JSON.stringify(s));
      } catch(e){}
    }

    function copyFriendCode() {
      const code = userFriendCode || document.getElementById('settingsFriendCode')?.textContent;
      if (!code || code==='———') return;
      navigator.clipboard.writeText(code).catch(()=>{});
      const btn = document.getElementById('fcCopyBtn');
      if (btn) { btn.textContent = '✓ Copied'; setTimeout(()=>btn.textContent='⎘ Copy', 1600); }
    }

    async function addFriend() {
      const inp = document.getElementById('addFriendInput');
      const st  = document.getElementById('addFriendStatus');
      const code = inp?.value.trim().toUpperCase();
      if (!code||code.length<4) { if(st) st.textContent='Enter a valid code'; return; }
      if (!fbDb) { if(st) st.textContent='Not connected'; return; }
      const snap = await fbDb.ref('users').orderByChild('friendCode').equalTo(code).limitToFirst(1).get();
      if (!snap.exists()) { if(st) st.textContent='Code not found'; return; }
      let found=null, fid=null; snap.forEach(c=>{found=c.val();fid=c.key;});
      if (fid===fbUid) { if(st) st.textContent="that's you 😄"; return; }
      await fbDb.ref('users/'+fbUid+'/friends/'+fid).set(true);
      if (st) { st.textContent=`Added ${found.username}! ✓`; setTimeout(()=>st.textContent='',3000); }
      if (inp) inp.value='';
    }

    function resetStats() {
      if (!confirm('Reset all your stats? This cannot be undone.')) return;
      try { localStorage.removeItem('orbit-streak'); localStorage.removeItem('orbit-total-played'); localStorage.removeItem('orbit-sessions'); sessionStorage.removeItem('orbit-today'); } catch(e){}
      playedToday = 0;
      document.getElementById('statToday').textContent = '0';
      loadSettingsStats(); renderPlaytimeChart();
    }

    function clearRecents() {
      recentPlayed = [];
      try { localStorage.removeItem('orbit-recent'); } catch(e){}
      renderRecent();
    }

    function exportData() {
      const data = { username:fbUsername, uid:fbUid, favorites:[...favorites], recentPlayed, theme:localStorage.getItem('orbit-theme')||'#4f8ef7', exported:new Date().toISOString() };
      const a = Object.assign(document.createElement('a'), { href:URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})), download:'orbit-data.json' });
      a.click();
    }

    function setNotifPref(val) {
      try { localStorage.setItem('orbit-notifs', val ? '1' : '0'); } catch(e) {}
    }

    async function adminBroadcast() {
      const pass   = document.getElementById('adminPassInput')?.value;
      const msg    = document.getElementById('adminMsgInput')?.value.trim();
      const statEl = document.getElementById('adminStatus');
      if (!pass||!msg) { if(statEl){statEl.textContent='Enter password and message';statEl.style.color='';} return; }
      if (!fbDb) { if(statEl){statEl.textContent='Not connected';} return; }
      if(statEl) statEl.textContent='Verifying…';
      const hash = await sha256(pass);
      const snap = await fbDb.ref('adminAuth/passwordHash').get();
      if (!snap.exists()||snap.val()!==hash) {
        if(statEl){statEl.textContent='Wrong password';statEl.style.color='#f87171';} return;
      }
      await fbDb.ref('chat/messages').push({ uid:'system', username:'📢 Orbit Admin', text:msg, timestamp:firebase.database.ServerValue.TIMESTAMP, isAdmin:true });
      if(statEl){statEl.textContent='Broadcast sent! ✓';statEl.style.color='#22d3a0';}
      document.getElementById('adminPassInput').value='';
      document.getElementById('adminMsgInput').value='';
      setTimeout(()=>{if(statEl){statEl.textContent='';statEl.style.color='';}},3000);
    }

    // ══════════════════════════════════════════════════════════════════
    //  SUGGESTIONS PANEL
    // ══════════════════════════════════════════════════════════════════

    let sugTag = 'feature';
    let sugBound = false;

    const SUG_COLORS = {
      feature:{ bg:'rgba(79,142,247,0.15)', text:'#60a5fa' },
      game:   { bg:'rgba(34,211,160,0.15)', text:'#22d3a0' },
      bug:    { bg:'rgba(220,38,38,0.15)',  text:'#f87171' },
      other:  { bg:'rgba(160,160,160,0.12)',text:'#9ca3af' },
    };

    function initSuggestionsPanel() {
      ensureFirebase();
      if (sugBound||!fbDb) return;
      sugBound = true;
      fbDb.ref('suggestions').orderByChild('timestamp').limitToLast(30).on('value', snap => {
        const list = []; snap.forEach(c => list.push({id:c.key,...c.val()}));
        renderSuggestions(list.reverse());
      });
    }

    function setSugTag(tag, el) {
      sugTag = tag;
      document.querySelectorAll('.sug-tag-pill').forEach(p => p.classList.toggle('active', p===el));
    }

    function sugCharCount(ta) {
      const el = document.getElementById('sugCharCountEl');
      if (el) el.textContent = ta.value.length + ' / 500';
    }

    async function submitSuggestion() {
      const ta   = document.getElementById('sugTextarea');
      const btn  = document.getElementById('sugSubmitBtn');
      const text = ta?.value.trim();
      if (!text||text.length<10||!fbDb) return;
      btn.disabled = true;
      try {
        await fbDb.ref('suggestions').push({ text, tag:sugTag, uid:fbUid, username:fbUsername, timestamp:firebase.database.ServerValue.TIMESTAMP, votes:{} });
        ta.value='';
        const el = document.getElementById('sugCharCountEl'); if(el) el.textContent='0 / 500';
      } finally { btn.disabled=false; }
    }

    function renderSuggestions(list) {
      const el = document.getElementById('sugList');
      if (!el) return;
      if (!list.length) { el.innerHTML='<div style="font-size:0.7rem;color:rgba(255,255,255,0.1);padding:0.5rem 0">No suggestions yet — be the first!</div>'; return; }
      el.innerHTML = list.map(s => {
        const tc   = SUG_COLORS[s.tag]||SUG_COLORS.other;
        const vcnt = Object.keys(s.votes||{}).length;
        const voted = s.votes?.[fbUid]?' voted':'';
        const time  = s.timestamp ? new Date(s.timestamp).toLocaleDateString([],{month:'short',day:'numeric'}) : '';
        return `<div class="sug-card">
          <div class="sug-card-header">
            <span class="sug-card-tag" style="background:${tc.bg};color:${tc.text}">${s.tag||'other'}</span>
            <span class="sug-card-user">${escH(s.username||'Anonymous')}</span>
            <span class="sug-card-time">${time}</span>
          </div>
          <div class="sug-card-text">${escH(s.text)}</div>
          <div><button class="sug-vote-btn${voted}" onclick="voteSuggestion('${s.id}',this)">▲ ${vcnt}</button></div>
        </div>`;
      }).join('');
    }

    function voteSuggestion(id) {
      if (!fbDb) return;
      const path = `suggestions/${id}/votes/${fbUid}`;
      fbDb.ref(path).once('value').then(s => s.val() ? fbDb.ref(path).remove() : fbDb.ref(path).set(true));
    }

    // Apply saved settings on load
    (function() {
      try {
        const font = localStorage.getItem('orbit-font');
        if (font) document.documentElement.style.setProperty('--orbit-ui', font);
        const b = localStorage.getItem('orbit-brightness');
        if (b) applyBrightness(b);
      } catch(e){}
    })();

    // ── Vite Compliance: expose all onclick handlers on window ────────
    window.switchPage             = switchPage;
    window.openLogin              = openLogin;
    window.closeLogin             = closeLogin;
    window.handleBackdropClick    = handleBackdropClick;
    window.attemptLogin           = attemptLogin;
    window.openOverlay            = openOverlay;
    window.closeOverlay           = closeOverlay;
    window.selectSidebarItem      = selectSidebarItem;
    window.filterGames            = filterGames;
    window.setTheme               = setTheme;
    window.toggleProfileDropdown  = toggleProfileDropdown;
    window.playGame               = playGame;
    window.toggleFav              = toggleFav;
    window.setCat                 = setCat;
    window.playRandom             = playRandom;
    window.homeSearchFilter       = homeSearchFilter;
    window.acSend                 = acSend;
    window.acSendSuggestion       = acSendSuggestion;
    window.acKeydown              = acKeydown;
    window.acOnInput              = acOnInput;
    window.acUpdateSendBtn        = acUpdateSendBtn;
    window.acSelectCmd            = acSelectCmd;
    window.acAddChip              = acAddChip;
    window.acRemoveChip           = acRemoveChip;
    window.gcSend                 = gcSend;
    window.gcKeydown              = gcKeydown;
    window.gcOnInput              = gcOnInput;
    window.gcUpdateSendBtn        = gcUpdateSendBtn;
    window.gcClearReply           = gcClearReply;
    window.gcToggleGifPicker      = gcToggleGifPicker;
    window.gcTriggerImageUpload   = gcTriggerImageUpload;
    window.gcHandleImage          = gcHandleImage;
    window.gcSearchGifs           = gcSearchGifs;
    window.gcSelectGif            = gcSelectGif;
    window.gcClearPendingGif      = gcClearPendingGif;
    window.gcToggleReaction       = gcToggleReaction;
    window.gcSetReply             = gcSetReply;
    window.gcViewImg              = gcViewImg;
    window.gcInsertMention        = gcInsertMention;
    window.openDmWith             = openDmWith;
    window.dmSend                 = dmSend;
    window.dmKeydown              = dmKeydown;
    window.dmOnInput              = dmOnInput;
    window.copyFriendCode         = copyFriendCode;
    window.addFriend              = addFriend;
    window.closeAuthModal         = closeAuthModal;
    window.setAuthTab             = setAuthTab;
    window.authSubmit             = authSubmit;
    window.showAuthModal          = showAuthModal;
    window.showChangeName         = showChangeName;
    window.signOut                = signOut;
    window.setFont                = setFont;
    window.setBrightness          = setBrightness;
    window.applyThemeFromSettings = applyThemeFromSettings;
    window.resetStats             = resetStats;
    window.clearRecents           = clearRecents;
    window.exportData             = exportData;
    window.setNotifPref           = setNotifPref;
    window.adminBroadcast         = adminBroadcast;
    window.setSugTag              = setSugTag;
    window.sugCharCount           = sugCharCount;
    window.submitSuggestion       = submitSuggestion;
    window.voteSuggestion         = voteSuggestion;

    // ── Keyboard Shortcuts ───────────────────────────────────────────
    document.addEventListener('keydown', function(e) {
      const overlay = document.getElementById('gameOverlay');
      const modal   = document.getElementById('loginModal');

      if (e.key === 'Escape') {
        if (overlay.classList.contains('open')) { closeOverlay(); return; }
        if (modal.classList.contains('open'))   { closeLogin();   return; }
      }

      if ((e.key === 'g' || e.key === 'G' || e.key === 'b' || e.key === 'B') && e.ctrlKey) {
        e.preventDefault();
        if (overlay.classList.contains('open')) closeOverlay();
        else openOverlay();
      }
    });