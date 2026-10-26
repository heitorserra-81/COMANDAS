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

let active = false, marked = new Set(), started = null, G = new Set(), P = new Set();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { alert('Não foi possível salvar neste navegador.'); } };
const dt = s => new Date(s);
const dia = s => dt(s).toLocaleDateString('pt-BR', {weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'});
const hora = s => dt(s).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
const last = () => db.history[db.history.length - 1];

/* número escrito na comanda, sem zeros à esquerda */
const numHTML = n => `<b class="num n${Math.min(String(n).length, 4)}"><span class="nb"><i class="nr"></i>${n}</span></b>`;

/* estados: verde = disponível/encontrada, amarelo = ainda não encontrada nesta contagem, vermelho = sumida na última */
function cls(n) {
  const y = marked.has(n), g = G.has(n), p = P.has(n);
  let c = 'tk';
  if (y) { c += ' on'; if (g) c += ' back'; }
  else if (g && db.o.gone) c += ' gone';
  else { if (active) c += ' pend'; if (p && db.o.glow) c += ' was'; }
  return c;
}
function tag(n) {
  if (G.has(n) && marked.has(n)) return 'Reapareceu!';
  return G.has(n) && db.o.gone && db.o.tag ? 'Sumida na última contagem' : '';
}

function go(v) {
  document.querySelectorAll('[data-v]').forEach(s => s.classList.toggle('hidden', s.dataset.v !== v));
  document.querySelectorAll('.drawer [data-go]').forEach(b => b.classList.toggle('cur', b.dataset.go === v));
  menu(0); scrollTo(0, 0);
}
function menu(o) { $('dr').classList.toggle('on', !!o); $('ov').classList.toggle('on', !!o); }

function stats() {
  $('cTot').textContent = db.total;
  $('cFound').textContent = marked.size;
  $('cAbs').textContent = db.total - marked.size;
  $('fin').disabled = !active;
  $('start').textContent = active ? 'Contagem em andamento' : 'Iniciar contagem';
  $('hstart').textContent = active ? 'Continuar contagem' : 'Iniciar contagem';
  $('sess').textContent = active ? 'Contagem iniciada em ' + dia(started) + ' às ' + hora(started) : 'Contagem não iniciada';
}

function grid() {
  const l = last();
  G = new Set(l ? l.missing : []);
  P = new Set(l ? l.present : []);
  const q = $('q').value.trim(), f = $('flt').value, h = [];
  $('grid').style.setProperty('--cols', db.cols);
  $('grid').style.setProperty('--gap', db.cols > 14 ? '4px' : db.cols > 8 ? '7px' : '14px');
  for (let n = 1; n <= db.total; n++) {
    if (q && !String(n).includes(q)) continue;
    const y = marked.has(n);
    if ((f === 'found' && !y) || (f === 'unf' && y) || (f === 'gone' && !G.has(n))) continue;
    h.push(`<div class="${cls(n)}" data-n="${n}" role="button" aria-label="Comanda ${n}"><i class="glow"></i><span class="face"></span>${numHTML(n)}<em class="tag">${tag(n)}</em><span class="dot">✓</span></div>`);
  }
  $('grid').innerHTML = h.join('');
  stats();
}

const pills = (a, m = 40) => a.length
  ? a.slice(0, m).map(n => `<span class="pill">${n}</span>`).join('') + (a.length > m ? `<span class="small"> +${a.length - m}</span>` : '')
  : '<span class="small">Nenhuma.</span>';

function home() {
  $('ttl').textContent = $('hname').textContent = $('dttl').textContent = db.name;
  document.title = db.name;
  $('hdate').textContent = dia(new Date());
  $('sTot').textContent = db.total;
  const l = last();
  $('sLast').textContent = l ? l.present.length : '–';
  $('sMiss').textContent = l ? l.missing.length : '–';
  $('hsum').textContent = l ? `Contagem do dia ${dt(l.date).toLocaleDateString('pt-BR')} às ${hora(l.date)} — ${l.present.length} encontradas de ${l.total}.` : 'Nenhuma contagem salva ainda.';
  $('hmiss').innerHTML = l ? '<b class="small">Ausentes:</b><br>' + pills(l.missing) : '';
}

const mini = (n, t) => `<span class="tk mini ${t}"><span class="face"></span>${numHTML(n)}</span>`;
const bloco = (tit, t, arr) => `<h4 class="cat">${tit} (${arr.length})</h4>` + (arr.length ? `<div class="mg">${arr.map(n => mini(n, t)).join('')}</div>` : '<span class="small">Nenhuma.</span>');

function hist() {
  const h = db.history;
  $('hl').innerHTML = h.length ? [...h].reverse().map((r, i) => `<details class="hc" ${i === 0 ? 'open' : ''}>
    <summary><b>Contagem ${h.length - i}</b> — ${dia(r.date)} às ${hora(r.date)}<br><span class="small">${r.present.length} encontradas · ${r.missing.length} ausentes</span></summary>
    ${bloco('✅ Encontradas', 'ok', r.present)}${bloco('❌ Ausentes', 'bad', r.missing)}${bloco('⚠️ Novas ausências', 'warn', r.newMissing || [])}
  </details>`).join('') : 'Nenhuma contagem salva.';
}

function cfg() {
  $('iname').value = db.name;
  $('itot').value = db.total;
  $('cols').innerHTML = Array.from({length: 40}, (_, i) => `<option value="${i + 1}">${i + 1} por linha</option>`).join('');
  $('cols').value = db.cols;
  document.querySelectorAll('[data-o]').forEach(c => c.checked = !!db.o[c.dataset.o]);
}
function all() { home(); hist(); cfg(); grid(); }

function startC() {
  if (!active) {
    active = true; marked = new Set(); started = new Date().toISOString();
    $('note').textContent = 'Contagem iniciada. Toque em cada comanda encontrada; ela fica verde.';
  }
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
  t.className = cls(n); t.querySelector('.tag').textContent = tag(n); stats();
};

$('fin').onclick = () => {
  if (!active) return;
  const miss = [];
  for (let n = 1; n <= db.total; n++) if (!marked.has(n)) miss.push(n);
  if (db.o.conf && !confirm(`Finalizar com ${marked.size} encontradas e ${miss.length} ausentes?`)) return;
  const p = last(), nm = p ? miss.filter(n => !p.missing.includes(n)) : [];
  db.history.push({date: new Date().toISOString(), total: db.total, present: [...marked].sort((a, b) => a - b), missing: miss, newMissing: nm});
  active = false; started = null; marked = new Set(); save();
  $('note').textContent = `Contagem salva: ${miss.length} ausentes; ${nm.length} novas ausências.`;
  all(); go('home');
};
$('clr').onclick = () => {
  if (!active) { $('note').textContent = 'Inicie uma contagem antes de limpar as marcações.'; return; }
  marked.clear(); grid();
};
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
  const r = [['Data', 'Hora', 'Total', 'Encontradas', 'Ausentes', 'Novas ausências']];
  db.history.forEach(x => r.push([dt(x.date).toLocaleDateString('pt-BR'), hora(x.date), x.total, x.present.length, x.missing.join(' '), (x.newMissing || []).join(' ')]));
  const c = r.map(w => w.map(v => '"' + String(v).replaceAll('"', '""') + '"').join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + c], {type: 'text/csv;charset=utf-8'}));
  a.download = 'historico_comandas.csv'; a.click(); URL.revokeObjectURL(a.href); menu(0);
}
['mcsv', 'tcsv', 'ecsv'].forEach(i => $(i).onclick = csv);

all(); go('home');
