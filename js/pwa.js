// PWA: registra o service worker e pede para instalar o app já na primeira visita.
(() => {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  const instalado = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const NAO = 'cmq_nao_instalar', recusou = () => Date.now() - (+localStorage.getItem(NAO) || 0) < 7 * 864e5;   // pergunta de novo após 7 dias
  let ev = null, faixa = null;
  const $ = i => document.getElementById(i);

  function esconder(lembrar) { if (faixa) { faixa.remove(); faixa = null; } if (lembrar) localStorage.setItem(NAO, Date.now()); }
  function instalar() {
    if (ev) { ev.prompt(); ev.userChoice.finally(() => { ev = null; esconder(false); if ($('mInst')) $('mInst').classList.add('hidden'); }); }
    else if (ios) { esconder(false); mostrar(true); }
  }
  function mostrar(forcar) {
    if (instalado || faixa || (!forcar && recusou())) return;
    faixa = document.createElement('div'); faixa.className = 'inst';
    faixa.innerHTML = `<img src="assets/icons/icon-192.png" alt=""><div><b>Instalar o app Comandas</b><span>${ev ? 'Use como aplicativo, em tela cheia e até sem internet.' : 'No iPhone/iPad: toque em Compartilhar (⬆️) e depois em “Adicionar à Tela de Início”.'}</span></div>${ev ? '<button class="btn" id="iOk">Instalar</button>' : ''}<button class="btn sec" id="iNo">${ev ? 'Agora não' : 'Entendi'}</button>`;
    document.body.appendChild(faixa);
    if ($('iOk')) $('iOk').onclick = instalar;
    $('iNo').onclick = () => esconder(true);
  }
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); ev = e; if ($('mInst')) $('mInst').classList.remove('hidden'); mostrar(false); });
  addEventListener('appinstalled', () => { ev = null; esconder(false); if ($('mInst')) $('mInst').classList.add('hidden'); });
  addEventListener('DOMContentLoaded', () => {
    if ($('mInst')) { $('mInst').onclick = () => { document.getElementById('dr').classList.remove('on'); document.getElementById('ov').classList.remove('on'); instalar(); }; if (ios && !instalado) $('mInst').classList.remove('hidden'); }
    if (ios) setTimeout(() => mostrar(false), 1500);
  });
})();
