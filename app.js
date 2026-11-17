// Ícones SVG e layout compartilhado (cabeçalho, menu lateral, barra inferior mobile).
const ICONES = {
  home: '<path d="M3 11l9-8 9 8v10H3z"/><path d="M9 21v-7h6v7"/>',
  wash: '<rect x="4" y="2" width="16" height="20" rx="3"/><circle cx="12" cy="13" r="5"/><path d="M8 6h2"/>',
  dry: '<rect x="4" y="2" width="16" height="20" rx="3"/><circle cx="12" cy="13" r="5"/><path d="M9 13c1-2 2 2 3 0s2 2 3 0"/>',
  both: '<rect x="1" y="4" width="10" height="16" rx="2"/><rect x="13" y="4" width="10" height="16" rx="2"/><circle cx="6" cy="14" r="3"/><circle cx="18" cy="14" r="3"/>',
  orders: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  pin: '<path d="M12 22s7-6 7-12a7 7 0 10-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  exit: '<path d="M9 21H4V3h5M16 17l5-5-5-5M21 12H9"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  truck: '<path d="M1 6h13v10H1zM14 10h5l3 3v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};
const icone = (n, t = 22) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n]}</svg>`;
const logo = () => `<a href="inicio.html" class="logo-link" aria-label="Lav Clean — início"><img class="logo-img" src="logo.png" alt="Lav Clean"></a>`;

const MENU = [["inicio.html","home","Início"],["servicos.html","wash","Serviços"],["meus-pedidos.html","orders","Meus pedidos"],["perfil.html","user","Perfil"],["endereco.html","pin","Endereço"]];
function montarLayout(ativo, usuario) {
  const link = ([h,i,t]) => `<a href="${h}" class="${h===ativo?"ativo":""}">${icone(i,20)}<span>${t}</span></a>`;
  const nome = usuario.nome.split(" ")[0];
  const inicial = usuario.nome.trim()[0].toUpperCase();
  document.getElementById("shell").innerHTML = `
    <header class="topo">${logo()}
      <div class="topo-dir"><button type="button" id="btnInstalar" class="btn pequeno" hidden>Instalar app</button><div class="topo-user"><span class="avatar">${inicial}</span><span class="topo-nome">Olá, ${esc(nome)}!</span></div></div></header>
    <aside class="lateral"><p class="lateral-titulo">Menu</p>${MENU.map(link).join("")}
      <div class="lateral-fim"><div class="usuario-card"><span class="avatar">${inicial}</span><div><strong>${esc(usuario.nome)}</strong><small>${esc(usuario.email)}</small></div></div>
      <button id="sair1" class="link-btn sair">${icone("exit",20)}<span>Sair</span></button></div></aside>
    <nav class="abas">${[MENU[0],MENU[2],MENU[3],MENU[4]].map(link).join("")}<button id="sair2" class="link-btn">${icone("exit",20)}<span>Sair</span></button></nav>`;
  ["sair1","sair2"].forEach(id => document.getElementById(id).onclick = () => Auth.sair());
  mostrarInstalar();
}
function toast(msg, tipo = "ok") {
  const t = document.createElement("div"); t.className = "toast " + tipo; t.setAttribute("role","status"); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
}

// Escapa texto do usuário antes de usar em innerHTML
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// Coloca o menu lateral dentro da grade da página
function iniciarPagina(ativo) {
  const u = Auth.exigirSessao(); if (!u) return null;
  montarLayout(ativo, u);
  document.querySelector(".corpo").prepend(document.querySelector(".lateral"));
  return u;
}
// Modal (<dialog>). Retorna o elemento; fecha ao clicar em [data-fechar].
function abrirModal(html) {
  const d = document.createElement("dialog"); d.className = "modal"; d.innerHTML = html;
  d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-fechar]")) d.close(); });
  d.addEventListener("close", () => d.remove());
  document.body.appendChild(d); d.showModal(); return d;
}
// Confirmação: Promise<true|false>
function confirmarModal({ titulo, texto, ok = "Confirmar", perigo = false }) {
  return new Promise(res => {
    const d = abrirModal(`<h2>${esc(titulo)}</h2><p>${texto}</p><div class="modal-acoes"><button class="btn sec" data-fechar>Voltar</button><button class="btn ${perigo ? "perigo" : ""}" id="mOk">${esc(ok)}</button></div>`);
    let r = false; d.querySelector("#mOk").onclick = () => { r = true; d.close(); };
    d.addEventListener("close", () => res(r));
  });
}

// ---------- PWA: service worker e botão "Instalar app" ----------
let eventoInstalar = null;
const jaInstalado = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
function mostrarInstalar() {
  document.querySelectorAll("#btnInstalar").forEach(b => {
    b.hidden = !eventoInstalar || jaInstalado();
    b.onclick = async () => { if (!eventoInstalar) return; eventoInstalar.prompt(); await eventoInstalar.userChoice; eventoInstalar = null; mostrarInstalar(); };
  });
}
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); eventoInstalar = e; mostrarInstalar(); });
window.addEventListener("appinstalled", () => { eventoInstalar = null; mostrarInstalar(); });
document.addEventListener("DOMContentLoaded", () => {
  mostrarInstalar();
  // iPhone/iPad não têm o botão automático: avisa uma vez como instalar
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (ios && !jaInstalado() && !localStorage.getItem("lavclean_dica_ios")) {
    localStorage.setItem("lavclean_dica_ios", "1");
    setTimeout(() => toast("Para instalar: toque em Compartilhar e depois em Adicionar à Tela de Início."), 1200);
  }
});
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(e => console.warn("SW não registrado:", e)));
}
