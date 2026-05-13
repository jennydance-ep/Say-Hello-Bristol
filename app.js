    const places = PLACES;

    const mapContainer  = document.getElementById('map-container');
    const card          = document.getElementById('card');
    const cardName      = document.getElementById('card-name');
    const cardIpa       = document.getElementById('card-ipa');
    const cardTeaching  = document.getElementById('card-teaching');
    const cardExtra     = document.getElementById('card-extra');
    const labelTeaching = document.getElementById('label-teaching');
    const labelExtra    = document.getElementById('label-extra');
    const cardAudio     = document.getElementById('card-audio');
    const btnListen     = document.getElementById('btn-listen');
    const btnRecord     = document.getElementById('btn-record');
    const btnStopRec    = document.getElementById('btn-stop-rec');
    const btnPlayback   = document.getElementById('btn-playback');
    const btnRerecord   = document.getElementById('btn-rerecord');

    let activePin  = null;
    let modelAudio = null;  // HTMLAudioElement for the model pronunciation
    let recorder   = null;  // MediaRecorder
    let recChunks  = [];
    let recUrl     = null;  // object URL for the user's recording
    let recAudio   = null;  // HTMLAudioElement for playback of recording
    let recStream  = null;  // MediaStream held open during recording

    // ── Audio helpers ───────────────────────────────────────────────────────

    function stopModel() {
      if (modelAudio) { modelAudio.pause(); modelAudio = null; }
      btnListen.classList.remove('active');
      btnListen.textContent = '▶ Listen';
    }

    function stopPlayback() {
      if (recAudio) { recAudio.pause(); recAudio = null; }
      btnPlayback.classList.remove('active');
      btnPlayback.textContent = '▶ My recording';
    }

    function stopStream() {
      if (recStream) { recStream.getTracks().forEach(t => t.stop()); recStream = null; }
    }

    function resetAudio() {
      stopModel();
      stopPlayback();
      stopStream();
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      recorder  = null;
      recChunks = [];
      if (recUrl) { URL.revokeObjectURL(recUrl); recUrl = null; }
      btnRecord.style.display   = '';
      btnStopRec.style.display  = 'none';
      btnPlayback.style.display = 'none';
      btnRerecord.style.display = 'none';
    }

    // ── Card content ────────────────────────────────────────────────────────

    function populateCard(entry, name) {
      cardName.textContent = name;
      cardTeaching.classList.remove('coming-soon');
      resetAudio();

      if (entry) {
        cardIpa.textContent          = entry.ipa;
        cardIpa.style.display        = 'inline-block';
        cardTeaching.textContent     = entry.teachingNote;
        cardExtra.textContent        = entry.extraNote;
        labelTeaching.style.display  = 'block';
        labelExtra.style.display     = 'block';
        if (entry.audio) {
          cardAudio.style.display = '';
          btnListen.dataset.src   = entry.audio;
        } else {
          cardAudio.style.display = 'none';
        }
      } else {
        cardIpa.style.display        = 'none';
        cardTeaching.textContent     = 'Pronunciation guide coming soon.';
        cardTeaching.classList.add('coming-soon');
        cardExtra.textContent        = '';
        labelTeaching.style.display  = 'none';
        labelExtra.style.display     = 'none';
        cardAudio.style.display      = 'none';
      }
    }

    function positionCard(pin) {
      const mapRect = mapContainer.getBoundingClientRect();
      const pinRect = (pin.querySelector('circle') || pin.querySelector('polygon')).getBoundingClientRect();

      const pinX = pinRect.left + pinRect.width  / 2 - mapRect.left;
      const pinY = pinRect.top  + pinRect.height / 2 - mapRect.top;

      const gap   = 16;
      const pad   = 10;
      const cardW = card.offsetWidth;
      const cardH = card.offsetHeight;

      let left = pinX + gap;
      let top  = pinY - cardH / 2;

      if (left + cardW > mapRect.width - pad) left = pinX - cardW - gap;

      top  = Math.max(pad, Math.min(top,  mapRect.height - cardH - pad));
      left = Math.max(pad, left);

      card.style.left = left + 'px';
      card.style.top  = top  + 'px';
    }

    // ── Pin interaction ─────────────────────────────────────────────────────

    // Grey out pins with no completed entry (missing audio, IPA, or teaching note)
    document.querySelectorAll('.pin').forEach(pin => {
      const entry = places.find(p => p.name === pin.dataset.place);
      const complete = entry && entry.audio && entry.ipa && entry.teachingNote;
      if (!complete) pin.style.opacity = '0.4';
    });

    document.querySelectorAll('.pin').forEach(pin => {
      pin.addEventListener('click', () => {
        const name  = pin.dataset.place;
        const entry = places.find(p => p.name === name);

        if (activePin) activePin.classList.remove('active');
        activePin = pin;
        pin.classList.add('active');

        populateCard(entry, name);

        card.style.visibility = 'hidden';
        card.style.display    = 'block';
        positionCard(pin);
        card.classList.add('visible');
        card.style.display    = '';
        card.style.visibility = '';
      });
    });

    document.getElementById('card-close').addEventListener('click', () => {
      card.classList.remove('visible');
      resetAudio();
      if (activePin) { activePin.classList.remove('active'); activePin = null; }
    });

    mapContainer.addEventListener('click', e => {
      if (e.target === mapContainer || e.target.tagName === 'svg' ||
          e.target.closest('rect') === mapContainer.querySelector('rect')) {
        card.classList.remove('visible');
        resetAudio();
        if (activePin) { activePin.classList.remove('active'); activePin = null; }
      }
    });

    // ── Audio button events ─────────────────────────────────────────────────

    btnListen.addEventListener('click', () => {
      if (modelAudio && !modelAudio.paused) { stopModel(); return; }
      stopPlayback();
      const src = btnListen.dataset.src;
      if (!src) return;
      modelAudio = new Audio(src);
      modelAudio.play().catch(() => {});
      btnListen.classList.add('active');
      btnListen.textContent = '■ Playing…';
      modelAudio.onended = stopModel;
    });

    btnRecord.addEventListener('click', async () => {
      stopModel();
      stopPlayback();
      try {
        recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recChunks = [];
        const opts = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : {};
        recorder  = new MediaRecorder(recStream, opts);
        recorder.ondataavailable = e => { if (e.data.size > 0) recChunks.push(e.data); };
        recorder.onstop = () => {
          stopStream();
          if (recUrl) URL.revokeObjectURL(recUrl);
          recUrl = URL.createObjectURL(new Blob(recChunks, { type: recorder.mimeType || 'audio/webm' }));
          btnStopRec.style.display  = 'none';
          btnPlayback.style.display = '';
          btnRerecord.style.display = '';
        };
        recorder.start();
        btnRecord.style.display  = 'none';
        btnStopRec.style.display = '';
      } catch (_) {
        stopStream();
      }
    });

    btnStopRec.addEventListener('click', () => {
      if (recorder && recorder.state === 'recording') recorder.stop();
    });

    btnPlayback.addEventListener('click', () => {
      if (recAudio && !recAudio.paused) { stopPlayback(); return; }
      stopModel();
      if (!recUrl) return;
      recAudio = new Audio(recUrl);
      recAudio.play().catch(() => {});
      btnPlayback.classList.add('active');
      btnPlayback.textContent = '■ Playing…';
      recAudio.onended = stopPlayback;
    });

    btnRerecord.addEventListener('click', () => {
      stopModel();
      stopPlayback();
      if (recUrl) { URL.revokeObjectURL(recUrl); recUrl = null; }
      btnRecord.style.display   = '';
      btnStopRec.style.display  = 'none';
      btnPlayback.style.display = 'none';
      btnRerecord.style.display = 'none';
    });

    // ── Mobile pin layout ───────────────────────────────────────────────────────
    // On mobile, switches the SVG to an 800×960 viewBox (fills the 5:6
    // container exactly), shifts the River Avon to y≈480 (vertical centre),
    // and applies a translate(0, delta) to every pin so northern pins cluster
    // in the upper half and southern pins in the lower half.
    // Desktop positions are completely unchanged.
    const MOBILE_PIN_DELTAS = {
      // Northern — upper half (above river at y≈480)
      'Bristol Parkway':        17,
      'Gloucester Road':        18,
      'Redland':                 0,
      'The Downs':               7,
      'Cotham':                 29,
      'Portishead':             37,
      'Clifton':                72,
      'Stokes Croft':           92,
      'Cabot Circus':          103,
      'Hotwells':               82,
      'Clevedon':              -35,
      'Bath':                  135,
      // Southern — lower half (below river)
      'The Harbourside':       176,
      'Bristol Temple Meads':  208,
      'Ashton Gate':           158,
      'Ashton Court':          253,
      'The River Avon':        323,
      'Bedminster':            292,
      'Totterdown':            330,
      'Weston-super-Mare':     320,
      'Bristol Airport':       338,
    };

    function applyMobileLayout() {
      const isMobile   = window.innerWidth <= 768;
      const mapSvg    = document.querySelector('#map-container svg');
      const riverPath = document.getElementById('river-avon-path');

      if (isMobile) {
        mapSvg.setAttribute('viewBox', '0 0 800 960');
        riverPath.setAttribute('transform', 'translate(0,115)');
        document.querySelectorAll('.pin').forEach(pin => {
          const delta = MOBILE_PIN_DELTAS[pin.dataset.place];
          if (delta !== undefined) pin.setAttribute('transform', `translate(0,${delta})`);
        });
      } else {
        mapSvg.setAttribute('viewBox', '0 0 800 600');
        riverPath.removeAttribute('transform');
        document.querySelectorAll('.pin').forEach(pin => pin.removeAttribute('transform'));
      }
    }

    requestAnimationFrame(applyMobileLayout);
    setTimeout(applyMobileLayout, 300);
    window.addEventListener('resize', applyMobileLayout);

    // Warm up mic permission once on page load so the browser prompt never interrupts recording
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(stream => stream.getTracks().forEach(t => t.stop()))
      .catch(() => {});

    // ── Onboarding popup ────────────────────────────────────────────────────
    const obOverlay = document.getElementById('onboarding-overlay');

    if (!localStorage.getItem('shb_onboarding_seen')) {
      obOverlay.style.display = 'flex';
    }

    document.getElementById('btn-lets-go').addEventListener('click', () => {
      localStorage.setItem('shb_onboarding_seen', '1');
      obOverlay.style.display = 'none';
    });
