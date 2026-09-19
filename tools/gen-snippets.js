// Генерирует app/src/main/assets/snippets.json из index.html,
// чтобы нативный виджет показывал те же «Коды дня», что и приложение.
// Запуск: node tools/gen-snippets.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'app/src/main/assets/www/index.html'), 'utf8');
const cut = (start) => {
  const i = html.indexOf(start);
  if (i < 0) throw new Error('not found: ' + start);
  const j = html.indexOf('\n];', i);
  return html.slice(i, j + 3);
};
const code = 'const R=String.raw;' + cut('const LANGS=[') + cut('const SNIPS=[') + ';({LANGS,SNIPS})';
const { LANGS, SNIPS } = vm.runInNewContext(code);
const langs = {};
for (const l of LANGS) langs[l.id] = { name: l.name, c: l.c, m: l.m, com: l.com, kw: l.kw.split(' ') };
const out = { langs, snippets: SNIPS.map(s => ({ l: s.l, t: s.t, c: s.c, x: s.x })) };
fs.writeFileSync(path.join(root, 'app/src/main/assets/snippets.json'), JSON.stringify(out, null, 1));
console.log('snippets:', out.snippets.length, 'langs:', Object.keys(langs).length);
