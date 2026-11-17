// Única fonte dos serviços e preços (valores do protótipo).
const SERVICOS = [
  { id: "lavar", nome: "Lavar", preco: 20, descricao: "Remove a sujeira e mantém suas roupas limpas.", icone: "wash" },
  { id: "secar", nome: "Secar", preco: 15, descricao: "Deixa suas roupas secas e prontas para usar.", icone: "dry" },
  { id: "lavar-secar", nome: "Lavar + Secar", preco: 30, descricao: "Praticidade e economia em um só serviço.", icone: "both" }
];
const Servicos = {
  listar: () => SERVICOS,
  buscar: id => SERVICOS.find(s => s.id === id) || null,
  formatar: v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  escolher(id) { sessionStorage.setItem("lavclean_servico", id); },
  escolhido() { return Servicos.buscar(sessionStorage.getItem("lavclean_servico")); }
};
