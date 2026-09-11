export const SEASONS = Object.freeze({
  spring: { name: 'Spring', japanese: '春', caption: 'A fleeting world in bloom.', foliage: '#edb1bc', accent: '#cf7b83', ground: '#899b77', water: '#77aaa3', particle: '#f4ccd2' },
  summer: { name: 'Summer', japanese: '夏', caption: 'Follow the light through the leaves.', foliage: '#527956', accent: '#527956', ground: '#6d8c63', water: '#5b9c97', particle: '#b9d297' },
  autumn: { name: 'Autumn', japanese: '秋', caption: 'Every leaf, a little flame.', foliage: '#ce764f', accent: '#b76340', ground: '#9a916b', water: '#829c92', particle: '#df9754' },
  winter: { name: 'Winter', japanese: '冬', caption: 'The quiet poetry of snow.', foliage: '#e5e9e4', accent: '#6d8f9b', ground: '#bcc9c2', water: '#8daeb7', particle: '#ffffff' },
});
export const DESTINATIONS = Object.freeze({
  fuji: { name: 'Mount Fuji', japanese: '富士山', region: 'Yamanashi · Shizuoka', label: 'The sacred mountain', number: '01', coordinates: '35.3606° N / 138.7274° E', description: 'A snow-capped silhouette. A lake without a ripple. Find a moment of stillness at Japan’s most iconic mountain.' },
  kyoto: { name: 'Kyoto', japanese: '京都', region: 'Kansai region', label: 'Echoes of old Japan', number: '02', coordinates: '35.0116° N / 135.7681° E', description: 'Vermilion gates, layered temple roofs, and a thousand shades of green. Wander into the timeless heart of Japan.' },
  arashiyama: { name: 'Arashiyama', japanese: '嵐山', region: 'Western Kyoto', label: 'Among the whispering trees', number: '03', coordinates: '35.0170° N / 135.6710° E', description: 'Step beneath a canopy of bamboo. Light filters through the grove, and the outside world gently falls away.' },
});
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
export function nextDestination(current, direction = 1) {
  const keys = Object.keys(DESTINATIONS);
  const index = keys.indexOf(current);
  if (index < 0 || !Number.isInteger(direction)) throw new RangeError('Invalid destination or direction');
  return keys[((index + direction) % keys.length + keys.length) % keys.length];
}
// Deterministic scenery: the same landscape appears on every visit.
export function seededRandom(seed = 27) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
