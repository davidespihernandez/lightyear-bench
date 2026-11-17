import { expect, test } from 'bun:test';
import { parseCSV } from '../src/csv';

test('splits rows and cells', () => expect(parseCSV('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]));
test('handles CRLF and a trailing newline', () => expect(parseCSV('a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]));
test('quoted cells may contain commas', () => expect(parseCSV('"Smith, John",42')).toEqual([['Smith, John', '42']]));
test('quoted cells may contain newlines', () => expect(parseCSV('"line1\nline2",x')).toEqual([['line1\nline2', 'x']]));
test('doubled quotes are an escaped quote', () => expect(parseCSV('"say ""hi""",ok')).toEqual([['say "hi"', 'ok']]));
test('empty cells are kept', () => expect(parseCSV('a,,c\n,,')).toEqual([['a', '', 'c'], ['', '', '']]));
test('empty input gives no rows, and blank lines are skipped', () => {
  expect(parseCSV('')).toEqual([]);
  expect(parseCSV('a\n\nb')).toEqual([['a'], ['b']]);
});
test('an unterminated quote throws', () => expect(() => parseCSV('"abc,1')).toThrow());
