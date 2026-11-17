import { expect, test } from 'bun:test';
import { Emitter } from '../src/emitter';

test('calls listeners in registration order with the arguments', () => {
  const e = new Emitter();
  const seen: string[] = [];
  e.on('x', (a, b) => seen.push(`1:${a}${b}`));
  e.on('x', (a, b) => seen.push(`2:${a}${b}`));
  expect(e.emit('x', 'p', 'q')).toBe(true);
  expect(seen).toEqual(['1:pq', '2:pq']);
});
test('emit returns false when nobody listens', () => expect(new Emitter().emit('nope')).toBe(false));
test('once runs a single time', () => {
  const e = new Emitter();
  let n = 0;
  e.once('x', () => n++);
  e.emit('x');
  e.emit('x');
  expect(n).toBe(1);
});
test('off removes a listener, including one registered with once', () => {
  const e = new Emitter();
  let n = 0;
  const f = () => n++;
  e.on('x', f);
  e.off('x', f);
  e.once('x', f);
  e.off('x', f);
  expect(e.emit('x')).toBe(false);
  expect(n).toBe(0);
});
test('a listener removed during emit still runs for that emit; one added during emit does not', () => {
  const e = new Emitter();
  const seen: string[] = [];
  const b = () => seen.push('b');
  e.on('x', () => {
    seen.push('a');
    e.off('x', b);
    e.on('x', () => seen.push('late'));
  });
  e.on('x', b);
  e.emit('x');
  expect(seen).toEqual(['a', 'b']);
  seen.length = 0;
  e.emit('x');
  expect(seen).toEqual(['a', 'late']);
});
test('on, once and off are chainable', () => {
  const e = new Emitter();
  expect(e.on('x', () => {}).once('y', () => {}).off('x', () => {})).toBe(e);
});
