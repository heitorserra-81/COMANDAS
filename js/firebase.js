// Sincronização online (Firebase Auth + Firestore). Se falhar ou não estiver configurado, o app segue funcionando só neste aparelho.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore, collection, doc, getDocs, setDoc, writeBatch, onSnapshot} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';

const $ = i => document.getElementById(i), st = t => { $('cStatus').textContent = t; };
const MSG = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.', 'auth/wrong-password': 'E-mail ou senha incorretos.', 'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Esse e-mail já tem conta. Use “Entrar”.', 'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/invalid-email': 'E-mail inválido.', 'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco.', 'auth/network-request-failed': 'Sem internet.'
};
const configurado = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('COLE');
let uid = null, unsubs = [], fs;

window.Cloud = {
  pushConfig(c) { if (uid) setDoc(doc(fs, 'users', uid, 'config', 'geral'), c).catch(() => st('Falha ao sincronizar as configurações.')); },
  pushCount(r) { if (uid) setDoc(doc(fs, 'users', uid, 'contagens', String(Date.parse(r.date))), r).catch(() => st('Falha ao enviar a contagem. Ela está salva neste aparelho.')); },
  wipe() {
    if (!uid) return;
    getDocs(collection(fs, 'users', uid, 'contagens')).then(s => { const b = writeBatch(fs); s.forEach(d => b.delete(d.ref)); return b.commit(); }).catch(() => st('Falha ao apagar o histórico online.'));
  }
};

function tela(logado) { $('cForm').classList.toggle('hidden', logado); $('cBox').classList.toggle('hidden', !logado); }

if (!configurado) {
  st('Firebase ainda não configurado (veja o README). Dados salvos só neste aparelho.');
  ['cIn', 'cNew'].forEach(i => $(i).disabled = true);
} else {
  const app = initializeApp(firebaseConfig), auth = getAuth(app);
  fs = getFirestore(app);
  const cred = fn => () => fn(auth, $('cEmail').value.trim(), $('cPass').value).catch(e => st(MSG[e.code] || 'Erro: ' + e.code));
  $('cIn').onclick = cred(signInWithEmailAndPassword);
  $('cNew').onclick = cred(createUserWithEmailAndPassword);
  $('cOut').onclick = () => signOut(auth);

  onAuthStateChanged(auth, async u => {
    unsubs.forEach(f => f()); unsubs = [];
    if (!u) { uid = null; tela(false); st('Offline: dados salvos só neste aparelho. Entre para sincronizar.'); return; }
    uid = u.uid; tela(true); st('Sincronizando…');
    try {
      const col = collection(fs, 'users', uid, 'contagens'), have = new Set((await getDocs(col)).docs.map(d => d.id)), L = App.getLocal();
      const b = writeBatch(fs); let n = 0;
      L.history.forEach(r => { const id = String(Date.parse(r.date)); if (!have.has(id)) { b.set(doc(col, id), r); n++; } });
      if (n) await b.commit();                       // primeiro envia o que só existe neste aparelho
      unsubs.push(onSnapshot(col, s => { App.setHistory(s.docs.map(d => d.data())); st('Online ✔ ' + u.email); }));
      unsubs.push(onSnapshot(doc(fs, 'users', uid, 'config', 'geral'), s => { s.exists() ? App.setConfig(s.data()) : Cloud.pushConfig(L.cfg); }));
    } catch (e) { st('Não foi possível sincronizar agora. Os dados continuam salvos neste aparelho.'); }
  });
}
