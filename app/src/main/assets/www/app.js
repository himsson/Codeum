'use strict';
/* Codeum — интерфейс. Работает в браузере (веб-превью) и внутри Android-приложения,
   где доступен мост window.CodeumNative (Linux-окружение, PTY, виджет, обновления). */

/* ============ helpers ============ */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const ICONS={
 home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
 folderPlus:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 10.5v6M9 13.5h6"/>',
 filePlus:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 12v6M9 15h6"/>',
 code:'<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>',
 term:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M6 9l3 3-3 3M12 15h5"/>',
 box:'<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 play:'<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
 undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
 sidebar:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9.5 4v16"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 down:'<path d="M6 9l6 6 6-6"/>',
 right:'<path d="M9 6l6 6-6 6"/>',
 back:'<path d="M15 6l-6 6 6 6"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 server:'<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
 download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
 upload:'<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
 check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
 phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
 spark:'<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
 github:'<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
 widget:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/>',
 key:'<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3 21 2M17 6l3 3M14 9l2 2"/>',
 lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
 push:'<path d="M12 19V5M5 12l7-7 7 7"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>'
};
const ic=n=>`<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;
$$('[data-i]').forEach(b=>b.innerHTML=ic(b.dataset.i));
const LOGO_XS='<div class="logo xs"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7l5 5-5 5"/><path d="M13 17h6"/></svg></div>';
const store={get(k,d){try{const v=localStorage.getItem('codeum3.'+k);return v?JSON.parse(v):d}catch{return d}},set(k,v){try{localStorage.setItem('codeum3.'+k,JSON.stringify(v))}catch{}}};
let toastT;function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),2200)}
const base=p=>p.split('/').pop();
const dirOf=p=>{const i=p.lastIndexOf('/');return i<0?'':p.slice(0,i)};
const FIRST_LAUNCH=!store.get('launched',false);store.set('launched',true);
const NV=window.CodeumNative||null, NATIVE=!!NV;

/* ============ языки интерфейса ============ */
const DICT=window.L10N||{};
const UI_LANGS=[['en','gb','English'],['ru','ru','Русский'],['uk','ua','Українська'],['de','de','Deutsch'],['fr','fr','Français'],
  ['it','it','Italiano'],['es','es','Español'],['pt','pt','Português'],['pl','pl','Polski'],['tr','tr','Türkçe']];
const LOCALE={en:'en-GB',ru:'ru-RU',uk:'uk-UA',de:'de-DE',fr:'fr-FR',it:'it-IT',es:'es-ES',pt:'pt-PT',pl:'pl-PL',tr:'tr-TR'};
const LANG_EN_NAME={en:'English',ru:'Russian',uk:'Ukrainian',de:'German',fr:'French',it:'Italian',es:'Spanish',pt:'Portuguese',pl:'Polish',tr:'Turkish'};
let LG='en';
function t(k,v){
  const d=DICT[LG]||{};let s=d[k]!=null?d[k]:(DICT.en&&DICT.en[k]!=null?DICT.en[k]:k);
  if(v)s=s.replace(/\{(\w+)\}/g,(m,x)=>v[x]!=null?v[x]:m);
  return s;
}
function tn(k,n,v){ // множественное число: ключи k.one / k.few / k.many / k.other
  const cat=new Intl.PluralRules(LOCALE[LG]||'en').select(n),d=DICT[LG]||{},en=DICT.en||{};
  const key=d[k+'.'+cat]!=null?k+'.'+cat:d[k+'.other']!=null?k+'.other':en[k+'.'+cat]!=null?k+'.'+cat:k+'.other';
  return t(key,Object.assign({n},v));
}
const flag=(code,cls='')=>`<img class="flag ${cls}" src="flags/${(UI_LANGS.find(x=>x[0]===code)||['','gb'])[1]}.svg" alt="">`;
function detectLang(){const n=(navigator.language||'en').slice(0,2).toLowerCase();return UI_LANGS.some(x=>x[0]===n)?n:'en'}
function applyI18n(){
  document.documentElement.lang=LG;
  $$('[data-t]').forEach(e=>e.textContent=t(e.dataset.t));
  $$('[data-tp]').forEach(e=>e.placeholder=t(e.dataset.tp));
  $$('[data-ta]').forEach(e=>e.setAttribute('aria-label',t(e.dataset.ta)));
  $('#nav').innerHTML=VIEWS.map(([v,k,i])=>`<button data-act="go" data-v="${v}" class="${v===view?'on':''}"><span>${ic(i)}</span>${t(k)}</button>`).join('');
}
const ago=ts=>{const s=(Date.now()-ts)/1000;return s<60?t('time.now'):s<3600?t('time.min',{n:Math.floor(s/60)}):s<86400?t('time.h',{n:Math.floor(s/3600)}):t('time.d',{n:Math.floor(s/86400)})};

/* ============ версия и обновления ============ */
const APP_VERSION='1.0.1';                // версия веб-превью; в приложении версия берётся из APK
const UPDATE_REPO='himsson/codeum';       // репозиторий с релизами

/* ============ языки программирования ============ */
const R=String.raw;
const LANGS=[
 {id:'js',name:'JavaScript',c:'#f0db4f',m:'JS',ver:'ES2024',size:0,ext:'js',file:'main.js',cat:'web',run:'js',com:'//',
  kw:'const let var function return if else for while do of in new class extends import from export default async await try catch finally throw typeof instanceof true false null undefined this switch case break continue yield',
  bi:'console log error document window function return async await Promise fetch JSON parse stringify Math floor random round length push pop map filter reduce forEach includes indexOf slice splice join split setTimeout setInterval addEventListener querySelector Object keys values entries Array String Number',
  tpl:'// JavaScript · Run ▶\nconst fib = n => n < 2 ? n : fib(n - 1) + fib(n - 2);\n\nfor (let i = 0; i < 10; i++) {\n  console.log("fib(" + i + ") =", fib(i));\n}\n'},
 {id:'py',name:'Python',c:'#3776ab',m:'PY',ver:'3.12',size:12,ext:'py',file:'main.py',cat:'general',run:'py',com:'#',
  kw:'def return if elif else for while in not and or import from as class try except finally raise with lambda yield pass break continue True False None global nonlocal is async await',
  bi:'print input len range int str float bool list dict set tuple enumerate zip open sorted reversed sum min max abs round isinstance type self __init__ __name__ __main__ append extend insert pop remove items keys values get split join format lower upper strip replace startswith endswith random math json time os sys',
  tpl:R`# Python · Run ▶
def greet(name):
    return f"Hello, {name}!"

print(greet("world"))
for i in range(1, 6):
    print(i, "->", i ** 2)
`},
 {id:'ts',name:'TypeScript',c:'#3178c6',m:'TS',ver:'5.6',size:38,ext:'ts',file:'main.ts',cat:'web',com:'//',
  kw:'const let var function return if else for while of in new class extends implements interface type enum import from export async await true false null undefined this public private readonly',
  bi:'console log string number boolean any unknown never void Promise Array Record Partial Readonly keyof typeof as length push map filter reduce forEach',
  tpl:R`const greet = (name: string): string => "Hello, " + name + "!";
console.log(greet("TypeScript"));
`},
 {id:'c',name:'C',c:'#5c6bc0',m:'C',ver:'clang 18',size:64,ext:'c',file:'main.c',cat:'system',com:'//',
  kw:'int char float double void return if else for while do struct typedef const unsigned long short static include define sizeof switch case break continue enum',
  bi:'printf scanf puts getchar malloc calloc realloc free memset memcpy strlen strcpy strcmp strcat fopen fclose fprintf fgets main NULL EXIT_SUCCESS stdio stdlib string math',
  tpl:R`#include <stdio.h>

int main(void) {
    for (int i = 1; i <= 5; i++)
        printf("Hello, Codeum! #%d\n", i);
    return 0;
}
`},
 {id:'cpp',name:'C++',c:'#00599c',m:'C++',ver:'clang++ 18',size:72,ext:'cpp',file:'main.cpp',cat:'system',com:'//',
  kw:'int char float double void return if else for while do struct const unsigned long static include define sizeof switch case break continue class public private protected namespace using std template typename auto new delete virtual override nullptr bool true false',
  bi:'std cout cin cerr endl vector string map unordered_map set pair make_pair push_back emplace_back size begin end sort find iostream algorithm memory unique_ptr shared_ptr main',
  tpl:R`#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{3, 1, 4, 1, 5};
    for (auto x : v) std::cout << x << " ";
    std::cout << "\nHello from C++!" << std::endl;
}
`},
 {id:'cs',name:'C#',c:'#9b4f96',m:'C#',ver:'.NET 8',size:140,ext:'cs',file:'Program.cs',cat:'general',com:'//',
  kw:'using namespace class public private static void int string var new return if else for foreach in while bool true false null',
  bi:'Console WriteLine ReadLine Write List Dictionary Linq System Main Length Count Add Remove Contains ToString Parse Math Random async await Task',
  tpl:R`using System;

class Program {
    static void Main() {
        var name = "C#";
        Console.WriteLine($"Hello from {name}!");
    }
}
`},
 {id:'java',name:'Java',c:'#e76f00',m:'JV',ver:'OpenJDK 21',size:180,ext:'java',file:'Main.java',cat:'general',com:'//',
  kw:'public private protected class static void int String new return if else for while boolean true false null import package extends implements final',
  bi:'System out println print Scanner nextLine nextInt ArrayList HashMap List Map length size add get put main Math Integer parseInt toString',
  tpl:R`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
`},
 {id:'kt',name:'Kotlin',c:'#7f52ff',m:'KT',ver:'2.0',size:95,ext:'kt',file:'main.kt',cat:'mobile',com:'//',
  kw:'fun val var class object if else when for while in return is as null true false import package data',
  bi:'println print readLine listOf mutableListOf mapOf mutableMapOf setOf forEach map filter size toInt toString main let apply also',
  tpl:R`fun main() {
    val langs = listOf("Kotlin", "Java", "Go")
    langs.forEach { println("Hello, $it!") }
}
`},
 {id:'go',name:'Go',c:'#00add8',m:'GO',ver:'1.23',size:110,ext:'go',file:'main.go',cat:'system',com:'//',
  kw:'package import func var const type struct interface map chan go defer return if else for range switch case select nil true false',
  bi:'fmt Println Printf Sprintf Errorf make append len cap range main error string int strings strconv Atoi Itoa os time',
  tpl:R`package main

import "fmt"

func main() {
    for i := 1; i <= 3; i++ {
        fmt.Println("Hello, Go!", i)
    }
}
`},
 {id:'rs',name:'Rust',c:'#dea584',m:'RS',ver:'1.81',size:220,ext:'rs',file:'main.rs',cat:'system',com:'//',
  kw:'fn let mut const struct enum impl trait pub use mod match if else for while loop in return Some None Ok Err self Self true false',
  bi:'println print format vec String Vec Option Result Box unwrap expect iter into_iter collect map filter len push main std io',
  tpl:R`fn main() {
    let nums = vec![1, 2, 3, 4, 5];
    let sum: i32 = nums.iter().sum();
    println!("Hello, Rust! sum = {}", sum);
}
`},
 {id:'php',name:'PHP',c:'#777bb4',m:'PHP',ver:'8.3',size:28,ext:'php',file:'index.php',cat:'web',com:'//',
  kw:'echo function return if else foreach as for while class public new true false null array',
  bi:'count strlen explode implode array_map array_filter in_array isset empty print_r var_dump json_encode json_decode str_replace',
  tpl:R`<?php
$name = "PHP";
echo "Hello, $name!\n";
`},
 {id:'rb',name:'Ruby',c:'#cc342d',m:'RB',ver:'3.3',size:32,ext:'rb',file:'main.rb',cat:'web',com:'#',
  kw:'def end if elsif else unless while do puts class module return true false nil require each',
  bi:'puts print gets chomp each map select reject times length size to_s to_i attr_accessor require',
  tpl:R`def greet(name) = "Hello, #{name}!"
puts greet("Ruby")
`},
 {id:'swift',name:'Swift',c:'#f05138',m:'SW',ver:'5.10',size:160,ext:'swift',file:'main.swift',cat:'mobile',com:'//',
  kw:'func let var if else for in while return class struct enum import print true false nil guard',
  bi:'print readLine String Int Double Array Dictionary count append map filter',
  tpl:R`let name = "Swift"
print("Hello, \(name)!")
`},
 {id:'dart',name:'Dart',c:'#0175c2',m:'DT',ver:'3.5',size:90,ext:'dart',file:'main.dart',cat:'mobile',com:'//',
  kw:'void main var final const class return if else for in while print true false null import',
  bi:'print String int double List Map length add forEach map where toString',
  tpl:R`void main() {
  final name = 'Dart';
  print('Hello, $name!');
}
`},
 {id:'lua',name:'Lua',c:'#2c2d72',m:'LUA',ver:'5.4',size:1,ext:'lua',file:'main.lua',cat:'general',com:'--',
  kw:'local function end if then else elseif for in do while return nil true false and or not',
  bi:'print pairs ipairs table insert remove concat string format sub len tostring tonumber math floor random',
  tpl:R`local function greet(name)
  return "Hello, " .. name .. "!"
end
print(greet("Lua"))
`},
 {id:'sh',name:'Bash',c:'#4eaa25',m:'SH',ver:'5.2',size:4,ext:'sh',file:'main.sh',cat:'system',com:'#',
  kw:'echo if then else fi for in do done while case esac function return export local',
  bi:'read printf grep sed awk cut sort uniq head tail wc cat ls mkdir rm cp mv chmod test',
  tpl:R`#!/bin/bash
for i in 1 2 3; do
  echo "Hello, Bash! $i"
done
`}
];
const LANG=Object.fromEntries(LANGS.map(l=>[l.id,l]));
// примерный объём скачивания в Linux-окружении (МБ); Swift и Dart пока не собраны под Alpine
const NSIZE={py:45,ts:60,c:150,cpp:150,cs:420,java:190,kt:260,go:230,rs:380,php:15,rb:25,lua:1,sh:2};
LANG.swift.soon=LANG.dart.soon=true;
if(NATIVE){Object.assign(LANG.c,{ver:'gcc 14'});Object.assign(LANG.cpp,{ver:'g++ 14'})}
const langDesc=L=>t(NATIVE&&['py','c','cpp'].includes(L.id)?'lang.'+L.id+'.descNative':'lang.'+L.id+'.desc');
const sizeOf=L=>NATIVE?(NSIZE[L.id]||0):L.size;
const mb=n=>t('unit.mb',{n});
const LN=id=>LANG[id]||{id:'',name:t('proj.generic'),c:'#6b7389',m:'··',ext:'txt',file:'README.md'};
const tile=(L,cls='')=>L&&L.id?`<div class="tile ltile ${cls}"><img src="icons/${L.id}.svg" alt="${esc(L.name)}"></div>`:`<div class="tile ${cls}" style="--c:#6b7389;--fg:#fff">${ic('file')}</div>`;
const EXT={h:'c',hpp:'cpp',cc:'cpp',mjs:'js',cjs:'js',jsx:'js',tsx:'ts',kts:'kt',bash:'sh'};
const langOf=f=>{const e=base(f).split('.').pop().toLowerCase();return LANG[EXT[e]]||LANGS.find(l=>l.ext===e)||null};
LANGS.forEach(L=>{
  const com=L.com==='#'?'#.*':L.com==='--'?'--.*':R`\/\/.*|\/\*[\s\S]*?\*\/`;
  const str=R`"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'`+(L.id==='js'||L.id==='ts'?"|`(?:\\\\.|[^`\\\\])*`":'');
  L.re=new RegExp(`(${com})|(${str})|\\b(${L.kw.split(' ').join('|')})\\b|\\b(\\d+(?:\\.\\d+)?)\\b|\\b([A-Za-z_]\\w*)(?=\\s*[(!])|\\b([A-Z][A-Za-z0-9_]*)\\b`,'g');
});
function highlight(src,L,nl=true){
  if(!L)return esc(src)+(nl?'\n':'');
  let o='',last=0;
  for(const m of src.matchAll(L.re)){
    o+=esc(src.slice(last,m.index));
    const c=m[1]?'com':m[2]?'str':m[3]?'kw':m[4]?'num':m[5]?'fn':'ty';
    o+=`<span class="${c}">${esc(m[0])}</span>`;last=m.index+m[0].length;
  }
  return o+esc(src.slice(last))+(nl?'\n':'');
}
const TEXT_EXT=/\.(png|jpe?g|gif|webp|ico|bmp|pdf|zip|gz|tar|7z|rar|jar|class|so|dll|exe|bin|woff2?|ttf|otf|eot|mp[34]|mov|avi|wav|ogg|apk|keystore|db|sqlite|lock)$/i;
function guessLang(paths){const cnt={};paths.forEach(p=>{const L=langOf(p);if(L)cnt[L.id]=(cnt[L.id]||0)+1});return Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]||''}

/* ============ «Код дня» (тексты — в i18n: snip.N.t / snip.N.x) ============ */
const SNIPS=[
 {l:'py',c:R`age = 17
if age >= 18:
    print("Welcome!")
else:
    print("Too early")`},
 {l:'js',c:R`for (let i = 1; i <= 5; i++) {
  console.log(i * i);
}`},
 {l:'py',c:R`nums = range(10)
evens = [n * n for n in nums if n % 2 == 0]
print(evens)  # [0, 4, 16, 36, 64]`},
 {l:'js',c:R`const add = (a, b) => a + b;
console.log(add(2, 3)); // 5`},
 {l:'go',c:R`func divmod(a, b int) (int, int) {
    return a / b, a % b
}
q, r := divmod(17, 5) // 3, 2`},
 {l:'rs',c:R`let n = 7;
let kind = match n {
    0 => "zero",
    1..=9 => "digit",
    _ => "big number",
};`},
 {l:'cpp',c:R`std::vector<int> v{4, 8, 15};
int sum = 0;
for (int x : v) sum += x;
// sum == 27`},
 {l:'kt',c:R`val hour = 14
val part = when (hour) {
    in 6..11 -> "morning"
    in 12..17 -> "afternoon"
    else -> "evening"
}`},
 {l:'js',c:R`const prices = [120, 45, 300, 80];
const cheap = prices
  .filter(p => p < 100)
  .map(p => "$" + p);`},
 {l:'py',c:R`user = {"name": "Alex", "level": 3}
user["level"] += 1
print(user["name"], user["level"])`},
 {l:'c',c:R`int x = 5;
int *p = &x;   // address of x
*p = 10;       // change x through p
printf("%d", x); // 10`},
 {l:'cs',c:R`var lang = "C#";
var year = 2000;
Console.WriteLine($"{lang} appeared in {year}");`},
 {l:'py',c:R`try:
    n = int("abc")
except ValueError:
    print("Not a number!")`},
 {l:'js',c:R`const score = 72;
const result = score >= 50 ? "passed" : "failed";`},
 {l:'rs',c:R`let found: Option<i32> = Some(42);
if let Some(v) = found {
    println!("found {v}");
}`},
 {l:'sh',c:R`for f in *.txt; do
  echo "File: $f"
done`},
 {l:'java',c:R`class Cat {
    String name;
    Cat(String n) { name = n; }
}
Cat c = new Cat("Whiskers");`}
];
function wBucket(){const iv=S.settings.wInt;if(iv==='5h'){const len=5*36e5;const b=Math.floor(Date.now()/len);return{b,next:(b+1)*len}}
  const d=new Date();d.setHours(0,0,0,0);const n=new Date(d);n.setDate(n.getDate()+1);return{b:Math.floor(d.getTime()/864e5),next:n.getTime()}}
function snipNow(){const{b}=wBucket(),i=((b*2654435761)>>>0)%SNIPS.length;return Object.assign({i},SNIPS[i])}
function untilNext(){const ms=wBucket().next-Date.now(),h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4);return h?t('time.hm',{h,m}):t('time.m',{m})}
function widgetHTML(small){
  const s=snipNow(),L=LANG[s.l],title=esc(t('snip.'+s.i+'.t'));
  if(small)return`<div class="widget wsmall"><div class="w-top">${LOGO_XS}<div class="w-k">${t('widget.label')}</div></div><div class="w-t">${title}</div><div class="w-lang">${tile(L,'sm')}${L.name}</div></div>`;
  return`<div class="widget"><div class="w-top">${LOGO_XS}<div class="w-k">${t('widget.label')}</div><div class="w-lang">${tile(L,'sm')}${L.name}</div></div>
   <div class="w-t">${title}</div><div class="w-code">${highlight(s.c,L,false)}</div><div class="w-x">${esc(t('snip.'+s.i+'.x'))}</div>
   <div class="w-foot"><span>codeum</span><span>${t('widget.next',{time:untilNext()})}</span></div></div>`;
}

/* ============ темы ============ */
const TH_KEYS='bg panel card line text muted accent accent2 kw str num com fn ty term onacc'.split(' ');
const THEMES={
 midnight:['Midnight','#0e1117 #161b25 #1d2330 #283044 #e7eaf3 #8b93a8 #5b8cff #3ddbc4 #c792ea #b5e08d #ff9e64 #5c6680 #7aa2f7 #ffcb6b #080a0f #ffffff'],
 tokyo:['Tokyo Night','#16161e #1a1b26 #222436 #2f334d #c0caf5 #737aa2 #7aa2f7 #bb9af7 #bb9af7 #9ece6a #ff9e64 #565f89 #7aa2f7 #2ac3de #101014 #16161e'],
 dracula:['Dracula','#1e1f29 #282a36 #313344 #414558 #f8f8f2 #9197b3 #bd93f9 #ff79c6 #ff79c6 #f1fa8c #bd93f9 #6272a4 #50fa7b #8be9fd #16171f #1e1f29'],
 mocha:['Catppuccin','#11111b #1e1e2e #262637 #363a4f #cdd6f4 #9399b2 #cba6f7 #f5c2e7 #cba6f7 #a6e3a1 #fab387 #6c7086 #89b4fa #f9e2af #0b0b12 #11111b'],
 nord:['Nord','#242933 #2e3440 #3b4252 #4c566a #eceff4 #a3acbd #88c0d0 #a3be8c #81a1c1 #a3be8c #b48ead #6b7894 #88c0d0 #8fbcbb #1d2129 #242933'],
 monokai:['Monokai','#1c1d19 #272822 #31322c #3e3f38 #f8f8f2 #a09f93 #a6e22e #66d9ef #f92672 #e6db74 #ae81ff #75715e #a6e22e #66d9ef #141511 #1c1d19'],
 solar:['Solarized','#002b36 #073642 #0b4250 #15535f #e4ecec #93a1a1 #2aa198 #b58900 #859900 #2aa198 #d33682 #5f7a80 #268bd2 #cb4b16 #00212a #002b36'],
 paper:['Paper','#f4f6fa #ffffff #eef1f6 #dfe3ec #1b2030 #697189 #3a6ff7 #0fa38f #8a3ffc #2f8a3b #d0582b #9aa1b3 #1f63d6 #b7791f #1b2030 #ffffff']
};
const themeVars=id=>{const v=THEMES[id][1].split(' ');return Object.fromEntries(TH_KEYS.map((k,i)=>[k,v[i]]))};

/* ============ состояние ============ */
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function mkProject(name,lang){const L=LANG[lang];return{id:uid(),name,lang,files:{[L.file]:L.tpl,'README.md':`# ${name}\n\n${t('tpl.readme',{lang:L.name})}\n`},dirs:[],open:[L.file],updated:Date.now()}}
let S=store.get('state',null);
LG=(S&&S.settings&&S.settings.lang)||detectLang();
if(!S){const a=mkProject('hello-world','js'),b=mkProject('py-playground','py');b.updated-=36e5;
  S={projects:[a,b],cur:{p:a.id,f:'main.js'},installed:[],hosts:[],gh:null,
     ai:{prov:'claude',keys:{},model:{}},
     settings:{theme:'midnight',fs:13,tab:2,lines:true,keys:true,greet:true,wInt:'day'}}}
S.settings.os=S.settings.os||'linux';   // терминал: linux | windows | mac
S.settings.nick=S.settings.nick||'';
S.settings.lang=S.settings.lang||LG;
const save=()=>store.set('state',S);
const NICK=()=>S.settings.nick||'coder';
const OS=()=>S.settings.os||'linux';
const pkgHint=x=>({windows:'winget install ',mac:'brew install ',linux:'sudo apt install '}[OS()]||'pkg install ')+x;
const P=()=>S.projects.find(p=>p.id===S.cur.p)||S.projects[0];

/* ============ навигация ============ */
const VIEWS=[['home','nav.home','home'],['projects','nav.projects','folder'],['editor','nav.code','code'],['term','nav.term','term'],['store','nav.langs','box']];
let view='home';
function show(v){
  view=v;$$('.view').forEach(e=>e.classList.toggle('on',e.id==='v-'+v));
  $$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  const p=P();
  const T={home:['Codeum',''],
    projects:[t('nav.projects'),tn('proj.count',S.projects.length)],
    editor:[p?p.name:t('nav.code'),p?LN(p.lang).name+' · '+tn('files',Object.keys(p.files).length):''],
    term:[t('nav.term'),{windows:'PowerShell',mac:'zsh',linux:'bash'}[OS()]+' · '+(p?p.name:'~')],
    store:[t('nav.langs'),'']}[v];
  $('#hTitle').textContent=T[0];$('#hSub').textContent=T[1];
  const rb=$('#runBtn');rb.hidden=!(v==='editor'&&p);if(p)rb.innerHTML=ic('play')+t('ed.run');
  if(v==='home')renderHome();if(v==='projects')renderProjects();if(v==='store')renderStore();
  if(v==='editor')renderEditor();if(v==='term')termShow();
  $('#app').classList.remove('drawer-on');
  renderUpd();
}

/* ============ главная ============ */
function renderHome(){
  const h=new Date().getHours(),g=t(h<6?'home.night':h<12?'home.morning':h<18?'home.day':'home.evening');
  const p=P(),L=p&&LN(p.lang);
  const recent=[...S.projects].sort((a,b)=>b.updated-a.updated).slice(0,8);
  $('#v-home').innerHTML=`<div class="pad">
   ${S.settings.greet?`<div class="hello"><div class="muted">${g}, ${esc(NICK())} 👋</div><h2>${t('home.question')}</h2></div>`:''}
   ${p?`<div class="hero" data-act="go" data-v="editor"><div class="hero-top">${tile(L,'lg')}<div class="grow"><div class="hero-k">${t('home.continue')}</div><div class="hero-t">${esc(p.name)}</div><div class="hero-s">${esc(S.cur.f?base(S.cur.f):'')} · ${ago(p.updated)}</div></div><div class="hero-go">${ic('play')}</div></div></div>`:''}
   <div class="quick">
    <button class="qa" data-act="new-proj" style="--c:var(--accent)"><span>${ic('plus')}</span>${t('home.qProject')}</button>
    <button class="qa" data-act="open-file" style="--c:var(--accent2)"><span>${ic('upload')}</span>${t('home.qOpen')}</button>
    <button class="qa" data-act="gh-clone" style="--c:#f5a524"><span>${ic('github')}</span>GitHub</button>
    <button class="qa" data-act="host" style="--c:#c084fc"><span>${ic('server')}</span>SSH</button>
   </div>
   <div class="sect-row"><div class="sect">${t('home.recent')}</div><button class="link" data-act="go" data-v="projects">${t('home.all')}</button></div>
   <div class="hscroll">${recent.map(r=>`<button class="pcard" data-act="open-proj" data-id="${r.id}">${tile(LN(r.lang))}<div class="nm">${esc(r.name)}</div><div class="sub">${r.gh?'GitHub · ':''}${ago(r.updated)}</div></button>`).join('')||`<div class="empty" style="flex:1">${t('home.emptyProjects')}</div>`}</div>
   <div class="sect-row"><div class="sect">${t('home.myLangs')}</div><button class="link" data-act="go" data-v="store">${t('home.allLangs')}</button></div>
   <div class="chips">${S.installed.filter(id=>LANG[id]).map(id=>`<div class="chip">${tile(LANG[id],'sm')}${LANG[id].name}</div>`).join('')}<button class="chip add" data-act="go" data-v="store">+ ${t('home.install')}</button></div>
   <div class="sect-row"><div class="sect">${t('home.servers')}</div><button class="link" data-act="host">+ ${t('home.add')}</button></div>
   ${S.hosts.length?S.hosts.map((h,i)=>`<div class="item"><div class="tile" style="--c:#8b5cf6;--fg:#fff">${ic('server')}</div><div class="grow"><div class="nm">${esc(h.name)}</div><div class="sub">${esc(h.user)}@${esc(h.host)}:${esc(h.port)}</div></div><button class="ghost" data-act="host-go" data-i="${i}">${ic('term')}</button><button class="ghost" data-act="host-del" data-i="${i}">${ic('trash')}</button></div>`).join('')
     :`<div class="empty">${t('home.emptyServers')}</div>`}
  </div>`;
}

/* ============ проекты ============ */
let pq='';
function renderProjects(){
  const v=$('#v-projects');
  v.innerHTML=`<div class="pad">
   <div class="actions3">
    <button class="act" data-act="open-file">${ic('file')}${t('proj.openFile')}</button>
    <button class="act" data-act="open-dir">${ic('folder')}${t('proj.openFolder')}</button>
    <button class="act" data-act="gh-clone">${ic('github')}${t('proj.fromGh')}</button>
   </div>
   <label class="search">${ic('search')}<input id="pq" placeholder="${esc(t('proj.search'))}" value="${esc(pq)}"></label>
   <div id="projList"></div>
   <div style="height:70px"></div></div><button class="fab" data-act="new-proj">${ic('plus')}</button>`;
  $('#pq').oninput=e=>{pq=e.target.value;renderProjList()};
  renderProjList();
}
function renderProjList(){
  const list=S.projects.filter(p=>p.name.toLowerCase().includes(pq.toLowerCase())).sort((a,b)=>b.updated-a.updated);
  $('#projList').innerHTML=list.map(p=>`<div class="item" data-act="open-proj" data-id="${p.id}">${tile(LN(p.lang))}<div class="grow"><div class="nm">${esc(p.name)}</div><div class="sub">${p.gh?'⎇ '+esc(p.gh.full):LN(p.lang).name} · ${tn('files',Object.keys(p.files).length)} · ${ago(p.updated)}</div></div><button class="ghost" data-act="del-proj" data-id="${p.id}">${ic('trash')}</button></div>`).join('')||`<div class="empty">${t('common.notFound')}</div>`;
}
let npLang='';
function newProjSheet(){
  const inst=LANGS.filter(L=>S.installed.includes(L.id));
  if(!inst.find(L=>L.id===npLang))npLang=inst[0]?inst[0].id:'';
  openSheet(`${inst.length?'':`<div class="hint"><div class="ico">${ic('search')}</div><div class="grow"><b>${t('np.hintTitle')}</b><small>${t('np.hintText',{n:LANGS.length})}</small></div><button class="btn pri" data-act="go-store">${t('nav.langs')}</button></div>`}
   <h3 style="margin-top:${inst.length?0:10}px">${t('np.title')}</h3><p class="muted">${t('np.sub')}</p>
   <label class="field"><span>${t('np.name')}</span><input id="npName" placeholder="my-app" autocapitalize="off"></label>
   <div class="field"><span>${t('np.lang')}</span>${inst.length?`<div class="lgrid">${inst.map(L=>`<button class="lpick ${L.id===npLang?'on':''}" data-act="np-lang" data-id="${L.id}">${tile(L)}${L.name}</button>`).join('')}</div>`:`<div class="empty">${t('np.none')}</div>`}</div>
   <button class="bigbtn" data-act="np-create" ${inst.length?'':'disabled'}>${t('np.create')}</button>`);
}

/* ============ редактор ============ */
const ta=$('#ta'),hl=$('#hl'),gl=$('#gl');let lineCount=0;const collapsed=new Set();
function ensureCur(p){
  if(!p)return;
  if(!p.files[S.cur.f])S.cur.f=(p.open||[]).find(f=>p.files[f]!=null)||Object.keys(p.files)[0]||'';
  p.open=(p.open||[]).filter(f=>p.files[f]!=null);
  if(S.cur.f&&!p.open.includes(S.cur.f))p.open.push(S.cur.f);
}
function setSaved(ok){$('#stSave').innerHTML=ok?`<i class="dot"></i>${t('ed.saved')}`:`<i class="dot" style="background:var(--num)"></i>${t('ed.modified')}`}
function renderEditor(){
  const p=P();ensureCur(p);
  const empty=!p||!S.cur.f;$('#edEmpty').hidden=!empty;
  if(empty){$('#edEmpty').innerHTML=p?`<div>${t('ed.noFiles')}<br><br><button class="btn pri" data-act="new-file" style="margin:auto">${ic('filePlus')}${t('ed.createFile')}</button></div>`:`<div>${t('ed.noProject')}<br><br><button class="btn pri" data-act="new-proj" style="margin:auto">${ic('plus')}${t('np.title')}</button></div>`;
    $('#tabs').innerHTML='';ta.value='';hl.innerHTML='';renderDrawer();renderKeys();acClear();return}
  $('#tabs').innerHTML=p.open.map(f=>{const L=langOf(f);return`<button class="tab ${f===S.cur.f?'on':''}" data-act="tab" data-f="${esc(f)}" style="--c:${L?L.c:'#6b7389'}"><i></i>${esc(base(f))}<span class="tx" data-act="tab-close" data-f="${esc(f)}">${ic('x')}</span></button>`}).join('');
  if(ta.value!==p.files[S.cur.f])ta.value=p.files[S.cur.f];
  paint();pos();setSaved(true);
  const L=langOf(S.cur.f);$('#stLang').textContent=L?L.name:'Text';$('#stTab').textContent=t('ed.spaces',{n:S.settings.tab});
  renderDrawer();renderKeys();acClear();
  requestAnimationFrame(()=>{const e=$('.tab.on');e&&e.scrollIntoView({inline:'nearest',block:'nearest'})});
}
function paint(){
  hl.innerHTML=highlight(ta.value,langOf(S.cur.f));
  const n=ta.value.split('\n').length;
  if(n!==lineCount){lineCount=n;gl.textContent=Array.from({length:n},(_,i)=>i+1).join('\n')}
  sync();
}
function sync(){hl.style.transform=`translate(${-ta.scrollLeft}px,${-ta.scrollTop}px)`;gl.style.transform=`translateY(${-ta.scrollTop}px)`}
function pos(){const b=ta.value.slice(0,ta.selectionStart).split('\n');$('#stPos').textContent=`Ln ${b.length}, Col ${b[b.length-1].length+1}`}
let saveT;
function onEdit(){
  const p=P();if(!p||!S.cur.f)return;p.files[S.cur.f]=ta.value;p.updated=Date.now();paint();pos();setSaved(false);
  clearTimeout(saveT);saveT=setTimeout(()=>{save();setSaved(true)},400);
  acUpdate();
}
ta.addEventListener('input',onEdit);ta.addEventListener('scroll',sync);
['click','keyup','select'].forEach(e=>ta.addEventListener(e,pos));
ta.addEventListener('click',acUpdate);
function ins(s,back=0){
  ta.focus();
  if(!document.execCommand('insertText',false,s)){ta.setRangeText(s,ta.selectionStart,ta.selectionEnd,'end');onEdit()}
  if(back){const q=ta.selectionStart-back;ta.setSelectionRange(q,q)}
  pos();
}
const TAB=()=>' '.repeat(S.settings.tab);
ta.addEventListener('keydown',e=>{
  if(e.key==='Tab'){e.preventDefault();ins(TAB())}
  else if(e.key==='Enter'){
    e.preventDefault();const s=ta.selectionStart,before=ta.value.slice(0,s),line=before.split('\n').pop(),ind=line.match(/^\s*/)[0];
    const open=/[{(\[:]\s*$/.test(line),close=/^[}\])]/.test(ta.value.slice(s));
    if(open&&close)ins('\n'+ind+TAB()+'\n'+ind,ind.length+1);else ins('\n'+ind+(open?TAB():''));
  }
});

/* клавиши над клавиатурой: стрелки первыми, дальше символы в порядке частоты для языка файла */
const ED_SYMS={
  def:'() {} [] "" ; = : . , < > / + - * ! & | _ # $ \\',
  py:'() : = "" \'\' [] . , # _ {} + - * / % < > ! @',
  js:'() {} ; = . "" \'\' => [] , : < > ! & | + - * / ` $',
  cfam:'{} () ; = "" . , [] < > * & ! : + - / | # \'\'',
  php:'$ ; () {} = "" \'\' . -> [] , ! < > :',
  rb:'() "" \'\' . = | {} [] # @ : , !',
  lua:'() = "" . , [] {} - # : ~ \'\'',
  sh:'$ "" \'\' | > < - / {} [] ; & ~ * . ='
};
const ED_FAMILY={py:'py',js:'js',ts:'js',c:'cfam',cpp:'cfam',cs:'cfam',java:'cfam',kt:'cfam',go:'cfam',rs:'cfam',swift:'cfam',dart:'cfam',php:'php',rb:'rb',lua:'lua',sh:'sh'};
let KEYS=[];
function renderKeys(){
  const L=S.cur.f&&langOf(S.cur.f),syms=ED_SYMS[L?ED_FAMILY[L.id]:'def']||ED_SYMS.def;
  KEYS=[['←','L','arr'],['→','R','arr'],['↑','U','arr'],['↓','D','arr'],['⇥','tab','arr'],
    ...syms.split(' ').map(s=>s.length===2&&'(){}[]""\'\''.includes(s)&&s[0]!==s[1]||s==='""'||s==="''"?[s[0]+' '+s[1],s,'']:[s,'txt',''])];
  $('#keys').innerHTML=KEYS.map((k,i)=>`<button data-k="${i}" class="${k[2]}">${esc(k[0])}</button>`).join('');
}
$('#keys').addEventListener('pointerdown',e=>{
  const b=e.target.closest('button');if(!b)return;e.preventDefault();const[l,a]=KEYS[b.dataset.k];
  if(a==='txt')return ins(l);if(a==='tab')return ins(TAB());
  if(a.length===2){const s=ta.selectionStart,en=ta.selectionEnd,sel=ta.value.slice(s,en);return sel?ins(a[0]+sel+a[1]):ins(a,1)}
  ta.focus();let s=ta.selectionStart;const v=ta.value;
  if(a==='L')s=Math.max(0,s-1);else if(a==='R')s=Math.min(v.length,s+1);
  else{const ls=v.lastIndexOf('\n',s-1)+1,col=s-ls;
    if(a==='U'){if(ls===0)return;const ps=v.lastIndexOf('\n',ls-2)+1;s=Math.min(ps+col,ls-1)}
    else{const ne=v.indexOf('\n',s);if(ne<0)return;const nn=v.indexOf('\n',ne+1);s=Math.min(ne+1+col,nn<0?v.length:nn)}}
  ta.setSelectionRange(s,s);pos();acUpdate();
});

/* автодополнение: ключевые слова, стандартные функции языка и слова из текущего файла */
function acClear(){$('#acBar').innerHTML=''}
function acUpdate(){
  const L=S.cur.f&&langOf(S.cur.f);if(!L){acClear();return}
  const before=ta.value.slice(0,ta.selectionStart),m=before.match(/[A-Za-z_][\w]*$/);
  if(!m||m[0].length<2||ta.selectionStart!==ta.selectionEnd){acClear();return}
  const pre=m[0],low=pre.toLowerCase(),seen=new Set([pre]),out=[];
  const add=(w,src)=>{if(!seen.has(w)&&w.toLowerCase().startsWith(low)){seen.add(w);out.push([w,src])}};
  L.kw.split(' ').forEach(w=>add(w,'kw'));(L.bi||'').split(' ').forEach(w=>add(w,'fn'));
  const words=ta.value.match(/[A-Za-z_]\w{2,}/g)||[];words.forEach(w=>add(w,''));
  out.sort((a,b)=>(a[0].startsWith(pre)?0:1)-(b[0].startsWith(pre)?0:1)||a[0].length-b[0].length);
  $('#acBar').innerHTML=out.slice(0,10).map(([w,src])=>`<button data-w="${esc(w)}"><b>${esc(w.slice(0,pre.length))}</b>${esc(w.slice(pre.length))}${src?`<small>${src==='kw'?'kw':'ƒ'}</small>`:''}</button>`).join('');
}
$('#acBar').addEventListener('pointerdown',e=>{
  const b=e.target.closest('button');if(!b)return;e.preventDefault();
  const m=ta.value.slice(0,ta.selectionStart).match(/[A-Za-z_][\w]*$/);if(!m)return;
  ta.focus();ta.setSelectionRange(ta.selectionStart-m[0].length,ta.selectionStart);ins(b.dataset.w);acClear();
});

/* дерево файлов */
function allDirs(p){const set=new Set(p.dirs||[]);Object.keys(p.files).forEach(f=>{let d=dirOf(f);while(d){set.add(d);d=dirOf(d)}});return[...set].sort()}
function treeHTML(p,dir,depth){
  const dirs=allDirs(p).filter(d=>dirOf(d)===dir),files=Object.keys(p.files).filter(f=>dirOf(f)===dir).sort();
  const pad=`style="padding-left:${6+depth*16}px"`;
  return dirs.map(d=>{const open=!collapsed.has(p.id+':'+d);
    return`<div class="frow" data-act="dir-toggle" data-d="${esc(d)}" ${pad}><svg class="i car ${open?'open':''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">${ICONS.right}</svg><span class="fold">${ic('folder')}</span><span class="grow">${esc(base(d))}</span><span class="x" data-act="new-file" data-dir="${esc(d)}">${ic('plus')}</span><span class="x" data-act="del-dir" data-d="${esc(d)}">${ic('trash')}</span></div>`+(open?treeHTML(p,d,depth+1):'')}).join('')
   +files.map(f=>`<div class="frow ${f===S.cur.f?'on':''}" data-act="tab" data-f="${esc(f)}" ${pad}><span style="width:14px"></span>${tile(langOf(f),'sm')}<span class="grow">${esc(base(f))}</span><span class="x" data-act="del-file" data-f="${esc(f)}">${ic('x')}</span></div>`).join('');
}
function renderDrawer(){
  const p=P();if(!p){$('#drawer').innerHTML='';return}
  $('#drawer').innerHTML=`<div style="display:flex;align-items:center;gap:10px;margin:0 4px 14px">${tile(LN(p.lang))}<div class="grow"><h3>${esc(p.name)}</h3><div class="muted" style="font-size:12px">${p.gh?'⎇ '+esc(p.gh.full)+' · '+esc(p.gh.branch):LN(p.lang).name}</div></div></div>
   <div class="dtools"><button data-act="new-file" data-dir="">${ic('filePlus')}${t('drawer.file')}</button><button data-act="new-dir">${ic('folderPlus')}${t('drawer.folder')}</button><button data-act="import-here">${ic('upload')}${t('drawer.import')}</button></div>
   <div class="ftree">${treeHTML(p,'',0)||`<div class="empty">${t('drawer.empty')}</div>`}</div>
   ${p.gh?`<button class="bigbtn" data-act="gh-push" style="margin-top:10px">${ic('push')}${t('gh.commitPush')}</button>`:''}
   <button class="frow" data-act="go" data-v="projects" style="color:var(--muted);margin-top:6px">${ic('folder')}${t('drawer.allProjects')}</button>`;
}
function find(next){
  const q=$('#fq').value;if(!q)return;const v=ta.value.toLowerCase(),ql=q.toLowerCase();
  let i=v.indexOf(ql,next?ta.selectionEnd:ta.selectionStart);if(i<0)i=v.indexOf(ql);
  if(i<0){toast(t('ed.notFound'));return}
  ta.focus();ta.setSelectionRange(i,i+q.length);
  const line=ta.value.slice(0,i).split('\n').length;ta.scrollTop=Math.max(0,(line-4)*S.settings.fs*1.65);sync();pos();
}
$('#fq').addEventListener('input',()=>find(false));
$('#fq').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();find(true)}});
function openFile(f){const p=P();S.cur.f=f;ensureCur(p);save();lineCount=0;ta.scrollTop=0;ta.scrollLeft=0;renderEditor();$('#app').classList.remove('drawer-on')}

/* новый файл / папка */
let nf={dir:'',ext:''};
const COMMON_EXT=['txt','md','json','html','css','yml'];
function newFileSheet(dir){
  const p=P();if(!p){newProjSheet();return}
  const exts=[...new Set([...S.installed.filter(id=>LANG[id]).map(id=>LANG[id].ext),LN(p.lang).ext,...COMMON_EXT])];
  nf={dir:dir||'',ext:nf.ext&&exts.includes(nf.ext)?nf.ext:exts[0]};
  const dirs=['',...allDirs(p)];
  openSheet(`<h3>${t('nf.title')}</h3>
   <label class="field"><span>${t('nf.name')}</span><input id="nfN" placeholder="utils" autocapitalize="off" autocorrect="off"></label>
   <div class="field"><span>${t('nf.ext')}</span><div class="chips wrap">${exts.map(e=>`<button class="fchip mono ${e===nf.ext?'on':''}" data-act="nf-ext" data-e="${e}">.${e}</button>`).join('')}</div></div>
   <div class="field"><span>${t('nf.folder')}</span><div class="chips wrap">${dirs.map(d=>`<button class="fchip mono ${d===nf.dir?'on':''}" data-act="nf-dir" data-d="${esc(d)}">${d?esc(d)+'/':'/ '+t('nf.root')}</button>`).join('')}</div></div>
   <div class="preview-path" id="nfPrev"></div>
   <button class="bigbtn" data-act="nf-create">${ic('filePlus')}${t('ed.createFile')}</button>`);
  $('#nfN').oninput=nfPrev;nfPrev();
}
function nfPath(){let n=($('#nfN')?.value||'').trim().replace(/^\/+|\/+$/g,'')||'untitled';if(!/\.[\w]+$/.test(n))n+='.'+nf.ext;return(nf.dir?nf.dir+'/':'')+n}
function nfPrev(){const e=$('#nfPrev');if(e)e.innerHTML=t('nf.willCreate')+' <b>'+esc(nfPath())+'</b>'}
function newDirSheet(){
  const p=P();const dirs=['',...allDirs(p)];nf.dir='';
  openSheet(`<h3>${t('nd.title')}</h3>
   <label class="field"><span>${t('np.name')}</span><input id="ndN" placeholder="src" autocapitalize="off" autocorrect="off"></label>
   <div class="field"><span>${t('nd.inside')}</span><div class="chips wrap">${dirs.map(d=>`<button class="fchip mono ${d===''?'on':''}" data-act="nd-dir" data-d="${esc(d)}">${d?esc(d)+'/':'/ '+t('nf.root')}</button>`).join('')}</div></div>
   <button class="bigbtn" data-act="nd-create">${ic('folderPlus')}${t('nd.create')}</button>`);
}

/* ============ импорт файлов ============ */
let importTarget='current';
function readText(file){return new Promise(res=>{if(file.size>2e6||TEXT_EXT.test(file.name))return res(null);const r=new FileReader();r.onload=()=>res(String(r.result).includes('\u0000')?null:r.result);r.onerror=()=>res(null);r.readAsText(file)})}
$('#fileIn').addEventListener('change',async e=>{
  const files=[...e.target.files];e.target.value='';if(!files.length)return;
  let p=P();if(!p||importTarget==='new'){p={id:uid(),name:'imported',lang:'',files:{},dirs:[],open:[],updated:Date.now()};S.projects.unshift(p)}
  let ok=0,skip=0,last='';
  for(const f of files){const s=await readText(f);if(s==null){skip++;continue}let n=f.name;while(p.files[n]!=null)n=n.replace(/(\.\w+)?$/,'-copy$1');p.files[n]=s;last=n;ok++}
  if(!p.lang)p.lang=guessLang(Object.keys(p.files));
  p.updated=Date.now();S.cur={p:p.id,f:last||S.cur.f};save();show('editor');
  toast(t('imp.opened',{n:ok})+(skip?' · '+t('imp.skipped',{n:skip}):''));
});
$('#dirIn').addEventListener('change',async e=>{
  const files=[...e.target.files];e.target.value='';if(!files.length)return;
  const root=(files[0].webkitRelativePath||files[0].name).split('/')[0]||'folder';
  const out={};let skip=0;
  for(const f of files.slice(0,400)){const rel=(f.webkitRelativePath||f.name).split('/').slice(1).join('/')||f.name;
    if(/(^|\/)(node_modules|\.git|build|dist|\.gradle)\//.test(rel)){skip++;continue}
    const s=await readText(f);if(s==null){skip++;continue}out[rel]=s}
  importFolder(root,out,skip);
});
function importFolder(name,files,skip=0){
  const n=Object.keys(files).length;if(!n){toast(t('imp.noText'));return}
  let nm=name||'folder';while(S.projects.some(x=>x.name===nm))nm+='-2';
  const p={id:uid(),name:nm,lang:guessLang(Object.keys(files)),files,dirs:[],open:[],updated:Date.now()};
  S.projects.unshift(p);S.cur={p:p.id,f:''};save();show('editor');
  toast(t('imp.folder',{name:nm})+' · '+tn('files',n)+(skip?' · '+t('imp.skipped',{n:skip}):''));
}

/* ============ запуск кода ============ */
const PYO='https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
let pyP=null,py=null;
function loadPy(){
  if(pyP)return pyP;
  pyP=new Promise((res,rej)=>{const s=document.createElement('script');s.src=PYO+'pyodide.js';
    s.onload=async()=>{try{py=await loadPyodide({indexURL:PYO});res(py)}catch(e){rej(e)}};s.onerror=()=>rej(new Error('network'));document.head.appendChild(s)});
  pyP.catch(()=>{pyP=null});return pyP;
}
const pyErr=e=>String(e.message||e).trim().split('\n').slice(-4).join('\n');
async function runPy(code){
  if(!S.installed.includes('py')){out(t('run.notInstalled',{lang:'Python',cmd:pkgHint('python')}),'e');return}
  if(!py)out(t('run.pyLoading'),'d');
  try{const p=await loadPy();p.setStdout({batched:s=>out(s)});p.setStderr({batched:s=>out(s,'e')});return await p.runPythonAsync(code)}
  catch(e){out(pyErr(e),'e')}
}
const fmt=v=>typeof v==='string'?v:v instanceof Error?v.name+': '+v.message:(()=>{try{return JSON.stringify(v,null,0)??String(v)}catch{return String(v)}})();
function runJS(code,sink){
  sink=sink||out;
  const o={};['log','info','warn','error'].forEach(k=>{o[k]=console[k];console[k]=(...a)=>sink(a.map(fmt).join(' '),k==='error'?'e':k==='warn'?'w':'')});
  try{return(0,eval)(code)}catch(e){sink(e.name+': '+e.message,'e')}finally{Object.assign(console,o)}
}
const shq=s=>/^[\w./-]+$/.test(s)?s:"'"+String(s).replace(/'/g,"'\\''")+"'";
const NCMD={
  js:f=>`node ${f}`, py:f=>`python3 ${f}`, ts:f=>`tsx ${f}`,
  c:f=>`gcc ${f} -o /tmp/a.out -lm && /tmp/a.out`,
  cpp:f=>`g++ -std=c++20 ${f} -o /tmp/a.out && /tmp/a.out`,
  cs:f=>`mkdir -p /tmp/csrun && cp ${f} /tmp/csrun/Program.cs && (cd /tmp/csrun && { [ -f run.csproj ] || printf '%s' '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net8.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings></PropertyGroup></Project>' > run.csproj; } && dotnet run)`,
  java:f=>`java ${f}`,
  kt:f=>`kotlinc -nowarn ${f} -include-runtime -d /tmp/kt.jar && java -jar /tmp/kt.jar`,
  go:f=>`go run ${f}`,
  rs:f=>`if [ -f Cargo.toml ]; then cargo run -q; else rustc ${f} -o /tmp/rs.out && /tmp/rs.out; fi`,
  php:f=>`php ${f}`, rb:f=>`ruby ${f}`, lua:f=>`lua5.4 ${f}`, sh:f=>`bash ${f}`,
  swift:f=>`swift ${f}`, dart:f=>`dart run ${f}`
};
function pickRunFile(f){
  const p=P();if(!p)return null;
  let L=f&&langOf(f);
  if(!L||p.files[f]==null){const m=LN(p.lang).file;if(p.files[m]!=null){f=m;L=langOf(f)}else{f=Object.keys(p.files).find(x=>langOf(x));L=f&&langOf(f)}}
  return L&&p.files[f]!=null?{f,L}:null;
}
async function runFile(f){
  const p=P();if(!p)return;
  const r=pickRunFile(f);
  if(!r){termMsg(t('run.nothing'),'e');return}
  const{L}=r;f=r.f;
  if(NATIVE){
    // JavaScript без установленного Node.js выполняется встроенным движком
    if(L.id==='js'&&!S.installed.includes('ts')){
      show('term');termMsg('$ node '+f,'p');runJS(p.files[f],(s,c)=>termMsg(s,c));termMsg('✓ '+t('run.done'),'d');return;
    }
    if(L.soon){show('term');termMsg(t('run.soon',{lang:L.name}),'w');return}
    if(L.id!=='js'&&!S.installed.includes(L.id)){show('term');termMsg(t('run.notInstalled',{lang:L.name,cmd:pkgHint(L.id)}),'e');return}
    ptyRun(p,NCMD[L.id](shq(f)));return;
  }
  outPrompt(`${{js:'node',py:'python3'}[L.id]||L.id} ${f}`);
  if(!S.installed.includes(L.id)&&L.run){out(t('run.notInstalled',{lang:L.name,cmd:pkgHint(L.id)}),'e');return}
  const t0=performance.now();
  if(L.run==='js')runJS(p.files[f]);
  else if(L.run==='py')await runPy(p.files[f]);
  else{out(t('run.webOnly',{lang:L.name}),'w');return}
  out('✓ '+t('run.doneIn',{ms:(performance.now()-t0).toFixed(0)}),'d');
}

/* ============ терминал ============ */
/* В приложении — настоящий PTY (xterm.js + нативный псевдотерминал): работают vim, htop, ssh.
   В веб-превью — упрощённая оболочка на JS с теми же командами. */
const term=$('#term'),tin=$('#tin');let mode='sh',hist=store.get('hist',[]),hi=hist.length;
let openLine=null;
function trimTerm(){while(term.childNodes.length>1500)term.firstChild.remove();term.scrollTop=1e9}
function out(s,c=''){openLine=null;const d=document.createElement('div');if(c)d.className=c;d.textContent=s;term.appendChild(d);trimTerm()}
function promptParts(){
  const p=P(),pn=p?p.name:'',n=NICK();
  if(OS()==='windows')return{txt:`PS C:\\Users\\${n}${pn?'\\'+pn:''}> `};
  if(OS()==='mac')return{txt:`${n}@Codeum-Phone ${pn||'~'} % `};
  return{txt:`${n}@codeum:~/${pn}$ `,html:`<span class="pu">${esc(n)}@codeum</span>:<span class="pd">~/${esc(pn)}</span>$ `};
}
const promptStr=()=>promptParts().txt;
function outPrompt(line){
  openLine=null;const pp=promptParts(),d=document.createElement('div');d.className='p';
  if(pp.html){d.innerHTML=pp.html;d.appendChild(document.createTextNode(line))}else d.textContent=pp.txt+line;
  term.appendChild(d);trimTerm();
}
/* сообщение в текущий терминал (PTY или веб) */
const ANSI={e:'31',w:'33',d:'2',a:'36',p:'32'};
function termMsg(s,c=''){
  if(NATIVE&&xt){xt.write('\r\n'+(c?`\x1b[${ANSI[c]||'0'}m`:'')+String(s).replace(/\n/g,'\r\n')+(c?'\x1b[0m':'')+'\r\n');return}
  out(s,c);
}
function termHead(){
  const os=OS(),p=P(),pn=p?p.name:'~',n=NICK();
  const w=$('.term-wrap');w.classList.remove('os-linux','os-mac','os-windows');w.classList.add('os-'+os);
  $('#termHead').innerHTML=
    os==='mac'?`<div class="dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div><div class="t">${esc(pn)} — -zsh — ${xt?xt.cols+'×'+xt.rows:'80×24'}</div><button class="clr" data-act="term-clear">clear</button>`
   :os==='windows'?`<div class="pstab"><b>PS</b>PowerShell</div><div class="t"></div><button class="clr" data-act="term-clear">cls</button><div class="wbtn"><span>—</span><span>▢</span><span>✕</span></div>`
   :`<button class="clr" data-act="term-clear">clear</button><div class="t">${esc(n)}@codeum: ~/${esc(pn)}</div><div class="gbtn"><i></i><i></i><i style="background:#e95420"></i></div>`;
}
function updPrompt(){
  termHead();
  if(NATIVE)return;
  const el=$('#tprompt'),pp=promptParts();
  if(mode!=='sh'){el.textContent=mode==='py'?'>>>':'>';return}
  if(pp.html)el.innerHTML=pp.html.replace(/\$ $/,'$');else el.textContent=pp.txt.trimEnd();
}
function termBanner(){
  const n=NICK(),os=OS();
  if(os==='windows')out(`Codeum PowerShell\n${t('term.hello',{nick:n})}`,'d');
  else if(os==='mac')out(`Last login: ${new Date().toLocaleString(LOCALE[LG],{weekday:'short',hour:'2-digit',minute:'2-digit'})} on ttys000\n${t('term.hello',{nick:n})}`,'d');
  else out(`Welcome to Codeum Linux, ${n}!\n${t('term.hello',{nick:n})}`,'d');
}
function termShow(){
  termHead();
  if(NATIVE){$('#term').hidden=true;$('#termIn').hidden=true;$('#xterm').hidden=false;xtInit();renderTKeys();
    requestAnimationFrame(()=>{fitPty();ptyEnsure().then(ok=>{if(ok)xt.focus()})});return}
  $('#xterm').hidden=true;$('#term').hidden=false;$('#termIn').hidden=false;renderTKeys();updPrompt();term.scrollTop=1e9;
}

/* ---- команды «чужих» систем в веб-превью: dir → ls, type → cat… ---- */
const WIN_MAP={dir:'ls',gci:'ls','get-childitem':'ls',ls:'ls',type:'cat',gc:'cat','get-content':'cat',
  del:'rm',erase:'rm',ri:'rm','remove-item':'rm',md:'mkdir',mkdir:'mkdir','new-item':'touch',ni:'touch',echo:'echo','write-host':'echo'};
function osTranslate(raw){
  const s=raw.trim();if(!s)return{line:''};
  const a=s.split(/\s+/),lc=a[0].toLowerCase(),rest=a.slice(1),os=OS();
  if(lc==='sudo')return osTranslate(rest.join(' '));
  if(['apt','apt-get','brew','winget','choco','scoop','pkg'].includes(lc)&&rest[0]==='install'&&rest[1])return{line:'pkg install '+rest[1]};
  if(['whoami','help','clear','cls','clear-host','projects'].includes(lc))return{builtin:lc==='cls'||lc==='clear-host'?'clear':lc};
  if(['notepad','code','edit','nano','vim','vi'].includes(lc)||(os==='mac'&&lc==='open')||(os==='windows'&&lc==='start'))return{builtin:'edit',arg:rest.join(' ').replace(/\\/g,'/')};
  if(os==='windows'){const m=WIN_MAP[lc];if(m)return{line:[m,...rest.filter(x=>!x.startsWith('-')).map(x=>x.replace(/\\/g,'/'))].join(' ')}}
  return{line:s};
}
function osHelp(){return t('help.'+OS())+'\n'+t('help.common')}
function editCmd(arg){
  const p=P();if(!p){termMsg(t('term.noProject'),'e');return}
  if(!arg){show('editor');return}
  let f=arg.replace(/^\.\//,'').replace(/^\/root\/projects\/[^/]+\//,'');
  if(p.files[f]==null){p.files[f]='';save()}
  openFile(f);show('editor');
}
async function pkgCmd(a){
  if(a[0]==='list'){LANGS.forEach(L=>out(`${S.installed.includes(L.id)?'✓':' '} ${L.id.padEnd(6)} ${L.name.padEnd(11)} ${L.ver.padEnd(11)} ${sizeOf(L)?'~'+mb(sizeOf(L)):t('store.builtin')}`,S.installed.includes(L.id)?'a':''));return true}
  if(a[0]==='install'&&a[1]){const L=findLang(a[1]);
    if(!L){out(t('pkg.unknown',{x:a[1]}),'e');return true}
    if(S.installed.includes(L.id)){out(t('pkg.already',{lang:L.name}),'d');return true}
    if(!L.run){out(t('run.webOnly',{lang:L.name}),'w');return true}
    out(t('pkg.installing',{lang:L.name}),'d');const ok=await installLang(L.id);out(ok?'✓ '+t('store.installedToast',{lang:L.name}):'✗ '+t('pkg.failed'),ok?'a':'e');return true}
  return false;
}
function findLang(x){x=String(x||'').toLowerCase();const al={python:'py',python3:'py',node:'js',nodejs:'js',javascript:'js',typescript:'ts','c++':'cpp',csharp:'cs',dotnet:'cs',kotlin:'kt',golang:'go',rust:'rs',ruby:'rb',bash:'sh'};x=al[x]||x;return LANGS.find(l=>l.id===x||l.name.toLowerCase()===x)}
async function osBuiltin(tr){
  const p=P();
  switch(tr.builtin){
    case'whoami':out(NICK());return true;
    case'help':out(osHelp(),'d');return true;
    case'clear':term.innerHTML='';openLine=null;return true;
    case'projects':S.projects.forEach(x=>out((p&&x.id===p.id?'* ':'  ')+x.name+'  ('+LN(x.lang).name+')',p&&x.id===p.id?'a':''));return true;
    case'edit':editCmd(tr.arg);return true;
  }
  return false;
}
async function cmd(line){
  if(mode==='py'){out('>>> '+line,'p');if(/^(exit|quit)(\(\))?$/.test(line)){mode='sh';updPrompt();return}const r=await runPy(line);if(r!==undefined&&r!==null)out(String(r),'a');return}
  if(mode==='js'){out('> '+line,'p');if(line==='.exit'){mode='sh';updPrompt();return}const r=runJS(line);if(r!==undefined)out(fmt(r),'a');return}
  outPrompt(line);
  const tr=osTranslate(line);
  if(tr.builtin){await osBuiltin(tr);return}
  const[c,...a]=tr.line.trim().split(/\s+/),arg=a.join(' '),p=P();
  if(!p&&['ls','cat','touch','rm','mkdir','run'].includes(c)){out(t('term.noProject'),'e');return}
  switch(c){
    case'':break;
    case'ls':out(Object.keys(p.files).sort().join('\n'));break;
    case'pwd':out('/root/projects/'+(p?p.name:''));break;
    case'date':out(new Date().toString());break;
    case'echo':out(arg);break;
    case'cat':out(p.files[arg]!=null?p.files[arg]:'cat: '+arg+': '+t('term.noFile'),p.files[arg]!=null?'':'e');break;
    case'touch':if(arg&&p.files[arg]==null){p.files[arg]='';save()}break;
    case'mkdir':if(arg){p.dirs=[...new Set([...(p.dirs||[]),arg.replace(/\/+$/,'')])];save()}break;
    case'rm':if(p.files[arg]==null){out('rm: '+arg+': '+t('term.noFile'),'e');break}delete p.files[arg];save();break;
    case'run':await runFile(arg||S.cur.f);break;
    case'project':case'cd':{const x=S.projects.find(q=>q.name===arg);if(!x){out(t('term.noProjectNamed',{name:arg}),'e');break}S.cur={p:x.id,f:''};ensureCur(x);save();updPrompt();break}
    case'python':case'python3':if(arg){await runFile(arg);break}if(!S.installed.includes('py')){out(t('run.notInstalled',{lang:'Python',cmd:pkgHint('python')}),'e');break}mode='py';updPrompt();out('Python 3.12 (Pyodide) — exit()','d');loadPy().catch(()=>out(t('store.loadError'),'e'));break;
    case'node':if(arg){await runFile(arg);break}mode='js';updPrompt();out('JavaScript REPL — .exit','d');break;
    case'pkg':if(!(await pkgCmd(a)))out('pkg list | pkg install <lang>','d');break;
    case'neofetch':out(neofetch(),'a');break;
    default:out(t('term.notFound',{c}),'e');
  }
}
function neofetch(){return`   ▄▄▄▄▄▄▄▄     ${NICK()}@codeum
  █ ▶  ▁▁  █    ────────────
  █        █    OS: Codeum ${curVersion()}${NATIVE?' · Alpine Linux':''}
   ▀▀▀▀▀▀▀▀     CPU: ${NATIVE?NV.abi():'web'}
                Theme: ${THEMES[S.settings.theme][0]}
                Languages: ${S.installed.length} / ${LANGS.length}
                Projects: ${S.projects.length}`}
tin.addEventListener('keydown',async e=>{
  if(e.key==='Enter'){const v=tin.value;tin.value='';if(v.trim()){hist.push(v);hist=hist.slice(-100);store.set('hist',hist)}hi=hist.length;await cmd(v)}
  else if(e.key==='ArrowUp'){e.preventDefault();histMove(-1)}else if(e.key==='ArrowDown'){e.preventDefault();histMove(1)}
});
function histMove(d){hi=Math.max(0,Math.min(hist.length,hi+d));tin.value=hist[hi]||''}

/* ---- настоящий терминал: PTY + xterm.js ---- */
let xt=null,fitA=null,ctrlOn=false;const pty={alive:false,proj:null};
const XT_THEME={
  windows:{background:'#012456',foreground:'#eeedf0',cursor:'#ffffff',selectionBackground:'#3a5a8c',
    black:'#0c0c0c',red:'#e74856',green:'#16c60c',yellow:'#f9f1a5',blue:'#3b78ff',magenta:'#b4009e',cyan:'#61d6d6',white:'#cccccc',
    brightBlack:'#767676',brightRed:'#e74856',brightGreen:'#16c60c',brightYellow:'#f9f1a5',brightBlue:'#3b78ff',brightMagenta:'#b4009e',brightCyan:'#61d6d6',brightWhite:'#f2f2f2'},
  linux:{background:'#300a24',foreground:'#eeeeec',cursor:'#eeeeec',selectionBackground:'#6b3a5c',
    black:'#2e3436',red:'#cc0000',green:'#4e9a06',yellow:'#c4a000',blue:'#3465a4',magenta:'#75507b',cyan:'#06989a',white:'#d3d7cf',
    brightBlack:'#555753',brightRed:'#ef2929',brightGreen:'#8ae234',brightYellow:'#fce94f',brightBlue:'#729fcf',brightMagenta:'#ad7fa8',brightCyan:'#34e2e2',brightWhite:'#eeeeec'},
  mac:{background:'#1e1e1e',foreground:'#f2f2f2',cursor:'#c7c7c7',selectionBackground:'#4a4a4a',
    black:'#000000',red:'#ff5f57',green:'#28c840',yellow:'#febc2e',blue:'#4a9eff',magenta:'#c678dd',cyan:'#64d2ff',white:'#e5e5e5',
    brightBlack:'#8e8e93',brightRed:'#ff6961',brightGreen:'#34d058',brightYellow:'#ffd60a',brightBlue:'#64a8ff',brightMagenta:'#d38cf0',brightCyan:'#70d7ff',brightWhite:'#ffffff'}
};
function xtInit(){
  if(xt){xt.options.theme=XT_THEME[OS()];return}
  xt=new Terminal({fontFamily:"'JetBrains Mono', ui-monospace, monospace",fontSize:13,lineHeight:1.15,cursorBlink:true,scrollback:4000,
    allowProposedApi:true,theme:XT_THEME[OS()],convertEol:false});
  fitA=new FitAddon.FitAddon();xt.loadAddon(fitA);xt.open($('#xterm'));
  const tx=$('#xterm textarea');if(tx){['autocapitalize','autocorrect'].forEach(a=>tx.setAttribute(a,'off'));tx.setAttribute('spellcheck','false')}
  xt.onData(d=>{
    if(ctrlOn&&d.length===1){const c=d.toUpperCase().charCodeAt(0);if(c>=64&&c<=95)d=String.fromCharCode(c-64);ctrlOn=false;renderTKeys()}
    ptyInput(d);
  });
  xt.parser.registerOscHandler(7777,data=>{onOsc(data);return true});
  new ResizeObserver(()=>fitPty()).observe($('#xterm'));
  if(document.fonts)document.fonts.ready.then(()=>fitPty());
}
function fitPty(){if(!xt||$('#xterm').hidden||!$('#xterm').offsetParent)return;try{fitA.fit()}catch{}if(pty.alive)NV.ptyResize(xt.rows,xt.cols);termHead()}
function ptyInput(d){
  if(pty.alive){NV.ptyWrite(d);return}
  if(d==='\r')ptyEnsure(); // после выхода из оболочки Enter запускает новую
}
async function ptyEnsure(){
  if(!NV.ready()){xt.write('\r\n\x1b[33m'+t('term.noLinux',{cmd:pkgHint('python')})+'\x1b[0m\r\n');return false}
  const p=P();
  if(pty.alive&&pty.proj===(p&&p.id))return true;
  if(p)NV.syncProject(p.name,JSON.stringify(p.files));
  NV.writeShellRc(shellRc());
  const ok=NV.ptyStart(p?NV.projectPath(p.name):'/root',xt.rows||24,xt.cols||80);
  pty.alive=ok;pty.proj=p&&p.id;
  if(!ok)xt.write('\r\n\x1b[31m'+t('term.startFail')+'\x1b[0m\r\n');
  return ok;
}
function ptyRestart(){if(pty.alive)NV.ptyKill();pty.alive=false;if(xt){xt.reset();ptyEnsure()}}
async function ptyRun(p,command){
  show('term');
  if(!await ptyEnsure())return;
  NV.syncProject(p.name,JSON.stringify(p.files));
  // Ctrl+U очищает введённое, затем команда как будто набрана вручную
  NV.ptyWrite('\x15'+`clear; cd ${shq(NV.projectPath(p.name))} && ${command}; __done $?\r`);
  xt.focus();
}
/* файлы, созданные в терминале (touch, cargo new…), появляются в проекте */
function pullFiles(){
  const p=S.projects.find(x=>x.id===pty.proj);if(!p)return;
  let disk;try{disk=JSON.parse(NV.readProject(p.name))}catch{return}
  let n=0;for(const k in disk)if(p.files[k]==null){p.files[k]=disk[k];n++}
  if(n){p.updated=Date.now();save();if(view==='editor')renderEditor();toast(t('term.newFiles',{n}))}
}
/* сообщения от оболочки: printf '\e]7777;команда;аргумент\a' */
function onOsc(data){
  const i=data.indexOf(';'),c=i<0?data:data.slice(0,i),arg=i<0?'':data.slice(i+1);
  const p=P();
  if(c==='run'){const r=pickRunFile(arg||S.cur.f);if(!r){xt.write(t('run.nothing')+'\r\n');return}
    if(!S.installed.includes(r.L.id)){xt.write('\x1b[31m'+t('run.notInstalled',{lang:r.L.name,cmd:pkgHint(r.L.id)})+'\x1b[0m\r\n');NV.ptyWrite('\r');return}
    NV.syncProject(p.name,JSON.stringify(p.files));NV.ptyWrite(`${NCMD[r.L.id](shq(r.f))}; __done $?\r`);return}
  if(c==='edit'){editCmd(arg);return}
  if(c==='project'){const x=S.projects.find(q=>q.name===arg);if(!x){xt.write('\x1b[31m'+t('term.noProjectNamed',{name:arg})+'\x1b[0m\r\n');NV.ptyWrite('\r');return}
    S.cur={p:x.id,f:''};ensureCur(x);save();ptyRestart();termHead();return}
  if(c==='installed'){if(LANG[arg]&&!S.installed.includes(arg)){S.installed.push(arg);save();toast(t('store.installedToast',{lang:LANG[arg].name}))}return}
  if(c==='done'){pullFiles();return}
}
/* ~/.shrc для оболочки: приглашение, команды под выбранную ОС, help и pkg на языке интерфейса */
function shellRc(){
  const n=NICK().replace(/[^\p{L}\p{N}_.-]/gu,''),os=OS(),p=P(),pn=p?p.name:'';
  const pk=JSON.parse(NV.pkgMap());
  const BS8='\\'.repeat(8);
  const heredoc=(fn,text)=>`${fn}(){ cat <<'__CODEUM_EOF__'\n${text}\n__CODEUM_EOF__\n}`;
  const lines=[
    '# generated by Codeum',
    'export HOME=/root',
    // описания терминала для vim, nano, htop — ставятся тихо один раз
    `[ -e /usr/share/terminfo/x/xterm-256color ] || ( apk add -q ncurses-terminfo-base >/dev/null 2>&1 & )`,
    `alias ls='ls --color=auto'`,
    `__c(){ printf '\\033]7777;%s\\007' "$*"; }`,
    `__done(){ if [ "$1" = 0 ]; then printf '\\n\\033[2m✓ %s\\033[0m\\n' ${shq(t('run.done'))}; else printf '\\n\\033[31m✗ %s %s\\033[0m\\n' ${shq(t('run.exitCode'))} "$1"; fi; __c "done;$1"; }`,
    `run(){ __c "run;$1"; }`,
    `project(){ __c "project;$1"; }`,
    `whoami(){ echo ${shq(NICK())}; }`,
    heredoc('projects',S.projects.map(x=>(x.id===(p&&p.id)?'* ':'  ')+x.name+'  ('+LN(x.lang).name+')').join('\n')),
    heredoc('neofetch',neofetch()),
    heredoc('help',osHelp()+'\n\n'+t('help.native')),
    // установка языков прямо в терминале: реальный вывод apk
    ...Object.entries(pk).map(([id,v])=>`__pk_${id}=${shq(v.apk)}; __post_${id}=${shq(v.post)}`),
    `__inst(){ case "$1" in python|python3|py) i=py;; node|nodejs|javascript|js) i=js;; typescript|ts) i=ts;; c) i=c;; c++|cpp) i=cpp;; csharp|dotnet|cs) i=cs;; java) i=java;; kotlin|kt) i=kt;; go|golang) i=go;; rust|rs) i=rs;; php) i=php;; ruby|rb) i=rb;; lua) i=lua;; bash|sh) i=sh;; *) apk add "$1"; return;; esac
  if [ "$i" = js ]; then i=ts; fi
  eval "p=\\$__pk_$i; q=\\$__post_$i"
  echo ${shq(t('pkg.installing',{lang:'…'}))}; apk add $p && { [ -z "$q" ] || sh -c "$q"; } && __c "installed;$i" && printf '\\033[32m✓ %s\\033[0m\\n' "$1"; }`,
    `pkg(){ case "$1" in install|add) shift; for x in "$@"; do __inst "$x"; done;; list) apk info | sort | head -200;; *) apk "$@";; esac; }`,
    `sudo(){ "$@"; }`,
    `apt(){ if [ "$1" = install ]; then shift; pkg install "$@"; else apk "$@"; fi; }`,
    `alias apt-get=apt brew=apt winget=apt choco=apt scoop=apt`,
    `edit(){ __c "edit;$1"; }`
  ];
  if(os==='windows'){
    lines.push(`alias dir='ls -l' cls=clear type=cat copy=cp move=mv ren=mv del=rm erase=rm rd='rm -r' md='mkdir -p' where=which tasklist=ps findstr=grep ipconfig='ip addr' gci=ls gc=cat sl=cd`,
      `notepad(){ __c "edit;$1"; }`,`alias code=notepad start=notepad`,
      `ver(){ printf '\\nCodeum PowerShell %s\\n\\n' ${shq(curVersion())}; }`,
      // ash обрабатывает «\» в PS1 дважды (раскрытие и escape-коды приглашения): на один видимый «\» нужно 4 в значении
      `__ps(){ w=$(pwd); case "$w" in /root/projects/*) r="\${w#/root/projects/}";; /root/projects) r="";; *) r="$w";; esac; r=$(printf '%s' "$r" | sed 's|/|${BS8}|g'); PS1="PS C:${BS8}Users${BS8}${n}\${r:+${BS8}\$r}> "; }`,
      `cd(){ command cd "$(printf '%s' "\${1:-/root/projects/${pn}}" | tr '\\\\' '/')" && __ps; }`,
      '__ps');
  }else if(os==='mac'){
    lines.push(`PS1='${n}@Codeum-Phone \\W % '`,`open(){ __c "edit;$1"; }`,`alias code=open`,
      `sw_vers(){ printf 'ProductName:\\tCodeum\\nProductVersion:\\t%s\\n' ${shq(curVersion())}; }`);
  }else{
    lines.push(`PS1='\\[\\033[1;32m\\]${n}@codeum\\[\\033[0m\\]:\\[\\033[1;34m\\]\\w\\[\\033[0m\\]$ '`,`alias code=edit`);
  }
  return lines.join('\n')+'\n';
}

/* клавиши терминала: стрелки первыми, дальше — самые нужные символы для выбранной ОС */
const T_SYMS={
  linux:'/ - | ~ . * $ > & " \' _ = :',
  mac:'/ - ~ $ | . * > " \' _ & = :',
  windows:'\\ - . : > | " * / $ \' _ ='
};
let TKEYS=[];
function renderTKeys(){
  if(NATIVE){
    TKEYS=[['↑','\x1b[A','arr'],['↓','\x1b[B','arr'],['←','\x1b[D','arr'],['→','\x1b[C','arr'],['⇥','\t','arr'],['Esc','\x1b','mod'],
      ['Ctrl','CTRL','mod'+(ctrlOn?' on':'')],['^C','\x03','mod'],...T_SYMS[OS()].split(' ').map(s=>[s,s,''])];
  }else{
    TKEYS=[['↑','up','arr'],['↓','dn','arr'],['⇥','tab','arr'],['^C','c','mod'],...T_SYMS[OS()].split(' ').map(s=>[s,'txt',''])];
  }
  $('#tkeys').innerHTML=TKEYS.map((k,i)=>`<button data-k="${i}" class="${k[2]}">${esc(k[0])}</button>`).join('');
}
$('#tkeys').addEventListener('pointerdown',e=>{
  const b=e.target.closest('button');if(!b)return;e.preventDefault();const[l,a]=TKEYS[b.dataset.k];
  if(NATIVE){
    if(a==='CTRL'){ctrlOn=!ctrlOn;renderTKeys();xt&&xt.focus();return}
    ptyInput(a);xt&&xt.focus();return;
  }
  tin.focus();
  if(a==='txt'){tin.setRangeText(l,tin.selectionStart,tin.selectionEnd,'end');return}
  if(a==='up')histMove(-1);if(a==='dn')histMove(1);
  if(a==='c'){out((mode==='sh'?promptStr():'')+tin.value+'^C','d');tin.value='';if(mode!=='sh'){mode='sh';updPrompt()}}
  if(a==='tab'){const v=tin.value,w=v.split(' ').pop(),p=P();const m=[...(p?Object.keys(p.files):[]),...'help ls cat run touch rm mkdir projects project pkg python node neofetch clear'.split(' ')].filter(x=>x.startsWith(w));if(m.length===1)tin.value=v.slice(0,v.length-w.length)+m[0]+' ';else if(m.length)out(m.join('  '),'d')}
});

/* ============ магазин языков ============ */
let sq='',sf='all',installing=null;const instProg={},instWait={};
async function installLang(id){
  if(NATIVE&&id!=='js'){
    if(LANG[id].soon){langInfo(id);return false}
    if(installing){toast(t('store.wait',{lang:LANG[installing].name}));return false}
    installing=id;instProg[id]={text:NV.ready()?t('store.preparing'):t('store.firstRun'),pct:0};if(view==='store')renderStoreList();
    const ok=await new Promise(res=>{instWait[id]=res;NV.install(id)});
    installing=null;delete instProg[id];
    if(ok){if(!S.installed.includes(id))S.installed.push(id);save();toast(t('store.installedToast',{lang:LANG[id].name}))}
    if(view==='store')renderStoreList();if(view==='home')renderHome();return ok;
  }
  installing=id;if(view==='store')renderStoreList();let ok=false;
  try{if(id==='py')await loadPy();if(!S.installed.includes(id))S.installed.push(id);save();ok=true;toast(t('store.installedToast',{lang:LANG[id].name}))}
  catch{toast(t('store.loadError'))}
  installing=null;if(view==='store')renderStoreList();if(view==='home')renderHome();return ok;
}
/* установленные языки проверяются по факту — есть ли в Linux нужная программа */
function syncInstalled(){
  if(!NATIVE)return;
  try{const nat=JSON.parse(NV.installed());const next=[...new Set([...S.installed.filter(id=>id==='js'),...nat])];
    if(next.join()!==S.installed.join()){S.installed=next;save()}}catch{}
}
const STORE_CATS=[['all','store.cat.all'],['inst','store.cat.inst'],['web','store.cat.web'],['system','store.cat.system'],['mobile','store.cat.mobile'],['general','store.cat.general']];
function renderStore(){
  syncInstalled();
  $('#v-store').innerHTML=`<div class="pad">
   <div class="banner"><b>${FIRST_LAUNCH?t('store.bannerFirst',{n:LANGS.length}):t('nav.langs')}</b><div class="stack">${['py','rs','go','kt'].map(i=>tile(LANG[i])).join('')}</div></div>
   <label class="search">${ic('search')}<input id="sq" placeholder="Python, Rust, Go…" value="${esc(sq)}"></label>
   <div class="chips" id="storeCats" style="margin-bottom:14px">${STORE_CATS.map(([k,n])=>`<button class="fchip ${sf===k?'on':''}" data-act="sf" data-k="${k}">${t(n)}</button>`).join('')}</div>
   <div id="storeList"></div>
  </div>`;
  $('#sq').oninput=e=>{sq=e.target.value;renderStoreList()};
  renderStoreList();
}
function renderStoreList(){
  const el=$('#storeList');if(!el)return;
  const list=LANGS.filter(L=>(sf==='all'||(sf==='inst'?S.installed.includes(L.id):L.cat===sf))&&(L.name+L.id).toLowerCase().includes(sq.toLowerCase()));
  el.innerHTML=list.map(L=>{const inst=S.installed.includes(L.id);let b;
     const pr=instProg[L.id];
     if(installing===L.id)b=`<button class="btn sec"><span class="spin"></span>${pr&&pr.pct>0?pr.pct+'%':t('store.loading')}</button>`;
     else if(inst)b=`<button class="btn ok" data-act="lang-info" data-id="${L.id}">${ic('check')}${t('store.installed')}</button>`;
     else if(NATIVE&&L.soon)b=`<button class="btn apk" data-act="lang-info" data-id="${L.id}">${t('store.soon')}</button>`;
     else if(L.run||NATIVE)b=`<button class="btn pri" data-act="install" data-id="${L.id}">${ic('download')}${sizeOf(L)?'~'+mb(sizeOf(L)):t('store.install')}</button>`;
     else b=`<button class="btn apk" data-act="lang-info" data-id="${L.id}">${ic('phone')}APK</button>`;
     return`<div class="item lang">${tile(L)}<div class="grow"><div class="nm">${L.name}</div><div class="desc">${installing===L.id&&pr?esc(pr.text):esc(langDesc(L))}</div><div class="meta"><span class="tag">${L.ver}</span><span class="tag">.${L.ext}</span></div></div>${b}</div>`}).join('')||`<div class="empty">${t('common.notFound')}</div>`;
}
function langInfo(id){
  const L=LANG[id],inst=S.installed.includes(id);
  const note=NATIVE?(L.soon?t('store.noteSoon',{lang:L.name}):L.id==='js'?t('store.noteJs'):t('store.noteNative',{size:mb(sizeOf(L))}))
    :(L.run?'':t('store.noteWeb',{lang:L.name}));
  openSheet(`<div style="display:flex;gap:14px;align-items:center;margin-bottom:10px">${tile(L,'lg')}<div><h3>${L.name}</h3><div class="muted" style="font-size:13px">${L.ver} · ${sizeOf(L)?'~'+mb(sizeOf(L)):t('store.builtin')}</div></div></div>
   <p class="muted">${esc(langDesc(L))}</p>
   ${note?`<div class="note">${ic('info')}<div>${note}</div></div>`:''}
   ${inst?`<button class="bigbtn" data-act="lang-new" data-id="${id}">${t('store.newProjectIn',{lang:L.name})}</button><button class="bigbtn sec" data-act="uninstall" data-id="${id}">${t('common.delete')}</button>`:''}`);
}

/* ============ GitHub ============ */
async function gh(path,opt={}){
  const r=await fetch('https://api.github.com'+path,{...opt,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+S.gh.token,...(opt.body?{'Content-Type':'application/json'}:{})}});
  const j=r.status===204?{}:await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.message||('HTTP '+r.status));return j;
}
function ghConnectSheet(){
  openSheet(`<div style="display:flex;gap:12px;align-items:center"><div class="tile lg" style="--c:#24292f;--fg:#fff">${ic('github')}</div><div><h3>${t('gh.connectTitle')}</h3><div class="muted" style="font-size:13px">${t('gh.sub')}</div></div></div>
   <ol class="steps"><li>${t('gh.step1',{link:'<a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com → Settings → Tokens</a>'})}</li><li>${t('gh.step2')}</li><li>${t('gh.step3')}</li></ol>
   <label class="field"><span>Personal access token</span><input id="ghT" type="password" placeholder="github_pat_…" autocapitalize="off" autocomplete="off"></label>
   <button class="bigbtn" data-act="gh-save">${ic('github')}${t('gh.connect')}</button>`);
}
async function ghSave(){
  const tok=$('#ghT').value.trim();if(!tok){toast(t('gh.pasteToken'));return}
  const btn=$('[data-act=gh-save]');btn.disabled=true;btn.innerHTML='<span class="spin"></span>'+t('gh.checking');
  S.gh={token:tok};
  try{const u=await gh('/user');S.gh={token:tok,login:u.login,avatar:u.avatar_url,name:u.name||u.login};save();toast(t('gh.connected',{login:u.login}));settingsSheet()}
  catch(e){S.gh=null;btn.disabled=false;btn.innerHTML=ic('github')+t('gh.connect');toast(t('common.error',{msg:e.message}))}
}
async function ghCloneSheet(){
  if(!S.gh){ghConnectSheet();return}
  openSheet(`<h3>${t('gh.cloneTitle')}</h3><p class="muted">${t('gh.reposOf',{login:esc(S.gh.login)})}</p><div id="repoList"><div class="thinking"><span class="spin"></span>${t('common.loading')}</div></div>`);
  try{const repos=await gh('/user/repos?sort=updated&per_page=50');
    $('#repoList').innerHTML=`<div style="margin-top:12px">${repos.map(r=>{const L=LANGS.find(l=>l.name===r.language);return`<div class="item" data-act="gh-do-clone" data-full="${esc(r.full_name)}" data-br="${esc(r.default_branch)}">${tile(L||null)}<div class="grow"><div class="nm">${esc(r.name)} ${r.private?'🔒':''}</div><div class="sub">${esc(r.language||'—')} · ${ago(new Date(r.updated_at).getTime())}</div></div>${ic('download')}</div>`}).join('')||`<div class="empty">${t('gh.noRepos')}</div>`}</div>`}
  catch(e){$('#repoList').innerHTML=`<div class="note">${ic('info')}<div>${esc(t('common.error',{msg:e.message}))}</div></div>`}
}
async function ghClone(full,branch){
  $('#sheetBody').innerHTML=`<h3>${t('gh.cloning',{repo:esc(full)})}</h3><div class="thinking"><span class="spin"></span><span id="clP">${t('gh.fetchTree')}</span></div>`;
  try{
    const tree=await gh(`/repos/${full}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
    const blobs=tree.tree.filter(x=>x.type==='blob'&&x.size<300000&&!TEXT_EXT.test(x.path)&&!/(^|\/)(node_modules|\.git)\//.test(x.path)).slice(0,120);
    const files={};let done=0;
    for(let i=0;i<blobs.length;i+=6){await Promise.all(blobs.slice(i,i+6).map(async b=>{
      const j=await gh(`/repos/${full}/git/blobs/${b.sha}`);const bin=atob(j.content.replace(/\n/g,''));const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
      const txt=new TextDecoder().decode(bytes);if(!txt.includes('\u0000'))files[b.path]=txt;
      done++;const e=$('#clP');if(e)e.textContent=t('gh.filesProgress',{done,total:blobs.length})}))}
    const p={id:uid(),name:full.split('/')[1],lang:guessLang(Object.keys(files)),files,dirs:tree.tree.filter(x=>x.type==='tree').map(x=>x.path),open:[],updated:Date.now(),gh:{full,branch,paths:Object.keys(files)}};
    S.projects.unshift(p);S.cur={p:p.id,f:''};save();closeSheet();show('editor');toast(t('gh.cloned',{files:tn('files',Object.keys(files).length)}));
  }catch(e){$('#sheetBody').innerHTML=`<h3>${t('gh.cloneError')}</h3><p class="muted">${esc(e.message)}</p><button class="bigbtn sec" data-act="close-sheet">${t('common.close')}</button>`}
}
function ghPushSheet(){
  const p=P();
  openSheet(`<h3>${t('gh.commitPush')}</h3><p class="muted">${esc(p.gh.full)} → <b>${esc(p.gh.branch)}</b></p>
   <label class="field"><span>${t('gh.commitMsg')}</span><input id="cmM" value="Update from Codeum"></label>
   <button class="bigbtn" data-act="gh-do-push">${ic('push')}${t('gh.send')}</button>`);
}
async function ghPush(){
  const p=P(),{full,branch}=p.gh,msg=$('#cmM').value.trim()||'Update from Codeum';
  const btn=$('[data-act=gh-do-push]');btn.disabled=true;btn.innerHTML='<span class="spin"></span>'+t('gh.sending');
  try{
    const ref=await gh(`/repos/${full}/git/ref/heads/${encodeURIComponent(branch)}`);
    const head=await gh(`/repos/${full}/git/commits/${ref.object.sha}`);
    const items=Object.entries(p.files).map(([path,content])=>({path,mode:'100644',type:'blob',content}));
    (p.gh.paths||[]).filter(x=>p.files[x]==null).forEach(path=>items.push({path,mode:'100644',type:'blob',sha:null}));
    const tree=await gh(`/repos/${full}/git/trees`,{method:'POST',body:JSON.stringify({base_tree:head.tree.sha,tree:items})});
    const c=await gh(`/repos/${full}/git/commits`,{method:'POST',body:JSON.stringify({message:msg,tree:tree.sha,parents:[ref.object.sha]})});
    await gh(`/repos/${full}/git/refs/heads/${encodeURIComponent(branch)}`,{method:'PATCH',body:JSON.stringify({sha:c.sha})});
    p.gh.paths=Object.keys(p.files);save();closeSheet();toast(t('gh.pushed',{sha:c.sha.slice(0,7)}));
  }catch(e){btn.disabled=false;btn.innerHTML=ic('push')+t('gh.send');toast(t('common.error',{msg:e.message}))}
}

/* ============ ИИ ============ */
const AI_PROV={
  claude:{name:'Claude',def:'claude-opus-5',link:'https://console.anthropic.com/settings/keys',ph:'sk-ant-…'},
  openai:{name:'OpenAI',def:'gpt-5-mini',link:'https://platform.openai.com/api-keys',ph:'sk-…'},
  gemini:{name:'Gemini',def:'gemini-2.5-flash',link:'https://aistudio.google.com/apikey',ph:'AIza…'}
};
const aiModel=()=>S.ai.model[S.ai.prov]||AI_PROV[S.ai.prov].def;
const aiSys=()=>`You are the AI assistant inside Codeum, a mobile IDE. The user writes code on a phone. Reply in ${LANG_EN_NAME[LG]||'English'}, briefly and to the point. Always put code in fenced blocks with the language name.`;
async function aiCall(prompt){
  const k=S.ai.keys[S.ai.prov],m=aiModel(),sys=aiSys();
  if(S.ai.prov==='claude'){
    const fb=/^claude-(opus-5|fable-5-1)$/.test(m);
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true',...(fb?{'anthropic-beta':'server-side-fallback-2026-07-01'}:{})},
      body:JSON.stringify({model:m,max_tokens:16000,system:sys,messages:[{role:'user',content:prompt}],...(fb?{fallbacks:'default'}:{})})});
    const j=await r.json();if(!r.ok)throw new Error(j.error?.message||'HTTP '+r.status);
    if(j.stop_reason==='refusal')throw new Error(t('ai.refusal'));
    return j.content.filter(b=>b.type==='text').map(b=>b.text).join('');
  }
  if(S.ai.prov==='openai'){
    const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+k},body:JSON.stringify({model:m,messages:[{role:'system',content:sys},{role:'user',content:prompt}]})});
    const j=await r.json();if(!r.ok)throw new Error(j.error?.message||'HTTP '+r.status);return j.choices[0].message.content;
  }
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':k},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents:[{role:'user',parts:[{text:prompt}]}]})});
  const j=await r.json();if(!r.ok)throw new Error(j.error?.message||'HTTP '+r.status);return(j.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('');
}
function aiSetupSheet(){
  const pv=AI_PROV[S.ai.prov];
  openSheet(`<div style="display:flex;gap:12px;align-items:center"><div class="tile lg" style="--c:var(--accent);--fg:#fff">${ic('spark')}</div><div><h3>${t('ai.title')}</h3><div class="muted" style="font-size:13px">${t('ai.sub')}</div></div></div>
   <div class="field"><span>${t('ai.provider')}</span><div class="seg full">${Object.entries(AI_PROV).map(([k,v])=>`<button class="${S.ai.prov===k?'on':''}" data-act="ai-prov" data-k="${k}">${v.name}</button>`).join('')}</div></div>
   <label class="field"><span>${t('ai.key',{prov:pv.name})} · <a href="${pv.link}" target="_blank" rel="noopener">${t('ai.getKey')}</a></span><input id="aiK" type="password" placeholder="${pv.ph}" value="${esc(S.ai.keys[S.ai.prov]||'')}" autocapitalize="off" autocomplete="off"></label>
   <label class="field"><span>${t('ai.model')}</span><input id="aiM" value="${esc(aiModel())}" autocapitalize="off" style="font-family:'JetBrains Mono';font-size:14px"></label>
   <div class="note">${ic('lock')}<div>${t('ai.note')}</div></div>
   <button class="bigbtn" data-act="ai-save">${t('common.save')}</button>`);
}
let aiLast='',aiBlocks=[];
function mdLite(s){
  const parts=s.split(/```(\w*)\n?([\s\S]*?)```/g);let h='';
  for(let i=0;i<parts.length;i++){
    if(i%3===0){h+=parts[i].trim().split(/\n{2,}/).filter(Boolean).map(x=>'<p>'+esc(x).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\n/g,'<br>')+'</p>').join('')}
    else if(i%3===2){const L=LANGS.find(l=>l.id===parts[i-1]||l.name.toLowerCase()===parts[i-1]||l.ext===parts[i-1])||langOf(S.cur.f||'');const n=aiBlocks.push(parts[i])-1;
      h+=`<div class="ai-code"><pre>${highlight(parts[i].replace(/\n$/,''),L,false)}</pre><div><button data-act="ai-insert" data-n="${n}">${t('ai.insert')}</button><button data-act="ai-replace" data-n="${n}">${t('ai.replace')}</button><button data-act="ai-copy" data-n="${n}">${t('ai.copy')}</button></div></div>`}
  }
  return h;
}
function aiSheet(){
  if(!S.ai.keys[S.ai.prov]){aiSetupSheet();toast(t('ai.needKey'));return}
  const p=P();const has=p&&S.cur.f;
  openSheet(`<div style="display:flex;gap:12px;align-items:center"><div class="tile" style="--c:var(--accent);--fg:#fff">${ic('spark')}</div><div class="grow"><h3 style="margin:0">${t('ai.title')}</h3><div class="muted" style="font-size:12px;font-family:'JetBrains Mono'">${AI_PROV[S.ai.prov].name} · ${esc(aiModel())}</div></div><button class="icon-btn" data-act="ai-setup">${ic('key')}</button></div>
   ${has?`<div class="chips wrap" style="margin-top:14px">${['explain','bugs','comments','optimize','tests'].map(q=>`<button class="fchip" data-act="ai-quick" data-q="${q}">${t('ai.q.'+q)}</button>`).join('')}</div>`:''}
   <label class="field"><span>${has?t('ai.askFile',{file:esc(base(S.cur.f))}):t('ai.ask')}</span><textarea id="aiQ" placeholder="${esc(t('ai.placeholder'))}"></textarea></label>
   <button class="bigbtn" data-act="ai-ask" id="aiBtn">${ic('spark')}${t('ai.send')}</button>
   <div id="aiOut" class="ai-out">${aiLast}</div>`);
}
async function aiAsk(q){
  q=(q||$('#aiQ').value).trim();if(!q){toast(t('ai.empty'));return}
  const p=P(),f=S.cur.f,L=f&&langOf(f);
  const sel=ta.value.slice(ta.selectionStart,ta.selectionEnd);
  const prompt=f&&p?`${q}\n\nFile: ${f} (${L?L.name:'text'})${sel?'\nSelected fragment:\n```\n'+sel+'\n```':''}\n\n\`\`\`${L?L.ext:''}\n${p.files[f]}\n\`\`\``:q;
  const btn=$('#aiBtn');btn.disabled=true;$('#aiOut').innerHTML=`<div class="thinking"><span class="spin"></span>${t('ai.thinking')}</div>`;
  try{const s=await aiCall(prompt);aiBlocks=[];aiLast=mdLite(s);$('#aiOut').innerHTML=aiLast}
  catch(e){$('#aiOut').innerHTML=`<div class="note">${ic('info')}<div>${esc(t('common.error',{msg:e.message}))}</div></div>`}
  btn.disabled=false;
}

/* ============ нижние окна ============ */
const card=$('#sheetCard');
function openSheet(h){$('#sheetBody').innerHTML=h;card.style.transform='';card.style.transition='';$('#sheet').classList.add('on');card.scrollTop=0}
function closeSheet(){$('#sheet').classList.remove('on');card.style.transform='';card.style.transition=''}
/* закрытие свайпом вниз — как в системных окнах Android */
(()=>{let y0=null,dy=0,drag=false,t0=0;
  card.addEventListener('touchstart',e=>{y0=e.touches[0].clientY;dy=0;drag=false;t0=Date.now()},{passive:true});
  card.addEventListener('touchmove',e=>{
    if(y0==null)return;const d=e.touches[0].clientY-y0;
    if(!drag){
      const tgt=e.target,inText=tgt.closest&&tgt.closest('textarea');
      if(d>8&&card.scrollTop<=0&&!inText)drag=true;else if(Math.abs(d)>8){y0=null;return}else return;
    }
    dy=Math.max(0,d);card.style.transition='none';card.style.transform=`translateY(${dy}px)`;e.preventDefault();
  },{passive:false});
  card.addEventListener('touchend',()=>{
    if(drag){const fast=dy>40&&Date.now()-t0<250;card.style.transition='transform .22s cubic-bezier(.2,.8,.2,1)';
      if(dy>110||fast){card.style.transform='translateY(110%)';setTimeout(closeSheet,200)}else card.style.transform=''}
    y0=null;drag=false;
  });
})();
function confirmSheet(title,text,btn,fn){openSheet(`<h3>${title}</h3><p class="muted">${text}</p><button class="bigbtn danger" id="cfYes">${btn}</button><button class="bigbtn sec" data-act="close-sheet">${t('common.cancel')}</button>`);$('#cfYes').onclick=()=>{closeSheet();fn()}}
function settingsSheet(){
  const s=S.settings,cur=UI_LANGS.find(x=>x[0]===LG);
  openSheet(`<h3>${t('settings.title')}</h3>
   <div class="sect" style="margin:16px 0 2px">${t('settings.profile')}</div>
   <button class="row" data-act="nick-edit"><span class="rl"><span class="ri" style="color:var(--accent)">${ic('user')}</span><span>${t('settings.nick')}<small>${esc(NICK())}</small></span></span><span class="rv">${t('common.change')}${ic('right')}</span></button>
   <button class="row" data-act="lang-pick"><span class="rl"><span class="ri">${flag(LG,'sm')}</span><span>${t('settings.language')}<small>${cur?cur[2]:''}</small></span></span><span class="rv">${t('common.change')}${ic('right')}</span></button>
   <div class="row"><span class="rl"><span class="ri" style="color:var(--accent2)">${ic('term')}</span>${t('settings.terminal')}</span><div class="seg">${OS_LIST.map(([k,n])=>`<button class="${OS()===k?'on':''}" data-act="set-os" data-k="${k}">${n}</button>`).join('')}</div></div>
   <div class="sect" style="margin:22px 0 2px">${t('settings.accounts')}</div>
   <button class="row" data-act="${S.gh?'gh-off':'gh-connect'}"><span class="rl">${S.gh&&S.gh.avatar?`<img class="avatar" src="${esc(S.gh.avatar)}" alt="">`:`<span class="ri">${ic('github')}</span>`}<span>GitHub<small>${S.gh?t('gh.connectedAs',{login:esc(S.gh.login)}):t('gh.sub')}</small></span></span><span class="rv">${S.gh?t('gh.disconnect'):t('gh.connect')}${ic('right')}</span></button>
   <button class="row" data-act="ai-setup"><span class="rl"><span class="ri" style="color:var(--accent)">${ic('spark')}</span><span>${t('ai.title')}<small>${S.ai.keys[S.ai.prov]?AI_PROV[S.ai.prov].name+' · '+esc(aiModel()):t('ai.connectHint')}</small></span></span><span class="rv">${S.ai.keys[S.ai.prov]?t('ai.keyAdded'):t('ai.setup')}${ic('right')}</span></button>
   <div class="sect" style="margin:22px 0 2px">${t('settings.home')}</div>
   <div class="row">${t('settings.greeting')}<button class="sw ${s.greet?'on':''}" data-act="toggle" data-k="greet"></button></div>
   <button class="row" data-act="widget"><span class="rl"><span class="ri" style="color:var(--accent2)">${ic('widget')}</span><span>${t('widget.title')}<small>${t(s.wInt==='5h'?'widget.every5h':'widget.everyDay')}</small></span></span><span class="rv">${ic('right')}</span></button>
   <div class="sect" style="margin:22px 0 10px">${t('settings.theme')}</div>
   <div class="tgrid">${Object.keys(THEMES).map(k=>{const v=themeVars(k);return`<button class="tcard" data-act="theme" data-t="${k}" style="background:${v.panel};color:${v.text};border-color:${s.theme===k?v.accent:v.line}">${THEMES[k][0]}<pre><span style="color:${v.kw}">const</span> <span style="color:${v.fn}">run</span> = <span style="color:${v.num}">42</span>\n<span style="color:${v.com}">// ${k}</span> <span style="color:${v.str}">"ok"</span></pre></button>`}).join('')}</div>
   <div class="sect" style="margin:22px 0 2px">${t('settings.editor')}</div>
   <div class="row">${t('settings.fontSize')} <span style="display:flex;align-items:center;gap:10px"><input type="range" min="10" max="20" value="${s.fs}" id="fsR"><b id="fsV" style="width:22px">${s.fs}</b></span></div>
   <div class="row">${t('settings.indent')}<div class="seg">${[2,4].map(n=>`<button class="${s.tab===n?'on':''}" data-act="tabsize" data-n="${n}">${n}</button>`).join('')}</div></div>
   <div class="row">${t('settings.lineNumbers')}<button class="sw ${s.lines?'on':''}" data-act="toggle" data-k="lines"></button></div>
   <div class="row">${t('settings.symbolBar')}<button class="sw ${s.keys?'on':''}" data-act="toggle" data-k="keys"></button></div>
   <div class="sect" style="margin:22px 0 2px">${t('settings.about')}</div>
   <button class="row" data-act="upd-check"><span class="rl"><span class="ri" style="color:var(--accent)">${ic('download')}</span><span>Codeum v${esc(curVersion())}<small>${NATIVE?'Android · '+esc(NV.abi()):t('settings.webPreview')}</small></span></span><span class="rv">${t('upd.check')}${ic('right')}</span></button>
   <button class="bigbtn sec" data-act="reset" style="color:#e5484d">${t('settings.reset')}</button>`);
  $('#fsR').oninput=e=>{S.settings.fs=+e.target.value;$('#fsV').textContent=e.target.value;applySettings();save()};
}
function langPickSheet(){
  openSheet(`<h3>${t('settings.language')}</h3><div class="uilangs">${UI_LANGS.map(([c,f,n])=>`<button class="uilang ${c===LG?'on':''}" data-act="set-lang" data-k="${c}">${flag(c)}${n}${c===LG?ic('check'):''}</button>`).join('')}</div>`);
}
function setLang(code){
  LG=code;S.settings.lang=code;save();applyI18n();
  if(NATIVE)try{NV.setLanguage(code)}catch{}
  if(pty.alive)NV.writeShellRc(shellRc());
  show(view);
}
function widgetSheet(){
  const now=new Date(),loc=LOCALE[LG],hm=now.toLocaleTimeString(loc,{hour:'2-digit',minute:'2-digit'}),dt=now.toLocaleDateString(loc,{weekday:'long',day:'numeric',month:'long'});
  const apps=n=>Array.from({length:n},()=>'<div class="hs-app"><i></i></div>').join('');
  openSheet(`<h3>${t('widget.title')}</h3><p class="muted">${t('widget.sub')}</p>
   <div class="sect" style="margin:16px 0 10px">${t('widget.looks')}</div>
   <div class="homescreen"><div class="hs-status"><span>${hm}</span><span>5G ▮▮▮ 87%</span></div>
    <div class="hs-clock">${hm}</div><div class="hs-date">${dt}</div>
    ${widgetHTML()}
    <div class="hs-row">${apps(3)}<div class="hs-app">${document.querySelector('header .logo').outerHTML}Codeum</div></div>
    <div class="hs-row">${apps(4)}</div></div>
   <div class="sect" style="margin:18px 0 10px">${t('widget.small')}</div>
   <div class="homescreen" style="padding-top:16px"><div class="hs-pair">${widgetHTML(true)}<div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:10px;align-content:center">${apps(4)}</div></div></div>
   <div class="field"><span>${t('widget.howOften')}</span><div class="seg full"><button class="${S.settings.wInt==='day'?'on':''}" data-act="w-int" data-v="day">${t('widget.day')}</button><button class="${S.settings.wInt==='5h'?'on':''}" data-act="w-int" data-v="5h">${t('widget.h5')}</button></div></div>
   <button class="bigbtn" data-act="w-add" data-s="0">${ic('widget')}${t('widget.addLarge')}</button>
   <button class="bigbtn sec" data-act="w-add" data-s="1">${t('widget.addSmall')}</button>
   <div class="note">${ic('info')}<div>${t('widget.note')}</div></div>`);
}
function hostSheet(){
  openSheet(`<h3>${t('host.title')}</h3><p class="muted">${t('host.sub')}</p>
   <label class="field"><span>${t('np.name')}</span><input id="hN" placeholder="my-vps"></label>
   <label class="field"><span>${t('host.address')}</span><input id="hH" placeholder="203.0.113.10" autocapitalize="off"></label>
   <div style="display:flex;gap:10px"><label class="field" style="flex:2"><span>${t('host.user')}</span><input id="hU" value="root" autocapitalize="off"></label><label class="field" style="flex:1"><span>${t('host.port')}</span><input id="hP" value="22" inputmode="numeric"></label></div>
   <button class="bigbtn" data-act="host-save">${t('common.save')}</button>`);
}
function applySettings(){
  const v=themeVars(S.settings.theme),r=document.documentElement.style;
  TH_KEYS.forEach(k=>r.setProperty('--'+k,v[k]));r.setProperty('--fs',S.settings.fs+'px');
  $('meta[name=theme-color]').content=v.bg;
  if(NATIVE)try{NV.setBars(v.bg,S.settings.theme==='paper')}catch{}
  document.body.classList.toggle('nolines',!S.settings.lines);document.body.classList.toggle('nokeys',!S.settings.keys);
  if(view==='editor')requestAnimationFrame(sync);
}

/* ============ действия ============ */
const ACT={
  go:d=>{closeSheet();show(d.v)},
  'go-store':()=>{closeSheet();show('store')},
  'close-sheet':closeSheet,
  settings:settingsSheet,
  widget:widgetSheet,
  'lang-pick':langPickSheet,
  'set-lang':d=>{setLang(d.k);settingsSheet()},
  'w-int':d=>{S.settings.wInt=d.v;save();NATIVE&&NV.setWidgetInterval(d.v);widgetSheet()},
  'w-add':d=>{if(!NATIVE){toast(t('widget.webOnly'));return}
    if(!NV.pinWidget(d.s==='1'))toast(t('widget.noPin'))},
  'new-proj':newProjSheet,
  'np-lang':d=>{npLang=d.id;$$('.lpick').forEach(b=>b.classList.toggle('on',b.dataset.id===d.id))},
  'np-create':()=>{if(!npLang)return;const n=($('#npName').value.trim()||'my-'+npLang+'-app').replace(/[^\p{L}\p{N}_.-]+/gu,'-');const p=mkProject(n,npLang);S.projects.unshift(p);S.cur={p:p.id,f:LANG[npLang].file};save();closeSheet();show('editor');toast(t('np.created',{name:n}))},
  'open-proj':d=>{const p=S.projects.find(x=>x.id===d.id);S.cur={p:p.id,f:''};ensureCur(p);save();show('editor')},
  'del-proj':d=>{const p=S.projects.find(x=>x.id===d.id);confirmSheet(t('proj.delTitle'),t('proj.delText',{name:esc(p.name)}),t('common.delete'),()=>{S.projects=S.projects.filter(x=>x.id!==d.id);if(S.cur.p===d.id)S.cur={p:S.projects[0]&&S.projects[0].id,f:''};save();renderProjects();toast(t('proj.deleted'))})},
  'open-file':()=>{importTarget=P()?'current':'new';$('#fileIn').click()},
  'import-here':()=>{importTarget='current';$('#fileIn').click()},
  'open-dir':()=>NATIVE?NV.pickFolder():$('#dirIn').click(),
  tab:d=>openFile(d.f),
  'tab-close':d=>{const p=P();p.open=p.open.filter(f=>f!==d.f);if(S.cur.f===d.f)S.cur.f=p.open[p.open.length-1]||'';save();lineCount=0;
    if(!S.cur.f){renderEditor();$('#edEmpty').hidden=false;$('#edEmpty').innerHTML=`<div>${t('ed.allClosed')}<br><br><button class="btn pri" data-act="drawer" style="margin:auto">${ic('sidebar')}${t('ed.projectFiles')}</button></div>`}else renderEditor()},
  drawer:()=>$('#app').classList.toggle('drawer-on'),
  'dir-toggle':d=>{const k=P().id+':'+d.d;collapsed.has(k)?collapsed.delete(k):collapsed.add(k);renderDrawer()},
  'new-file':d=>newFileSheet(d.dir||''),
  'nf-ext':d=>{nf.ext=d.e;$$('[data-act=nf-ext]').forEach(b=>b.classList.toggle('on',b.dataset.e===d.e));nfPrev()},
  'nf-dir':d=>{nf.dir=d.d;$$('[data-act=nf-dir]').forEach(b=>b.classList.toggle('on',b.dataset.d===d.d));nfPrev()},
  'nf-create':()=>{const p=P(),path=nfPath();if(p.files[path]!=null){toast(t('nf.exists'));return}p.files[path]='';p.updated=Date.now();closeSheet();openFile(path);toast(t('nf.created',{path}))},
  'new-dir':newDirSheet,
  'nd-dir':d=>{nf.dir=d.d;$$('[data-act=nd-dir]').forEach(b=>b.classList.toggle('on',b.dataset.d===d.d))},
  'nd-create':()=>{const p=P(),n=$('#ndN').value.trim().replace(/^\/+|\/+$/g,'');if(!n){toast(t('nd.needName'));return}const path=(nf.dir?nf.dir+'/':'')+n;p.dirs=[...new Set([...(p.dirs||[]),path])];save();closeSheet();renderDrawer();toast(t('nd.created',{path}))},
  'del-file':d=>{const p=P();confirmSheet(t('ed.delFileTitle'),esc(d.f),t('common.delete'),()=>{delete p.files[d.f];save();renderEditor()})},
  'del-dir':d=>{const p=P(),pre=d.d+'/';const n=Object.keys(p.files).filter(f=>f.startsWith(pre)).length;
    confirmSheet(t('ed.delDirTitle'),`${esc(d.d)}/ · ${tn('files',n)}`,t('common.delete'),()=>{Object.keys(p.files).forEach(f=>{if(f.startsWith(pre))delete p.files[f]});p.dirs=(p.dirs||[]).filter(x=>x!==d.d&&!x.startsWith(pre));save();renderEditor()})},
  undo:()=>{ta.focus();document.execCommand('undo')},
  find:()=>{const f=$('#findbar');f.hidden=!f.hidden;if(!f.hidden)$('#fq').focus()},
  'find-next':()=>find(true),
  run:async()=>{clearTimeout(saveT);save();if(!NATIVE)show('term');await runFile(S.cur.f)},
  'term-clear':()=>{if(NATIVE&&xt){xt.clear();pty.alive&&NV.ptyWrite('\x0c')}else term.innerHTML=''},
  sf:d=>{sf=d.k;$$('#storeCats .fchip').forEach(b=>b.classList.toggle('on',b.dataset.k===d.k));renderStoreList()},
  install:d=>installLang(d.id),
  'lang-info':d=>langInfo(d.id),
  'lang-new':d=>{npLang=d.id;newProjSheet()},
  uninstall:d=>{if(NATIVE)NV.uninstall(d.id);S.installed=S.installed.filter(x=>x!==d.id);save();closeSheet();renderStoreList();toast(t('store.removed',{lang:LANG[d.id].name}))},
  theme:d=>{S.settings.theme=d.t;save();applySettings();settingsSheet()},
  tabsize:d=>{S.settings.tab=+d.n;save();settingsSheet();if(view==='editor')renderEditor()},
  toggle:d=>{S.settings[d.k]=!S.settings[d.k];save();applySettings();settingsSheet();if(view==='home')renderHome()},
  reset:()=>confirmSheet(t('settings.resetTitle'),t('settings.resetText'),t('settings.resetBtn'),()=>{try{Object.keys(localStorage).filter(k=>k.startsWith('codeum3.')).forEach(k=>localStorage.removeItem(k))}catch{}location.reload()}),
  'gh-connect':ghConnectSheet,
  'gh-save':ghSave,
  'gh-off':()=>confirmSheet(t('gh.offTitle'),t('gh.offText'),t('gh.disconnect'),()=>{S.gh=null;save();toast(t('gh.off'))}),
  'gh-clone':ghCloneSheet,
  'gh-do-clone':d=>ghClone(d.full,d.br),
  'gh-push':ghPushSheet,
  'gh-do-push':ghPush,
  ai:aiSheet,
  'ai-setup':aiSetupSheet,
  'ai-prov':d=>{S.ai.prov=d.k;save();aiSetupSheet()},
  'ai-save':()=>{const k=$('#aiK').value.trim(),m=$('#aiM').value.trim();if(k)S.ai.keys[S.ai.prov]=k;else delete S.ai.keys[S.ai.prov];S.ai.model[S.ai.prov]=m||AI_PROV[S.ai.prov].def;save();toast(k?t('ai.connected',{prov:AI_PROV[S.ai.prov].name}):t('ai.keyRemoved'));if(k&&view==='editor')aiSheet();else closeSheet()},
  'ai-quick':d=>aiAsk(t('ai.q.'+d.q)),
  'ai-ask':()=>aiAsk(),
  'ai-insert':d=>{closeSheet();show('editor');ins(aiBlocks[+d.n])},
  'ai-replace':d=>{closeSheet();show('editor');ta.focus();ta.select();ins(aiBlocks[+d.n])},
  'ai-copy':d=>{navigator.clipboard?.writeText(aiBlocks[+d.n]).then(()=>toast(t('ai.copied')),()=>toast(t('ai.copyFail')))},
  host:hostSheet,
  'host-save':()=>{const h={name:$('#hN').value.trim()||'server',host:$('#hH').value.trim(),user:$('#hU').value.trim()||'root',port:$('#hP').value.trim()||'22'};if(!h.host){toast(t('host.needAddress'));return}S.hosts.push(h);save();closeSheet();renderHome();toast(t('host.saved'))},
  'host-del':d=>{S.hosts.splice(+d.i,1);save();renderHome()},
  'host-go':async d=>{const h=S.hosts[+d.i];
    if(!NATIVE){show('term');outPrompt(`ssh ${h.user}@${h.host} -p ${h.port}`);out(t('host.webOnly'),'w');return}
    show('term');if(!await ptyEnsure())return;
    // ssh-клиент ставится автоматически при первом подключении
    NV.ptyWrite('\x15'+`command -v ssh >/dev/null || apk add -q openssh-client; ssh -o StrictHostKeyChecking=accept-new -p ${shq(h.port)} ${shq(h.user+'@'+h.host)}\r`);xt.focus()}
};
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a)return;const f=ACT[a.dataset.act];if(f){e.preventDefault();f(a.dataset,a,e)}});

/* ============ экран и клавиатура ============ */
const vv=window.visualViewport;
function fit(){document.documentElement.style.setProperty('--vh',(vv?vv.height:innerHeight)+'px');if(vv)window.scrollTo(0,0)}
if(vv){vv.addEventListener('resize',fit)}window.addEventListener('resize',fit);fit();
const isTyping=el=>el===ta||el===tin||!!(el&&el.closest&&el.closest('#xterm'));
document.addEventListener('focusin',e=>{if(isTyping(e.target))document.body.classList.add('kb')});
document.addEventListener('focusout',()=>setTimeout(()=>{if(!isTyping(document.activeElement))document.body.classList.remove('kb')},50));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
setInterval(()=>{if(view==='home'&&!$('#sheet').classList.contains('on'))renderHome()},60000);

/* ============ первый запуск: язык → ник → языки → терминал ============ */
const OS_LIST=[['windows','Windows'],['linux','Linux'],['mac','macOS']];
const OS_DESC={windows:'dir, cls, type',linux:'ls, clear, cat',mac:'ls, open, brew'};
const OS_ICON={
  windows:'<svg class="i" viewBox="0 0 24 24"><path fill="#4aa3ff" d="M3 5.5l7.5-1v7H3zM11.5 4.3L21 3v8.5h-9.5zM3 12.5h7.5v7L3 18.5zM11.5 12.5H21V21l-9.5-1.3z"/></svg>',
  linux:'<span style="color:#e95420;display:flex">'+ic('term')+'</span>',
  mac:'<span style="font-size:18px;width:20px;text-align:center;line-height:1">⌘</span>'};
const NICK_RE=/^[\p{L}\p{N}_.\-]{2,20}$/u;
const onb={step:0,nick:'',langs:new Set(),os:'linux'};
const onbCan=L=>!S.installed.includes(L.id)&&(NATIVE?!L.soon:(L.id==='js'||L.id==='py'));
function osMini(k,n){
  n=esc(n||'coder');
  if(k==='windows')return`<div class="mini"><div class="bar" style="background:#1f1f1f;color:#ddd"><b style="background:#2a6fd6;color:#fff;border-radius:3px;padding:0 3px;font-size:8px">PS</b>PowerShell</div><pre style="background:#012456;color:#eee">PS C:\\Users\\${n}&gt; dir\nmain.py   README.md</pre></div>`;
  if(k==='mac')return`<div class="mini"><div class="bar" style="background:linear-gradient(#3a3a3a,#2e2e2e);color:#bbb"><i style="width:8px;height:8px;border-radius:50%;background:#ff5f57"></i><i style="width:8px;height:8px;border-radius:50%;background:#febc2e"></i><i style="width:8px;height:8px;border-radius:50%;background:#28c840"></i>&nbsp;zsh</div><pre style="background:#1e1e1e;color:#f2f2f2">${n}@Codeum-Phone ~ % ls\nmain.py   README.md</pre></div>`;
  return`<div class="mini"><div class="bar" style="background:#2c2c2c;color:#ddd">${n}@codeum: ~</div><pre style="background:#300a24;color:#eee"><b style="color:#8ae234">${n}@codeum</b>:<b style="color:#729fcf">~</b>$ ls\nmain.py   README.md</pre></div>`;
}
function renderOnb(){
  const el=$('#onb');el.hidden=false;
  const dots=[0,1,2,3].map(i=>`<i class="${i===onb.step?'on':''}"></i>`).join('');
  const back=onb.step>0?`<button class="icon-btn" data-act="onb-back" aria-label="${esc(t('common.back'))}">${ic('back')}</button>`:'<span style="width:38px"></span>';
  let body='';
  if(onb.step===0){
    body=`<div class="logo onb-logo">${$('header .logo').innerHTML}</div>
     <h1 style="text-align:center">${t('onb.langTitle')}</h1>
     <div class="uilangs">${UI_LANGS.map(([c,f,n])=>`<button class="uilang ${c===LG?'on':''}" data-act="onb-uilang" data-k="${c}">${flag(c)}${n}${c===LG?ic('check'):''}</button>`).join('')}</div>
     <div class="onb-foot"><button class="bigbtn" data-act="onb-next">${t('onb.next')}</button></div>`;
  }else if(onb.step===1){
    body=`<div class="logo onb-logo">${$('header .logo').innerHTML}</div>
     <h1 style="text-align:center">${t('onb.hello')}</h1>
     <p class="lead" style="text-align:center">${t('onb.helloSub')}</p>
     <label class="nick-in"><span>@</span><input id="onbNick" maxlength="20" placeholder="${esc(t('onb.nickPh'))}" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="next" value="${esc(onb.nick)}"></label>
     <div class="onb-hint" id="onbHint"></div>
     <div class="onb-prev" id="onbPrev"></div>
     <div class="onb-foot"><button class="bigbtn" data-act="onb-next" id="onbNext">${t('onb.next')}</button></div>`;
  }else if(onb.step===2){
    const list=[...LANGS].sort((a,b)=>(onbCan(b)?1:0)-(onbCan(a)?1:0));
    const sel=[...onb.langs],total=sel.reduce((s,id)=>s+sizeOf(LANG[id]),0);
    const tag=L=>S.installed.includes(L.id)?t('store.installed'):!onbCan(L)?(NATIVE?t('store.soon'):'APK'):sizeOf(L)?'~'+mb(sizeOf(L)):t('onb.instant');
    body=`<h1>${t('onb.langsTitle')}</h1>
     <p class="lead">${t('onb.langsSub')}</p>
     <div class="lsel">${list.map(L=>`<button class="${onb.langs.has(L.id)?'on':''}" data-act="onb-lang" data-id="${L.id}" ${onbCan(L)?'':'disabled'}>${tile(L)}${L.name}<small>${tag(L)}</small></button>`).join('')}</div>
     <div class="onb-foot"><button class="bigbtn" data-act="onb-next" ${sel.length?'':'disabled'}>${sel.length?`${ic('download')}${t('onb.installN',{n:sel.length,size:mb(total)})}`:t('onb.pickLangs')}</button>
      <button class="skip" data-act="onb-skip">${t('onb.skip')}</button></div>`;
  }else{
    body=`<h1>${t('onb.osTitle')}</h1>
     <p class="lead">${t('onb.osSub')}</p>
     <div class="oscards">${OS_LIST.map(([k,n])=>`<button class="oscard ${onb.os===k?'on':''}" data-act="onb-os" data-k="${k}"><div class="nm">${OS_ICON[k]}${n}<small>${OS_DESC[k]}</small></div>${osMini(k,onb.nick)}</button>`).join('')}</div>
     <div class="onb-foot"><button class="bigbtn" data-act="onb-finish">${t('onb.start')}</button></div>`;
  }
  el.innerHTML=`<div class="onb-in"><div class="onb-top">${back}<div class="onb-dots">${dots}</div><span style="width:38px"></span></div><div class="onb-step">${body}</div></div>`;
  if(onb.step===1){
    const inp=$('#onbNick');
    const upd=()=>{onb.nick=inp.value.trim();const ok=NICK_RE.test(onb.nick),h=$('#onbHint');
      h.className='onb-hint'+(onb.nick&&!ok?' err':'');
      h.textContent=!onb.nick?t('onb.nickHint'):ok?t('onb.nickOk'):t('onb.nickRule');
      $('#onbNext').disabled=!ok;
      const n=esc(onb.nick||t('onb.nickPh'));
      $('#onbPrev').innerHTML=`<span class="p">${n}@codeum:~$</span> whoami<br>${n}`;};
    inp.oninput=upd;inp.onkeydown=e=>{if((e.key==='Enter'||e.keyCode===13)&&NICK_RE.test(onb.nick)){e.preventDefault();ACT['onb-next']()}};upd();
    setTimeout(()=>inp.focus(),350);
  }
}
function finishOnb(){
  S.settings.nick=onb.nick;S.settings.os=onb.os;S.onboarded=true;save();
  $('#onb').hidden=true;$('#onb').innerHTML='';
  term.innerHTML='';openLine=null;termBanner();show('home');
  const q=[...onb.langs].filter(id=>!S.installed.includes(id));
  toast(q.length?t('onb.doneInstalling',{nick:NICK()}):t('onb.welcome',{nick:NICK()}));
  if(q.length)(async()=>{for(const id of q)await installLang(id)})();
}

/* ============ обновления из GitHub Releases ============ */
const verNum=v=>String(v||'').replace(/^v/i,'').split(/[.\-+]/).slice(0,3).map(n=>parseInt(n,10)||0);
const newer=(a,b)=>{a=verNum(a);b=verNum(b);for(let i=0;i<3;i++)if(a[i]!==b[i])return a[i]>b[i];return false};
function curVersion(){return NATIVE?NV.version():APP_VERSION}
let UPD=store.get('upd',null),updating=false,updPct=0;
const hasUpdate=()=>!!(UPD&&UPD.tag&&newer(UPD.tag,curVersion()));
async function checkUpdate(force){
  if(!UPDATE_REPO){renderUpd();return false}
  if(!force&&UPD&&UPD.repo===UPDATE_REPO&&Date.now()-UPD.t<30*60e3){renderUpd();return hasUpdate()}
  try{
    const r=await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`,{headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const j=await r.json(),apk=(j.assets||[]).find(a=>/\.apk$/i.test(a.name));
    UPD={t:Date.now(),repo:UPDATE_REPO,tag:j.tag_name,name:j.name||j.tag_name,body:j.body||'',url:j.html_url,date:j.published_at,apk:apk&&apk.browser_download_url,size:apk&&apk.size};
    store.set('upd',UPD);
  }catch(e){if(force)throw e}
  renderUpd();return hasUpdate();
}
function renderUpd(){
  const on=view==='home'&&hasUpdate();$('#updBox').hidden=!on;
  if(!on){$('#updPanel').hidden=true;$('#updMore').classList.remove('open');return}
  $('#updBtn').innerHTML=updating?`<span class="spin" style="width:12px;height:12px"></span>${updPct}%`:ic('download')+t('upd.update');
  $('#updMore').innerHTML=ic('down');
}
function mdNotes(s){
  if(!String(s||'').trim())return`<p class="muted">${t('upd.noNotes')}</p>`;
  const inl=x=>esc(x).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>');
  let h='',ul=false;
  for(const raw of s.replace(/\r/g,'').split('\n')){
    const l=raw.trim(),li=l.match(/^[-*•]\s+(.*)/);
    if(li){if(!ul){h+='<ul>';ul=true}h+='<li>'+inl(li[1])+'</li>';continue}
    if(ul){h+='</ul>';ul=false}
    if(!l)continue;
    const hd=l.match(/^#{1,6}\s+(.*)/);h+=hd?`<span class="h">${inl(hd[1])}</span>`:`<p>${inl(l)}</p>`;
  }
  return h+(ul?'</ul>':'');
}
function updPanelHTML(){
  const d=UPD.date?new Date(UPD.date).toLocaleDateString(LOCALE[LG],{day:'numeric',month:'long',year:'numeric'}):'';
  return`<h4>${t('upd.whatsNewIn',{tag:esc(UPD.tag)})}</h4>
   <div class="meta">${UPD.name&&UPD.name!==UPD.tag?esc(UPD.name)+' · ':''}${d} · ${t('upd.yours',{v:esc(curVersion())})}</div>
   <div class="notes">${mdNotes(UPD.body)}</div>
   <button class="bigbtn" data-act="update">${ic('download')}${t('upd.updateTo',{tag:esc(UPD.tag)})}${UPD.size?' · '+mb((UPD.size/1048576).toFixed(1)):''}</button>
   <div class="note">${ic('lock')}<div>${t('upd.keep')}</div></div>`;
}
function doUpdate(){
  if(!UPD)return;
  if(NATIVE&&UPD.apk){if(updating)return;updating=true;updPct=0;renderUpd();toast(t('upd.downloading',{tag:UPD.tag}));NV.downloadUpdate(UPD.apk,UPD.tag);return}
  const u=UPD.apk||UPD.url;if(!u)return;
  NATIVE?NV.openUrl(u):window.open(u,'_blank','noopener');
}

/* ============ связь с Android ============ */
let storeRenderT=null;
window.__native={
  onInstall(id,stage,text,pct){
    if(stage==='progress'){
      const pr=instProg[id]||(instProg[id]={text:'',pct:0});if(text)pr.text=text;if(pct>=0)pr.pct=pct;
      if(view==='store'&&!storeRenderT)storeRenderT=setTimeout(()=>{storeRenderT=null;if(view==='store')renderStoreList()},250);
      return;
    }
    if(stage==='error')toast(t('store.installError',{msg:text}));
    const r=instWait[id];delete instWait[id];r&&r(stage==='done');
  },
  onPty(data){xt&&xt.write(data)},
  onPtyExit(code){pty.alive=false;xt&&xt.write('\r\n\x1b[2m'+t('term.exited',{code})+'\x1b[0m\r\n')},
  onFolder(name,json){try{importFolder(name,JSON.parse(json))}catch{toast(t('imp.folderError'))}},
  onUpdate(stage,pct,msg){
    if(stage==='progress'){updPct=pct;renderUpd();return}
    if(stage==='install'){updating=false;renderUpd();toast(t('upd.confirm'));return}
    updating=false;renderUpd();toast(t('upd.failed',{msg}));
  },
  onBack(){
    if(!$('#onb').hidden){if(onb.step>0){onb.step--;renderOnb();return true}return false}
    if(!$('#updPanel').hidden){$('#updPanel').hidden=true;$('#updMore').classList.remove('open');return true}
    if($('#sheet').classList.contains('on')){closeSheet();return true}
    if($('#app').classList.contains('drawer-on')){$('#app').classList.remove('drawer-on');return true}
    if(!$('#findbar').hidden){$('#findbar').hidden=true;return true}
    if(view!=='home'){show('home');return true}
    return false;
  }
};

Object.assign(ACT,{
  'onb-uilang':d=>{LG=d.k;S.settings.lang=d.k;save();applyI18n();if(NATIVE)try{NV.setLanguage(d.k)}catch{}renderOnb()},
  'onb-next':()=>{
    if(onb.step===1&&!NICK_RE.test(onb.nick))return;
    onb.step=Math.min(3,onb.step+1);renderOnb();
  },
  'onb-skip':()=>{onb.langs.clear();onb.step=3;renderOnb()},
  'onb-back':()=>{if(onb.step>0){onb.step--;renderOnb()}},
  'onb-lang':d=>{onb.langs.has(d.id)?onb.langs.delete(d.id):onb.langs.add(d.id);renderOnb()},
  'onb-os':d=>{onb.os=d.k;renderOnb()},
  'onb-finish':finishOnb,
  'nick-edit':()=>{
    openSheet(`<h3>${t('settings.nickTitle')}</h3><p class="muted">${t('settings.nickSub')}</p>
     <label class="nick-in" style="margin-top:16px"><span>@</span><input id="nkIn" maxlength="20" value="${esc(NICK())}" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false"></label>
     <div class="onb-hint" id="nkHint"></div><button class="bigbtn" data-act="nick-save">${t('common.save')}</button>`);
    setTimeout(()=>$('#nkIn').focus(),250);
  },
  'nick-save':()=>{const v=$('#nkIn').value.trim();if(!NICK_RE.test(v)){const h=$('#nkHint');h.className='onb-hint err';h.textContent=t('onb.nickRule');return}
    S.settings.nick=v;save();closeSheet();if(pty.alive)ptyRestart();updPrompt();if(view==='home')renderHome();toast(t('settings.nickSaved',{nick:v}))},
  'set-os':d=>{S.settings.os=d.k;save();settingsSheet();
    if(NATIVE){if(xt)xt.options.theme=XT_THEME[d.k];if(pty.alive)ptyRestart()}else{out('');termBanner()}
    updPrompt();renderTKeys();toast(t('settings.terminal')+': '+OS_LIST.find(x=>x[0]===d.k)[1])},
  update:doUpdate,
  'upd-notes':()=>{const p=$('#updPanel');if(p.hidden){p.innerHTML=updPanelHTML();p.hidden=false;$('#updMore').classList.add('open')}else{p.hidden=true;$('#updMore').classList.remove('open')}},
  'upd-check':async()=>{if(!UPDATE_REPO)return;
    try{const has=await checkUpdate(true);toast(has?t('upd.available',{tag:UPD.tag}):t('upd.latest'));if(has){closeSheet();show('home')}}catch(e){toast(t('common.error',{msg:e.message}))}}
});

/* ============ старт ============ */
applyI18n();
if(NATIVE){
  syncInstalled();
  try{NV.setWidgetInterval(S.settings.wInt||'day');NV.setLanguage(LG)}catch{}
}
termBanner();
applySettings();show('home');
if(!S.onboarded){onb.nick=S.settings.nick||'';onb.os=OS();onb.step=0;renderOnb()}
setTimeout(()=>checkUpdate(false),1200);
