# Comandas Marquezine

App de controle de comandas (HTML + CSS + JavaScript puros, sem build).

## Estrutura
- `index.html` — página principal
- `css/style.css` — estilos e efeitos de luz
- `js/app.js` — lógica (contagem, histórico, gráficos, tela final em 3D, configurações, CSV)
- `js/firebase.js` — sincronização online (Firebase Auth + Firestore)
- `js/firebase-config.js` — **você cola aqui a configuração do seu projeto**
- `firestore.rules` — regras de segurança do banco
- `manifest.webmanifest`, `sw.js`, `js/pwa.js` — app instalável (PWA) e funcionamento sem internet
- `assets/comanda.webp` — imagem da comanda
- `assets/icons/` — ícones do app (Android, iOS, Windows)

## Ligar o Firebase (uma vez só)
1. Em https://console.firebase.google.com → **Adicionar projeto** (pode desativar o Google Analytics).
2. **Criação → Authentication → Vamos começar → E-mail/senha → Ativar**.
3. **Criação → Firestore Database → Criar banco de dados** (modo produção; escolha a região `southamerica-east1`).
4. Aba **Regras** do Firestore: cole o conteúdo de `firestore.rules` e clique em **Publicar**.
5. **Configurações do projeto (engrenagem) → Seus apps → </> (Web)** → registre o app e copie o `firebaseConfig`. Cole os valores em `js/firebase-config.js`.
6. Publique no GitHub Pages (Settings → Pages → branch `main`, pasta `/ (root)`).
7. No app: **Configurações → Sincronização online → Criar conta** (e-mail e senha). Nos outros aparelhos, use **Entrar** com a mesma conta.

Sem login, o app funciona normalmente e guarda tudo só no navegador do aparelho. O login online precisa do site publicado (GitHub Pages); abrir o `index.html` direto do computador não carrega o Firebase.

## Instalar como app (PWA)
No site publicado (https), o navegador oferece **Instalar** na primeira visita (Android, Windows, macOS/Chrome/Edge). No iPhone/iPad: Safari → Compartilhar → **Adicionar à Tela de Início**.
Ao publicar uma atualização, troque `comandas-v1` por `comandas-v2` em `sw.js` para os aparelhos renovarem o cache.
