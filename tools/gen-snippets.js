// Генерирует app/src/main/assets/snippets.json для нативного виджета «Код дня»:
// код берётся из app.js, заголовки и объяснения — из словарей i18n/*.js.
// Запуск: node tools/gen-snippets.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const www = path.join(__dirname, '..', 'app/src/main/assets/www');
const app = fs.readFileSync(path.join(www, 'app.js'), 'utf8');
const cut = (start) => {
  const i = app.indexOf(start);
  if (i < 0) throw new Error('not found: ' + start);
  return app.slice(i, app.indexOf('\n];', i) + 3);
};
const { LANGS, SNIPS } = vm.runInNewContext('const R=String.raw;' + cut('const LANGS=[') + cut('const SNIPS=[') + ';({LANGS,SNIPS})');

const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
const codes = fs.readdirSync(path.join(www, 'i18n')).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3));
for (const c of codes) vm.runInContext(fs.readFileSync(path.join(www, 'i18n', c + '.js'), 'utf8'), ctx);
const D = ctx.window.L10N;
const pick = (key) => Object.fromEntries(codes.map(c => [c, D[c][key] ?? D.en[key]]));

const out = {
  langs: Object.fromEntries(LANGS.map(l => [l.id, { name: l.name, c: l.c, m: l.m, com: l.com, kw: l.kw.split(' ') }])),
  labels: pick('widget.label'),
  snippets: SNIPS.map((s, i) => ({ l: s.l, c: s.c, t: pick(`snip.${i}.t`), x: pick(`snip.${i}.x`) })),
};
fs.writeFileSync(path.join(www, '..', 'snippets.json'), JSON.stringify(out));
console.log('snippets:', out.snippets.length, 'languages:', codes.join(', '));
