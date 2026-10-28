'use strict';
const $ = i => document.getElementById(i);
const KEY = 'comandasMarquezine_v3', OLD = 'controleComandasComFoto_v2';
const DEF = {name: 'Comandas Marquezine', total: 200, cols: 4, history: [], o: {glow: 1, gone: 1, tag: 1, vib: 1, conf: 1}};

let db;
try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
if (!db) {
  db = JSON.parse(JSON.stringify(DEF));
  try { const o = JSON.parse(localStorage.getItem(OLD)); if (o) { db.total = o.total || 200; db.history = o.history || []; } } catch (e) {}
}
db.o = Object.assign({}, DEF.o, db.o || {});
db.cols = db.cols || 4;

let active = false, marked = new Set(), started = null;
let G = new Set(), P = new Set(), N = new Set(), S = [];   // G=sumidas (total) · P=presentes · N=sumidas só na última · S=sumidas por contagem
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { alert('Não foi possível salvar neste navegador.'); } };
const dt = s => new Date(s);
const dia = s => dt(s).toLocaleDateString('pt-BR', {weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'});
const dm = s => dt(s).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
const hora = s => dt(s).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
const last = () => db.history[db.history.length - 1];

function load() {
  const l = last();
  G = new Set(l ? l.missing : []); P = new Set(l ? l.present : []); N = new Set(l && l.newMissing ? l.newMissing : []);
  S = db.history.map(r => new Set(r.missing));
}
/* data da contagem em que a comanda sumiu (início da sequência de ausências) */
function sumiuEm(n) { let d = null; for (let i = db.history.length - 1; i >= 0 && S[i].has(n); i--) d = db.history[i].date; return d; }

const numHTML = n => `<b class="num n${Math.min(String(n).length, 4)}"><span class="nb"><i class="nr"></i>${n}</span></b>`;

/* verde = disponível/encontrada · amarelo = ainda não encontrada nesta contagem · vermelho = sumida */
function cls(n) {
  const y = marked.has(n), g = G.has(n), p = P.has(n);
  let c = 'tk';
  if (y) { c += ' on'; if (g) c += ' back'; }
  else if (g && db.o.gone) c += ' gone';
  else { if (active) c += ' pend'; if (p && db.o.glow) c += ' was'; }
  return c;
}
function tag(n) {
  if (G.has(n) && marked.has(n)) return '<b>Reapareceu!</b>';
  if (G.has(n) && db.o.gone && db.o.tag) { const d = sumiuEm(n); return `<b>SUMIDA</b><span>na contagem do dia ${d ? dm(d) : '—'}</span>`; }
  return '';
}

function go(v) {
  document.querySelectorAll('[data-v]').forEach(s => s.classList.toggle('hidden', s.dataset.v !== v));
  document.querySelectorAll('.drawer [data-go]').forEach(b => b.classList.toggle('cur', b.dataset.go === v));
  if (v === 'chart') chart();
  menu(0); scrollTo(0, 0);
}
function menu(o) { $('dr').classList.toggle('on', !!o); $('ov').classList.toggle('on', !!o); }

function stats() {
  $('cTot').textContent = db.total; $('cFound').textContent = marked.size; $('cAbs').textContent = db.total - marked.size;
  $('fin').disabled = !active;
  $('start').textContent = active ? 'Contagem em andamento' : 'Iniciar contagem';
  $('hstart').textContent = active ? 'Continuar contagem' : 'Iniciar contagem';
  $('sess').textContent = active ? 'Contagem iniciada em ' + dia(started) + ' às ' + hora(started) : 'Contagem não iniciada';
}

function grid() {
  load();
  const q = $('q').value.trim(), f = $('flt').value, h = [];
  $('grid').style.setProperty('--cols', db.cols);
  $('grid').style.setProperty('--gap', db.cols > 14 ? '4px' : db.cols > 8 ? '7px' : '14px');
  for (let n = 1; n <= db.total; n++) {
    if (q && !String(n).includes(q)) continue;
    const y = marked.has(n);
    if ((f === 'found' && !y) || (f === 'unf' && y) || (f === 'avail' && !P.has(n)) || (f === 'gone' && !G.has(n)) || (f === 'ngone' && !N.has(n))) continue;
    h.push(`<div class="${cls(n)}" data-n="${n}" role="button" aria-label="Comanda ${n}"><span class="face"></span><i class="glow"></i>${numHTML(n)}<em class="tag">${tag(n)}</em><span class="dot">✓</span></div>`);
  }
  $('grid').innerHTML = h.join('');
  stats();
}

const pills = a => a.length ? a.map(n => `<span class="pill">${n}</span>`).join('') : '<span class="small">Nenhuma.</span>';

function home() {
  $('ttl').textContent = $('hname').textContent = $('dttl').textContent = db.name;
  document.title = db.name;
  $('hdate').textContent = dia(new Date());
  $('sTot').textContent = db.total;
  const l = last();
  $('sLast').textContent = l ? l.present.length : '–';
  $('sMiss').textContent = l ? l.missing.length : '–';
  $('hsum').textContent = l ? `Contagem do dia ${dt(l.date).toLocaleDateString('pt-BR')} às ${hora(l.date)} — ${l.present.length} encontradas de ${l.total}.` : 'Nenhuma contagem salva ainda.';
  $('hmiss').innerHTML = l ? `<b class="small">Ausentes (${l.missing.length}):</b><br>` + pills(l.missing) : '';
}

/* histórico: cada contagem com abas Encontradas / Todas as sumidas / Sumidas só nesta */
const mini = (n, t) => `<span class="tk mini ${t}"><span class="face"></span>${numHTML(n)}</span>`;
const painel = (t, arr, k, on) => `<div class="tp ${on ? '' : 'hidden'}" data-k="${k}">${arr.length ? `<div class="mg">${arr.map(n => mini(n, t)).join('')}</div>` : '<span class="small">Nenhuma.</span>'}</div>`;
function hist() {
  const h = db.history;
  $('hl').innerHTML = h.length ? [...h].reverse().map((r, i) => { const nm = r.newMissing || []; return `<details class="hc" ${i === 0 ? 'open' : ''}>
    <summary><b>Contagem ${h.length - i}</b> — ${dia(r.date)} às ${hora(r.date)}<br><span class="small">${r.present.length} encontradas · ${r.missing.length} ausentes · ${nm.length} sumidas nesta</span></summary>
    <div class="tabs"><button class="tb on" data-k="p">✅ Encontradas (${r.present.length})</button><button class="tb" data-k="m">❌ Todas as sumidas (${r.missing.length})</button><button class="tb" data-k="n">⚠️ Sumidas só nesta (${nm.length})</button></div>
    ${painel('ok', r.present, 'p', 1)}${painel('bad', r.missing, 'm', 0)}${painel('warn', nm, 'n', 0)}</details>`; }).join('') : 'Nenhuma contagem salva.';
}
$('hl').onclick = e => {
  const b = e.target.closest('.tb'); if (!b) return;
  const d = b.closest('details');
  d.querySelectorAll('.tb').forEach(x => x.classList.toggle('on', x === b));
  d.querySelectorAll('.tp').forEach(x => x.classList.toggle('hidden', x.dataset.k !== b.dataset.k));
};

/* gráficos */
function chart() {
  const h = db.history.slice(-30), el = $('chartBox');
  if (h.length < 2) { el.innerHTML = '<p class="small">Faça pelo menos 2 contagens para ver o gráfico.</p>'; $('chartStats').innerHTML = ''; return; }
  const W = 640, H = 300, L = 40, R = 12, T = 14, B = 34, mx = Math.max(...h.map(r => r.total), 1);
  const X = i => L + (W - L - R) * i / (h.length - 1), Y = v => T + (H - T - B) * (1 - v / mx);
  let g = '';
  for (let k = 0; k <= 4; k++) { const v = Math.round(mx * k / 4), y = Y(v); g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#e6ded4"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#667169">${v}</text>`; }
  const bw = Math.max(4, (W - L - R) / h.length * .45);
  h.forEach((r, i) => {
    const nm = (r.newMissing || []).length;
    g += `<rect x="${X(i) - bw / 2}" y="${Y(nm)}" width="${bw}" height="${Y(0) - Y(nm)}" fill="#f59e0b99"><title>${dm(r.date)}: ${nm} sumidas nesta contagem</title></rect>`;
    if (i % Math.ceil(h.length / 8) === 0) g += `<text x="${X(i)}" y="${H - 12}" text-anchor="middle" font-size="11" fill="#667169">${dm(r.date)}</text>`;
  });
  const line = (f, c) => `<polyline fill="none" stroke="${c}" stroke-width="3" points="${h.map((r, i) => X(i) + ',' + Y(f(r))).join(' ')}"/>` + h.map((r, i) => `<circle cx="${X(i)}" cy="${Y(f(r))}" r="4" fill="${c}"><title>${dm(r.date)} às ${hora(r.date)}: ${f(r)}</title></circle>`).join('');
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${g}${line(r => r.present.length, '#16a34a')}${line(r => r.missing.length, '#e11d48')}</svg>
    <div class="leg"><span style="--k:#16a34a">Encontradas</span><span style="--k:#e11d48">Ausentes</span><span style="--k:#f59e0b">Sumidas na contagem</span></div>`;
  const aus = h.map(r => r.missing.length), pior = h[aus.indexOf(Math.max(...aus))];
  $('chartStats').innerHTML = `<div class="stat"><b>${aus[aus.length - 1]}</b><span>Ausentes agora</span></div><div class="stat"><b>${Math.round(aus.reduce((a, b) => a + b, 0) / aus.length)}</b><span>Média de ausentes</span></div><div class="stat"><b>${Math.max(...aus)}</b><span>Pior dia (${dm(pior.date)})</span></div>`;
}

function cfg() {
  $('iname').value = db.name; $('itot').value = db.total;
  $('cols').innerHTML = Array.from({length: 40}, (_, i) => `<option value="${i + 1}">${i + 1} por linha</option>`).join('');
  $('cols').value = db.cols;
  document.querySelectorAll('[data-o]').forEach(c => c.checked = !!db.o[c.dataset.o]);
}
function all() { home(); hist(); cfg(); grid(); }

/* tela cheia ao finalizar: sumidas nesta contagem, uma a uma ou em grupos, depois todas juntas */
const sleep = ms => new Promise(r => setTimeout(r, ms));
let skip = false;
async function show(nm, r, first) {
  const ov = $('show'), st = $('shStage'), ti = $('shTit'), ct = $('shCnt'), bt = $('shClose');
  skip = false; ov.classList.add('on'); bt.textContent = 'Pular'; st.className = 'stage'; st.innerHTML = '';
  const size = nm.length <= 2 ? 1 : nm.length <= 12 ? 3 : 6, ch = [];
  for (let i = 0; i < nm.length; i += size) ch.push(nm.slice(i, i + size));
  for (let i = 0; i < ch.length && !skip; i++) {
    ti.textContent = 'Sumida nesta contagem'; ct.textContent = `${Math.min((i + 1) * size, nm.length)} de ${nm.length}`;
    st.className = 'stage s' + ch[i].length;
    st.innerHTML = ch[i].map((n, k) => `<div class="tk big gone show" style="--d:${k * .25}s"><span class="face"></span><i class="glow"></i>${numHTML(n)}</div>`).join('');
    await sleep(2500 + ch[i].length * 250);
    if (skip) break;
    st.classList.add('out'); await sleep(550);
  }
  st.className = 'stage fim';
  ti.textContent = first ? 'Primeira contagem salva ✅' : nm.length ? 'Todas as sumidas nesta contagem' : 'Nenhuma comanda sumiu desta vez 🎉';
  ct.textContent = `${r.present.length} encontradas · ${r.missing.length} ausentes no total · ${nm.length} sumidas agora`;
  st.innerHTML = nm.length ? `<div class="mg wide">${nm.map(n => mini(n, 'bad')).join('')}</div>` : '';
  bt.textContent = 'Fechar';
}
$('shClose').onclick = () => { if ($('shClose').textContent === 'Pular') { skip = true; } else $('show').classList.remove('on'); };

function startC() {
  if (!active) { active = true; marked = new Set(); started = new Date().toISOString(); $('note').textContent = 'Contagem iniciada. Toque em cada comanda encontrada; ela fica verde.'; }
  go('count'); grid();
}

/* eventos */
$('bg').onclick = () => menu(1);
$('ov').onclick = () => menu(0);
document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
$('start').onclick = startC; $('hstart').onclick = startC;

$('grid').onclick = e => {
  const t = e.target.closest('.tk'); if (!t) return;
  if (!active) { $('note').textContent = 'Para marcar comandas, primeiro toque em “Iniciar contagem”.'; scrollTo(0, 0); return; }
  const n = +t.dataset.n;
  marked.has(n) ? marked.delete(n) : marked.add(n);
  if (db.o.vib && navigator.vibrate) navigator.vibrate(15);
  const f = $('flt').value;
  if (f === 'found' || f === 'unf') { grid(); return; }
  t.className = cls(n); t.querySelector('.tag').innerHTML = tag(n); stats();
};

$('fin').onclick = () => {
  if (!active) return;
  const miss = [];
  for (let n = 1; n <= db.total; n++) if (!marked.has(n)) miss.push(n);
  if (db.o.conf && !confirm(`Finalizar com ${marked.size} encontradas e ${miss.length} ausentes?`)) return;
  const p = last(), nm = p ? miss.filter(n => !p.missing.includes(n)) : [];
  const rec = {date: new Date().toISOString(), total: db.total, present: [...marked].sort((a, b) => a - b), missing: miss, newMissing: nm};
  db.history.push(rec);
  active = false; started = null; marked = new Set(); save();
  $('note').textContent = `Contagem salva: ${miss.length} ausentes; ${nm.length} sumidas nesta contagem.`;
  all(); go('home'); show(nm, rec, !p);
};
$('clr').onclick = () => { if (!active) { $('note').textContent = 'Inicie uma contagem antes de limpar as marcações.'; return; } marked.clear(); grid(); };
$('q').oninput = grid; $('flt').onchange = grid;
$('cols').onchange = () => { db.cols = +$('cols').value; save(); grid(); };
$('iname').oninput = () => { db.name = $('iname').value.trim() || DEF.name; save(); home(); };
document.querySelectorAll('[data-o]').forEach(c => c.onchange = () => { db.o[c.dataset.o] = c.checked ? 1 : 0; save(); grid(); });
$('stot').onclick = () => {
  const n = Number($('itot').value);
  if (!Number.isInteger(n) || n < 1 || n > 5000) { alert('Digite um número entre 1 e 5000.'); return; }
  if (active && !confirm('Alterar o total durante uma contagem? A contagem atual será reiniciada.')) return;
  db.total = n; active = false; marked = new Set(); save(); all(); alert('Quantidade atualizada para ' + n + ' comandas.');
};
$('wipe').onclick = () => { if (confirm('Apagar TODO o histórico de contagens? Isso não pode ser desfeito.')) { db.history = []; save(); all(); } };

/* exportação: só números, sem zeros à esquerda */
function csv() {
  const r = [['Data', 'Hora', 'Total', 'Encontradas', 'Ausentes', 'Sumidas nesta contagem']];
  db.history.forEach(x => r.push([dt(x.date).toLocaleDateString('pt-BR'), hora(x.date), x.total, x.present.length, x.missing.join(' '), (x.newMissing || []).join(' ')]));
  const c = r.map(w => w.map(v => '"' + String(v).replaceAll('"', '""') + '"').join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + c], {type: 'text/csv;charset=utf-8'}));
  a.download = 'historico_comandas.csv'; a.click(); URL.revokeObjectURL(a.href); menu(0);
}
['mcsv', 'tcsv', 'ecsv'].forEach(i => $(i).onclick = csv);

all(); go('home');
