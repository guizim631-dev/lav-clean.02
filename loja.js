// Dados FICTÍCIOS da loja (demonstração). Substituir pelos dados reais depois.
const LOJA = {
  nome: "Lav Clean — Unidade Centro",
  rua: "Rua das Lavandeiras, 123", bairro: "Centro", cidade: "São Paulo", uf: "SP", cep: "01000-000",
  lat: -23.5505, lon: -46.6333,
  horario: "Seg a Sáb, 8h às 20h · Dom, 9h às 14h", telefone: "(11) 4000-0000",
  get enderecoTexto() { return `${this.rua}, ${this.bairro}, ${this.cidade} - ${this.uf}`; },
  mapaEmbed() { const d = 0.005; return `https://www.openstreetmap.org/export/embed.html?bbox=${this.lon - d}%2C${this.lat - d * .6}%2C${this.lon + d}%2C${this.lat + d * .6}&layer=mapnik&marker=${this.lat}%2C${this.lon}`; },
  mapaLink() { return `https://www.google.com/maps/search/?api=1&query=${this.lat},${this.lon}`; }
};
