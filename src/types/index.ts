// ─── CLIENTE ──────────────────────────────────────────────────────────────────

export interface Cliente {
  id: string;
  // Dados básicos
  nome: string;
  segmento: string;
  cidade: string;
  instagram?: string;
  facebook?: string;
  site?: string;
  whatsapp?: string;
  googleMeuNegocio?: string;

  // Identidade visual
  logoUrl?: string;
  coresPrincipais: string[];
  coresSecundarias: string[];
  fontes: string[];
  elementosGraficos?: string;

  // Posicionamento
  publicoAlvo: string;
  diferenciais: string;
  tomDeVoz: string;
  objetivos: string;

  // Metadata
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export type ClienteInput = Omit<Cliente, 'id' | 'criadoEm' | 'atualizadoEm'>;

// ─── PRODUTO / SERVIÇO ────────────────────────────────────────────────────────

export interface Produto {
  id: string;
  clienteId: string;
  nome: string;
  categoria: string;
  descricao: string;
  beneficios: string[];
  diferenciais: string;
  preco?: number;
  precoTexto?: string;
  fotoUrls: string[];
  videoUrls: string[];
  palavrasChave: string[];
  melhorPeriodo?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export type ProdutoInput = Omit<Produto, 'id' | 'criadoEm' | 'atualizadoEm'>;

// ─── ANÁLISE IA ───────────────────────────────────────────────────────────────

export interface AnaliseNegocio {
  id: string;
  clienteId: string;
  pontosFortes: string[];
  pontosFragos: string[];
  oportunidades: string[];
  ameacas: string[];
  resumoGeral: string;
  geradoEm: string;
}

// ─── CALENDÁRIO ───────────────────────────────────────────────────────────────

export type TipoPublicacao = 'feed' | 'reel' | 'stories' | 'carrossel' | 'campanha';

export interface ItemCalendario {
  id: string;
  clienteId: string;
  mes: number; // 1-12
  ano: number;
  data: string; // YYYY-MM-DD
  tipo: TipoPublicacao;
  objetivo: string;
  legenda: string;
  cta: string;
  produtoId?: string;
  geradoEm: string;
}

// ─── IDEIAS ───────────────────────────────────────────────────────────────────

export type FormatoIdeia = 'reel' | 'carrossel' | 'stories' | 'campanha' | 'promocao';

export interface Ideia {
  id: string;
  clienteId: string;
  produtoId?: string;
  formato: FormatoIdeia;
  titulo: string;
  descricao: string;
  geradoEm: string;
}

// ─── ROTEIRO ──────────────────────────────────────────────────────────────────

export type FormatoRoteiro = 'reel' | 'tiktok' | 'stories' | 'institucional';
export type DuracaoRoteiro = 15 | 30 | 60;

export interface Roteiro {
  id: string;
  clienteId: string;
  produtoId?: string;
  formato: FormatoRoteiro;
  duracao: DuracaoRoteiro;
  gancho: string;
  desenvolvimento: string;
  cta: string;
  geradoEm: string;
}

// ─── RADAR ────────────────────────────────────────────────────────────────────

export type PrioridadeAlerta = 'alta' | 'media' | 'baixa';

export interface AlertaRadar {
  id: string;
  clienteId: string;
  titulo: string;
  descricao: string;
  sugestao: string;
  prioridade: PrioridadeAlerta;
  dataEvento?: string;
  diasRestantes?: number;
  tipo: 'data_comemorativa' | 'produto_sem_post' | 'sazonalidade' | 'tendencia';
  geradoEm: string;
}

// ─── BIBLIOTECA ───────────────────────────────────────────────────────────────

export type TipoConteudo = 'arte' | 'legenda' | 'roteiro' | 'calendario' | 'campanha' | 'ideia';

export interface ConteudoBiblioteca {
  id: string;
  clienteId: string;
  tipo: TipoConteudo;
  titulo: string;
  conteudo: string;
  fileUrl?: string;
  produtoId?: string;
  tags: string[];
  criadoEm: string;
}

// ─── ARTE ────────────────────────────────────────────────────────────────────

export type FormatoArte = 'feed_retrato' | 'feed_quadrado' | 'story' | 'banner';

export interface Arte {
  id: string;
  clienteId: string;
  produtoId?: string;
  formato: FormatoArte;
  objetivo: string;
  promptUsado: string;
  imageUrl: string;
  largura: number;
  altura: number;
  geradoEm: string;
}

// ─── STORE (Zustand) ──────────────────────────────────────────────────────────

export interface AppState {
  clienteAtivo: Cliente | null;
  setClienteAtivo: (cliente: Cliente | null) => void;
}
