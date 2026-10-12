export function setupShowroom(base) {
  const $ = selector => document.querySelector(selector);
  const slots = [...document.querySelectorAll('.phone-slot')];
  const heroModels = slots.map(slot => slot.querySelector('model-viewer'));
  const asset = path => new URL(path, new URL(base, location.href)).href;
  const smallScreen = matchMedia('(max-width:600px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
  let motion = !reducedMotion.matches, heroVisible = true, duoVisible = false, duoReady = false;
  let scrollQueued = false, playFrame = 0, playing = false, manualPose = null, runtime, splashDone = false, splashExit;
  let qualityVisible = false, qualityReady = false, qualityRequested = false, qualityManualPose = null;
  const loaded = new Set(), progress = new Map();
  const stage = $('#phone-stage'), duo = $('#duo-model'), story = $('#duo-story');
  const quality = $('#quality-model'), qualityStory = $('#quality-story');
  const startedAt = performance.now();

  // The decoder must be configured before importing the renderer/upgrading elements.
  window.ModelViewerElement = window.ModelViewerElement || {};
  window.ModelViewerElement.meshoptDecoderLocation = asset('vendor/meshopt_decoder.js');
  const loadRuntime = () => runtime ||= import(/* @vite-ignore */ asset('vendor/model-viewer.min.js'));
  if ('serviceWorker' in navigator && window.isSecureContext)
    navigator.serviceWorker.register(asset('showroom-sw.js'), {scope: new URL(base, location.href).pathname}).catch(() => {});

  function dismissSplash(fallback = false) {
    if (splashDone) return;
    // Let the three-part brand entrance finish even on a warm asset cache.
    const remaining = (reducedMotion.matches ? 0 : 1550) - (performance.now() - startedAt);
    if (remaining > 0) {
      clearTimeout(splashExit);
      splashExit = setTimeout(() => dismissSplash(fallback), remaining);
      return;
    }
    splashDone = true;
    clearTimeout(splashLimit);clearTimeout(splashExit);
    $('#scene-splash').hidden = true;
    document.body.classList.add('scene-ready');
    document.body.dataset.sceneLoadMs = String(Math.round(performance.now() - startedAt));
    document.body.dataset.sceneFallback = String(fallback);
  }
  const splashLimit = setTimeout(() => dismissSplash(true), 8500);
  function updateLoading() {
    const required = smallScreen.matches ? [heroModels[1]] : heroModels;
    const total = required.reduce((sum, model) => sum + (progress.get(model) || 0), 0) / required.length;
    $('#splash-fill').style.width = `${Math.round(total * 100)}%`;
    $('#scene-splash').setAttribute('aria-label', `Setting the scene, ${Math.round(total * 100)} percent`);
    if (required.every(model => loaded.has(model))) dismissSplash(required.some(model => model.dataset.failed));
  }
  async function loadHeroModels() {
    try {
      await loadRuntime();
      const required = smallScreen.matches ? [heroModels[1]] : [heroModels[1], heroModels[0], heroModels[2]];
      for (const model of required) {
        if (model.hasAttribute('src')) continue;
        model.addEventListener('progress', event => { progress.set(model, event.detail.totalProgress); updateLoading(); });
        model.addEventListener('load', () => {
          loaded.add(model); progress.set(model, 1); model.closest('.phone-slot').classList.add('loaded');
          updateLoading(); syncMotion();
        });
        model.addEventListener('error', () => {
          model.dataset.failed = 'true'; loaded.add(model); progress.set(model, 1);
          $('#model-status').textContent = 'SHOWROOM CONCEPTS'; updateLoading();
        });
        model.loading = 'eager'; model.reveal = 'auto';
        model.setAttribute('auto-rotate-delay', '0');
        model.setAttribute('rotation-per-second', model.id === 'phone-center' ? '2.5deg' : '3deg');
        model.setAttribute('src', asset(model.dataset.src));
      }
      syncMotion();
    } catch { dismissSplash(true); }
  }
  function syncMotion() {
    const active = motion && heroVisible && !document.hidden;
    stage.classList.toggle('motion-paused', !active);
    heroModels.forEach(model => model.toggleAttribute('auto-rotate', active && getComputedStyle(model.closest('.phone-slot')).display !== 'none'));
    $('#motion-toggle').setAttribute('aria-pressed', String(motion));
    $('#motion-toggle').innerHTML = motion ? 'Pause motion <span>Ⅱ</span>' : 'Play motion <span>▷</span>';
    $('#floating-whatsapp').hidden = heroVisible;
    if (!motion || document.hidden || !duoVisible) stopPlaying();
  }
  function setMotion(value) {
    motion = value && !reducedMotion.matches;
    if (!motion) {
      stage.style.setProperty('--tx', '0deg'); stage.style.setProperty('--ty', '0deg');
      slots.forEach(slot => {slot.style.setProperty('--sx', '0px');slot.style.setProperty('--sy', '0px');});
      setDuoPose(1);
      setQualityPose(1);
    }
    syncMotion();
  }
  const heroObserver = new IntersectionObserver(entries => {heroVisible = entries[0].isIntersecting;syncMotion();}, {threshold:.05});
  heroObserver.observe(stage);
  smallScreen.addEventListener('change', loadHeroModels);
  reducedMotion.addEventListener('change', () => setMotion(!reducedMotion.matches));
  document.addEventListener('visibilitychange', syncMotion);
  stage.addEventListener('pointermove', event => {
    if (!motion || event.pointerType === 'touch') return;
    const bounds = stage.getBoundingClientRect();
    stage.style.setProperty('--tx', `${((event.clientX - bounds.left) / bounds.width - .5) * 5}deg`);
    stage.style.setProperty('--ty', `${-((event.clientY - bounds.top) / bounds.height - .5) * 4}deg`);
  });
  stage.addEventListener('pointerleave', () => {stage.style.setProperty('--tx','0deg');stage.style.setProperty('--ty','0deg');});

  function setQualityPose(value) {
    const p = Math.max(0, Math.min(1, value));
    const step = p < .34 ? 0 : p < .72 ? 1 : 2;
    qualityStory.dataset.progress = p.toFixed(3);
    qualityStory.style.setProperty('--quality-progress', `${p * 100}%`);
    qualityStory.style.setProperty('--quality-tilt', `${-8 + p * 16}deg`);
    document.querySelectorAll('[data-quality-position]').forEach((button,index) => button.setAttribute('aria-pressed', String(index === step)));
    document.querySelectorAll('[data-quality-detail]').forEach((detail,index) => {detail.hidden=index !== step;});
    $('#quality-progress').textContent = `0${step + 1} / 03`;
    if (!qualityReady) return;
    // A full orbit reveals the real supplied model, ending closer to the cameras.
    const eased = p * p * (3 - 2 * p);
    quality.setAttribute('camera-orbit', `${155 + eased * 360}deg ${78 - eased * 8}deg ${105 - eased * 7}%`);
    quality.setAttribute('field-of-view', `${28 - eased * 3}deg`);
  }
  async function loadQuality() {
    if (qualityRequested) return;
    qualityRequested = true;
    try {
      await loadRuntime();
      quality.addEventListener('load', () => {qualityReady=true;qualityStory.classList.add('loaded');setQualityPose(Number(qualityStory.dataset.progress)||0);});
      quality.addEventListener('error', () => {qualityStory.classList.add('preview-fallback');});
      quality.loading = 'eager';
      quality.setAttribute('src', asset(quality.dataset.src));
    } catch { qualityStory.classList.add('preview-fallback'); }
  }
  const qualityObserver = new IntersectionObserver(entries => {
    qualityVisible = entries[0].isIntersecting;
    if (qualityVisible) {loadQuality();updateScroll();} else qualityManualPose=null;
  }, {rootMargin:'450px 0px'});
  qualityObserver.observe(qualityStory);
  document.querySelectorAll('[data-quality-position]').forEach(button => button.addEventListener('click', () => {
    qualityManualPose=Number(button.dataset.qualityPosition);setQualityPose(qualityManualPose);
  }));

  function setDuoPose(value) {
    const p = Math.max(0, Math.min(1, value));
    story.dataset.progress = p.toFixed(3);
    const step = p < .34 ? 0 : p < .72 ? 1 : 2;
    document.querySelectorAll('[data-duo-position]').forEach((button,index) => button.setAttribute('aria-pressed', String(index === step)));
    $('#duo-phase').textContent = ['THE FIRST PERSPECTIVE','A LITTLE MORE POSSIBILITY','THE WHOLE NEW VIEW'][step];
    $('#duo-progress').textContent = `0${step + 1} / 03`;
    story.style.setProperty('--duo-progress', `${p * 100}%`);
    story.style.setProperty('--duo-tilt', `${(p - .5) * -7}deg`);
    if (!duoReady) return;
    duo.pause();
    // The supplied clip folds from open at t=0 to closed at t=2; reverse it to unfold.
    duo.currentTime = (1 - p) * Math.max(0, duo.duration - .001);
    duo.setAttribute('camera-orbit', `${45 - p * 65}deg ${77 - p * 7}deg auto`);
    duo.dataset.animationTime = duo.currentTime.toFixed(3);
  }
  async function loadDuo() {
    if (duo.hasAttribute('src')) return;
    try {
      await loadRuntime();
      duo.addEventListener('load', () => {duoReady = true;duo.animationName = 'open-close';duo.pause();story.classList.add('loaded');$('#duo-play').disabled=false;setDuoPose(Number(story.dataset.progress)||0);});
      duo.addEventListener('error', () => {$('#duo-play').hidden=true;$('#duo-phase').textContent='THE DUO CONCEPT / IMAGE PREVIEW';});
      duo.setAttribute('src', asset(duo.dataset.src));
      duo.loading = 'eager';
    } catch { $('#duo-play').hidden = true; }
  }
  const duoObserver = new IntersectionObserver(entries => {
    duoVisible = entries[0].isIntersecting;
    if (duoVisible) {loadDuo();updateScroll();} else {manualPose=null;stopPlaying();}
  }, {rootMargin:'300px 0px', threshold:0});
  duoObserver.observe(story);
  function stopPlaying() {cancelAnimationFrame(playFrame);playing=false;$('#duo-play').textContent='Play the unfolding ↗';}
  function playUnfolding() {
    if (playing) {manualPose=Number(story.dataset.progress);stopPlaying();return;}
    if (!duoReady) {loadDuo();return;}
    if (!motion) {manualPose=1;setDuoPose(1);return;}
    manualPose=null;
    playing = true;$('#duo-play').textContent='Pause unfolding Ⅱ';
    const start = performance.now();
    const frame = now => {
      if (!playing) return;
      const p = Math.min(1, (now - start) / 2800);setDuoPose(p);
      if (p < 1) playFrame=requestAnimationFrame(frame);else {manualPose=1;stopPlaying();}
    };
    playFrame=requestAnimationFrame(frame);
  }
  $('#duo-play').addEventListener('click', playUnfolding);
  document.querySelectorAll('[data-duo-position]').forEach(button => button.addEventListener('click', () => {stopPlaying();manualPose=Number(button.dataset.duoPosition);setDuoPose(manualPose);}));
  function updateScroll() {
    scrollQueued=false;
    if (motion && heroVisible && !document.hidden) {
      const bounds=stage.getBoundingClientRect(),p=Math.max(0,Math.min(1,-bounds.top/bounds.height));
      slots.forEach((slot,index)=>{slot.style.setProperty('--sx',`${index===0?-p*45:index===2?p*45:0}px`);slot.style.setProperty('--sy',`${p*(index===1?-24:25)}px`);});
    }
    if (duoVisible && !playing && manualPose === null) {
      const bounds=story.getBoundingClientRect();
      const travel=Math.max(1,bounds.height - window.innerHeight);
      setDuoPose(motion ? -bounds.top / travel : 1);
    }
    if (qualityVisible && qualityManualPose === null && !document.hidden) {
      const bounds=qualityStory.getBoundingClientRect();
      setQualityPose(motion ? -bounds.top / Math.max(1,bounds.height - window.innerHeight) : 1);
    }
  }
  // Keep an explicitly selected pose during focus/anchor scrolling; resume scrubbing
  // when the visitor scrolls with the wheel, touch or keyboard.
  const resumeScroll = () => {manualPose=null;qualityManualPose=null;stopPlaying();};
  window.addEventListener('wheel',resumeScroll,{passive:true});
  window.addEventListener('touchmove',resumeScroll,{passive:true});
  window.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))resumeScroll();});
  window.addEventListener('scroll', () => {if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll);}}, {passive:true});
  window.addEventListener('resize', () => {manualPose=null;qualityManualPose=null;syncMotion();updateScroll();});
  setDuoPose(motion ? 0 : 1);setQualityPose(motion ? 0 : 1);loadHeroModels();
  return {toggleMotion: () => setMotion(!motion)};
}
