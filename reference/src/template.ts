const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function renderTemplate(template: string, data: Record<string, unknown>): string {
  const get = (path: string) => path.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), data);
  const str = (v: unknown) => (v == null ? '' : String(v));
  return template
    .replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, p) => str(get(p)))
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p) => esc(str(get(p))));
}
