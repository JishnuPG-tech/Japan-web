import { DESTINATIONS, SEASONS, nextDestination } from './world.js';

const landscape = document.querySelector('#landscape');
const stage = document.querySelector('#scene');
const status = document.querySelector('#scene-status');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const state = { destination: 'fuji', season: 'spring', night: false, paused: preference.matches };
let world;
let sceneFailed = false;
const seasonButtons = [...document.querySelectorAll('button[data-season]')];
const destinationButtons = [...document.querySelectorAll('button[data-destination]')];
const motionButton = document.querySelector('#motion-toggle');
const lightButton = document.querySelector('#light-toggle');
const resetButton = document.querySelector('#reset-view');

function syncMotion() {
  document.body.classList.toggle('motion-paused', state.paused);
  motionButton.setAttribute('aria-pressed', String(state.paused));
  motionButton.setAttribute('aria-label', state.paused ? 'Resume animation' : 'Pause animation');
  motionButton.title = state.paused ? 'Resume animation' : 'Pause animation';
  motionButton.firstElementChild.textContent = state.paused ? '▷' : 'Ⅱ';
  world?.setPaused(state.paused);
}
function setSeason(key) {
  if (!Object.hasOwn(SEASONS, key)) return;
  state.season = key;
  document.body.dataset.season = key;
  document.documentElement.style.setProperty('--accent', SEASONS[key].accent);
  document.querySelector('#season-caption').textContent = SEASONS[key].caption;
  seasonButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.season === key)));
  world?.setSeason(key);
}
function setDestination(key, scroll = false) {
  if (!Object.hasOwn(DESTINATIONS, key)) return;
  state.destination = key;
  const place = DESTINATIONS[key];
  landscape.dataset.destination = key;
  document.querySelector('#location-name').textContent = place.name;
  document.querySelector('#location-japanese').textContent = place.japanese;
  document.querySelector('#location-region').textContent = place.region.toUpperCase();
  document.querySelector('#location-number').textContent = place.number;
  document.querySelector('#coordinates').textContent = place.coordinates;
  document.querySelector('#destination-description').textContent = place.description;
  stage.setAttribute('aria-label', sceneFailed ? 'Illustrated Japanese landscape; interactive 3D is unavailable' : `Interactive 3D landscape of ${place.name}`);
  destinationButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.destination === key)));
  world?.setDestination(key);
  if (scroll) {
    landscape.scrollIntoView({ behavior: state.paused ? 'instant' : 'smooth', block: 'center' });
    stage.focus({ preventScroll: true });
  }
}
seasonButtons.forEach(button => button.addEventListener('click', () => setSeason(button.dataset.season)));
destinationButtons.forEach(button => button.addEventListener('click', () => setDestination(button.dataset.destination, true)));
lightButton.addEventListener('click', () => {
  state.night = !state.night;
  landscape.classList.toggle('is-night', state.night);
  lightButton.setAttribute('aria-pressed', String(state.night));
  lightButton.setAttribute('aria-label', state.night ? 'Switch to daylight' : 'Switch to moonlight');
  lightButton.firstElementChild.textContent = state.night ? '☀' : '☾';
  world?.setNight(state.night);
});
motionButton.addEventListener('click', () => { state.paused = !state.paused; syncMotion(); });
preference.addEventListener('change', event => { state.paused = event.matches; syncMotion(); });
resetButton.addEventListener('click', () => world?.resetView());
stage.addEventListener('keydown', event => {
  if (event.key === '[' || event.key === ']') {
    event.preventDefault();
    setDestination(nextDestination(state.destination, event.key === ']' ? 1 : -1));
  }
});
function showFallback(message) {
  sceneFailed = true;
  landscape.classList.remove('is-ready');
  status.textContent = message;
  resetButton.disabled = true;
  document.querySelector('#scene-help').textContent = 'Illustrated preview · 3D requires WebGL and access to jsDelivr';
  stage.setAttribute('aria-label', 'Illustrated Japanese landscape; interactive 3D is unavailable');
}
syncMotion();
const loadingTimeout = setTimeout(() => {
  if (!world && !sceneFailed) status.textContent = 'Loading 3D — enjoy the illustrated preview';
}, 8000);
try {
  const { createWorld } = await import('./scene.js');
  world = createWorld(stage, state, () => showFallback('3D paused by your browser — reload to retry'));
  if (!sceneFailed) {
    landscape.classList.add('is-ready');
    status.textContent = 'A LITTLE WORLD, WAITING FOR YOU';
    resetButton.disabled = false;
  }
} catch (error) {
  console.warn('The 3D scene could not be initialized.', error);
  showFallback('Illustrated preview · 3D unavailable');
} finally {
  clearTimeout(loadingTimeout);
}
window.addEventListener('pagehide', event => {
  if (!event.persisted) world?.dispose();
});
