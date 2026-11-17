// Modelo e regras dos pedidos (DEMONSTRAÇÃO em localStorage). Trocar por Firestore depois.
const STATUS = ["recebido", "lavando", "pronto", "entregue"];
const ROTULO_STATUS = { recebido: "Recebido", lavando: "Lavando", pronto: "Pronto", entregue: "Entregue", cancelado: "Cancelado" };
const ROTULO_PAGAMENTO = { nao_iniciado: "Pagamento não iniciado", pendente: "Pagamento pendente", confirmado_simulado: "Pagamento confirmado (simulado)" };

const Pedidos = {
  todos: () => Armazenamento.ler("pedidos", []),
  salvar: lista => Armazenamento.gravar("pedidos", lista),
  doUsuario: uid => Pedidos.todos().filter(p => p.usuarioId === uid).sort((a, b) => b.numero - a.numero),
  buscar: id => Pedidos.todos().find(p => p.id === id) || null,
  emAndamento: p => p.status !== "entregue" && p.status !== "cancelado",
  // RF007: aceita "#001", "001" ou "1"
  casaId(p, termo) { const n = parseInt(String(termo).replace(/\D/g, ""), 10); return !isNaN(n) && p.numero === n; },
  // RF002/RF004: cria pedido com preço vindo de services.js (copiado no pedido)
  criar({ usuarioId, servicoId, formaPagamento = "Pix", endereco = "" }) {
    const serv = Servicos.buscar(servicoId); if (!serv) return null;
    const lista = Pedidos.todos(), numero = lista.reduce((m, p) => Math.max(m, p.numero), 0) + 1, agora = new Date().toISOString();
    const p = { id: "#" + String(numero).padStart(3, "0"), numero, usuarioId, servicoId, servicoNome: serv.nome, preco: serv.preco,
      criadoEm: agora, status: "recebido", historico: [{ status: "recebido", em: agora }],
      pagamento: { forma: formaPagamento, estado: "pendente" }, precisaEstorno: false, endereco, demo: true };
    lista.push(p); Pedidos.salvar(lista); return p;
  },
  atualizar(id, fn) { const l = Pedidos.todos(), p = l.find(x => x.id === id); if (!p) return null; fn(p); Pedidos.salvar(l); return p; },
  // RF005: avança uma etapa
  avancar: id => Pedidos.atualizar(id, p => {
    const i = STATUS.indexOf(p.status); if (i < 0 || i >= STATUS.length - 1) return;
    p.status = STATUS[i + 1]; p.historico.push({ status: p.status, em: new Date().toISOString() });
  }),
  // Decisão de demonstração: só cancela antes de "pronto" (regra oficial ainda não definida nos requisitos)
  podeCancelar: p => p.status === "recebido" || p.status === "lavando",
  // RF011: se já pago, sinaliza necessidade de estorno (sem estorno real)
  cancelar: id => Pedidos.atualizar(id, p => {
    if (!Pedidos.podeCancelar(p)) return;
    p.status = "cancelado"; p.historico.push({ status: "cancelado", em: new Date().toISOString() });
    p.precisaEstorno = p.pagamento.estado === "confirmado_simulado";
  }),
  // RF009 (simulação): marca pagamento como confirmado na demonstração
  simularPagamento: id => Pedidos.atualizar(id, p => { if (p.status !== "cancelado") p.pagamento.estado = "confirmado_simulado"; })
};
