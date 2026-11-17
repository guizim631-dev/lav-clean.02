// Persistência de DEMONSTRAÇÃO (localStorage). Trocar por Firebase depois.
const Armazenamento = {
  prefixo: "lavclean_demo_",
  ler(chave, padrao = null) {
    try { const v = localStorage.getItem(this.prefixo + chave); return v ? JSON.parse(v) : padrao; }
    catch (e) { console.error("Erro ao ler", chave, e); return padrao; }
  },
  gravar(chave, valor) {
    try { localStorage.setItem(this.prefixo + chave, JSON.stringify(valor)); return true; }
    catch (e) { console.error("Erro ao gravar", chave, e); return false; }
  }
};
