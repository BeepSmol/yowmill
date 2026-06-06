(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const multEl = document.getElementById('mult');
  const moneyEl = document.getElementById('money');
  const scoreboardEl = document.querySelector('.scoreboard');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlaySub = document.getElementById('overlay-sub');
  const restartBtn = document.getElementById('restart');
  // Background selector UI removed
  const shopEl = document.getElementById('shop');
  const shopToggleEl = document.getElementById('shop-toggle');
  const shopCloseEl = document.getElementById('shop-close');
  const shopUpEl = document.getElementById('shop-up');
  const shopFunEl = document.getElementById('shop-fun');
  const shopJobsEl = document.getElementById('shop-jobs');
  const shopTabUpEl = document.getElementById('shop-tab-up');
  const shopTabFunEl = document.getElementById('shop-tab-fun');
  const shopTabJobsEl = document.getElementById('shop-tab-jobs');
  const shopTabsEl = document.querySelector('.shop-tabs');
  const shopTabIndicatorEl = document.getElementById('shop-tab-indicator');

  // Jobs system
  let currentJob = null; // e.g., 'clicker'
  let multiJobAllowed = false; // reserved for future special upgrade
  let clickingUnlocked = false; // unlocked by 'clicker' job
  let interview = null; // { type, target, count, endAt }
  // Edge-run multiplier streak
  let edgeNearStreak = 0; // consecutive steps on the edge only
  // Typist job state
  let typingJobTarget = '';
  let typingJobProgress = 0;
  let typingWordStartAt = 0;
  let typingStreakCount = 0;
  let typingStreakDeadline = 0; // ms timestamp to chain next number

  // Test cheat indicator
  let cheatActive = false;
  function ensureCheatBadge() {
    let el = document.getElementById('cheat-badge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cheat-badge';
      el.className = 'cheat-badge';
      el.textContent = 'TEST CHEATS ACTIVATED';
      document.body.appendChild(el);
    }
    return el;
  }

  // Grid sizing (keep tile count constant, scale tiles)
  const COLS = 30; // originally 600/20
  const ROWS = 20; // originally 400/20
  let cols = COLS;
  let rows = ROWS;
  let tile = 20;           // dynamic pixel size per tile
  let originX = 0, originY = 0; // top-left of board in canvas pixels
  let boardW = 0, boardH = 0;   // board pixel size
  function resizeCanvas() {
    // Fill viewport in CSS pixels
    const w = Math.max(1, Math.floor(window.innerWidth));
    const h = Math.max(1, Math.floor(window.innerHeight));
    canvas.width = w;
    canvas.height = h;
    // Compute tile size to fit fixed grid
    tile = Math.max(8, Math.floor(Math.min(w / COLS, h / ROWS)));
    boardW = COLS * tile;
    boardH = ROWS * tile;
    originX = Math.floor((w - boardW) / 2);
    originY = Math.floor((h - boardH) / 2);
  }

  // Colors from CSS variables
  const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const colors = {
    bg: getVar('--panel') || '#171b22',
    grid: getVar('--grid') || '#1f2630',
    snake: getVar('--snake') || '#9cdcfe',
    snakeHead: getVar('--snake-head') || '#39c5bb',
    food: getVar('--food') || '#e06c75',
  };

  // Backgrounds manifest (sorted into subfolders under assets/images)
  const BACKGROUNDS = {
    'Siphos': [
      'assets/images/siphos/A_god_named_Siphos_DALLE_2025-02-17_17.36.11_-_A_blurred_unseeable_depiction_of_Siphos_the_divine_creator_whose_form_is_beyond_mortal_comprehension._His_multiple_arms_and_glowing_eyes.webp',
      'assets/images/siphos/Siphos_Scrapped_DALLE_2025-02-17_16.31.39_-_A_dark_distorted_depiction_of_Siphos_the_divine_creator._He_has_multiple_arms_and_glowing_eyes_appearing_as_an_ominous_and_powerful_figure._His_for.webp',
    ],
    'Sindle': [
      'assets/images/sindle/A_man_named_Sindle.webp',
      'assets/images/sindle/A_man_named_Sindle_png_version.png',
      'assets/images/sindle/Potentially_a_man_named_Sindle_Rejected.jpg',
    ],
    'Yow Mill': [
      'assets/images/yow_mill/A_man_named_Yow_Mill.png',
      'assets/images/yow_mill/A_man_named_Yow_Mill_-_Crop.png',
      'assets/images/yow_mill/A_man_named_Yow_Mill_Bitcrushed_version.png',
      'assets/images/yow_mill/Yow_mill.jpg',
      'assets/images/yow_mill/Yow_Mill_1_of_power.jpg',
      'assets/images/yow_mill/Yow_Mill_2.jpg',
      'assets/images/yow_mill/Yow_Mill_3.jpg',
      'assets/images/yow_mill/Yow_mill_Devious.jpg',
      'assets/images/yow_mill/Yow_Mill_F_U_R_I_O_U_S.jpg',
      'assets/images/yow_mill/Yow_Mill_has_arrived.jpg',
      'assets/images/yow_mill/Yow_Mill_Mug.png',
      'assets/images/yow_mill/Yow_Mill_pitying.jpg',
      'assets/images/yow_mill/Yow_Mill_serious.jpg',
      'assets/images/yow_mill/Yow_Mill_somber.jpg',
    ],
    'Surrere': [
      'assets/images/surrere/A_man_named_Surrere.jpg',
      'assets/images/surrere/A_man_named_Surrere_png_version.png',
    ],
    'Fizzion': [
      'assets/images/fizzion/A_man_named_Fizzion_DALLE_2025-02-17_16.14.56_-_A_man_named_Fizzion_drinking_lemonade_at_an_outdoor_cafe._He_has_short_messy_brown_hair_and_a_well-groomed_beard._He_is_wearing_a_casual_shirt.webp',
      'assets/images/fizzion/A_man_named_Fizzion_DALLE_2025-02-17_16.14.56_-_A_man_named_Fizzion_drinking_lemonade_at_an_outdoor_cafe._He_has_short_messy_brown_hair_and_a_well-groomed_beard._He_is_wearing_a_casual_shir_-_Copy.webp',
      'assets/images/fizzion/Fizzion_Scrapped_DALLE_2025-02-14_20.41.39_-_A_man_named_Fizzion_drinking_lemonade_at_an_outdoor_cafe._He_has_short_messy_brown_hair_and_a_well-groomed_beard._He_is_wearing_a_casual_button-up_sh.webp',
    ],
    'Scenes': [
      'assets/images/scenes/DALLE_2025-01-21_11.59.06_-_A_fantastical_and_dark_depiction_of_the_underworld_ruled_by_coffee_named_Cafendria._The_landscape_is_shadowy_and_ominous_with_rivers_of_steaming_esp.webp',
      'assets/images/scenes/DALLE_2025-01-22_16.38.47_-_A_serene_and_fantastical_depiction_of_Asiania_the_heavenly_realm_of_Yow_Mill_the_god_of_tea._The_landscape_is_lush_and_tranquil_filled_with_rolling.webp',
      'assets/images/scenes/Mount_Siphos_DALLE_2025-01-25_16.57.08_-_A_breathtaking_depiction_of_Mount_Siphos_the_mythical_mountain_where_the_gods_meet._The_mountain_is_massive_and_majestic_with_multiple_peaks_piercin.webp',
      'assets/images/scenes/Sindles_Prison_DALLE_2025-01-25_16.43.18_-_A_surreal_and_eerie_depiction_of_Sindles_prison_realm_a_completely_white_void_with_no_visible_horizon_or_landmarks._Sindle_a_hooded_and_shadowy_fig.webp',
    ],
  };

  // Game state
  let state = 'playing'; // 'playing' | 'paused' | 'over'
  let scoreFloat = 0; // high-octane score with multiplier
  let moneyFloat = 0; // currency mirrors score gains
  let mult = 1.0;
  const MULT_MAX = 5.0;
  const MULT_DECAY_PER_SEC = 0.25; // returns to 1.0 over ~4s idle
  let multDecayRate = MULT_DECAY_PER_SEC; // modifiable by upgrades
  const POINTS = {
    perSecond: 1, // passive points per second while playing
    food: 100,
    wrapPickup: 150,
    wrapTeleport: 25,
    click: 5,
    clickFood: 50,
    clickHead: 20,
    clickUpgrade: 40,
  };
  const BOOST = {
    click: 0.05,
    clickObject: 0.2,
    eat: 0.4,
    wrapPickup: 0.5,
    wrapTeleport: 0.2,
    edgeRun: 0.05,
  };
  let stepMs = 100; // 10 steps/sec
  let lastTs = 0;
  let acc = 0;
  // Background image cache
  let bgImage = null; // HTMLImageElement | null
  let bgImageReady = false;
  let bgPath = '';
  // Snake sprites per segment (images)
  let segmentSprites = [];
  // Food state includes image
  let foodImg = null; // HTMLImageElement | null
  let foodPath = '';
  // Wrap upgrade state
  let wrapUpgrade = null; // {x,y} | null
  let wrapUpgradeExpiry = 0; // ms timestamp
  let wrapActiveUntil = 0; // ms timestamp
  const WRAP_DURATION_MS = 15000; // 15s of wrapping after pickup
  const WRAP_UPGRADE_TTL_MS = 12000; // Upgrade despawns after 12s
  let permWrap = false; // permanent wrap from shop
  let foodBonusPoints = 0; // extra food points from shop
  let pendingRerollSegments = 0; // fun: count of segment rerolls to use

  // Shop: persistent upgrades
  const UPGRADE_DEFS = {
    wrap_perm: {
      name: 'Offscreen Wrap (Permanent)',
      desc: 'Walk into walls and come out the other side, always on.',
      cost: 1200,
      apply() { permWrap = true; },
    },
    slow_decay: {
      name: 'Slow Multiplier Decay',
      desc: 'Your multiplier decays slower toward x1.',
      cost: 800,
      apply() { multDecayRate = Math.max(0.08, MULT_DECAY_PER_SEC * 0.5); },
    },
    food_bonus: {
      name: 'Food Bonus +50',
      desc: 'Eating food grants +50 more points.',
      cost: 1600,
      apply() { foodBonusPoints = 50; },
    },
  };
  let upgradesClaimed = new Set();
  function loadUpgrades() {
    // Arcade mode: no persistence across refreshes/sessions
    upgradesClaimed = new Set();
    try { localStorage.removeItem('ms_upgrades'); } catch {}
  }
  function saveUpgrades() {
    // No-op: do not persist upgrades
  }
  function resetAppliedUpgrades() { permWrap = false; multDecayRate = MULT_DECAY_PER_SEC; foodBonusPoints = 0; }
  function applyUpgrades() {
    resetAppliedUpgrades();
    for (const id of upgradesClaimed) {
      const def = UPGRADE_DEFS[id];
      if (def && typeof def.apply === 'function') def.apply();
    }
  }
  function toggleShop(open) {
    if (!shopEl) return;
    const willOpen = typeof open === 'boolean' ? open : !shopEl.classList.contains('open');
    shopEl.classList.toggle('open', willOpen);
    shopEl.setAttribute('aria-hidden', String(!willOpen));
    if (shopToggleEl) shopToggleEl.setAttribute('aria-expanded', String(!!willOpen));
  }
  function renderShopUpgrades() {
    if (!shopUpEl) return;
    shopUpEl.innerHTML = '';
    for (const [id, def] of Object.entries(UPGRADE_DEFS)) {
      const item = document.createElement('div');
      item.className = 'shop-item';
      const claimed = upgradesClaimed.has(id);
      item.innerHTML = `
        <h3>${def.name}</h3>
        <div class="meta">Cost: ${def.cost} coins</div>
        <p>${def.desc}</p>
        <div><button data-id="${id}">${claimed ? 'Owned' : 'Buy'}</button></div>
      `;
      const btn = item.querySelector('button');
      if (claimed) btn.disabled = true;
      btn.addEventListener('click', () => {
        const cost = def.cost;
        if (!upgradesClaimed.has(id) && Math.floor(moneyFloat) >= cost) {
          moneyFloat = Math.max(0, moneyFloat - cost);
          updateMoney();
          addPopupAtElement(scoreboardEl, `-${cost}`, '#ff5555');
        
          upgradesClaimed.add(id);
          applyUpgrades();
          renderShopUpgrades();
          updateShopButtons();
        }
      });
      shopUpEl.appendChild(item);
    }
  }
  const FUN_ITEMS = {
    reroll_bg: { name: 'Reroll Background', desc: 'Instantly reroll the background image.', cost: 100, action() { setRandomBackground(); } },
    reroll_segment: { name: 'Reroll Snake Segment', desc: 'Buy, then click a snake tile to reroll its image.', cost: 75, action() { pendingRerollSegments += 1; } },
  };
  function renderShopFun() {
    if (!shopFunEl) return;
    shopFunEl.innerHTML = '';
    for (const [id, def] of Object.entries(FUN_ITEMS)) {
      const item = document.createElement('div');
      item.className = 'shop-item';
      item.innerHTML = `
        <h3>${def.name}</h3>
        <div class="meta">Cost: ${def.cost} coins</div>
        <p>${def.desc}</p>
        <div><button data-fun-id="${id}">Buy</button></div>
      `;
      const btn = item.querySelector('button');
      btn.addEventListener('click', () => {
        const cost = def.cost;
        if (Math.floor(moneyFloat) >= cost) {
          moneyFloat = Math.max(0, moneyFloat - cost);
          updateMoney();
          addPopupAtElement(scoreboardEl, `-${cost}`, '#ff5555');
          def.action();
          updateShopButtons();
        }
      });
      shopFunEl.appendChild(item);
    }
  }
  function renderShopJobs() {
    if (!shopJobsEl) return;
    shopJobsEl.innerHTML = '';

    // Click Operator job
    const cost = 750;
    const item = document.createElement('div');
    item.className = 'shop-item';
    const hasJob = currentJob !== null && currentJob !== 'clicker' && !multiJobAllowed;
    const owned = currentJob === 'clicker' || clickingUnlocked;
    const btnLabel = owned ? 'Employed' : `Apply (${cost})`;
    item.innerHTML = `
      <h3>Click Operator</h3>
      <div class="meta">Salary: Enables click-to-earn permanently</div>
      <p>Pass the interview: click 50 times in 30 seconds.</p>
      <div><button data-job-id="clicker">${btnLabel}</button></div>
      ${hasJob ? '<div class="meta">You already have a job.</div>' : ''}
    `;
    const btn = item.querySelector('button');
    btn.disabled = owned || hasJob || Math.floor(moneyFloat) < cost || interview !== null;
    btn.addEventListener('click', () => {
      // Re-evaluate live state to avoid stale closures across runs
      const liveOwned = currentJob === 'clicker' || clickingUnlocked;
      const liveHasJob = currentJob !== null && currentJob !== 'clicker' && !multiJobAllowed;
      if (liveOwned || liveHasJob || interview) return;
      if (Math.floor(moneyFloat) < cost) return;
      // Spend and start interview
      moneyFloat = Math.max(0, moneyFloat - cost);
      updateMoney();
      addPopupAtElement(scoreboardEl, `-${cost}`, '#ff5555');
      startClickInterview();
      toggleShop(false);
      renderShopJobs();
      updateShopButtons();
    });
    shopJobsEl.appendChild(item);

    // Edge Runner job (earn coins on board edges)
    const edgeItem = document.createElement('div');
    edgeItem.className = 'shop-item';
    const hasOtherJob = currentJob !== null && currentJob !== 'edge' && !multiJobAllowed;
    const edgeOwned = currentJob === 'edge';
    const edgeCost = 900; // requires edge interview
    edgeItem.innerHTML = `
      <h3>Edge Runner</h3>
      <div class="meta">Salary: Earn 10 coins per step on the board edge.</div>
      <p>Interview: travel 30 tiles on the edge within 30 seconds.</p>
      <div><button data-job-id="edge">${edgeOwned ? 'Employed' : `Apply (${edgeCost})`}</button></div>
      ${hasOtherJob ? '<div class="meta">You already have a job.</div>' : ''}
    `;
    const edgeBtn = edgeItem.querySelector('button');
    edgeBtn.disabled = edgeOwned || hasOtherJob || Math.floor(moneyFloat) < edgeCost || !!interview;
    edgeBtn.addEventListener('click', () => {
      // Live checks
      const lHasOtherJob = currentJob !== null && currentJob !== 'edge' && !multiJobAllowed;
      if (edgeOwned || lHasOtherJob || interview) return;
      if (Math.floor(moneyFloat) < edgeCost) return;
      // Spend and start edge interview
      moneyFloat = Math.max(0, moneyFloat - edgeCost);
      updateMoney();
      addPopupAtElement(scoreboardEl, `-${edgeCost}`, '#ff5555');
      startEdgeInterview();
      toggleShop(false);
      renderShopJobs();
      updateShopButtons();
    });
    shopJobsEl.appendChild(edgeItem);
    // Typist job (earn coins by typing numbers)
    const typistItem = document.createElement('div');
    typistItem.className = 'shop-item';
    const hasOther = currentJob !== null && currentJob !== 'typist' && !multiJobAllowed;
    const typistOwned = currentJob === 'typist';
    const typistCost = 1000;
    typistItem.innerHTML = `
      <h3>Data Entry (Typist)</h3>
      <div class="meta">Salary: Complete a number to gain 15 coins per digit.</div>
      <p>Interview: type 5 numbers (digits 1–9 only) within 30 seconds.</p>
      <div><button data-job-id="typist">${typistOwned ? 'Employed' : `Apply (${typistCost})`}</button></div>
      ${hasOther ? '<div class="meta">You already have a job.</div>' : ''}
    `;
    const typistBtn = typistItem.querySelector('button');
    typistBtn.disabled = typistOwned || hasOther || Math.floor(moneyFloat) < typistCost || !!interview;
    typistBtn.addEventListener('click', () => {
      const liveHasOther = currentJob !== null && currentJob !== 'typist' && !multiJobAllowed;
      if (typistOwned || liveHasOther || interview) return;
      if (Math.floor(moneyFloat) < typistCost) return;
      moneyFloat = Math.max(0, moneyFloat - typistCost);
      updateMoney();
      addPopupAtElement(scoreboardEl, `-${typistCost}`, '#ff5555');
      startTypistInterview();
      toggleShop(false);
      renderShopJobs();
      updateShopButtons();
    });
    shopJobsEl.appendChild(typistItem);
  }

  function startClickInterview() {
    interview = { type: 'clicker', target: 50, count: 0, endAt: performance.now() + 30000 };
    ensureInterviewBanner();
    updateInterviewBanner();
  }

  function startEdgeInterview() {
    interview = { type: 'edge', target: 30, count: 0, endAt: performance.now() + 30000 };
    ensureInterviewBanner();
    updateInterviewBanner();
  }
  function randomDigits(len) { let s=''; for (let i=0;i<len;i++) s += String(1+Math.floor(Math.random()*9)); return s; }
  function startTypistInterview() {
    const word = randomDigits(3 + Math.floor(Math.random() * 3));
    interview = { type: 'typist', target: 5, count: 0, endAt: performance.now() + 30000, word, progress: 0 };
    ensureInterviewBanner();
    updateInterviewBanner();
  }

  function ensureInterviewBanner() {
    let el = document.getElementById('interview-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'interview-banner';
      el.className = 'interview-banner';
      document.body.appendChild(el);
    }
    return el;
  }
  function updateInterviewBanner() {
    const el = ensureInterviewBanner();
    if (!interview) { el.remove(); return; }
    const remaining = Math.max(0, Math.ceil((interview.endAt - performance.now()) / 1000));
    const mainLabel = interview.type === 'clicker' ? 'Clicks' : (interview.type === 'edge' ? 'Tiles' : 'Words');
    const mainPct = Math.max(0, Math.min(1, interview.count / interview.target));
    const timePct = Math.max(0, Math.min(1, (interview.endAt - performance.now()) / 30000));
    let extra = '';
    if (interview.type === 'typist') {
      const w = interview.word || '';
      const p = interview.progress || 0;
      const done = w.slice(0, p);
      const rest = w.slice(p);
      extra = `<div class="word">Type: <span class="done">${done}</span><span class="rest">${rest}</span></div>`;
    }
    el.innerHTML = `
      <div class="title">Interview: ${interview.count}/${interview.target} ${mainLabel} • ${remaining}s</div>
      <div class="bars">
        <div class="bar bar-clicks"><div class="fill" style="width:${(mainPct*100).toFixed(1)}%"></div></div>
        <div class="bar bar-time"><div class="fill" style="width:${(timePct*100).toFixed(1)}%"></div></div>
      </div>
      ${extra}
    `;
  }
  function finishInterview(success) {
    if (!interview) return;
    if (success) {
      if (interview.type === 'clicker') {
        currentJob = 'clicker';
        clickingUnlocked = true;
      } else if (interview.type === 'edge') {
        currentJob = 'edge';
        clickingUnlocked = false;
      } else if (interview.type === 'typist') {
        currentJob = 'typist';
        typingJobTarget = '';
        typingJobProgress = 0;
        ensureTypingBanner();
        newTypingTarget();
      }
      addPopupAtElement(scoreboardEl, 'HIRED!', '#50fa7b');
    } else {
      addPopupAtElement(scoreboardEl, 'Interview failed', '#ff5555');
    }
    interview = null;
    const el = document.getElementById('interview-banner');
    if (el) el.remove();
    renderShopJobs();
    updateShopButtons();
  }
  function updateShopButtons() {
    const coins = Math.floor(moneyFloat);
    // upgrades
    if (shopUpEl) {
      const buttons = shopUpEl.querySelectorAll('button[data-id]');
      buttons.forEach(btn => {
        const id = btn.getAttribute('data-id');
        const def = UPGRADE_DEFS[id];
        const claimed = upgradesClaimed.has(id);
        btn.textContent = claimed ? 'Owned' : 'Buy';
        const disabled = claimed || coins < def.cost;
        btn.disabled = disabled;
        const card = btn.closest('.shop-item');
        if (card) {
          card.classList.toggle('owned', claimed);
          card.classList.toggle('affordable', !claimed && coins >= def.cost);
          card.classList.toggle('unaffordable', !claimed && coins < def.cost);
        }
      });
    }
    // fun
    if (shopFunEl) {
      const buttons = shopFunEl.querySelectorAll('button[data-fun-id]');
      buttons.forEach(btn => {
        const id = btn.getAttribute('data-fun-id');
        const def = FUN_ITEMS[id];
        const canAfford = coins >= def.cost;
        btn.disabled = !canAfford;
        const card = btn.closest('.shop-item');
        if (card) {
          card.classList.toggle('affordable', canAfford);
          card.classList.toggle('unaffordable', !canAfford);
        }
      });
    }
    // jobs
    if (shopJobsEl) {
      // Clicker job button
      const clickerBtn = shopJobsEl.querySelector('button[data-job-id="clicker"]');
      if (clickerBtn) {
        const cost = 750;
        const owned = currentJob === 'clicker' || clickingUnlocked;
        const hasOtherJob = currentJob !== null && currentJob !== 'clicker' && !multiJobAllowed;
        const canAfford = coins >= cost;
        const disabled = owned || hasOtherJob || !canAfford || !!interview;
        clickerBtn.disabled = disabled;
        if (owned) clickerBtn.textContent = 'Employed';
        else if (interview) clickerBtn.textContent = 'Interview in progress…';
        else clickerBtn.textContent = `Apply (${cost})`;
        const card = clickerBtn.closest('.shop-item');
        if (card) {
          card.classList.toggle('owned', owned);
          card.classList.toggle('affordable', !disabled && canAfford);
          card.classList.toggle('unaffordable', !owned && !hasOtherJob && !canAfford);
        }
      }
      // Edge job button
      const edgeBtn = shopJobsEl.querySelector('button[data-job-id="edge"]');
      if (edgeBtn) {
        const edgeOwned = currentJob === 'edge';
        const hasOtherJob = currentJob !== null && currentJob !== 'edge' && !multiJobAllowed;
        const edgeCost = 900;
        const canAfford = coins >= edgeCost;
        const disabled = edgeOwned || hasOtherJob || !canAfford || !!interview;
        edgeBtn.disabled = disabled;
        edgeBtn.textContent = edgeOwned ? 'Employed' : (interview ? 'Interview in progress…' : `Apply (${edgeCost})`);
        const card = edgeBtn.closest('.shop-item');
        if (card) {
          card.classList.toggle('owned', edgeOwned);
          card.classList.toggle('affordable', !disabled && canAfford);
          card.classList.toggle('unaffordable', !edgeOwned && !hasOtherJob && !canAfford);
        }
      }
      // Typist job button
      const typistBtn = shopJobsEl.querySelector('button[data-job-id="typist"]');
      if (typistBtn) {
        const typOwned = currentJob === 'typist';
        const hasOtherJob = currentJob !== null && currentJob !== 'typist' && !multiJobAllowed;
        const typCost = 1000;
        const canAfford = coins >= typCost;
        const disabled = typOwned || hasOtherJob || !canAfford || !!interview;
        typistBtn.disabled = disabled;
        typistBtn.textContent = typOwned ? 'Employed' : (interview ? 'Interview in progress…' : `Apply (${typCost})`);
        const card = typistBtn.closest('.shop-item');
        if (card) {
          card.classList.toggle('owned', typOwned);
          card.classList.toggle('affordable', !disabled && canAfford);
          card.classList.toggle('unaffordable', !typOwned && !hasOtherJob && !canAfford);
        }
      }
    }
  }
  function setShopTab(tab) {
    const showUp = tab === 'up';
    const showFun = tab === 'fun';
    const showJobs = tab === 'jobs';
    shopTabUpEl?.classList.toggle('active', showUp);
    shopTabFunEl?.classList.toggle('active', showFun);
    shopTabJobsEl?.classList.toggle('active', showJobs);
    shopUpEl?.classList.toggle('hidden', !showUp);
    shopFunEl?.classList.toggle('hidden', !showFun);
    shopJobsEl?.classList.toggle('hidden', !showJobs);
    updateTabIndicator();
  }

  function updateTabIndicator() {
    if (!shopTabIndicatorEl || !shopTabsEl) return;
    const active = shopTabsEl.querySelector('.shop-tab.active');
    if (!active) return;
    const cRect = shopTabsEl.getBoundingClientRect();
    const tRect = active.getBoundingClientRect();
    const left = tRect.left - cRect.left; // relative X
    const width = tRect.width;
    shopTabIndicatorEl.style.width = `${Math.max(0, Math.floor(width))}px`;
    shopTabIndicatorEl.style.transform = `translateX(${Math.max(0, Math.floor(left))}px)`;
  }

  // Snake and food
  let snake, dir, nextDir, food;

  function initGame() {
    // Arcade behavior: clear any prior run purchases/buffs
    upgradesClaimed.clear();
    pendingRerollSegments = 0;
    resetAppliedUpgrades();
    // Reset jobs and interviews each new game
    currentJob = null;
    clickingUnlocked = false;
    interview = null;
    const ib = document.getElementById('interview-banner');
    if (ib) ib.remove();
    // Clear particles
    edgeParticles.length = 0;
    // Clear cheat badge/state
    cheatActive = false;
    const existingCheat = document.getElementById('cheat-badge');
    if (existingCheat) existingCheat.remove();
    // Reset edge streak
    edgeNearStreak = 0;
    const es = document.getElementById('edge-streak');
    if (es) es.remove();
    // Reset typist job state
    typingJobTarget = '';
    typingJobProgress = 0;
    const tb = document.getElementById('typing-banner');
    if (tb) tb.remove();
    renderShopUpgrades();
    renderShopFun();
    renderShopJobs();
    updateShopButtons();
    scoreFloat = 0;
    moneyFloat = 0;
    mult = 1.0;
    updateScore();
    updateMultiplierDisplay();
    updateMoney();
    // No persistent upgrades between games
    stepMs = 100;
    lastTs = 0;
    acc = 0;
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);
    snake = [ { x: startX, y: startY }, { x: startX - 1, y: startY } ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    // Initialize segment sprites
    segmentSprites = [ randomSnakeImg(), randomSnakeImg() ];
    // Random background for each game
    setRandomBackground();
    // Spawn food with specific images
    food = spawnFood();
    // Reset wrap upgrade
    wrapUpgrade = null;
    wrapUpgradeExpiry = 0;
    wrapActiveUntil = 0;
    state = 'playing';
    hideOverlay();
  }

  function updateScore() { scoreEl.textContent = String(Math.floor(scoreFloat)); updateScoreTier(); updateShopButtons(); }
  function updateMoney() { if (moneyEl) moneyEl.textContent = String(Math.floor(moneyFloat)); }
  function updateMultiplierDisplay() { multEl.textContent = 'x' + mult.toFixed(1); }
  function addPoints(amount) {
    const inc = amount * mult;
    scoreFloat += inc;
    moneyFloat += inc;
    updateScore();
    updateMoney();
  }
  function boostMultiplier(inc) { mult = Math.min(MULT_MAX, mult + inc); updateMultiplierDisplay(); }

  function updateScoreTier() {
    const s = Math.floor(scoreFloat);
    let tier = 0;
    if (s >= 5000) tier = 3; else if (s >= 2000) tier = 2; else if (s >= 500) tier = 1;
    scoreboardEl.classList.toggle('t1', tier >= 1);
    scoreboardEl.classList.toggle('t2', tier >= 2);
    scoreboardEl.classList.toggle('t3', tier >= 3);
  }

  function spawnFood() {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    let x, y;
    do {
      x = Math.floor(Math.random() * cols);
      y = Math.floor(Math.random() * rows);
    } while (occupied.has(`${x},${y}`));
    const p = randomFoodPath();
    foodPath = p;
    foodImg = getImage(p);
    return { x, y };
  }

  // Input handling
  const keyDirs = {
    ArrowUp: { x: 0, y: -1 }, KeyW: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }, KeyS: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, KeyA: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }, KeyD: { x: 1, y: 0 },
  };

  function isOpposite(a, b) { return a.x === -b.x && a.y === -b.y; }

  window.addEventListener('keydown', (ev) => {
    const code = ev.code;
    // Typist interview input: digits 1-9
    if (interview && interview.type === 'typist') {
      const d = keyToDigit(code);
      if (d) {
        const w = interview.word;
        const p = interview.progress;
        if (w && p < w.length && d === w[p]) {
          interview.progress += 1;
          if (interview.progress >= w.length) {
            interview.count += 1;
            if (interview.count >= interview.target) {
              finishInterview(true);
            } else {
              interview.word = randomDigits(3 + Math.floor(Math.random() * 3));
              interview.progress = 0;
            }
          }
          updateInterviewBanner();
        }
        ev.preventDefault();
        return;
      }
    }
    // Test cheat: press 0 to add 10,000 coins and mark run as cheated
    if (code === 'Digit0' || code === 'Numpad0') {
      moneyFloat += 10000;
      updateMoney();
      ensureCheatBadge();
      cheatActive = true;
      addPopupAtElement(scoreboardEl, '+10000', '#ff5555');
      updateShopButtons();
      ev.preventDefault();
      return;
    }
    if (code === 'KeyB') {
      toggleShop();
      ev.preventDefault();
      return;
    }
    if (code in keyDirs) {
      const d = keyDirs[code];
      // Prevent 180 turns within one tick
      if (!isOpposite(d, dir)) {
        nextDir = d;
      }
      ev.preventDefault();
      return;
    }
    if (code === 'Space') {
      // Toggle pause
      if (state === 'playing') {
        setPaused(true);
      } else if (state === 'paused') {
        setPaused(false);
      }
      ev.preventDefault();
      return;
    }
    if (code === 'Enter') {
      if (state === 'over' || state === 'paused') {
        initGame();
      }
      ev.preventDefault();
      return;
    }
    // Typist job input (digits 1-9)
    if (!interview && currentJob === 'typist') {
      const d = keyToDigit(code);
      if (d) {
        if (!typingJobTarget) newTypingTarget();
        const w = typingJobTarget;
        const p = typingJobProgress;
        if (w && p < w.length && d === w[p]) {
          typingJobProgress += 1;
          if (typingJobProgress >= w.length) {
            const reward = 15 * w.length;
            addPoints(reward);
            addPopupAtElement(scoreboardEl, `+${reward}`, '#50fa7b');
            const tbEl = document.getElementById('typing-banner');
            if (tbEl) addPopupAtElement(tbEl, `+${reward}`, '#50fa7b');
            newTypingTarget();
          } else {
            updateTypingBanner();
          }
        }
        ev.preventDefault();
      }
    }
  }, { passive: false });

  restartBtn.addEventListener('click', () => {
    initGame();
  });

  // Helper: map key code to digit '1'-'9'
  function keyToDigit(code) {
    const m = /^(Digit|Numpad)([1-9])$/.exec(code);
    return m ? m[2] : '';
  }

  // Typist job banner
  function ensureTypingBanner() {
    let el = document.getElementById('typing-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'typing-banner';
      el.className = 'typing-banner';
      document.body.appendChild(el);
    }
    return el;
  }
  function updateTypingBanner() {
    if (currentJob !== 'typist') { const el = document.getElementById('typing-banner'); if (el) el.remove(); return; }
    const el = ensureTypingBanner();
    const w = typingJobTarget;
    const p = typingJobProgress;
    const done = w.slice(0, p);
    const rest = w.slice(p);
    el.innerHTML = `Type: <span class="done">${done}</span><span class="rest">${rest}</span>`;
  }
  function newTypingTarget() {
    typingJobTarget = randomDigits(3 + Math.floor(Math.random() * 3));
    typingJobProgress = 0;
    typingWordStartAt = performance.now();
    updateTypingBanner();
  }

  // High-octane typing streak bar (bottom)
  function ensureTypingStreakEl() {
    let el = document.getElementById('typing-streak');
    if (!el) {
      el = document.createElement('div');
      el.id = 'typing-streak';
      el.className = 'typing-streak';
      el.innerHTML = '<div class="label">HIGH-OCTANE</div><div class="bar"><div class="fill"></div></div>';
      document.body.appendChild(el);
    }
    return el;
  }
  function updateTypingStreakEl() {
    if (currentJob !== 'typist') { const el = document.getElementById('typing-streak'); if (el) el.remove(); return; }
    const el = ensureTypingStreakEl();
    const fill = el.querySelector('.fill');
    const now = performance.now();
    let pct = 0;
    if (typingStreakDeadline && now < typingStreakDeadline) {
      const remain = typingStreakDeadline - now;
      const windowMs = 3000;
      pct = Math.max(0, Math.min(1, remain / windowMs));
    }
    fill.style.width = `${(pct*100).toFixed(1)}%`;
    el.querySelector('.label').textContent = `HIGH-OCTANE x${typingStreakCount}`;
  }

  // Shop events
  if (shopToggleEl) shopToggleEl.addEventListener('click', () => toggleShop());
  if (shopCloseEl) shopCloseEl.addEventListener('click', () => toggleShop(false));
  if (shopTabUpEl) shopTabUpEl.addEventListener('click', () => setShopTab('up'));
  if (shopTabFunEl) shopTabFunEl.addEventListener('click', () => setShopTab('fun'));
  if (shopTabJobsEl) shopTabJobsEl.addEventListener('click', () => setShopTab('jobs'));
  window.addEventListener('resize', () => { updateTabIndicator(); updateTypingStreakEl(); });

  // Click scoring on the canvas
  function clientToBoardCell(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < originX || y < originY || x >= originX + boardW || y >= originY + boardH) return null;
    const cx = Math.floor((x - originX) / tile);
    const cy = Math.floor((y - originY) / tile);
    if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return null;
    return { x: cx, y: cy };
  }
  canvas.addEventListener('pointerdown', (ev) => {
    if (state !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const localX = ev.clientX - rect.left;
    const localY = ev.clientY - rect.top;
    const cell = clientToBoardCell(ev.clientX, ev.clientY);

    // Interview capture: count every canvas click during interview
    if (interview && interview.type === 'clicker') {
      interview.count += 1;
      updateInterviewBanner();
      if (interview.count >= interview.target) {
        finishInterview(true);
      }
      // Continue to allow rerolls etc., but scoring remains gated until job unlocked
    }
    // Handle fun: reroll a specific snake segment if purchased
    if (cell && pendingRerollSegments > 0) {
      for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === cell.x && snake[i].y === cell.y) {
          segmentSprites[i] = randomSnakeImg();
          pendingRerollSegments -= 1;
          addPopupAtCell(cell.x, cell.y, 'REROLL!', '#8be9fd');
          break;
        }
      }
    }
    if (cell && clickingUnlocked) {
      // Clicked on board
      if (food && cell.x === food.x && cell.y === food.y) {
        addPoints(POINTS.clickFood);
        boostMultiplier(BOOST.clickObject);
        addPopupAtCell(cell.x, cell.y, `+${POINTS.clickFood}`, '#50fa7b');
        return;
      }
      if (snake && snake[0] && cell.x === snake[0].x && cell.y === snake[0].y) {
        addPoints(POINTS.clickHead);
        boostMultiplier(BOOST.clickObject);
        addPopupAtCell(cell.x, cell.y, `+${POINTS.clickHead}`, '#ff79c6');
        return;
      }
      if (wrapUpgrade && cell.x === wrapUpgrade.x && cell.y === wrapUpgrade.y) {
        addPoints(POINTS.clickUpgrade);
        boostMultiplier(BOOST.clickObject);
        addPopupAtCell(cell.x, cell.y, `+${POINTS.clickUpgrade}`, '#bd93f9');
        return;
      }
    }
    // General click anywhere (only if clicking unlocked)
    if (clickingUnlocked) {
      addPoints(POINTS.click);
      boostMultiplier(BOOST.click);
      addPopupAtPx(localX, localY, `+${POINTS.click}`, '#8be9fd');
    }
  });

  // Handle window resize — resize canvas and restart the game
  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), ms); };
  }
  const onResize = debounce(() => { resizeCanvas(); initGame(); }, 150);
  window.addEventListener('resize', onResize);

  // Background selection UI removed
  function setBackground(path) {
    if (!path) {
      bgImage = null; bgImageReady = false; bgPath = '';
      return;
    }
    if (bgPath === path && bgImageReady) return; // already loaded
    const img = new Image();
    img.onload = () => { bgImage = img; bgImageReady = true; bgPath = path; };
    img.onerror = () => { bgImage = null; bgImageReady = false; bgPath = ''; };
    img.src = path;
  }
  function setRandomBackground() {
    const all = Object.values(BACKGROUNDS).flat();
    const pick = all[Math.floor(Math.random() * all.length)];
    setBackground(pick);
  }
  // UI removed

  function setPaused(p) {
    if (p) {
      state = 'paused';
      showOverlay('Paused', 'Press Space to resume');
    } else {
      state = 'playing';
      hideOverlay();
    }
  }

  function gameOver() {
    state = 'over';
    const final = Math.floor(scoreFloat);
    showOverlay('Game Over', `Final Score: ${final} - Press Enter to restart`);
  }

  function showOverlay(title, sub) {
    overlayTitle.textContent = title;
    overlaySub.textContent = sub;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  // Game loop
  const RENDER_FPS = 60;
  const RENDER_INTERVAL_MS = 1000 / RENDER_FPS;
  let lastRenderTs = 0;
  let lastParticleTs = 0;

  function loop(ts) {
    const dt = Math.min(100, ts - lastTs || 0);
    lastTs = ts;
    if (state === 'playing') {
      // Passive points and multiplier decay
      const dp = (POINTS.perSecond * mult) * (dt / 1000);
      scoreFloat += dp;
      moneyFloat += dp;
      updateMoney();
      // Decay multiplier toward 1.0
      if (mult > 1.0) {
        mult = Math.max(1.0, mult - multDecayRate * (dt / 1000));
        updateMultiplierDisplay();
      }
      updateScore();
      acc += dt;
      while (acc >= stepMs) {
        step();
        acc -= stepMs;
      }
    }
    // Interview timeout handling
    if (interview) {
      if (performance.now() >= interview.endAt && interview.count < interview.target) {
        finishInterview(false);
      } else if (interview) {
        // Keep banner fresh
        updateInterviewBanner();
      }
    }

    // Update FX particles
    updateEdgeParticles(ts);

    // Render at fixed 60 FPS while keeping update timing unchanged
    if (ts - lastRenderTs >= RENDER_INTERVAL_MS) {
      draw();
      lastRenderTs = ts;
    }
    requestAnimationFrame(loop);
  }

  function step() {
    // Apply direction queued by input
    if (!isOpposite(nextDir, dir)) {
      dir = nextDir;
    }

    const head = snake[0];
    let nx = head.x + dir.x;
    let ny = head.y + dir.y;
    const now = performance.now();
    // Wrap upgrade no longer spawns normally (shop purchase only)
    // Expire upgrade on board
    if (wrapUpgrade && now > wrapUpgradeExpiry) {
      wrapUpgrade = null;
    }

    // Wall collision
    let didWrapTeleport = false;
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
      if (isWrapActive()) {
        if (nx < 0) nx = cols - 1; else if (nx >= cols) nx = 0;
        if (ny < 0) ny = rows - 1; else if (ny >= rows) ny = 0;
        didWrapTeleport = true;
      } else {
        return gameOver();
      }
    }

    // Self collision (check against body)
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === nx && snake[i].y === ny) {
        return gameOver();
      }
    }

    // Determine if eating or picking upgrade this tick
    const willEat = (nx === food.x && ny === food.y);
    const willPickWrap = wrapUpgrade && nx === wrapUpgrade.x && ny === wrapUpgrade.y;

    // Movement: keep per-segment images permanent and aligned
    if (willEat) {
      // Grow: add a new segment at the tail, assign a new image
      const tail = snake[snake.length - 1];
      snake.push({ x: tail.x, y: tail.y });
      segmentSprites.push(randomSnakeImg());
    }
    // Shift positions from tail to head
    for (let i = snake.length - 1; i > 0; i--) {
      snake[i] = { x: snake[i - 1].x, y: snake[i - 1].y };
    }
    // Place new head
    snake[0] = { x: nx, y: ny };

    // Job: Edge Runner earnings (coins and score)
    if (currentJob === 'edge' && isEdgeCell(nx, ny)) {
      const tier = getEdgeRunTier(edgeNearStreak);
      // Points: half again (from previous 10 -> 5), still respect multiplier
      scoreFloat += 5 * mult;
      // Money per tile now 7
      moneyFloat += 7;
      updateScore();
      updateMoney();
      const popupColor = tier.hue != null ? `hsl(${tier.hue} 90% 70%)` : '#f1fa8c';
      addPopupAtCell(nx, ny, '+7', popupColor);
      const nrm = getEdgeNormal(nx, ny);
      const hue = tier.hue != null ? tier.hue : 55;
      spawnEdgeGlowAtCell(nx, ny, nrm.x, nrm.y, hue, 10);
    }

    // Edge interview counting
    if (interview && interview.type === 'edge' && isEdgeCell(nx, ny)) {
      interview.count += 1;
      updateInterviewBanner();
      if (interview.count >= interview.target) {
        finishInterview(true);
      }
    }

    // Edge-run streak for multiplier and trail (edge tiles only)
    if (currentJob === 'edge') {
      if (isEdgeCell(nx, ny)) {
        edgeNearStreak += 1;
        const tier = getEdgeRunTier(edgeNearStreak);
        if (tier.gain > 0) boostMultiplier(tier.gain);
        if (tier.hue != null) spawnEdgeGlowAtCell(nx, ny, dir.x, dir.y, tier.hue, 6);
        updateEdgeTierBadge(tier);
        updateEdgeStreakBadge(edgeNearStreak, tier);
      } else {
        edgeNearStreak = 0;
        updateEdgeTierBadge({ gain: 0, hue: null });
        updateEdgeStreakBadge(0, { gain: 0, hue: null });
      }
    } else {
      edgeNearStreak = 0;
      updateEdgeTierBadge({ gain: 0, hue: null });
      updateEdgeStreakBadge(0, { gain: 0, hue: null });
    }

    // Food scoring effects
    if (willEat) {
      const earned = POINTS.food + foodBonusPoints;
      addPoints(earned);
      boostMultiplier(BOOST.eat);
      addPopupAtCell(nx, ny, `+${earned}`, '#50fa7b');
      food = spawnFood();
      // Optional: increase speed slightly
      stepMs = Math.max(60, stepMs - 1); // caps at ~16.6/s
    }

    // Wrap upgrade pickup after move
    if (willPickWrap) {
      wrapActiveUntil = performance.now() + WRAP_DURATION_MS;
      addPoints(POINTS.wrapPickup);
      boostMultiplier(BOOST.wrapPickup);
      addPopupAtCell(nx, ny, `WRAP +${POINTS.wrapPickup}`, '#bd93f9');
      wrapUpgrade = null;
    }
    if (didWrapTeleport) {
      addPoints(POINTS.wrapTeleport);
      boostMultiplier(BOOST.wrapTeleport);
      addPopupAtCell(nx, ny, `+${POINTS.wrapTeleport}`, '#f1fa8c');
    }
  }

  function isEdgeCell(x, y) {
    return x === 0 || y === 0 || x === cols - 1 || y === rows - 1;
  }
  function isNearEdgeCell(x, y) {
    return x === 1 || y === 1 || x === cols - 2 || y === rows - 2;
  }
  function getEdgeRunTier(streak) {
    // Returns { gain, hue } for streak-based visuals and multiplier boost
    // Double thresholds and halve gains
    if (streak >= 40) {
      return { gain: 0.125, hue: 210 }; // Blue trail, biggest boost
    }
    if (streak >= 20) {
      return { gain: 0.075, hue: 0 }; // Red trail, medium boost
    }
    if (streak > 10) {
      // 11..20: interpolate hue from yellow(55) to orange-red(15)
      const t = Math.min(1, Math.max(0, (streak - 11) / 9));
      const hue = Math.round(55 + (15 - 55) * t);
      return { gain: 0.05, hue };
    }
    return { gain: 0, hue: null };
  }

  function updateEdgeTierBadge(tier) {
    const sb = scoreboardEl;
    if (!sb) return;
    const isTier3 = tier.hue === 210;
    const isTier2 = tier.hue === 0;
    const isTier1 = tier.hue != null && !isTier2 && !isTier3;
    sb.classList.toggle('edge1', isTier1);
    sb.classList.toggle('edge2', isTier2);
    sb.classList.toggle('edge3', isTier3);
    if (tier.hue == null) {
      sb.classList.remove('edge1', 'edge2', 'edge3');
    }
  }

  // High-octane edge streak counter UI
  function ensureEdgeStreakEl() {
    let el = document.getElementById('edge-streak');
    if (!el) {
      el = document.createElement('div');
      el.id = 'edge-streak';
      el.className = 'edge-streak';
      document.body.appendChild(el);
    }
    return el;
  }
  function updateEdgeStreakBadge(count, tier) {
    const el = ensureEdgeStreakEl();
    if (currentJob !== 'edge' || count <= 0) {
      el.classList.add('hidden');
      el.textContent = '';
      return;
    }
    el.classList.remove('hidden');
    const label = count >= 40 ? 'INSANE' : count >= 20 ? 'WILD' : count >= 10 ? 'HOT' : 'WARM';
    el.textContent = `EDGE STREAK ${count} • ${label}`;
    if (tier && tier.hue != null) {
      el.style.setProperty('--edge-streak-color', `hsl(${tier.hue} 90% 65%)`);
    } else {
      el.style.removeProperty('--edge-streak-color');
    }
    // Small pop on increments
    el.classList.remove('pop');
    // Force reflow for restarting animation
    void el.offsetWidth;
    el.classList.add('pop');
  }
  function getEdgeNormal(x, y) {
    if (x === 0) return { x: -1, y: 0 };
    if (x === cols - 1) return { x: 1, y: 0 };
    if (y === 0) return { x: 0, y: -1 };
    if (y === rows - 1) return { x: 0, y: 1 };
    return { x: 0, y: 0 };
  }

  // Rendering
  function draw() {
    // Background image or solid
    if (bgImage && bgImageReady) {
      drawBackgroundCover(bgImage);
      // darken overlay for contrast
      ctx.fillStyle = 'rgba(14,17,22,0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Grid within board area
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 1; c < COLS; c++) {
      const x = originX + Math.floor(c * tile) + 0.5;
      ctx.moveTo(x, originY);
      ctx.lineTo(x, originY + boardH);
    }
    for (let r = 1; r < ROWS; r++) {
      const y = originY + Math.floor(r * tile) + 0.5;
      ctx.moveTo(originX, y);
      ctx.lineTo(originX + boardW, y);
    }
    ctx.stroke();

    // Draw wrap upgrade on board
    if (wrapUpgrade && !permWrap) {
      drawUpgrade(wrapUpgrade.x, wrapUpgrade.y);
    }

    // Visual cue when wrap is active: glowing board border
    if (isWrapActive()) {
      ctx.save();
      ctx.strokeStyle = 'rgba(189,147,249,0.9)';
      ctx.lineWidth = 3;
      ctx.strokeRect(originX + 1.5, originY + 1.5, boardW - 3, boardH - 3);
      ctx.restore();
    }

    // Food (Yow Mill Mug or Crop)
    if (foodImg && isReady(foodImg)) {
      drawSprite(foodImg, food.x, food.y, 2);
    } else {
      drawCell(food.x, food.y, colors.food, 4);
    }

    // Snake body rendered as images
    for (let i = snake.length - 1; i >= 0; i--) {
      const s = snake[i];
      const img = segmentSprites[i];
      if (img && isReady(img)) {
        const pad = i === 0 ? 2 : 3;
        drawSprite(img, s.x, s.y, pad);
      } else {
        // Fallback colored cells until images are ready
        if (i === 0) drawCell(s.x, s.y, colors.snakeHead, 2);
        else drawCell(s.x, s.y, colors.snake, 3);
      }
    }
    // Edge glow particles
    drawEdgeParticles();
    // Score popups
    drawPopups();
  }

  function drawBackgroundCover(img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function drawCell(cx, cy, color, inset = 0) {
    const x = originX + cx * tile + inset;
    const y = originY + cy * tile + inset;
    const size = tile - inset * 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
  }

  function drawSprite(img, cx, cy, padding = 0) {
    const x = originX + cx * tile + padding;
    const y = originY + cy * tile + padding;
    const size = tile - padding * 2;
    // cover-fit crop to square: center-crop the image
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const srcSize = Math.min(iw, ih);
    const sx = (iw - srcSize) / 2;
    const sy = (ih - srcSize) / 2;
    ctx.drawImage(img, sx, sy, srcSize, srcSize, x, y, size, size);
  }

  function drawUpgrade(cx, cy) {
    // Portal-like diamond
    const pad = Math.max(2, Math.floor(tile * 0.15));
    const x = originX + cx * tile + pad;
    const y = originY + cy * tile + pad;
    const s = tile - pad * 2;
    const cxp = x + s / 2, cyp = y + s / 2;
    ctx.save();
    ctx.fillStyle = '#bd93f9';
    ctx.beginPath();
    ctx.moveTo(cxp, y);
    ctx.lineTo(x + s, cyp);
    ctx.lineTo(cxp, y + s);
    ctx.lineTo(x, cyp);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Edge glow particle system
  const edgeParticles = [];
  function spawnEdgeGlowAtCell(cx, cy, nx = 0, ny = 0, hueOverride = 55, count = 10) {
    const baseCount = count;
    const centerX = originX + cx * tile + tile / 2;
    const centerY = originY + cy * tile + tile / 2;
    for (let i = 0; i < baseCount; i++) {
      const angJitter = (Math.random() - 0.5) * Math.PI / 2; // +/-45deg
      const baseAng = Math.atan2(ny, nx) || (Math.random() * Math.PI * 2);
      const ang = baseAng + angJitter;
      const speed = (tile * (0.8 + Math.random() * 0.6)); // px/s
      const life = 400 + Math.random() * 300; // ms
      const r0 = Math.random() * (tile * 0.15);
      const px = centerX + Math.cos(ang) * r0;
      const py = centerY + Math.sin(ang) * r0;
      edgeParticles.push({
        x: px, y: py,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        born: performance.now(), ttl: life,
        size: Math.max(2, Math.floor(tile * 0.12 + Math.random() * tile * 0.08)),
        hue: hueOverride,
      });
    }
  }
  function updateEdgeParticles(ts) {
    const dt = Math.min(100, ts - (lastParticleTs || ts));
    lastParticleTs = ts;
    if (!edgeParticles.length) return;
    for (let i = edgeParticles.length - 1; i >= 0; i--) {
      const p = edgeParticles[i];
      const age = ts - p.born;
      if (age >= p.ttl) { edgeParticles.splice(i, 1); continue; }
      const t = dt / 1000;
      // Integrate with slight drag
      p.vx *= 0.98; p.vy *= 0.98;
      p.x += p.vx * t;
      p.y += p.vy * t;
    }
  }
  function drawEdgeParticles() {
    if (!edgeParticles.length) return;
    ctx.save();
    for (let i = 0; i < edgeParticles.length; i++) {
      const p = edgeParticles[i];
      const age = performance.now() - p.born;
      const a = 1 - (age / p.ttl);
      const rad = p.size * (0.7 + 0.6 * (1 - a));
      ctx.globalAlpha = Math.max(0, a * 0.9);
      ctx.fillStyle = `hsl(${p.hue} 90% 70%)`;
      ctx.shadowColor = 'rgba(241,250,140,0.6)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Popup system for score events
  const popups = [];
  function addPopup(text, px, py, color = '#ffffff') {
    popups.push({ text, x: px, y: py, color, born: performance.now(), ttl: 1000 });
  }
  function addPopupAtCell(cx, cy, text, color) {
    const px = originX + cx * tile + tile / 2;
    const py = originY + cy * tile + tile / 2;
    addPopup(text, px, py, color);
  }
  function addPopupAtPx(px, py, text, color) { addPopup(text, px, py, color); }
  function addPopupAtElement(el, text, color) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    addPopup(text, r.left + r.width / 2, r.top + r.height / 2, color);
  }
  function drawPopups() {
    const now = performance.now();
    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      const t = (now - p.born) / p.ttl;
      if (t >= 1) { popups.splice(i, 1); continue; }
      const alpha = 1 - t;
      const dy = -Math.pow(t, 0.5) * Math.max(20, tile);
      const fs = Math.max(12, Math.floor(tile * 0.8));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color || '#ffffff';
      ctx.font = `700 ${fs}px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // soft outline for readability
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 8;
      ctx.fillText(p.text, p.x, p.y + dy);
      ctx.restore();
    }
  }

  // Image cache utilities
  const imageCache = new Map();
  function getImage(path) {
    if (!imageCache.has(path)) {
      const img = new Image();
      img.onload = () => { img._ready = true; };
      img.onerror = () => { img._ready = false; };
      img.src = path;
      imageCache.set(path, img);
    }
    return imageCache.get(path);
  }
  function isReady(img) { return !!img && !!img._ready; }

  function isWrapActive() { return permWrap || performance.now() < wrapActiveUntil; }

  function spawnWrapUpgrade() {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    let x, y, tries = 0;
    do {
      x = Math.floor(Math.random() * cols);
      y = Math.floor(Math.random() * rows);
      tries++;
      if (tries > 200) break; // safety
    } while (
      occupied.has(`${x},${y}`) ||
      (food && x === food.x && y === food.y)
    );
    wrapUpgrade = { x, y };
    wrapUpgradeExpiry = performance.now() + WRAP_UPGRADE_TTL_MS;
  }

  // Random pools
  function flattenExceptScenes() {
    const out = [];
    for (const [k, arr] of Object.entries(BACKGROUNDS)) {
      if (k === 'Scenes') continue;
      out.push(...arr);
    }
    return out;
  }
  const SNAKE_IMAGES = flattenExceptScenes();
  function randomSnakeImg() {
    const path = SNAKE_IMAGES[Math.floor(Math.random() * SNAKE_IMAGES.length)];
    return getImage(path);
  }
  const FOOD_CHOICES = [
    'assets/images/yow_mill/Yow_Mill_Mug.png',
    'assets/images/yow_mill/A_man_named_Yow_Mill_-_Crop.png',
  ];
  function randomFoodPath() {
    return FOOD_CHOICES[Math.floor(Math.random() * FOOD_CHOICES.length)];
  }

  // Kick off
  loadUpgrades();
  renderShopUpgrades();
  renderShopFun();
  renderShopJobs();
  setShopTab('up');
  // Indicator needs a tick for layout to settle
  requestAnimationFrame(updateTabIndicator);
  resizeCanvas();
  initGame();
  requestAnimationFrame(loop);
})();
