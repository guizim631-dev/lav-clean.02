const Validacao = {
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  telefone: v => { const n = v.replace(/\D/g, ""); return n.length === 10 || n.length === 11; },
  senha: v => v.length >= 6,
  nome: v => v.trim().split(/\s+/).length >= 2 && v.trim().length >= 5,
  // Mostra/limpa o erro de um campo (.campo > input + .erro)
  erro(input, msg) {
    const c = input.closest(".campo"); c.classList.toggle("invalido", !!msg);
    c.querySelector(".erro").textContent = msg || "";
    return !msg;
  }
};
