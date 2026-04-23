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
      renderSidebarGames();
      document.getElementById('gameOverlay').classList.add('open');
      initLimelightNav();
      // Restore theme
      try {
        const saved = localStorage.getItem('orbit-theme');
        if (saved && THEMES[saved]) {
          applyTheme(saved);
          document.querySelectorAll('.sb-theme-dot').forEach(d => d.classList.remove('active'));
          const dot = [...document.querySelectorAll('.sb-theme-dot')].find(d => d.title === THEMES[saved].name);
          if (dot) dot.classList.add('active');
        }
      } catch(e) {}
      try { ensureFirebase(); }     catch(e) {}
      try { updateProfileDisplay(); } catch(e) {}
      try { trackSession(); }       catch(e) {}
      try { loadStats(); }          catch(e) {}
      try { renderRecent(); }       catch(e) {}
      try { renderFeatured(); }     catch(e) {}
      try { renderGrid(); }         catch(e) { console.error('renderGrid failed:', e); }
      try { initStarfield(); }      catch(e) {}
    }

    function closeOverlay() {
      document.getElementById('gameOverlay').classList.remove('open');
      if (typeof starfieldRaf !== 'undefined' && starfieldRaf) {
        cancelAnimationFrame(starfieldRaf);
        starfieldRaf = null;
      }
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
      const isMovies      = (el.id === 'nav-movies');
      const isSettings    = (el.id === 'nav-settings');
      const isSuggestions = (el.id === 'nav-suggestions');
      const isPricing     = (el.id === 'nav-pricing');
      const isCredits     = (el.id === 'nav-credits');
      const isPlaceholder = !isHome && !isAiChat && !isGlobalChat && !isDm && !isMovies && !isSettings && !isSuggestions && !isPricing && !isCredits;
      document.getElementById('homePanel').classList.toggle('active', isHome);
      document.getElementById('aiChatPanel').classList.toggle('active', isAiChat);
      document.getElementById('globalChatPanel').classList.toggle('active', isGlobalChat);
      document.getElementById('dmPanel').classList.toggle('active', isDm);
      document.getElementById('moviesPanel').classList.toggle('active', isMovies);
      document.getElementById('settingsPanel').classList.toggle('active', isSettings);
      document.getElementById('suggestionsPanel').classList.toggle('active', isSuggestions);
      document.getElementById('pricingPanel').classList.toggle('active', isPricing);
      document.getElementById('creditsPanel').classList.toggle('active', isCredits);
      document.getElementById('placeholderPanel').classList.toggle('active', isPlaceholder);
      if (isPlaceholder) {
        // Non-game placeholder (changelog, etc.) — reset iframe, show "coming soon"
        const iframe    = document.getElementById('gameIframe');
        const phContent = document.getElementById('phContent');
        const phError   = document.getElementById('phIframeError');
        if (iframe) {
          if (iframe._blockTimer) { clearTimeout(iframe._blockTimer); iframe._blockTimer = null; }
          iframe.srcdoc = ''; iframe.src = 'about:blank'; iframe.style.display = 'none';
        }
        if (phContent) phContent.style.display = '';
        if (phError)   phError.style.display = 'none';
        document.getElementById('phIcon').textContent  = '◈';
        document.getElementById('phTitle').textContent = label + ' — Coming Soon';
        document.getElementById('phSub').textContent   = 'This feature will be available in a future update.';
      }
      if (isHome)         { renderRecent(); renderFeatured(); renderGrid(); }
      if (isAiChat)       initAcGlow();
      if (isGlobalChat)   initGlobalChat();
      if (isDm)           initDmPanel();
      if (isMovies)       initMoviesPanel();
      if (isSettings)     initSettingsPanel();
      if (isSuggestions)  initSuggestionsPanel();
      if (isPricing)      initPricingPanel();
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
      { id:1,  name:'Ultrakill',             cat:'Arcade',  icon:'🔫', plays:3241, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/196-fixed.html',                    desc:'Non-stop bullet-hell action — parry projectiles and move at the speed of death.' },
      { id:2,  name:'Untitled Goose Game',   cat:'Fun',     icon:'🪿', plays:2876, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/718.html',                         desc:'Cause mayhem as an absolutely horrible goose in a quiet English village.' },
      { id:3,  name:'Henry Stickman',        cat:'Fun',     icon:'🏃', plays:2543, url:'https://d3rtzzzsiu7gdr.cloudfront.net/files/hs/game/index.html',                     desc:'Help Henry escape with skill, luck, and a lot of ridiculous choices.' },
      { id:4,  name:'Pac-Man',               cat:'Arcade',  icon:'👾', plays:4102, url:'https://freepacman.org/',                                                             desc:'Navigate the maze, eat every dot, and dodge four hungry ghosts.' },
      { id:5,  name:'Flappy Bird',           cat:'Arcade',  icon:'✈️', plays:3987, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/129.html',                                                              desc:'Tap to keep your bird alive through an endless corridor of pipes.' },
      { id:6,  name:'Five Epsteins',         cat:'Fun',     icon:'👁️', plays:1834, url:'https://d3rtzzzsiu7gdr.cloudfront.net/files/fiveepsteins/index.html',                 desc:'Five nights of suspense in a very unconventional setting.' },
      { id:7,  name:'Friday Night Funkin',   cat:'Rhythm',  icon:'🎵', plays:3654, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/8-wow.html',                                                                           desc:'Rap battles to the death — hit every beat and keep your girlfriend impressed.' },
      { id:8,  name:'FNAF',                  cat:'Horror',  icon:'🐻', plays:3210, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/38.html',                    desc:'Survive five nights watching the cameras while animatronics hunt you down.' },
      { id:9,  name:'Moto X3M',              cat:'Racing',  icon:'🏍️', plays:2765, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/96.html',             desc:'Conquer insane obstacle courses on your motorcycle without crashing.' },
      { id:10, name:'Undertale',             cat:'RPG',     icon:'❤️', plays:3498, url:'https://d3rtzzzsiu7gdr.cloudfront.net/files/utale/index.html',                       desc:"A tale where you don't have to kill anyone — or you can. Your choice." },
      { id:11, name:'Soundboard',            cat:'Fun',     icon:'🔊', plays:1567, url:'https://d3rtzzzsiu7gdr.cloudfront.net/files/projects/soundboard/index.html',          desc:'An absurd collection of sounds for your amusement. Press everything.' },
      { id:12, name:"Baldi's Basics",        cat:'Horror',  icon:'📏', plays:2890, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/65-fixed.html',                  desc:'Collect notebooks in a school that gets increasingly wrong the longer you stay.' },
      { id:13, name:'Tanuki Sunset',         cat:'Chill',   icon:'🦝', plays:2134, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/305.html',           desc:'Longboard down an endless mountain road as the sky burns orange.' },
      { id:14, name:'Free Kick Screamers',   cat:'Sports',  icon:'⚽', plays:1678, url:'https://trueedu20.github.io/g77/class-52',                                            desc:'Wind up and strike the perfect free kick through the wall.' },
      { id:15, name:'Tag',                   cat:'Arcade',  icon:'🏃', plays:1432, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/627.html',                                           desc:"Classic tag — don't be \"it\" for too long or it's game over." },
      { id:16, name:'Soccer Random',         cat:'Sports',  icon:'🥅', plays:2345, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/739.html',                                           desc:'Chaotic physics football — every round a new random twist.' },
      { id:17, name:'Basket Random',         cat:'Sports',  icon:'🏀', plays:2198, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/66.html',                                           desc:'Fling ragdoll players at a basketball hoop in hilariously broken physics.' },
      { id:18, name:'Slope 3',               cat:'Arcade',  icon:'🎿', plays:3102, url:'https://trueedu20.github.io/g22/class-399',                                           desc:'Guide a ball down a steep endless slope — faster every second.' },
      { id:19, name:'Drive Mad 2',           cat:'Racing',  icon:'🚗', plays:1876, url:'https://trueedu20.github.io/g72/class-414',                                           desc:'More brutal obstacle courses — bigger jumps, more ways to flip.' },
      { id:20, name:'Drive Mad',             cat:'Racing',  icon:'🚙', plays:2234, url:'https://trueedu20.github.io/g20/class-401',                                           desc:'Balance and speed over brutal obstacle courses without flipping.' },
      { id:21, name:'Eggy Car',              cat:'Fun',     icon:'🥚', plays:1987, url:'https://trueedu20.github.io/g5/class-463',                                            desc:"Drive a car with an egg on top — don't crack it over the bumps." },
      { id:22, name:"That's Not My Neighbor",cat:'Horror',  icon:'🚪', plays:2987, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/216.html',                                                                          desc:'Check IDs at the door — one of them is definitely not human.' },
      { id:23, name:'Boxing Random',         cat:'Sports',  icon:'◎',  plays:1543, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/77.html',                         desc:'Floppy-armed ragdoll boxing — chaotic controls, maximum fun.' },
      { id:24, name:'Granny',                cat:'Horror',  icon:'⚡', plays:2765, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/90-fix2.html',                                  desc:'Escape the house before Granny finds you. She hears everything.' },
      { id:25, name:'Steal a Brainrot',      cat:'Fun',     icon:'◇',  plays:1234, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/479.html',              desc:'A chaotic obstacle run stealing internet-brain energy.' },
      { id:26, name:'Deltarune',             cat:'RPG',     icon:'♟',  plays:2876, url:'https://gwynfish.github.io/deltarune/',                                               desc:'Kris, Susie, and Ralsei dive into the Dark World. Chapter 1 & 2.' },
      { id:27, name:'FNAF 2',                cat:'Horror',  icon:'⚡', plays:2543, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/39.html',                                              desc:'Older animatronics, no doors, just a flashlight and a mask. Good luck.' },
      { id:28, name:'Granny 2',              cat:'Horror',  icon:'⚡', plays:1987, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/125.html',                               desc:'Granny brought a friend. Escape before both of them find you.' },
      { id:29, name:'Granny 3',              cat:'Horror',  icon:'⚡', plays:1654, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/126.html',                               desc:'The nightmare continues — a bigger house, even less mercy.' },
      { id:30, name:'Henry Stickman 2',      cat:'Fun',     icon:'▶',  plays:1876, url:'https://gibbat2.github.io/Games/games/henry-stickman/escapingtheprisongame/',         desc:'Henry needs to break out of prison. Again.' },
      { id:31, name:'Henry Stickman 3',      cat:'Fun',     icon:'▶',  plays:1654, url:'https://jufik.com/swf/game-swf.php?file=stealing-the-diamond.swf',                   desc:'Henry attempts the biggest diamond heist of his career.' },
      { id:32, name:'Henry Stickman 4',      cat:'Fun',     icon:'▶',  plays:1432, url:'https://www.poki.com/en/g/fleeing-the-complex',                                       desc:'The most elaborate prison break yet — choose your escape route.' },
      { id:33, name:'Henry Stickman 5',      cat:'Fun',     icon:'▶',  plays:1234, url:'https://henrystickmin.net/en/infiltrating-the-airship',                               desc:'Infiltrate an airship full of traps, guards, and terrible decisions.' },
      { id:34, name:'Rocket Soccer Derby',   cat:'Sports',  icon:'◎',  plays:2109, url:'https://rocketsoccerderby.gitlab.io/file/',                                           desc:'Rocket-powered cars smashing a ball into a goal. Absolute chaos.' },
      { id:35, name:'A Small World Cup',     cat:'Sports',  icon:'⚽', plays:1876, url:'https://cdn.jsdelivr.net/gh/freebuisness/html@latest/435.html',                                          desc:'Flick your way to World Cup glory in this tiny, addictive football game.' },
      { id:36, name:'Getaway Shootout',      cat:'Fun',     icon:'🔫', plays:3041, url:'https://getaway-shootout.game-files.crazygames.com/unity/unity2020/getaway-shootout.html?isNewUser=true&skipPrerollFirstSession=true&v=1.355', desc:'Race to the getaway vehicle while blasting anyone in your way.' },
{ id:37, name:"Bowmasters", cat:"Fun", icon:"🎮", plays:1800, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/0.html", desc:"Bowmasters" },
      { id:38, name:"OvO", cat:"Fun", icon:"🎮", plays:1798, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/1-fde.html", desc:"OvO" },
      { id:39, name:"OvO 2", cat:"Fun", icon:"🎮", plays:1796, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/2e.html", desc:"OvO 2" },
      { id:40, name:"OvO 3 Dimensions", cat:"Fun", icon:"🎮", plays:1794, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/3.html", desc:"OvO 3 Dimensions" },
      { id:41, name:"Gladihoppers", cat:"Fun", icon:"🎮", plays:1792, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/4.html", desc:"Gladihoppers" },
      { id:42, name:"Ice Dodo", cat:"Fun", icon:"🎮", plays:1790, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/5.html", desc:"Ice Dodo" },
      { id:43, name:"Block Blast", cat:"Fun", icon:"🎮", plays:1788, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/6.html", desc:"Block Blast" },
      { id:44, name:"Jetpack Joyride", cat:"Fun", icon:"🎮", plays:1786, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/7.html", desc:"Jetpack Joyride" },
      { id:45, name:"Sprunki", cat:"Rhythm", icon:"🎶", plays:1784, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/9.html", desc:"Sprunki" },
      { id:46, name:"Temple Run 2", cat:"Fun", icon:"🏃", plays:1782, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/10.html", desc:"Temple Run 2" },
      { id:47, name:"Stickman Hook", cat:"Fun", icon:"🏃", plays:1780, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/11.html", desc:"Stickman Hook" },
      { id:48, name:"Attack Hole", cat:"Fun", icon:"🎮", plays:1778, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/13.html", desc:"Attack Hole" },
      { id:49, name:"Bridge Race", cat:"Fun", icon:"🎮", plays:1776, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/14.html", desc:"Bridge Race" },
      { id:50, name:"Color Water Sort 3D", cat:"Fun", icon:"🎮", plays:1774, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/15.html", desc:"Color Water Sort 3D" },
      { id:51, name:"Hide N Seek", cat:"Fun", icon:"🎮", plays:1772, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/16.html", desc:"Hide N Seek" },
      { id:52, name:"Magic Tiles 3", cat:"Rhythm", icon:"🎮", plays:1770, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/17.html", desc:"Magic Tiles 3" },
      { id:53, name:"Stacky Dash", cat:"Fun", icon:"🎮", plays:1768, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/18.html", desc:"Stacky Dash" },
      { id:54, name:"Supreme Duelist", cat:"Fun", icon:"🎮", plays:1766, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/19.html", desc:"Supreme Duelist" },
      { id:55, name:"Tall Man Run", cat:"Fun", icon:"🏃", plays:1764, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/20a.html", desc:"Tall Man Run" },
      { id:56, name:"Turbo Stars", cat:"Fun", icon:"🎮", plays:1762, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/21.html", desc:"Turbo Stars" },
      { id:57, name:"Mob Control HTML5", cat:"Fun", icon:"🎮", plays:1760, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/22.html", desc:"Mob Control HTML5" },
      { id:58, name:"Pou", cat:"Fun", icon:"🎮", plays:1758, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/23.html", desc:"Pou" },
      { id:59, name:"Crossy Road", cat:"Fun", icon:"🚗", plays:1756, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/24.html", desc:"Crossy Road" },
      { id:60, name:"Basket Battle", cat:"Sports", icon:"🏀", plays:1754, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/25.html", desc:"Basket Battle" },
      { id:61, name:"Amaze", cat:"Fun", icon:"🎮", plays:1752, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/26.html", desc:"Amaze" },
      { id:62, name:"Geometry Dash Lite (REMAKE)", cat:"Fun", icon:"🎮", plays:1750, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/27-f.html", desc:"Geometry Dash Lite (REMAKE)" },
      { id:63, name:"Basketball Frvr", cat:"Sports", icon:"🏀", plays:1748, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/28.html", desc:"Basketball Frvr" },
      { id:64, name:"Bazooka Boy", cat:"Fun", icon:"🎮", plays:1746, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/29.html", desc:"Bazooka Boy" },
      { id:65, name:"Bottle Jump 3D", cat:"Fun", icon:"🎮", plays:1744, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/30.html", desc:"Bottle Jump 3D" },
      { id:66, name:"Color Match", cat:"Fun", icon:"🎮", plays:1742, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/31.html", desc:"Color Match" },
      { id:67, name:"Dig Deep", cat:"Fun", icon:"🎮", plays:1740, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/32.html", desc:"Dig Deep" },
      { id:68, name:"Retro Bowl", cat:"Sports", icon:"🎮", plays:1738, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/33.html", desc:"Retro Bowl" },
      { id:69, name:"Retro Bowl College", cat:"Sports", icon:"🎮", plays:1736, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/34-fixed.html", desc:"Retro Bowl College" },
      { id:70, name:"Monster Tracks", cat:"Fun", icon:"🎮", plays:1734, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/36.html", desc:"Monster Tracks" },
      { id:71, name:"Gobble", cat:"Fun", icon:"🎮", plays:1732, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/37.html", desc:"Gobble" },
      { id:72, name:"Five Nights at Freddy's 3", cat:"Horror", icon:"🐻", plays:1730, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/40.html", desc:"Five Nights at Freddy's 3" },
      { id:73, name:"Five Nights at Freddy's 4", cat:"Horror", icon:"🐻", plays:1728, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/41.html", desc:"Five Nights at Freddy's 4" },
      { id:74, name:"Road of Fury", cat:"Racing", icon:"🚗", plays:1726, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/42.html", desc:"Road of Fury" },
      { id:75, name:"Driven Wild", cat:"Fun", icon:"🚗", plays:1724, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/43.html", desc:"Driven Wild" },
      { id:76, name:"Ragdoll Hit", cat:"Fun", icon:"🎮", plays:1722, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/44-fix.html", desc:"Ragdoll Hit" },
      { id:77, name:"Vex 1", cat:"Fun", icon:"🏃", plays:1720, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/45.html", desc:"Vex 1" },
      { id:78, name:"Vex 2", cat:"Fun", icon:"🏃", plays:1718, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/46.html", desc:"Vex 2" },
      { id:79, name:"Vex 3", cat:"Fun", icon:"🏃", plays:1716, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/47.html", desc:"Vex 3" },
      { id:80, name:"Vex 3 XMAS", cat:"Fun", icon:"🏃", plays:1714, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/48.html", desc:"Vex 3 XMAS" },
      { id:81, name:"Vex 4", cat:"Fun", icon:"🏃", plays:1712, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/49.html", desc:"Vex 4" },
      { id:82, name:"Vex 5", cat:"Fun", icon:"🏃", plays:1710, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/50.html", desc:"Vex 5" },
      { id:83, name:"Vex 6", cat:"Fun", icon:"🏃", plays:1708, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/51.html", desc:"Vex 6" },
      { id:84, name:"Vex 7", cat:"Fun", icon:"🏃", plays:1706, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/52.html", desc:"Vex 7" },
      { id:85, name:"Vex 8", cat:"Fun", icon:"🏃", plays:1704, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/53.html", desc:"Vex 8" },
      { id:86, name:"Vex Challenges", cat:"Fun", icon:"🏃", plays:1702, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/54.html", desc:"Vex Challenges" },
      { id:87, name:"Vex X3M", cat:"Fun", icon:"🏃", plays:1700, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/55.html", desc:"Vex X3M" },
      { id:88, name:"Vex X3M 2", cat:"Fun", icon:"🏃", plays:1698, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/56.html", desc:"Vex X3M 2" },
      { id:89, name:"1v1.LoL", cat:"Fun", icon:"🎮", plays:1696, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/58.html", desc:"1v1.LoL" },
      { id:90, name:"A Dance of Fire and Ice", cat:"Rhythm", icon:"🎶", plays:1694, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/59.html", desc:"A Dance of Fire and Ice" },
      { id:91, name:"Achievement Unlocked", cat:"Fun", icon:"🎮", plays:1692, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/60.html", desc:"Achievement Unlocked" },
      { id:92, name:"Achievement Unlocked 2", cat:"Fun", icon:"🎮", plays:1690, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/61.html", desc:"Achievement Unlocked 2" },
      { id:93, name:"Achievement Unlocked 3", cat:"Fun", icon:"🎮", plays:1688, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/62.html", desc:"Achievement Unlocked 3" },
      { id:94, name:"Angry Birds", cat:"Fun", icon:"🐦", plays:1686, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/63.html", desc:"Angry Birds" },
      { id:95, name:"Backrooms", cat:"Horror", icon:"🎮", plays:1684, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/64-fix.html", desc:"Backrooms" },
      { id:96, name:"Big Tower Tiny Square", cat:"Fun", icon:"🏰", plays:1682, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/67-f.html", desc:"Big Tower Tiny Square" },
      { id:97, name:"Big NEON Tower Tiny Square", cat:"Fun", icon:"🏰", plays:1680, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/68.html", desc:"Big NEON Tower Tiny Square" },
      { id:98, name:"Big ICE Tower Tiny Square", cat:"Fun", icon:"🏰", plays:1678, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/69.html", desc:"Big ICE Tower Tiny Square" },
      { id:99, name:"BitLife", cat:"Fun", icon:"🎮", plays:1676, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/70.html", desc:"BitLife" },
      { id:100, name:"Bloons TD", cat:"Fun", icon:"🎯", plays:1674, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/71.html", desc:"Bloons TD" },
      { id:101, name:"Bloons TD 2", cat:"Fun", icon:"🎯", plays:1672, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/72.html", desc:"Bloons TD 2" },
      { id:102, name:"Bloons TD 3", cat:"Fun", icon:"🎯", plays:1670, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/73.html", desc:"Bloons TD 3" },
      { id:103, name:"Bloons TD 4", cat:"Fun", icon:"🎯", plays:1668, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/74.html", desc:"Bloons TD 4" },
      { id:104, name:"Bloons TD 5", cat:"Fun", icon:"🎯", plays:1666, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/75-fix.html", desc:"Bloons TD 5" },
      { id:105, name:"Bob The Robber 2", cat:"Fun", icon:"🎮", plays:1664, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/76-fix.html", desc:"Bob The Robber 2" },
      { id:106, name:"Burrito Bison: Launcha Libre", cat:"Fun", icon:"🎮", plays:1662, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/78.html", desc:"Burrito Bison: Launcha Libre" },
      { id:107, name:"Cannon Basketball", cat:"Sports", icon:"🏀", plays:1660, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/79.html", desc:"Cannon Basketball" },
      { id:108, name:"Cannon Basketball 2", cat:"Sports", icon:"🏀", plays:1658, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/80.html", desc:"Cannon Basketball 2" },
      { id:109, name:"Cluster Rush", cat:"Fun", icon:"🏃", plays:1656, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/81.html", desc:"Cluster Rush" },
      { id:110, name:"Cookie Clicker", cat:"Fun", icon:"🍪", plays:1654, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/82-a.html", desc:"Cookie Clicker" },
      { id:111, name:"Coreball", cat:"Fun", icon:"🎮", plays:1652, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/83.html", desc:"Coreball" },
      { id:112, name:"Cubefield", cat:"Fun", icon:"🎮", plays:1650, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/84.html", desc:"Cubefield" },
      { id:113, name:"Cut the Rope", cat:"Fun", icon:"🎮", plays:1648, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/85-f.html", desc:"Cut the Rope" },
      { id:114, name:"Draw Climber", cat:"Fun", icon:"🎮", plays:1646, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/86.html", desc:"Draw Climber" },
      { id:115, name:"Emulator.JS", cat:"Fun", icon:"🎮", plays:1644, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/87.html", desc:"Emulator.JS" },
      { id:116, name:"Fireboy and Watergirl 2", cat:"Fun", icon:"🎮", plays:1642, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/88.html", desc:"Fireboy and Watergirl 2" },
      { id:117, name:"Fireboy and Watergirl 3", cat:"Fun", icon:"🎮", plays:1640, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/89.html", desc:"Fireboy and Watergirl 3" },
      { id:118, name:"Gunspin", cat:"Fun", icon:"🔫", plays:1638, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/91.html", desc:"Gunspin" },
      { id:119, name:"Highway Racer 2", cat:"Racing", icon:"🎮", plays:1636, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/92.html", desc:"Highway Racer 2" },
      { id:120, name:"Johnny Trigger", cat:"Fun", icon:"🎮", plays:1634, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/93.html", desc:"Johnny Trigger" },
      { id:121, name:"Journey Downhill", cat:"Fun", icon:"🎮", plays:1632, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/94.html", desc:"Journey Downhill" },
      { id:122, name:"Line Rider", cat:"Fun", icon:"🎮", plays:1630, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/95.html", desc:"Line Rider" },
      { id:123, name:"Moto X3M 2", cat:"Racing", icon:"🏍️", plays:1628, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/97.html", desc:"Moto X3M 2" },
      { id:124, name:"Moto X3M 3", cat:"Racing", icon:"🏍️", plays:1626, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/98.html", desc:"Moto X3M 3" },
      { id:125, name:"Moto X3M Spooky", cat:"Racing", icon:"🏍️", plays:1624, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/99.html", desc:"Moto X3M Spooky" },
      { id:126, name:"Moto X3M Winter", cat:"Racing", icon:"🏍️", plays:1622, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/100-f.html", desc:"Moto X3M Winter" },
      { id:127, name:"Ninja vs EvilCorp", cat:"Fun", icon:"🎮", plays:1620, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/101.html", desc:"Ninja vs EvilCorp" },
      { id:128, name:"Paper.io 2", cat:"Fun", icon:"🎮", plays:1618, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/102.html", desc:"Paper.io 2" },
      { id:129, name:"The World's Hardest Game", cat:"Fun", icon:"🎮", plays:1616, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/103.html", desc:"The World's Hardest Game" },
      { id:130, name:"The World's Hardest Game 3", cat:"Fun", icon:"🎮", plays:1614, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/104.html", desc:"The World's Hardest Game 3" },
      { id:131, name:"The World's Hardest Game 4", cat:"Fun", icon:"🎮", plays:1612, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/105.html", desc:"The World's Hardest Game 4" },
      { id:132, name:"This Is The Only Level", cat:"Fun", icon:"🎮", plays:1610, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/106.html", desc:"This Is The Only Level" },
      { id:133, name:"This Is The Only Level 2", cat:"Fun", icon:"🎮", plays:1608, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/107.html", desc:"This Is The Only Level 2" },
      { id:134, name:"Tiny Fishing", cat:"Fun", icon:"🎣", plays:1606, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/108.html", desc:"Tiny Fishing" },
      { id:135, name:"Tomb Of The Mask", cat:"Fun", icon:"🎮", plays:1604, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/109.html", desc:"Tomb Of The Mask" },
      { id:136, name:"Toss The Turtle", cat:"Fun", icon:"🎮", plays:1602, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/110-f.html", desc:"Toss The Turtle" },
      { id:137, name:"Tube Jumpers", cat:"Fun", icon:"🎮", plays:1600, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/111.html", desc:"Tube Jumpers" },
      { id:138, name:"Wordle", cat:"Fun", icon:"🎮", plays:1598, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/112-fix.html", desc:"Wordle" },
      { id:139, name:"Ruffle", cat:"Fun", icon:"🎮", plays:1596, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/113.html", desc:"Ruffle" },
      { id:140, name:"2048", cat:"Fun", icon:"🎮", plays:1594, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/114-f.html", desc:"2048" },
      { id:141, name:"8 Ball Pool", cat:"Fun", icon:"🎮", plays:1592, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/115.html", desc:"8 Ball Pool" },
      { id:142, name:"Offroad Mountain Bike", cat:"Racing", icon:"🏍️", plays:1590, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/116.html", desc:"Offroad Mountain Bike" },
      { id:143, name:"Space Waves", cat:"Fun", icon:"🎮", plays:1588, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/117-fix.html", desc:"Space Waves" },
      { id:144, name:"Solar Smash", cat:"Fun", icon:"🎮", plays:1586, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/118.html", desc:"Solar Smash" },
      { id:145, name:"Snow Rider 3D", cat:"Racing", icon:"🎮", plays:1584, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/119.html", desc:"Snow Rider 3D" },
      { id:146, name:"Fortzone Battle Royale", cat:"Fun", icon:"🎮", plays:1582, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/120.html", desc:"Fortzone Battle Royale" },
      { id:147, name:"Brawl Guys.io", cat:"Fun", icon:"🎮", plays:1580, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/121.html", desc:"Brawl Guys.io" },
      { id:148, name:"Survival Race", cat:"Fun", icon:"🎮", plays:1578, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/122.html", desc:"Survival Race" },
      { id:149, name:"Poly Track", cat:"Racing", icon:"🎮", plays:1576, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/123-win.html", desc:"Poly Track" },
      { id:150, name:"Moto X3M Pool Party", cat:"Racing", icon:"🏍️", plays:1574, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/124.html", desc:"Moto X3M Pool Party" },
      { id:151, name:"Fashion Battle", cat:"Fun", icon:"🎮", plays:1572, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/127.html", desc:"Fashion Battle" },
      { id:152, name:"Slice it All", cat:"Fun", icon:"🎮", plays:1570, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/128.html", desc:"Slice it All" },
      { id:153, name:"osu!", cat:"Rhythm", icon:"🎶", plays:1568, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/130.html", desc:"osu!" },
      { id:154, name:"8 Ball Classic", cat:"Fun", icon:"🎮", plays:1566, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/146.html", desc:"8 Ball Classic" },
      { id:155, name:"Angry Birds Showdown", cat:"Fun", icon:"🐦", plays:1564, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/147.html", desc:"Angry Birds Showdown" },
      { id:156, name:"Archery World Tour", cat:"Sports", icon:"🎮", plays:1562, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/148.html", desc:"Archery World Tour" },
      { id:157, name:"Ball Blast", cat:"Fun", icon:"🎮", plays:1560, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/149.html", desc:"Ball Blast" },
      { id:158, name:"Cannon Balls 3D", cat:"Fun", icon:"🎮", plays:1558, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/150.html", desc:"Cannon Balls 3D" },
      { id:159, name:"Chess Classic", cat:"Fun", icon:"🎮", plays:1556, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/151.html", desc:"Chess Classic" },
      { id:160, name:"Draw the Line", cat:"Fun", icon:"🎮", plays:1554, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/152.html", desc:"Draw the Line" },
      { id:161, name:"Flappy Dunk", cat:"Fun", icon:"🐦", plays:1552, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/153.html", desc:"Flappy Dunk" },
      { id:162, name:"Fork n Sausage", cat:"Fun", icon:"🎮", plays:1550, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/154.html", desc:"Fork n Sausage" },
      { id:163, name:"Guess Their Answer", cat:"Fun", icon:"🎮", plays:1548, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/155.html", desc:"Guess Their Answer" },
      { id:164, name:"Harvest.io", cat:"Fun", icon:"🎮", plays:1546, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/156.html", desc:"Harvest.io" },
      { id:165, name:"Hill Climb Racing Lite", cat:"Fun", icon:"🎮", plays:1544, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/157.html", desc:"Hill Climb Racing Lite" },
      { id:166, name:"Pac-Man Superfast", cat:"Fun", icon:"🎮", plays:1542, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/158.html", desc:"Pac-Man Superfast" },
      { id:167, name:"Parking Rush", cat:"Fun", icon:"🏃", plays:1540, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/159.html", desc:"Parking Rush" },
      { id:168, name:"Race Master 3D", cat:"Fun", icon:"🎮", plays:1538, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/160.html", desc:"Race Master 3D" },
      { id:169, name:"State.io", cat:"Fun", icon:"🎮", plays:1536, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/161.html", desc:"State.io" },
      { id:170, name:"Tower Crash 3D", cat:"Fun", icon:"🏰", plays:1534, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/162.html", desc:"Tower Crash 3D" },
      { id:171, name:"Trivia Crack", cat:"Fun", icon:"🎮", plays:1532, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/163.html", desc:"Trivia Crack" },
      { id:172, name:"Crazy Cattle 3D", cat:"Fun", icon:"🎮", plays:1530, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/164-temp2.html", desc:"Crazy Cattle 3D" },
      { id:173, name:"Cheese Chompers 3D", cat:"Fun", icon:"🎮", plays:1528, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/165.html", desc:"Cheese Chompers 3D" },
      { id:174, name:"Bad Parenting 1", cat:"Fun", icon:"🎮", plays:1526, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/166.html", desc:"Bad Parenting 1" },
      { id:175, name:"Blade Ball", cat:"Fun", icon:"🎮", plays:1524, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/167.html", desc:"Blade Ball" },
      { id:176, name:"Blocky Snakes", cat:"Fun", icon:"🎮", plays:1522, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/168.html", desc:"Blocky Snakes" },
      { id:177, name:"Bloxorz", cat:"Fun", icon:"🎮", plays:1520, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/169.html", desc:"Bloxorz" },
      { id:178, name:"Big Tower Tiny Square 2", cat:"Fun", icon:"🏰", plays:1518, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/170.html", desc:"Big Tower Tiny Square 2" },
      { id:179, name:"Candy Crush", cat:"Fun", icon:"🍬", plays:1516, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/171.html", desc:"Candy Crush" },
      { id:180, name:"Melon Playground", cat:"Fun", icon:"🎮", plays:1514, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/172.html", desc:"Melon Playground" },
      { id:181, name:"Drift Hunters", cat:"Racing", icon:"🚗", plays:1512, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/173.html", desc:"Drift Hunters" },
      { id:182, name:"World Box", cat:"Fun", icon:"🎮", plays:1510, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/174.html", desc:"World Box" },
      { id:183, name:"Run 1", cat:"Fun", icon:"🏃", plays:1508, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/175.html", desc:"Run 1" },
      { id:184, name:"Run 2", cat:"Fun", icon:"🏃", plays:1506, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/176.html", desc:"Run 2" },
      { id:185, name:"Run 3", cat:"Fun", icon:"🏃", plays:1504, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/177.html", desc:"Run 3" },
      { id:186, name:"Swords and Souls", cat:"RPG", icon:"🎮", plays:1502, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/178.html", desc:"Swords and Souls" },
      { id:187, name:"Soundboard", cat:"Fun", icon:"🎮", plays:1500, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/179-a.html", desc:"Soundboard" },
      { id:188, name:"n-gon", cat:"Fun", icon:"🎮", plays:1498, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/180.html", desc:"n-gon" },
      { id:189, name:"Minecraft 1.8.8", cat:"Fun", icon:"⛏️", plays:1496, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/181.html", desc:"Minecraft 1.8.8" },
      { id:190, name:"Minecraft 1.12.2", cat:"Fun", icon:"⛏️", plays:1494, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/182.html", desc:"Minecraft 1.12.2" },
      { id:191, name:"Minecraft 1.21.4", cat:"Fun", icon:"⛏️", plays:1492, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/183.html", desc:"Minecraft 1.21.4" },
      { id:192, name:"Five Nights at Freddy's: Sister Location", cat:"Horror", icon:"🐻", plays:1490, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/185.html", desc:"Five Nights at Freddy's: Sister Location" },
      { id:193, name:"Ragdoll Archers", cat:"Fun", icon:"🎮", plays:1488, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/186.html", desc:"Ragdoll Archers" },
      { id:194, name:"Papers, Please", cat:"Fun", icon:"🎮", plays:1486, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/187.html", desc:"Papers, Please" },
      { id:195, name:"Scrap Metal 3", cat:"Fun", icon:"🎮", plays:1484, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/188e.html", desc:"Scrap Metal 3" },
      { id:196, name:"Five Nights at Freddy's: World", cat:"Horror", icon:"🐻", plays:1482, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/190.html", desc:"Five Nights at Freddy's: World" },
      { id:197, name:"Five Nights at Freddy's: Pizza Simulator", cat:"Horror", icon:"🐻", plays:1480, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/191.html", desc:"Five Nights at Freddy's: Pizza Simulator" },
      { id:198, name:"Five Nights at Freddy's: Ultimate Custom Night", cat:"Horror", icon:"🐻", plays:1478, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/192.html", desc:"Five Nights at Freddy's: Ultimate Custom Night" },
      { id:199, name:"Do NOT Take This Cat Home", cat:"Fun", icon:"🎮", plays:1476, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/193.html", desc:"Do NOT Take This Cat Home" },
      { id:200, name:"People Playground", cat:"Fun", icon:"🎮", plays:1474, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/194-a.html", desc:"People Playground" },
      { id:201, name:"R.E.P.O", cat:"Fun", icon:"🎮", plays:1472, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/195.html", desc:"R.E.P.O" },
      { id:202, name:"Elastic Man", cat:"Fun", icon:"🎮", plays:1470, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/197.html", desc:"Elastic Man" },
      { id:203, name:"Slope", cat:"Racing", icon:"🎿", plays:1468, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/198.html", desc:"Slope" },
      { id:204, name:"Time Shooter 1", cat:"Fun", icon:"🔫", plays:1466, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/199.html", desc:"Time Shooter 1" },
      { id:205, name:"Time Shooter 2", cat:"Fun", icon:"🔫", plays:1464, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/200.html", desc:"Time Shooter 2" },
      { id:206, name:"Time Shooter 3: SWAT", cat:"Fun", icon:"🔫", plays:1462, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/201.html", desc:"Time Shooter 3: SWAT" },
      { id:207, name:"Carrom Clash", cat:"Fun", icon:"🚗", plays:1460, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/202.html", desc:"Carrom Clash" },
      { id:208, name:"DOOM", cat:"Fun", icon:"💀", plays:1458, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/203-a.html", desc:"DOOM" },
      { id:209, name:"Five Nights at Winston's", cat:"Fun", icon:"🐻", plays:1456, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/204-a.html", desc:"Five Nights at Winston's" },
      { id:210, name:"Buckshot Roulette", cat:"Horror", icon:"🎮", plays:1454, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/205-f.html", desc:"Buckshot Roulette" },
      { id:211, name:"Tunnel Rush", cat:"Racing", icon:"🎿", plays:1452, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/206.html", desc:"Tunnel Rush" },
      { id:212, name:"Snowbattle.io", cat:"Fun", icon:"🎮", plays:1450, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/207.html", desc:"Snowbattle.io" },
      { id:213, name:"Rolly Vortex", cat:"Fun", icon:"🎮", plays:1448, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/208.html", desc:"Rolly Vortex" },
      { id:214, name:"Draw the Hill", cat:"Fun", icon:"🎮", plays:1446, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/209.html", desc:"Draw the Hill" },
      { id:215, name:"Dragon vs Bricks", cat:"Fun", icon:"🎮", plays:1444, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/210.html", desc:"Dragon vs Bricks" },
      { id:216, name:"Death Run 3D", cat:"Racing", icon:"🏃", plays:1442, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/211.html", desc:"Death Run 3D" },
      { id:217, name:"Cut the Rope", cat:"Fun", icon:"🎮", plays:1440, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/212-f.html", desc:"Cut the Rope" },
      { id:218, name:"Cut the Rope: Time Travel", cat:"Fun", icon:"🎮", plays:1438, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/213-f.html", desc:"Cut the Rope: Time Travel" },
      { id:219, name:"Cut the Rope: Holiday Gift", cat:"Fun", icon:"🎮", plays:1436, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/214-fi.html", desc:"Cut the Rope: Holiday Gift" },
      { id:220, name:"Bendy and the Ink Machine", cat:"Horror", icon:"🎮", plays:1434, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/215.html", desc:"Bendy and the Ink Machine" },
      { id:221, name:"Hotline Miami", cat:"Fun", icon:"🎮", plays:1432, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/217-c.html", desc:"Hotline Miami" },
      { id:222, name:"Papa's Bakeria", cat:"Fun", icon:"🍕", plays:1430, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/218.html", desc:"Papa's Bakeria" },
      { id:223, name:"Papa's Burgeria", cat:"Fun", icon:"🍕", plays:1428, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/219.html", desc:"Papa's Burgeria" },
      { id:224, name:"Papa's Cheeseria", cat:"Fun", icon:"🍕", plays:1426, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/220.html", desc:"Papa's Cheeseria" },
      { id:225, name:"Papa's Cupcakeria", cat:"Fun", icon:"🍕", plays:1424, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/221.html", desc:"Papa's Cupcakeria" },
      { id:226, name:"Papa's Donuteria", cat:"Fun", icon:"🍕", plays:1422, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/222.html", desc:"Papa's Donuteria" },
      { id:227, name:"Papa's Freezeria", cat:"Fun", icon:"🍕", plays:1420, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/223.html", desc:"Papa's Freezeria" },
      { id:228, name:"Papa's Hot Doggeria", cat:"Fun", icon:"🍕", plays:1418, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/224.html", desc:"Papa's Hot Doggeria" },
      { id:229, name:"Papa's Pancakeria", cat:"Fun", icon:"🍕", plays:1416, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/225.html", desc:"Papa's Pancakeria" },
      { id:230, name:"Papa's Pastaria", cat:"Fun", icon:"🍕", plays:1414, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/226.html", desc:"Papa's Pastaria" },
      { id:231, name:"Papa's Pizeria", cat:"Fun", icon:"🍕", plays:1412, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/227.html", desc:"Papa's Pizeria" },
      { id:232, name:"Papa's Scooperia", cat:"Fun", icon:"🍕", plays:1410, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/228.html", desc:"Papa's Scooperia" },
      { id:233, name:"Papa's Sushiria", cat:"Fun", icon:"🍕", plays:1408, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/229.html", desc:"Papa's Sushiria" },
      { id:234, name:"Papa's Taco Mia", cat:"Fun", icon:"🍕", plays:1406, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/230.html", desc:"Papa's Taco Mia" },
      { id:235, name:"Papa's Wingeria", cat:"Fun", icon:"🍕", plays:1404, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/231.html", desc:"Papa's Wingeria" },
      { id:236, name:"Plants vs Zombies", cat:"Fun", icon:"🧟", plays:1402, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/232.html", desc:"Plants vs Zombies" },
      { id:237, name:"Superhot", cat:"Fun", icon:"🎮", plays:1400, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/233.html", desc:"Superhot" },
      { id:238, name:"Duck Life", cat:"Fun", icon:"🦆", plays:1398, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/234.html", desc:"Duck Life" },
      { id:239, name:"Duck Life 2", cat:"Fun", icon:"🦆", plays:1396, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/235.html", desc:"Duck Life 2" },
      { id:240, name:"Duck Life 3", cat:"Fun", icon:"🦆", plays:1394, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/236.html", desc:"Duck Life 3" },
      { id:241, name:"Duck Life 4", cat:"Fun", icon:"🦆", plays:1392, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/237.html", desc:"Duck Life 4" },
      { id:242, name:"Duck Life 5", cat:"Fun", icon:"🦆", plays:1390, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/238.html", desc:"Duck Life 5" },
      { id:243, name:"Red Ball", cat:"Fun", icon:"🎮", plays:1388, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/239.html", desc:"Red Ball" },
      { id:244, name:"Red Ball 2", cat:"Fun", icon:"🎮", plays:1386, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/240.html", desc:"Red Ball 2" },
      { id:245, name:"Red Ball 3", cat:"Fun", icon:"🎮", plays:1384, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/241.html", desc:"Red Ball 3" },
      { id:246, name:"Red Ball 4", cat:"Fun", icon:"🎮", plays:1382, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/242.html", desc:"Red Ball 4" },
      { id:247, name:"Red Ball 4 Vol. 2", cat:"Fun", icon:"🎮", plays:1380, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/243.html", desc:"Red Ball 4 Vol. 2" },
      { id:248, name:"Red Ball 4 Vol. 3", cat:"Fun", icon:"🎮", plays:1378, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/244.html", desc:"Red Ball 4 Vol. 3" },
      { id:249, name:"Wheely", cat:"Fun", icon:"🎮", plays:1376, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/245.html", desc:"Wheely" },
      { id:250, name:"Wheely 2", cat:"Fun", icon:"🎮", plays:1374, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/246.html", desc:"Wheely 2" },
      { id:251, name:"Wheely 3", cat:"Fun", icon:"🎮", plays:1372, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/247.html", desc:"Wheely 3" },
      { id:252, name:"Wheely 4", cat:"Fun", icon:"🎮", plays:1370, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/248.html", desc:"Wheely 4" },
      { id:253, name:"Wheely 5", cat:"Fun", icon:"🎮", plays:1368, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/249.html", desc:"Wheely 5" },
      { id:254, name:"Wheely 6", cat:"Fun", icon:"🎮", plays:1366, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/250.html", desc:"Wheely 6" },
      { id:255, name:"Wheely 7", cat:"Fun", icon:"🎮", plays:1364, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/251.html", desc:"Wheely 7" },
      { id:256, name:"Wheely 8", cat:"Fun", icon:"🎮", plays:1362, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/252.html", desc:"Wheely 8" },
      { id:257, name:"Chat Bot AI (A.I GPT)", cat:"Fun", icon:"🎮", plays:1360, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/253-update.html", desc:"Chat Bot AI (A.I GPT)" },
      { id:258, name:"Crazy Chicken 3D", cat:"Fun", icon:"🎮", plays:1358, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/255.html", desc:"Crazy Chicken 3D" },
      { id:259, name:"Crazy Kitty 3D", cat:"Fun", icon:"🎮", plays:1356, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/256.html", desc:"Crazy Kitty 3D" },
      { id:260, name:"Google Baseball", cat:"Sports", icon:"⚾", plays:1354, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/257.html", desc:"Google Baseball" },
      { id:261, name:"A Bite at Freddy's", cat:"Fun", icon:"🐻", plays:1352, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/258.html", desc:"A Bite at Freddy's" },
      { id:262, name:"Class of '09", cat:"Fun", icon:"🎮", plays:1350, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/259.html", desc:"Class of '09" },
      { id:263, name:"RE:RUN", cat:"Fun", icon:"🏃", plays:1348, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/260.html", desc:"RE:RUN" },
      { id:264, name:"Fruit Ninja", cat:"Fun", icon:"🎮", plays:1346, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/261.html", desc:"Fruit Ninja" },
      { id:265, name:"Half Life", cat:"Fun", icon:"🎮", plays:1344, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/262.html", desc:"Half Life" },
      { id:266, name:"Quake III Arena", cat:"Fun", icon:"🎮", plays:1342, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/263.html", desc:"Quake III Arena" },
      { id:267, name:"Escape Road", cat:"Racing", icon:"🚗", plays:1340, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/264.html", desc:"Escape Road" },
      { id:268, name:"Escape Road 2", cat:"Racing", icon:"🚗", plays:1338, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/265-fix.html", desc:"Escape Road 2" },
      { id:269, name:"Speed Stars", cat:"Fun", icon:"🎮", plays:1336, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/266-a.html", desc:"Speed Stars" },
      { id:270, name:"Pizza Tower", cat:"Fun", icon:"🍕", plays:1334, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/267.html", desc:"Pizza Tower" },
      { id:271, name:"Bacon May Die", cat:"Fun", icon:"🎮", plays:1332, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/268.html", desc:"Bacon May Die" },
      { id:272, name:"Bad Ice Cream", cat:"Fun", icon:"🎮", plays:1330, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/269.html", desc:"Bad Ice Cream" },
      { id:273, name:"Bad Ice Cream 2", cat:"Fun", icon:"🎮", plays:1328, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/270.html", desc:"Bad Ice Cream 2" },
      { id:274, name:"Bad Ice Cream 3", cat:"Fun", icon:"🎮", plays:1326, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/271.html", desc:"Bad Ice Cream 3" },
      { id:275, name:"Basketball Stars", cat:"Sports", icon:"🏀", plays:1324, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/272.html", desc:"Basketball Stars" },
      { id:276, name:"BlockPost", cat:"Fun", icon:"🎮", plays:1322, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/273.html", desc:"BlockPost" },
      { id:277, name:"CircloO", cat:"Fun", icon:"🎮", plays:1320, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/274.html", desc:"CircloO" },
      { id:278, name:"CircloO 2", cat:"Fun", icon:"🎮", plays:1318, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/275.html", desc:"CircloO 2" },
      { id:279, name:"Drift Boss", cat:"Racing", icon:"🚗", plays:1316, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/276.html", desc:"Drift Boss" },
      { id:280, name:"Evil Glitch", cat:"Fun", icon:"🎮", plays:1314, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/277.html", desc:"Evil Glitch" },
      { id:281, name:"Madalin Stunt Cars 2", cat:"Racing", icon:"🚗", plays:1312, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/278.html", desc:"Madalin Stunt Cars 2" },
      { id:282, name:"Madalin Stunt Cars 3", cat:"Racing", icon:"🚗", plays:1310, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/279.html", desc:"Madalin Stunt Cars 3" },
      { id:283, name:"Papery Planes", cat:"Fun", icon:"🎮", plays:1308, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/280.html", desc:"Papery Planes" },
      { id:284, name:"Pixel Gun Survival", cat:"Fun", icon:"🔫", plays:1306, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/281.html", desc:"Pixel Gun Survival" },
      { id:285, name:"Protektor", cat:"Fun", icon:"🎮", plays:1304, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/282.html", desc:"Protektor" },
      { id:286, name:"Rooftop Snipers", cat:"Sports", icon:"🔫", plays:1302, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/283.html", desc:"Rooftop Snipers" },
      { id:287, name:"War The Knights", cat:"Fun", icon:"🎮", plays:1300, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/284.html", desc:"War The Knights" },
      { id:288, name:"Basket Bros", cat:"Fun", icon:"🏀", plays:1298, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/285.html", desc:"Basket Bros" },
      { id:289, name:"Endoparasitic", cat:"Horror", icon:"🎮", plays:1296, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/286.html", desc:"Endoparasitic" },
      { id:290, name:"Riddle School", cat:"Fun", icon:"🎮", plays:1294, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/287.html", desc:"Riddle School" },
      { id:291, name:"Riddle School 2", cat:"Fun", icon:"🎮", plays:1292, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/288.html", desc:"Riddle School 2" },
      { id:292, name:"Riddle School 3", cat:"Fun", icon:"🎮", plays:1290, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/289.html", desc:"Riddle School 3" },
      { id:293, name:"Riddle School 4", cat:"Fun", icon:"🎮", plays:1288, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/290.html", desc:"Riddle School 4" },
      { id:294, name:"Riddle School 5", cat:"Fun", icon:"🎮", plays:1286, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/291.html", desc:"Riddle School 5" },
      { id:295, name:"Riddle Transfer", cat:"Fun", icon:"🎮", plays:1284, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/292.html", desc:"Riddle Transfer" },
      { id:296, name:"Riddle Transfer 2", cat:"Fun", icon:"🎮", plays:1282, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/293.html", desc:"Riddle Transfer 2" },
      { id:297, name:"Idle Dice", cat:"Fun", icon:"🎮", plays:1280, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/294.html", desc:"Idle Dice" },
      { id:298, name:"12 Mini Battles", cat:"Fun", icon:"🎮", plays:1278, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/295.html", desc:"12 Mini Battles" },
      { id:299, name:"Minecraft 1.5.2", cat:"Fun", icon:"⛏️", plays:1276, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/297.html", desc:"Minecraft 1.5.2" },
      { id:300, name:"Minecraft Alpha 1.2.6", cat:"Fun", icon:"⛏️", plays:1274, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/298.html", desc:"Minecraft Alpha 1.2.6" },
      { id:301, name:"Minecraft Beta 1.3", cat:"Fun", icon:"⛏️", plays:1272, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/299.html", desc:"Minecraft Beta 1.3" },
      { id:302, name:"Minecraft Beta 1.7.3", cat:"Fun", icon:"⛏️", plays:1270, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/300.html", desc:"Minecraft Beta 1.7.3" },
      { id:303, name:"Minecraft Indev", cat:"Fun", icon:"⛏️", plays:1268, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/301.html", desc:"Minecraft Indev" },
      { id:304, name:"Little Runmo", cat:"Fun", icon:"🏃", plays:1266, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/302.html", desc:"Little Runmo" },
      { id:305, name:"Territorial.io", cat:"Fun", icon:"🎮", plays:1264, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/303.html", desc:"Territorial.io" },
      { id:306, name:"Alien Hominid", cat:"Fun", icon:"🎮", plays:1262, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/304.html", desc:"Alien Hominid" },
      { id:307, name:"Shipo.io", cat:"Fun", icon:"🎮", plays:1260, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/306.html", desc:"Shipo.io" },
      { id:308, name:"Rainbow Obby", cat:"Fun", icon:"🎮", plays:1258, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/307.html", desc:"Rainbow Obby" },
      { id:309, name:"Nazi Zombies: Portable", cat:"Fun", icon:"🧟", plays:1256, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/308.html", desc:"Nazi Zombies: Portable" },
      { id:310, name:"Sandboxels", cat:"Fun", icon:"🎮", plays:1254, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/309.html", desc:"Sandboxels" },
      { id:311, name:"Dreadhead Parkour", cat:"Fun", icon:"🎮", plays:1252, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/310.html", desc:"Dreadhead Parkour" },
      { id:312, name:"Sandtris", cat:"Fun", icon:"🎮", plays:1250, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/311.html", desc:"Sandtris" },
      { id:313, name:"BlackJack", cat:"Fun", icon:"🎮", plays:1248, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/312.html", desc:"BlackJack" },
      { id:314, name:"Minesweeper Mania", cat:"Fun", icon:"🎮", plays:1246, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/313.html", desc:"Minesweeper Mania" },
      { id:315, name:"Super Mario 63", cat:"Fun", icon:"🍄", plays:1244, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/314.html", desc:"Super Mario 63" },
      { id:316, name:"Jelly Mario", cat:"Fun", icon:"🍄", plays:1242, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/315.html", desc:"Jelly Mario" },
      { id:317, name:"Angry Birds Chrome", cat:"Fun", icon:"🐦", plays:1240, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/316.html", desc:"Angry Birds Chrome" },
      { id:318, name:"sandspiel", cat:"Fun", icon:"🎮", plays:1238, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/317.html", desc:"sandspiel" },
      { id:319, name:"Side Effects", cat:"Fun", icon:"🎮", plays:1236, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/318.html", desc:"Side Effects" },
      { id:320, name:"Build a Queen", cat:"Fun", icon:"🎮", plays:1234, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/319.html", desc:"Build a Queen" },
      { id:321, name:"3D Bowling", cat:"Fun", icon:"🎮", plays:1232, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/320.html", desc:"3D Bowling" },
      { id:322, name:"Room Sort", cat:"Fun", icon:"🎮", plays:1230, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/321.html", desc:"Room Sort" },
      { id:323, name:"Sushi Roll", cat:"Fun", icon:"🎮", plays:1228, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/322.html", desc:"Sushi Roll" },
      { id:324, name:"Find the Alien", cat:"Fun", icon:"🎮", plays:1226, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/323.html", desc:"Find the Alien" },
      { id:325, name:"Maze Speedrun", cat:"Fun", icon:"🏃", plays:1224, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/324.html", desc:"Maze Speedrun" },
      { id:326, name:"Kitchen Bazar", cat:"Fun", icon:"🎮", plays:1222, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/325.html", desc:"Kitchen Bazar" },
      { id:327, name:"Pokey Ball", cat:"Fun", icon:"🎮", plays:1220, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/326.html", desc:"Pokey Ball" },
      { id:328, name:"Slime.io", cat:"Fun", icon:"🎮", plays:1218, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/327.html", desc:"Slime.io" },
      { id:329, name:"Om Nom Run", cat:"Fun", icon:"🏃", plays:1216, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/328.html", desc:"Om Nom Run" },
      { id:330, name:"TileTopia", cat:"Fun", icon:"🎮", plays:1214, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/329a.html", desc:"TileTopia" },
      { id:331, name:"BitPlanes", cat:"Fun", icon:"🎮", plays:1212, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/330.html", desc:"BitPlanes" },
      { id:332, name:"Crazy Cars", cat:"Fun", icon:"🚗", plays:1210, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/331.html", desc:"Crazy Cars" },
      { id:333, name:"Fancy Pants Adventure", cat:"Fun", icon:"🎮", plays:1208, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/333.html", desc:"Fancy Pants Adventure" },
      { id:334, name:"Fancy Pants Adventure 2", cat:"Fun", icon:"🎮", plays:1206, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/334.html", desc:"Fancy Pants Adventure 2" },
      { id:335, name:"Fancy Pants Adventure 3", cat:"Fun", icon:"🎮", plays:1204, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/335.html", desc:"Fancy Pants Adventure 3" },
      { id:336, name:"Fancy Pants Adventure 4 Part 1", cat:"Fun", icon:"🎮", plays:1202, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/336.html", desc:"Fancy Pants Adventure 4 Part 1" },
      { id:337, name:"Fancy Pants Adventure 4 Part 2", cat:"Fun", icon:"🎮", plays:1200, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/337.html", desc:"Fancy Pants Adventure 4 Part 2" },
      { id:338, name:"Getaway Shootout", cat:"Fun", icon:"🔫", plays:1198, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/338.html", desc:"Getaway Shootout" },
      { id:339, name:"House of Hazards", cat:"Fun", icon:"🎮", plays:1196, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/339.html", desc:"House of Hazards" },
      { id:340, name:"Learn to Fly", cat:"Fun", icon:"🎮", plays:1194, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/340.html", desc:"Learn to Fly" },
      { id:341, name:"Learn to Fly 2", cat:"Fun", icon:"🎮", plays:1192, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/341.html", desc:"Learn to Fly 2" },
      { id:342, name:"Learn to Fly 3", cat:"Fun", icon:"🎮", plays:1190, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/342.html", desc:"Learn to Fly 3" },
      { id:343, name:"Learn to Fly Idle", cat:"Fun", icon:"🎮", plays:1188, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/343.html", desc:"Learn to Fly Idle" },
      { id:344, name:"Raft Wars", cat:"Fun", icon:"🎮", plays:1186, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/344.html", desc:"Raft Wars" },
      { id:345, name:"Raft Wars 2", cat:"Fun", icon:"🎮", plays:1184, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/345.html", desc:"Raft Wars 2" },
      { id:346, name:"Sort the Court", cat:"Fun", icon:"🎮", plays:1182, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/346.html", desc:"Sort the Court" },
      { id:347, name:"SpiderDoll", cat:"Fun", icon:"🎮", plays:1180, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/347.html", desc:"SpiderDoll" },
      { id:348, name:"They Are Coming", cat:"Fun", icon:"🎮", plays:1178, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/348.html", desc:"They Are Coming" },
      { id:349, name:"Spiral Roll", cat:"Fun", icon:"🎮", plays:1176, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/349.html", desc:"Spiral Roll" },
      { id:350, name:"Binding of Issac: Wrath of the Lamb", cat:"RPG", icon:"🎮", plays:1174, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/350.html", desc:"Binding of Issac: Wrath of the Lamb" },
      { id:351, name:"Happy Sheepies", cat:"Fun", icon:"🎮", plays:1172, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/351.html", desc:"Happy Sheepies" },
      { id:352, name:"DON'T YOU LECTURE ME", cat:"Fun", icon:"🎮", plays:1170, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/352.html", desc:"DON'T YOU LECTURE ME" },
      { id:353, name:"Blumgi Rocket", cat:"Fun", icon:"🎮", plays:1168, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/353.html", desc:"Blumgi Rocket" },
      { id:354, name:"Adventure Capatalist", cat:"Fun", icon:"🎮", plays:1166, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/354-a.html", desc:"Adventure Capatalist" },
      { id:355, name:"Dadish 2", cat:"Fun", icon:"🎮", plays:1164, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/355.html", desc:"Dadish 2" },
      { id:356, name:"Dadish 3", cat:"Fun", icon:"🎮", plays:1162, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/356.html", desc:"Dadish 3" },
      { id:357, name:"Dadish", cat:"Fun", icon:"🎮", plays:1160, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/357.html", desc:"Dadish" },
      { id:358, name:"Dadish 3D", cat:"Fun", icon:"🎮", plays:1158, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/358.html", desc:"Dadish 3D" },
      { id:359, name:"Daily Dadish", cat:"Fun", icon:"🎮", plays:1156, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/359.html", desc:"Daily Dadish" },
      { id:360, name:"EvoWars.io", cat:"Fun", icon:"🎮", plays:1154, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/360.html", desc:"EvoWars.io" },
      { id:361, name:"Google Feud", cat:"Fun", icon:"🎮", plays:1152, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/361.html", desc:"Google Feud" },
      { id:362, name:"Idle Breakout", cat:"Fun", icon:"🎮", plays:1150, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/362.html", desc:"Idle Breakout" },
      { id:363, name:"Idle Lumber Inc", cat:"Fun", icon:"🎮", plays:1148, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/363.html", desc:"Idle Lumber Inc" },
      { id:364, name:"Idle Mining Empire", cat:"Fun", icon:"🎮", plays:1146, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/364.html", desc:"Idle Mining Empire" },
      { id:365, name:"JustFall.lol", cat:"Fun", icon:"🎮", plays:1144, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/365.html", desc:"JustFall.lol" },
      { id:366, name:"Merge Harvest", cat:"Fun", icon:"🎮", plays:1142, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/366.html", desc:"Merge Harvest" },
      { id:367, name:"Parking Fury 3D", cat:"Fun", icon:"🎮", plays:1140, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/367.html", desc:"Parking Fury 3D" },
      { id:368, name:"Slope 2", cat:"Racing", icon:"🎿", plays:1138, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/368.html", desc:"Slope 2" },
      { id:369, name:"Slowroads", cat:"Fun", icon:"🚗", plays:1136, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/369.html", desc:"Slowroads" },
      { id:370, name:"Smash Karts", cat:"Fun", icon:"🎮", plays:1134, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/370-f.html", desc:"Smash Karts" },
      { id:371, name:"Stickman Fight Ragdoll", cat:"Fun", icon:"🏃", plays:1132, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/371e.html", desc:"Stickman Fight Ragdoll" },
      { id:372, name:"Stickman Boost", cat:"Fun", icon:"🏃", plays:1130, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/372.html", desc:"Stickman Boost" },
      { id:373, name:"Stickman Climb", cat:"Fun", icon:"🏃", plays:1128, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/373.html", desc:"Stickman Climb" },
      { id:374, name:"Stickman Golf", cat:"Sports", icon:"⛳", plays:1126, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/374e.html", desc:"Stickman Golf" },
      { id:375, name:"2048 Merge Run", cat:"Fun", icon:"🏃", plays:1124, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/375.html", desc:"2048 Merge Run" },
      { id:376, name:"Build a Big Army", cat:"Fun", icon:"🎮", plays:1122, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/376.html", desc:"Build a Big Army" },
      { id:377, name:"Build a Plane", cat:"Fun", icon:"🎮", plays:1120, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/377.html", desc:"Build a Plane" },
      { id:378, name:"Camouflage and Sniper", cat:"Fun", icon:"🔫", plays:1118, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/378.html", desc:"Camouflage and Sniper" },
      { id:379, name:"Car Survival 3D", cat:"Fun", icon:"🚗", plays:1116, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/379.html", desc:"Car Survival 3D" },
      { id:380, name:"City Defense", cat:"Fun", icon:"🎮", plays:1114, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/380.html", desc:"City Defense" },
      { id:381, name:"Clothing Shop 3D", cat:"Fun", icon:"🎮", plays:1112, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/381.html", desc:"Clothing Shop 3D" },
      { id:382, name:"Cool Cars Run 3D", cat:"Fun", icon:"🚗", plays:1110, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/382.html", desc:"Cool Cars Run 3D" },
      { id:383, name:"Crush Cars 3D", cat:"Fun", icon:"🚗", plays:1108, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/383.html", desc:"Crush Cars 3D" },
      { id:384, name:"Destiny Run 3D", cat:"Fun", icon:"🏃", plays:1106, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/384.html", desc:"Destiny Run 3D" },
      { id:385, name:"Destroy The Car 3D", cat:"Fun", icon:"🚗", plays:1104, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/385.html", desc:"Destroy The Car 3D" },
      { id:386, name:"Diamond Seeker", cat:"Fun", icon:"🎮", plays:1102, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/386.html", desc:"Diamond Seeker" },
      { id:387, name:"Draw Joust", cat:"Fun", icon:"🎮", plays:1100, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/387.html", desc:"Draw Joust" },
      { id:388, name:"Evolving Bombs 3D", cat:"Fun", icon:"🎮", plays:1098, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/388.html", desc:"Evolving Bombs 3D" },
      { id:389, name:"Fire and Frost Master", cat:"Fun", icon:"🎮", plays:1096, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/389.html", desc:"Fire and Frost Master" },
      { id:390, name:"Fitness Empire", cat:"Fun", icon:"🎮", plays:1094, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/390.html", desc:"Fitness Empire" },
      { id:391, name:"Flick Goal", cat:"Fun", icon:"🎮", plays:1092, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/391.html", desc:"Flick Goal" },
      { id:392, name:"Flip Master", cat:"Fun", icon:"🎮", plays:1090, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/392.html", desc:"Flip Master" },
      { id:393, name:"Giant Wanted", cat:"Fun", icon:"🎮", plays:1088, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/393.html", desc:"Giant Wanted" },
      { id:394, name:"Gun Clone", cat:"Fun", icon:"🔫", plays:1086, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/394.html", desc:"Gun Clone" },
      { id:395, name:"Gun Runner", cat:"Fun", icon:"🔫", plays:1084, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/395.html", desc:"Gun Runner" },
      { id:396, name:"Kaji Run", cat:"Fun", icon:"🏃", plays:1082, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/396.html", desc:"Kaji Run" },
      { id:397, name:"Make a SuperBoat", cat:"Fun", icon:"🎮", plays:1080, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/397.html", desc:"Make a SuperBoat" },
      { id:398, name:"Makeover Run", cat:"Fun", icon:"🏃", plays:1078, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/398.html", desc:"Makeover Run" },
      { id:399, name:"Mega Car Jumps", cat:"Fun", icon:"🚗", plays:1076, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/399.html", desc:"Mega Car Jumps" },
      { id:400, name:"Money Rush", cat:"Fun", icon:"🏃", plays:1074, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/400.html", desc:"Money Rush" },
      { id:401, name:"Monster Box 3D", cat:"Fun", icon:"🎮", plays:1072, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/401.html", desc:"Monster Box 3D" },
      { id:402, name:"Office Fight", cat:"Fun", icon:"🎮", plays:1070, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/402.html", desc:"Office Fight" },
      { id:403, name:"Robot Invasion", cat:"Fun", icon:"🎮", plays:1068, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/403.html", desc:"Robot Invasion" },
      { id:404, name:"Seat Jam 3D", cat:"Fun", icon:"🎮", plays:1066, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/404.html", desc:"Seat Jam 3D" },
      { id:405, name:"Shooting Master", cat:"Fun", icon:"🔫", plays:1064, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/405.html", desc:"Shooting Master" },
      { id:406, name:"Supermarket 3D", cat:"Fun", icon:"🎮", plays:1062, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/406.html", desc:"Supermarket 3D" },
      { id:407, name:"Survive to Victory", cat:"Fun", icon:"🎮", plays:1060, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/407.html", desc:"Survive to Victory" },
      { id:408, name:"Telekinesis Attack", cat:"Fun", icon:"🎮", plays:1058, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/408.html", desc:"Telekinesis Attack" },
      { id:409, name:"Telekinesis Car", cat:"Fun", icon:"🚗", plays:1056, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/409.html", desc:"Telekinesis Car" },
      { id:410, name:"Telekinesis Drive", cat:"Fun", icon:"🚗", plays:1054, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/410.html", desc:"Telekinesis Drive" },
      { id:411, name:"Telekinesis", cat:"Fun", icon:"🎮", plays:1052, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/411.html", desc:"Telekinesis" },
      { id:412, name:"Tug of War with Cars", cat:"Fun", icon:"🚗", plays:1050, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/413.html", desc:"Tug of War with Cars" },
      { id:413, name:"Twerk Race 3D", cat:"Fun", icon:"🎮", plays:1048, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/414.html", desc:"Twerk Race 3D" },
      { id:414, name:"Twisted Rope 3D", cat:"Fun", icon:"🎮", plays:1046, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/415.html", desc:"Twisted Rope 3D" },
      { id:415, name:"Wall Crawler", cat:"Fun", icon:"🎮", plays:1044, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/416.html", desc:"Wall Crawler" },
      { id:416, name:"War Regions", cat:"Fun", icon:"🎮", plays:1042, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/417.html", desc:"War Regions" },
      { id:417, name:"Weapon Craft Run", cat:"Fun", icon:"🏃", plays:1040, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/418.html", desc:"Weapon Craft Run" },
      { id:418, name:"Weapon Upgrade Rush", cat:"Fun", icon:"🏃", plays:1038, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/419.html", desc:"Weapon Upgrade Rush" },
      { id:419, name:"Weapon Scale", cat:"Fun", icon:"🎮", plays:1036, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/420.html", desc:"Weapon Scale" },
      { id:420, name:"Rich Run 3D", cat:"Fun", icon:"🏃", plays:1034, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/421.html", desc:"Rich Run 3D" },
      { id:421, name:"High Heels", cat:"Fun", icon:"🎮", plays:1032, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/422.html", desc:"High Heels" },
      { id:422, name:"WebFishing", cat:"Fun", icon:"🎣", plays:1030, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/423.html", desc:"WebFishing" },
      { id:423, name:"Andy's Apple Farm", cat:"Fun", icon:"🎮", plays:1028, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/426.html", desc:"Andy's Apple Farm" },
      { id:424, name:"OMORI", cat:"RPG", icon:"🎮", plays:1026, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/427-z.html", desc:"OMORI" },
      { id:425, name:"Five Nights at Freddy's 4: Halloween", cat:"Horror", icon:"🐻", plays:1024, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/428.html", desc:"Five Nights at Freddy's 4: Halloween" },
      { id:426, name:"Code Editor", cat:"Fun", icon:"🎮", plays:1022, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/429-f.html", desc:"Code Editor" },
      { id:427, name:"10 Minutes Till Dawn", cat:"Fun", icon:"🎮", plays:1020, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/430.html", desc:"10 Minutes Till Dawn" },
      { id:428, name:"99 Balls", cat:"Fun", icon:"🎮", plays:1018, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/431.html", desc:"99 Balls" },
      { id:429, name:"Abandoned", cat:"Horror", icon:"🎮", plays:1016, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/432.html", desc:"Abandoned" },
      { id:430, name:"Yume Nikki", cat:"RPG", icon:"🎮", plays:1014, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/433.html", desc:"Yume Nikki" },
      { id:431, name:"God's Flesh", cat:"Fun", icon:"🎮", plays:1012, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/434.html", desc:"God's Flesh" },
      { id:432, name:"Awesome Tanks", cat:"Fun", icon:"🎮", plays:1010, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/436.html", desc:"Awesome Tanks" },
      { id:433, name:"Bouncemasters", cat:"Fun", icon:"🎮", plays:1008, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/437.html", desc:"Bouncemasters" },
      { id:434, name:"Awesome Tanks 2", cat:"Fun", icon:"🎮", plays:1006, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/438.html", desc:"Awesome Tanks 2" },
      { id:435, name:"Bank Robbery 2", cat:"Fun", icon:"🎮", plays:1004, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/439.html", desc:"Bank Robbery 2" },
      { id:436, name:"Celeste PICO", cat:"RPG", icon:"⚔️", plays:1002, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/440.html", desc:"Celeste PICO" },
      { id:437, name:"Kitty Toy", cat:"Fun", icon:"🎮", plays:1000, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/441.html", desc:"Kitty Toy" },
      { id:438, name:"Infinimoes", cat:"Fun", icon:"🎮", plays:998, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/442.html", desc:"Infinimoes" },
      { id:439, name:"Adventure Drivers", cat:"Fun", icon:"🚗", plays:996, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/443.html", desc:"Adventure Drivers" },
      { id:440, name:"Ages of Conflict", cat:"Fun", icon:"🎮", plays:994, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/444.html", desc:"Ages of Conflict" },
      { id:441, name:"Kindergarten", cat:"Fun", icon:"🎮", plays:992, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/445.html", desc:"Kindergarten" },
      { id:442, name:"Kindergarten 2", cat:"Fun", icon:"🎮", plays:990, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/446.html", desc:"Kindergarten 2" },
      { id:443, name:"Nijika's Ahoge", cat:"Fun", icon:"🎮", plays:988, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/447-e.html", desc:"Nijika's Ahoge" },
      { id:444, name:"Aquapark.io", cat:"Fun", icon:"🎮", plays:986, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/448.html", desc:"Aquapark.io" },
      { id:445, name:"City Smash", cat:"Fun", icon:"🎮", plays:984, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/449.html", desc:"City Smash" },
      { id:446, name:"Amanda the Adventurer", cat:"Fun", icon:"🎮", plays:982, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/450.html", desc:"Amanda the Adventurer" },
      { id:447, name:"Slender: The 8 Pages", cat:"Horror", icon:"🎮", plays:980, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/451.html", desc:"Slender: The 8 Pages" },
      { id:448, name:"Station 141", cat:"Horror", icon:"🎮", plays:978, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/452.html", desc:"Station 141" },
      { id:449, name:"Station Saturn", cat:"Fun", icon:"🎮", plays:976, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/453.html", desc:"Station Saturn" },
      { id:450, name:"BLOODMONEY!", cat:"Horror", icon:"🎮", plays:974, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/454.html", desc:"BLOODMONEY!" },
      { id:451, name:"BERGENTRUCK 201x", cat:"Horror", icon:"🎮", plays:972, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/455.html", desc:"BERGENTRUCK 201x" },
      { id:452, name:"Undertale Yellow", cat:"RPG", icon:"⚔️", plays:970, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/456.html", desc:"Undertale Yellow" },
      { id:453, name:"Raft", cat:"Fun", icon:"🎮", plays:968, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/457.html", desc:"Raft" },
      { id:454, name:"The Deadseat", cat:"Horror", icon:"🎮", plays:966, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/458.html", desc:"The Deadseat" },
      { id:455, name:"The Man In The Window", cat:"Horror", icon:"🎮", plays:964, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/459.html", desc:"The Man In The Window" },
      { id:456, name:"Fears to Fathom: Home Alone", cat:"Horror", icon:"🎮", plays:962, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/460.html", desc:"Fears to Fathom: Home Alone" },
      { id:457, name:"Slither.io", cat:"Fun", icon:"🎮", plays:960, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/461.html", desc:"Slither.io" },
      { id:458, name:"DEAD PLATE", cat:"Fun", icon:"🎮", plays:958, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/462.html", desc:"DEAD PLATE" },
      { id:459, name:"Lacey's Flash Games", cat:"Fun", icon:"🎮", plays:956, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/463.html", desc:"Lacey's Flash Games" },
      { id:460, name:"Choppy Orc", cat:"Fun", icon:"🎮", plays:954, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/464.html", desc:"Choppy Orc" },
      { id:461, name:"Cuphead", cat:"Fun", icon:"🎮", plays:952, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/465.html", desc:"Cuphead" },
      { id:462, name:"Baldi's Basics Classic Remastered", cat:"Fun", icon:"🎮", plays:950, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/466.html", desc:"Baldi's Basics Classic Remastered" },
      { id:463, name:"Baldi's Basics Plus", cat:"Fun", icon:"🎮", plays:948, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/467-updatee.html", desc:"Baldi's Basics Plus" },
      { id:464, name:"Hollow Knight", cat:"RPG", icon:"⚔️", plays:946, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/468-f.html", desc:"Hollow Knight" },
      { id:465, name:"sandstone", cat:"Fun", icon:"🎮", plays:944, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/469.html", desc:"sandstone" },
      { id:466, name:"Doodle Jump", cat:"Fun", icon:"🎮", plays:942, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/470.html", desc:"Doodle Jump" },
      { id:467, name:"Madness Combat: Project Nexus (classic)", cat:"Fun", icon:"🎮", plays:940, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/471.html", desc:"Madness Combat: Project Nexus (classic)" },
      { id:468, name:"Bad Time Simulator", cat:"RPG", icon:"🎮", plays:938, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/472.html", desc:"Bad Time Simulator" },
      { id:469, name:"Spacebar Clicker", cat:"Fun", icon:"🎮", plays:936, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/473.html", desc:"Spacebar Clicker" },
      { id:470, name:"Friday Night Funkin': V.S. Whitty", cat:"Rhythm", icon:"🎵", plays:934, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/474.html", desc:"Friday Night Funkin': V.S. Whitty" },
      { id:471, name:"Friday Night Funkin': B-Sides", cat:"Rhythm", icon:"🎵", plays:932, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/475.html", desc:"Friday Night Funkin': B-Sides" },
      { id:472, name:"Friday Night Funkin': Vs. Hex", cat:"Rhythm", icon:"🎵", plays:930, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/476.html", desc:"Friday Night Funkin': Vs. Hex" },
      { id:473, name:"Friday Night Funkin': Vs. Hatsune Miku", cat:"Rhythm", icon:"🎵", plays:928, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/477.html", desc:"Friday Night Funkin': Vs. Hatsune Miku" },
      { id:474, name:"Friday Night Funkin': Neo", cat:"Rhythm", icon:"🎵", plays:926, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/478.html", desc:"Friday Night Funkin': Neo" },
      { id:475, name:"Friday Night Funkin': Sarvente's Mid-Fight Masses", cat:"Rhythm", icon:"🎵", plays:924, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/480.html", desc:"Friday Night Funkin': Sarvente's Mid-Fight Masses" },
      { id:476, name:"Friday Night Funkin': vs. Tricky", cat:"Rhythm", icon:"🎵", plays:922, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/481.html", desc:"Friday Night Funkin': vs. Tricky" },
      { id:477, name:"Human Expenditure Program", cat:"Fun", icon:"🎮", plays:920, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/482-2.html", desc:"Human Expenditure Program" },
      { id:478, name:"Friday Night Funkin': Hit Single Real", cat:"Rhythm", icon:"🎵", plays:918, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/483.html", desc:"Friday Night Funkin': Hit Single Real" },
      { id:479, name:"Friday Night Funkin': Creepypasta JP", cat:"Rhythm", icon:"🎵", plays:916, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/484.html", desc:"Friday Night Funkin': Creepypasta JP" },
      { id:480, name:"Friday Night Funkin': vs. Garcello", cat:"Rhythm", icon:"🎵", plays:914, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/485.html", desc:"Friday Night Funkin': vs. Garcello" },
      { id:481, name:"Friday Night Funkin': Sonic Legacy", cat:"Rhythm", icon:"💨", plays:912, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/486.html", desc:"Friday Night Funkin': Sonic Legacy" },
      { id:482, name:"Friday Night Funkin': vs. QT", cat:"Rhythm", icon:"🎵", plays:910, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/487.html", desc:"Friday Night Funkin': vs. QT" },
      { id:483, name:"Friday Night Funkin': Mistful Crimson Morning Reboot", cat:"Rhythm", icon:"🎵", plays:908, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/488.html", desc:"Friday Night Funkin': Mistful Crimson Morning Reboot" },
      { id:484, name:"Friday Night Funkin': Indie Cross", cat:"Rhythm", icon:"🎵", plays:906, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/489.html", desc:"Friday Night Funkin': Indie Cross" },
      { id:485, name:"Rooftop Snipers 2", cat:"Sports", icon:"🔫", plays:904, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/490.html", desc:"Rooftop Snipers 2" },
      { id:486, name:"I woke up next to you again.", cat:"Fun", icon:"🎮", plays:902, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/491.html", desc:"I woke up next to you again." },
      { id:487, name:"UNDERWHEELS", cat:"Fun", icon:"🎮", plays:900, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/492.html", desc:"UNDERWHEELS" },
      { id:488, name:"RigBMX", cat:"Fun", icon:"🎮", plays:898, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/493.html", desc:"RigBMX" },
      { id:489, name:"RigBMX 2", cat:"Fun", icon:"🎮", plays:896, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/494.html", desc:"RigBMX 2" },
      { id:490, name:"groon groon, babey!", cat:"Fun", icon:"🎮", plays:894, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/495.html", desc:"groon groon, babey!" },
      { id:491, name:"Friday Night Funkin': Jeffy's Endless Aethos", cat:"Rhythm", icon:"🎵", plays:892, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/496.html", desc:"Friday Night Funkin': Jeffy's Endless Aethos" },
      { id:492, name:"Friday Night Funkin': vs. BOPCITY", cat:"Rhythm", icon:"🎵", plays:890, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/497.html", desc:"Friday Night Funkin': vs. BOPCITY" },
      { id:493, name:"Friday Night Funkin': 17 Bucks: Floor 1", cat:"Rhythm", icon:"🎵", plays:888, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/498.html", desc:"Friday Night Funkin': 17 Bucks: Floor 1" },
      { id:494, name:"Friday Night Funkin': FIRE IN THE HOLE: Lobotomy Dash Funkin'", cat:"Rhythm", icon:"🎵", plays:886, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/499.html", desc:"Friday Night Funkin': FIRE IN THE HOLE: Lobotomy Dash Funkin'" },
      { id:495, name:"Friday Night Funkin': TWIDDLEFINGER", cat:"Rhythm", icon:"🎵", plays:884, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/500.html", desc:"Friday Night Funkin': TWIDDLEFINGER" },
      { id:496, name:"Kindergarten 3", cat:"Fun", icon:"🎮", plays:882, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/501.html", desc:"Kindergarten 3" },
      { id:497, name:"Stick With It", cat:"Fun", icon:"🎮", plays:880, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/502-fixed.html", desc:"Stick With It" },
      { id:498, name:"Five Nights at Candy's", cat:"Fun", icon:"🐻", plays:878, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/503.html", desc:"Five Nights at Candy's" },
      { id:499, name:"Five Nights at Candy's 2", cat:"Fun", icon:"🐻", plays:876, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/504.html", desc:"Five Nights at Candy's 2" },
      { id:500, name:"Pokemon Red", cat:"RPG", icon:"🎮", plays:874, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/505.html", desc:"Pokemon Red" },
      { id:501, name:"Pokemon Emerald", cat:"RPG", icon:"🎮", plays:872, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/506.html", desc:"Pokemon Emerald" },
      { id:502, name:"The Impossible Quiz", cat:"Fun", icon:"🎮", plays:870, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/507.html", desc:"The Impossible Quiz" },
      { id:503, name:"Super Mario Bros", cat:"Fun", icon:"🍄", plays:868, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/508.html", desc:"Super Mario Bros" },
      { id:504, name:"Friday Night Funkin’ Soft", cat:"Rhythm", icon:"🎵", plays:866, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/509.html", desc:"Friday Night Funkin’ Soft" },
      { id:505, name:"Tomodachi Collection", cat:"Fun", icon:"🎮", plays:864, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/510.html", desc:"Tomodachi Collection" },
      { id:506, name:"Doge Miner", cat:"Fun", icon:"🎮", plays:862, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/511.html", desc:"Doge Miner" },
      { id:507, name:"Final Earth 2", cat:"Fun", icon:"🎮", plays:860, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/512.html", desc:"Final Earth 2" },
      { id:508, name:"Swordfight!!", cat:"Fun", icon:"🎮", plays:858, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/513.html", desc:"Swordfight!!" },
      { id:509, name:"PortaBoy+", cat:"Fun", icon:"🎮", plays:856, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/514.html", desc:"PortaBoy+" },
      { id:510, name:"PacMan (Horror)", cat:"Fun", icon:"🎮", plays:854, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/515.html", desc:"PacMan (Horror)" },
      { id:511, name:"Oshi Oshi Punch!", cat:"Fun", icon:"🎮", plays:852, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/516.html", desc:"Oshi Oshi Punch!" },
      { id:512, name:"Nubby's Number Factory", cat:"Fun", icon:"🎮", plays:850, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/517.html", desc:"Nubby's Number Factory" },
      { id:513, name:"Touhou: Luminous Strike", cat:"RPG", icon:"🎮", plays:848, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/518.html", desc:"Touhou: Luminous Strike" },
      { id:514, name:"Generic Fighter Maybe", cat:"Fun", icon:"🎮", plays:846, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/519.html", desc:"Generic Fighter Maybe" },
      { id:515, name:"Dan The Man", cat:"Fun", icon:"🎮", plays:844, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/520-fix.html", desc:"Dan The Man" },
      { id:516, name:"Bust a Loop", cat:"Rhythm", icon:"🎮", plays:842, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/521.html", desc:"Bust a Loop" },
      { id:517, name:"Bad Monday Simulator", cat:"RPG", icon:"🎮", plays:840, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/522.html", desc:"Bad Monday Simulator" },
      { id:518, name:"Touhou Mother", cat:"RPG", icon:"🎮", plays:838, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/523-f.html", desc:"Touhou Mother" },
      { id:519, name:"Parappa The Rapper", cat:"Rhythm", icon:"🎮", plays:836, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/524.html", desc:"Parappa The Rapper" },
      { id:520, name:"Friday Night Funkin': Darkness Takeover", cat:"Rhythm", icon:"🎵", plays:834, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/525.html", desc:"Friday Night Funkin': Darkness Takeover" },
      { id:521, name:"SpongeBob SquarePants: Land Ho!", cat:"Fun", icon:"🎮", plays:832, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/526.html", desc:"SpongeBob SquarePants: Land Ho!" },
      { id:522, name:"SpongeBob SquarePants: SpongeBob Run", cat:"Fun", icon:"🏃", plays:830, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/527.html", desc:"SpongeBob SquarePants: SpongeBob Run" },
      { id:523, name:"SpongeBob SquarePants: Squidward's Sizzlin' Scare", cat:"Fun", icon:"🚗", plays:828, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/528.html", desc:"SpongeBob SquarePants: Squidward's Sizzlin' Scare" },
      { id:524, name:"SpongeBob SquarePants: Sandy's Sponge Stacker", cat:"Fun", icon:"🎮", plays:826, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/529.html", desc:"SpongeBob SquarePants: Sandy's Sponge Stacker" },
      { id:525, name:"SpongeBob SquarePants: Tasty Pastry Party", cat:"Fun", icon:"🎮", plays:824, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/530.html", desc:"SpongeBob SquarePants: Tasty Pastry Party" },
      { id:526, name:"SpongeBob SquarePants: The Kah-Ray-Tay Squid", cat:"Fun", icon:"🎮", plays:822, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/531.html", desc:"SpongeBob SquarePants: The Kah-Ray-Tay Squid" },
      { id:527, name:"SpongeBob SquarePants: WereSquirrel", cat:"Fun", icon:"🎮", plays:820, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/532.html", desc:"SpongeBob SquarePants: WereSquirrel" },
      { id:528, name:"SpongeBob SquarePants: Krabby Katch", cat:"Fun", icon:"🎮", plays:818, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/533.html", desc:"SpongeBob SquarePants: Krabby Katch" },
      { id:529, name:"Teen Titans GO!: Jump Jousts", cat:"Fun", icon:"🎮", plays:816, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/534.html", desc:"Teen Titans GO!: Jump Jousts" },
      { id:530, name:"Teen Titans GO!: Jump Jousts 2", cat:"Fun", icon:"🎮", plays:814, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/535.html", desc:"Teen Titans GO!: Jump Jousts 2" },
      { id:531, name:"Cat Connection", cat:"Fun", icon:"🎮", plays:812, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/536.html", desc:"Cat Connection" },
      { id:532, name:"Cat Gunner: Super Zombie Shoot", cat:"Fun", icon:"🧟", plays:810, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/537.html", desc:"Cat Gunner: Super Zombie Shoot" },
      { id:533, name:"Love Letters", cat:"Fun", icon:"🎮", plays:808, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/538.html", desc:"Love Letters" },
      { id:534, name:"Chiikawa Puzzle", cat:"Fun", icon:"🎮", plays:806, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/539.html", desc:"Chiikawa Puzzle" },
      { id:535, name:"myTeardrop", cat:"Fun", icon:"🎮", plays:804, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/540.html", desc:"myTeardrop" },
      { id:536, name:"Friday Night Funkin': Pibby: Apocalypse", cat:"Rhythm", icon:"🎵", plays:802, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/541.html", desc:"Friday Night Funkin': Pibby: Apocalypse" },
      { id:537, name:"Karlson", cat:"Fun", icon:"🎮", plays:800, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/542-a.html", desc:"Karlson" },
      { id:538, name:"Jelly Drift", cat:"Racing", icon:"🚗", plays:798, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/543-a.html", desc:"Jelly Drift" },
      { id:539, name:"Plinko", cat:"Fun", icon:"🎮", plays:796, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/544.html", desc:"Plinko" },
      { id:540, name:"Clash Of Vikings", cat:"Fun", icon:"🎮", plays:794, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/545.html", desc:"Clash Of Vikings" },
      { id:541, name:"Recoil", cat:"Fun", icon:"🎮", plays:792, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/546.html", desc:"Recoil" },
      { id:542, name:"Baseball Bros", cat:"Sports", icon:"⚾", plays:790, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/547.html", desc:"Baseball Bros" },
      { id:543, name:"Football Bros", cat:"Sports", icon:"⚽", plays:788, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/548.html", desc:"Football Bros" },
      { id:544, name:"Sonic the Hedgehog 2: Community's Cut", cat:"Fun", icon:"💨", plays:786, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/549.html", desc:"Sonic the Hedgehog 2: Community's Cut" },
      { id:545, name:"Sonic the Hedgehog 3: Angel Island Remastered", cat:"Fun", icon:"💨", plays:784, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/550.html", desc:"Sonic the Hedgehog 3: Angel Island Remastered" },
      { id:546, name:"Hypper Sandbox", cat:"Fun", icon:"🎮", plays:782, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/551.html", desc:"Hypper Sandbox" },
      { id:547, name:"Aviamasters", cat:"Fun", icon:"🎮", plays:780, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/552.html", desc:"Aviamasters" },
      { id:548, name:"Rolling Sky", cat:"Fun", icon:"🎮", plays:778, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/553.html", desc:"Rolling Sky" },
      { id:549, name:"Yandere Simulator", cat:"Fun", icon:"🎮", plays:776, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/554.html", desc:"Yandere Simulator" },
      { id:550, name:"Friday Night Funkin VS. KAPI", cat:"Rhythm", icon:"🎵", plays:774, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/555.html", desc:"Friday Night Funkin VS. KAPI" },
      { id:551, name:"Friday Night Funkin VS. Sky", cat:"Rhythm", icon:"🎵", plays:772, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/556.html", desc:"Friday Night Funkin VS. Sky" },
      { id:552, name:"Getting Over It with Bennett Foddy", cat:"Fun", icon:"🎮", plays:770, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/557.html", desc:"Getting Over It with Bennett Foddy" },
      { id:553, name:"Friday Night Funkin Vs. Cyber Sensation", cat:"Rhythm", icon:"🎵", plays:768, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/558.html", desc:"Friday Night Funkin Vs. Cyber Sensation" },
      { id:554, name:"Friday Night Funkin vs Shaggy", cat:"Rhythm", icon:"🎵", plays:766, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/559.html", desc:"Friday Night Funkin vs Shaggy" },
      { id:555, name:"Deltatraveler", cat:"RPG", icon:"🎮", plays:764, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/560.html", desc:"Deltatraveler" },
      { id:556, name:"BitGun.io", cat:"Fun", icon:"🔫", plays:762, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/561.html", desc:"BitGun.io" },
      { id:557, name:"Boom Slingers: Reboom", cat:"Fun", icon:"🎮", plays:760, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/562.html", desc:"Boom Slingers: Reboom" },
      { id:558, name:"CG FC 25", cat:"Fun", icon:"🎮", plays:758, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/563.html", desc:"CG FC 25" },
      { id:559, name:"Count Masters: Stickman Games", cat:"Fun", icon:"🏃", plays:756, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/564.html", desc:"Count Masters: Stickman Games" },
      { id:560, name:"Dalgona Candy Honeycomb Cookie", cat:"Fun", icon:"🍪", plays:754, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/565.html", desc:"Dalgona Candy Honeycomb Cookie" },
      { id:561, name:"Highway Racer", cat:"Racing", icon:"🎮", plays:752, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/567.html", desc:"Highway Racer" },
      { id:562, name:"Highway Racer 2 REMASTERED", cat:"Racing", icon:"🎮", plays:750, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/568.html", desc:"Highway Racer 2 REMASTERED" },
      { id:563, name:"Hula Hoop Race", cat:"Fun", icon:"🎮", plays:748, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/569.html", desc:"Hula Hoop Race" },
      { id:564, name:"Jelly Restaurant", cat:"Fun", icon:"🎮", plays:746, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/570.html", desc:"Jelly Restaurant" },
      { id:565, name:"Layers Roll", cat:"Fun", icon:"🎮", plays:744, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/571.html", desc:"Layers Roll" },
      { id:566, name:"Lazy Jumper", cat:"Fun", icon:"🎮", plays:742, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/572.html", desc:"Lazy Jumper" },
      { id:567, name:"Man Runner 2048", cat:"Fun", icon:"🏃", plays:740, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/573.html", desc:"Man Runner 2048" },
      { id:568, name:"Pottery Master", cat:"Fun", icon:"🎮", plays:738, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/574.html", desc:"Pottery Master" },
      { id:569, name:"Shovel 3D", cat:"Fun", icon:"🎮", plays:736, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/575.html", desc:"Shovel 3D" },
      { id:570, name:"Sky Riders", cat:"Fun", icon:"🎮", plays:734, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/576.html", desc:"Sky Riders" },
      { id:571, name:"Steal Brainrot Online", cat:"Fun", icon:"🎮", plays:732, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/577.html", desc:"Steal Brainrot Online" },
      { id:572, name:"Stickman and Guns", cat:"Fun", icon:"🔫", plays:730, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/578.html", desc:"Stickman and Guns" },
      { id:573, name:"Super Star Car", cat:"Fun", icon:"🚗", plays:728, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/579.html", desc:"Super Star Car" },
      { id:574, name:"Traffic Rider", cat:"Racing", icon:"🎮", plays:726, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/580.html", desc:"Traffic Rider" },
      { id:575, name:"BuildNow.gg", cat:"Fun", icon:"🎮", plays:724, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/581.html", desc:"BuildNow.gg" },
      { id:576, name:"Friday Night Funkin': Mario's Madness", cat:"Rhythm", icon:"🍄", plays:722, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/582.html", desc:"Friday Night Funkin': Mario's Madness" },
      { id:577, name:"Friday Night Funkin' vs Hypno Lullaby", cat:"Rhythm", icon:"🎵", plays:720, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/583.html", desc:"Friday Night Funkin' vs Hypno Lullaby" },
      { id:578, name:"Stone Grass Mowing Simulator", cat:"Fun", icon:"🎮", plays:718, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/584.html", desc:"Stone Grass Mowing Simulator" },
      { id:579, name:"Fallout", cat:"Fun", icon:"🎮", plays:716, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/585.html", desc:"Fallout" },
      { id:580, name:"The Oregon Trail", cat:"Fun", icon:"🎮", plays:714, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/586.html", desc:"The Oregon Trail" },
      { id:581, name:"Newgrounds Rumble", cat:"Fun", icon:"🎮", plays:712, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/587.html", desc:"Newgrounds Rumble" },
      { id:582, name:"Super Mario 64", cat:"Fun", icon:"🍄", plays:710, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/588.html", desc:"Super Mario 64" },
      { id:583, name:"Sonic CD", cat:"Fun", icon:"💨", plays:708, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/589-f.html", desc:"Sonic CD" },
      { id:584, name:"Sonic Mania", cat:"Fun", icon:"💨", plays:706, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/590-f.html", desc:"Sonic Mania" },
      { id:585, name:"Slime Rancher", cat:"Fun", icon:"🎮", plays:704, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/591-awe.html", desc:"Slime Rancher" },
      { id:586, name:"Pac Man World", cat:"Fun", icon:"🎮", plays:702, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/592.html", desc:"Pac Man World" },
      { id:587, name:"Pac Man World 2", cat:"Fun", icon:"🎮", plays:700, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/593-f.html", desc:"Pac Man World 2" },
      { id:588, name:"Waterworks!", cat:"Fun", icon:"🎮", plays:698, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/594.html", desc:"Waterworks!" },
      { id:589, name:"Shapez.io", cat:"Fun", icon:"🎮", plays:696, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/595.html", desc:"Shapez.io" },
      { id:590, name:"Plants vs. Zombies 2 Gardenless", cat:"Fun", icon:"🧟", plays:694, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/597-a.html", desc:"Plants vs. Zombies 2 Gardenless" },
      { id:591, name:"Sonic.EXE", cat:"Fun", icon:"💨", plays:692, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/598.html", desc:"Sonic.EXE" },
      { id:592, name:"Metal Gear Solid", cat:"Fun", icon:"🎮", plays:690, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/599.html", desc:"Metal Gear Solid" },
      { id:593, name:"FNF Vs. Hypno's Lullaby v2", cat:"Rhythm", icon:"🎵", plays:688, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/600.html", desc:"FNF Vs. Hypno's Lullaby v2" },
      { id:594, name:"FNF Vs. Sonic.EXE 3.0/4.0", cat:"Rhythm", icon:"💨", plays:686, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/601.html", desc:"FNF Vs. Sonic.EXE 3.0/4.0" },
      { id:595, name:"Doom 2", cat:"Fun", icon:"💀", plays:684, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/602.html", desc:"Doom 2" },
      { id:596, name:"Growden.io", cat:"Fun", icon:"🎮", plays:682, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/603-aa.html", desc:"Growden.io" },
      { id:597, name:"Minesweeper Plus", cat:"Fun", icon:"🎮", plays:680, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/604-a.html", desc:"Minesweeper Plus" },
      { id:598, name:"Schoolboy Runaway", cat:"Fun", icon:"🏃", plays:678, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/605-e.html", desc:"Schoolboy Runaway" },
      { id:599, name:"Sonic.EXE (ORIGINAL)", cat:"Fun", icon:"💨", plays:676, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/606-e.html", desc:"Sonic.EXE (ORIGINAL)" },
      { id:600, name:"Tattletail", cat:"Horror", icon:"🎮", plays:674, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/607-e.html", desc:"Tattletail" },
      { id:601, name:"Friday Night Funkin VS Impostor v4", cat:"Rhythm", icon:"🎵", plays:672, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/608.html", desc:"Friday Night Funkin VS Impostor v4" },
      { id:602, name:"Friday Night Funkin vs Sunday Remastered HD", cat:"Rhythm", icon:"🎵", plays:670, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/609-a.html", desc:"Friday Night Funkin vs Sunday Remastered HD" },
      { id:603, name:"Friday Night Funkin vs Carol V2", cat:"Rhythm", icon:"🎵", plays:668, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/610.html", desc:"Friday Night Funkin vs Carol V2" },
      { id:604, name:"The Legend of Zelda Ocarina of Time", cat:"RPG", icon:"🚗", plays:666, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/611.html", desc:"The Legend of Zelda Ocarina of Time" },
      { id:605, name:"The Legend of Zelda Majora's Mask", cat:"RPG", icon:"⚔️", plays:664, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/612.html", desc:"The Legend of Zelda Majora's Mask" },
      { id:606, name:"Friday Night Funkin' Drop and Roll, but Playable", cat:"Rhythm", icon:"🎵", plays:662, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/613.html", desc:"Friday Night Funkin' Drop and Roll, but Playable" },
      { id:607, name:"Toy Rider", cat:"Fun", icon:"🎮", plays:660, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/614.html", desc:"Toy Rider" },
      { id:608, name:"Friday Night Funkin Vs. Dave and Bambi v3", cat:"Rhythm", icon:"🎵", plays:658, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/615.html-a", desc:"Friday Night Funkin Vs. Dave and Bambi v3" },
      { id:609, name:"Friday Night Funkin’ Wednesday's Infidelity", cat:"Rhythm", icon:"🎵", plays:656, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/616.html", desc:"Friday Night Funkin’ Wednesday's Infidelity" },
      { id:610, name:"Postal", cat:"Fun", icon:"🎮", plays:654, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/617-a.html", desc:"Postal" },
      { id:611, name:"FNF vs Bob v2.0 (Bob’s Onslaught)", cat:"Rhythm", icon:"🎵", plays:652, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/618.html", desc:"FNF vs Bob v2.0 (Bob’s Onslaught)" },
      { id:612, name:"Friday Night Funkin': Rev-Mixed", cat:"Rhythm", icon:"🎵", plays:650, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/619.html", desc:"Friday Night Funkin': Rev-Mixed" },
      { id:613, name:"Three Goblets", cat:"Fun", icon:"🎮", plays:648, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/620.html", desc:"Three Goblets" },
      { id:614, name:"Friday Night Funkin': Gumballs", cat:"Rhythm", icon:"🎵", plays:646, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/621.html", desc:"Friday Night Funkin': Gumballs" },
      { id:615, name:"Oneshot (LEGACY)", cat:"RPG", icon:"🎮", plays:644, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/622.html", desc:"Oneshot (LEGACY)" },
      { id:616, name:"Celeste", cat:"RPG", icon:"⚔️", plays:642, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/623-work.html", desc:"Celeste" },
      { id:617, name:"Happy Wheels", cat:"Fun", icon:"🎮", plays:640, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/624.html", desc:"Happy Wheels" },
      { id:618, name:"Get Yoked", cat:"Fun", icon:"🎮", plays:638, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/625.html", desc:"Get Yoked" },
      { id:619, name:"Doom 3", cat:"Fun", icon:"💀", plays:636, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/626-f.html", desc:"Doom 3" },
      { id:620, name:"Pizza Tower: Scoutdigo", cat:"Fun", icon:"🍕", plays:634, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/628-f.html", desc:"Pizza Tower: Scoutdigo" },
      { id:621, name:"Off", cat:"Fun", icon:"🎮", plays:632, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/629.html", desc:"Off" },
      { id:622, name:"Space Funeral", cat:"RPG", icon:"🎮", plays:630, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/630.html", desc:"Space Funeral" },
      { id:623, name:"Endroll", cat:"RPG", icon:"🎮", plays:628, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/631-a.html", desc:"Endroll" },
      { id:624, name:"Cave Story", cat:"RPG", icon:"🎮", plays:626, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/632-a.html", desc:"Cave Story" },
      { id:625, name:"Friday Night Funkin': VS. Impostor: Alternated", cat:"Rhythm", icon:"🎵", plays:624, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/633.html", desc:"Friday Night Funkin': VS. Impostor: Alternated" },
      { id:626, name:"Friday Night Funkin': Chaos Nightmare - Sonic Vs. Fleetway", cat:"Rhythm", icon:"💨", plays:622, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/634.html", desc:"Friday Night Funkin': Chaos Nightmare - Sonic Vs. Fleetway" },
      { id:627, name:"Spelunky Classic HD", cat:"Fun", icon:"🎮", plays:620, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/635.html", desc:"Spelunky Classic HD" },
      { id:628, name:"Friday Night Funkin' D-Sides", cat:"Rhythm", icon:"🎵", plays:618, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/636.html", desc:"Friday Night Funkin' D-Sides" },
      { id:629, name:"BFDIA 5b", cat:"Fun", icon:"🎮", plays:616, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/637-f.html", desc:"BFDIA 5b" },
      { id:630, name:"BFDIA 5b: 5*30", cat:"Fun", icon:"🎮", plays:614, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/638-f.html", desc:"BFDIA 5b: 5*30" },
      { id:631, name:"Friday Night Funkin' VS Impostor B-Sides", cat:"Rhythm", icon:"🎵", plays:612, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/639.html", desc:"Friday Night Funkin' VS Impostor B-Sides" },
      { id:632, name:"Mutilate a Doll 2", cat:"Fun", icon:"🎮", plays:610, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/640.html", desc:"Mutilate a Doll 2" },
      { id:633, name:"Godzilla Daikaiju Battle Royale", cat:"Fun", icon:"🎮", plays:608, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/641.html", desc:"Godzilla Daikaiju Battle Royale" },
      { id:634, name:"Friday Night Funkin' Sunday Night Suicide: Rookies Edition", cat:"Rhythm", icon:"🎵", plays:606, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/642.html", desc:"Friday Night Funkin' Sunday Night Suicide: Rookies Edition" },
      { id:635, name:"Rio Rex", cat:"Fun", icon:"🎮", plays:604, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/643.html", desc:"Rio Rex" },
      { id:636, name:"Friday Night Funkin vs Nonsense", cat:"Rhythm", icon:"🎵", plays:602, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/644.html", desc:"Friday Night Funkin vs Nonsense" },
      { id:637, name:"Arthur's Nightmare", cat:"Fun", icon:"🎮", plays:600, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/645-e.html", desc:"Arthur's Nightmare" },
      { id:638, name:"Buster Jam", cat:"Fun", icon:"🎮", plays:598, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/646-fixed.html", desc:"Buster Jam" },
      { id:639, name:"Super Smash Flash", cat:"Fun", icon:"🎮", plays:596, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/647.html", desc:"Super Smash Flash" },
      { id:640, name:"Mindwave", cat:"Fun", icon:"🎮", plays:594, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/648-el.html", desc:"Mindwave" },
      { id:641, name:"Look Outside", cat:"Fun", icon:"🎮", plays:592, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/649.html", desc:"Look Outside" },
      { id:642, name:"Milk Inside a Bag of Milk Inside a Bag of Milk", cat:"Horror", icon:"🎮", plays:590, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/650-f.html", desc:"Milk Inside a Bag of Milk Inside a Bag of Milk" },
      { id:643, name:"Milk Outside A Bag Of Milk Outside A Bag Of Milk", cat:"Horror", icon:"🎮", plays:588, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/651.html", desc:"Milk Outside A Bag Of Milk Outside A Bag Of Milk" },
      { id:644, name:"1 Date Danger", cat:"Fun", icon:"🎮", plays:586, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/653-f.html", desc:"1 Date Danger" },
      { id:645, name:"Final Fantasy VII", cat:"RPG", icon:"🎮", plays:584, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/654.html", desc:"Final Fantasy VII" },
      { id:646, name:"Goblin Goopmaxxing", cat:"Fun", icon:"🎮", plays:582, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/655.html", desc:"Goblin Goopmaxxing" },
      { id:647, name:"Rogue Sergeant The Final Operation", cat:"Fun", icon:"🎮", plays:580, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/656.html", desc:"Rogue Sergeant The Final Operation" },
      { id:648, name:"Friday Night Funkin vs Undertale", cat:"Rhythm", icon:"🎵", plays:578, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/657.html", desc:"Friday Night Funkin vs Undertale" },
      { id:649, name:"Midnight Shift", cat:"Horror", icon:"🎮", plays:576, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/658.html", desc:"Midnight Shift" },
      { id:650, name:"Orange Roulette", cat:"Fun", icon:"🎮", plays:574, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/659.html", desc:"Orange Roulette" },
      { id:651, name:"Please Dont Touch Anything", cat:"Fun", icon:"🎮", plays:572, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/660.html", desc:"Please Dont Touch Anything" },
      { id:652, name:"Royal Towers: Medieval TD", cat:"Fun", icon:"🏰", plays:570, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/661.html", desc:"Royal Towers: Medieval TD" },
      { id:653, name:"Going Balls", cat:"Fun", icon:"🎮", plays:568, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/662.html", desc:"Going Balls" },
      { id:654, name:"3D Bolt Master", cat:"Fun", icon:"🎮", plays:566, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/663.html", desc:"3D Bolt Master" },
      { id:655, name:"Tall.io", cat:"Fun", icon:"🎮", plays:564, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/664.html", desc:"Tall.io" },
      { id:656, name:"Match Triple 3D", cat:"Fun", icon:"🎮", plays:562, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/665.html", desc:"Match Triple 3D" },
      { id:657, name:"Stick War: Legacy", cat:"Fun", icon:"🎮", plays:560, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/666.html", desc:"Stick War: Legacy" },
      { id:658, name:"In Stars and Time", cat:"RPG", icon:"🎮", plays:558, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/667-fix.html", desc:"In Stars and Time" },
      { id:659, name:"Gorilla Tag", cat:"Fun", icon:"🎮", plays:556, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/668-fix2.html", desc:"Gorilla Tag" },
      { id:660, name:"Terraria", cat:"RPG", icon:"🎮", plays:554, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/669.html", desc:"Terraria" },
      { id:661, name:"Raldi's Crackhouse", cat:"Fun", icon:"🎮", plays:552, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/670.html", desc:"Raldi's Crackhouse" },
      { id:662, name:"We Become What We Behold", cat:"Fun", icon:"🎮", plays:550, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/671.html", desc:"We Become What We Behold" },
      { id:663, name:"A Difficult Game About Climbing", cat:"Fun", icon:"🎮", plays:548, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/672-2.html", desc:"A Difficult Game About Climbing" },
      { id:664, name:"Hobo 1", cat:"Fun", icon:"🎮", plays:546, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/673.html", desc:"Hobo 1" },
      { id:665, name:"Hobo 2", cat:"Fun", icon:"🎮", plays:544, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/674.html", desc:"Hobo 2" },
      { id:666, name:"Hobo 3", cat:"Fun", icon:"🎮", plays:542, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/675.html", desc:"Hobo 3" },
      { id:667, name:"Hobo 4", cat:"Fun", icon:"🎮", plays:540, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/676.html", desc:"Hobo 4" },
      { id:668, name:"Hobo 5", cat:"Fun", icon:"🎮", plays:538, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/677.html", desc:"Hobo 5" },
      { id:669, name:"Hobo 6", cat:"Fun", icon:"🎮", plays:536, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/678.html", desc:"Hobo 6" },
      { id:670, name:"Hobo 7", cat:"Fun", icon:"🎮", plays:534, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/679.html", desc:"Hobo 7" },
      { id:671, name:"Kirby Super Star Ultra", cat:"Fun", icon:"🎮", plays:532, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/680.html", desc:"Kirby Super Star Ultra" },
      { id:672, name:"Cooking Mama", cat:"Fun", icon:"🍕", plays:530, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/681.html", desc:"Cooking Mama" },
      { id:673, name:"Cooking Mama 2", cat:"Fun", icon:"🍕", plays:528, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/682.html", desc:"Cooking Mama 2" },
      { id:674, name:"Cooking Mama 3", cat:"Fun", icon:"🍕", plays:526, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/683.html", desc:"Cooking Mama 3" },
      { id:675, name:"Kirby Squeak Squad", cat:"Fun", icon:"🎮", plays:524, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/684.html", desc:"Kirby Squeak Squad" },
      { id:676, name:"FIFA 11", cat:"Fun", icon:"🎮", plays:522, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/685.html", desc:"FIFA 11" },
      { id:677, name:"FIFA 10", cat:"Fun", icon:"🎮", plays:520, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/686.html", desc:"FIFA 10" },
      { id:678, name:"Pico's School (1999)", cat:"Fun", icon:"🎮", plays:518, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/687.html", desc:"Pico's School (1999)" },
      { id:679, name:"Peggle", cat:"Fun", icon:"🎮", plays:516, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/688.html", desc:"Peggle" },
      { id:680, name:"Meatboy", cat:"Fun", icon:"🎮", plays:514, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/689.html", desc:"Meatboy" },
      { id:681, name:"Friday Night Funkin': AKAGE", cat:"Rhythm", icon:"🎵", plays:512, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/690.html", desc:"Friday Night Funkin': AKAGE" },
      { id:682, name:"Friday Night Funkin': Heartbreak Havoc [Vs. Sky: REDUX]", cat:"Rhythm", icon:"🎵", plays:510, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/691.html", desc:"Friday Night Funkin': Heartbreak Havoc [Vs. Sky: REDUX]" },
      { id:683, name:"Kirby ~ Soft & Wet", cat:"Fun", icon:"🎮", plays:508, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/692.html", desc:"Kirby ~ Soft & Wet" },
      { id:684, name:"Half Life: Opposing Force", cat:"Fun", icon:"🎮", plays:506, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/693.html", desc:"Half Life: Opposing Force" },
      { id:685, name:"Pokemon Firered", cat:"RPG", icon:"🎮", plays:504, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/694.html", desc:"Pokemon Firered" },
      { id:686, name:"Duck Life 8", cat:"Fun", icon:"🦆", plays:502, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/695.html", desc:"Duck Life 8" },
      { id:687, name:"Pokemon HeartGold", cat:"RPG", icon:"🎮", plays:500, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/696.html", desc:"Pokemon HeartGold" },
      { id:688, name:"Bank Robbery", cat:"Fun", icon:"🎮", plays:498, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/697.html", desc:"Bank Robbery" },
      { id:689, name:"Bank Robbery 3", cat:"Fun", icon:"🎮", plays:496, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/698.html", desc:"Bank Robbery 3" },
      { id:690, name:"Stickman Destruction", cat:"Fun", icon:"🏃", plays:494, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/699.html", desc:"Stickman Destruction" },
      { id:691, name:"FNF vs Pibby Corrupted", cat:"Rhythm", icon:"🎵", plays:492, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/700.html", desc:"FNF vs Pibby Corrupted" },
      { id:692, name:"Real Flight Simulator", cat:"Fun", icon:"🎮", plays:490, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/701.html", desc:"Real Flight Simulator" },
      { id:693, name:"JavascriptPS1", cat:"Fun", icon:"🎮", plays:488, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/702.html", desc:"JavascriptPS1" },
      { id:694, name:"VS Rewrite: ROUND 2", cat:"Fun", icon:"🎮", plays:486, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/703.html", desc:"VS Rewrite: ROUND 2" },
      { id:695, name:"Five Nights at Freddy's: World Refreshed", cat:"Horror", icon:"🐻", plays:484, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/704-fix.html", desc:"Five Nights at Freddy's: World Refreshed" },
      { id:696, name:"Iron Lung", cat:"Horror", icon:"🎮", plays:482, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/705-fix.html", desc:"Iron Lung" },
      { id:697, name:"Fear & Hunger", cat:"Fun", icon:"🎮", plays:480, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/706-fix.html", desc:"Fear & Hunger" },
      { id:698, name:"Traffic Racer", cat:"Racing", icon:"🎮", plays:478, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/707-fix.html", desc:"Traffic Racer" },
      { id:699, name:"Needy Streamer Overload", cat:"Fun", icon:"🎮", plays:476, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/708-fix.html", desc:"Needy Streamer Overload" },
      { id:700, name:"Survivor.io", cat:"Fun", icon:"🎮", plays:474, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/709-fixagain.html", desc:"Survivor.io" },
      { id:701, name:"Five Nights at Epstein's", cat:"Fun", icon:"🐻", plays:472, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/710-fix.html", desc:"Five Nights at Epstein's" },
      { id:702, name:"Antonblast", cat:"Fun", icon:"🎮", plays:470, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/711.html", desc:"Antonblast" },
      { id:703, name:"Jumbo Mario", cat:"Fun", icon:"🍄", plays:468, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/712-f.html", desc:"Jumbo Mario" },
      { id:704, name:"Silent Hill", cat:"Horror", icon:"🎮", plays:466, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/713.html", desc:"Silent Hill" },
      { id:705, name:"Friday Night Funkin vs Tabi", cat:"Rhythm", icon:"🎵", plays:464, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/714.html", desc:"Friday Night Funkin vs Tabi" },
      { id:706, name:"Friday Night Funkin vs Zardy", cat:"Rhythm", icon:"🎵", plays:462, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/715.html", desc:"Friday Night Funkin vs Zardy" },
      { id:707, name:"Clover Pit", cat:"Fun", icon:"🎮", plays:460, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/716-fix2.html", desc:"Clover Pit" },
      { id:708, name:"Peaks of Yore", cat:"Fun", icon:"🎮", plays:458, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/717-fix2.html", desc:"Peaks of Yore" },
      { id:709, name:"A Game About Feeding A Black Hole", cat:"Fun", icon:"🎮", plays:456, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/719.html", desc:"A Game About Feeding A Black Hole" },
      { id:710, name:"Roulette Hero", cat:"Fun", icon:"🎮", plays:454, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/720.html", desc:"Roulette Hero" },
      { id:711, name:"Shift at Midnight", cat:"Fun", icon:"🎮", plays:452, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/721.html", desc:"Shift at Midnight" },
      { id:712, name:"Fused 240", cat:"Fun", icon:"🎮", plays:450, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/722.html", desc:"Fused 240" },
      { id:713, name:"Brotato", cat:"Fun", icon:"🎮", plays:448, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/723.html", desc:"Brotato" },
      { id:714, name:"Endoparasitic 2", cat:"Horror", icon:"🎮", plays:446, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/724.html", desc:"Endoparasitic 2" },
      { id:715, name:"ShredSauce", cat:"Fun", icon:"🎮", plays:444, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/725-ff.html", desc:"ShredSauce" },
      { id:716, name:"Breath of the Wild NDS", cat:"Fun", icon:"🎮", plays:442, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/726.html", desc:"Breath of the Wild NDS" },
      { id:717, name:"Dimension Incident", cat:"Fun", icon:"🎮", plays:440, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/727.html", desc:"Dimension Incident" },
      { id:718, name:"Fear Assessment", cat:"Fun", icon:"🎮", plays:438, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/728.html", desc:"Fear Assessment" },
      { id:719, name:"game inside a game inside a game inside a game inside a game inside a game", cat:"Fun", icon:"🎮", plays:436, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/729.html", desc:"game inside a game inside a game inside a game inside a game inside a game" },
      { id:720, name:"Cell Machine", cat:"Fun", icon:"🎮", plays:434, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/730.html", desc:"Cell Machine" },
      { id:721, name:"Undertale: Last Breath", cat:"RPG", icon:"⚔️", plays:432, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/731.html", desc:"Undertale: Last Breath" },
      { id:722, name:"64 in 1 NES", cat:"Fun", icon:"🎮", plays:430, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/732.html", desc:"64 in 1 NES" },
      { id:723, name:"Tetris", cat:"Fun", icon:"🎮", plays:428, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/733.html", desc:"Tetris" },
      { id:724, name:"Christmas Massacre", cat:"Fun", icon:"🎮", plays:426, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/734.html", desc:"Christmas Massacre" },
      { id:725, name:"Famidash", cat:"Fun", icon:"🎮", plays:424, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/735.html", desc:"Famidash" },
      { id:726, name:"Super Mario Bros. Remastered", cat:"Fun", icon:"🍄", plays:422, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/736.html", desc:"Super Mario Bros. Remastered" },
      { id:727, name:"Saihate Station (さいはて駅)", cat:"Fun", icon:"🎮", plays:420, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/737.html", desc:"Saihate Station (さいはて駅)" },
      { id:728, name:"Dumb Ways to Die", cat:"Fun", icon:"🎮", plays:418, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/738-u.html", desc:"Dumb Ways to Die" },
      { id:729, name:"Bart Blast", cat:"Fun", icon:"🎮", plays:416, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/740.html", desc:"Bart Blast" },
      { id:730, name:"Resident Evil", cat:"Horror", icon:"🎮", plays:414, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/741.html", desc:"Resident Evil" },
      { id:731, name:"Resident Evil 2", cat:"Horror", icon:"🎮", plays:412, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/742.html", desc:"Resident Evil 2" },
      { id:732, name:"Power Hover", cat:"Racing", icon:"🎮", plays:410, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/743.html", desc:"Power Hover" },
      { id:733, name:"Escape Road City 2", cat:"Racing", icon:"🚗", plays:408, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/744-a.html", desc:"Escape Road City 2" },
      { id:734, name:"Tetris", cat:"Fun", icon:"🎮", plays:406, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/745.html", desc:"Tetris" },
      { id:735, name:"Fundamental Paper Novel", cat:"Fun", icon:"🎮", plays:404, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/746.html", desc:"Fundamental Paper Novel" },
      { id:736, name:"Worst Time Simulator", cat:"Fun", icon:"🎮", plays:402, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/747.html", desc:"Worst Time Simulator" },
      { id:737, name:"Undertale Last Breath PHASE THREE", cat:"RPG", icon:"⚔️", plays:400, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/748.html", desc:"Undertale Last Breath PHASE THREE" },
      { id:738, name:"Super Monkey Ball 1&2", cat:"Fun", icon:"🎮", plays:398, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/749.html", desc:"Super Monkey Ball 1&2" },
      { id:739, name:"Five Nights at Last Breath", cat:"Fun", icon:"🐻", plays:396, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/750-u.html", desc:"Five Nights at Last Breath" },
      { id:740, name:"Jeffrey Epstein Basics In Education And Kidnapping", cat:"Fun", icon:"🎮", plays:394, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/751.html", desc:"Jeffrey Epstein Basics In Education And Kidnapping" },
      { id:741, name:"Bad Piggies", cat:"Fun", icon:"🎮", plays:392, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/752.html", desc:"Bad Piggies" },
      { id:742, name:"Breaklock", cat:"Fun", icon:"🎮", plays:390, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/753.html", desc:"Breaklock" },
      { id:743, name:"Minecraft Pocket Edition", cat:"Fun", icon:"⛏️", plays:388, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/754.html", desc:"Minecraft Pocket Edition" },
      { id:744, name:"Brawl Simulator 3D", cat:"Fun", icon:"🎮", plays:386, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/755.html", desc:"Brawl Simulator 3D" },
      { id:745, name:"Witch's Heart", cat:"Fun", icon:"🎮", plays:384, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/756-f.html", desc:"Witch's Heart" },
      { id:746, name:"Ultrapool", cat:"Fun", icon:"🎮", plays:382, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/757.html", desc:"Ultrapool" },
      { id:747, name:"CaseOh's Basics in Eating and Fast Food", cat:"Fun", icon:"🎮", plays:380, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/758a.html", desc:"CaseOh's Basics in Eating and Fast Food" },
      { id:748, name:"Dice a Million", cat:"Fun", icon:"🎮", plays:378, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/759.html", desc:"Dice a Million" },
      { id:749, name:"Overburden", cat:"Fun", icon:"🎮", plays:376, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/760.html", desc:"Overburden" },
      { id:750, name:"FISH", cat:"Fun", icon:"🎣", plays:374, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/761.html", desc:"FISH" },
      { id:751, name:"Cheese Rolling", cat:"Fun", icon:"🎮", plays:372, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/762.html", desc:"Cheese Rolling" },
      { id:752, name:"Flying Gorilla 3D", cat:"Fun", icon:"🎮", plays:370, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/763.html", desc:"Flying Gorilla 3D" },
      { id:753, name:"Five Night's at Shrek's Hotel", cat:"Fun", icon:"🎮", plays:368, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/764.html", desc:"Five Night's at Shrek's Hotel" },
      { id:754, name:"Scary Shawarma Kiosk: the ANOMALY", cat:"Fun", icon:"🚗", plays:366, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/765.html", desc:"Scary Shawarma Kiosk: the ANOMALY" },
      { id:755, name:"Suika Game", cat:"Fun", icon:"🎮", plays:364, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/766.html", desc:"Suika Game" },
      { id:756, name:"Stick Slasher", cat:"Fun", icon:"🎮", plays:362, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/767.html", desc:"Stick Slasher" },
      { id:757, name:"Stickman Kombat 2D", cat:"Fun", icon:"🏃", plays:360, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/768.html", desc:"Stickman Kombat 2D" },
      { id:758, name:"Stickman Duel", cat:"Fun", icon:"🏃", plays:358, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/769.html", desc:"Stickman Duel" },
      { id:759, name:"Sonic Robo Blast 2", cat:"Fun", icon:"💨", plays:356, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/770-update.html", desc:"Sonic Robo Blast 2" },
      { id:760, name:"Hollow Knight: Silksong", cat:"RPG", icon:"⚔️", plays:354, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/771-z.html", desc:"Hollow Knight: Silksong" },
      { id:761, name:"Sam & Max Hit the Road", cat:"Fun", icon:"🚗", plays:352, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/772.html", desc:"Sam & Max Hit the Road" },
      { id:762, name:"Command & Conquer", cat:"Fun", icon:"🎮", plays:350, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/773.html", desc:"Command & Conquer" },
      { id:763, name:"Mountain Bike Racer", cat:"Racing", icon:"🏍️", plays:348, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/774.html", desc:"Mountain Bike Racer" },
      { id:764, name:"Bart Bash", cat:"Fun", icon:"🎮", plays:346, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/775.html", desc:"Bart Bash" },
      { id:765, name:"Your Only Move Is HUSTLE", cat:"Fun", icon:"🎮", plays:344, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/776.html", desc:"Your Only Move Is HUSTLE" },
      { id:766, name:"Outhold", cat:"Fun", icon:"🎮", plays:342, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/777.html", desc:"Outhold" },
      { id:767, name:"Serial Experiments Lain", cat:"Horror", icon:"🎮", plays:340, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/778.html", desc:"Serial Experiments Lain" },
      { id:768, name:"I Have No Mouth, and I Must Scream", cat:"Horror", icon:"🎮", plays:338, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/779.html", desc:"I Have No Mouth, and I Must Scream" },
      { id:769, name:"Thing-Thing Arena 3", cat:"Fun", icon:"🎮", plays:336, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/780.html", desc:"Thing-Thing Arena 3" },
      { id:770, name:"Scratch Inc", cat:"Fun", icon:"🎮", plays:334, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/781.html", desc:"Scratch Inc" },
      { id:771, name:"Um Jammer Lammy", cat:"Rhythm", icon:"🎮", plays:332, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/782f.html", desc:"Um Jammer Lammy" },
      { id:772, name:"Apes vs Helium", cat:"Fun", icon:"🎮", plays:330, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/783.html", desc:"Apes vs Helium" },
      { id:773, name:"Gabriel's Awesome Schoolhouse (GASH)", cat:"Fun", icon:"🎮", plays:328, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/784.html", desc:"Gabriel's Awesome Schoolhouse (GASH)" },
      { id:774, name:"Geometry Dash", cat:"Fun", icon:"🎮", plays:326, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/785-upd.html", desc:"Geometry Dash" },
      { id:775, name:"Volley Random", cat:"Fun", icon:"🎮", plays:324, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/786.html", desc:"Volley Random" },
      { id:776, name:"BeatBlock", cat:"Rhythm", icon:"🎶", plays:322, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/787.html", desc:"BeatBlock" },
      { id:777, name:"Vib-Robbin", cat:"Rhythm", icon:"🎮", plays:320, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/788.html", desc:"Vib-Robbin" },
      { id:778, name:"Stardew Valley", cat:"RPG", icon:"🎮", plays:318, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/789.html", desc:"Stardew Valley" },
      { id:779, name:"Helltaker", cat:"RPG", icon:"🎮", plays:316, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/790.html", desc:"Helltaker" },
      { id:780, name:"Who's Your Daddy", cat:"Fun", icon:"🎮", plays:314, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/791.html", desc:"Who's Your Daddy" },
      { id:781, name:"Escape Road 3", cat:"Racing", icon:"🚗", plays:312, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/792.html", desc:"Escape Road 3" },
      { id:782, name:"Lethal Ape", cat:"Fun", icon:"🎮", plays:310, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/793.html", desc:"Lethal Ape" },
      { id:783, name:"Fear & Hunger 2: Termina", cat:"Fun", icon:"🎮", plays:308, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/794.html", desc:"Fear & Hunger 2: Termina" },
      { id:784, name:"UvuvwevwevweOnyetenvewveUgwemubwemOssas", cat:"Fun", icon:"🎮", plays:306, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/795.html", desc:"UvuvwevwevweOnyetenvewveUgwemubwemOssas" },
      { id:785, name:"Slendytubbies 1", cat:"Fun", icon:"🎮", plays:304, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/796.html", desc:"Slendytubbies 1" },
      { id:786, name:"Fih", cat:"Fun", icon:"🎮", plays:302, url:"https://cdn.jsdelivr.net/gh/freebuisness/html@latest/797.html", desc:"Fih" },
    ];

    // ── Render sidebar game list (dynamic) ──────────────────────────────
    function renderSidebarGames() {
      const list = document.getElementById('gamesList');
      if (!list) return;
      list.innerHTML = GAMES.map(g =>
        `<div class="sb-item game-item" onclick="playGame(${g.id})" data-game-id="${g.id}" data-label="${g.name.replace(/"/g,'&quot;')}">` +
        `<span class="sb-item-icon">${g.icon}</span>` +
        `<span class="sb-item-label">${g.name}</span></div>`
      ).join('');
      const cnt = document.getElementById('gamesCount');
      if (cnt) cnt.textContent = GAMES.length;
    }

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
    let _gridInitialized = false;

    function renderGrid() {
      const grid = document.getElementById('homeGrid');
      if (!grid) return;

      // ── Build all cards once (or if grid was cleared) ─────────────
      const cardsExist = grid.querySelectorAll('.game-card[data-id]').length > 0;
      if (!_gridInitialized || !cardsExist) {
        _gridInitialized = true;
        grid.innerHTML = GAMES.map(g => {
          const cc   = CAT_COLORS[g.cat]    || { bg:'rgba(255,255,255,0.06)', text:'#888' };
          const grad = CAT_GRADIENTS[g.cat] || 'linear-gradient(145deg,#111,#000)';
          const fav  = favorites.has(g.id);
          return `<div class="game-card" id="gc-${g.id}" data-id="${g.id}" data-name="${g.name.toLowerCase()}" data-cat="${g.cat}">
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

        // Inject no-results node inside grid (spans all columns)
        const noRes = document.createElement('div');
        noRes.id = 'homeNoResults';
        noRes.className = 'home-no-results';
        noRes.style.display = 'none';
        noRes.innerHTML = `<span class="home-no-results-icon">◈</span>No games found in the sector`;
        grid.appendChild(noRes);
      }

      // ── Filter with animation ─────────────────────────────────────
      const q   = homeSearchQ.toLowerCase();
      const cat = activeCat;
      let visibleCount = 0;

      grid.querySelectorAll('.game-card[data-id]').forEach(card => {
        const matches =
          (cat === 'All' || card.dataset.cat === cat) &&
          (!q || card.dataset.name.includes(q) || card.dataset.cat.toLowerCase().includes(q));

        if (matches) {
          visibleCount++;
          // Cancel pending hide
          if (card._hideTimer) { clearTimeout(card._hideTimer); card._hideTimer = null; }
          card.classList.remove('gc-card-hiding');
          if (card.style.display === 'none') {
            // Re-show with entrance animation
            card.style.removeProperty('display');
            void card.offsetWidth; // force reflow so animation triggers
            card.classList.add('gc-card-appearing');
            setTimeout(() => card.classList.remove('gc-card-appearing'), 280);
          }
        } else {
          if (card.style.display !== 'none' && !card.classList.contains('gc-card-hiding')) {
            card.classList.add('gc-card-hiding');
            card._hideTimer = setTimeout(() => {
              card.style.display = 'none';
              card.classList.remove('gc-card-hiding');
              card._hideTimer = null;
            }, 220);
          }
        }
      });

      // ── Counter ───────────────────────────────────────────────────
      const counter = document.getElementById('homeGameCount');
      if (counter) counter.textContent = `Showing ${visibleCount} Game${visibleCount !== 1 ? 's' : ''}`;

      // ── No results ────────────────────────────────────────────────
      const noRes = document.getElementById('homeNoResults');
      if (noRes) noRes.style.display = visibleCount === 0 ? 'block' : 'none';
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

      // Stats
      recentPlayed = [id, ...recentPlayed.filter(x => x !== id)].slice(0, 10);
      playedToday++;
      document.getElementById('statToday').textContent = playedToday;
      try {
        const tot = parseInt(localStorage.getItem('orbit-total-played')||'0') + 1;
        localStorage.setItem('orbit-total-played', String(tot));
      } catch(e) {}
      saveStats();
      renderRecent();
      gcLogActivity(g.icon, `${fbUsername || 'Someone'} started ${g.name}`);

      // Sidebar active
      document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
      const sbItem = document.querySelector(`#gamesList [data-game-id="${id}"]`);
      if (sbItem) sbItem.classList.add('active');

      // Topbar + panels
      document.getElementById('topbarTitle').textContent = g.name;
      ['homePanel','aiChatPanel','globalChatPanel','dmPanel','settingsPanel',
       'suggestionsPanel','pricingPanel','creditsPanel'].forEach(p =>
        document.getElementById(p)?.classList.remove('active')
      );
      document.getElementById('placeholderPanel').classList.add('active');

      // Resolve URL (support window.__FNF_URL / window.__TNNMN_URL variables)
      let url = g.url || '';
      if (url === '__FNF_URL')   url = (window.__FNF_URL   || '');
      if (url === '__TNNMN_URL') url = (window.__TNNMN_URL || '');

      const iframe      = document.getElementById('gameIframe');
      const phContent   = document.getElementById('phContent');
      const phError     = document.getElementById('phIframeError');
      const phDirectLink= document.getElementById('phDirectLink');
      const phBlockedTitle = document.getElementById('phBlockedTitle');

      // Reset error panel
      if (phError) phError.style.display = 'none';

      if (url) {
        if (phContent)      phContent.style.display = 'none';
        if (phDirectLink)   phDirectLink.href = url;
        if (phBlockedTitle) phBlockedTitle.textContent = g.name + ' — blocked by host';

        if (iframe) {
          // Clear any previous block-detection timer
          if (iframe._blockTimer) { clearTimeout(iframe._blockTimer); iframe._blockTimer = null; }

          // Set sandbox + allow BEFORE assigning src — browser locks the security context
          // at navigation time. Setting attributes after src is assigned has no effect.
          //
          // allow-same-origin is required for game saves (localStorage/IndexedDB).
          // Combining it with allow-scripts triggers a browser advisory warning:
          //   "An iframe which has both allow-scripts and allow-same-origin for its sandbox
          //    attribute can escape its sandboxing."
          // This warning is browser-enforced and CANNOT be suppressed from JavaScript.
          // It is informational only and does not affect game functionality.
          iframe.setAttribute('sandbox',
            'allow-scripts allow-same-origin allow-forms allow-modals ' +
            'allow-orientation-lock allow-pointer-lock allow-popups ' +
            'allow-popups-to-escape-sandbox allow-presentation allow-downloads'
          );
          iframe.setAttribute('allow',
            'autoplay; fullscreen; keyboard-map; encrypted-media; ' +
            'gyroscope; accelerometer; gamepad; microphone; ' +
            'clipboard-read; clipboard-write'
          );

          iframe.srcdoc = '';
          iframe.style.display = 'block';

          // jsdelivr serves HTML as text/plain — browser shows raw source instead of rendering.
          // Fix: fetch the HTML, inject a <base> tag for relative URL resolution, use srcdoc.
          if (url.includes('cdn.jsdelivr.net/gh/freebuisness/html')) {
            iframe.removeAttribute('src');
            iframe.srcdoc = '<html><body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">Loading…</body></html>';
            fetch(url)
              .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
              .then(html => {
                const base = `<base href="${url}">`;
                const modified = html.includes('<head>')
                  ? html.replace('<head>', '<head>' + base)
                  : base + html;
                iframe.srcdoc = modified;
              })
              .catch(() => { iframe.srcdoc = ''; iframe.src = url; });
          } else {
            iframe.src = url;
          }

          // X-Frame-Options block detection:
          // Blocked iframes revert src to about:blank silently — no error event fires.
          // Check after a grace period. Never read contentDocument — always throws
          // SecurityError cross-origin regardless of whether load succeeded.
          // Skip block-detection for srcdoc games (src stays about:blank intentionally)
          if (!url.includes('cdn.jsdelivr.net/gh/freebuisness/html')) {
            iframe._blockTimer = setTimeout(() => {
              iframe._blockTimer = null;
              try {
                const cur = iframe.src;
                if (iframe.style.display !== 'none' &&
                    (cur === 'about:blank' || cur === '' || cur === window.location.href)) {
                  iframe.style.display = 'none';
                  if (phError) phError.style.display = 'flex';
                }
              } catch(e) {
                // SecurityError reading iframe.src — treat as blocked
                iframe.style.display = 'none';
                if (phError) phError.style.display = 'flex';
              }
            }, 4000);
          }
        }
      } else {
        if (iframe)         { iframe.srcdoc = ''; iframe.src = 'about:blank'; iframe.style.display = 'none'; }
        if (phContent)      { phContent.style.display = ''; }
        if (phError)          phError.style.display = 'none';
        document.getElementById('phIcon').textContent  = g.icon;
        document.getElementById('phTitle').textContent = g.name;
        document.getElementById('phSub').textContent   = 'URL not set yet — check back soon.';
      }
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

    // openOverlay / closeOverlay fully defined above — no reassignment needed

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

    const GROQ_SYSTEM = `You are Orbit AI, the assistant built into Orbit — a gaming platform with 34 browser games. Be chill, casual, and fun. Keep answers short (1-3 sentences usually). Use lowercase, be relaxed, use the occasional emoji. If the user asks for anything academic though be formal, professional, or technical, switch to a more polished tone and provide a clear and concise answer. You have no access to real-time information or the internet, so if asked about current events or anything outside your training data, say you don't know.
`;

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
      initOrbitFeed();

      const msgsRef = fbDb.ref('chat/messages');

      // ── Initial bulk load (once), then switch to incremental listeners
      let initialLoadDone = false;
      msgsRef.limitToLast(80).once('value', snap => {
        const msgs = [];
        snap.forEach(child => msgs.push({ id: child.key, ...child.val() }));
        renderGcMessages(msgs);
        initialLoadDone = true;

        // ── New messages: append in real-time after initial load
        const lastKey = msgs.length ? msgs[msgs.length - 1].id : null;
        const newMsgsQuery = lastKey
          ? msgsRef.orderByKey().startAfter(lastKey)
          : msgsRef.limitToLast(1);

        newMsgsQuery.on('child_added', snap => {
          if (!initialLoadDone) return;
          const msg = { id: snap.key, ...snap.val() };
          appendGcMessage(msg);
        });

        // ── Reaction / edit updates: update existing message row in-place
        msgsRef.on('child_changed', snap => {
          if (!initialLoadDone) return;
          const msg = { id: snap.key, ...snap.val() };
          const c = document.getElementById('gcMsgs');
          if (!c) return;
          const existing = c.querySelector(`.gc-msg-row[data-id="${msg.id}"]`);
          if (!existing) return;
          const grouped = existing.classList.contains('grouped');
          const tmp = document.createElement('div');
          tmp.innerHTML = buildGcMsgHtml(msg, grouped);
          const newRow = tmp.firstElementChild;
          if (newRow) {
            existing.replaceWith(newRow);
            newRow.querySelectorAll('.gc-react-opener').forEach(btn =>
              btn.addEventListener('click', e => { e.stopPropagation(); showReactionPicker(btn, btn.dataset.id); })
            );
          }
        });
      });

      // ── Typing
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

    // Append a single new message to the chat container
    function appendGcMessage(msg) {
      const c = document.getElementById('gcMsgs');
      if (!c) return;

      // Remove "no messages" placeholder if present
      const empty = c.querySelector('.gc-empty-msg');
      if (empty) empty.remove();

      // Determine grouping from last rendered row
      const lastRow = c.querySelector('.gc-msg-row:last-child');
      const prevUid  = lastRow ? lastRow.dataset.uid  || null : null;
      const prevTime = lastRow ? parseInt(lastRow.dataset.ts || '0', 10) : 0;
      const ts       = msg.timestamp || 0;
      const grouped  = msg.uid === prevUid && ts - prevTime < 300000 && !msg.replyTo;

      const atBottom = c.scrollTop + c.clientHeight >= c.scrollHeight - 100;

      const tmp = document.createElement('div');
      tmp.innerHTML = buildGcMsgHtml(msg, grouped);
      const row = tmp.firstElementChild;
      if (!row) return;

      // Store uid + timestamp on the row for future grouping checks
      row.dataset.uid = msg.uid || '';
      row.dataset.ts  = String(ts);

      // Entrance animation — remove class after it plays so re-renders are clean
      row.classList.add('gc-msg-new');
      c.appendChild(row);
      row.addEventListener('animationend', () => row.classList.remove('gc-msg-new'), { once: true });

      row.querySelectorAll('.gc-react-opener').forEach(btn =>
        btn.addEventListener('click', e => { e.stopPropagation(); showReactionPicker(btn, btn.dataset.id); })
      );

      if (atBottom) requestAnimationFrame(() => { c.scrollTop = c.scrollHeight; });
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
      renderGcHud();
    }

    // ── HUD panel ─────────────────────────────────────────────────────
    const gcActivityLog = [];    // [{icon, text, ts}]  max 12 entries

    function gcLogActivity(icon, text) {
      gcActivityLog.unshift({ icon, text, ts: Date.now() });
      if (gcActivityLog.length > 12) gcActivityLog.pop();
      renderGcHudFeed();
    }

    function renderGcHud() {
      // Avatars
      const avatarEl = document.getElementById('gcHudAvatars');
      if (!avatarEl) return;
      const online = Object.values(gcOnlineUsers).filter(u => u.online);
      if (!online.length) {
        avatarEl.innerHTML = '<div class="gc-hud-empty">No one online</div>';
      } else {
        avatarEl.innerHTML = online.map(u => {
          const initials = (u.username || '?').slice(0, 2).toUpperCase();
          const isSelf   = u.uid === fbUid;
          return `<div class="gc-hud-avatar${isSelf ? ' self' : ''}"
            title="${isSelf ? 'You' : escH(u.username || 'User')}"
            onclick="${!isSelf ? `openDmWith('${escJ(u.uid)}','${escJ(u.username||'User')}')` : ''}"
          >${initials}<span class="gc-hud-avatar-dot"></span></div>`;
        }).join('');
      }
      renderGcHudFeed();
    }

    function renderGcHudFeed() {
      const feedEl = document.getElementById('gcHudFeed');
      if (!feedEl) return;
      if (!gcActivityLog.length) {
        feedEl.innerHTML = '<div class="gc-hud-empty">No activity yet</div>';
        return;
      }
      feedEl.innerHTML = gcActivityLog.map(e => {
        const age = Date.now() - e.ts;
        const label = age < 60000
          ? 'just now'
          : age < 3600000
            ? Math.floor(age / 60000) + 'm ago'
            : Math.floor(age / 3600000) + 'h ago';
        return `<div class="gc-hud-feed-item">
          <span class="gc-hud-feed-icon">${e.icon}</span>
          <span class="gc-hud-feed-text">${escH(e.text)}</span>
          <span class="gc-hud-feed-time">${label}</span>
        </div>`;
      }).join('');
    }

    // ── Orbit Feed — terminal-style system log ─────────────────────────
    const ORBIT_FEED_SEED = [
      { type: 'sys',  msg: 'ORBIT v2.0 — systems nominal' },
      { type: 'stat', msg: '34 users online' },
      { type: 'evt',  msg: 'Vivex updated the Changelog' },
      { type: 'score',msg: 'New high score in Tetrix' },
      { type: 'evt',  msg: 'FlamingoKing joined the server' },
      { type: 'stat', msg: 'Cookie Empire played 1,240×' },
      { type: 'evt',  msg: 'New suggestion submitted' },
    ];

    const gcOrbitLog = [];    // {type, msg, ts}  max 30

    function gcOrbitPush(type, msg) {
      gcOrbitLog.unshift({ type, msg, ts: Date.now() });
      if (gcOrbitLog.length > 30) gcOrbitLog.pop();
      _renderOrbitFeed();
    }

    function _renderOrbitFeed() {
      const el = document.getElementById('gcOrbitFeed');
      if (!el) return;
      el.innerHTML = gcOrbitLog.map(e => {
        const d = new Date(e.ts);
        const ts = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0') + ':' + d.getSeconds().toString().padStart(2,'0');
        return `<div class="gc-orbit-line gc-orbit-line--${e.type}">
          <span class="gc-orbit-ts">${ts}</span>
          <span class="gc-orbit-msg">${escH(e.msg)}</span>
        </div>`;
      }).join('');
      el.scrollTop = 0;
    }

    function initOrbitFeed() {
      if (gcOrbitLog.length) return;  // already seeded
      // Seed in reverse so newest ends up at top
      [...ORBIT_FEED_SEED].reverse().forEach((e, i) => {
        gcOrbitLog.push({ type: e.type, msg: e.msg, ts: Date.now() - (ORBIT_FEED_SEED.length - i) * 47000 });
      });
      _renderOrbitFeed();
      // Drip new mock events while chat is open
      const MOCK = [
        { type:'stat',  msg:'Online users: {n}' },
        { type:'score', msg:'New high score in Neon Snake' },
        { type:'evt',   msg:'New game suggestion submitted' },
        { type:'stat',  msg:'2048 played {n}× today' },
        { type:'evt',   msg:'Atl Alex joined Global Chat' },
        { type:'score', msg:'TypeSpeed record broken' },
      ];
      let mi = 0;
      setInterval(() => {
        const entry = MOCK[mi % MOCK.length];
        const msg = entry.msg.replace('{n}', Math.floor(28 + Math.random() * 12));
        gcOrbitPush(entry.type, msg);
        mi++;
      }, 18000);
    }

    // ── Credits card: image fallback + moving shine ────────────────────
    const CR_COLORS = {
      owner:  '#fbbf24',
      admin:  '#67e8f9',
      helper: '#6ee7b7',
    };

    function crImgFallback(img, initials, role) {
      const color = CR_COLORS[role] || '#a78bfa';
      const wrap = img.parentElement;
      img.remove();
      const fb = document.createElement('div');
      fb.className = 'cr-avatar cr-avatar-fallback';
      fb.textContent = initials;
      fb.style.setProperty('--cr-role-color', color);
      wrap.insertBefore(fb, wrap.firstChild);
    }

    function crShine(e, card) {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width)  * 100;
      const y = ((e.clientY - r.top)  / r.height) * 100;
      card.style.setProperty('--cr-mx', x + '%');
      card.style.setProperty('--cr-my', y + '%');
      const shine = card.querySelector('.cr-shine-layer');
      if (shine) shine.style.opacity = '1';
    }

    function crShineReset(card) {
      const shine = card.querySelector('.cr-shine-layer');
      if (shine) shine.style.opacity = '0';
    }

    function renderGcMessages(msgs) {
      const c = document.getElementById('gcMsgs');
      if (!c) return;
      if (!msgs.length) { c.innerHTML = '<div class="gc-empty-msg">No messages yet — say something!</div>'; return; }

      const frag = document.createDocumentFragment();
      let prevUid = null, prevTime = 0;
      msgs.forEach(msg => {
        const ts = msg.timestamp || 0;
        const grouped = msg.uid === prevUid && ts - prevTime < 300000 && !msg.replyTo;
        const tmp = document.createElement('div');
        tmp.innerHTML = buildGcMsgHtml(msg, grouped);
        const row = tmp.firstElementChild;
        if (!row) return;
        // Store for future grouping / in-place updates
        row.dataset.uid = msg.uid || '';
        row.dataset.ts  = String(ts);
        frag.appendChild(row);
        prevUid = msg.uid; prevTime = ts;
      });

      c.innerHTML = '';
      c.appendChild(frag);

      c.querySelectorAll('.gc-react-opener').forEach(btn =>
        btn.addEventListener('click', e => { e.stopPropagation(); showReactionPicker(btn, btn.dataset.id); })
      );

      // Scroll to bottom after DOM paints
      requestAnimationFrame(() => { c.scrollTop = c.scrollHeight; });
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
        <div class="gc-msg-body">
          <div class="gc-bubble">${replyHtml}${body}${reactHtml}</div>
        </div>
        ${actions}</div>`;

      return `<div class="gc-msg-row${isSelf?' self':''}" data-id="${msg.id}">
        <div class="gc-msg-avatar" title="${uname}">${initials}</div>
        <div class="gc-msg-body">
          <div class="gc-msg-header">
            <span class="gc-msg-username${isSelf?' self':''}">${uname}</span>
            <span class="gc-msg-time">${time}</span>
          </div>
          <div class="gc-bubble">${replyHtml}${body}${reactHtml}</div>
        </div>
        ${actions}</div>`;
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
    let dmListener    = null;  // callback ref returned by .on()
    let dmRef         = null;  // exact query ref used to attach — required for correct .off()
    let dmTypingTimer = null;
    let dmIsTyping    = false;

    function initDmPanel() {
      if (!isRegistered) {
        // Show locked state inside DM panel + open auth modal on top
        const list = document.getElementById('dmUserList');
        if (list) list.innerHTML = '';
        const nochat = document.getElementById('dmNochat');
        const msgArea = document.getElementById('dmMsgArea');
        if (nochat) {
          nochat.style.display = 'flex';
          const icon  = document.getElementById('dmNochatIcon')  || nochat.querySelector('.dm-no-chat-icon');
          const label = document.getElementById('dmNochatLabel') || nochat.querySelector('.dm-no-chat-text');
          if (icon)  icon.textContent  = '🔒';
          if (label) label.textContent = 'Sign in to use Direct Messages';
        }
        if (msgArea) msgArea.style.display = 'none';
        showAuthModal('signin');
        return;
      }
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

    // Canonical room ID: sort both UIDs so both users always resolve the same path
    function dmConvId(a, b) { return [a, b].sort().join('__'); }

    function openDmWith(uid, username) {
      if (!isRegistered) {
        showAuthModal('signin');
        return;
      }
      if (!document.getElementById('dmPanel').classList.contains('active')) {
        selectSidebarItem(document.getElementById('nav-dm'));
      }
      if (dmCurrentUid === uid) return;

      // Detach previous listener using the EXACT query ref it was attached on.
      // Calling .off() on a new base ref (without .limitToLast) won't match the
      // original query ref and the old listener silently keeps firing.
      if (dmRef && dmListener) {
        dmRef.off('value', dmListener);
        dmRef     = null;
        dmListener = null;
      }

      dmCurrentUid = uid; dmCurrentName = username;
      renderDmSidebar();

      document.getElementById('dmNochat').style.display  = 'none';
      document.getElementById('dmMsgArea').style.display = 'flex';

      const isOnline = gcOnlineUsers[uid]?.online;
      document.getElementById('dmHeader').innerHTML = `
        <div class="dm-header-dot" style="${isOnline?'':'background:rgba(255,255,255,0.16)'}"></div>
        <div>
          <div class="dm-header-name">${escH(username)}</div>
          <div class="dm-header-status">${isOnline?'Online':'Last seen recently'}</div>
        </div>`;

      // Store the query ref so .off() can target the same object later
      const convId = dmConvId(fbUid, uid);
      dmRef = fbDb.ref('dms/' + convId + '/messages').limitToLast(60);
      dmListener = dmRef.on('value', snap => {
        const msgs = [];
        snap.forEach(c => msgs.push({ id: c.key, ...c.val() }));
        dmPruneOld(convId, msgs); // delete messages older than DM_TTL_MS
        renderDmMessages(msgs.filter(m => !m.timestamp || (Date.now() - m.timestamp) < DM_TTL_MS));
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

    // Messages older than this are auto-deleted when the conversation loads
    const DM_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    function dmPruneOld(convId, msgs) {
      const cutoff = Date.now() - DM_TTL_MS;
      msgs.forEach(msg => {
        if (msg.timestamp && msg.timestamp < cutoff) {
          fbDb.ref('dms/' + convId + '/messages/' + msg.id).remove()
            .catch(() => {}); // silent — best-effort cleanup
        }
      });
    }

    function dmShowError(msg) {
      const el = document.getElementById('dmSendError');
      if (!el) return;
      el.textContent = '⚠ ' + msg;
      el.style.display = 'block';
      clearTimeout(el._hideTimer);
      el._hideTimer = setTimeout(() => { el.style.display = 'none'; }, 4000);
    }

    function dmSend() {
      const errEl = document.getElementById('dmSendError');
      if (errEl) errEl.style.display = 'none';

      if (!fbDb) { dmShowError('Not connected — reopen Orbit to reconnect'); return; }
      if (!dmCurrentUid) { dmShowError('Select a user first'); return; }

      const ta   = document.getElementById('dmTextarea');
      const text = ta.value.trim();
      if (!text) return;

      const convId = dmConvId(fbUid, dmCurrentUid);
      fbDb.ref('dms/' + convId + '/messages').push({
        uid:       fbUid,
        username:  fbUsername,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        text,
      }).then(() => {
        // Clear only after Firebase confirms — input preserved on failure
        ta.value        = '';
        ta.style.height = '';
        dmUpdateSendBtn();
      }).catch(err => {
        console.error('DM send failed:', err);
        dmShowError('Failed to send — check connection');
      });
    }

    function dmKeydown(e) {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        dmSend();
      }
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

    // ══════════════════════════════════════════════════════════════════
    //  PRICING PANEL
    // ══════════════════════════════════════════════════════════════════

    const PR_PLANS = [
      {
        id: 'player', name: 'Player', sub: 'Free forever — no card needed',
        monthly: 'Free', yearly: 'Free',
        monthlyBill: '', yearlyBill: '',
        popular: false,
        features: [
          'All 34+ core games',
          'AI Chat — 10 messages/day',
          'Public Global Chat',
          'Standard "User" badge',
          'Standard banner ads',
        ],
        cta: 'Start Playing',
      },
      {
        id: 'pro', name: 'Orbit Pro', sub: 'The value pick for regulars',
        monthly: '$4', yearly: '$3',
        monthlyBill: 'Billed $48 per year', yearlyBill: 'Billed $36 per year',
        popular: true,
        features: [
          'Unlimited Orbit AI chat',
          'Completely ad-free',
          'Custom username colours in chat',
          '3–5 exclusive backgrounds (Nebula, Deep Void…)',
          '"Pro" badge in sidebar & chat',
          'New games 48 hrs early',
        ],
        cta: 'Upgrade to Pro',
      },
      {
        id: 'elite', name: 'Orbit Elite', sub: 'Status tier — for power users',
        monthly: '$9', yearly: '$7',
        monthlyBill: 'Billed $108 per year', yearlyBill: 'Billed $84 per year',
        popular: false,
        features: [
          'Everything in Orbit Pro',
          'Vault: 5+ exclusive premium games',
          'Smarter AI model (upgraded Groq)',
          'Animated GIF profile pictures',
          'Glowing name aura in user list',
          'Private beta suggestions channel',
          'Detailed stats — time played, heatmaps',
        ],
        cta: 'Go Elite',
      },
    ];

    let prBilling = 'monthly';

    function initPricingPanel() {
      renderPrCards();
      initPricingCanvas();
    }

    function prSetBilling(mode) {
      prBilling = mode;
      document.getElementById('prMonthly')?.classList.toggle('active', mode === 'monthly');
      document.getElementById('prYearly')?.classList.toggle('active', mode === 'yearly');
      renderPrCards();
    }

    function renderPrCards() {
      const container = document.getElementById('prCards');
      if (!container) return;
      container.innerHTML = PR_PLANS.map((plan, i) => {
        const price   = prBilling === 'yearly' ? plan.yearly  : plan.monthly;
        const billing = prBilling === 'yearly' ? plan.yearlyBill : plan.monthlyBill;
        const period  = price !== 'Free' ? '/mo' : '';
        return `
          <div class="pr-card${plan.popular ? ' pr-card-pop' : ''}" style="animation-delay:${0.08 + i * 0.09}s">
            ${plan.popular ? '<div class="pr-popular-badge">Most Popular</div>' : ''}
            <div class="pr-plan-name">${plan.name}</div>
            <div class="pr-plan-sub">${plan.sub}</div>
            <div class="pr-price">${price}<span class="pr-price-period">${period}</span></div>
            <div class="pr-billing">${billing}</div>
            <div class="pr-divider"></div>
            <ul class="pr-features">
              ${plan.features.map(f => `<li class="pr-feature"><span class="pr-check">✓</span>${f}</li>`).join('')}
            </ul>
            <button class="pr-cta-btn${plan.popular ? ' pr-cta-primary' : ''}">${plan.cta}</button>
          </div>`;
      }).join('');
    }

    function initPricingCanvas() {
      const canvas = document.getElementById('pricingCanvas');
      if (!canvas || canvas._prInit) return;
      canvas._prInit = true;
      const ctx = canvas.getContext('2d');
      const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

      const setSize = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        const d = dpr();
        const w = Math.max(1, Math.floor(rect.width));
        const h = Math.max(1, Math.floor(rect.height));
        canvas.width  = Math.floor(w * d);
        canvas.height = Math.floor(h * d);
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(d, 0, 0, d, 0, 0);
      };
      setSize();

      let parts = [], raf = 0;

      const make = () => {
        const w = canvas.width / dpr(), h = canvas.height / dpr();
        return { x: Math.random() * w, y: Math.random() * h, v: Math.random() * 0.25 + 0.05, o: Math.random() * 0.35 + 0.15 };
      };

      const init = () => {
        parts = [];
        const w = canvas.width / dpr(), h = canvas.height / dpr();
        const count = Math.floor((w * h) / 12000);
        for (let i = 0; i < count; i++) parts.push(make());
      };

      const draw = () => {
        const w = canvas.width / dpr(), h = canvas.height / dpr();
        ctx.clearRect(0, 0, w, h);
        parts.forEach(p => {
          p.y -= p.v;
          if (p.y < 0) { p.x = Math.random() * w; p.y = h + Math.random() * 40; p.v = Math.random() * 0.25 + 0.05; p.o = Math.random() * 0.35 + 0.15; }
          ctx.fillStyle = `rgba(250,250,250,${p.o})`;
          ctx.fillRect(p.x, p.y, 0.7, 2.2);
        });
        raf = requestAnimationFrame(draw);
      };

      const ro = new ResizeObserver(() => { setSize(); init(); });
      ro.observe(canvas.parentElement || document.body);

      init();
      raf = requestAnimationFrame(draw);
    }

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

    // ══════════════════════════════════════════════════════════════════
    //  MOVIES PANEL
    // ══════════════════════════════════════════════════════════════════
    const TMDB_KEY = 'fb7bb23f03b6994dafc674c074d01761';
    const MOVIE_SOURCES = [
      { id:'vidlink',      name:'VidLink',      movie:'https://vidlink.pro/movie/{id}',                           tv:'https://vidlink.pro/tv/{id}/{season}/{episode}' },
      { id:'vidsrcxyz',   name:'VidSrc.xyz',   movie:'https://vidsrc.xyz/embed/movie/{id}',                      tv:'https://vidsrc.xyz/embed/tv/{id}/{season}/{episode}' },
      { id:'videasy',     name:'VidEasy',      movie:'https://player.videasy.net/movie/{id}?color=4f8ef7',       tv:'https://player.videasy.net/tv/{id}/{season}/{episode}?color=4f8ef7' },
      { id:'embedmaster', name:'EmbedMaster',  movie:'https://embedmaster.link/movie/{id}',                      tv:'https://embedmaster.link/tv/{id}/{season}/{episode}' },
      { id:'vidsrcrip',   name:'VidSrc.rip',   movie:'https://vidsrc.rip/embed/movie/{id}',                      tv:'https://vidsrc.rip/embed/tv/{id}/{season}/{episode}' },
    ];

    let moviesTabType   = 'movie'; // 'movie' | 'tv'
    let moviesPageNum   = 1;
    let moviesQuery     = '';
    let moviesReady     = false;
    let watchSource     = MOVIE_SOURCES[0].id;
    let watchContentId  = null;
    let watchType       = null;
    let watchSeason     = 1;
    let watchEpisode    = 1;

    function initMoviesPanel() {
      if (moviesReady) return;
      moviesReady = true;
      moviesFetch();
    }

    async function moviesFetch() {
      const status = document.getElementById('moviesStatus');
      const grid   = document.getElementById('moviesGrid');
      if (status) status.textContent = 'Loading…';
      if (grid)   grid.innerHTML = '';
      // Fetch 2 TMDB pages at once (40 results) to fill the grid
      const apiPage1 = (moviesPageNum - 1) * 2 + 1;
      const apiPage2 = apiPage1 + 1;
      function buildUrl(pg) {
        return moviesQuery.trim()
          ? `https://api.themoviedb.org/3/search/${moviesTabType}?api_key=${TMDB_KEY}&query=${encodeURIComponent(moviesQuery)}&page=${pg}`
          : `https://api.themoviedb.org/3/${moviesTabType}/popular?api_key=${TMDB_KEY}&page=${pg}`;
      }
      try {
        const [r1, r2] = await Promise.all([fetch(buildUrl(apiPage1)), fetch(buildUrl(apiPage2))]);
        if (!r1.ok) throw new Error('HTTP ' + r1.status);
        const [d1, d2] = await Promise.all([r1.json(), r2.ok ? r2.json() : Promise.resolve({ results: [] })]);
        const items = [...(d1.results || []), ...(d2.results || [])];
        moviesRender(items);
        const pageEl = document.getElementById('moviesPageNum');
        if (pageEl) pageEl.textContent = moviesPageNum;
        if (status) status.textContent = items.length + ' results';
      } catch(e) {
        if (status) status.textContent = 'Failed — ' + e.message;
      }
    }

    function moviesRender(items) {
      const grid = document.getElementById('moviesGrid');
      if (!grid) return;
      if (!items.length) { grid.innerHTML = '<div class="movies-empty">No results found</div>'; return; }
      grid.innerHTML = items.map(item => {
        const title  = escH(item.title || item.name || 'Untitled');
        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '';
        const yr     = (item.release_date || item.first_air_date || '').slice(0, 4);
        const type   = moviesTabType;
        return `<button class="movies-card" onclick="moviesWatch(${item.id},'${type}')">
          ${poster
            ? `<img class="movies-card-img" src="${poster}" alt="${title}" onerror="this.style.opacity='0.3'">`
            : `<div class="movies-card-img movies-card-no-img">${title.charAt(0)}</div>`}
          <div class="movies-card-info">
            <div class="movies-card-title">${title}</div>
            ${yr ? `<div class="movies-card-year">${yr}</div>` : ''}
          </div>
        </button>`;
      }).join('');
    }

    function moviesSetTab(tab) {
      moviesTabType = tab;
      moviesPageNum = 1;
      document.getElementById('moviesTabMovie')?.classList.toggle('active', tab === 'movie');
      document.getElementById('moviesTabTv')?.classList.toggle('active',   tab === 'tv');
      moviesFetch();
    }

    function moviesOnSearch(val) {
      moviesQuery   = val;
      moviesPageNum = 1;
      moviesFetch();
    }

    function moviesPage(dir) {
      if (dir < 0 && moviesPageNum <= 1) return;
      moviesPageNum += dir;
      moviesFetch();
    }

    async function moviesWatch(contentId, contentType) {
      watchContentId = contentId;
      watchType      = contentType;
      watchSeason    = 1;
      watchEpisode   = 1;

      document.getElementById('moviesBrowse').style.display = 'none';
      document.getElementById('moviesWatch').style.display  = 'flex';

      // Populate source selector
      const sel = document.getElementById('moviesSourceSel');
      if (sel) sel.innerHTML = MOVIE_SOURCES.map(s =>
        `<option value="${s.id}"${s.id === watchSource ? ' selected' : ''}>${escH(s.name)}</option>`
      ).join('');

      const titleEl    = document.getElementById('moviesWatchTitle');
      const metaEl     = document.getElementById('moviesWatchMeta');
      const overviewEl = document.getElementById('moviesOverview');
      const seasonRow  = document.getElementById('moviesSeasonRow');
      const epGrid     = document.getElementById('moviesEpGrid');
      if (titleEl)    titleEl.textContent    = 'Loading…';
      if (seasonRow)  seasonRow.style.display = 'none';
      if (epGrid)     epGrid.style.display    = 'none';

      try {
        const res  = await fetch(`https://api.themoviedb.org/3/${contentType}/${contentId}?api_key=${TMDB_KEY}`);
        const data = await res.json();
        const title = data.title || data.name || 'Watch';
        const yr    = (data.release_date || data.first_air_date || '').slice(0, 4);
        if (titleEl)    titleEl.textContent    = title;
        if (metaEl)     metaEl.textContent     = yr || '';
        if (overviewEl) overviewEl.textContent = data.overview || '';

        if (contentType === 'tv') {
          seasonRow.style.display = 'flex';
          seasonRow.innerHTML = Array.from({ length: data.number_of_seasons || 0 }, (_, i) => i + 1)
            .map(n => `<button class="movies-season-btn${n === 1 ? ' active' : ''}" onclick="moviesPickSeason(${n},this)">S${n}</button>`)
            .join('');
          await moviesLoadSeason(1);
        } else {
          moviesUpdateFrame();
        }
      } catch(e) {
        if (titleEl) titleEl.textContent = 'Failed to load';
      }
    }

    async function moviesLoadSeason(season) {
      watchSeason  = season;
      watchEpisode = 1;
      try {
        const res  = await fetch(`https://api.themoviedb.org/3/tv/${watchContentId}/season/${season}?api_key=${TMDB_KEY}`);
        const data = await res.json();
        const epGrid = document.getElementById('moviesEpGrid');
        if (epGrid) {
          epGrid.style.display = 'flex';
          epGrid.innerHTML = (data.episodes || []).map(ep =>
            `<button class="movies-ep-btn${ep.episode_number === 1 ? ' active' : ''}" onclick="moviesPickEp(${ep.episode_number},this)">Ep ${ep.episode_number}${ep.name ? ' · ' + escH(ep.name) : ''}</button>`
          ).join('');
        }
      } catch(e) {}
      moviesUpdateFrame();
    }

    function moviesPickSeason(n, btn) {
      document.querySelectorAll('.movies-season-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      moviesLoadSeason(n);
    }

    function moviesPickEp(n, btn) {
      document.querySelectorAll('.movies-ep-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      watchEpisode = n;
      moviesUpdateFrame();
    }

    function moviesSetSource(id) {
      watchSource = id;
      moviesUpdateFrame();
    }

    function moviesUpdateFrame() {
      const src      = MOVIE_SOURCES.find(s => s.id === watchSource) || MOVIE_SOURCES[0];
      const template = watchType === 'tv' ? src.tv : src.movie;
      const url      = template
        .replace('{id}',      watchContentId)
        .replace('{season}',  watchSeason)
        .replace('{episode}', watchEpisode);
      const frame = document.getElementById('moviesFrame');
      if (frame) frame.src = url;
    }

    function moviesBack() {
      const frame = document.getElementById('moviesFrame');
      if (frame) frame.src = 'about:blank';
      document.getElementById('moviesWatch').style.display  = 'none';
      document.getElementById('moviesBrowse').style.display = 'flex';
    }

    // ── Vite Compliance: expose all onclick handlers on window ────────
    window.switchPage             = switchPage;
    window.openLogin              = openLogin;
    window.closeLogin             = closeLogin;
    window.handleBackdropClick    = handleBackdropClick;
    window.attemptLogin           = attemptLogin;
    window.openOverlay            = openOverlay;
    window.closeOverlay           = closeOverlay;
    window.selectSidebarItem      = selectSidebarItem;
    window.gcLogActivity          = gcLogActivity;
    window.gcOrbitPush            = gcOrbitPush;
    window.crImgFallback          = crImgFallback;
    window.crShine                = crShine;
    window.crShineReset           = crShineReset;
    window.filterGames            = filterGames;
    window.renderSidebarGames     = renderSidebarGames;
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
    window.moviesSetTab           = moviesSetTab;
    window.moviesOnSearch         = moviesOnSearch;
    window.moviesPage             = moviesPage;
    window.moviesWatch            = moviesWatch;
    window.moviesPickSeason       = moviesPickSeason;
    window.moviesPickEp           = moviesPickEp;
    window.moviesSetSource        = moviesSetSource;
    window.moviesBack             = moviesBack;

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