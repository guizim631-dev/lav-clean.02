// AUTENTICAÇÃO DE DEMONSTRAÇÃO — não é segura. Será trocada pelo Firebase Auth.
// Ao migrar, mantenha a interface: cadastrar / entrar / sair / usuarioAtual / exigirSessao.
const Auth = {
  async hash(senha, sal) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sal + senha));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  },
  usuarios: () => Armazenamento.ler("usuarios", []),
  async cadastrar({ nome, telefone, email, senha }) {
    const lista = Auth.usuarios();
    const mail = email.trim().toLowerCase();
    if (lista.some(u => u.email === mail)) return { ok: false, erro: "Este e-mail já está cadastrado." };
    const sal = crypto.getRandomValues(new Uint32Array(2)).join("-");
    lista.push({ id: "u" + Date.now(), nome: nome.trim(), telefone, email: mail,
      sal, senhaHash: await Auth.hash(senha, sal), perfil: "cliente", demo: true });
    return Armazenamento.gravar("usuarios", lista) ? { ok: true } : { ok: false, erro: "Não foi possível salvar o cadastro." };
  },
  async entrar(login, senha, lembrar) {
    const u = Auth.usuarios().find(x => x.email === login.trim().toLowerCase());
    if (!u || u.senhaHash !== await Auth.hash(senha, u.sal)) return { ok: false, erro: "E-mail ou senha incorretos." };
    (lembrar ? localStorage : sessionStorage).setItem("lavclean_sessao", u.id);
    return { ok: true };
  },
  usuarioAtual() {
    const id = sessionStorage.getItem("lavclean_sessao") || localStorage.getItem("lavclean_sessao");
    return Auth.usuarios().find(u => u.id === id) || null;
  },
  atualizar(id, campos) {
    const l = Auth.usuarios(), i = l.findIndex(u => u.id === id);
    if (i < 0) return { ok: false, erro: "Usuário não encontrado." };
    l[i] = { ...l[i], ...campos };
    return Armazenamento.gravar("usuarios", l) ? { ok: true } : { ok: false, erro: "Não foi possível salvar." };
  },
  async alterarSenha(id, atual, nova) {
    const u = Auth.usuarios().find(x => x.id === id);
    if (!u || u.senhaHash !== await Auth.hash(atual, u.sal)) return { ok: false, erro: "Senha atual incorreta." };
    const sal = crypto.getRandomValues(new Uint32Array(2)).join("-");
    return Auth.atualizar(id, { sal, senhaHash: await Auth.hash(nova, sal) });
  },
  sair() { sessionStorage.clear(); localStorage.removeItem("lavclean_sessao"); location.href = "login.html"; },
  exigirSessao() { const u = Auth.usuarioAtual(); if (!u) location.replace("login.html"); return u; }
};
