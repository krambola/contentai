import OpenAI from 'openai';
import type {
  Cliente,
  Produto,
  AnaliseNegocio,
  ItemCalendario,
  Ideia,
  Roteiro,
  AlertaRadar,
  FormatoRoteiro,
  DuracaoRoteiro,
} from '@/types';

// ─── CLIENT ──────────────────────────────────────────────────────────────────

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function contextoCliente(cliente: Cliente, produtos: Produto[]): string {
  return `
CLIENTE: ${cliente.nome}
Segmento: ${cliente.segmento}
Cidade: ${cliente.cidade}
Público-alvo: ${cliente.publicoAlvo}
Diferenciais: ${cliente.diferenciais}
Tom de voz: ${cliente.tomDeVoz}
Objetivos: ${cliente.objetivos}
Instagram: ${cliente.instagram || 'não informado'}

PRODUTOS/SERVIÇOS CADASTRADOS:
${produtos
  .map(
    (p) => `- ${p.nome} (${p.categoria}): ${p.descricao}
  Benefícios: ${p.beneficios.join(', ')}
  Preço: ${p.precoTexto || (p.preco ? `R$ ${p.preco}` : 'não informado')}
  Palavras-chave: ${p.palavrasChave.join(', ')}`
  )
  .join('\n')}
`.trim();
}

async function chat(system: string, user: string, maxTokens = 1500): Promise<string> {
  const client = getClient();
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return res.choices[0]?.message?.content ?? '';
}

async function chatText(system: string, user: string, maxTokens = 500): Promise<string> {
  const client = getClient();
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return res.choices[0]?.message?.content ?? '';
}

function parseJson<T>(text: string): T {
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned) as T;
}

// ─── MÓDULO 3 — ANÁLISE SWOT ─────────────────────────────────────────────────

export async function gerarAnalise(
  cliente: Cliente,
  produtos: Produto[]
): Promise<Omit<AnaliseNegocio, 'id' | 'geradoEm'>> {
  const text = await chat(
    'Você é um estrategista de marketing digital especializado em negócios locais brasileiros. Responda APENAS com JSON válido.',
    `Com base nos dados abaixo, gere uma análise SWOT completa.

${contextoCliente(cliente, produtos)}

Retorne o JSON:
{
  "clienteId": "${cliente.id}",
  "pontosFortes": ["string"],
  "pontosFragos": ["string"],
  "oportunidades": ["string"],
  "ameacas": ["string"],
  "resumoGeral": "parágrafo resumindo posicionamento e próximos passos"
}`,
    1500
  );
  return parseJson(text);
}

// ─── MÓDULO 4 — CALENDÁRIO ───────────────────────────────────────────────────

export async function gerarCalendario(
  cliente: Cliente,
  produtos: Produto[],
  mes: number,
  ano: number
): Promise<Omit<ItemCalendario, 'id' | 'geradoEm'>[]> {
  const nomeMes = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long' });

  const text = await chat(
    'Você é um estrategista de conteúdo para redes sociais. Responda APENAS com JSON válido, sem texto fora do JSON.',
    `Crie um calendário de conteúdo completo para ${nomeMes}/${ano}.

${contextoCliente(cliente, produtos)}

Regras:
- 20 a 28 posts distribuídos ao longo do mês
- Varie os tipos: feed, reel, stories, carrossel, campanha
- Legendas em português com o tom de voz do cliente
- CTA claro em cada post

Retorne JSON no formato:
{ "itens": [
  {
    "clienteId": "${cliente.id}",
    "mes": ${mes},
    "ano": ${ano},
    "data": "YYYY-MM-DD",
    "tipo": "feed|reel|stories|carrossel|campanha",
    "objetivo": "objetivo curto",
    "legenda": "legenda completa com emojis e hashtags",
    "cta": "call to action"
  }
]}`,
    4000
  );
  const parsed = parseJson<{ itens: Omit<ItemCalendario, 'id' | 'geradoEm'>[] }>(text);
  return parsed.itens ?? [];
}

// ─── MÓDULO 5 — IDEIAS ───────────────────────────────────────────────────────

export async function gerarIdeias(
  cliente: Cliente,
  produto: Produto
): Promise<Omit<Ideia, 'id' | 'geradoEm'>[]> {
  const text = await chat(
    'Você é um criador de conteúdo especialista em redes sociais para negócios locais brasileiros. Responda APENAS com JSON válido.',
    `Gere ideias de conteúdo criativas para o produto abaixo.

CLIENTE: ${cliente.nome} — ${cliente.segmento}
Tom de voz: ${cliente.tomDeVoz}
Público: ${cliente.publicoAlvo}

PRODUTO: ${produto.nome}
Descrição: ${produto.descricao}
Benefícios: ${produto.beneficios.join(', ')}
Palavras-chave: ${produto.palavrasChave.join(', ')}

Gere exatamente:
- 10 ideias de Reels
- 10 ideias de Carrosséis
- 10 ideias de Stories
- 5 ideias de Campanhas
- 5 ideias de Promoções

Retorne JSON:
{ "ideias": [
  {
    "clienteId": "${cliente.id}",
    "produtoId": "${produto.id}",
    "formato": "reel|carrossel|stories|campanha|promocao",
    "titulo": "título curto",
    "descricao": "descrição detalhada com orientações de execução"
  }
]}`,
    3000
  );
  const parsed = parseJson<{ ideias: Omit<Ideia, 'id' | 'geradoEm'>[] }>(text);
  return parsed.ideias ?? [];
}

// ─── MÓDULO 6 — ROTEIRO ──────────────────────────────────────────────────────

export async function gerarRoteiro(
  cliente: Cliente,
  produto: Produto | null,
  formato: FormatoRoteiro,
  duracao: DuracaoRoteiro
): Promise<Omit<Roteiro, 'id' | 'geradoEm'>> {
  const infoProduto = produto
    ? `PRODUTO: ${produto.nome}\nDescrição: ${produto.descricao}\nBenefícios: ${produto.beneficios.join(', ')}`
    : 'Vídeo institucional do negócio';

  const text = await chat(
    'Você é um roteirista especializado em vídeos curtos para redes sociais brasileiras. Responda APENAS com JSON válido.',
    `Crie um roteiro de ${duracao} segundos para ${formato.toUpperCase()}.

CLIENTE: ${cliente.nome} — ${cliente.segmento}
Tom de voz: ${cliente.tomDeVoz}
${infoProduto}

Retorne JSON:
{
  "clienteId": "${cliente.id}",
  "produtoId": ${produto ? `"${produto.id}"` : 'null'},
  "formato": "${formato}",
  "duracao": ${duracao},
  "gancho": "frase de impacto para os primeiros 3-5 segundos com indicações de cena",
  "desenvolvimento": "conteúdo principal com indicações visuais detalhadas",
  "cta": "chamada para ação com indicação de como mostrar na tela"
}`,
    1500
  );
  return parseJson(text);
}

// ─── MÓDULO 9 — RADAR ────────────────────────────────────────────────────────

export async function gerarAlertas(
  cliente: Cliente,
  produtos: Produto[]
): Promise<Omit<AlertaRadar, 'id' | 'geradoEm'>[]> {
  const hoje = new Date().toISOString().split('T')[0];

  const text = await chat(
    'Você é um analista de marketing especializado em oportunidades sazonais e tendências. Responda APENAS com JSON válido.',
    `Data de hoje: ${hoje}

Analise o cliente e gere alertas de oportunidade para os próximos 60 dias.

${contextoCliente(cliente, produtos)}

Considere:
- Datas comemorativas brasileiras nos próximos 60 dias
- Produtos sem publicação recente
- Sazonalidades do segmento
- Tendências do nicho

Retorne JSON:
{ "alertas": [
  {
    "clienteId": "${cliente.id}",
    "titulo": "título curto",
    "descricao": "descrição da oportunidade",
    "sugestao": "ação concreta sugerida",
    "prioridade": "alta|media|baixa",
    "dataEvento": "YYYY-MM-DD",
    "diasRestantes": 30,
    "tipo": "data_comemorativa|produto_sem_post|sazonalidade|tendencia"
  }
]}`,
    2000
  );
  const parsed = parseJson<{ alertas: Omit<AlertaRadar, 'id' | 'geradoEm'>[] }>(text);
  return parsed.alertas ?? [];
}

// ─── MÓDULO 10 — PRÓXIMAS AÇÕES ──────────────────────────────────────────────

export async function gerarProximasAcoes(
  cliente: Cliente,
  produtos: Produto[]
): Promise<{ titulo: string; descricao: string; tipo: string; urgencia: string }[]> {
  const text = await chat(
    'Você é um consultor de marketing digital para pequenos negócios. Responda APENAS com JSON válido.',
    `Sugira as 6 próximas ações mais impactantes para aumentar resultados nas redes sociais.

${contextoCliente(cliente, produtos)}

Retorne JSON:
{ "acoes": [
  {
    "titulo": "ação curta e direta",
    "descricao": "por que fazer e como fazer em 1-2 frases",
    "tipo": "gravar_video|criar_promocao|impulsionar_post|criar_combo|coletar_depoimento|fazer_reels",
    "urgencia": "imediata|esta_semana|este_mes"
  }
]}`,
    1500
  );
  const parsed = parseJson<{ acoes: { titulo: string; descricao: string; tipo: string; urgencia: string }[] }>(text);
  return parsed.acoes ?? [];
}

// ─── LEGENDAS AVULSAS ────────────────────────────────────────────────────────

export async function gerarLegenda(
  cliente: Cliente,
  produto: Produto | null,
  objetivo: string,
  tipo: string
): Promise<string> {
  return chatText(
    'Você é um copywriter especialista em redes sociais brasileiras.',
    `Crie uma legenda para ${tipo} com objetivo: ${objetivo}.

Cliente: ${cliente.nome}
Tom de voz: ${cliente.tomDeVoz}
${produto ? `Produto: ${produto.nome} — ${produto.descricao}` : ''}

A legenda deve:
- Ter gancho na primeira linha
- Usar emojis com moderação
- Incluir CTA claro
- Terminar com 3-5 hashtags relevantes

Retorne APENAS a legenda, sem explicações.`,
    500
  );
}
