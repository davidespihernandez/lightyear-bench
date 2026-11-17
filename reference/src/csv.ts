export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', inQ = false, started = false;
  const endRow = () => { if (started || row.length) { row.push(cell); rows.push(row); } row = []; cell = ''; started = false; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += c;
    } else if (c === '"') { inQ = true; started = true; }
    else if (c === ',') { row.push(cell); cell = ''; started = true; }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') endRow();
    else { cell += c; started = true; }
  }
  if (inQ) throw new Error('unterminated quote');
  endRow();
  return rows;
}
