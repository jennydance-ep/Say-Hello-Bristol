const places = PLACES;

const mapContainer  = document.getElementById('map-container');
const card          = document.getElementById('card');
const cardBackdrop  = document.getElementById('card-backdrop');
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
const btnFindOnMap    = document.getElementById('btn-find-on-map');
const cardMapRow      = document.getElementById('card-map-row');
const cardLockedBody  = document.getElementById('card-locked-body');

let activeMarker     = null;
let suppressMapClick = false;   // prevents map click from closing a card we just opened
let modelAudio       = null;
let phonemeAudio     = null;
let phonemeSeqId     = 0;
let recorder         = null;
let recChunks        = [];
let recUrl           = null;
let recAudio         = null;
let recStream        = null;
let pinsData             = [];
let rawPinsData          = [];
const markersByName      = {};
const pinMarkersByName   = {};
const pinColorsByName    = {};
const VALID_CODES = { 'BRISTOL2026': 30, 'REFUGEE2026': 30, 'UWE2026': 30, 'UOB2026': 30, 'HARBOURFEST26': 7 };
const UNLOCK_KEY  = 'shb_unlock_expiry';

const FREE_PINS = new Set([
  'Clifton',
  'Gloucester Road',
  'Cabot Circus',
  'The Harbourside',
  'Bristol Temple Meads',
  'The Avon Gorge',
  'The Llandoger Trow',
  'Bristol Beacon',
]);

// ── Edit mode (hidden, ?editmode=true) ─────────────────────────────────────
// Not surfaced anywhere in the UI — only reachable via the URL param, and
// none of its markup/CSS/behaviour is created unless that param is present.
const EDIT_MODE = new URLSearchParams(window.location.search).get('editmode') === 'true';

function initEditMode() {
  const style = document.createElement('style');
  style.textContent = `
    #edit-mode-banner {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 9999;
      background: #E07850;
      color: #fff;
      font-family: Georgia, serif;
      font-size: 0.9rem;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    #edit-mode-save {
      font-family: Georgia, serif;
      font-size: 0.85rem;
      background: #fff;
      color: #E07850;
      border: none;
      border-radius: 4px;
      padding: 6px 14px;
      cursor: pointer;
    }
    #edit-mode-save:hover { background: #f4e9e2; }
  `;
  document.head.appendChild(style);

  const banner = document.createElement('div');
  banner.id = 'edit-mode-banner';

  const label = document.createElement('span');
  label.textContent = 'Edit mode — drag pins to reposition them';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.id = 'edit-mode-save';
  saveBtn.textContent = 'Save positions';
  saveBtn.addEventListener('click', saveEditedPositions);

  banner.appendChild(label);
  banner.appendChild(saveBtn);
  document.body.appendChild(banner);
  document.body.style.marginTop = banner.offsetHeight + 'px';
}

function saveEditedPositions() {
  const blob = new Blob([JSON.stringify(rawPinsData, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'bristol-pins.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function onPinDragEnd(marker, pinData) {
  const { lat, lng } = marker.getLatLng();
  pinData.lat = lat;
  pinData.lng = lng;

  const rawPin = rawPinsData.find(p => p.name === pinData.name);
  if (rawPin) { rawPin.lat = lat; rawPin.lng = lng; }

  marker.bindTooltip(`lat: ${lat.toFixed(4)}, lng: ${lng.toFixed(4)}`, {
    direction: 'top',
    offset: [0, -12],
  }).openTooltip();
  setTimeout(() => marker.closeTooltip(), 2000);
}

let currentCardEntry     = null;
let currentCardName      = '';
let currentCardFromIndex = false;

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
  stopPhonemes();
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

function stopPhonemes() {
  if (phonemeAudio) {
    phonemeAudio.pause();
    phonemeAudio.onended = null;
    phonemeAudio.onerror = null;
    phonemeAudio = null;
  }
  document.querySelectorAll('.ipa-seg.active').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.ipa-pill.playing').forEach(p => p.classList.remove('playing'));
}

// ── Card content ─────────────────────────────────────────────────────────────

// ── Interactive IPA pills — proof of concept for three test entries ───────────

const phonemeAudioCache = {};
function getCachedAudio(path) {
  if (!phonemeAudioCache[path]) {
    const audio = new Audio(path);
    audio.preload = 'auto';
    phonemeAudioCache[path] = audio;
  }
  return phonemeAudioCache[path];
}

// Given a segment's file path, returns [likelyExt, fallbackExt] — the extension
// the file actually uses tried first, then the other supported extension.
function getExtOrder(file) {
  const match = file.match(/\.(mp3|mp4)$/i);
  const realExt = match ? match[1].toLowerCase() : 'mp3';
  const otherExt = realExt === 'mp3' ? 'mp4' : 'mp3';
  return [realExt, otherExt];
}

const IPA_PILLS_DATA = {
  'clifton': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'f', file: 'audio/phonemes/phon_f.mp3' },
      { text: '.', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]}
  ],
  'the-downs': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
      { text: 'aʊ', file: 'audio/phonemes/phon_ow.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
      { text: 'z', file: 'audio/phonemes/phon_z.mp3' },
    ]}
  ],
  'bristol-temple-meads': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: '.', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
    ]},
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
      { text: '.', deco: true },
      { text: 'p', file: 'audio/phonemes/phon_p.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
      { text: 'z', file: 'audio/phonemes/phon_z.mp3' },
    ]}
  ],
  'gloucester-road': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'ɡ', file: 'audio/phonemes/phon_g.mp4' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
      { text: 'ɒ', file: 'audio/phonemes/phon_o_broad.mp3' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: '.', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'əʊ', file: 'audio/phonemes/phon_oh.mp3' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
    ]},
  ],
  'cabot-circus': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 'æ', file: 'audio/phonemes/phon_a_short.mp3' },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: 'ɜː', file: 'audio/phonemes/phon_ur.mp3' },
      { text: '.', deco: true },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
    ]},
  ],
  'the-harbourside': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'h', file: 'audio/phonemes/phon_h.mp3' },
      { text: 'ɑː', file: 'audio/phonemes/phon_ah.mp3' },
      { text: '.', deco: true },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: '.', deco: true },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: 'aɪ', file: 'audio/phonemes/phon_ai.mp3' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
    ]},
  ],
  'the-avon-gorge': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
    ]},
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'eɪ', file: 'audio/phonemes/phon_ei.mp3' },
      { text: '.', deco: true },
      { text: 'v', file: 'audio/phonemes/phon_v.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'ɡ', file: 'audio/phonemes/phon_g.mp4' },
      { text: 'ɔː', file: 'audio/phonemes/phon_or.mp4' },
      { text: 'dʒ', file: 'audio/phonemes/phon_j.mp3' },
    ]},
  ],
  'the-llandoger-trow': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
      { text: 'æ', file: 'audio/phonemes/phon_a_short.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
      { text: '.', deco: true },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
      { text: 'ɒ', file: 'audio/phonemes/phon_o_broad.mp3' },
      { text: '.', deco: true },
      { text: 'ɡ', file: 'audio/phonemes/phon_g.mp4' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'aʊ', file: 'audio/phonemes/phon_ow.mp3' },
    ]},
  ],
  'bristol-beacon': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: '.', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
      { text: '.', deco: true },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
  ],
  'm-shed': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
    ]},
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'ʃ', file: 'audio/phonemes/phon_sh.mp3' },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
    ]},
  ],
  'we-the-curious': [
    { segments: [
      { text: 'w', file: 'audio/phonemes/phon_w.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
    ]},
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 'j', file: 'audio/phonemes/phon_y.mp3' },
      { text: 'ʊə', file: 'audio/phonemes/phon_u_schwa.mp3' },
      { text: '.', deco: true },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
    ]},
  ],
  'the-arnolfini': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
    ]},
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'ɑː', file: 'audio/phonemes/phon_ah.mp3' },
      { text: '.', deco: true },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
      { text: 'ɒ', file: 'audio/phonemes/phon_o_broad.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
      { text: 'ˈ', deco: true },
      { text: 'f', file: 'audio/phonemes/phon_f.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
      { text: '.', deco: true },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
    ]},
  ],
  'the-wills-memorial-building': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'w', file: 'audio/phonemes/phon_w.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
      { text: 'z', file: 'audio/phonemes/phon_z.mp3' },
    ]},
    { segments: [
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'ˈ', deco: true },
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
      { text: 'ɔː', file: 'audio/phonemes/phon_or.mp4' },
      { text: '.', deco: true },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
    ]},
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
      { text: '.', deco: true },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'ŋ', file: 'audio/phonemes/phon_ng.mp3' },
    ]},
  ],
  'bath': [
    { segments: [
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'ɑː', file: 'audio/phonemes/phon_ah.mp3' },
      { text: 'θ', file: 'audio/phonemes/phon_th.mp4' },
    ]},
  ],
  'cheltenham-road': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'tʃ', file: 'audio/phonemes/phon_ch.mp4' },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: '.', deco: true },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'əʊ', file: 'audio/phonemes/phon_oh.mp3' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
    ]},
  ],
  'uwe': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'j', file: 'audio/phonemes/phon_y.mp3' },
      { text: 'uː', file: 'audio/phonemes/phon_u_long.mp3' },
      { text: '.', deco: true },
      { text: 'w', file: 'audio/phonemes/phon_w.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
    ]},
  ],
  'leigh-woods': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'w', file: 'audio/phonemes/phon_w.mp3' },
      { text: 'ʊ', file: 'audio/phonemes/phon_u_short.mp3' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
      { text: 'z', file: 'audio/phonemes/phon_z.mp3' },
    ]},
  ],
  'the-university-of-bristol': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'j', file: 'audio/phonemes/phon_y.mp3' },
      { text: 'uː', file: 'audio/phonemes/phon_u_long.mp3' },
      { text: '.', deco: true },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'ˈ', deco: true },
      { text: 'v', file: 'audio/phonemes/phon_v.mp3' },
      { text: 'ɜː', file: 'audio/phonemes/phon_ur.mp3' },
      { text: '.', deco: true },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: '.', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
    ]},
    { segments: [
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'v', file: 'audio/phonemes/phon_v.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: '.', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
    ]},
  ],
  'southville': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: 'aʊ', file: 'audio/phonemes/phon_ow.mp3' },
      { text: 'θ', file: 'audio/phonemes/phon_th.mp4' },
      { text: '.', deco: true },
      { text: 'v', file: 'audio/phonemes/phon_v.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
    ]},
  ],
  'bristol-museum-and-art-gallery': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: '.', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
    ]},
    { segments: [
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
      { text: 'j', file: 'audio/phonemes/phon_y.mp3' },
      { text: 'uː', file: 'audio/phonemes/phon_u_long.mp3' },
      { text: 'ˌ', deco: true },
      { text: 'z', file: 'audio/phonemes/phon_z.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
    ]},
    { segments: [
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'ɑː', file: 'audio/phonemes/phon_ah.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
    ]},
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'ɡ', file: 'audio/phonemes/phon_g.mp4' },
      { text: 'æ', file: 'audio/phonemes/phon_a_short.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
    ]},
  ],
  'portishead': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'p', file: 'audio/phonemes/phon_p.mp3' },
      { text: 'ɔː', file: 'audio/phonemes/phon_or.mp4' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: '.', deco: true },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: '.', deco: true },
      { text: 'h', file: 'audio/phonemes/phon_h.mp3' },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
    ]},
  ],
  'king-street': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'ŋ', file: 'audio/phonemes/phon_ng.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
    ]},
  ],
  'ashton-gate': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'æ', file: 'audio/phonemes/phon_a_short.mp3' },
      { text: 'ʃ', file: 'audio/phonemes/phon_sh.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'ɡ', file: 'audio/phonemes/phon_g.mp4' },
      { text: 'eɪ', file: 'audio/phonemes/phon_ei.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
    ]},
  ],
  'the-avon-gorge-hotel': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'eɪ', file: 'audio/phonemes/phon_ei.mp3' },
      { text: '.', deco: true },
      { text: 'v', file: 'audio/phonemes/phon_v.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
    { segments: [
      { text: 'ɡ', file: 'audio/phonemes/phon_g.mp4' },
      { text: 'ɔː', file: 'audio/phonemes/phon_or.mp4' },
      { text: 'dʒ', file: 'audio/phonemes/phon_j.mp3' },
    ]},
    { segments: [
      { text: 'h', file: 'audio/phonemes/phon_h.mp3' },
      { text: 'əʊ', file: 'audio/phonemes/phon_oh.mp3' },
      { text: 'ˈ', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
    ]},
  ],
  'the-coronation-tap': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 'ɒ', file: 'audio/phonemes/phon_o_broad.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'ˈ', deco: true },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
      { text: 'eɪ', file: 'audio/phonemes/phon_ei.mp3' },
      { text: 'ʃ', file: 'audio/phonemes/phon_sh.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'æ', file: 'audio/phonemes/phon_a_short.mp3' },
      { text: 'p', file: 'audio/phonemes/phon_p.mp3' },
    ]},
  ],
  'the-mall': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
      { text: 'ɔː', file: 'audio/phonemes/phon_or.mp4' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
    ]},
  ],
  'watershed': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'w', file: 'audio/phonemes/phon_w.mp3' },
      { text: 'ɔː', file: 'audio/phonemes/phon_or.mp4' },
      { text: '.', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: '.', deco: true },
      { text: 'ʃ', file: 'audio/phonemes/phon_sh.mp3' },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
    ]},
  ],
  'bedminster': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
      { text: '.', deco: true },
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
      { text: '.', deco: true },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
  ],
  'redland': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
      { text: '.', deco: true },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
    ]},
  ],
  'totterdown': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'ɒ', file: 'audio/phonemes/phon_o_broad.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: '.', deco: true },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
      { text: 'aʊ', file: 'audio/phonemes/phon_ow.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
  ],
  'cotham': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 'ɒ', file: 'audio/phonemes/phon_o_broad.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
    ]},
  ],
  'bishopston': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'ʃ', file: 'audio/phonemes/phon_sh.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'p', file: 'audio/phonemes/phon_p.mp3' },
      { text: '.', deco: true },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
  ],
  'park-street': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'p', file: 'audio/phonemes/phon_p.mp3' },
      { text: 'ɑː', file: 'audio/phonemes/phon_ah.mp3' },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
    ]},
  ],
  'the-rummer': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'ʌ', file: 'audio/phonemes/phon_uh.mp3' },
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
  ],
  'stokes-croft': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'əʊ', file: 'audio/phonemes/phon_oh.mp3' },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'ɒ', file: 'audio/phonemes/phon_o_broad.mp3' },
      { text: 'f', file: 'audio/phonemes/phon_f.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
    ]},
  ],
  'whiteladies-road': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'w', file: 'audio/phonemes/phon_w.mp3' },
      { text: 'aɪ', file: 'audio/phonemes/phon_ai.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: '.', deco: true },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
      { text: 'eɪ', file: 'audio/phonemes/phon_ei.mp3' },
      { text: '.', deco: true },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
      { text: 'iː', file: 'audio/phonemes/phon_ee.mp3' },
      { text: 'z', file: 'audio/phonemes/phon_z.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'əʊ', file: 'audio/phonemes/phon_oh.mp3' },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
    ]},
  ],
  'christmas-steps': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: '.', deco: true },
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 'p', file: 'audio/phonemes/phon_p.mp3' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
    ]},
  ],
  'ashton-court': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'æ', file: 'audio/phonemes/phon_a_short.mp3' },
      { text: 'ʃ', file: 'audio/phonemes/phon_sh.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 'ɔː', file: 'audio/phonemes/phon_or.mp4' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
    ]},
  ],
  'the-river-avon': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'v', file: 'audio/phonemes/phon_v.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'eɪ', file: 'audio/phonemes/phon_ei.mp3' },
      { text: '.', deco: true },
      { text: 'v', file: 'audio/phonemes/phon_v.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
  ],
  'brandon-hill': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'æ', file: 'audio/phonemes/phon_a_short.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
      { text: '.', deco: true },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'h', file: 'audio/phonemes/phon_h.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
    ]},
  ],
  'clifton-suspension-bridge': [
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'k', file: 'audio/phonemes/phon_k.mp3' },
      { text: 'l', file: 'audio/phonemes/phon_l.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'f', file: 'audio/phonemes/phon_f.mp3' },
      { text: '.', deco: true },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
    { segments: [
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'ˈ', deco: true },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: 'p', file: 'audio/phonemes/phon_p.mp3' },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
      { text: 'ʃ', file: 'audio/phonemes/phon_sh.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'dʒ', file: 'audio/phonemes/phon_j.mp3' },
    ]},
  ],
  'ss-great-britain': [
    { segments: [
      { text: 'ˌ', deco: true },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
      { text: '.', deco: true },
      { text: 'e', file: 'audio/phonemes/phon_e.mp4' },
      { text: 's', file: 'audio/phonemes/phon_s.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'ɡ', file: 'audio/phonemes/phon_g.mp4' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'eɪ', file: 'audio/phonemes/phon_ei.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'b', file: 'audio/phonemes/phon_b.mp3' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 't', file: 'audio/phonemes/phon_t.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: 'n', file: 'audio/phonemes/phon_n.mp3' },
    ]},
  ],
  'the-hippodrome': [
    { segments: [
      { text: 'ð', file: 'audio/phonemes/phon_th_voiced.mp3' },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
    ]},
    { segments: [
      { text: 'ˈ', deco: true },
      { text: 'h', file: 'audio/phonemes/phon_h.mp3' },
      { text: 'ɪ', file: 'audio/phonemes/phon_i.mp3' },
      { text: 'p', file: 'audio/phonemes/phon_p.mp3' },
      { text: '.', deco: true },
      { text: 'ə', file: 'audio/phonemes/phon_schwa.mp3' },
      { text: '.', deco: true },
      { text: 'd', file: 'audio/phonemes/phon_d.mp4' },
      { text: 'r', file: 'audio/phonemes/phon_r.mp3' },
      { text: 'əʊ', file: 'audio/phonemes/phon_oh.mp3' },
      { text: 'm', file: 'audio/phonemes/phon_m.mp4' },
    ]},
  ],
};

function populateCard(entry, name, fromIndex = false) {
  currentCardEntry     = entry;
  currentCardName      = name;

  if (isUnlocked() && !localStorage.getItem('shb_feedback_shown')) {
    const n = parseInt(localStorage.getItem('shb_pins_since_unlock') || '0', 10) + 1;
    localStorage.setItem('shb_pins_since_unlock', String(n));
    if (n === 5) {
      showFeedbackPopup();
    }
  }

  currentCardFromIndex = fromIndex;

  if (typeof gtag === 'function') {
    gtag('event', 'card_open', {
      pin_name: name,
      source: fromIndex ? 'index' : 'map'
    });
  }

  cardName.textContent = name;
  cardTeaching.classList.remove('coming-soon');
  resetAudio();
  cardIpa.innerHTML = '';
  cardIpa.classList.remove('has-pills');
  cardMapRow.style.display = fromIndex ? '' : 'none';

  if (!hasAccess(name)) {
    cardIpa.style.display        = 'none';
    labelTeaching.style.display  = 'none';
    cardTeaching.textContent     = '';
    labelExtra.style.display     = 'none';
    cardExtra.textContent        = '';
    cardAudio.style.display      = 'none';
    cardLockedBody.style.display = '';
    return;
  }

  cardLockedBody.style.display = 'none';

  if (entry) {
    if (IPA_PILLS_DATA[entry.id]) {
      renderIpaPills(entry);
    } else {
      cardIpa.textContent          = entry.ipa;
      cardIpa.style.display        = 'inline-block';
    }
    cardTeaching.textContent     = entry.teachingNote;
    cardExtra.textContent        = entry.extraNote;
    labelTeaching.style.display  = 'block';
    labelExtra.style.display     = 'block';
    if (entry.audio) {
      cardAudio.style.display  = '';
      btnListen.dataset.src    = entry.audio;
    } else {
      cardAudio.style.display  = 'none';
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

function renderIpaPills(entry) {
  const words = IPA_PILLS_DATA[entry.id];
  cardIpa.classList.add('has-pills');
  cardIpa.style.display = 'block';

  const container = document.createElement('div');
  container.className = 'ipa-pills-container';

  words.forEach(word => {
    const pill = document.createElement('button');
    pill.className = 'ipa-pill';
    pill.type = 'button';

    const segEls = [];
    word.segments.forEach(seg => {
      const span = document.createElement('span');
      span.textContent = seg.text;
      if (seg.deco) {
        span.className = 'ipa-deco';
      } else {
        span.className = 'ipa-seg';
        segEls.push({ el: span, file: seg.file });
      }
      pill.appendChild(span);
    });

    segEls.forEach(({ file }) => {
      const base = file.replace(/\.(mp3|mp4)$/i, '');
      const [realExt, otherExt] = getExtOrder(file);
      getCachedAudio(`${base}.${realExt}`);
      getCachedAudio(`${base}.${otherExt}`);
    });

    pill.addEventListener('click', () => playPill(segEls, pill));
    container.appendChild(pill);
  });

  cardIpa.appendChild(container);
}

function playPill(segEls, pillEl) {
  stopPhonemes();
  pillEl.classList.add('playing');
  const seqId = ++phonemeSeqId;

  function playSegment(index) {
    if (index >= segEls.length) {
      pillEl.classList.remove('playing');
      phonemeAudio = null;
      return;
    }

    const { el, file } = segEls[index];
    const base = file.replace(/\.(mp3|mp4)$/i, '');
    const [realExt, otherExt] = getExtOrder(file);

    segEls.forEach(s => s.el.classList.remove('active'));
    el.classList.add('active');

    function advance() {
      el.classList.remove('active');
      setTimeout(() => playSegment(index + 1), 0);
    }

    tryExtension(base, [realExt, otherExt], 0, advance);
  }

  // Attempt to play <base>.<realExt> first (the extension the segment's file actually uses);
  // on error, fall back to the other extension.
  function tryExtension(base, exts, extIndex, advance) {
    if (extIndex >= exts.length) {
      console.warn('[IPA] all extensions failed for:', base);
      advance();
      return;
    }

    const path = `${base}.${exts[extIndex]}`;
    console.log('[IPA] attempting:', path);
    const audio = getCachedAudio(path);
    phonemeAudio = audio;
    let settled = false;

    function onFail(err) {
      if (settled) return;
      settled = true;
      console.warn('[IPA] failed:', path, err);
      // Bail if this sequence is no longer the active one (superseded by a
      // newer playPill() call, even if it shares this same cached audio object)
      if (seqId !== phonemeSeqId) return;
      tryExtension(base, exts, extIndex + 1, advance);
    }

    function onSuccess() {
      if (settled) return;
      settled = true;
      console.log('[IPA] succeeded:', path);
      if (seqId !== phonemeSeqId) return;
      advance();
    }

    audio.onended = onSuccess;
    audio.onerror = (e) => onFail(e);
    audio.currentTime = 0;
    audio.play()
      .then(() => console.log('[IPA] playing:', path))
      .catch(err => onFail(err));
  }

  playSegment(0);
}

function positionCard(latlng) {
  const point   = leafletMap.latLngToContainerPoint(latlng);
  const mapRect = mapContainer.getBoundingClientRect();

  const pinX = mapRect.left + point.x;
  const pinY = mapRect.top  + point.y;

  const gap   = 16;
  const pad   = 10;
  const cardW = card.offsetWidth;
  const cardH = card.offsetHeight;

  let left = pinX + gap;
  let top  = pinY - cardH / 2;

  const vpW = window.innerWidth;
  const vpH = window.innerHeight;

  if (left + cardW > vpW - pad) left = pinX - cardW - gap;
  top  = Math.max(pad, Math.min(top, vpH - cardH - pad));
  left = Math.max(pad, left);

  card.style.left      = left + 'px';
  card.style.top       = top  + 'px';
  card.style.transform = '';
}

function showCardCentered() {
  card.style.left      = '50%';
  card.style.top       = '50%';
  card.style.transform = 'translate(-50%, -50%)';
}

// ── Map ───────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  'Districts & Neighbourhoods':    '#4CAF7D',
  'Landmarks & Destinations':      '#2E8B8B',
  'Streets & Roads':               '#D4922A',
  'River & Geography':             '#3A7BC8',
  'Transport & Surrounding Towns': '#7952A3',
  'Music & Arts':                  '#E8C135',
  'Pubs':                          '#E07850',
};

const leafletMap = L.map('map').setView([51.4525, -2.5995], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(leafletMap);

window.addEventListener('resize', () => leafletMap.invalidateSize());

function closeCard() {
  card.classList.remove('visible');
  cardBackdrop.classList.remove('visible');
  resetAudio();
  if (activeMarker) {
    activeMarker.getElement()?.classList.remove('pin-icon--active');
    activeMarker = null;
  }
}

// When clicking the map background, close the card — but skip if a marker
// click just fired (they share the same synchronous event dispatch).
leafletMap.on('click', () => {
  if (suppressMapClick) return;
  closeCard();
});

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Pins whose coordinates are within this many degrees of each other (in both
// lat and lng) are considered overlapping — their lozenge labels would sit on
// top of one another at any zoom level, since marker positions are fixed in
// lat/lng rather than screen pixels.
const PIN_OVERLAP_THRESHOLD  = 0.001;
// Cap on how far a pin may be nudged from its true location — kept small so
// pins separate just enough to stop label overlap without drifting away
// from their real geographic position.
const PIN_OVERLAP_MAX_SPREAD = 0.0002;
const PIN_OVERLAP_DIRECTIONS = 8;

// Nudges pins apart (in place) so overlapping pins don't sit on top of each
// other. Each colliding pin is tried at up to PIN_OVERLAP_DIRECTIONS points
// around a fixed circle of radius PIN_OVERLAP_MAX_SPREAD centred on its true
// location — the radius never grows beyond that cap.
function spreadOverlappingPins(pins) {
  const placed = [];

  pins.forEach(pin => {
    const originalLat = pin.lat;
    const originalLng = pin.lng;
    let lat = originalLat;
    let lng = originalLng;

    const overlapsPlaced = (lat, lng) => placed.some(p =>
      Math.abs(p.lat - lat) < PIN_OVERLAP_THRESHOLD &&
      Math.abs(p.lng - lng) < PIN_OVERLAP_THRESHOLD
    );

    if (overlapsPlaced(lat, lng)) {
      for (let attempt = 1; attempt <= PIN_OVERLAP_DIRECTIONS; attempt++) {
        const angle = attempt * (2 * Math.PI / PIN_OVERLAP_DIRECTIONS);
        const candidateLat = originalLat + PIN_OVERLAP_MAX_SPREAD * Math.sin(angle);
        const candidateLng = originalLng + PIN_OVERLAP_MAX_SPREAD * Math.cos(angle);
        lat = candidateLat;
        lng = candidateLng;
        if (!overlapsPlaced(candidateLat, candidateLng)) break;
      }
    }

    pin.lat = lat;
    pin.lng = lng;
    placed.push({ lat, lng });
  });

  return pins;
}

fetch('bristol-pins.json')
  .then(r => r.json())
  .then(pins => {
    rawPinsData = pins.map(p => ({ ...p }));
    pins = spreadOverlappingPins(pins);
    pinsData = pins;
    pins.forEach(pinData => {
      const entry    = places.find(p => p.name === pinData.name);
      const color    = CATEGORY_COLORS[pinData.category] || '#888';
      const locked   = !hasAccess(pinData.name);
      const bg       = hexToRgba(color, locked ? 0.55 : 0.85);

      const icon = L.divIcon({
        html:       `<div class="pin-lozenge${locked ? ' pin-locked' : ''}" style="background-color:${bg};">${pinData.name}</div>`,
        className:  'pin-icon',
        iconSize:   [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([pinData.lat, pinData.lng], { icon, draggable: EDIT_MODE })
        .addTo(leafletMap);

      if (EDIT_MODE) {
        marker.on('dragend', () => onPinDragEnd(marker, pinData));
      }

      function onPinClick() {
        console.log('marker clicked', pinData.name);

        // Suppress the map's click handler for this event cycle so it does
        // not immediately close the card we are about to open.
        suppressMapClick = true;
        setTimeout(() => { suppressMapClick = false; }, 0);

        if (activeMarker && activeMarker !== marker) {
          activeMarker.getElement()?.classList.remove('pin-icon--active');
        }
        activeMarker = marker;
        marker.getElement()?.classList.add('pin-icon--active');

        populateCard(entry, pinData.name);

        card.style.visibility = 'hidden';
        card.style.display    = 'block';
        positionCard([pinData.lat, pinData.lng]);
        card.classList.add('visible');
        card.style.display    = '';
        card.style.visibility = '';
      }

      marker.on('click', onPinClick);
      markersByName[pinData.name] = onPinClick;
      pinMarkersByName[pinData.name] = marker;
      pinColorsByName[pinData.name]  = color;
    });

    if (EDIT_MODE) initEditMode();
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
  if (typeof gtag === 'function') {
    gtag('event', 'audio_play', { pin_name: currentCardName });
  }
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
      if (typeof gtag === 'function') {
        gtag('event', 'recording_made', { pin_name: currentCardName });
      }
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

cardBackdrop.addEventListener('click', closeCard);

// ── Tab navigation ────────────────────────────────────────────────────────────

const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b   => b.classList.toggle('active', b === btn));
    tabPanels.forEach(p => p.classList.toggle('active', p.id === 'tab-' + target));
    closeCard();
    if (target === 'map') leafletMap.invalidateSize();
  });
});

btnFindOnMap.addEventListener('click', () => {
  const name = cardName.textContent;
  const pin  = pinsData.find(p => p.name === name);
  closeCard();
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'map'));
  tabPanels.forEach(p => p.classList.toggle('active', p.id === 'tab-map'));
  leafletMap.invalidateSize();
  if (!pin) return;
  leafletMap.setView([pin.lat, pin.lng], 15, { animate: false });
  const onPinClick = markersByName[pin.name];
  if (onPinClick) setTimeout(onPinClick, 0);
});

// ── Index tab ─────────────────────────────────────────────────────────────────

function buildIndex() {
  const byCategory = {};
  places.forEach(entry => {
    const cat = entry.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(entry);
  });

  const indexList = document.getElementById('index-list');
  const sortedCats = Object.keys(byCategory).sort();

  sortedCats.forEach(cat => {
    const entries = byCategory[cat].slice().sort((a, b) => a.name.localeCompare(b.name));
    const color   = CATEGORY_COLORS[cat] || '#888';

    const section = document.createElement('div');
    section.className = 'index-category';

    const heading = document.createElement('h3');
    heading.className = 'index-category-heading';
    heading.textContent = cat;
    section.appendChild(heading);

    entries.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'index-entry';

      const dot = document.createElement('span');
      dot.className = 'index-dot';
      dot.style.background = color;

      const name = document.createElement('span');
      name.className = 'index-entry-name';
      name.textContent = entry.name;

      const lock = document.createElement('span');
      lock.className = 'index-lock';
      lock.textContent = '🔒';
      lock.style.display = hasAccess(entry.name) ? 'none' : 'inline';

      row.dataset.name = entry.name;
      row.appendChild(dot);
      row.appendChild(name);
      row.appendChild(lock);

      row.addEventListener('click', () => {
        populateCard(entry, entry.name, true);
        showCardCentered();
        cardBackdrop.classList.add('visible');
        card.classList.add('visible');
      });

      section.appendChild(row);
    });

    indexList.appendChild(section);
  });
}

buildIndex();

// ── Onboarding ────────────────────────────────────────────────────────────────

const obOverlay = document.getElementById('onboarding-overlay');

if (!localStorage.getItem('shb_onboarding_seen')) {
  obOverlay.style.display = 'flex';
}

document.getElementById('btn-lets-go').addEventListener('click', () => {
  localStorage.setItem('shb_onboarding_seen', '1');
  obOverlay.style.display = 'none';
});

// ── Tier / unlock ─────────────────────────────────────────────────────────────

function isUnlocked() {
  const exp = localStorage.getItem(UNLOCK_KEY);
  return !!(exp && Date.now() < parseInt(exp, 10));
}

function hasAccess(name) {
  return FREE_PINS.has(name) || isUnlocked();
}

function applyTier() {
  const statusEl = document.getElementById('about-unlock-status');
  if (isUnlocked()) {
    const d = new Date(parseInt(localStorage.getItem(UNLOCK_KEY), 10));
    statusEl.textContent   = 'Access unlocked until ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    statusEl.style.display = '';
  } else {
    statusEl.style.display = 'none';
  }

  document.querySelectorAll('.index-entry').forEach(row => {
    const lockEl = row.querySelector('.index-lock');
    if (lockEl) lockEl.style.display = hasAccess(row.dataset.name) ? 'none' : 'inline';
  });
  Object.keys(pinMarkersByName).forEach(name => {
    const el = pinMarkersByName[name].getElement()?.querySelector('.pin-lozenge');
    if (!el) return;
    const locked = !hasAccess(name);
    el.classList.toggle('pin-locked', locked);
    el.style.backgroundColor = hexToRgba(pinColorsByName[name], locked ? 0.55 : 0.85);
  });
}

const subBackdrop = document.getElementById('subscribe-backdrop');
const subSheet    = document.getElementById('subscribe-sheet');
const subCode     = document.getElementById('subscribe-code');
const subStatus   = document.getElementById('subscribe-status');

function openSubscribeSheet() {
  subBackdrop.classList.add('open');
  subSheet.classList.add('open');
  subCode.value         = '';
  subStatus.textContent = '';
  subStatus.className   = '';
  setTimeout(() => subCode.focus(), 50);
}

function closeSubscribeSheet() {
  subBackdrop.classList.remove('open');
  subSheet.classList.remove('open');
}

document.getElementById('btn-open-subscribe').addEventListener('click', openSubscribeSheet);
document.getElementById('subscribe-close').addEventListener('click', closeSubscribeSheet);
document.getElementById('btn-card-unlock').addEventListener('click', openSubscribeSheet);
subBackdrop.addEventListener('click', closeSubscribeSheet);

document.getElementById('subscribe-submit').addEventListener('click', () => {
  const code = subCode.value.trim().toUpperCase();
  if (VALID_CODES[code]) {
    if (typeof gtag === 'function') {
      gtag('event', 'unlock_code_used', { code: code });
    }
    const expiry = Date.now() + VALID_CODES[code] * 24 * 60 * 60 * 1000;
    localStorage.setItem(UNLOCK_KEY, String(expiry));
    localStorage.setItem('shb_pins_since_unlock', '0');
    subStatus.textContent = `✓ Unlocked for ${VALID_CODES[code]} days.`;
    subStatus.className   = 'subscribe-status--ok';
    applyTier();
    if (card.classList.contains('visible') && currentCardEntry) {
      populateCard(currentCardEntry, currentCardName, currentCardFromIndex);
    }
    setTimeout(closeSubscribeSheet, 1400);
  } else {
    subStatus.textContent = 'Code not recognised — please try again.';
    subStatus.className   = 'subscribe-status--err';
    subCode.select();
  }
});

subCode.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('subscribe-submit').click();
});

applyTier();

// ── Feedback pop-up ───────────────────────────────────────────────────────────

function showFeedbackPopup() {
  localStorage.setItem('shb_feedback_shown', '1');
  document.getElementById('feedback-overlay').style.display = 'flex';
}

let fbRecommend = null;

document.querySelectorAll('.fb-choice').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fb-choice').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    fbRecommend = btn.dataset.value;
    document.getElementById('btn-fb-submit').disabled = false;
  });
});

document.getElementById('feedback-close').addEventListener('click', () => {
  document.getElementById('feedback-overlay').style.display = 'none';
});

document.getElementById('btn-fb-submit').addEventListener('click', () => {
  const featureText = document.getElementById('fb-feature-text').value.trim();
  if (typeof gtag === 'function') {
    gtag('event', 'feedback_submitted', {
      recommend: fbRecommend,
      feature: featureText.slice(0, 100),
    });
  }
  document.getElementById('feedback-overlay').style.display = 'none';
});
