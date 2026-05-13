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

let activeMarker     = null;
let suppressMapClick = false;   // prevents map click from closing a card we just opened
let modelAudio       = null;
let recorder         = null;
let recChunks        = [];
let recUrl           = null;
let recAudio         = null;
let recStream        = null;

// ── Audio helpers ────────────────────────────────────────────────────────────

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

// ── Card content ─────────────────────────────────────────────────────────────

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

function positionCard(latlng) {
  const point = leafletMap.latLngToContainerPoint(latlng);
  const pinX  = point.x;
  const pinY  = point.y;

  const gap   = 16;
  const pad   = 10;
  const cardW = card.offsetWidth;
  const cardH = card.offsetHeight;

  let left = pinX + gap;
  let top  = pinY - cardH / 2;

  if (left + cardW > mapContainer.offsetWidth  - pad) left = pinX - cardW - gap;
  top  = Math.max(pad, Math.min(top, mapContainer.offsetHeight - cardH - pad));
  left = Math.max(pad, left);

  card.style.left = left + 'px';
  card.style.top  = top  + 'px';
}

// ── Map ───────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  'Districts & Neighbourhoods':    '#E07850',
  'Landmarks & Destinations':      '#2E8B8B',
  'Streets & Roads':               '#D4922A',
  'River & Geography':             '#3A7BC8',
  'Transport & Surrounding Towns': '#7952A3',
};

const leafletMap = L.map('map').setView([51.4545, -2.5879], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(leafletMap);

window.addEventListener('resize', () => leafletMap.invalidateSize());

function closeCard() {
  card.classList.remove('visible');
  resetAudio();
  if (activeMarker) {
    activeMarker.setStyle({
      fillOpacity: activeMarker._shbComplete ? 1 : 0.4,
      weight: 2.5,
    });
    activeMarker = null;
  }
}

// When clicking the map background, close the card — but skip if a marker
// click just fired (they share the same synchronous event dispatch).
leafletMap.on('click', () => {
  if (suppressMapClick) return;
  closeCard();
});

fetch('bristol-pins.json')
  .then(r => r.json())
  .then(pins => {
    pins.forEach(pinData => {
      const entry    = places.find(p => p.name === pinData.name);
      const complete = !!(entry && entry.audio && entry.ipa && entry.teachingNote);
      const color    = CATEGORY_COLORS[pinData.category] || '#888';
      const radius   = pinData.outsideCity ? 7 : 10;

      const marker = L.circleMarker([pinData.lat, pinData.lng], {
        radius,
        fillColor:   color,
        color:       '#fff',
        weight:      2.5,
        opacity:     1,
        fillOpacity: complete ? 1 : 0.4,
      }).addTo(leafletMap);

      marker._shbComplete = complete;

      // Permanent place-name label to the right of each marker
      marker.bindTooltip(pinData.name, {
        permanent:   true,
        direction:   'right',
        offset:      [radius + 2, 0],
        className:   'place-label' + (complete ? '' : ' place-label--dim'),
        interactive: false,
      });

      marker.on('click', e => {
        console.log('marker clicked', pinData.name);

        // Suppress the map's click handler for this event cycle so it does
        // not immediately close the card we are about to open.
        suppressMapClick = true;
        setTimeout(() => { suppressMapClick = false; }, 0);

        if (activeMarker && activeMarker !== marker) {
          activeMarker.setStyle({
            fillOpacity: activeMarker._shbComplete ? 1 : 0.4,
            weight: 2.5,
          });
        }
        activeMarker = marker;
        marker.setStyle({ fillOpacity: complete ? 0.72 : 0.28, weight: 3.5 });

        populateCard(entry, pinData.name);

        card.style.visibility = 'hidden';
        card.style.display    = 'block';
        positionCard([pinData.lat, pinData.lng]);
        card.classList.add('visible');
        card.style.display    = '';
        card.style.visibility = '';
      });
    });
  });

document.getElementById('card-close').addEventListener('click', closeCard);

// ── Audio button events ───────────────────────────────────────────────────────

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

// Warm up mic permission once on page load so the browser prompt never interrupts recording
navigator.mediaDevices?.getUserMedia({ audio: true })
  .then(stream => stream.getTracks().forEach(t => t.stop()))
  .catch(() => {});

// ── Onboarding ────────────────────────────────────────────────────────────────

const obOverlay = document.getElementById('onboarding-overlay');

if (!localStorage.getItem('shb_onboarding_seen')) {
  obOverlay.style.display = 'flex';
}

document.getElementById('btn-lets-go').addEventListener('click', () => {
  localStorage.setItem('shb_onboarding_seen', '1');
  obOverlay.style.display = 'none';
});
