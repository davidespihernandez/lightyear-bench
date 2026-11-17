import { expect, test } from 'bun:test';
import { renderTemplate } from '../src/template';

test('substitutes variables', () => expect(renderTemplate('Hello {{name}}!', { name: 'Ana' })).toBe('Hello Ana!'));
test('allows whitespace inside the braces', () => expect(renderTemplate('{{  name }}', { name: 'Ana' })).toBe('Ana'));
test('resolves dotted paths', () => expect(renderTemplate('{{user.address.city}}', { user: { address: { city: 'Madrid' } } })).toBe('Madrid'));
test('missing values render as an empty string', () => {
  expect(renderTemplate('[{{nope}}]', {})).toBe('[]');
  expect(renderTemplate('[{{a.b.c}}]', { a: null })).toBe('[]');
});
test('values are HTML-escaped, triple braces are not', () => {
  expect(renderTemplate('{{x}}', { x: '<b>"R&D"</b>' })).toBe('&lt;b&gt;&quot;R&amp;D&quot;&lt;/b&gt;');
  expect(renderTemplate('{{{x}}}', { x: '<b>' })).toBe('<b>');
});
test('numbers and booleans are stringified, 0 and false are kept', () => {
  expect(renderTemplate('{{n}}|{{f}}|{{t}}', { n: 0, f: false, t: true })).toBe('0|false|true');
});
test('text without tags is unchanged, including single braces', () => expect(renderTemplate('a { b } c', {})).toBe('a { b } c'));
