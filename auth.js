// Autenticação com Firebase Authentication (SDK compat) + perfil no Firestore (coleção "users").
// As telas usam: cadastrar / entrar / entrarComGoogle / sair / usuarioAtual / exigirSessao / atualizar / alterarSenha.
// usuarioAtual() é síncrono: lê uma cópia do perfil guardada no aparelho. O Firebase confirma a sessão em segundo plano.
const Auth = (() => {
  const CHAVE = "lavclean_perfil";
  const temFirebase = typeof firebase !== "undefined" && typeof FIREBASE_CONFIG !== "undefined";
  let auth = null, db = null;
  if (temFirebase) {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore ? firebase.firestore() : null;
  }
  const SEM_FIREBASE = { ok: false, erro: "Não foi possível conectar ao Firebase. Verifique a internet e recarregue a página." };
  const MSG = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/weak-password": "Senha fraca. Use ao menos 6 caracteres.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente de novo.",
    "auth/network-request-failed": "Sem conexão com a internet.",
    "auth/popup-blocked": "O navegador bloqueou a janela do Google. Libere pop-ups e tente de novo.",
    "auth/unauthorized-domain": "Este endereço não está autorizado no Firebase (Authentication > Settings > Authorized domains).",
    "auth/operation-not-allowed": "Este tipo de login não está ativado no Firebase.",
    "auth/popup-closed-by-user": "", "auth/cancelled-popup-request": ""
  };
  const erroMsg = e => (e && e.code in MSG) ? MSG[e.code] : "Não foi possível concluir. Tente novamente.";
  const lerCache = () => { try { return JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { return null; } };
  const gravarCache = p => { try { localStorage.setItem(CHAVE, JSON.stringify(p)); } catch (e) { console.warn(e); } };
  const limparCache = () => { try { localStorage.removeItem(CHAVE); } catch (e) {} };

  // Grava no Firestore; se não estiver configurado, só avisa no console.
  async function salvarRemoto(uid, dados) {
    if (!db) return false;
    try {
      await db.collection("users").doc(uid).set({ ...dados, atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return true;
    } catch (e) { console.warn("Firestore (salvar):", e.code || e); return false; }
  }
  // Monta o perfil (Firestore + conta do Firebase) e guarda a cópia local.
  async function carregarPerfil(user, extra = {}) {
    const antigo = lerCache(); let dados = {};
    if (db) { try { const d = await db.collection("users").doc(user.uid).get(); if (d.exists) dados = d.data(); } catch (e) { console.warn("Firestore (ler):", e.code || e); } }
    const perfil = {
      id: user.uid, email: user.email, perfil: "cliente",
      nome: extra.nome || dados.nome || user.displayName || (user.email || "").split("@")[0],
      telefone: extra.telefone !== undefined ? extra.telefone : (dados.telefone ?? (antigo && antigo.id === user.uid ? antigo.telefone : "") ?? "")
    };
    gravarCache(perfil); return perfil;
  }

  return {
    async cadastrar({ nome, telefone, email, senha }) {
      if (!auth) return SEM_FIREBASE;
      try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const c = await auth.createUserWithEmailAndPassword(email.trim(), senha);
        await c.user.updateProfile({ displayName: nome.trim() });
        await salvarRemoto(c.user.uid, { nome: nome.trim(), telefone, email: c.user.email, perfil: "cliente" });
        await carregarPerfil(c.user, { nome: nome.trim(), telefone });
        return { ok: true };
      } catch (e) { return { ok: false, erro: erroMsg(e) }; }
    },
    async entrar(login, senha, lembrar) {
      if (!auth) return SEM_FIREBASE;
      try {
        await auth.setPersistence(lembrar ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION);
        const c = await auth.signInWithEmailAndPassword(login.trim(), senha);
        await carregarPerfil(c.user); return { ok: true };
      } catch (e) { return { ok: false, erro: erroMsg(e) }; }
    },
    async entrarComGoogle() {
      if (!auth) return SEM_FIREBASE;
      try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const provedor = new firebase.auth.GoogleAuthProvider(); provedor.setCustomParameters({ prompt: "select_account" });
        const r = await auth.signInWithPopup(provedor);
        if (r.additionalUserInfo && r.additionalUserInfo.isNewUser)
          await salvarRemoto(r.user.uid, { nome: r.user.displayName || "", telefone: "", email: r.user.email, perfil: "cliente" });
        await carregarPerfil(r.user); return { ok: true };
      } catch (e) { return { ok: false, erro: erroMsg(e) }; }
    },
    usuarioAtual: lerCache,
    // Para a tela de login: resolve com o perfil se já existir sessão no Firebase, senão null.
    aguardarSessao() {
      if (!auth) return Promise.resolve(lerCache());
      return new Promise(res => {
        const parar = auth.onAuthStateChanged(async user => {
          parar();
          if (!user) { limparCache(); return res(null); }
          res(await carregarPerfil(user));
        });
      });
    },
    // Chame no topo de páginas protegidas (RF010). Sem sessão, volta ao login.
    exigirSessao() {
      const u = lerCache();
      if (!u) { location.replace("login.html"); return null; }
      if (auth) auth.onAuthStateChanged(user => { if (!user || user.uid !== u.id) { limparCache(); location.replace("login.html"); } });
      return u;
    },
    async atualizar(id, campos) {
      const p = lerCache(); if (!p || p.id !== id) return { ok: false, erro: "Sessão inválida." };
      gravarCache({ ...p, ...campos });
      try { if (auth && auth.currentUser && campos.nome) await auth.currentUser.updateProfile({ displayName: campos.nome }); } catch (e) { console.warn(e); }
      const n = lerCache();
      const ok = await salvarRemoto(id, { nome: n.nome, telefone: n.telefone, email: n.email });
      return ok ? { ok: true } : { ok: true, aviso: "Salvo neste aparelho. Não foi possível sincronizar com a nuvem." };
    },
    async alterarSenha(id, atual, nova) {
      const user = auth && auth.currentUser; if (!user) return SEM_FIREBASE;
      if (!user.providerData.some(p => p.providerId === "password")) return { ok: false, erro: "Sua conta usa o login com Google e não tem senha para alterar." };
      try {
        await user.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(user.email, atual));
        await user.updatePassword(nova); return { ok: true };
      } catch (e) { return { ok: false, erro: e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" ? "Senha atual incorreta." : erroMsg(e) }; }
    },
    async sair() {
      try { if (auth) await auth.signOut(); } catch (e) { console.warn(e); }
      limparCache(); sessionStorage.clear(); location.href = "login.html";
    }
  };
})();
