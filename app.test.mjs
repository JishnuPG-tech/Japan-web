import test from 'node:test';
import assert from 'node:assert/strict';
import { SEASONS, DESTINATIONS, clamp, nextDestination, seededRandom } from './world.js';

test('destination navigation wraps in both directions and for large offsets', () => {
  assert.equal(nextDestination('arashiyama'), 'fuji');
  assert.equal(nextDestination('fuji', -1), 'arashiyama');
  assert.equal(nextDestination('fuji', 7), 'kyoto');
  assert.equal(nextDestination('fuji', -7), 'arashiyama');
  assert.throws(() => nextDestination('unknown'), RangeError);
  assert.throws(() => nextDestination('fuji', 0.5), RangeError);
});
test('camera limits retain valid values and constrain out-of-range values', () => {
  assert.equal(clamp(-10, -1, 1), -1);
  assert.equal(clamp(10, -1, 1), 1);
  assert.equal(clamp(0.4, -1, 1), 0.4);
});
test('all seasonal palettes are valid and include accessible labels', () => {
  assert.equal(Object.keys(SEASONS).length, 4);
  for (const season of Object.values(SEASONS)) {
    assert.ok(season.name && season.japanese && season.caption);
    for (const key of ['foliage', 'accent', 'ground', 'water', 'particle']) {
      assert.match(season[key], /^#[0-9a-f]{6}$/i);
    }
  }
});
test('all destinations have unique display numbers and location information', () => {
  assert.equal(new Set(Object.values(DESTINATIONS).map(place => place.number)).size, 3);
  for (const place of Object.values(DESTINATIONS)) {
    assert.ok(place.name && place.japanese && place.region && place.coordinates && place.description);
  }
});
test('seeded scenery is repeatable and stays within [0, 1)', () => {
  const first = seededRandom(123);
  const second = seededRandom(123);
  for (let index = 0; index < 1000; index++) {
    const value = first();
    assert.equal(value, second());
    assert.ok(value >= 0 && value < 1);
  }
});
